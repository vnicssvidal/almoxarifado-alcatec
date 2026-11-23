-- materiais de teste (fictícios). rodar depois do 001_schema.sql

insert into materiais (codigo, nome, categoria, unidade, saldo, estoque_minimo) values
  ('MAT-001', 'Parafuso sextavado M8 x 30',        'Material',   'un',  420, 100),
  ('MAT-002', 'Porca sextavada M8',                'Material',   'un',  380, 100),
  ('MAT-003', 'Arruela lisa 8 mm',                 'Material',   'un',  510, 150),
  ('MAT-004', 'Abraçadeira de nylon 200 mm',       'Material',   'pct',  35,  10),
  ('MAT-005', 'Fita isolante 19 mm',               'Material',   'rl',   24,  10),
  ('MAT-006', 'Graxa lubrificante 500 g',          'Material',   'un',   12,   5),
  ('MAT-007', 'Luva de vaqueta',                   'Material',   'par',  40,  20),
  ('MAT-008', 'Disco de corte 7"',                 'Material',   'un',   18,  15),
  ('MAT-009', 'Eletrodo 6013 2,5 mm',              'Material',   'kg',    0,  10),  -- sem estoque
  ('MAT-010', 'Lixa d''água grão 220',             'Material',   'un',   60,  30),
  ('PEC-001', 'Rolamento 6205',                    'Peça',       'un',   14,   6),
  ('PEC-002', 'Correia em V A-42',                 'Peça',       'un',    3,   4),  -- abaixo do mínimo
  ('PEC-003', 'Retentor 35 x 52 x 7',              'Peça',       'un',   22,  10),
  ('PEC-004', 'Mangueira hidráulica 1/2" (metro)', 'Peça',       'm',    30,  10),
  ('PEC-005', 'Engrenagem Z20 módulo 2',           'Peça',       'un',    5,   2),
  ('PEC-006', 'Bucha de bronze 25 mm',             'Peça',       'un',   16,   8),
  ('PEC-007', 'Mola de compressão 40 mm',          'Peça',       'un',   28,  10),
  ('COM-001', 'Contator 220 V 25 A',               'Componente', 'un',    6,   3),
  ('COM-002', 'Disjuntor bipolar 32 A',            'Componente', 'un',    9,   4),
  ('COM-003', 'Relé térmico 10–16 A',              'Componente', 'un',    4,   2),
  ('COM-004', 'Sensor indutivo M18',               'Componente', 'un',    7,   3),
  ('COM-005', 'Botoeira de emergência',            'Componente', 'un',    5,   2),
  ('COM-006', 'Fonte 24 V 5 A',                    'Componente', 'un',    2,   2),
  ('COM-007', 'Cabo PP 3 x 2,5 mm (metro)',        'Componente', 'm',   150,  50);

-- usuários de teste: criar os 3 e-mails em Authentication > Users antes de rodar isso
update usuarios set nome = 'Funcionário Teste' where email = 'funcionario@teste.com';
update usuarios set nome = 'Almoxarife Teste', perfil = 'almoxarife' where email = 'almoxarife@teste.com';
update usuarios set nome = 'Gestor Teste',     perfil = 'gestor'     where email = 'gestor@teste.com';
