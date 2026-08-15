-- Tracker de quehaceres del depa (/tools/quehaceres)
-- Corre esto una sola vez en el SQL Editor de Supabase.

create table if not exists quehaceres (
  id              uuid primary key default gen_random_uuid(),
  nombre          text        not null,
  emoji           text        not null default '🧽',
  frecuencia_dias integer     not null check (frecuencia_dias between 1 and 365),
  ultima_vez      date,
  notas           text,
  orden           integer     not null default 0,
  activo          boolean     not null default true,
  created_at      timestamptz not null default now()
);

-- Bitácora: cada vez que marcas algo como hecho queda registrado aquí.
create table if not exists quehaceres_bitacora (
  id           uuid primary key default gen_random_uuid(),
  quehacer_id  uuid not null references quehaceres(id) on delete cascade,
  hecho_el     date not null,
  created_at   timestamptz not null default now()
);

create index if not exists quehaceres_bitacora_quehacer_idx
  on quehaceres_bitacora (quehacer_id, hecho_el desc);

-- El acceso es solo vía service role key desde las rutas de API, nunca desde
-- el navegador, así que RLS queda prendido sin políticas públicas.
alter table quehaceres            enable row level security;
alter table quehaceres_bitacora   enable row level security;

-- Quehaceres iniciales. ultima_vez en null = "toca hoy".
-- El "where not exists" hace que correr el script dos veces no duplique nada:
-- solo siembra si la tabla está vacía.
insert into quehaceres (nombre, emoji, frecuencia_dias, orden)
select * from (values
  ('Regar las plantas',            '🪴', 3,   1),
  ('Trapear',                      '🧹', 7,   2),
  ('Limpiar la cafetera',          '☕', 7,   3),
  ('Limpiar el baño',              '🚿', 7,   4),
  ('Limpiar el escritorio',        '🖥️', 7,   5),
  ('Limpiar la estufa',            '🔥', 14,  6),
  ('Lavar las sábanas',            '🛏️', 14,  7),
  ('Limpiar la laptop y teclado',  '💻', 30,  8),
  ('Lavar el bote de basura',      '🚮', 30,  9),
  ('Lavar mis tenis',              '👟', 30,  10),
  ('Lavar el refri',               '🧊', 30,  11),
  ('Descalcificar la cafetera',    '🫧', 60,  12),
  ('Quitar el sarro de la regadera','💧', 60,  13),
  ('Cambiar el cepillo de dientes','🪥', 90,  14),
  ('Voltear el colchón',           '🛌', 180, 15),
  ('Revisar el botiquín',          '💊', 180, 16)
) as semilla(nombre, emoji, frecuencia_dias, orden)
where not exists (select 1 from quehaceres);
