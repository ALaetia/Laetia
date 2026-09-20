-- =====================================================================
-- LAETIA — banco de dados (Supabase / PostgreSQL)
-- Cole este arquivo inteiro em: Supabase > SQL Editor > New query > Run
-- =====================================================================
create extension if not exists pgcrypto;

-- ---------- Perfis (dados do cliente) ----------
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null default 'customer' check (role in ('customer','admin')),
  full_name text, phone text,
  cpf_enc text,            -- CPF criptografado (AES-256-GCM) no servidor
  cpf_last4 text,          -- só para exibição ("***.***.***-12")
  postal_code text, street text, number text, complement text, district text, city text, state text,
  consent_at timestamptz,  -- aceite LGPD
  created_at timestamptz default now(), updated_at timestamptz default now()
);

create or replace function handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
begin insert into profiles (id) values (new.id) on conflict do nothing; return new; end $$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users for each row execute function handle_new_user();

create or replace function is_admin() returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from profiles where id = auth.uid() and role = 'admin')
$$;

-- ---------- Catálogo ----------
create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null, slug text not null unique, description text,
  sort int default 0, active boolean default true, created_at timestamptz default now()
);

create table if not exists products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid references categories(id) on delete set null,
  name text not null, slug text not null unique,
  short_description text, description text,
  base_price numeric(10,2) not null default 0,
  images text[] not null default '{}',
  active boolean default true,
  featured boolean default false, featured_sort int default 0,
  stock int,                                  -- null = sem controle de estoque
  sku text,
  weight_g int default 200, height_cm int default 4, width_cm int default 12, length_cm int default 16,
  external_ids jsonb not null default '{}',   -- futuro: {"mercadolivre":"MLB123","shopee":"456"}
  created_at timestamptz default now()
);
create index if not exists products_cat on products(category_id);

-- Grupos de opções (Cor da pedra, Entremeio, Medalha, Crucifixo...) por produto
create table if not exists option_groups (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references products(id) on delete cascade,
  name text not null, required boolean default true, sort int default 0,
  text_enabled boolean default false,         -- ativa "com nome"
  text_label text default 'Com nome',
  text_price numeric(10,2) default 0,
  text_max int default 30,
  role text check (role in ('stone','spacer','medal','crucifix'))  -- parte do terço na montagem visual
);
create table if not exists option_values (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references option_groups(id) on delete cascade,
  label text not null, price_delta numeric(10,2) default 0,
  swatch text,                                -- cor em hexadecimal (opcional)
  shape text,                                 -- medalha: oval|round|heart · crucifixo: simple|flared|detail
  image_url text,                             -- imagem própria (PNG transparente) para medalha/crucifixo
  sort int default 0, active boolean default true
);

-- ---------- Pedidos ----------
create table if not exists orders (
  id uuid primary key default gen_random_uuid(),
  number bigint generated always as identity,
  user_id uuid references auth.users(id) on delete set null,
  channel text not null default 'site',       -- futuro: 'mercadolivre', 'shopee'
  external_id text,
  status text not null default 'pending' check (status in ('pending','paid','preparing','shipped','delivered','cancelled')),
  payment_status text not null default 'pending',
  subtotal numeric(10,2) not null, shipping_cost numeric(10,2) not null default 0, total numeric(10,2) not null,
  shipping_service text, shipping_service_id text,
  shipping jsonb not null,                    -- cópia dos dados de entrega no momento da compra
  mp_preference_id text, mp_init_point text, mp_payment_id text,
  tracking_code text, label_url text, me_order_id text,
  notes text,
  created_at timestamptz default now(), paid_at timestamptz
);
create index if not exists orders_user on orders(user_id);
create index if not exists orders_status on orders(status);
create unique index if not exists orders_external on orders(channel, external_id) where external_id is not null;

create table if not exists order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders(id) on delete cascade,
  product_id uuid references products(id) on delete set null,
  product_name text not null, image_url text,
  quantity int not null check (quantity > 0), unit_price numeric(10,2) not null,
  options jsonb not null default '[]',        -- [{group, value, delta}]
  custom_text text                            -- o nome escolhido ("com nome")
);

-- ---------- Chat e suporte ----------
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  kind text not null default 'chat' check (kind in ('chat','ticket')),
  subject text, order_id uuid references orders(id) on delete set null,
  status text not null default 'open' check (status in ('open','closed')),
  last_sender_role text, last_message_at timestamptz default now(), created_at timestamptz default now()
);
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  sender_id uuid not null references auth.users(id) on delete cascade,
  sender_role text not null check (sender_role in ('customer','admin')),
  body text not null check (char_length(body) between 1 and 4000),
  created_at timestamptz default now()
);
create index if not exists messages_conv on messages(conversation_id, created_at);

create or replace function touch_conversation() returns trigger language plpgsql security definer set search_path = public as $$
begin
  update conversations set last_message_at = new.created_at, last_sender_role = new.sender_role,
    status = case when status = 'closed' and new.sender_role = 'customer' then 'open' else status end
  where id = new.conversation_id;
  return new;
end $$;
drop trigger if exists messages_touch on messages;
create trigger messages_touch after insert on messages for each row execute function touch_conversation();

-- ---------- Configurações ----------
-- key 'public' = qualquer um lê; key 'private' = só admin (dados do remetente)
create table if not exists settings (key text primary key, value jsonb not null default '{}');

-- Baixa de estoque (chamada pelo webhook do Mercado Pago)
create or replace function decrement_stock(pid uuid, qty int) returns void language sql security definer set search_path = public as $$
  update products set stock = greatest(stock - qty, 0) where id = pid and stock is not null
$$;
revoke all on function decrement_stock(uuid, int) from public, anon, authenticated;

-- =====================================================================
-- SEGURANÇA (RLS): cada pessoa só enxerga o que é dela
-- =====================================================================
alter table profiles enable row level security;
alter table categories enable row level security;
alter table products enable row level security;
alter table option_groups enable row level security;
alter table option_values enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table settings enable row level security;

-- Perfis: o cliente lê e edita o próprio; nunca altera role nem cpf_enc por conta própria
create policy profiles_select on profiles for select using (id = auth.uid() or is_admin());
create policy profiles_update on profiles for update using (id = auth.uid()) with check (id = auth.uid());
revoke update on profiles from authenticated, anon;
grant update (full_name, phone, postal_code, street, number, complement, district, city, state, consent_at, updated_at) on profiles to authenticated;
revoke select on profiles from authenticated, anon;
grant select (id, role, full_name, phone, cpf_last4, postal_code, street, number, complement, district, city, state, consent_at) on profiles to authenticated;

-- Catálogo: público lê ativos; escrita só pelo servidor (service role) após checar admin
create policy categories_read on categories for select using (active or is_admin());
create policy products_read on products for select using (active or is_admin());
create policy groups_read on option_groups for select using (true);
create policy values_read on option_values for select using (true);

-- Pedidos: cliente lê os próprios; criação/edição só pelo servidor
create policy orders_read on orders for select using (user_id = auth.uid() or is_admin());
create policy items_read on order_items for select using (
  exists (select 1 from orders o where o.id = order_id and (o.user_id = auth.uid() or is_admin())));

-- Conversas e mensagens
create policy conv_read on conversations for select using (user_id = auth.uid() or is_admin());
create policy conv_insert on conversations for insert with check (user_id = auth.uid());
create policy conv_update on conversations for update using (is_admin());
create policy msg_read on messages for select using (
  exists (select 1 from conversations c where c.id = conversation_id and (c.user_id = auth.uid() or is_admin())));
create policy msg_insert on messages for insert with check (
  sender_id = auth.uid()
  and sender_role = case when is_admin() then 'admin' else 'customer' end
  and exists (select 1 from conversations c where c.id = conversation_id and (c.user_id = auth.uid() or is_admin())));

-- Configurações: só a chave 'public' é legível
create policy settings_read on settings for select using (key = 'public' or is_admin());

-- Realtime do chat (respeita RLS)
alter publication supabase_realtime add table messages;

-- Imagens dos produtos (leitura pública; upload só pelo servidor)
insert into storage.buckets (id, name, public) values ('products', 'products', true) on conflict do nothing;

-- =====================================================================
-- DADOS INICIAIS
-- =====================================================================
insert into categories (name, slug, sort) values ('Terços', 'tercos', 1) on conflict do nothing;
insert into settings (key, value) values ('public', '{}'), ('private', '{}') on conflict do nothing;

with p as (
  insert into products (category_id, name, slug, short_description, description, base_price, featured, featured_sort, sku)
  select id, 'Terço Nossa Senhora das Graças', 'terco-nossa-senhora-das-gracas',
    'Terço artesanal, montado à mão.', 'Terço artesanal com contas de 6 mm. Escolha a cor da pedra, o entremeio, a medalha e o crucifixo e veja a montagem ao lado.',
    89.90, true, 1, 'TERCO-001'
  from categories where slug = 'tercos'
  on conflict (slug) do nothing returning id
), g as (
  insert into option_groups (product_id, name, sort, text_enabled, text_label, text_price, text_max, role)
  select id, 'Cor da pedra', 1, true, 'Com nome', 10, 20, 'stone' from p returning id
), g2 as (
  insert into option_groups (product_id, name, sort, role) select id, 'Entremeio', 2, 'spacer' from p returning id
), g3 as (
  insert into option_groups (product_id, name, sort, role) select id, 'Medalha', 3, 'medal' from p returning id
), g4 as (
  insert into option_groups (product_id, name, sort, role) select id, 'Crucifixo', 4, 'crucifix' from p returning id
), v1 as (
  insert into option_values (group_id, label, swatch, sort)
  select g.id, x.l, x.c, x.s from g, (values ('Branca','#F1EFEA',1),('Azul claro','#A9C0D6',2),('Rosa','#E8C9C9',3),('Verde sálvia','#A9B8A4',4)) as x(l,c,s)
), v2 as (
  insert into option_values (group_id, label, price_delta, swatch, sort)
  select g2.id, x.l, x.d, x.c, x.s from g2, (values ('Prata',0,'#C9CDD2',1),('Dourado',5,'#C9A45C',2)) as x(l,d,c,s)
), v3 as (
  insert into option_values (group_id, label, price_delta, shape, sort)
  select g3.id, x.l, x.d, x.h, x.s from g3, (values ('Nossa Senhora das Graças',0,'oval',1),('São Bento',0,'round',2),('Sagrado Coração',0,'heart',3)) as x(l,d,h,s)
)
insert into option_values (group_id, label, price_delta, shape, sort)
select g4.id, x.l, x.d, x.h, x.s from g4, (values ('Simples',0,'simple',1),('Trabalhado',8,'detail',2)) as x(l,d,h,s);

-- =====================================================================
-- DEPOIS de criar sua conta no site, torne-se administrador rodando:
--   update profiles set role = 'admin' where id = (select id from auth.users where email = 'SEU@EMAIL.COM');
-- =====================================================================
