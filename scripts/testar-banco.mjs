// roda o banco em memória e testa os critérios C01 a C06
// npm run test:banco
import { PGlite } from '@electric-sql/pglite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const db = new PGlite();
const pasta = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'supabase');

// imita o pedaço do Supabase que o banco usa (auth.users e auth.uid)
await db.exec(`
  create role anon; create role authenticated;
  create schema auth;
  create table auth.users (id uuid primary key, email text, raw_user_meta_data jsonb);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.uid', true), '')::uuid $$;
  grant usage on schema public, auth to authenticated, anon;
  grant execute on function auth.uid() to authenticated, anon;
  alter default privileges in schema public grant all on tables to authenticated, anon;
`);
await db.exec(fs.readFileSync(path.join(pasta, 'migrations', '001_schema.sql'), 'utf8'));
await db.exec(fs.readFileSync(path.join(pasta, 'migrations', '002_telas.sql'), 'utf8'));

const func = '00000000-0000-0000-0000-000000000001';
const almox = '00000000-0000-0000-0000-000000000002';
const gestor = '00000000-0000-0000-0000-000000000003';
await db.exec(`
  insert into auth.users values
   ('${func}', 'funcionario@teste.com', '{}'),
   ('${almox}', 'almoxarife@teste.com', '{}'),
   ('${gestor}', 'gestor@teste.com', '{}');
`);
await db.exec(fs.readFileSync(path.join(pasta, 'seed.sql'), 'utf8'));

async function comoUsuario(id, sql) {
  await db.exec(`reset role; select set_config('request.jwt.uid', '${id}', false); set role authenticated;`);
  try {
    return await db.query(sql);
  } finally {
    await db.exec('reset role');
  }
}

let falhas = 0;
function confere(passou, texto) {
  console.log(passou ? 'ok  ' : 'ERRO', texto);
  if (!passou) falhas++;
}
async function deveBloquear(texto, consulta) {
  try {
    await consulta;
    confere(false, texto);
  } catch {
    confere(true, texto);
  }
}

// C01
const saldo = await comoUsuario(func, `select saldo from materiais where codigo = 'PEC-001'`);
confere(saldo.rows[0].saldo === 14, 'C01 funcionário vê o saldo');

// C02
const novo = await comoUsuario(func,
  `select criar_solicitacao('[{"material_id": 11, "quantidade": 2}, {"material_id": 1, "quantidade": 10}]') as id`);
const pedido = novo.rows[0].id;
confere(pedido > 0, 'C02 funcionário cria pedido');
await deveBloquear('pedido maior que o saldo é recusado',
  comoUsuario(func, `select criar_solicitacao('[{"material_id": 9, "quantidade": 1}]')`));

// C03
await deveBloquear('funcionário não marca como separado', comoUsuario(func, `select marcar_separado(${pedido})`));
await deveBloquear('não retira antes de separar', comoUsuario(almox, `select registrar_retirada(${pedido})`));
await comoUsuario(almox, `select marcar_separado(${pedido})`);
const status = await comoUsuario(almox, `select status from solicitacoes where id = ${pedido}`);
confere(status.rows[0].status === 'separado', 'C03 almoxarife marca como separado');

// C04 e C05
await comoUsuario(almox, `select registrar_retirada(${pedido})`);
const saidas = await comoUsuario(almox, `select responsavel_id, data_hora from movimentacoes`);
confere(saidas.rows.length === 2 && saidas.rows.every((s) => s.responsavel_id === func && s.data_hora),
  'C04 retirada registra quem, o quê, quanto e quando');
const depois = await comoUsuario(func, `select saldo from materiais where id in (1, 11) order by id`);
confere(depois.rows[0].saldo === 410 && depois.rows[1].saldo === 12, 'C05 saldo baixa depois da retirada');
await deveBloquear('não retira o mesmo pedido duas vezes', comoUsuario(almox, `select registrar_retirada(${pedido})`));

// C06
await deveBloquear('funcionário não muda saldo', comoUsuario(func, `update materiais set saldo = 999 where id = 1`));
await deveBloquear('almoxarife não muda saldo na mão', comoUsuario(almox, `update materiais set saldo = 999 where id = 1`));
const editou = await comoUsuario(func, `update materiais set nome = 'x' where id = 1 returning id`);
confere(editou.rows.length === 0, 'C06 funcionário não edita material');
await deveBloquear('gestor não cria pedido',
  comoUsuario(gestor, `select criar_solicitacao('[{"material_id": 1, "quantidade": 1}]')`));
await deveBloquear('gestor não separa pedido', comoUsuario(gestor, `select marcar_separado(${pedido})`));
await deveBloquear('ninguém grava saída direto na tabela', comoUsuario(almox,
  `insert into movimentacoes (material_id, tipo, quantidade, responsavel_id, registrado_por, saldo_apos)
   values (1, 'saida', 1, '${func}', '${almox}', 0)`));
const usuarios = await comoUsuario(func, `select count(*)::int as n from usuarios`);
confere(usuarios.rows[0].n === 1, 'C06 funcionário só vê o próprio cadastro');
const todas = await comoUsuario(gestor, `select count(*)::int as n from movimentacoes`);
confere(todas.rows[0].n === 2, 'C06 gestor vê todas as saídas');

// telas: cadastro de material, pedidos e saídas
await comoUsuario(almox, `insert into materiais (codigo, nome, categoria, unidade, saldo, estoque_minimo)
  values ('MAT-099', 'Material novo', 'Material', 'un', 5, 1)`);
const cadastrado = await comoUsuario(func, `select saldo from materiais where codigo = 'MAT-099'`);
confere(cadastrado.rows[0]?.saldo === 5, 'almoxarife cadastra material');
await deveBloquear('funcionário não cadastra material', comoUsuario(func,
  `insert into materiais (codigo, nome, categoria) values ('MAT-098', 'x', 'Material')`));
await deveBloquear('código de material repetido é recusado', comoUsuario(almox,
  `insert into materiais (codigo, nome, categoria) values ('MAT-099', 'x', 'Material')`));

await db.exec(`insert into auth.users values ('00000000-0000-0000-0000-000000000004', 'outro@teste.com', '{"nome": "Outro Funcionário"}')`);
const outro = '00000000-0000-0000-0000-000000000004';
await comoUsuario(outro, `select criar_solicitacao('[{"material_id": 2, "quantidade": 1}]')`);
const meus = await comoUsuario(func, `select id, funcionario, itens from vw_solicitacoes`);
confere(meus.rows.length === 1 && meus.rows[0].id === pedido && meus.rows[0].itens.length === 2,
  'tela de pedido: funcionário vê só os pedidos dele, com os itens');
const painel = await comoUsuario(almox, `select funcionario from vw_solicitacoes where status in ('solicitado', 'separado')`);
confere(painel.rows.length === 1 && painel.rows[0].funcionario === 'Outro Funcionário',
  'painel: almoxarife vê pedidos abertos de todos');
const minhasSaidas = await comoUsuario(func, `select responsavel, material from vw_saidas`);
confere(minhasSaidas.rows.length === 2 && minhasSaidas.rows.every((s) => s.responsavel === 'Funcionário Teste'),
  'saídas: funcionário vê as próprias retiradas');
const saidasOutro = await comoUsuario(outro, `select count(*)::int as n from vw_saidas`);
confere(saidasOutro.rows[0].n === 0, 'saídas: funcionário não vê retiradas dos outros');
const saidasAlmox = await comoUsuario(almox, `select registrado_por from vw_saidas`);
confere(saidasAlmox.rows.length === 2 && saidasAlmox.rows[0].registrado_por === 'Almoxarife Teste',
  'saídas: almoxarife vê quem registrou');

console.log(falhas ? `\n${falhas} teste(s) falharam` : '\ntudo certo');
process.exitCode = falhas ? 1 : 0;
