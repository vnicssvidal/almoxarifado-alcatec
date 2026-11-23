# Almoxarifado Alçatec

Sistema web pro almoxarifado da Alçatec Procópio. Projeto do PIE (Engenharia de Software, UNIFAN, 2026.2), feito por Vinícius Vidal Santana e Miguel Moreira Bispo Neto.

Telas:

- **Login** (todos)
- **Materiais**: consulta de saldo com busca. O almoxarife também cadastra material novo.
- **Fazer pedido** (funcionário): monta o pedido com os materiais disponíveis e acompanha a situação.
- **Pedidos** (almoxarife e gestor): pedidos aguardando separação e separados. O almoxarife marca como separado e registra a retirada, que dá baixa no saldo. O gestor só acompanha.
- **Saídas** (todos): histórico de retiradas com quem pegou, o quê, quanto e quando. O funcionário vê só as dele.

## Rodando

Precisa de Node 20+ e uma conta no Supabase.

1. Crie um projeto no Supabase.
2. No SQL Editor, rode `supabase/migrations/001_schema.sql`, depois `supabase/migrations/002_telas.sql` e depois o `insert` de materiais do `supabase/seed.sql`.
3. Em Authentication > Users, crie `funcionario@teste.com`, `almoxarife@teste.com` e `gestor@teste.com` (com Auto Confirm e uma senha qualquer). Depois rode os `update` do fim do `seed.sql`.
4. Copie `.env.example` para `.env.local` e preencha com a URL e a anon key do projeto (Project Settings > API).
5. `npm install` e `npm run dev`. Abre em http://localhost:3000.

## Testes

`npm run test:banco` testa o banco sem precisar do Supabase, seguindo os critérios C01 a C06.

## Obs

O Supabase gratuito pausa o projeto se ficar uns dias sem uso. Bom abrir antes de apresentar.
