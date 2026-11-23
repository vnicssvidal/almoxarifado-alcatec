-- banco do almoxarifado (MVP). rodar uma vez no SQL Editor do Supabase

create type perfil_usuario as enum ('funcionario', 'almoxarife', 'gestor');
create type status_solicitacao as enum ('solicitado', 'separado', 'retirado', 'cancelado');
create type tipo_movimentacao as enum ('entrada', 'saida');

create table usuarios (
  id         uuid primary key references auth.users (id) on delete cascade,
  nome       text not null,
  email      text,
  perfil     perfil_usuario not null default 'funcionario',
  criado_em  timestamptz not null default now()
);

create table materiais (
  id              bigint generated always as identity primary key,
  codigo          text not null unique,
  nome            text not null,
  categoria       text not null check (categoria in ('Material', 'Peça', 'Componente')),
  unidade         text not null default 'un',
  saldo           integer not null default 0 check (saldo >= 0),
  estoque_minimo  integer not null default 0 check (estoque_minimo >= 0),
  ativo           boolean not null default true,
  criado_em       timestamptz not null default now()
);

create table solicitacoes (
  id              bigint generated always as identity primary key,
  funcionario_id  uuid not null references usuarios (id),
  status          status_solicitacao not null default 'solicitado',
  observacao      text,
  criada_em       timestamptz not null default now(),
  separada_em     timestamptz,
  separada_por    uuid references usuarios (id),
  retirada_em     timestamptz,
  retirada_por    uuid references usuarios (id)
);

create table itens_solicitacao (
  id              bigint generated always as identity primary key,
  solicitacao_id  bigint not null references solicitacoes (id) on delete cascade,
  material_id     bigint not null references materiais (id),
  quantidade      integer not null check (quantidade > 0),
  unique (solicitacao_id, material_id)
);

-- histórico de saídas (quem pegou, o quê, quanto e quando)
create table movimentacoes (
  id              bigint generated always as identity primary key,
  material_id     bigint not null references materiais (id),
  tipo            tipo_movimentacao not null,
  quantidade      integer not null check (quantidade > 0),
  responsavel_id  uuid not null references usuarios (id),  -- quem pegou
  registrado_por  uuid not null references usuarios (id),  -- almoxarife
  solicitacao_id  bigint references solicitacoes (id),
  saldo_apos      integer not null,
  data_hora       timestamptz not null default now()
);

create index on solicitacoes (status, criada_em);
create index on solicitacoes (funcionario_id);
create index on movimentacoes (material_id, data_hora desc);

-- quando alguém cria conta, já entra na tabela usuarios como funcionário
create function criar_usuario_ao_cadastrar()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.usuarios (id, nome, email)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)), new.email);
  return new;
end $$;

create trigger ao_criar_conta
after insert on auth.users
for each row execute function criar_usuario_ao_cadastrar();

create function meu_perfil()
returns perfil_usuario language sql stable security definer set search_path = public as $$
  select perfil from public.usuarios where id = auth.uid()
$$;

-- permissões por perfil
alter table usuarios          enable row level security;
alter table materiais         enable row level security;
alter table solicitacoes      enable row level security;
alter table itens_solicitacao enable row level security;
alter table movimentacoes     enable row level security;

create policy usuarios_ler on usuarios for select to authenticated
  using (id = auth.uid() or meu_perfil() in ('almoxarife', 'gestor'));

-- todo mundo consulta material, só o almoxarife cadastra/edita
create policy materiais_ler on materiais for select to authenticated using (true);
create policy materiais_criar on materiais for insert to authenticated
  with check (meu_perfil() = 'almoxarife');
create policy materiais_editar on materiais for update to authenticated
  using (meu_perfil() = 'almoxarife') with check (meu_perfil() = 'almoxarife');

-- funcionário vê só os pedidos dele. criar e mudar status só pelas funções lá embaixo
create policy solicitacoes_ler on solicitacoes for select to authenticated
  using (funcionario_id = auth.uid() or meu_perfil() in ('almoxarife', 'gestor'));

create policy itens_ler on itens_solicitacao for select to authenticated
  using (exists (select 1 from solicitacoes s where s.id = solicitacao_id
                 and (s.funcionario_id = auth.uid() or meu_perfil() in ('almoxarife', 'gestor'))));

create policy movimentacoes_ler on movimentacoes for select to authenticated
  using (responsavel_id = auth.uid() or meu_perfil() in ('almoxarife', 'gestor'));

-- saldo não pode ser editado na mão, só muda na retirada
revoke update on materiais from authenticated, anon;
grant update (codigo, nome, categoria, unidade, estoque_minimo, ativo) on materiais to authenticated;

-- ex: criar_solicitacao('[{"material_id": 1, "quantidade": 2}]')
create function criar_solicitacao(itens jsonb, observacao text default null)
returns bigint language plpgsql security definer set search_path = public as $$
declare
  nova_id bigint;
  item jsonb;
  disponivel integer;
begin
  if meu_perfil() is distinct from 'funcionario' then
    raise exception 'Só o perfil funcionário cria solicitações';
  end if;
  if itens is null or jsonb_array_length(itens) = 0 then
    raise exception 'A solicitação precisa ter pelo menos um item';
  end if;

  insert into solicitacoes (funcionario_id, observacao)
  values (auth.uid(), observacao) returning id into nova_id;

  for item in select * from jsonb_array_elements(itens) loop
    select saldo into disponivel from materiais
     where id = (item ->> 'material_id')::bigint and ativo;
    if disponivel is null then
      raise exception 'Material % não encontrado', item ->> 'material_id';
    end if;
    if (item ->> 'quantidade')::integer > disponivel then
      raise exception 'Saldo insuficiente para o material % (disponível: %)',
        item ->> 'material_id', disponivel;
    end if;
    insert into itens_solicitacao (solicitacao_id, material_id, quantidade)
    values (nova_id, (item ->> 'material_id')::bigint, (item ->> 'quantidade')::integer);
  end loop;

  return nova_id;
end $$;

create function marcar_separado(p_solicitacao bigint)
returns void language plpgsql security definer set search_path = public as $$
begin
  if meu_perfil() is distinct from 'almoxarife' then
    raise exception 'Só o almoxarife separa pedidos';
  end if;
  update solicitacoes
     set status = 'separado', separada_em = now(), separada_por = auth.uid()
   where id = p_solicitacao and status = 'solicitado';
  if not found then
    raise exception 'Solicitação % não está aguardando separação', p_solicitacao;
  end if;
end $$;

-- baixa no saldo e registro da saída acontecem juntos, pra não ficar saldo errado
create function registrar_retirada(p_solicitacao bigint)
returns void language plpgsql security definer set search_path = public as $$
declare
  sol solicitacoes%rowtype;
  item record;
  novo_saldo integer;
begin
  if meu_perfil() is distinct from 'almoxarife' then
    raise exception 'Só o almoxarife registra retiradas';
  end if;

  select * into sol from solicitacoes where id = p_solicitacao for update;
  if not found or sol.status <> 'separado' then
    raise exception 'Solicitação % precisa estar separada para ser retirada', p_solicitacao;
  end if;

  for item in
    select material_id, quantidade from itens_solicitacao
     where solicitacao_id = p_solicitacao order by material_id
  loop
    update materiais set saldo = saldo - item.quantidade
     where id = item.material_id and saldo >= item.quantidade
     returning saldo into novo_saldo;
    if not found then
      raise exception 'Saldo insuficiente no material % no momento da retirada', item.material_id;
    end if;

    insert into movimentacoes
      (material_id, tipo, quantidade, responsavel_id, registrado_por, solicitacao_id, saldo_apos)
    values
      (item.material_id, 'saida', item.quantidade, sol.funcionario_id, auth.uid(), p_solicitacao, novo_saldo);
  end loop;

  update solicitacoes
     set status = 'retirado', retirada_em = now(), retirada_por = auth.uid()
   where id = p_solicitacao;
end $$;

revoke execute on function criar_solicitacao(jsonb, text), marcar_separado(bigint),
  registrar_retirada(bigint), meu_perfil() from public, anon;
grant execute on function criar_solicitacao(jsonb, text), marcar_separado(bigint),
  registrar_retirada(bigint), meu_perfil() to authenticated;
