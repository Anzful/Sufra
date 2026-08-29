-- Save onboarding preferences and relationship selections atomically as the signed-in user.
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
  ) as selected
  join public.dietary_patterns
    on dietary_patterns.id = selected.id and dietary_patterns.is_active;
end;
$$;

revoke execute on function public.save_profile(jsonb) from public, anon, service_role;
grant execute on function public.save_profile(jsonb) to authenticated;
