-- Application users, onboarding preferences, stores, appliances, and safety constraints.
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.stores (
  id bigint generated always as identity primary key,
  slug text not null unique,
  kind text not null check (kind in ('supermarket', 'hypermarket', 'market_chain', 'shop')),
  website_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint stores_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.store_translations (
  store_id bigint not null references public.stores (id) on delete cascade,
  locale public.app_locale not null,
  name text not null,
  primary key (store_id, locale)
);

create table public.store_locations (
  id bigint generated always as identity primary key,
  store_id bigint not null references public.stores (id) on delete cascade,
  city text not null,
  address_ka text,
  address_en text,
  latitude numeric(9, 6),
  longitude numeric(9, 6),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint store_locations_latitude_check check (latitude is null or latitude between -90 and 90),
  constraint store_locations_longitude_check check (longitude is null or longitude between -180 and 180)
);

create table public.profiles (
  user_id uuid primary key references public.users (id) on delete cascade,
  display_name text,
  locale public.app_locale not null default 'ka',
  timezone text not null default 'Asia/Tbilisi',
  city text not null default 'Tbilisi',
  preferred_store_id bigint references public.stores (id) on delete set null,
  household_size smallint not null default 1,
  budget_period public.budget_period not null default 'weekly',
  budget_amount_gel numeric(10, 2),
  daily_calorie_target smallint,
  protein_target_g numeric(7, 2),
  carbohydrate_target_g numeric(7, 2),
  fat_target_g numeric(7, 2),
  fiber_target_g numeric(7, 2),
  meals_per_day smallint not null default 3,
  max_cook_minutes smallint,
  include_leftovers boolean not null default true,
  allow_batch_cooking boolean not null default true,
  week_starts_on smallint not null default 1,
  onboarding_completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_display_name_length check (display_name is null or char_length(display_name) between 1 and 80),
  constraint profiles_household_size_check check (household_size between 1 and 20),
  constraint profiles_budget_amount_check check (budget_amount_gel is null or budget_amount_gel > 0),
  constraint profiles_calorie_target_check check (daily_calorie_target is null or daily_calorie_target between 800 and 10000),
  constraint profiles_protein_target_check check (protein_target_g is null or protein_target_g between 0 and 1000),
  constraint profiles_carbohydrate_target_check check (carbohydrate_target_g is null or carbohydrate_target_g between 0 and 1500),
  constraint profiles_fat_target_check check (fat_target_g is null or fat_target_g between 0 and 1000),
  constraint profiles_fiber_target_check check (fiber_target_g is null or fiber_target_g between 0 and 250),
  constraint profiles_meals_per_day_check check (meals_per_day between 1 and 8),
  constraint profiles_max_cook_minutes_check check (max_cook_minutes is null or max_cook_minutes between 5 and 1440),
  constraint profiles_week_starts_on_check check (week_starts_on between 1 and 7)
);

create table public.appliances (
  id bigint generated always as identity primary key,
  slug text not null unique,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint appliances_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.appliance_translations (
  appliance_id bigint not null references public.appliances (id) on delete cascade,
  locale public.app_locale not null,
  name text not null,
  primary key (appliance_id, locale)
);

create table public.profile_appliances (
  user_id uuid not null references public.users (id) on delete cascade,
  appliance_id bigint not null references public.appliances (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, appliance_id)
);

create table public.allergens (
  id bigint generated always as identity primary key,
  slug text not null unique,
  is_active boolean not null default true,
  constraint allergens_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.allergen_translations (
  allergen_id bigint not null references public.allergens (id) on delete cascade,
  locale public.app_locale not null,
  name text not null,
  primary key (allergen_id, locale)
);

create table public.profile_allergens (
  user_id uuid not null references public.users (id) on delete cascade,
  allergen_id bigint not null references public.allergens (id) on delete restrict,
  severity text not null default 'avoid' check (severity in ('avoid', 'trace_sensitive')),
  created_at timestamptz not null default now(),
  primary key (user_id, allergen_id)
);

create table public.dietary_patterns (
  id bigint generated always as identity primary key,
  slug text not null unique,
  is_active boolean not null default true,
  constraint dietary_patterns_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.dietary_pattern_translations (
  dietary_pattern_id bigint not null references public.dietary_patterns (id) on delete cascade,
  locale public.app_locale not null,
  name text not null,
  primary key (dietary_pattern_id, locale)
);

create table public.profile_dietary_patterns (
  user_id uuid not null references public.users (id) on delete cascade,
  dietary_pattern_id bigint not null references public.dietary_patterns (id) on delete restrict,
  created_at timestamptz not null default now(),
  primary key (user_id, dietary_pattern_id)
);

create index store_locations_store_id_idx on public.store_locations (store_id);
create index profiles_preferred_store_id_idx on public.profiles (preferred_store_id);
create index profile_appliances_appliance_id_idx on public.profile_appliances (appliance_id);
create index profile_allergens_allergen_id_idx on public.profile_allergens (allergen_id);
create index profile_dietary_patterns_pattern_id_idx
  on public.profile_dietary_patterns (dietary_pattern_id);

create trigger users_set_updated_at
before update on public.users
for each row execute function private.set_updated_at();

create trigger stores_set_updated_at
before update on public.stores
for each row execute function private.set_updated_at();

create trigger store_locations_set_updated_at
before update on public.store_locations
for each row execute function private.set_updated_at();

create trigger profiles_set_updated_at
before update on public.profiles
for each row execute function private.set_updated_at();

create trigger appliances_set_updated_at
before update on public.appliances
for each row execute function private.set_updated_at();

create or replace function private.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  requested_locale public.app_locale;
begin
  requested_locale := case
    when new.raw_user_meta_data ->> 'locale' = 'en' then 'en'::public.app_locale
    else 'ka'::public.app_locale
  end;

  insert into public.users (id)
  values (new.id)
  on conflict (id) do nothing;

  insert into public.profiles (user_id, display_name, locale)
  values (
    new.id,
    nullif(left(trim(new.raw_user_meta_data ->> 'display_name'), 80), ''),
    requested_locale
  )
  on conflict (user_id) do nothing;

  return new;
end;
$$;

revoke execute on function private.handle_new_user() from public, anon, authenticated, service_role;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function private.handle_new_user();

-- Make the migration safe for projects that already contain Auth users.
insert into public.users (id, created_at)
select id, created_at
from auth.users
on conflict (id) do nothing;

insert into public.profiles (user_id, locale)
select id, 'ka'::public.app_locale
from auth.users
on conflict (user_id) do nothing;
