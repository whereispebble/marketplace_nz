-- =============================================================================
-- Swapy - Alinear la base de datos con lo que espera el front
-- =============================================================================
-- Ejecutar entero en el SQL editor de Supabase. Es idempotente: se puede volver
-- a lanzar sin romper nada.
--
-- Se ha escrito comparando el esquema real contra el codigo, no de memoria:
--   - las 35 columnas que escribe createPayload() en NewProduct.jsx
--   - las 34 por las que filtra filterVehicles() en services/vehicleFilters.js
--   - las tablas que consulta cada pantalla
--
-- SOBRE EL CAMELCASE
-- El front manda las columnas en camelCase (vehicleType, wofExpiry, lengthM...)
-- y PostgREST las traduce literalmente, asi que en Postgres hay que crearlas
-- entrecomilladas. Es incomodo en SQL (a partir de ahora hay que escribir
-- "vehicleType" con comillas siempre), pero la alternativa era renombrar 34
-- campos repartidos por todo el front. Si algun dia se prefiere snake_case, el
-- sitio por donde empezar es services/vehicleFilters.js.
--
-- DOS COLUMNAS QUE DESAPARECEN
-- products.category y products.wof se borran en el apartado 2.2. El front ya no
-- las escribe ni las lee: category duplicaba "vehicleType" y wof era texto libre
-- que no se puede filtrar, para lo que ya esta "wofExpiry".
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. profiles
-- -----------------------------------------------------------------------------
-- Faltaban dos columnas que la pantalla de perfil lee.

alter table public.profiles
  -- Ano de alta. Se muestra como "Joined 2026" en la ficha del vendedor.
  add column if not exists joined text default to_char(now(), 'YYYY'),
  add column if not exists updated_at timestamptz default now(),

  -- Estas ya deberian existir. Van con "if not exists" para que la vista
  -- publica del apartado 9 no falle si alguna se quedo por el camino.
  add column if not exists full_name text,
  add column if not exists location text,
  add column if not exists bio text,
  add column if not exists avatar_url text,
  add column if not exists phone text,
  add column if not exists rating numeric,
  add column if not exists total_sales integer default 0;

-- Rellenar el ano de alta de los perfiles que ya existan.
update public.profiles
set joined = to_char(coalesce(created_at, now()), 'YYYY')
where joined is null;


-- -----------------------------------------------------------------------------
-- 2. products
-- -----------------------------------------------------------------------------

-- 2.1 El front usa "vehicleType"; la tabla tenia vehicle_type. Se renombra para
--     no perder los datos que ya hubiera.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'vehicle_type'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'vehicleType'
  ) then
    alter table public.products rename column vehicle_type to "vehicleType";
  end if;
end $$;

alter table public.products
  add column if not exists "vehicleType" text,

  -- Estas ya deberian existir; van con "if not exists" para que el resto del
  -- fichero no se caiga si alguna falta.
  add column if not exists condition text,
  add column if not exists location text,
  add column if not exists status text default 'draft',

  -- Identificacion del vehiculo
  add column if not exists make text,
  add column if not exists model text,
  add column if not exists year integer,

  -- Mecanica
  add column if not exists mileage numeric,
  add column if not exists transmission text,
  add column if not exists fuel text,
  add column if not exists drivetrain text,
  add column if not exists "engineCc" integer,
  add column if not exists seats integer,
  add column if not exists doors integer,

  -- Papeles de Nueva Zelanda. Son fechas, no texto: asi se puede filtrar por
  -- "WOF valido" o "caduca en mas de 6 meses" sin interpretar cadenas.
  add column if not exists "wofExpiry" date,
  add column if not exists "regoExpiry" date,

  -- Camper
  add column if not exists sleeps integer,
  -- Cinturones homologados. El filtro "belts min" ordena por esta columna.
  add column if not exists belts integer,
  add column if not exists layout text,
  add column if not exists "lengthM" numeric,
  add column if not exists "weightKg" integer,
  add column if not exists "freshWaterL" integer,
  add column if not exists "greyWaterL" integer,
  add column if not exists "batteryAh" integer,
  add column if not exists "solarW" integer,
  add column if not exists "toiletType" text,
  add column if not exists "selfContained" boolean default false,
  add column if not exists "scExpiry" date,

  -- Ubicacion. lat y lng las rellena el geocodificador al elegir una sugerencia.
  add column if not exists region text,
  add column if not exists lat numeric,
  add column if not exists lng numeric,

  -- Fotos. image es la portada; images, la galeria completa.
  add column if not exists image text,
  add column if not exists images jsonb default '[]'::jsonb,

  add column if not exists updated_at timestamptz default now();

-- 2.2 Columnas que se retiran, porque el front ya no las usa.
--
--     category repetia el valor de "vehicleType": dos sitios donde guardar el
--     mismo dato son dos sitios donde puede quedar distinto. Antes de borrarla
--     se vuelca su contenido en "vehicleType", por si algun anuncio antiguo
--     solo tenia rellena esta.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'products' and column_name = 'category'
  ) then
    execute 'update public.products set "vehicleType" = category
             where "vehicleType" is null and category is not null';
  end if;
end $$;

alter table public.products drop column if exists category;

--     wof era texto libre del tipo "Valid until Sep 2026". La fecha util es
--     "wofExpiry", que es la que permite filtrar de verdad.
alter table public.products drop column if exists wof;

-- 2.3 El formulario permite guardar un borrador incompleto, asi que precio y
--     condicion no pueden ser obligatorios a nivel de columna. La exigencia se
--     traslada mas abajo, y solo para los anuncios publicados.
alter table public.products alter column price drop not null;
alter table public.products alter column condition drop not null;

-- 2.4 Todo anuncio tiene dueno. Sin esto, una fila sin user_id queda huerfana y
--     fuera del alcance de cualquier politica de seguridad.
delete from public.products where user_id is null;
alter table public.products alter column user_id set not null;


-- -----------------------------------------------------------------------------
-- 3. product_images
-- -----------------------------------------------------------------------------
-- La columna se llamaba "order", que ademas de no coincidir con el front es
-- palabra reservada en SQL y obliga a entrecomillarla en cada consulta.

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_images' and column_name = 'order'
  ) and not exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'product_images' and column_name = 'sort_order'
  ) then
    alter table public.product_images rename column "order" to sort_order;
  end if;
end $$;

alter table public.product_images
  add column if not exists sort_order integer not null default 0,
  add column if not exists created_at timestamptz default now();


-- -----------------------------------------------------------------------------
-- 4. favorites
-- -----------------------------------------------------------------------------
-- services/favorites.js guarda el id como texto y ademas una copia reducida del
-- anuncio, por dos motivos:
--   - en desarrollo los anuncios de ejemplo tienen ids numericos, no uuid;
--   - con la copia, un guardado sigue mostrandose aunque el vendedor borre el
--     anuncio, en vez de desaparecer de la lista sin explicacion.
--
-- El precio es perder la clave ajena contra products. Cuando el marketplace
-- funcione solo con datos reales conviene volver a uuid con su clave ajena.

alter table public.favorites drop constraint if exists favorites_product_id_fkey;
alter table public.favorites alter column product_id type text using product_id::text;
alter table public.favorites alter column product_id set not null;
alter table public.favorites alter column user_id set not null;

alter table public.favorites
  add column if not exists product_snapshot jsonb;

-- El front guarda con upsert sobre (user_id, product_id): necesita el unico.
create unique index if not exists favorites_user_product_idx
  on public.favorites (user_id, product_id);


-- -----------------------------------------------------------------------------
-- 5. user_reports
-- -----------------------------------------------------------------------------
-- La tabla reports que ya existe denuncia un ANUNCIO. El perfil denuncia a una
-- PERSONA, que es otra cosa, asi que va en su propia tabla en vez de forzar la
-- existente.

create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reported_user_id uuid references auth.users(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reason text not null,
  details text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);


-- -----------------------------------------------------------------------------
-- 6. Integridad
-- -----------------------------------------------------------------------------
-- Reglas que impone la base de datos, no el navegador: un cliente manipulado no
-- puede saltarselas.

alter table public.products drop constraint if exists products_status_check;
alter table public.products add constraint products_status_check
  check (status in ('draft', 'available', 'reserved', 'sold', 'paused'));

-- Un anuncio publicado tiene que estar completo. Uno en borrador, no.
alter table public.products drop constraint if exists products_published_complete_check;
alter table public.products add constraint products_published_complete_check
  check (
    status = 'draft'
    or (price is not null and price >= 0 and condition is not null and location is not null)
  );

alter table public.products drop constraint if exists products_price_check;
alter table public.products add constraint products_price_check
  check (price is null or price >= 0);

alter table public.products drop constraint if exists products_mileage_check;
alter table public.products add constraint products_mileage_check
  check (mileage is null or mileage >= 0);

alter table public.products drop constraint if exists products_year_check;
alter table public.products add constraint products_year_check
  check (year is null or year between 1900 and 2100);

-- Coordenadas dentro del rango valido: un signo cambiado no puede dejar un
-- anuncio en mitad del oceano.
alter table public.products drop constraint if exists products_coords_check;
alter table public.products add constraint products_coords_check
  check (
    (lat is null and lng is null)
    or (lat between -90 and 90 and lng between -180 and 180)
  );

alter table public.profiles drop constraint if exists profiles_rating_check;
alter table public.profiles add constraint profiles_rating_check
  check (rating is null or rating between 0 and 5);

alter table public.messages drop constraint if exists messages_content_check;
alter table public.messages add constraint messages_content_check
  check (length(btrim(content)) > 0);

-- Nadie se denuncia a si mismo.
alter table public.user_reports drop constraint if exists user_reports_not_self_check;
alter table public.user_reports add constraint user_reports_not_self_check
  check (reporter_id is null or reporter_id <> reported_user_id);

-- Una sola conversacion por comprador, vendedor y anuncio.
create unique index if not exists chats_unique_idx
  on public.chats (product_id, buyer_id, seller_id);


-- -----------------------------------------------------------------------------
-- 7. updated_at automatico
-- -----------------------------------------------------------------------------
-- Que la fecha la ponga el cliente es una mentira facil de contar.

create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 8. Perfil automatico al registrarse
-- -----------------------------------------------------------------------------
-- Antes lo insertaba el navegador despues del alta. Si el usuario cerraba la
-- pestana en ese hueco, quedaba una cuenta sin perfil. Ahora lo hace la base,
-- en la misma transaccion que crea el usuario.
--
-- username es NOT NULL, asi que hay tres respaldos encadenados: lo que mande el
-- formulario, la parte del correo anterior a la arroba, y por ultimo 'user'.

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(
      nullif(new.raw_user_meta_data->>'username', ''),
      nullif(split_part(coalesce(new.email, ''), '@', 1), ''),
      'user'
    )
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- -----------------------------------------------------------------------------
-- 9. Row Level Security
-- -----------------------------------------------------------------------------
-- Reglas: cada uno lee y escribe lo suyo, y de los demas solo se ven anuncios
-- publicados. Los datos de contacto no son publicos.

alter table public.profiles       enable row level security;
alter table public.products       enable row level security;
alter table public.product_images enable row level security;
alter table public.favorites      enable row level security;
alter table public.user_reports   enable row level security;
alter table public.reports        enable row level security;
alter table public.chats          enable row level security;
alter table public.messages       enable row level security;
alter table public.reviews        enable row level security;
alter table public.notifications  enable row level security;
alter table public.categories     enable row level security;

-- --- profiles ----------------------------------------------------------------
-- La tabla solo la lee su dueno: contiene email y telefono. Lo publico sale por
-- la vista de mas abajo.
drop policy if exists "Profiles are readable" on public.profiles;
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select using (auth.uid() = id);

drop policy if exists profiles_insert_own on public.profiles;
create policy profiles_insert_own on public.profiles
  for insert with check (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
  for update using (auth.uid() = id) with check (auth.uid() = id);

-- Vista publica del perfil: nombre, ubicacion, bio, foto y reputacion.
-- Ni email ni telefono: el contacto se hace por el chat de la aplicacion.
drop view if exists public.public_profiles;
create view public.public_profiles
with (security_invoker = off) as
select id, username, full_name, location, bio, avatar_url, rating, total_sales, joined, created_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- --- products ----------------------------------------------------------------
-- De otro usuario solo se ven anuncios publicados; el dueno ve los suyos en
-- cualquier estado, borradores incluidos.
drop policy if exists "Products are readable" on public.products;
drop policy if exists products_select_published_or_own on public.products;
create policy products_select_published_or_own on public.products
  for select using (
    status in ('available', 'reserved', 'sold') or auth.uid() = user_id
  );

drop policy if exists products_insert_own on public.products;
create policy products_insert_own on public.products
  for insert to authenticated with check (auth.uid() = user_id);

drop policy if exists products_update_own on public.products;
create policy products_update_own on public.products
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists products_delete_own on public.products;
create policy products_delete_own on public.products
  for delete to authenticated using (auth.uid() = user_id);

-- --- product_images ----------------------------------------------------------
-- Las fotos heredan la visibilidad de su anuncio.
drop policy if exists product_images_select_visible on public.product_images;
create policy product_images_select_visible on public.product_images
  for select using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and (p.status in ('available', 'reserved', 'sold') or p.user_id = auth.uid())
    )
  );

drop policy if exists product_images_write_own on public.product_images;
create policy product_images_write_own on public.product_images
  for all to authenticated
  using (
    exists (select 1 from public.products p
            where p.id = product_images.product_id and p.user_id = auth.uid())
  )
  with check (
    exists (select 1 from public.products p
            where p.id = product_images.product_id and p.user_id = auth.uid())
  );

-- --- favorites ---------------------------------------------------------------
drop policy if exists favorites_own on public.favorites;
create policy favorites_own on public.favorites
  for all to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- --- chats y messages --------------------------------------------------------
-- Una conversacion solo la ven sus dos participantes.
drop policy if exists chats_select_participant on public.chats;
create policy chats_select_participant on public.chats
  for select to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists chats_insert_buyer on public.chats;
create policy chats_insert_buyer on public.chats
  for insert to authenticated
  with check (auth.uid() = buyer_id and buyer_id <> seller_id);

drop policy if exists chats_update_participant on public.chats;
create policy chats_update_participant on public.chats
  for update to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id)
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists messages_select_participant on public.messages;
create policy messages_select_participant on public.messages
  for select to authenticated
  using (
    exists (select 1 from public.chats c
            where c.id = messages.chat_id
              and (c.buyer_id = auth.uid() or c.seller_id = auth.uid()))
  );

-- El remitente tiene que ser quien escribe: no se puede firmar como otro.
drop policy if exists messages_insert_participant on public.messages;
create policy messages_insert_participant on public.messages
  for insert to authenticated
  with check (
    sender_id = auth.uid()
    and exists (select 1 from public.chats c
                where c.id = messages.chat_id
                  and (c.buyer_id = auth.uid() or c.seller_id = auth.uid()))
  );

-- Marcar como leido: solo el destinatario.
drop policy if exists messages_update_recipient on public.messages;
create policy messages_update_recipient on public.messages
  for update to authenticated
  using (
    sender_id <> auth.uid()
    and exists (select 1 from public.chats c
                where c.id = messages.chat_id
                  and (c.buyer_id = auth.uid() or c.seller_id = auth.uid()))
  );

-- --- reviews -----------------------------------------------------------------
-- Publicas para que se vea la reputacion, pero cada uno solo escribe las suyas
-- y no puede valorarse a si mismo.
drop policy if exists reviews_select_all on public.reviews;
create policy reviews_select_all on public.reviews for select using (true);

drop policy if exists reviews_insert_own on public.reviews;
create policy reviews_insert_own on public.reviews
  for insert to authenticated
  with check (auth.uid() = reviewer_id and reviewer_id <> reviewed_id);

drop policy if exists reviews_update_own on public.reviews;
create policy reviews_update_own on public.reviews
  for update to authenticated
  using (auth.uid() = reviewer_id) with check (auth.uid() = reviewer_id);

drop policy if exists reviews_delete_own on public.reviews;
create policy reviews_delete_own on public.reviews
  for delete to authenticated using (auth.uid() = reviewer_id);

-- --- denuncias ---------------------------------------------------------------
-- Se crean estando identificado, y solo las lee quien las puso. La moderacion
-- se hace desde el panel de Supabase con la clave de servicio.
drop policy if exists user_reports_insert_own on public.user_reports;
create policy user_reports_insert_own on public.user_reports
  for insert to authenticated with check (auth.uid() = reporter_id);

drop policy if exists user_reports_select_own on public.user_reports;
create policy user_reports_select_own on public.user_reports
  for select to authenticated using (auth.uid() = reporter_id);

drop policy if exists reports_insert_own on public.reports;
create policy reports_insert_own on public.reports
  for insert to authenticated with check (auth.uid() = reporter_id);

drop policy if exists reports_select_own on public.reports;
create policy reports_select_own on public.reports
  for select to authenticated using (auth.uid() = reporter_id);

-- --- notifications -----------------------------------------------------------
-- Cada uno ve las suyas. Crearlas es cosa del servidor, no del navegador: por
-- eso no hay politica de insert.
drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select to authenticated using (auth.uid() = user_id);

drop policy if exists notifications_update_own on public.notifications;
create policy notifications_update_own on public.notifications
  for update to authenticated
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- --- categories --------------------------------------------------------------
-- Catalogo de solo lectura.
drop policy if exists categories_select_all on public.categories;
create policy categories_select_all on public.categories for select using (true);


-- -----------------------------------------------------------------------------
-- 10. Storage
-- -----------------------------------------------------------------------------
-- Cada usuario escribe solo en su carpeta. Sin esto, conociendo la ruta se
-- puede sobrescribir la foto de otro.

insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public) values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars are publicly readable" on storage.objects;
create policy "avatars are publicly readable" on storage.objects
  for select using (bucket_id = 'avatars');

drop policy if exists "users manage their own avatar" on storage.objects;
create policy "users manage their own avatar" on storage.objects
  for all to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "product images are publicly readable" on storage.objects;
create policy "product images are publicly readable" on storage.objects
  for select using (bucket_id = 'product-images');

-- Las fotos se guardan en <product_id>/..., asi que la carpeta debe
-- corresponder a un anuncio del propio usuario.
drop policy if exists "users manage images of their own listings" on storage.objects;
create policy "users manage images of their own listings" on storage.objects
  for all to authenticated
  using (
    bucket_id = 'product-images'
    and exists (select 1 from public.products p
                where p.id::text = (storage.foldername(name))[1] and p.user_id = auth.uid())
  )
  with check (
    bucket_id = 'product-images'
    and exists (select 1 from public.products p
                where p.id::text = (storage.foldername(name))[1] and p.user_id = auth.uid())
  );


-- -----------------------------------------------------------------------------
-- 11. Indices
-- -----------------------------------------------------------------------------

create index if not exists products_user_id_idx     on public.products (user_id);
create index if not exists products_status_idx      on public.products (status);
create index if not exists products_vehicletype_idx on public.products ("vehicleType");
create index if not exists products_created_idx     on public.products (created_at desc);
create index if not exists favorites_user_idx       on public.favorites (user_id);
create index if not exists messages_chat_idx        on public.messages (chat_id, created_at);
create index if not exists chats_buyer_idx          on public.chats (buyer_id);
create index if not exists chats_seller_idx         on public.chats (seller_id);
create index if not exists product_images_prod_idx  on public.product_images (product_id, sort_order);
create index if not exists reviews_reviewed_idx     on public.reviews (reviewed_id);
create index if not exists notifications_user_idx   on public.notifications (user_id, is_read);


-- =============================================================================
-- Comprobacion
-- =============================================================================
-- Descomentar y ejecutar para ver que no falta ninguna columna de las que el
-- formulario de publicacion envia.
--
-- select c.name as falta
-- from unnest(array[
--   'title','make','model','description','price','vehicleType','condition',
--   'transmission','year','mileage','wofExpiry','regoExpiry','fuel','drivetrain','engineCc',
--   'seats','doors','layout','lengthM','weightKg','freshWaterL','greyWaterL','batteryAh',
--   'solarW','toiletType','scExpiry','sleeps','belts','selfContained','location','region',
--   'lat','lng','status','image','images'
-- ]) as c(name)
-- where not exists (
--   select 1 from information_schema.columns
--   where table_schema = 'public' and table_name = 'products' and column_name = c.name
-- );
-- =============================================================================
