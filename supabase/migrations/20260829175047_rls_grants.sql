-- Explicit Data API privileges and RLS policies. No table is writable merely because a user is signed in.
do $$
declare
  table_name text;
begin
  foreach table_name in array array[
    'users',
    'stores',
    'store_translations',
    'store_locations',
    'profiles',
    'appliances',
    'appliance_translations',
    'profile_appliances',
    'allergens',
    'allergen_translations',
    'profile_allergens',
    'dietary_patterns',
    'dietary_pattern_translations',
    'profile_dietary_patterns',
    'aisles',
    'aisle_translations',
    'ingredients',
    'ingredient_translations',
    'ingredient_allergens',
    'recipes',
    'recipe_translations',
    'recipe_ingredients',
    'recipe_ingredient_translations',
    'recipe_steps',
    'recipe_step_translations',
    'recipe_appliances',
    'profile_ingredient_preferences',
    'pantry_items',
    'weekly_plans',
    'planned_meals',
    'plan_generation_jobs',
    'store_pricing',
    'grocery_lists',
    'grocery_list_items'
  ]
  loop
    execute format('alter table public.%I enable row level security', table_name);
    execute format('alter table public.%I force row level security', table_name);
  end loop;
end;
$$;

revoke all on all tables in schema public from anon, authenticated;
revoke all on all sequences in schema public from anon, authenticated;
grant usage on schema public to authenticated, service_role;

grant select on table
  public.stores,
  public.store_translations,
  public.store_locations,
  public.appliances,
  public.appliance_translations,
  public.allergens,
  public.allergen_translations,
  public.dietary_patterns,
  public.dietary_pattern_translations,
  public.aisles,
  public.aisle_translations,
  public.ingredients,
  public.ingredient_translations,
  public.ingredient_allergens,
  public.recipes,
  public.recipe_translations,
  public.recipe_ingredients,
  public.recipe_ingredient_translations,
  public.recipe_steps,
  public.recipe_step_translations,
  public.recipe_appliances,
  public.store_pricing
to authenticated;

grant select on table public.users to authenticated;
grant select, insert, update on table public.profiles to authenticated;
grant select, insert, delete on table public.profile_appliances to authenticated;
grant select, insert, update, delete on table public.profile_allergens to authenticated;
grant select, insert, delete on table public.profile_dietary_patterns to authenticated;
grant select, insert, update, delete on table public.profile_ingredient_preferences to authenticated;
grant select, insert, update, delete on table public.pantry_items to authenticated;
grant select on table public.weekly_plans, public.planned_meals, public.plan_generation_jobs, public.grocery_lists
to authenticated;
grant select on table public.grocery_list_items to authenticated;
grant update (is_checked, user_note) on table public.grocery_list_items to authenticated;

grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;

alter default privileges in schema public revoke all on tables from anon, authenticated;
alter default privileges in schema public revoke all on sequences from anon, authenticated;

create policy users_select_own
on public.users for select
to authenticated
using ((select auth.uid()) = id);

create policy profiles_select_own
on public.profiles for select
to authenticated
using ((select auth.uid()) = user_id);

create policy profiles_insert_own
on public.profiles for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy profiles_update_own
on public.profiles for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy stores_select_authenticated
on public.stores for select to authenticated using (true);

create policy store_translations_select_authenticated
on public.store_translations for select to authenticated using (true);

create policy store_locations_select_authenticated
on public.store_locations for select to authenticated using (true);

create policy appliances_select_authenticated
on public.appliances for select to authenticated using (true);

create policy appliance_translations_select_authenticated
on public.appliance_translations for select to authenticated using (true);

create policy allergens_select_authenticated
on public.allergens for select to authenticated using (true);

create policy allergen_translations_select_authenticated
on public.allergen_translations for select to authenticated using (true);

create policy dietary_patterns_select_authenticated
on public.dietary_patterns for select to authenticated using (true);

create policy dietary_pattern_translations_select_authenticated
on public.dietary_pattern_translations for select to authenticated using (true);

create policy aisles_select_authenticated
on public.aisles for select to authenticated using (true);

create policy aisle_translations_select_authenticated
on public.aisle_translations for select to authenticated using (true);

create policy ingredients_select_authenticated
on public.ingredients for select to authenticated using (true);

create policy ingredient_translations_select_authenticated
on public.ingredient_translations for select to authenticated using (true);

create policy ingredient_allergens_select_authenticated
on public.ingredient_allergens for select to authenticated using (true);

create policy store_pricing_select_authenticated
on public.store_pricing for select to authenticated using (true);

create policy profile_appliances_select_own
on public.profile_appliances for select
to authenticated
using ((select auth.uid()) = user_id);

create policy profile_appliances_insert_own
on public.profile_appliances for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy profile_appliances_delete_own
on public.profile_appliances for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy profile_allergens_select_own
on public.profile_allergens for select
to authenticated
using ((select auth.uid()) = user_id);

create policy profile_allergens_insert_own
on public.profile_allergens for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy profile_allergens_update_own
on public.profile_allergens for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy profile_allergens_delete_own
on public.profile_allergens for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy profile_dietary_patterns_select_own
on public.profile_dietary_patterns for select
to authenticated
using ((select auth.uid()) = user_id);

create policy profile_dietary_patterns_insert_own
on public.profile_dietary_patterns for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy profile_dietary_patterns_delete_own
on public.profile_dietary_patterns for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy profile_ingredient_preferences_select_own
on public.profile_ingredient_preferences for select
to authenticated
using ((select auth.uid()) = user_id);

create policy profile_ingredient_preferences_insert_own
on public.profile_ingredient_preferences for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy profile_ingredient_preferences_update_own
on public.profile_ingredient_preferences for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy profile_ingredient_preferences_delete_own
on public.profile_ingredient_preferences for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy pantry_items_select_own
on public.pantry_items for select
to authenticated
using ((select auth.uid()) = user_id);

create policy pantry_items_insert_own
on public.pantry_items for insert
to authenticated
with check ((select auth.uid()) = user_id);

create policy pantry_items_update_own
on public.pantry_items for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy pantry_items_delete_own
on public.pantry_items for delete
to authenticated
using ((select auth.uid()) = user_id);

create policy recipes_select_available
on public.recipes for select
to authenticated
using (status = 'published' or (select auth.uid()) = owner_user_id);

create policy recipe_translations_select_available
on public.recipe_translations for select
to authenticated
using (
  exists (
    select 1
    from public.recipes
    where recipes.id = recipe_translations.recipe_id
      and (recipes.status = 'published' or recipes.owner_user_id = (select auth.uid()))
  )
);

create policy recipe_ingredients_select_available
on public.recipe_ingredients for select
to authenticated
using (
  exists (
    select 1
    from public.recipes
    where recipes.id = recipe_ingredients.recipe_id
      and (recipes.status = 'published' or recipes.owner_user_id = (select auth.uid()))
  )
);

create policy recipe_ingredient_translations_select_available
on public.recipe_ingredient_translations for select
to authenticated
using (
  exists (
    select 1
    from public.recipe_ingredients
    join public.recipes on recipes.id = recipe_ingredients.recipe_id
    where recipe_ingredients.id = recipe_ingredient_translations.recipe_ingredient_id
      and (recipes.status = 'published' or recipes.owner_user_id = (select auth.uid()))
  )
);

create policy recipe_steps_select_available
on public.recipe_steps for select
to authenticated
using (
  exists (
    select 1
    from public.recipes
    where recipes.id = recipe_steps.recipe_id
      and (recipes.status = 'published' or recipes.owner_user_id = (select auth.uid()))
  )
);

create policy recipe_step_translations_select_available
on public.recipe_step_translations for select
to authenticated
using (
  exists (
    select 1
    from public.recipe_steps
    join public.recipes on recipes.id = recipe_steps.recipe_id
    where recipe_steps.id = recipe_step_translations.recipe_step_id
      and (recipes.status = 'published' or recipes.owner_user_id = (select auth.uid()))
  )
);

create policy recipe_appliances_select_available
on public.recipe_appliances for select
to authenticated
using (
  exists (
    select 1
    from public.recipes
    where recipes.id = recipe_appliances.recipe_id
      and (recipes.status = 'published' or recipes.owner_user_id = (select auth.uid()))
  )
);

create policy weekly_plans_select_own
on public.weekly_plans for select
to authenticated
using ((select auth.uid()) = user_id);

create policy planned_meals_select_own
on public.planned_meals for select
to authenticated
using ((select auth.uid()) = user_id);

create policy plan_generation_jobs_select_own
on public.plan_generation_jobs for select
to authenticated
using ((select auth.uid()) = user_id);

create policy grocery_lists_select_own
on public.grocery_lists for select
to authenticated
using ((select auth.uid()) = user_id);

create policy grocery_list_items_select_own
on public.grocery_list_items for select
to authenticated
using ((select auth.uid()) = user_id);

create policy grocery_list_items_update_own
on public.grocery_list_items for update
to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);
