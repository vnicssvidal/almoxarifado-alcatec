-- consultas prontas pras telas de pedido, painel e saídas. rodar depois do 001_schema.sql
-- security_invoker faz a view respeitar as permissões de quem está logado

create view vw_solicitacoes with (security_invoker = true) as
select
  s.id,
  s.status,
  s.observacao,
  s.criada_em,
  s.separada_em,
  s.retirada_em,
  s.funcionario_id,
  u.nome as funcionario,
  coalesce(
    jsonb_agg(
      jsonb_build_object('codigo', m.codigo, 'nome', m.nome, 'unidade', m.unidade, 'quantidade', i.quantidade)
      order by m.nome
    ) filter (where i.id is not null),
    '[]'
  ) as itens
from solicitacoes s
join usuarios u on u.id = s.funcionario_id
left join itens_solicitacao i on i.solicitacao_id = s.id
left join materiais m on m.id = i.material_id
group by s.id, u.nome;

-- left join no almoxarife porque o funcionário não enxerga o cadastro dele
create view vw_saidas with (security_invoker = true) as
select
  mv.id,
  mv.data_hora,
  mv.quantidade,
  mv.saldo_apos,
  mv.solicitacao_id,
  m.codigo,
  m.nome as material,
  m.unidade,
  r.nome as responsavel,
  a.nome as registrado_por
from movimentacoes mv
join materiais m on m.id = mv.material_id
join usuarios r on r.id = mv.responsavel_id
left join usuarios a on a.id = mv.registrado_por
where mv.tipo = 'saida';

grant select on vw_solicitacoes, vw_saidas to authenticated;
