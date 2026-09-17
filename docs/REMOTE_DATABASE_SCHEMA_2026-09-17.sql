-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.profiles (
  id uuid NOT NULL,
  username text NOT NULL,
  full_name text,
  avatar_url text,
  phone text,
  location text,
  bio text,
  rating numeric DEFAULT 0 CHECK (rating IS NULL OR rating >= 0::numeric AND rating <= 5::numeric),
  total_sales integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  email text,
  joined text DEFAULT to_char(now(), 'YYYY'::text),
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT profiles_pkey PRIMARY KEY (id),
  CONSTRAINT profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT categories_pkey PRIMARY KEY (id)
);
CREATE TABLE public.products (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid,
  title text NOT NULL,
  description text,
  price numeric CHECK (price IS NULL OR price >= 0::numeric),
  condition text,
  location text,
  status text DEFAULT 'available'::text CHECK (status = ANY (ARRAY['draft'::text, 'available'::text, 'reserved'::text, 'sold'::text, 'paused'::text])),
  views integer DEFAULT 0,
  created_at timestamp without time zone DEFAULT now(),
  belts smallint,
  vehicleType text,
  make text,
  model text,
  year integer CHECK (year IS NULL OR year >= 1900 AND year <= 2100),
  mileage numeric CHECK (mileage IS NULL OR mileage >= 0::numeric),
  transmission text,
  fuel text,
  drivetrain text,
  engineCc integer,
  seats integer,
  doors integer,
  wofExpiry date,
  regoExpiry date,
  sleeps integer,
  layout text,
  lengthM numeric,
  weightKg integer,
  freshWaterL integer,
  greyWaterL integer,
  batteryAh integer,
  solarW integer,
  toiletType text,
  selfContained boolean DEFAULT false,
  scExpiry date,
  region text,
  lat numeric,
  lng numeric,
  image text,
  images jsonb DEFAULT '[]'::jsonb,
  updated_at timestamp with time zone DEFAULT now(),
  CONSTRAINT products_pkey PRIMARY KEY (id),
  CONSTRAINT products_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT products_category_id_fkey FOREIGN KEY (category_id) REFERENCES public.categories(id)
);
CREATE TABLE public.product_images (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  image_url text NOT NULL,
  sort_order integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  CONSTRAINT product_images_pkey PRIMARY KEY (id),
  CONSTRAINT product_images_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.favorites (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id text NOT NULL,
  created_at timestamp without time zone DEFAULT now(),
  product_snapshot jsonb,
  CONSTRAINT favorites_pkey PRIMARY KEY (id),
  CONSTRAINT favorites_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.chats (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  product_id uuid,
  buyer_id uuid,
  seller_id uuid,
  last_message text,
  last_message_at timestamp without time zone,
  created_at timestamp without time zone DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  sold_at timestamp with time zone,
  CONSTRAINT chats_pkey PRIMARY KEY (id),
  CONSTRAINT chats_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT chats_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id),
  CONSTRAINT chats_seller_id_fkey FOREIGN KEY (seller_id) REFERENCES auth.users(id)
);
CREATE TABLE public.messages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid,
  sender_id uuid,
  content text NOT NULL DEFAULT ''::text,
  is_read boolean DEFAULT false,
  created_at timestamp without time zone DEFAULT now(),
  read_at timestamp with time zone,
  attachment_path text,
  attachment_name text,
  attachment_type text,
  attachment_size integer,
  CONSTRAINT messages_pkey PRIMARY KEY (id),
  CONSTRAINT messages_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT messages_sender_id_fkey FOREIGN KEY (sender_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reviewer_id uuid,
  reviewed_id uuid,
  product_id uuid,
  rating integer NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  created_at timestamp without time zone DEFAULT now(),
  chat_id uuid,
  reviewed_user_id uuid,
  CONSTRAINT reviews_pkey PRIMARY KEY (id),
  CONSTRAINT reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES auth.users(id),
  CONSTRAINT reviews_reviewed_id_fkey FOREIGN KEY (reviewed_id) REFERENCES auth.users(id),
  CONSTRAINT reviews_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id),
  CONSTRAINT reviews_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT reviews_reviewed_user_id_fkey FOREIGN KEY (reviewed_user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reporter_id uuid,
  product_id uuid,
  reason text NOT NULL,
  status text DEFAULT 'pending'::text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT reports_pkey PRIMARY KEY (id),
  CONSTRAINT reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id),
  CONSTRAINT reports_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id)
);
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid,
  type text NOT NULL,
  message text NOT NULL,
  is_read boolean DEFAULT false,
  link text,
  created_at timestamp without time zone DEFAULT now(),
  CONSTRAINT notifications_pkey PRIMARY KEY (id),
  CONSTRAINT notifications_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.user_reports (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  reported_user_id uuid,
  reporter_id uuid,
  reason text NOT NULL,
  details text,
  resolved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT user_reports_pkey PRIMARY KEY (id),
  CONSTRAINT user_reports_reported_user_id_fkey FOREIGN KEY (reported_user_id) REFERENCES auth.users(id),
  CONSTRAINT user_reports_reporter_id_fkey FOREIGN KEY (reporter_id) REFERENCES auth.users(id)
);
CREATE TABLE public.saved_searches (
  user_id uuid NOT NULL,
  searches jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(searches) = 'array'::text AND jsonb_array_length(searches) <= 8 AND octet_length(searches::text) <= 65536),
  CONSTRAINT saved_searches_pkey PRIMARY KEY (user_id),
  CONSTRAINT saved_searches_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);
CREATE TABLE public.offers (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  chat_id uuid NOT NULL,
  buyer_id uuid NOT NULL,
  amount numeric NOT NULL CHECK (amount > 0::numeric),
  status text NOT NULL DEFAULT 'pending'::text CHECK (status = ANY (ARRAY['pending'::text, 'accepted'::text, 'declined'::text])),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT offers_pkey PRIMARY KEY (id),
  CONSTRAINT offers_chat_id_fkey FOREIGN KEY (chat_id) REFERENCES public.chats(id),
  CONSTRAINT offers_buyer_id_fkey FOREIGN KEY (buyer_id) REFERENCES auth.users(id)
);