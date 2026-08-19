-- Rutina diaria (/tools/exercise-routine)
-- Corre esto una sola vez en el SQL Editor de Supabase.

-- Una fila por sesión. El XP total, la racha y el nivel NO se guardan:
-- se derivan de esta bitácora en cada lectura, así nunca se desincronizan.
create table if not exists rutina_bitacora (
  id         uuid        primary key default gen_random_uuid(),
  fecha      date        not null,
  modo       text        not null check (modo in ('depa', 'parque')),
  esfuerzo   text        not null check (esfuerzo in ('minimo', 'normal', 'energia')),
  bloques    text[]      not null default '{}',
  minutos    integer     check (minutos is null or minutos between 1 and 600),
  xp         integer     not null default 0 check (xp >= 0),
  notas      text,
  created_at timestamptz not null default now()
);

create index if not exists rutina_bitacora_fecha_idx
  on rutina_bitacora (fecha desc);

-- Ajustes de una sola fila: la variante de flexión con la que vas hoy.
create table if not exists rutina_config (
  id                  integer     primary key default 1 check (id = 1),
  variante_flexiones  text        not null default 'rodillas'
    check (variante_flexiones in ('pared', 'inclinadas', 'rodillas', 'completas', 'declinadas')),
  created_at          timestamptz not null default now()
);

insert into rutina_config (id) values (1) on conflict (id) do nothing;

-- El acceso es solo vía service role key desde las rutas de API, nunca desde
-- el navegador, así que RLS queda prendido sin políticas públicas.
alter table rutina_bitacora enable row level security;
alter table rutina_config   enable row level security;
