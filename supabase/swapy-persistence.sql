create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  username text,
  email text,
  location text,
  phone text,
  bio text,
  rating numeric default 0,
  total_sales integer default 0,
  joined text default to_char(now(), 'YYYY'),
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  title text not null,
  make text,
  model text,
  "vehicleType" text,
  category text,
  price numeric,
  mileage numeric,
  condition text,
  wof text,
  sleeps integer,
  belts integer,
  "selfContained" boolean default false,
  location text,
  region text,
  lat numeric,
  lng numeric,
  image text,
  images jsonb default '[]'::jsonb,
  description text,
  status text default 'available',
  seller jsonb,
  views integer default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  image_url text not null,
  created_at timestamptz default now()
);

create table if not exists public.favorites (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id text not null,
  product_snapshot jsonb,
  created_at timestamptz default now(),
  unique (user_id, product_id)
);

alter table public.profiles enable row level security;
alter table public.products enable row level security;
alter table public.product_images enable row level security;
alter table public.favorites enable row level security;

drop policy if exists "Profiles are readable" on public.profiles;
create policy "Profiles are readable"
on public.profiles for select
using (true);

drop policy if exists "Users can insert own profile" on public.profiles;
create policy "Users can insert own profile"
on public.profiles for insert
with check (auth.uid() = id);

drop policy if exists "Users can update own profile" on public.profiles;
create policy "Users can update own profile"
on public.profiles for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists "Products are readable" on public.products;
create policy "Products are readable"
on public.products for select
using (true);

drop policy if exists "Users can insert own products" on public.products;
create policy "Users can insert own products"
on public.products for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own products" on public.products;
create policy "Users can update own products"
on public.products for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own products" on public.products;
create policy "Users can delete own products"
on public.products for delete
using (auth.uid() = user_id);

drop policy if exists "Product images are readable" on public.product_images;
create policy "Product images are readable"
on public.product_images for select
using (true);

drop policy if exists "Users can insert images for own products" on public.product_images;
create policy "Users can insert images for own products"
on public.product_images for insert
with check (
  exists (
    select 1
    from public.products
    where products.id = product_images.product_id
      and products.user_id = auth.uid()
  )
);

drop policy if exists "Users can read own favorites" on public.favorites;
create policy "Users can read own favorites"
on public.favorites for select
using (auth.uid() = user_id);

drop policy if exists "Users can insert own favorites" on public.favorites;
create policy "Users can insert own favorites"
on public.favorites for insert
with check (auth.uid() = user_id);

drop policy if exists "Users can update own favorites" on public.favorites;
create policy "Users can update own favorites"
on public.favorites for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own favorites" on public.favorites;
create policy "Users can delete own favorites"
on public.favorites for delete
using (auth.uid() = user_id);
