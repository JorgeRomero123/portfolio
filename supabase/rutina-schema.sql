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
  vueltas    integer     check (vueltas is null or vueltas between 1 and 100),  -- 1 vuelta = 1 km
  xp         integer     not null default 0 check (xp >= 0),
  notas      text,
  created_at timestamptz not null default now()
);

create index if not exists rutina_bitacora_fecha_idx
  on rutina_bitacora (fecha desc);

-- Por si ya habías corrido este archivo antes de que existieran las vueltas.
alter table rutina_bitacora add column if not exists vueltas integer;
do $$ begin
  alter table rutina_bitacora
    add constraint rutina_bitacora_vueltas_check
    check (vueltas is null or vueltas between 1 and 100);
exception when duplicate_object then null; end $$;

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
