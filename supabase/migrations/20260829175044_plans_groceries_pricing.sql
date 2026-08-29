-- Weekly plans, generation audit trail, Georgian store pricing, and grocery lists.
create table public.weekly_plans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  week_start_date date not null,
  status public.plan_status not null default 'generating',
  locale public.app_locale not null,
  preferred_store_id bigint references public.stores (id) on delete set null,
  requested_budget_gel numeric(10, 2),
  estimated_cost_gel numeric(10, 2),
  target_daily_calories smallint,
  target_protein_g numeric(7, 2),
  target_carbohydrate_g numeric(7, 2),
  target_fat_g numeric(7, 2),
  average_daily_calories numeric(10, 2),
  average_daily_protein_g numeric(10, 2),
  average_daily_carbohydrate_g numeric(10, 2),
  average_daily_fat_g numeric(10, 2),
  generation_version text not null default 'v1',
  is_current boolean not null default true,
  generated_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (id, user_id),
  constraint weekly_plans_budget_check check (requested_budget_gel is null or requested_budget_gel > 0),
  constraint weekly_plans_cost_check check (estimated_cost_gel is null or estimated_cost_gel >= 0),
  constraint weekly_plans_target_calories_check check (target_daily_calories is null or target_daily_calories between 800 and 10000),
  constraint weekly_plans_targets_nonnegative check (
    (target_protein_g is null or target_protein_g >= 0)
    and (target_carbohydrate_g is null or target_carbohydrate_g >= 0)
    and (target_fat_g is null or target_fat_g >= 0)
  ),
  constraint weekly_plans_averages_nonnegative check (
    (average_daily_calories is null or average_daily_calories >= 0)
    and (average_daily_protein_g is null or average_daily_protein_g >= 0)
    and (average_daily_carbohydrate_g is null or average_daily_carbohydrate_g >= 0)
    and (average_daily_fat_g is null or average_daily_fat_g >= 0)
  )
);

create unique index weekly_plans_one_current_week_idx
  on public.weekly_plans (user_id, week_start_date)
  where is_current;

create table public.planned_meals (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null,
  user_id uuid not null,
  day_index smallint not null,
  meal_slot public.meal_slot not null,
  slot_position smallint not null default 1,
  recipe_id uuid not null references public.recipes (id) on delete restrict,
  servings numeric(7, 2) not null,
  calories numeric(10, 2) not null,
  protein_g numeric(10, 2) not null,
  carbohydrate_g numeric(10, 2) not null,
  fat_g numeric(10, 2) not null,
  estimated_cost_gel numeric(10, 2),
  user_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (weekly_plan_id, user_id)
    references public.weekly_plans (id, user_id)
    on delete cascade,
  unique (weekly_plan_id, day_index, meal_slot, slot_position),
  constraint planned_meals_day_index_check check (day_index between 0 and 6),
  constraint planned_meals_slot_position_check check (slot_position between 1 and 8),
  constraint planned_meals_servings_check check (servings > 0 and servings <= 100),
  constraint planned_meals_nutrition_nonnegative check (
    calories >= 0 and protein_g >= 0 and carbohydrate_g >= 0 and fat_g >= 0
  ),
  constraint planned_meals_cost_check check (estimated_cost_gel is null or estimated_cost_gel >= 0)
);

create table public.plan_generation_jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  weekly_plan_id uuid,
  status public.generation_job_status not null default 'queued',
  provider text not null check (provider in ('openai', 'anthropic')),
  model text not null,
  prompt_version text not null,
  idempotency_key text not null,
  attempt_count smallint not null default 0,
  input_snapshot jsonb not null,
  output_snapshot jsonb,
  provider_response_id text,
  input_tokens integer,
  output_tokens integer,
  error_code text,
  error_message text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (weekly_plan_id, user_id)
    references public.weekly_plans (id, user_id)
    on delete cascade,
  unique (user_id, idempotency_key),
  constraint plan_generation_jobs_attempt_check check (attempt_count between 0 and 10),
  constraint plan_generation_jobs_input_object_check check (jsonb_typeof(input_snapshot) = 'object'),
  constraint plan_generation_jobs_output_object_check check (
    output_snapshot is null or jsonb_typeof(output_snapshot) = 'object'
  ),
  constraint plan_generation_jobs_tokens_check check (
    (input_tokens is null or input_tokens >= 0) and (output_tokens is null or output_tokens >= 0)
  )
);

create table public.store_pricing (
  id bigint generated always as identity primary key,
  store_id bigint not null references public.stores (id) on delete cascade,
  ingredient_id bigint not null references public.ingredients (id) on delete cascade,
  external_product_id text,
  product_name_ka text,
  product_name_en text,
  brand text,
  package_quantity numeric(12, 4) not null,
  package_unit public.measurement_unit not null,
  equivalent_grams numeric(12, 4),
  price_gel numeric(10, 2) not null,
  regular_price_gel numeric(10, 2),
  is_promotion boolean not null default false,
  valid_from timestamptz,
  valid_to timestamptz,
  observed_at timestamptz not null default now(),
  source public.pricing_source not null,
  source_url text,
  source_metadata jsonb not null default '{}',
  created_at timestamptz not null default now(),
  constraint store_pricing_product_name_check check (product_name_ka is not null or product_name_en is not null),
  constraint store_pricing_package_quantity_check check (package_quantity > 0),
  constraint store_pricing_equivalent_grams_check check (equivalent_grams is null or equivalent_grams > 0),
  constraint store_pricing_price_check check (price_gel > 0 and (regular_price_gel is null or regular_price_gel > 0)),
  constraint store_pricing_validity_check check (valid_to is null or valid_from is null or valid_to >= valid_from),
  constraint store_pricing_metadata_object_check check (jsonb_typeof(source_metadata) = 'object')
);

create unique index store_pricing_external_observation_idx
  on public.store_pricing (store_id, external_product_id, observed_at)
  where external_product_id is not null;

create table public.grocery_lists (
  id uuid primary key default gen_random_uuid(),
  weekly_plan_id uuid not null,
  user_id uuid not null,
  store_id bigint references public.stores (id) on delete set null,
  estimated_total_gel numeric(10, 2),
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (weekly_plan_id, user_id)
    references public.weekly_plans (id, user_id)
    on delete cascade,
  unique (weekly_plan_id),
  unique (id, user_id),
  constraint grocery_lists_total_check check (estimated_total_gel is null or estimated_total_gel >= 0)
);

create table public.grocery_list_items (
  id uuid primary key default gen_random_uuid(),
  grocery_list_id uuid not null,
  user_id uuid not null,
  ingredient_id bigint not null references public.ingredients (id) on delete restrict,
  aisle_id bigint references public.aisles (id) on delete set null,
  selected_store_pricing_id bigint references public.store_pricing (id) on delete set null,
  required_quantity numeric(12, 4) not null,
  required_unit public.measurement_unit not null,
  pantry_deduction_quantity numeric(12, 4) not null default 0,
  purchase_quantity numeric(12, 4) not null,
  purchase_unit public.measurement_unit not null,
  estimated_cost_gel numeric(10, 2),
  is_checked boolean not null default false,
  sort_order smallint not null default 0,
  user_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (grocery_list_id, user_id)
    references public.grocery_lists (id, user_id)
    on delete cascade,
  unique (grocery_list_id, ingredient_id),
  constraint grocery_list_items_quantities_check check (
    required_quantity > 0
    and pantry_deduction_quantity >= 0
    and purchase_quantity >= 0
  ),
  constraint grocery_list_items_cost_check check (estimated_cost_gel is null or estimated_cost_gel >= 0)
);

create index weekly_plans_user_created_idx on public.weekly_plans (user_id, created_at desc);
create index weekly_plans_preferred_store_id_idx on public.weekly_plans (preferred_store_id)
  where preferred_store_id is not null;
create index planned_meals_user_plan_idx on public.planned_meals (user_id, weekly_plan_id);
create index planned_meals_recipe_id_idx on public.planned_meals (recipe_id);
create index plan_generation_jobs_user_created_idx
  on public.plan_generation_jobs (user_id, created_at desc);
create index plan_generation_jobs_weekly_plan_id_idx
  on public.plan_generation_jobs (weekly_plan_id)
  where weekly_plan_id is not null;
create index plan_generation_jobs_queued_idx
  on public.plan_generation_jobs (created_at)
  where status = 'queued';
create index store_pricing_store_ingredient_current_idx
  on public.store_pricing (store_id, ingredient_id, observed_at desc);
create index store_pricing_ingredient_id_idx on public.store_pricing (ingredient_id);
create index store_pricing_valid_to_idx on public.store_pricing (valid_to)
  where valid_to is not null;
create index grocery_lists_user_id_idx on public.grocery_lists (user_id);
create index grocery_lists_store_id_idx on public.grocery_lists (store_id) where store_id is not null;
create index grocery_list_items_user_check_idx
  on public.grocery_list_items (user_id, is_checked, aisle_id);
create index grocery_list_items_ingredient_id_idx on public.grocery_list_items (ingredient_id);
create index grocery_list_items_aisle_id_idx on public.grocery_list_items (aisle_id)
  where aisle_id is not null;
create index grocery_list_items_store_pricing_id_idx
  on public.grocery_list_items (selected_store_pricing_id)
  where selected_store_pricing_id is not null;

create trigger weekly_plans_set_updated_at
before update on public.weekly_plans
for each row execute function private.set_updated_at();

create trigger planned_meals_set_updated_at
before update on public.planned_meals
for each row execute function private.set_updated_at();

create trigger plan_generation_jobs_set_updated_at
before update on public.plan_generation_jobs
for each row execute function private.set_updated_at();

create trigger grocery_lists_set_updated_at
before update on public.grocery_lists
for each row execute function private.set_updated_at();

create trigger grocery_list_items_set_updated_at
before update on public.grocery_list_items
for each row execute function private.set_updated_at();
