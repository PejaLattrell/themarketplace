create table public.marketplace_listings (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 3 and 120),
  description text not null check (char_length(btrim(description)) between 20 and 5000),
  price numeric(12,2) not null check (price between 0 and 10000000),
  seller_email text not null check (char_length(seller_email) <= 254 and seller_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  category text not null check (category in ('Furniture','Electronics','Fashion','Home & Living','Books & Hobbies','Sports & Outdoors','Other')),
  image_path text not null,
  seller_name text not null default 'Community seller' check (char_length(btrim(seller_name)) between 2 and 60),
  location text not null default 'Local pickup' check (char_length(btrim(location)) between 2 and 100),
  condition text not null default 'Good' check (condition in ('New','Like new','Good','Well loved')),
  is_demo boolean not null default false,
  created_at timestamptz not null default now(),
  constraint marketplace_photo_path check (
    image_path ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|jpeg|png|webp)$'
    or (is_demo and image_path like 'https://images.unsplash.com/%')
  )
);
create index marketplace_listings_created_idx on public.marketplace_listings(created_at desc);
create index marketplace_listings_category_created_idx on public.marketplace_listings(category, created_at desc);
alter table public.marketplace_listings enable row level security;
revoke all on public.marketplace_listings from anon, authenticated;
grant select (id,title,description,price,category,image_path,seller_name,location,condition,is_demo,created_at)
  on public.marketplace_listings to anon, authenticated;
grant insert (title,description,price,seller_email,category,image_path,seller_name,location,condition)
  on public.marketplace_listings to anon, authenticated;
create policy "Visitors can browse marketplace listings" on public.marketplace_listings for select to anon, authenticated using (true);
create policy "Visitors can create marketplace listings" on public.marketplace_listings for insert to anon, authenticated with check (is_demo = false);

create table public.marketplace_messages (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.marketplace_listings(id) on delete cascade,
  buyer_name text not null check (char_length(btrim(buyer_name)) between 2 and 60),
  buyer_email text not null check (char_length(buyer_email) <= 254 and buyer_email ~ '^[^[:space:]@]+@[^[:space:]@]+[.][^[:space:]@]+$'),
  body text not null check (char_length(btrim(body)) between 10 and 2000),
  created_at timestamptz not null default now()
);
create index marketplace_messages_listing_idx on public.marketplace_messages(listing_id);
alter table public.marketplace_messages enable row level security;
revoke all on public.marketplace_messages from anon, authenticated;
grant insert (listing_id,buyer_name,buyer_email,body) on public.marketplace_messages to anon, authenticated;
create policy "Visitors can leave a private seller message" on public.marketplace_messages for insert to anon, authenticated with check (true);
comment on table public.marketplace_messages is 'Private buyer enquiries. Anonymous visitors may insert only; read via the Supabase dashboard with project access.';
comment on column public.marketplace_listings.seller_email is 'Private seller contact. Explicit column grants exclude this field from public reads.';

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('marketplace-images','marketplace-images',true,8388608,array['image/jpeg','image/png','image/webp']);
create policy "Visitors can upload marketplace photos" on storage.objects
for insert to anon, authenticated with check (
  bucket_id = 'marketplace-images'
  and name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}[.](jpg|jpeg|png|webp)$'
);

