-- Un mismo nombre de usuario no puede pertenecer a más de una cuenta.
-- `lower` hace que "Alex" y "alex" se consideren el mismo nombre.
create unique index if not exists profiles_username_lower_unique_idx
  on public.profiles (lower(username));
