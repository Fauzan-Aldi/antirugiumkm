-- Run this SQL in Supabase SQL Editor.
-- It creates all tables needed by the Express API.

create extension if not exists pgcrypto;

create table if not exists users (
  id text primary key,
  email text not null unique,
  password_salt text not null,
  password_hash text not null,
  password_iterations integer not null,
  display_name text not null,
  store_name text not null,
  created_at timestamptz not null default now(),
  subscription_expires_at timestamptz not null,
  is_admin boolean not null default false
);

create table if not exists sessions (
  token text primary key,
  user_id text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_sessions_user_id on sessions(user_id);
create index if not exists idx_sessions_expires_at on sessions(expires_at);

create table if not exists menu_items (
  id text primary key,
  user_id text not null,
  name text not null,
  price numeric(12,2) not null default 0,
  image text,
  category text not null default 'Lainnya',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_menu_items_user_id on menu_items(user_id);

create table if not exists sales (
  id text primary key,
  user_id text not null,
  created_at timestamptz not null default now(),
  items jsonb not null default '[]'::jsonb,
  subtotal numeric(12,2) not null default 0,
  tax numeric(12,2) not null default 0,
  total numeric(12,2) not null default 0,
  payment_method text not null check (payment_method in ('tunai', 'transfer'))
);

create index if not exists idx_sales_user_id on sales(user_id);
create index if not exists idx_sales_created_at on sales(created_at desc);

