-- Localized ingredient and recipe catalog plus per-user food preferences and pantry.
create table public.aisles (
  id bigint generated always as identity primary key,
  slug text not null unique,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  constraint aisles_slug_format check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$')
);

create table public.aisle_translations (
  aisle_id bigint not null references public.aisles (id) on delete cascade,
  locale public.app_locale not null,
  name text not null,
  primary key (aisle_id, locale)
);

create table public.ingredients (
  id bigint generated always as identity primary key,
  canonical_code text not null unique,
  default_aisle_id bigint references public.aisles (id) on delete set null,
  base_unit public.measurement_unit not null default 'g',
  grams_per_base_unit numeric(12, 4),
  density_g_per_ml numeric(12, 6),
  edible_portion_ratio numeric(7, 6) not null default 1,
  calories_per_100g numeric(10, 3) not null default 0,
  protein_g_per_100g numeric(10, 3) not null default 0,
  carbohydrate_g_per_100g numeric(10, 3) not null default 0,
  fat_g_per_100g numeric(10, 3) not null default 0,
  fiber_g_per_100g numeric(10, 3) not null default 0,
  sodium_mg_per_100g numeric(12, 3) not null default 0,
  nutrition_source text,
  nutrition_verified_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ingredients_code_format check (canonical_code ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  constraint ingredients_base_unit_check check (base_unit in ('g', 'ml', 'piece')),
  constraint ingredients_grams_per_unit_check check (grams_per_base_unit is null or grams_per_base_unit > 0),
  constraint ingredients_density_check check (density_g_per_ml is null or density_g_per_ml > 0),
  constraint ingredients_edible_portion_check check (edible_portion_ratio > 0 and edible_portion_ratio <= 1),
  constraint ingredients_nutrition_nonnegative check (
    calories_per_100g >= 0
    and protein_g_per_100g >= 0
    and carbohydrate_g_per_100g >= 0
    and fat_g_per_100g >= 0
    and fiber_g_per_100g >= 0
    and sodium_mg_per_100g >= 0
  )
);

create table public.ingredient_translations (
  ingredient_id bigint not null references public.ingredients (id) on delete cascade,
  locale public.app_locale not null,
  name text not null,
  aliases text[] not null default '{}',
  primary key (ingredient_id, locale)
);

create table public.ingredient_allergens (
  ingredient_id bigint not null references public.ingredients (id) on delete cascade,
  allergen_id bigint not null references public.allergens (id) on delete cascade,
  relation text not null default 'contains' check (relation in ('contains', 'may_contain')),
  primary key (ingredient_id, allergen_id)
);

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  owner_user_id uuid references public.users (id) on delete cascade,
  origin public.recipe_origin not null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  dietary_tags text[] not null default '{}',
  base_servings smallint not null default 1,
  prep_minutes smallint not null default 0,
  cook_minutes smallint not null default 0,
  calories_per_serving numeric(10, 2) not null default 0,
  protein_g_per_serving numeric(10, 2) not null default 0,
  carbohydrate_g_per_serving numeric(10, 2) not null default 0,
  fat_g_per_serving numeric(10, 2) not null default 0,
  fiber_g_per_serving numeric(10, 2) not null default 0,
  nutrition_status text not null default 'pending' check (nutrition_status in ('pending', 'calculated', 'verified')),
  image_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recipes_owner_origin_check check (
    (origin = 'curated' and owner_user_id is null)
    or (origin in ('user', 'ai') and owner_user_id is not null)
  ),
  constraint recipes_servings_check check (base_servings between 1 and 100),
  constraint recipes_duration_check check (prep_minutes between 0 and 1440 and cook_minutes between 0 and 1440),
  constraint recipes_nutrition_nonnegative check (
    calories_per_serving >= 0
    and protein_g_per_serving >= 0
    and carbohydrate_g_per_serving >= 0
    and fat_g_per_serving >= 0
    and fiber_g_per_serving >= 0
  )
);

create table public.recipe_translations (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  locale public.app_locale not null,
  title text not null,
  description text,
  tips text,
  primary key (recipe_id, locale),
  constraint recipe_translations_title_length check (char_length(title) between 1 and 160)
);

create table public.recipe_ingredients (
  id bigint generated always as identity primary key,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  ingredient_id bigint not null references public.ingredients (id) on delete restrict,
  position smallint not null,
  quantity numeric(12, 4) not null,
  unit public.measurement_unit not null,
  quantity_grams numeric(12, 4) not null,
  is_optional boolean not null default false,
  created_at timestamptz not null default now(),
  unique (recipe_id, position),
  constraint recipe_ingredients_position_check check (position > 0),
  constraint recipe_ingredients_quantity_check check (quantity > 0 and quantity_grams > 0)
);

create table public.recipe_ingredient_translations (
  recipe_ingredient_id bigint not null references public.recipe_ingredients (id) on delete cascade,
  locale public.app_locale not null,
  preparation_note text,
  primary key (recipe_ingredient_id, locale)
);

create table public.recipe_steps (
  id bigint generated always as identity primary key,
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  step_number smallint not null,
  appliance_id bigint references public.appliances (id) on delete set null,
  duration_minutes smallint,
  temperature_celsius smallint,
  created_at timestamptz not null default now(),
  unique (recipe_id, step_number),
  constraint recipe_steps_number_check check (step_number > 0),
  constraint recipe_steps_duration_check check (duration_minutes is null or duration_minutes between 0 and 1440),
  constraint recipe_steps_temperature_check check (temperature_celsius is null or temperature_celsius between -30 and 550)
);

create table public.recipe_step_translations (
  recipe_step_id bigint not null references public.recipe_steps (id) on delete cascade,
  locale public.app_locale not null,
  instruction text not null,
  primary key (recipe_step_id, locale),
  constraint recipe_step_translations_instruction_length check (char_length(instruction) between 1 and 2000)
);

create table public.recipe_appliances (
  recipe_id uuid not null references public.recipes (id) on delete cascade,
  appliance_id bigint not null references public.appliances (id) on delete restrict,
  is_required boolean not null default true,
  primary key (recipe_id, appliance_id)
);

create table public.profile_ingredient_preferences (
  user_id uuid not null references public.users (id) on delete cascade,
  ingredient_id bigint not null references public.ingredients (id) on delete cascade,
  preference public.ingredient_preference not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (user_id, ingredient_id)
);

create table public.pantry_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  ingredient_id bigint not null references public.ingredients (id) on delete restrict,
  quantity numeric(12, 4) not null,
  unit public.measurement_unit not null,
  quantity_grams numeric(12, 4),
  expires_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint pantry_items_quantity_check check (quantity > 0),
  constraint pantry_items_quantity_grams_check check (quantity_grams is null or quantity_grams > 0)
);

create index ingredients_default_aisle_id_idx on public.ingredients (default_aisle_id);
create index ingredient_allergens_allergen_id_idx on public.ingredient_allergens (allergen_id);
create index recipes_owner_user_id_idx on public.recipes (owner_user_id) where owner_user_id is not null;
create index recipes_published_idx on public.recipes (updated_at desc) where status = 'published';
create index recipes_dietary_tags_idx on public.recipes using gin (dietary_tags);
create index recipe_ingredients_recipe_id_idx on public.recipe_ingredients (recipe_id);
create index recipe_ingredients_ingredient_id_idx on public.recipe_ingredients (ingredient_id);
create index recipe_steps_recipe_id_idx on public.recipe_steps (recipe_id);
create index recipe_steps_appliance_id_idx on public.recipe_steps (appliance_id) where appliance_id is not null;
create index recipe_appliances_appliance_id_idx on public.recipe_appliances (appliance_id);
create index profile_ingredient_preferences_ingredient_id_idx
  on public.profile_ingredient_preferences (ingredient_id);
create index pantry_items_user_ingredient_idx on public.pantry_items (user_id, ingredient_id);
create index pantry_items_ingredient_id_idx on public.pantry_items (ingredient_id);
create index pantry_items_expires_on_idx on public.pantry_items (user_id, expires_on)
  where expires_on is not null;

create trigger ingredients_set_updated_at
before update on public.ingredients
for each row execute function private.set_updated_at();

create trigger recipes_set_updated_at
before update on public.recipes
for each row execute function private.set_updated_at();

create trigger profile_ingredient_preferences_set_updated_at
before update on public.profile_ingredient_preferences
for each row execute function private.set_updated_at();

create trigger pantry_items_set_updated_at
before update on public.pantry_items
for each row execute function private.set_updated_at();
