-- Gamificación del tracker de quehaceres (/tools/quehaceres).
-- Corre esto UNA vez en el SQL Editor de Supabase, después de
-- quehaceres-schema.sql. Todo es aditivo: lo que ya existe sigue funcionando.

-- ---------------------------------------------------------------- columnas

-- En qué parte del depa vive el quehacer. Los ids salen de lib/depa-mapa.ts.
alter table quehaceres add column if not exists zona text not null default 'pasillo';

-- Sobre qué mueble se para la burbuja: 'regadera', 'estufa', 'cafetera'…
-- Puede ir en null: entonces la burbuja se para en el centro del cuarto.
alter table quehaceres add column if not exists punto text;

-- Quién lo hizo. Null = se registró antes de que existieran los personajes.
alter table quehaceres_bitacora add column if not exists quien text;

create index if not exists quehaceres_zona_idx on quehaceres (zona);
create index if not exists quehaceres_bitacora_fecha_idx on quehaceres_bitacora (hecho_el desc);

-- ---------------------------------------------------------------- backfill

-- Acomoda los 16 quehaceres sembrados en su cuarto y su mueble.
-- El "where zona = 'pasillo'" evita pisar algo que ya hayas movido a mano.
update quehaceres as q
   set zona  = s.zona,
       punto = s.punto
  from (values
    ('Regar las plantas',             'sala',       'planta'),
    ('Trapear',                       'pasillo',    'piso'),
    ('Limpiar la cafetera',           'cocina',     'cafetera'),
    ('Descalcificar la cafetera',     'cocina',     'cafetera'),
    ('Limpiar la estufa',             'cocina',     'estufa'),
    ('Lavar el bote de basura',       'cocina',     'bote'),
    ('Lavar el refri',                'cocina',     'refri'),
    ('Limpiar el baño',               'bano',       'taza'),
    ('Quitar el sarro de la regadera','bano',       'regadera'),
    ('Cambiar el cepillo de dientes', 'bano',       'lavabo'),
    ('Revisar el botiquín',           'bano',       'botiquin'),
    ('Limpiar el escritorio',         'recamara2',  'escritorio'),
    ('Limpiar la laptop y teclado',   'recamara2',  'laptop'),
    ('Lavar las sábanas',             'recamara1',  'cama'),
    ('Voltear el colchón',            'recamara1',  'cama'),
    ('Lavar mis tenis',               'lavado',     'lavadora')
  ) as s(nombre, zona, punto)
 where q.nombre = s.nombre
   and q.zona = 'pasillo'
   and q.punto is null;
