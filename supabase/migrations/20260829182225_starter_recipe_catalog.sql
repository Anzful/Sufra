-- A small bilingual starter catalogue for local development and product evaluation.
-- Nutrition rows are deliberately marked unverified and must be replaced by a licensed,
-- reviewed dataset before production health claims are made.
with ingredient_data (
  canonical_code,
  aisle_slug,
  base_unit,
  grams_per_base_unit,
  density_g_per_ml,
  calories,
  protein,
  carbohydrate,
  fat,
  fiber,
  sodium
) as (
  values
    ('rolled-oats', 'grains-pasta', 'g'::public.measurement_unit, null::numeric, null::numeric, 379, 13.2, 67.7, 6.5, 10.1, 6),
    ('milk', 'dairy-eggs', 'ml'::public.measurement_unit, null::numeric, 1.03, 61, 3.2, 4.8, 3.3, 0, 43),
    ('matsoni', 'dairy-eggs', 'g'::public.measurement_unit, null::numeric, null::numeric, 63, 3.5, 4.7, 3.2, 0, 46),
    ('banana', 'produce', 'g'::public.measurement_unit, null::numeric, null::numeric, 89, 1.1, 22.8, 0.3, 2.6, 1),
    ('walnut', 'snacks', 'g'::public.measurement_unit, null::numeric, null::numeric, 654, 15.2, 13.7, 65.2, 6.7, 2),
    ('egg', 'dairy-eggs', 'piece'::public.measurement_unit, 50, null::numeric, 143, 12.6, 0.7, 9.5, 0, 142),
    ('tomato', 'produce', 'g'::public.measurement_unit, null::numeric, null::numeric, 18, 0.9, 3.9, 0.2, 1.2, 5),
    ('onion', 'produce', 'g'::public.measurement_unit, null::numeric, null::numeric, 40, 1.1, 9.3, 0.1, 1.7, 4),
    ('olive-oil', 'oils-sauces', 'ml'::public.measurement_unit, null::numeric, 0.91, 884, 0, 0, 100, 0, 2),
    ('whole-wheat-bread', 'bakery', 'g'::public.measurement_unit, null::numeric, null::numeric, 247, 13, 41, 4.2, 7, 430),
    ('chicken-breast', 'meat-poultry', 'g'::public.measurement_unit, null::numeric, null::numeric, 120, 22.5, 0, 2.6, 0, 45),
    ('white-rice', 'grains-pasta', 'g'::public.measurement_unit, null::numeric, null::numeric, 365, 7.1, 80, 0.7, 1.3, 5),
    ('bell-pepper', 'produce', 'g'::public.measurement_unit, null::numeric, null::numeric, 31, 1, 6, 0.3, 2.1, 4),
    ('carrot', 'produce', 'g'::public.measurement_unit, null::numeric, null::numeric, 41, 0.9, 9.6, 0.2, 2.8, 69),
    ('kidney-beans', 'grains-pasta', 'g'::public.measurement_unit, null::numeric, null::numeric, 333, 23.6, 60, 0.8, 24.9, 24),
    ('garlic', 'produce', 'g'::public.measurement_unit, null::numeric, null::numeric, 149, 6.4, 33.1, 0.5, 2.1, 17),
    ('coriander', 'produce', 'g'::public.measurement_unit, null::numeric, null::numeric, 23, 2.1, 3.7, 0.5, 2.8, 46),
    ('red-lentils', 'grains-pasta', 'g'::public.measurement_unit, null::numeric, null::numeric, 352, 24.6, 63.4, 1.1, 10.7, 6),
    ('potato', 'produce', 'g'::public.measurement_unit, null::numeric, null::numeric, 77, 2, 17.5, 0.1, 2.2, 6),
    ('trout', 'seafood', 'g'::public.measurement_unit, null::numeric, null::numeric, 148, 20.5, 0, 6.3, 0, 52),
    ('lemon', 'produce', 'g'::public.measurement_unit, null::numeric, null::numeric, 29, 1.1, 9.3, 0.3, 2.8, 2),
    ('cucumber', 'produce', 'g'::public.measurement_unit, null::numeric, null::numeric, 15, 0.7, 3.6, 0.1, 0.5, 2),
    ('parsley', 'produce', 'g'::public.measurement_unit, null::numeric, null::numeric, 36, 3, 6.3, 0.8, 3.3, 56),
    ('spinach', 'produce', 'g'::public.measurement_unit, null::numeric, null::numeric, 23, 2.9, 3.6, 0.4, 2.2, 79),
    ('salt', 'spices-seasonings', 'g'::public.measurement_unit, null::numeric, null::numeric, 0, 0, 0, 0, 0, 38758)
)
insert into public.ingredients (
  canonical_code,
  default_aisle_id,
  base_unit,
  grams_per_base_unit,
  density_g_per_ml,
  calories_per_100g,
  protein_g_per_100g,
  carbohydrate_g_per_100g,
  fat_g_per_100g,
  fiber_g_per_100g,
  sodium_mg_per_100g,
  nutrition_source,
  nutrition_verified_at
)
select
  ingredient_data.canonical_code,
  aisles.id,
  ingredient_data.base_unit,
  ingredient_data.grams_per_base_unit,
  ingredient_data.density_g_per_ml,
  ingredient_data.calories,
  ingredient_data.protein,
  ingredient_data.carbohydrate,
  ingredient_data.fat,
  ingredient_data.fiber,
  ingredient_data.sodium,
  'starter_reference_unverified',
  null
from ingredient_data
join public.aisles on aisles.slug = ingredient_data.aisle_slug
on conflict (canonical_code) do nothing;

with translations (canonical_code, locale, name, aliases) as (
  values
    ('rolled-oats', 'ka'::public.app_locale, 'შვრიის ფანტელი', array['შვრია']),
    ('rolled-oats', 'en'::public.app_locale, 'Rolled oats', array['oats']),
    ('milk', 'ka'::public.app_locale, 'რძე', array[]::text[]),
    ('milk', 'en'::public.app_locale, 'Milk', array[]::text[]),
    ('matsoni', 'ka'::public.app_locale, 'მაწონი', array[]::text[]),
    ('matsoni', 'en'::public.app_locale, 'Matsoni', array['yogurt']),
    ('banana', 'ka'::public.app_locale, 'ბანანი', array[]::text[]),
    ('banana', 'en'::public.app_locale, 'Banana', array[]::text[]),
    ('walnut', 'ka'::public.app_locale, 'ნიგოზი', array[]::text[]),
    ('walnut', 'en'::public.app_locale, 'Walnut', array[]::text[]),
    ('egg', 'ka'::public.app_locale, 'კვერცხი', array[]::text[]),
    ('egg', 'en'::public.app_locale, 'Egg', array[]::text[]),
    ('tomato', 'ka'::public.app_locale, 'პომიდორი', array[]::text[]),
    ('tomato', 'en'::public.app_locale, 'Tomato', array[]::text[]),
    ('onion', 'ka'::public.app_locale, 'ხახვი', array[]::text[]),
    ('onion', 'en'::public.app_locale, 'Onion', array[]::text[]),
    ('olive-oil', 'ka'::public.app_locale, 'ზეითუნის ზეთი', array[]::text[]),
    ('olive-oil', 'en'::public.app_locale, 'Olive oil', array[]::text[]),
    ('whole-wheat-bread', 'ka'::public.app_locale, 'მთლიანი მარცვლის პური', array['პური']),
    ('whole-wheat-bread', 'en'::public.app_locale, 'Whole-wheat bread', array['bread']),
    ('chicken-breast', 'ka'::public.app_locale, 'ქათმის ფილე', array[]::text[]),
    ('chicken-breast', 'en'::public.app_locale, 'Chicken breast', array[]::text[]),
    ('white-rice', 'ka'::public.app_locale, 'თეთრი ბრინჯი', array['ბრინჯი']),
    ('white-rice', 'en'::public.app_locale, 'White rice', array['rice']),
    ('bell-pepper', 'ka'::public.app_locale, 'ბულგარული წიწაკა', array[]::text[]),
    ('bell-pepper', 'en'::public.app_locale, 'Bell pepper', array[]::text[]),
    ('carrot', 'ka'::public.app_locale, 'სტაფილო', array[]::text[]),
    ('carrot', 'en'::public.app_locale, 'Carrot', array[]::text[]),
    ('kidney-beans', 'ka'::public.app_locale, 'წითელი ლობიო', array['ლობიო']),
    ('kidney-beans', 'en'::public.app_locale, 'Kidney beans', array['beans']),
    ('garlic', 'ka'::public.app_locale, 'ნიორი', array[]::text[]),
    ('garlic', 'en'::public.app_locale, 'Garlic', array[]::text[]),
    ('coriander', 'ka'::public.app_locale, 'ქინძი', array[]::text[]),
    ('coriander', 'en'::public.app_locale, 'Coriander', array['cilantro']),
    ('red-lentils', 'ka'::public.app_locale, 'წითელი ოსპი', array['ოსპი']),
    ('red-lentils', 'en'::public.app_locale, 'Red lentils', array['lentils']),
    ('potato', 'ka'::public.app_locale, 'კარტოფილი', array[]::text[]),
    ('potato', 'en'::public.app_locale, 'Potato', array[]::text[]),
    ('trout', 'ka'::public.app_locale, 'კალმახი', array[]::text[]),
    ('trout', 'en'::public.app_locale, 'Trout', array[]::text[]),
    ('lemon', 'ka'::public.app_locale, 'ლიმონი', array[]::text[]),
    ('lemon', 'en'::public.app_locale, 'Lemon', array[]::text[]),
    ('cucumber', 'ka'::public.app_locale, 'კიტრი', array[]::text[]),
    ('cucumber', 'en'::public.app_locale, 'Cucumber', array[]::text[]),
    ('parsley', 'ka'::public.app_locale, 'ოხრახუში', array[]::text[]),
    ('parsley', 'en'::public.app_locale, 'Parsley', array[]::text[]),
    ('spinach', 'ka'::public.app_locale, 'ისპანახი', array[]::text[]),
    ('spinach', 'en'::public.app_locale, 'Spinach', array[]::text[]),
    ('salt', 'ka'::public.app_locale, 'მარილი', array[]::text[]),
    ('salt', 'en'::public.app_locale, 'Salt', array[]::text[])
)
insert into public.ingredient_translations (ingredient_id, locale, name, aliases)
select ingredients.id, translations.locale, translations.name, translations.aliases
from translations
join public.ingredients on ingredients.canonical_code = translations.canonical_code
on conflict (ingredient_id, locale) do update
set name = excluded.name, aliases = excluded.aliases;

with allergen_map (canonical_code, allergen_slug) as (
  values
    ('rolled-oats', 'gluten'),
    ('milk', 'milk'),
    ('matsoni', 'milk'),
    ('walnut', 'tree-nuts'),
    ('egg', 'eggs'),
    ('whole-wheat-bread', 'gluten'),
    ('trout', 'fish')
)
insert into public.ingredient_allergens (ingredient_id, allergen_id, relation)
select ingredients.id, allergens.id, 'contains'
from allergen_map
join public.ingredients on ingredients.canonical_code = allergen_map.canonical_code
join public.allergens on allergens.slug = allergen_map.allergen_slug
on conflict (ingredient_id, allergen_id) do nothing;

insert into public.recipes (
  id,
  owner_user_id,
  origin,
  status,
  dietary_tags,
  base_servings,
  prep_minutes,
  cook_minutes
) values
  ('10000000-0000-4000-8000-000000000001', null, 'curated', 'published', array['vegetarian'], 2, 10, 0),
  ('10000000-0000-4000-8000-000000000002', null, 'curated', 'published', array['vegetarian'], 2, 10, 12),
  ('10000000-0000-4000-8000-000000000003', null, 'curated', 'published', array['omnivore', 'gluten-free', 'dairy-free'], 4, 15, 30),
  ('10000000-0000-4000-8000-000000000004', null, 'curated', 'published', array['vegan', 'vegetarian', 'gluten-free', 'dairy-free'], 4, 15, 75),
  ('10000000-0000-4000-8000-000000000005', null, 'curated', 'published', array['vegan', 'vegetarian', 'gluten-free', 'dairy-free'], 4, 10, 35),
  ('10000000-0000-4000-8000-000000000006', null, 'curated', 'published', array['pescatarian', 'gluten-free', 'dairy-free'], 2, 15, 30),
  ('10000000-0000-4000-8000-000000000007', null, 'curated', 'published', array['omnivore', 'gluten-free', 'dairy-free'], 4, 15, 40),
  ('10000000-0000-4000-8000-000000000008', null, 'curated', 'published', array['vegetarian', 'gluten-free'], 2, 10, 0)
on conflict (id) do nothing;

insert into public.recipe_translations (recipe_id, locale, title, description, tips) values
  ('10000000-0000-4000-8000-000000000001', 'ka', 'შვრიის ფაფა ბანანითა და ნიგვზით', 'წინასწარ მოსამზადებელი, ნოყიერი საუზმე.', 'მოამზადეთ წინა საღამოს.'),
  ('10000000-0000-4000-8000-000000000001', 'en', 'Overnight oats with banana and walnuts', 'A make-ahead, filling breakfast.', 'Prepare the night before.'),
  ('10000000-0000-4000-8000-000000000002', 'ka', 'კვერცხი პომიდვრითა და ისპანახით', 'სწრაფი ტაფის საუზმე ბოსტნეულით.', 'ისპანახი ბოლოს დაამატეთ.'),
  ('10000000-0000-4000-8000-000000000002', 'en', 'Tomato and spinach eggs', 'A quick vegetable-packed skillet breakfast.', 'Add spinach at the end.'),
  ('10000000-0000-4000-8000-000000000003', 'ka', 'ქათმისა და ბრინჯის ჯამი', 'მარტივი ქათამი, ბრინჯი და ბოსტნეული ერთი კვირისთვის.', 'ბრინჯი წინასწარ გარეცხეთ.'),
  ('10000000-0000-4000-8000-000000000003', 'en', 'Chicken rice bowl', 'Simple chicken, rice, and vegetables for meal prep.', 'Rinse the rice before cooking.'),
  ('10000000-0000-4000-8000-000000000004', 'ka', 'კლასიკური ლობიო', 'წითელი ლობიო ხახვით, ნიორითა და ქინძით.', 'ლობიო ღამით დაალბეთ.'),
  ('10000000-0000-4000-8000-000000000004', 'en', 'Classic Georgian lobio', 'Kidney beans with onion, garlic, and coriander.', 'Soak dried beans overnight.'),
  ('10000000-0000-4000-8000-000000000005', 'ka', 'წითელი ოსპის სუპი', 'ეკონომიური, მცენარეული და თბილი სადილი.', 'სისქე წყლით დაარეგულირეთ.'),
  ('10000000-0000-4000-8000-000000000005', 'en', 'Red lentil soup', 'An affordable, plant-based warming lunch.', 'Adjust thickness with water.'),
  ('10000000-0000-4000-8000-000000000006', 'ka', 'ღუმელში შემწვარი კალმახი და კარტოფილი', 'ლიმონიანი კალმახი ხრაშუნა კარტოფილით.', 'კალმახი არ გადააცხოთ.'),
  ('10000000-0000-4000-8000-000000000006', 'en', 'Baked trout with potatoes', 'Lemony trout with crisp potatoes.', 'Avoid overcooking the trout.'),
  ('10000000-0000-4000-8000-000000000007', 'ka', 'ქათამი და ბოსტნეული ერთ საცხობ ფირფიტაზე', 'მარტივი ოჯახური ვახშამი მინიმალური ჭურჭლით.', 'ბოსტნეული თანაბარ ზომად დაჭერით.'),
  ('10000000-0000-4000-8000-000000000007', 'en', 'One-tray chicken and vegetables', 'An easy family dinner with minimal washing up.', 'Cut vegetables to an even size.'),
  ('10000000-0000-4000-8000-000000000008', 'ka', 'კიტრისა და მაწვნის სალათი', 'გრილი, მსუბუქი სალათი მწვანილებით.', 'მიირთვით გაცივებული.'),
  ('10000000-0000-4000-8000-000000000008', 'en', 'Cucumber and matsoni salad', 'A cool, light salad with herbs.', 'Serve chilled.')
on conflict (recipe_id, locale) do update
set title = excluded.title, description = excluded.description, tips = excluded.tips;

with recipe_ingredient_data (recipe_id, canonical_code, position, quantity, unit, quantity_grams) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 'rolled-oats', 1, 100, 'g'::public.measurement_unit, 100),
    ('10000000-0000-4000-8000-000000000001'::uuid, 'milk', 2, 250, 'ml'::public.measurement_unit, 257.5),
    ('10000000-0000-4000-8000-000000000001'::uuid, 'banana', 3, 120, 'g'::public.measurement_unit, 120),
    ('10000000-0000-4000-8000-000000000001'::uuid, 'walnut', 4, 25, 'g'::public.measurement_unit, 25),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'egg', 1, 4, 'piece'::public.measurement_unit, 200),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'tomato', 2, 200, 'g'::public.measurement_unit, 200),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'spinach', 3, 100, 'g'::public.measurement_unit, 100),
    ('10000000-0000-4000-8000-000000000002'::uuid, 'olive-oil', 4, 10, 'ml'::public.measurement_unit, 9.1),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'chicken-breast', 1, 600, 'g'::public.measurement_unit, 600),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'white-rice', 2, 300, 'g'::public.measurement_unit, 300),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'bell-pepper', 3, 250, 'g'::public.measurement_unit, 250),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'carrot', 4, 200, 'g'::public.measurement_unit, 200),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'olive-oil', 5, 20, 'ml'::public.measurement_unit, 18.2),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'kidney-beans', 1, 400, 'g'::public.measurement_unit, 400),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'onion', 2, 200, 'g'::public.measurement_unit, 200),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'garlic', 3, 15, 'g'::public.measurement_unit, 15),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'coriander', 4, 30, 'g'::public.measurement_unit, 30),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'olive-oil', 5, 20, 'ml'::public.measurement_unit, 18.2),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'red-lentils', 1, 320, 'g'::public.measurement_unit, 320),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'onion', 2, 150, 'g'::public.measurement_unit, 150),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'carrot', 3, 200, 'g'::public.measurement_unit, 200),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'tomato', 4, 250, 'g'::public.measurement_unit, 250),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'olive-oil', 5, 15, 'ml'::public.measurement_unit, 13.65),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'trout', 1, 500, 'g'::public.measurement_unit, 500),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'potato', 2, 500, 'g'::public.measurement_unit, 500),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'lemon', 3, 100, 'g'::public.measurement_unit, 100),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'olive-oil', 4, 20, 'ml'::public.measurement_unit, 18.2),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'chicken-breast', 1, 700, 'g'::public.measurement_unit, 700),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'potato', 2, 600, 'g'::public.measurement_unit, 600),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'bell-pepper', 3, 250, 'g'::public.measurement_unit, 250),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'onion', 4, 200, 'g'::public.measurement_unit, 200),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'olive-oil', 5, 25, 'ml'::public.measurement_unit, 22.75),
    ('10000000-0000-4000-8000-000000000008'::uuid, 'cucumber', 1, 400, 'g'::public.measurement_unit, 400),
    ('10000000-0000-4000-8000-000000000008'::uuid, 'matsoni', 2, 300, 'g'::public.measurement_unit, 300),
    ('10000000-0000-4000-8000-000000000008'::uuid, 'garlic', 3, 8, 'g'::public.measurement_unit, 8),
    ('10000000-0000-4000-8000-000000000008'::uuid, 'coriander', 4, 20, 'g'::public.measurement_unit, 20)
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
  recipe_ingredient_data.recipe_id,
  ingredients.id,
  recipe_ingredient_data.position,
  recipe_ingredient_data.quantity,
  recipe_ingredient_data.unit,
  recipe_ingredient_data.quantity_grams
from recipe_ingredient_data
join public.ingredients on ingredients.canonical_code = recipe_ingredient_data.canonical_code
on conflict (recipe_id, position) do nothing;

with appliance_map (recipe_id, appliance_slug) as (
  values
    ('10000000-0000-4000-8000-000000000002'::uuid, 'stovetop'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 'stovetop'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 'stovetop'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 'stovetop'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 'oven'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 'oven')
)
insert into public.recipe_appliances (recipe_id, appliance_id, is_required)
select appliance_map.recipe_id, appliances.id, true
from appliance_map
join public.appliances on appliances.slug = appliance_map.appliance_slug
on conflict (recipe_id, appliance_id) do nothing;

with step_data (recipe_id, step_number, appliance_slug, duration_minutes, temperature_celsius) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 1, null::text, 5, null::smallint),
    ('10000000-0000-4000-8000-000000000001'::uuid, 2, null::text, 5, null::smallint),
    ('10000000-0000-4000-8000-000000000002'::uuid, 1, 'stovetop', 5, null::smallint),
    ('10000000-0000-4000-8000-000000000002'::uuid, 2, 'stovetop', 7, null::smallint),
    ('10000000-0000-4000-8000-000000000003'::uuid, 1, 'stovetop', 18, null::smallint),
    ('10000000-0000-4000-8000-000000000003'::uuid, 2, 'stovetop', 12, null::smallint),
    ('10000000-0000-4000-8000-000000000004'::uuid, 1, 'stovetop', 60, null::smallint),
    ('10000000-0000-4000-8000-000000000004'::uuid, 2, 'stovetop', 15, null::smallint),
    ('10000000-0000-4000-8000-000000000005'::uuid, 1, 'stovetop', 10, null::smallint),
    ('10000000-0000-4000-8000-000000000005'::uuid, 2, 'stovetop', 25, null::smallint),
    ('10000000-0000-4000-8000-000000000006'::uuid, 1, 'oven', 15, 210),
    ('10000000-0000-4000-8000-000000000006'::uuid, 2, 'oven', 15, 200),
    ('10000000-0000-4000-8000-000000000007'::uuid, 1, 'oven', 15, 210),
    ('10000000-0000-4000-8000-000000000007'::uuid, 2, 'oven', 25, 200),
    ('10000000-0000-4000-8000-000000000008'::uuid, 1, null::text, 5, null::smallint),
    ('10000000-0000-4000-8000-000000000008'::uuid, 2, null::text, 5, null::smallint)
)
insert into public.recipe_steps (
  recipe_id,
  step_number,
  appliance_id,
  duration_minutes,
  temperature_celsius
)
select step_data.recipe_id, step_data.step_number, appliances.id, step_data.duration_minutes, step_data.temperature_celsius
from step_data
left join public.appliances on appliances.slug = step_data.appliance_slug
on conflict (recipe_id, step_number) do nothing;

with step_translations (recipe_id, step_number, locale, instruction) as (
  values
    ('10000000-0000-4000-8000-000000000001'::uuid, 1, 'ka'::public.app_locale, 'შვრია და რძე აურიეთ, დააფარეთ და მაცივარში დატოვეთ.'),
    ('10000000-0000-4000-8000-000000000001'::uuid, 1, 'en'::public.app_locale, 'Mix the oats and milk, cover, and refrigerate.'),
    ('10000000-0000-4000-8000-000000000001'::uuid, 2, 'ka'::public.app_locale, 'დილით დაუმატეთ დაჭრილი ბანანი და ნიგოზი.'),
    ('10000000-0000-4000-8000-000000000001'::uuid, 2, 'en'::public.app_locale, 'Top with sliced banana and walnuts in the morning.'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 1, 'ka'::public.app_locale, 'ზეთში დარბილებამდე მოშუშეთ პომიდორი.'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 1, 'en'::public.app_locale, 'Cook the tomato in oil until softened.'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 2, 'ka'::public.app_locale, 'დაუმატეთ კვერცხი და ისპანახი; დაბალ ცეცხლზე მოამზადეთ.'),
    ('10000000-0000-4000-8000-000000000002'::uuid, 2, 'en'::public.app_locale, 'Add the eggs and spinach; cook gently until set.'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 1, 'ka'::public.app_locale, 'ბრინჯი წყალში დარბილებამდე მოხარშეთ.'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 1, 'en'::public.app_locale, 'Simmer the rice in water until tender.'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 2, 'ka'::public.app_locale, 'ქათამი და ბოსტნეული ზეთში შეწვით და ბრინჯთან ერთად გაანაწილეთ.'),
    ('10000000-0000-4000-8000-000000000003'::uuid, 2, 'en'::public.app_locale, 'Sauté the chicken and vegetables in oil and portion over the rice.'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 1, 'ka'::public.app_locale, 'დალბობილი ლობიო ახალ წყალში სრულ დარბილებამდე მოხარშეთ.'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 1, 'en'::public.app_locale, 'Simmer the soaked beans in fresh water until completely tender.'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 2, 'ka'::public.app_locale, 'ხახვი და ნიორი მოშუშეთ, ლობიოს შეურიეთ და ქინძი დაამატეთ.'),
    ('10000000-0000-4000-8000-000000000004'::uuid, 2, 'en'::public.app_locale, 'Sauté onion and garlic, fold into the beans, and finish with coriander.'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 1, 'ka'::public.app_locale, 'ხახვი და სტაფილო ზეთში დარბილებამდე მოშუშეთ.'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 1, 'en'::public.app_locale, 'Soften the onion and carrot in oil.'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 2, 'ka'::public.app_locale, 'დაუმატეთ ოსპი, პომიდორი და წყალი; 25 წუთი ხარშეთ.'),
    ('10000000-0000-4000-8000-000000000005'::uuid, 2, 'en'::public.app_locale, 'Add lentils, tomato, and water; simmer for 25 minutes.'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 1, 'ka'::public.app_locale, 'კარტოფილი ზეთით აურიეთ და 210°C-ზე 15 წუთი გამოაცხვეთ.'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 1, 'en'::public.app_locale, 'Toss potatoes with oil and roast at 210°C for 15 minutes.'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 2, 'ka'::public.app_locale, 'დაამატეთ კალმახი და ლიმონი; 200°C-ზე კიდევ 15 წუთი გამოაცხვეთ.'),
    ('10000000-0000-4000-8000-000000000006'::uuid, 2, 'en'::public.app_locale, 'Add the trout and lemon; bake at 200°C for another 15 minutes.'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 1, 'ka'::public.app_locale, 'ქათამი და დაჭრილი ბოსტნეული ზეთით აურიეთ.'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 1, 'en'::public.app_locale, 'Toss the chicken and chopped vegetables with oil.'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 2, 'ka'::public.app_locale, 'ერთ ფენად გაანაწილეთ და 200°C-ზე სრულ მომზადებამდე გამოაცხვეთ.'),
    ('10000000-0000-4000-8000-000000000007'::uuid, 2, 'en'::public.app_locale, 'Spread in one layer and roast at 200°C until fully cooked.'),
    ('10000000-0000-4000-8000-000000000008'::uuid, 1, 'ka'::public.app_locale, 'კიტრი წვრილად დაჭერით და მაწონს შეურიეთ.'),
    ('10000000-0000-4000-8000-000000000008'::uuid, 1, 'en'::public.app_locale, 'Finely chop the cucumber and stir into the matsoni.'),
    ('10000000-0000-4000-8000-000000000008'::uuid, 2, 'ka'::public.app_locale, 'ნიორი და ქინძი დაამატეთ, შემდეგ გააცივეთ.'),
    ('10000000-0000-4000-8000-000000000008'::uuid, 2, 'en'::public.app_locale, 'Add garlic and coriander, then chill before serving.')
)
insert into public.recipe_step_translations (recipe_step_id, locale, instruction)
select recipe_steps.id, step_translations.locale, step_translations.instruction
from step_translations
join public.recipe_steps
  on recipe_steps.recipe_id = step_translations.recipe_id
  and recipe_steps.step_number = step_translations.step_number
on conflict (recipe_step_id, locale) do update set instruction = excluded.instruction;

with nutrition as (
  select
    recipe_ingredients.recipe_id,
    sum(ingredients.calories_per_100g * recipe_ingredients.quantity_grams / 100) as calories,
    sum(ingredients.protein_g_per_100g * recipe_ingredients.quantity_grams / 100) as protein,
    sum(ingredients.carbohydrate_g_per_100g * recipe_ingredients.quantity_grams / 100) as carbohydrate,
    sum(ingredients.fat_g_per_100g * recipe_ingredients.quantity_grams / 100) as fat,
    sum(ingredients.fiber_g_per_100g * recipe_ingredients.quantity_grams / 100) as fiber
  from public.recipe_ingredients
  join public.ingredients on ingredients.id = recipe_ingredients.ingredient_id
  where recipe_ingredients.recipe_id::text like '10000000-0000-4000-8000-%'
  group by recipe_ingredients.recipe_id
)
update public.recipes
set calories_per_serving = round(nutrition.calories / recipes.base_servings, 2),
    protein_g_per_serving = round(nutrition.protein / recipes.base_servings, 2),
    carbohydrate_g_per_serving = round(nutrition.carbohydrate / recipes.base_servings, 2),
    fat_g_per_serving = round(nutrition.fat / recipes.base_servings, 2),
    fiber_g_per_serving = round(nutrition.fiber / recipes.base_servings, 2),
    nutrition_status = 'calculated'
from nutrition
where recipes.id = nutrition.recipe_id;

-- A few timestamped government-catalogue observations make pricing behavior testable.
insert into public.store_pricing (
  store_id,
  ingredient_id,
  external_product_id,
  product_name_ka,
  product_name_en,
  package_quantity,
  package_unit,
  equivalent_grams,
  price_gel,
  observed_at,
  source,
  source_url
)
select stores.id, ingredients.id, pricing.external_product_id, pricing.name_ka, pricing.name_en,
  pricing.package_quantity, pricing.package_unit, pricing.equivalent_grams, pricing.price_gel,
  '2026-08-29T00:00:00+04:00'::timestamptz, 'government'::public.pricing_source, pricing.source_url
from (
  values
    ('ori-nabiji', 'milk', 'ekalata-ori-milk-1l', 'რძე 2.2% 1ლ', 'Milk 2.2% 1 L', 1::numeric, 'l'::public.measurement_unit, 1030::numeric, 2.85::numeric, 'https://ekalata.gov.ge/en/stores/ori-nabiji'),
    ('ori-nabiji', 'chicken-breast', 'ekalata-ori-chicken-1kg', 'გაყინული ქათმის ფილე 1კგ', 'Frozen chicken fillet 1 kg', 1::numeric, 'kg'::public.measurement_unit, 1000::numeric, 8.99::numeric, 'https://ekalata.gov.ge/en/stores/ori-nabiji'),
    ('nikora', 'egg', 'ekalata-nikora-eggs-10', 'კვერცხი 10 ცალი', 'Eggs, 10 pieces', 10::numeric, 'piece'::public.measurement_unit, 500::numeric, 4.99::numeric, 'https://www.ekalata.gov.ge/en/stores/nikora'),
    ('nikora', 'white-rice', 'ekalata-nikora-rice-900g', 'გრძელმარცვლოვანი ბრინჯი 900გ', 'Long-grain rice 900 g', 900::numeric, 'g'::public.measurement_unit, 900::numeric, 2.70::numeric, 'https://www.ekalata.gov.ge/en/stores/nikora')
) as pricing(store_slug, ingredient_code, external_product_id, name_ka, name_en, package_quantity, package_unit, equivalent_grams, price_gel, source_url)
join public.stores on stores.slug = pricing.store_slug
join public.ingredients on ingredients.canonical_code = pricing.ingredient_code
on conflict do nothing;
