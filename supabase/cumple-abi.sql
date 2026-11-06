-- Ruleta del cumple de Abi (/cumple-Abi)
-- Corre esto una sola vez en el SQL Editor de Supabase.

-- Una fila por opción que ya salió. La llave primaria impide que dos invitados
-- que giran al mismo tiempo se lleven la misma opción.
create table if not exists cumple_abi_sorteo (
  opcion   text        primary key,
  salio_el timestamptz not null default now()
);

-- Para reiniciar la ruleta (por ejemplo, después de probarla antes de la fiesta):
--   delete from cumple_abi_sorteo;
