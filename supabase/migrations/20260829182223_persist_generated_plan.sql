-- Atomically replace the user's current weekly plan after backend validation.
-- The function is SECURITY INVOKER and executable only by service_role.
alter table public.weekly_plans
  add column summary_ka text,
  add column summary_en text,
  add constraint weekly_plans_summaries_check check (
    (summary_ka is null or length(summary_ka) between 1 and 500)
    and (summary_en is null or length(summary_en) between 1 and 500)
  );

create or replace function public.persist_generated_plan(
  p_user_id uuid,
  p_job_id uuid,
  p_payload jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_plan_id uuid := gen_random_uuid();
  v_grocery_list_id uuid := gen_random_uuid();
begin
  if p_user_id is null then
    raise exception 'p_user_id is required' using errcode = '22023';
  end if;

  if jsonb_typeof(p_payload) <> 'object' then
    raise exception 'p_payload must be a JSON object' using errcode = '22023';
  end if;

  if not exists (
    select 1
    from public.plan_generation_jobs
    where id = p_job_id and user_id = p_user_id
  ) then
    raise exception 'Generation job does not belong to the user' using errcode = '42501';
  end if;

  if jsonb_typeof(p_payload -> 'meals') <> 'array'
    or jsonb_array_length(p_payload -> 'meals') = 0 then
    raise exception 'At least one planned meal is required' using errcode = '22023';
  end if;

  if exists (
    select 1
    from jsonb_array_elements(p_payload -> 'meals') as meal
    left join public.recipes
      on recipes.id = (meal ->> 'recipeId')::uuid
    where recipes.id is null
      or (
        recipes.status <> 'published'
        and recipes.owner_user_id is distinct from p_user_id
      )
  ) then
    raise exception 'Plan contains an unavailable recipe' using errcode = '23503';
  end if;

  update public.weekly_plans
  set is_current = false,
      status = 'archived'::public.plan_status
  where user_id = p_user_id
    and week_start_date = (p_payload ->> 'weekStartDate')::date
    and is_current;

  insert into public.weekly_plans (
    id,
    user_id,
    week_start_date,
    status,
    locale,
    preferred_store_id,
    requested_budget_gel,
    estimated_cost_gel,
    summary_ka,
    summary_en,
    target_daily_calories,
    target_protein_g,
    target_carbohydrate_g,
    target_fat_g,
    average_daily_calories,
    average_daily_protein_g,
    average_daily_carbohydrate_g,
    average_daily_fat_g,
    generation_version,
    is_current,
    generated_at
  ) values (
    v_plan_id,
    p_user_id,
    (p_payload ->> 'weekStartDate')::date,
    'ready'::public.plan_status,
    (p_payload ->> 'locale')::public.app_locale,
    (p_payload ->> 'preferredStoreId')::bigint,
    (p_payload ->> 'requestedBudgetGel')::numeric,
    (p_payload ->> 'estimatedCostGel')::numeric,
    p_payload ->> 'summaryKa',
    p_payload ->> 'summaryEn',
    (p_payload #>> '{target,calories}')::smallint,
    (p_payload #>> '{target,proteinG}')::numeric,
    (p_payload #>> '{target,carbohydrateG}')::numeric,
    (p_payload #>> '{target,fatG}')::numeric,
    (p_payload #>> '{average,calories}')::numeric,
    (p_payload #>> '{average,proteinG}')::numeric,
    (p_payload #>> '{average,carbohydrateG}')::numeric,
    (p_payload #>> '{average,fatG}')::numeric,
    coalesce(nullif(p_payload ->> 'generationVersion', ''), 'v1'),
    true,
    now()
  );

  insert into public.planned_meals (
    weekly_plan_id,
    user_id,
    day_index,
    meal_slot,
    slot_position,
    recipe_id,
    servings,
    calories,
    protein_g,
    carbohydrate_g,
    fat_g,
    estimated_cost_gel
  )
  select
    v_plan_id,
    p_user_id,
    (meal ->> 'dayIndex')::smallint,
    (meal ->> 'mealSlot')::public.meal_slot,
    (meal ->> 'slotPosition')::smallint,
    (meal ->> 'recipeId')::uuid,
    (meal ->> 'servings')::numeric,
    (meal #>> '{nutrition,calories}')::numeric,
    (meal #>> '{nutrition,proteinG}')::numeric,
    (meal #>> '{nutrition,carbohydrateG}')::numeric,
    (meal #>> '{nutrition,fatG}')::numeric,
    (meal ->> 'estimatedCostGel')::numeric
  from jsonb_array_elements(p_payload -> 'meals') as meal;

  insert into public.grocery_lists (
    id,
    weekly_plan_id,
    user_id,
    store_id,
    estimated_total_gel
  ) values (
    v_grocery_list_id,
    v_plan_id,
    p_user_id,
    (p_payload ->> 'preferredStoreId')::bigint,
    (p_payload #>> '{grocery,estimatedTotalGel}')::numeric
  );

  if jsonb_typeof(p_payload #> '{grocery,items}') = 'array' then
    insert into public.grocery_list_items (
      grocery_list_id,
      user_id,
      ingredient_id,
      aisle_id,
      selected_store_pricing_id,
      required_quantity,
      required_unit,
      pantry_deduction_quantity,
      purchase_quantity,
      purchase_unit,
      estimated_cost_gel,
      sort_order
    )
    select
      v_grocery_list_id,
      p_user_id,
      (item ->> 'ingredientId')::bigint,
      (item ->> 'aisleId')::bigint,
      (item ->> 'selectedStorePricingId')::bigint,
      (item ->> 'requiredQuantity')::numeric,
      (item ->> 'requiredUnit')::public.measurement_unit,
      (item ->> 'pantryDeductionQuantity')::numeric,
      (item ->> 'purchaseQuantity')::numeric,
      (item ->> 'purchaseUnit')::public.measurement_unit,
      (item ->> 'estimatedCostGel')::numeric,
      (item ->> 'sortOrder')::smallint
    from jsonb_array_elements(p_payload #> '{grocery,items}') as item;
  end if;

  update public.plan_generation_jobs
  set weekly_plan_id = v_plan_id,
      status = 'succeeded'::public.generation_job_status,
      output_snapshot = p_payload,
      completed_at = now()
  where id = p_job_id and user_id = p_user_id;

  return v_plan_id;
end;
$$;

revoke execute on function public.persist_generated_plan(uuid, uuid, jsonb)
from public, anon, authenticated;
grant execute on function public.persist_generated_plan(uuid, uuid, jsonb)
to service_role;
