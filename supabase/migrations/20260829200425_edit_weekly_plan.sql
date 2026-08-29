-- Apply an already validated user edit to a ready plan in one short transaction.
-- The Edge Function performs recipe-safety and deterministic nutrition/price
-- calculations before invoking this service-role-only, SECURITY INVOKER RPC.
alter table public.weekly_plans
  add column validation_warnings text[] not null default '{}';

create or replace function public.replace_edited_plan(
  p_user_id uuid,
  p_plan_id uuid,
  p_expected_updated_at timestamptz,
  p_payload jsonb
)
returns uuid
language plpgsql
security invoker
set search_path = ''
as $$
declare
  v_plan_updated_at timestamptz;
  v_plan_week_start_date date;
  v_grocery_list_id uuid;
begin
  if p_user_id is null or p_plan_id is null or p_expected_updated_at is null then
    raise exception 'User, plan, and expected update timestamp are required'
      using errcode = '22023';
  end if;

  if jsonb_typeof(p_payload) <> 'object' then
    raise exception 'p_payload must be a JSON object' using errcode = '22023';
  end if;

  if jsonb_typeof(p_payload -> 'meals') <> 'array'
    or jsonb_array_length(p_payload -> 'meals') = 0 then
    raise exception 'At least one planned meal is required' using errcode = '22023';
  end if;

  -- Lock the plan before any dependent rows and keep that order for every edit.
  select weekly_plans.updated_at, weekly_plans.week_start_date
  into v_plan_updated_at, v_plan_week_start_date
  from public.weekly_plans
  where weekly_plans.id = p_plan_id
    and weekly_plans.user_id = p_user_id
    and weekly_plans.is_current
    and weekly_plans.status = 'ready'::public.plan_status
  for update;

  if not found then
    raise exception 'A current ready plan was not found for this user' using errcode = '42501';
  end if;

  if v_plan_updated_at <> p_expected_updated_at then
    raise exception 'The plan changed after it was loaded' using errcode = '40001';
  end if;

  if v_plan_week_start_date <> (p_payload ->> 'weekStartDate')::date then
    raise exception 'The edited payload cannot change the plan week' using errcode = '22023';
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
    p_plan_id,
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
  from jsonb_array_elements(p_payload -> 'meals') as meal
  on conflict (weekly_plan_id, day_index, meal_slot, slot_position) do update
  set recipe_id = excluded.recipe_id,
      servings = excluded.servings,
      calories = excluded.calories,
      protein_g = excluded.protein_g,
      carbohydrate_g = excluded.carbohydrate_g,
      fat_g = excluded.fat_g,
      estimated_cost_gel = excluded.estimated_cost_gel;

  -- Preserve stable meal IDs and user notes for slots that remain in the plan.
  delete from public.planned_meals
  where weekly_plan_id = p_plan_id
    and user_id = p_user_id
    and not exists (
      select 1
      from jsonb_array_elements(p_payload -> 'meals') as meal
      where (meal ->> 'dayIndex')::smallint = planned_meals.day_index
        and (meal ->> 'mealSlot')::public.meal_slot = planned_meals.meal_slot
        and (meal ->> 'slotPosition')::smallint = planned_meals.slot_position
    );

  select grocery_lists.id
  into v_grocery_list_id
  from public.grocery_lists
  where grocery_lists.weekly_plan_id = p_plan_id
    and grocery_lists.user_id = p_user_id
  for update;

  if v_grocery_list_id is null then
    insert into public.grocery_lists (
      weekly_plan_id,
      user_id,
      store_id,
      estimated_total_gel
    ) values (
      p_plan_id,
      p_user_id,
      (p_payload ->> 'preferredStoreId')::bigint,
      (p_payload #>> '{grocery,estimatedTotalGel}')::numeric
    )
    returning id into v_grocery_list_id;
  else
    update public.grocery_lists
    set store_id = (p_payload ->> 'preferredStoreId')::bigint,
        estimated_total_gel = (p_payload #>> '{grocery,estimatedTotalGel}')::numeric,
        generated_at = now()
    where id = v_grocery_list_id and user_id = p_user_id;
  end if;

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
    from jsonb_array_elements(p_payload #> '{grocery,items}') as item
    on conflict (grocery_list_id, ingredient_id) do update
    set aisle_id = excluded.aisle_id,
        selected_store_pricing_id = excluded.selected_store_pricing_id,
        required_quantity = excluded.required_quantity,
        required_unit = excluded.required_unit,
        pantry_deduction_quantity = excluded.pantry_deduction_quantity,
        purchase_quantity = excluded.purchase_quantity,
        purchase_unit = excluded.purchase_unit,
        estimated_cost_gel = excluded.estimated_cost_gel,
        sort_order = excluded.sort_order;

    delete from public.grocery_list_items
    where grocery_list_id = v_grocery_list_id
      and user_id = p_user_id
      and not exists (
        select 1
        from jsonb_array_elements(p_payload #> '{grocery,items}') as item
        where (item ->> 'ingredientId')::bigint = grocery_list_items.ingredient_id
      );
  else
    delete from public.grocery_list_items
    where grocery_list_id = v_grocery_list_id and user_id = p_user_id;
  end if;

  update public.weekly_plans
  set locale = (p_payload ->> 'locale')::public.app_locale,
      preferred_store_id = (p_payload ->> 'preferredStoreId')::bigint,
      requested_budget_gel = (p_payload ->> 'requestedBudgetGel')::numeric,
      estimated_cost_gel = (p_payload ->> 'estimatedCostGel')::numeric,
      target_daily_calories = (p_payload #>> '{target,calories}')::smallint,
      target_protein_g = (p_payload #>> '{target,proteinG}')::numeric,
      target_carbohydrate_g = (p_payload #>> '{target,carbohydrateG}')::numeric,
      target_fat_g = (p_payload #>> '{target,fatG}')::numeric,
      average_daily_calories = (p_payload #>> '{average,calories}')::numeric,
      average_daily_protein_g = (p_payload #>> '{average,proteinG}')::numeric,
      average_daily_carbohydrate_g = (p_payload #>> '{average,carbohydrateG}')::numeric,
      average_daily_fat_g = (p_payload #>> '{average,fatG}')::numeric,
      generation_version = coalesce(nullif(p_payload ->> 'generationVersion', ''), 'v1-edit'),
      validation_warnings = case
        when jsonb_typeof(p_payload -> 'warnings') = 'array'
          then array(select jsonb_array_elements_text(p_payload -> 'warnings'))
        else '{}'
      end
  where id = p_plan_id and user_id = p_user_id;

  return p_plan_id;
end;
$$;

revoke execute on function public.replace_edited_plan(uuid, uuid, timestamptz, jsonb)
from public, anon, authenticated;
grant execute on function public.replace_edited_plan(uuid, uuid, timestamptz, jsonb)
to service_role;
