-- Enable UUID generation
create extension if not exists "uuid-ossp";

-- 1. Profiles Table
create table if not exists public.profiles (
  id uuid references auth.users on delete cascade primary key,
  updated_at timestamp with time zone,
  username text unique,
  full_name text,
  avatar_url text,
  role text default 'customer' check (role in ('customer', 'admin')),
  created_at timestamp with time zone default now()
);

-- Enable RLS on Profiles
alter table public.profiles enable row level security;

-- 2. Categories Table
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  image_url text,
  description text,
  created_at timestamp with time zone default now()
);

-- Enable RLS on Categories
alter table public.categories enable row level security;

-- 3. Products Table
create table if not exists public.products (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  price numeric not null check (price >= 0),
  sale_price numeric check (sale_price >= 0),
  sku text unique,
  stock_quantity integer default 0 check (stock_quantity >= 0),
  category_id uuid references public.categories(id) on delete set null,
  images text[] default '{}',
  rating numeric default 0 check (rating >= 0 and rating <= 5),
  reviews_count integer default 0 check (reviews_count >= 0),
  brand text,
  attributes jsonb default '{}',
  created_at timestamp with time zone default now()
);

-- Enable RLS on Products
alter table public.products enable row level security;

-- 4. Cart Items Table
create table if not exists public.cart_items (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer default 1 check (quantity > 0),
  created_at timestamp with time zone default now(),
  unique(user_id, product_id)
);

-- Enable RLS on Cart Items
alter table public.cart_items enable row level security;

-- 5. Wishlist Table
create table if not exists public.wishlist (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  created_at timestamp with time zone default now(),
  unique(user_id, product_id)
);

-- Enable RLS on Wishlist
alter table public.wishlist enable row level security;

-- 6. Addresses Table
create table if not exists public.addresses (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  title text default 'Home',
  full_name text not null,
  phone text not null,
  street_address text not null,
  city text not null,
  state text not null,
  postal_code text not null,
  country text default 'US',
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS on Addresses
alter table public.addresses enable row level security;

-- 7. Orders Table
create table if not exists public.orders (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  status text default 'Pending' check (status in ('Pending', 'Processing', 'Packed', 'Shipped', 'Out For Delivery', 'Delivered', 'Cancelled')),
  total_amount numeric not null check (total_amount >= 0),
  tax numeric default 0 check (tax >= 0),
  delivery_charge numeric default 0 check (delivery_charge >= 0),
  address_id uuid references public.addresses(id) on delete set null,
  payment_method text default 'mock',
  payment_status text default 'unpaid',
  payment_id text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Enable RLS on Orders
alter table public.orders enable row level security;

-- 8. Order Items Table
create table if not exists public.order_items (
  id uuid default gen_random_uuid() primary key,
  order_id uuid references public.orders(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  quantity integer default 1 check (quantity > 0),
  price numeric not null check (price >= 0),
  created_at timestamp with time zone default now()
);

-- Enable RLS on Order Items
alter table public.order_items enable row level security;

-- 9. Reviews Table
create table if not exists public.reviews (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  product_id uuid references public.products(id) on delete cascade not null,
  rating integer not null check (rating >= 1 and rating <= 5),
  comment text,
  created_at timestamp with time zone default now(),
  unique(user_id, product_id)
);

-- Enable RLS on Reviews
alter table public.reviews enable row level security;


-- ==========================================
-- INDEXES FOR PERFORMANCE
-- ==========================================
create index if not exists idx_products_category on public.products(category_id);
create index if not exists idx_products_brand on public.products(brand);
create index if not exists idx_products_price on public.products(price);
create index if not exists idx_cart_items_user on public.cart_items(user_id);
create index if not exists idx_wishlist_user on public.wishlist(user_id);
create index if not exists idx_addresses_user on public.addresses(user_id);
create index if not exists idx_orders_user on public.orders(user_id);
create index if not exists idx_order_items_order on public.order_items(order_id);
create index if not exists idx_reviews_product on public.reviews(product_id);


-- ==========================================
-- HELPER FUNCTIONS & TRIGGERS
-- ==========================================

-- Trigger to automatically create a profile after signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, full_name, avatar_url, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'avatar_url', ''),
    'customer'
  );
  return new;
end;
$$ language plpgsql security definer;

-- Recreate trigger if exists
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- Helper function to check if requesting user is admin
create or replace function public.is_admin()
returns boolean as $$
begin
  return exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
end;
$$ language plpgsql security definer;


-- Trigger function to update product average rating and review counts when a review is added, changed, or deleted
create or replace function public.handle_update_product_rating()
returns trigger as $$
declare
  v_product_id uuid;
  v_avg_rating numeric;
  v_count integer;
begin
  if (TG_OP = 'DELETE') then
    v_product_id := old.product_id;
  else
    v_product_id := new.product_id;
  end if;

  select coalesce(avg(rating), 0), count(*)
  into v_avg_rating, v_count
  from public.reviews
  where product_id = v_product_id;

  update public.products
  set rating = round(v_avg_rating, 2),
      reviews_count = v_count
  where id = v_product_id;

  return null;
end;
$$ language plpgsql security definer;

drop trigger if exists on_review_change on public.reviews;
create trigger on_review_change
  after insert or update or delete on public.reviews
  for each row execute procedure public.handle_update_product_rating();


-- ==========================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==========================================

-- Profiles
create policy "Public profiles are viewable by everyone" on public.profiles
  for select using (true);

create policy "Users can update their own profile" on public.profiles
  for update using (auth.uid() = id);

create policy "Admins can manage all profiles" on public.profiles
  for all using (public.is_admin());

-- Categories
create policy "Categories are viewable by everyone" on public.categories
  for select using (true);

create policy "Admins can manage categories" on public.categories
  for all using (public.is_admin());

-- Products
create policy "Products are viewable by everyone" on public.products
  for select using (true);

create policy "Admins can manage products" on public.products
  for all using (public.is_admin());

-- Cart Items
create policy "Users can view their own cart items" on public.cart_items
  for select using (auth.uid() = user_id);

create policy "Users can insert their own cart items" on public.cart_items
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own cart items" on public.cart_items
  for update using (auth.uid() = user_id);

create policy "Users can delete their own cart items" on public.cart_items
  for delete using (auth.uid() = user_id);

-- Wishlist
create policy "Users can view their own wishlist" on public.wishlist
  for select using (auth.uid() = user_id);

create policy "Users can insert their own wishlist" on public.wishlist
  for insert with check (auth.uid() = user_id);

create policy "Users can delete their own wishlist" on public.wishlist
  for delete using (auth.uid() = user_id);

-- Addresses
create policy "Users can view their own addresses" on public.addresses
  for select using (auth.uid() = user_id);

create policy "Users can insert their own addresses" on public.addresses
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own addresses" on public.addresses
  for update using (auth.uid() = user_id);

create policy "Users can delete their own addresses" on public.addresses
  for delete using (auth.uid() = user_id);

-- Orders
create policy "Users can view their own orders" on public.orders
  for select using (auth.uid() = user_id or public.is_admin());

create policy "Users can create their own orders" on public.orders
  for insert with check (auth.uid() = user_id);

create policy "Admins/Owners can update orders" on public.orders
  for update using (auth.uid() = user_id or public.is_admin());

-- Order Items
create policy "Users can view their own order items" on public.order_items
  for select using (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and (orders.user_id = auth.uid() or public.is_admin())
    )
  );

create policy "Users can create order items" on public.order_items
  for insert with check (
    exists (
      select 1 from public.orders
      where orders.id = order_items.order_id
      and orders.user_id = auth.uid()
    )
  );

-- Reviews
create policy "Reviews are viewable by everyone" on public.reviews
  for select using (true);

create policy "Authenticated users can insert reviews" on public.reviews
  for insert with check (auth.uid() = user_id);

create policy "Users can update their own reviews" on public.reviews
  for update using (auth.uid() = user_id);

create policy "Users can delete their own reviews" on public.reviews
  for delete using (auth.uid() = user_id or public.is_admin());
