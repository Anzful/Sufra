-- Persist the guided onboarding mood and tag curated recipes so generation can prefer it.
alter table public.profiles
  add column meal_mood_slug text not null default 'healthy-comfort';

alter table public.profiles
  add constraint profiles_meal_mood_slug_check check (
    meal_mood_slug in (
      'speedy-meals',
      'low-calorie',
      'family-favourites',
      'healthy-comfort',
      'fakeaway',
      'gut-friendly',
      'protein-packed'
    )
  );

alter table public.recipes
  add column mood_tags text[] not null default array['healthy-comfort']::text[];

alter table public.recipes
  add constraint recipes_mood_tags_check check (
    cardinality(mood_tags) > 0
    and mood_tags <@ array[
      'speedy-meals',
      'low-calorie',
      'family-favourites',
      'healthy-comfort',
      'fakeaway',
      'gut-friendly',
      'protein-packed'
    ]::text[]
  );

create index recipes_mood_tags_idx on public.recipes using gin (mood_tags);

update public.recipes
set mood_tags = case id
  when '10000000-0000-4000-8000-000000000001'::uuid
    then array['speedy-meals', 'low-calorie', 'healthy-comfort', 'gut-friendly']
  when '10000000-0000-4000-8000-000000000002'::uuid
    then array['speedy-meals', 'low-calorie', 'family-favourites', 'protein-packed']
  when '10000000-0000-4000-8000-000000000003'::uuid
    then array['speedy-meals', 'family-favourites', 'fakeaway', 'protein-packed']
  when '10000000-0000-4000-8000-000000000004'::uuid
    then array['family-favourites', 'healthy-comfort', 'gut-friendly']
  when '10000000-0000-4000-8000-000000000005'::uuid
    then array['low-calorie', 'healthy-comfort', 'gut-friendly', 'protein-packed']
  when '10000000-0000-4000-8000-000000000006'::uuid
    then array['low-calorie', 'healthy-comfort', 'protein-packed']
  when '10000000-0000-4000-8000-000000000007'::uuid
    then array['family-favourites', 'healthy-comfort', 'protein-packed']
  when '10000000-0000-4000-8000-000000000008'::uuid
    then array['speedy-meals', 'low-calorie', 'gut-friendly']
  else mood_tags
end
where id::text like '10000000-0000-4000-8000-%';

-- A no-cook vegan fallback keeps hard diet and appliance constraints satisfiable.
insert into public.recipes (
  id,
  owner_user_id,
  origin,
  status,
  dietary_tags,
  mood_tags,
  base_servings,
  prep_minutes,
  cook_minutes
) values (
  '10000000-0000-4000-8000-000000000009',
  null,
  'curated',
  'published',
  array['vegan', 'vegetarian', 'gluten-free', 'dairy-free'],
  array['speedy-meals', 'low-calorie', 'healthy-comfort', 'gut-friendly', 'protein-packed'],
  2,
  12,
  0
)
on conflict (id) do update set
  status = excluded.status,
  dietary_tags = excluded.dietary_tags,
  mood_tags = excluded.mood_tags,
  base_servings = excluded.base_servings,
  prep_minutes = excluded.prep_minutes,
  cook_minutes = excluded.cook_minutes;

insert into public.recipe_translations (recipe_id, locale, title, description, tips) values
  (
    '10000000-0000-4000-8000-000000000009',
    'ka',
    'ლობიოსა და პომიდვრის სალათი',
    'სწრაფი, ცილებითა და ბოჭკოთი მდიდარი კერძი მომზადების გარეშე.',
    'დაკონსერვებული ლობიო კარგად გარეცხეთ.'
  ),
  (
    '10000000-0000-4000-8000-000000000009',
    'en',
    'Bean and tomato salad',
    'A quick, protein- and fibre-rich meal with no cooking required.',
    'Rinse canned beans thoroughly before using.'
  )
on conflict (recipe_id, locale) do update set
  title = excluded.title,
  description = excluded.description,
  tips = excluded.tips;

with recipe_ingredient_data (canonical_code, position, quantity, unit, quantity_grams) as (
  values
    ('kidney-beans', 1, 400::numeric, 'g'::public.measurement_unit, 400::numeric),
    ('tomato', 2, 300::numeric, 'g'::public.measurement_unit, 300::numeric),
    ('onion', 3, 100::numeric, 'g'::public.measurement_unit, 100::numeric),
    ('lemon', 4, 100::numeric, 'g'::public.measurement_unit, 100::numeric),
    ('coriander', 5, 30::numeric, 'g'::public.measurement_unit, 30::numeric)
)
insert into public.recipe_ingredients (
  recipe_id,
  ingredient_id,
  position,
  quantity,
  unit,
  quantity_grams
)
select
  '10000000-0000-4000-8000-000000000009'::uuid,
  ingredients.id,
  recipe_ingredient_data.position,
  recipe_ingredient_data.quantity,
  recipe_ingredient_data.unit,
  recipe_ingredient_data.quantity_grams
from recipe_ingredient_data
join public.ingredients on ingredients.canonical_code = recipe_ingredient_data.canonical_code
on conflict (recipe_id, position) do update set
  ingredient_id = excluded.ingredient_id,
  quantity = excluded.quantity,
  unit = excluded.unit,
  quantity_grams = excluded.quantity_grams;

insert into public.recipe_steps (recipe_id, step_number, duration_minutes) values
  ('10000000-0000-4000-8000-000000000009', 1, 3),
  ('10000000-0000-4000-8000-000000000009', 2, 6),
  ('10000000-0000-4000-8000-000000000009', 3, 3)
on conflict (recipe_id, step_number) do update set
  duration_minutes = excluded.duration_minutes,
  appliance_id = null,
  temperature_celsius = null;

with step_translations (step_number, locale, instruction) as (
  values
    (1, 'ka'::public.app_locale, 'ლობიო გადაწურეთ, ცივ წყალში გარეცხეთ და დიდ ჯამში ჩაყარეთ.'),
    (1, 'en'::public.app_locale, 'Drain and rinse the beans, then add them to a large bowl.'),
    (2, 'ka'::public.app_locale, 'პომიდორი, ხახვი და ქინძი დაჭერით.'),
    (2, 'en'::public.app_locale, 'Chop the tomatoes, onion, and coriander.'),
    (3, 'ka'::public.app_locale, 'ყველაფერი აურიეთ, ლიმონი მოაწურეთ და შეაზავეთ.'),
    (3, 'en'::public.app_locale, 'Toss everything together, squeeze over the lemon, and season.')
)
insert into public.recipe_step_translations (recipe_step_id, locale, instruction)
select recipe_steps.id, step_translations.locale, step_translations.instruction
from step_translations
join public.recipe_steps
  on recipe_steps.recipe_id = '10000000-0000-4000-8000-000000000009'::uuid
  and recipe_steps.step_number = step_translations.step_number
on conflict (recipe_step_id, locale) do update set instruction = excluded.instruction;

with nutrition as (
  select
    sum(ingredients.calories_per_100g * recipe_ingredients.quantity_grams / 100) as calories,
    sum(ingredients.protein_g_per_100g * recipe_ingredients.quantity_grams / 100) as protein,
    sum(ingredients.carbohydrate_g_per_100g * recipe_ingredients.quantity_grams / 100) as carbohydrate,
    sum(ingredients.fat_g_per_100g * recipe_ingredients.quantity_grams / 100) as fat,
    sum(ingredients.fiber_g_per_100g * recipe_ingredients.quantity_grams / 100) as fiber
  from public.recipe_ingredients
  join public.ingredients on ingredients.id = recipe_ingredients.ingredient_id
  where recipe_ingredients.recipe_id = '10000000-0000-4000-8000-000000000009'::uuid
)
update public.recipes
set calories_per_serving = round(nutrition.calories / recipes.base_servings, 2),
    protein_g_per_serving = round(nutrition.protein / recipes.base_servings, 2),
    carbohydrate_g_per_serving = round(nutrition.carbohydrate / recipes.base_servings, 2),
    fat_g_per_serving = round(nutrition.fat / recipes.base_servings, 2),
    fiber_g_per_serving = round(nutrition.fiber / recipes.base_servings, 2),
    nutrition_status = 'calculated'
from nutrition
where recipes.id = '10000000-0000-4000-8000-000000000009'::uuid;

-- Save the guided answers and relationship selections atomically as the signed-in user.
create or replace function public.save_profile(p_profile jsonb)
returns void
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid := (select auth.uid());
begin
  if v_user_id is null then
    raise exception 'Authentication is required' using errcode = '42501';
  end if;

  if jsonb_typeof(p_profile) <> 'object' then
    raise exception 'p_profile must be a JSON object' using errcode = '22023';
  end if;

  insert into public.profiles (
    user_id,
    display_name,
    locale,
    timezone,
    city,
    preferred_store_id,
    household_size,
    budget_period,
    budget_amount_gel,
    meal_mood_slug,
    daily_calorie_target,
    protein_target_g,
    carbohydrate_target_g,
    fat_target_g,
    fiber_target_g,
    meals_per_day,
    max_cook_minutes,
    include_leftovers,
    allow_batch_cooking,
    onboarding_completed_at
  ) values (
    v_user_id,
    nullif(p_profile ->> 'displayName', ''),
    (p_profile ->> 'locale')::public.app_locale,
    p_profile ->> 'timezone',
    p_profile ->> 'city',
    (p_profile ->> 'preferredStoreId')::bigint,
    (p_profile ->> 'householdSize')::smallint,
    (p_profile ->> 'budgetPeriod')::public.budget_period,
    (p_profile ->> 'budgetAmountGel')::numeric,
    coalesce(p_profile ->> 'mealMoodSlug', 'healthy-comfort'),
    (p_profile ->> 'dailyCalorieTarget')::smallint,
    (p_profile ->> 'proteinTargetG')::numeric,
    (p_profile ->> 'carbohydrateTargetG')::numeric,
    (p_profile ->> 'fatTargetG')::numeric,
    (p_profile ->> 'fiberTargetG')::numeric,
    (p_profile ->> 'mealsPerDay')::smallint,
    (p_profile ->> 'maxCookMinutes')::smallint,
    coalesce((p_profile ->> 'includeLeftovers')::boolean, true),
    coalesce((p_profile ->> 'allowBatchCooking')::boolean, true),
    now()
  )
  on conflict (user_id) do update set
    display_name = excluded.display_name,
    locale = excluded.locale,
    timezone = excluded.timezone,
    city = excluded.city,
    preferred_store_id = excluded.preferred_store_id,
    household_size = excluded.household_size,
    budget_period = excluded.budget_period,
    budget_amount_gel = excluded.budget_amount_gel,
    meal_mood_slug = excluded.meal_mood_slug,
    daily_calorie_target = excluded.daily_calorie_target,
    protein_target_g = excluded.protein_target_g,
    carbohydrate_target_g = excluded.carbohydrate_target_g,
    fat_target_g = excluded.fat_target_g,
    fiber_target_g = excluded.fiber_target_g,
    meals_per_day = excluded.meals_per_day,
    max_cook_minutes = excluded.max_cook_minutes,
    include_leftovers = excluded.include_leftovers,
    allow_batch_cooking = excluded.allow_batch_cooking,
    onboarding_completed_at = excluded.onboarding_completed_at;

  delete from public.profile_appliances where user_id = v_user_id;
  insert into public.profile_appliances (user_id, appliance_id)
  select v_user_id, appliances.id
  from (
    select distinct value::bigint as id
    from jsonb_array_elements_text(coalesce(p_profile -> 'applianceIds', '[]'::jsonb))
  ) as selected
  join public.appliances on appliances.id = selected.id and appliances.is_active;

  delete from public.profile_allergens where user_id = v_user_id;
  insert into public.profile_allergens (user_id, allergen_id, severity)
  select v_user_id, allergens.id, 'avoid'
  from (
    select distinct value::bigint as id
    from jsonb_array_elements_text(coalesce(p_profile -> 'allergenIds', '[]'::jsonb))
  ) as selected
  join public.allergens on allergens.id = selected.id and allergens.is_active;

  delete from public.profile_dietary_patterns where user_id = v_user_id;
  insert into public.profile_dietary_patterns (user_id, dietary_pattern_id)
  select v_user_id, dietary_patterns.id
  from (
    select distinct value::bigint as id
    from jsonb_array_elements_text(coalesce(p_profile -> 'dietaryPatternIds', '[]'::jsonb))
    limit 1
  ) as selected
  join public.dietary_patterns
    on dietary_patterns.id = selected.id and dietary_patterns.is_active;
end;
$$;

revoke execute on function public.save_profile(jsonb) from public, anon, service_role;
grant execute on function public.save_profile(jsonb) to authenticated;
