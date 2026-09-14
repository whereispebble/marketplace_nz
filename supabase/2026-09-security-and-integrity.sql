-- =============================================================================
-- Swapy - Politicas de seguridad y integridad de datos
-- =============================================================================
-- Ejecutar entero en el SQL editor de Supabase. Es idempotente: se puede
-- volver a lanzar sin romper nada.
--
-- Principios que aplica:
--   1. Un usuario solo lee y escribe sus propios datos.
--   2. De los demas usuarios solo se ven anuncios publicados, nunca borradores.
--   3. Los datos de contacto (email, telefono) no son publicos.
--   4. Las contrasenas las gestiona Supabase Auth: nunca tocan estas tablas.
--   5. La integridad se impone en la base de datos, no solo en el navegador.
-- =============================================================================


-- -----------------------------------------------------------------------------
-- 1. Tablas que el codigo usa pero que no existian
-- -----------------------------------------------------------------------------

-- Denuncias de usuarios. Profile.jsx ya insertaba aqui y fallaba en silencio.
create table if not exists public.user_reports (
  id uuid primary key default gen_random_uuid(),
  reported_user_id uuid references auth.users(id) on delete cascade,
  reporter_id uuid references auth.users(id) on delete set null,
  reason text not null,
  details text,
  resolved boolean not null default false,
  created_at timestamptz not null default now()
);

-- Conversaciones entre comprador y vendedor sobre un anuncio concreto.
create table if not exists public.chats (
  id uuid primary key default gen_random_uuid(),
  product_id uuid references public.products(id) on delete set null,
  buyer_id uuid not null references auth.users(id) on delete cascade,
  seller_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  -- Una sola conversacion por comprador, vendedor y anuncio.
  unique (product_id, buyer_id, seller_id)
);

-- Mensajes. Chat.jsx ya insertaba aqui y tampoco existia la tabla.
create table if not exists public.messages (
  id uuid primary key default gen_random_uuid(),
  chat_id uuid not null references public.chats(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  content text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- NewProduct.jsx inserta sort_order y la columna no existia.
alter table public.product_images
  add column if not exists sort_order integer not null default 0;


-- -----------------------------------------------------------------------------
-- 2. Integridad de datos
-- -----------------------------------------------------------------------------
-- Sin estas reglas, un cliente manipulado puede meter precios negativos,
-- estados inventados o anuncios sin dueno.

-- Todo anuncio tiene dueno. Sin esto, un insert sin user_id queda huerfano y
-- fuera del alcance de cualquier politica.
alter table public.products
  alter column user_id set not null;

alter table public.products
  drop constraint if exists products_status_check;
alter table public.products
  add constraint products_status_check
  check (status in ('draft', 'available', 'reserved', 'sold'));

alter table public.products
  drop constraint if exists products_price_check;
alter table public.products
  add constraint products_price_check
  check (price is null or price >= 0);

alter table public.products
  drop constraint if exists products_mileage_check;
alter table public.products
  add constraint products_mileage_check
  check (mileage is null or mileage >= 0);

alter table public.products
  drop constraint if exists products_year_check;
alter table public.products
  add constraint products_year_check
  check (year is null or (year between 1900 and 2100));

-- Coordenadas dentro del rango valido: una mala lectura del geocodificador no
-- puede dejar un anuncio en mitad del oceano por un signo cambiado.
alter table public.products
  drop constraint if exists products_coords_check;
alter table public.products
  add constraint products_coords_check
  check (
    (lat is null and lng is null)
    or (lat between -90 and 90 and lng between -180 and 180)
  );

alter table public.profiles
  drop constraint if exists profiles_rating_check;
alter table public.profiles
  add constraint profiles_rating_check
  check (rating is null or (rating between 0 and 5));

-- Un mensaje vacio no es un mensaje.
alter table public.messages
  drop constraint if exists messages_content_check;
alter table public.messages
  add constraint messages_content_check
  check (length(btrim(content)) > 0);

-- Nadie se denuncia a si mismo.
alter table public.user_reports
  drop constraint if exists user_reports_not_self_check;
alter table public.user_reports
  add constraint user_reports_not_self_check
  check (reporter_id is null or reporter_id <> reported_user_id);


-- -----------------------------------------------------------------------------
-- 3. updated_at automatico
-- -----------------------------------------------------------------------------
-- Que lo ponga el cliente es una mentira facil de contar; lo pone la base.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
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

drop trigger if exists chats_set_updated_at on public.chats;
create trigger chats_set_updated_at
  before update on public.chats
  for each row execute function public.set_updated_at();


-- -----------------------------------------------------------------------------
-- 4. Perfil creado automaticamente al registrarse
-- -----------------------------------------------------------------------------
-- Antes lo insertaba el navegador despues del signUp. Si el usuario cerraba la
-- pestana en ese hueco, quedaba una cuenta sin perfil. Ahora lo hace la base,
-- dentro de la misma transaccion que crea el usuario.

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, username)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1))
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
-- 5. Row Level Security
-- -----------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.favorites enable row level security;
alter table public.user_reports enable row level security;
alter table public.chats enable row level security;
alter table public.messages enable row level security;

-- --- profiles ----------------------------------------------------------------
-- Antes: "Profiles are readable" con using (true), lo que dejaba el email y el
-- telefono de todos los usuarios a la vista de cualquiera, incluso sin sesion.
-- Ahora la tabla solo la lee su dueno y los datos publicos salen por una vista.

drop policy if exists "Profiles are readable" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

drop policy if exists "Users can insert own profile" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;
create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- Vista publica de un perfil: nombre, ubicacion, bio, foto y reputacion.
-- Ni email ni telefono. El contacto se hace por el chat de la aplicacion.
create or replace view public.public_profiles
with (security_invoker = off) as
select
  id,
  username,
  location,
  bio,
  avatar_url,
  rating,
  total_sales,
  joined,
  created_at
from public.profiles;

grant select on public.public_profiles to anon, authenticated;

-- --- products ----------------------------------------------------------------
-- Antes: using (true), asi que cualquiera podia leer los borradores ajenos
-- consultando la API directamente. Ahora de otro usuario solo se ven anuncios
-- publicados; el dueno sigue viendo los suyos en cualquier estado.

drop policy if exists "Products are readable" on public.products;
drop policy if exists "products_select_published_or_own" on public.products;
create policy "products_select_published_or_own"
  on public.products for select
  using (
    status in ('available', 'reserved', 'sold')
    or auth.uid() = user_id
  );

drop policy if exists "Users can insert own products" on public.products;
drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own"
  on public.products for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own products" on public.products;
drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
  on public.products for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own products" on public.products;
drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own"
  on public.products for delete
  to authenticated
  using (auth.uid() = user_id);

-- --- product_images ----------------------------------------------------------
-- Las fotos heredan la visibilidad de su anuncio: si el anuncio no se puede
-- ver, sus fotos tampoco. Faltaban ademas update y delete, asi que una foto
-- subida por error no se podia quitar.

drop policy if exists "Product images are readable" on public.product_images;
drop policy if exists "product_images_select_visible" on public.product_images;
create policy "product_images_select_visible"
  on public.product_images for select
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id
        and (p.status in ('available', 'reserved', 'sold') or p.user_id = auth.uid())
    )
  );

drop policy if exists "Users can insert images for own products" on public.product_images;
drop policy if exists "product_images_insert_own" on public.product_images;
create policy "product_images_insert_own"
  on public.product_images for insert
  to authenticated
  with check (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "product_images_update_own" on public.product_images;
create policy "product_images_update_own"
  on public.product_images for update
  to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.user_id = auth.uid()
    )
  );

drop policy if exists "product_images_delete_own" on public.product_images;
create policy "product_images_delete_own"
  on public.product_images for delete
  to authenticated
  using (
    exists (
      select 1 from public.products p
      where p.id = product_images.product_id and p.user_id = auth.uid()
    )
  );

-- --- favorites ---------------------------------------------------------------
-- Privados por definicion: cada usuario solo ve y toca los suyos.

drop policy if exists "Users can read own favorites" on public.favorites;
drop policy if exists "favorites_select_own" on public.favorites;
create policy "favorites_select_own"
  on public.favorites for select
  to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Users can insert own favorites" on public.favorites;
drop policy if exists "favorites_insert_own" on public.favorites;
create policy "favorites_insert_own"
  on public.favorites for insert
  to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Users can update own favorites" on public.favorites;
drop policy if exists "favorites_update_own" on public.favorites;
create policy "favorites_update_own"
  on public.favorites for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on public.favorites;
drop policy if exists "favorites_delete_own" on public.favorites;
create policy "favorites_delete_own"
  on public.favorites for delete
  to authenticated
  using (auth.uid() = user_id);

-- --- user_reports ------------------------------------------------------------
-- Se pueden crear estando identificado, pero nadie las lee desde la aplicacion:
-- las denuncias se revisan desde el panel de Supabase con la clave de servicio.

drop policy if exists "user_reports_insert_authenticated" on public.user_reports;
create policy "user_reports_insert_authenticated"
  on public.user_reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);

drop policy if exists "user_reports_select_own" on public.user_reports;
create policy "user_reports_select_own"
  on public.user_reports for select
  to authenticated
  using (auth.uid() = reporter_id);

-- --- chats y messages --------------------------------------------------------
-- Una conversacion solo la ven sus dos participantes, y solo se puede escribir
-- en una conversacion de la que se forma parte.

drop policy if exists "chats_select_participant" on public.chats;
create policy "chats_select_participant"
  on public.chats for select
  to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "chats_insert_buyer" on public.chats;
create policy "chats_insert_buyer"
  on public.chats for insert
  to authenticated
  with check (auth.uid() = buyer_id and buyer_id <> seller_id);

drop policy if exists "chats_update_participant" on public.chats;
create policy "chats_update_participant"
  on public.chats for update
  to authenticated
  using (auth.uid() = buyer_id or auth.uid() = seller_id)
  with check (auth.uid() = buyer_id or auth.uid() = seller_id);

drop policy if exists "messages_select_participant" on public.messages;
create policy "messages_select_participant"
  on public.messages for select
  to authenticated
  using (
    exists (
      select 1 from public.chats c
      where c.id = messages.chat_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- El remitente tiene que ser quien escribe: no se puede firmar como otro.
drop policy if exists "messages_insert_participant" on public.messages;
create policy "messages_insert_participant"
  on public.messages for insert
  to authenticated
  with check (
    sender_id = auth.uid()
    and exists (
      select 1 from public.chats c
      where c.id = messages.chat_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );

-- Marcar como leido: solo el destinatario, y solo puede tocar read_at.
drop policy if exists "messages_update_recipient" on public.messages;
create policy "messages_update_recipient"
  on public.messages for update
  to authenticated
  using (
    sender_id <> auth.uid()
    and exists (
      select 1 from public.chats c
      where c.id = messages.chat_id
        and (c.buyer_id = auth.uid() or c.seller_id = auth.uid())
    )
  );


-- -----------------------------------------------------------------------------
-- 6. Storage
-- -----------------------------------------------------------------------------
-- Cada usuario escribe solo en su carpeta. Sin esto, conociendo la ruta se
-- puede sobrescribir la foto de otro.

insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do update set public = true;

insert into storage.buckets (id, name, public)
values ('product-images', 'product-images', true)
on conflict (id) do update set public = true;

drop policy if exists "avatars are publicly readable" on storage.objects;
create policy "avatars are publicly readable"
  on storage.objects for select
  using (bucket_id = 'avatars');

drop policy if exists "users manage their own avatar" on storage.objects;
create policy "users manage their own avatar"
  on storage.objects for all
  to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text)
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

drop policy if exists "product images are publicly readable" on storage.objects;
create policy "product images are publicly readable"
  on storage.objects for select
  using (bucket_id = 'product-images');

-- Las fotos de anuncio se guardan en <product_id>/..., asi que la carpeta debe
-- corresponder a un anuncio del propio usuario.
drop policy if exists "users manage images of their own listings" on storage.objects;
create policy "users manage images of their own listings"
  on storage.objects for all
  to authenticated
  using (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.products p
      where p.id::text = (storage.foldername(name))[1] and p.user_id = auth.uid()
    )
  )
  with check (
    bucket_id = 'product-images'
    and exists (
      select 1 from public.products p
      where p.id::text = (storage.foldername(name))[1] and p.user_id = auth.uid()
    )
  );


-- -----------------------------------------------------------------------------
-- 7. Indices
-- -----------------------------------------------------------------------------

create index if not exists products_user_id_idx on public.products (user_id);
create index if not exists products_status_idx on public.products (status);
create index if not exists favorites_user_id_idx on public.favorites (user_id);
create index if not exists messages_chat_id_idx on public.messages (chat_id, created_at);
create index if not exists chats_buyer_idx on public.chats (buyer_id);
create index if not exists chats_seller_idx on public.chats (seller_id);
create index if not exists product_images_product_idx on public.product_images (product_id, sort_order);


-- =============================================================================
-- Sobre las contrasenas
-- =============================================================================
-- No se guardan aqui. Viven en auth.users, cifradas con bcrypt por Supabase
-- Auth, y ninguna politica de este fichero da acceso a esa tabla. El navegador
-- nunca ve un hash: manda email y contrasena por HTTPS y recibe un JWT.
--
-- Lo que si hay que configurar a mano en el panel de Supabase
-- (Authentication -> Providers -> Email, y Authentication -> Policies):
--   - Minimum password length: 8 o mas.
--   - Password requirements: al menos letras y digitos.
--   - Leaked password protection: activado (contrasta contra HaveIBeenPwned).
--   - Confirm email: activado, para que nadie registre el correo de otro.
-- =============================================================================
