-- Columnas nuevas para los filtros avanzados (mecanica, papeles NZ y camper).
-- Se puede ejecutar tantas veces como haga falta: todas son "if not exists".

alter table public.products
  -- year se usaba ya desde el formulario pero nunca existio como columna.
  add column if not exists year integer,

  -- Mecanica
  add column if not exists fuel text,
  add column if not exists drivetrain text,
  add column if not exists "engineCc" integer,
  add column if not exists "powerKw" integer,
  add column if not exists seats integer,
  add column if not exists doors integer,

  -- Papeles NZ. El texto libre wof se mantiene para mostrarlo en la ficha.
  add column if not exists "wofExpiry" date,
  add column if not exists "regoExpiry" date,

  -- Camper
  add column if not exists layout text,
  add column if not exists "lengthM" numeric,
  add column if not exists "weightKg" integer,
  add column if not exists "licenceClass" text,
  add column if not exists "freshWaterL" integer,
  add column if not exists "greyWaterL" integer,
  add column if not exists "batteryAh" integer,
  add column if not exists "solarW" integer,
  add column if not exists "toiletType" text,

  -- Certificacion self-contained. Desde el 6 de junio de 2026 solo la tarjeta
  -- verde sirve para freedom camping; selfContained (booleano) se queda por
  -- compatibilidad con los anuncios antiguos.
  add column if not exists "scCertification" text,
  add column if not exists "scExpiry" date;

-- Indices para los filtros que mas se van a usar.
create index if not exists products_fuel_idx on public.products (fuel);
create index if not exists products_drivetrain_idx on public.products (drivetrain);
create index if not exists products_layout_idx on public.products (layout);
create index if not exists products_sc_certification_idx on public.products ("scCertification");
create index if not exists products_year_idx on public.products (year);
