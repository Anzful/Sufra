-- Bilingual Georgia-first reference data. Product and nutrition datasets are loaded separately.
insert into public.stores (slug, kind) values
  ('carrefour', 'hypermarket'),
  ('nikora', 'supermarket'),
  ('ori-nabiji', 'supermarket'),
  ('spar', 'supermarket'),
  ('goodwill', 'hypermarket'),
  ('agrohub', 'hypermarket'),
  ('fresco', 'supermarket'),
  ('libre', 'supermarket'),
  ('magniti', 'supermarket'),
  ('daily', 'supermarket'),
  ('universami', 'supermarket'),
  ('zgapari', 'supermarket'),
  ('gvirila', 'market_chain'),
  ('kalata', 'supermarket'),
  ('ambari', 'hypermarket')
on conflict (slug) do update set kind = excluded.kind, is_active = true;

with translations (slug, locale, name) as (
  values
    ('carrefour', 'ka'::public.app_locale, 'კარფური'),
    ('carrefour', 'en'::public.app_locale, 'Carrefour'),
    ('nikora', 'ka'::public.app_locale, 'ნიკორა'),
    ('nikora', 'en'::public.app_locale, 'Nikora'),
    ('ori-nabiji', 'ka'::public.app_locale, 'ორი ნაბიჯი'),
    ('ori-nabiji', 'en'::public.app_locale, 'Ori Nabiji'),
    ('spar', 'ka'::public.app_locale, 'სპარი'),
    ('spar', 'en'::public.app_locale, 'SPAR'),
    ('goodwill', 'ka'::public.app_locale, 'გუდვილი'),
    ('goodwill', 'en'::public.app_locale, 'Goodwill'),
    ('agrohub', 'ka'::public.app_locale, 'აგროჰაბი'),
    ('agrohub', 'en'::public.app_locale, 'Agrohub'),
    ('fresco', 'ka'::public.app_locale, 'ფრესკო'),
    ('fresco', 'en'::public.app_locale, 'Fresco'),
    ('libre', 'ka'::public.app_locale, 'ლიბრე'),
    ('libre', 'en'::public.app_locale, 'Libre'),
    ('magniti', 'ka'::public.app_locale, 'მაგნიტი'),
    ('magniti', 'en'::public.app_locale, 'Magniti'),
    ('daily', 'ka'::public.app_locale, 'დეილი'),
    ('daily', 'en'::public.app_locale, 'Daily'),
    ('universami', 'ka'::public.app_locale, 'უნივერსამი'),
    ('universami', 'en'::public.app_locale, 'Universami'),
    ('zgapari', 'ka'::public.app_locale, 'ზღაპარი'),
    ('zgapari', 'en'::public.app_locale, 'Zgapari'),
    ('gvirila', 'ka'::public.app_locale, 'გვირილა'),
    ('gvirila', 'en'::public.app_locale, 'Gvirila'),
    ('kalata', 'ka'::public.app_locale, 'კალათა'),
    ('kalata', 'en'::public.app_locale, 'Kalata'),
    ('ambari', 'ka'::public.app_locale, 'ამბარი'),
    ('ambari', 'en'::public.app_locale, 'Ambari')
)
insert into public.store_translations (store_id, locale, name)
select stores.id, translations.locale, translations.name
from translations
join public.stores on stores.slug = translations.slug
on conflict (store_id, locale) do update set name = excluded.name;

insert into public.appliances (slug) values
  ('stovetop'),
  ('oven'),
  ('air-fryer'),
  ('slow-cooker'),
  ('blender'),
  ('instant-pot'),
  ('microwave'),
  ('grill'),
  ('food-processor'),
  ('rice-cooker')
on conflict (slug) do update set is_active = true;

with translations (slug, locale, name) as (
  values
    ('stovetop', 'ka'::public.app_locale, 'ქურა'),
    ('stovetop', 'en'::public.app_locale, 'Stovetop'),
    ('oven', 'ka'::public.app_locale, 'ღუმელი'),
    ('oven', 'en'::public.app_locale, 'Oven'),
    ('air-fryer', 'ka'::public.app_locale, 'აეროგრილი'),
    ('air-fryer', 'en'::public.app_locale, 'Air Fryer'),
    ('slow-cooker', 'ka'::public.app_locale, 'ნელი მოსამზადებელი ქვაბი'),
    ('slow-cooker', 'en'::public.app_locale, 'Slow Cooker'),
    ('blender', 'ka'::public.app_locale, 'ბლენდერი'),
    ('blender', 'en'::public.app_locale, 'Blender'),
    ('instant-pot', 'ka'::public.app_locale, 'მულტიფუნქციური წნევის ქვაბი'),
    ('instant-pot', 'en'::public.app_locale, 'Instant Pot'),
    ('microwave', 'ka'::public.app_locale, 'მიკროტალღური ღუმელი'),
    ('microwave', 'en'::public.app_locale, 'Microwave'),
    ('grill', 'ka'::public.app_locale, 'გრილი'),
    ('grill', 'en'::public.app_locale, 'Grill'),
    ('food-processor', 'ka'::public.app_locale, 'სამზარეულოს კომბაინი'),
    ('food-processor', 'en'::public.app_locale, 'Food Processor'),
    ('rice-cooker', 'ka'::public.app_locale, 'ბრინჯის მოსამზადებელი'),
    ('rice-cooker', 'en'::public.app_locale, 'Rice Cooker')
)
insert into public.appliance_translations (appliance_id, locale, name)
select appliances.id, translations.locale, translations.name
from translations
join public.appliances on appliances.slug = translations.slug
on conflict (appliance_id, locale) do update set name = excluded.name;

insert into public.dietary_patterns (slug) values
  ('omnivore'),
  ('vegetarian'),
  ('vegan'),
  ('pescatarian'),
  ('mediterranean'),
  ('low-carb'),
  ('keto'),
  ('paleo'),
  ('gluten-free'),
  ('dairy-free')
on conflict (slug) do update set is_active = true;

with translations (slug, locale, name) as (
  values
    ('omnivore', 'ka'::public.app_locale, 'შერეული კვება'),
    ('omnivore', 'en'::public.app_locale, 'Omnivore'),
    ('vegetarian', 'ka'::public.app_locale, 'ვეგეტარიანული'),
    ('vegetarian', 'en'::public.app_locale, 'Vegetarian'),
    ('vegan', 'ka'::public.app_locale, 'ვეგანური'),
    ('vegan', 'en'::public.app_locale, 'Vegan'),
    ('pescatarian', 'ka'::public.app_locale, 'პესკეტარიანული'),
    ('pescatarian', 'en'::public.app_locale, 'Pescatarian'),
    ('mediterranean', 'ka'::public.app_locale, 'ხმელთაშუაზღვის'),
    ('mediterranean', 'en'::public.app_locale, 'Mediterranean'),
    ('low-carb', 'ka'::public.app_locale, 'დაბალნახშირწყლოვანი'),
    ('low-carb', 'en'::public.app_locale, 'Low Carb'),
    ('keto', 'ka'::public.app_locale, 'კეტო'),
    ('keto', 'en'::public.app_locale, 'Keto'),
    ('paleo', 'ka'::public.app_locale, 'პალეო'),
    ('paleo', 'en'::public.app_locale, 'Paleo'),
    ('gluten-free', 'ka'::public.app_locale, 'უგლუტენო'),
    ('gluten-free', 'en'::public.app_locale, 'Gluten Free'),
    ('dairy-free', 'ka'::public.app_locale, 'რძის პროდუქტების გარეშე'),
    ('dairy-free', 'en'::public.app_locale, 'Dairy Free')
)
insert into public.dietary_pattern_translations (dietary_pattern_id, locale, name)
select dietary_patterns.id, translations.locale, translations.name
from translations
join public.dietary_patterns on dietary_patterns.slug = translations.slug
on conflict (dietary_pattern_id, locale) do update set name = excluded.name;

insert into public.allergens (slug) values
  ('gluten'),
  ('crustaceans'),
  ('eggs'),
  ('fish'),
  ('peanuts'),
  ('soy'),
  ('milk'),
  ('tree-nuts'),
  ('celery'),
  ('mustard'),
  ('sesame'),
  ('sulfites'),
  ('lupin'),
  ('molluscs')
on conflict (slug) do update set is_active = true;

with translations (slug, locale, name) as (
  values
    ('gluten', 'ka'::public.app_locale, 'გლუტენის შემცველი მარცვლეული'),
    ('gluten', 'en'::public.app_locale, 'Gluten-containing cereals'),
    ('crustaceans', 'ka'::public.app_locale, 'კიბოსნაირები'),
    ('crustaceans', 'en'::public.app_locale, 'Crustaceans'),
    ('eggs', 'ka'::public.app_locale, 'კვერცხი'),
    ('eggs', 'en'::public.app_locale, 'Eggs'),
    ('fish', 'ka'::public.app_locale, 'თევზი'),
    ('fish', 'en'::public.app_locale, 'Fish'),
    ('peanuts', 'ka'::public.app_locale, 'მიწის თხილი'),
    ('peanuts', 'en'::public.app_locale, 'Peanuts'),
    ('soy', 'ka'::public.app_locale, 'სოია'),
    ('soy', 'en'::public.app_locale, 'Soy'),
    ('milk', 'ka'::public.app_locale, 'რძე'),
    ('milk', 'en'::public.app_locale, 'Milk'),
    ('tree-nuts', 'ka'::public.app_locale, 'კაკლოვანი პროდუქტები'),
    ('tree-nuts', 'en'::public.app_locale, 'Tree nuts'),
    ('celery', 'ka'::public.app_locale, 'ნიახური'),
    ('celery', 'en'::public.app_locale, 'Celery'),
    ('mustard', 'ka'::public.app_locale, 'მდოგვი'),
    ('mustard', 'en'::public.app_locale, 'Mustard'),
    ('sesame', 'ka'::public.app_locale, 'სეზამი'),
    ('sesame', 'en'::public.app_locale, 'Sesame'),
    ('sulfites', 'ka'::public.app_locale, 'გოგირდის დიოქსიდი და სულფიტები'),
    ('sulfites', 'en'::public.app_locale, 'Sulphur dioxide and sulphites'),
    ('lupin', 'ka'::public.app_locale, 'ლუპინი'),
    ('lupin', 'en'::public.app_locale, 'Lupin'),
    ('molluscs', 'ka'::public.app_locale, 'მოლუსკები'),
    ('molluscs', 'en'::public.app_locale, 'Molluscs')
)
insert into public.allergen_translations (allergen_id, locale, name)
select allergens.id, translations.locale, translations.name
from translations
join public.allergens on allergens.slug = translations.slug
on conflict (allergen_id, locale) do update set name = excluded.name;

insert into public.aisles (slug, sort_order) values
  ('produce', 10),
  ('bakery', 20),
  ('meat-poultry', 30),
  ('seafood', 40),
  ('dairy-eggs', 50),
  ('grains-pasta', 60),
  ('canned-jarred', 70),
  ('oils-sauces', 80),
  ('spices-seasonings', 90),
  ('frozen', 100),
  ('snacks', 110),
  ('beverages', 120),
  ('household', 130),
  ('other', 999)
on conflict (slug) do update set sort_order = excluded.sort_order, is_active = true;

with translations (slug, locale, name) as (
  values
    ('produce', 'ka'::public.app_locale, 'ხილი და ბოსტნეული'),
    ('produce', 'en'::public.app_locale, 'Fruit & Vegetables'),
    ('bakery', 'ka'::public.app_locale, 'პური და საცხობი'),
    ('bakery', 'en'::public.app_locale, 'Bakery'),
    ('meat-poultry', 'ka'::public.app_locale, 'ხორცი და ფრინველი'),
    ('meat-poultry', 'en'::public.app_locale, 'Meat & Poultry'),
    ('seafood', 'ka'::public.app_locale, 'თევზი და ზღვის პროდუქტები'),
    ('seafood', 'en'::public.app_locale, 'Fish & Seafood'),
    ('dairy-eggs', 'ka'::public.app_locale, 'რძის პროდუქტები და კვერცხი'),
    ('dairy-eggs', 'en'::public.app_locale, 'Dairy & Eggs'),
    ('grains-pasta', 'ka'::public.app_locale, 'ბურღულეული და მაკარონი'),
    ('grains-pasta', 'en'::public.app_locale, 'Grains & Pasta'),
    ('canned-jarred', 'ka'::public.app_locale, 'კონსერვები'),
    ('canned-jarred', 'en'::public.app_locale, 'Canned & Jarred'),
    ('oils-sauces', 'ka'::public.app_locale, 'ზეთები და სოუსები'),
    ('oils-sauces', 'en'::public.app_locale, 'Oils & Sauces'),
    ('spices-seasonings', 'ka'::public.app_locale, 'სანელებლები'),
    ('spices-seasonings', 'en'::public.app_locale, 'Spices & Seasonings'),
    ('frozen', 'ka'::public.app_locale, 'გაყინული პროდუქტები'),
    ('frozen', 'en'::public.app_locale, 'Frozen'),
    ('snacks', 'ka'::public.app_locale, 'სნექები'),
    ('snacks', 'en'::public.app_locale, 'Snacks'),
    ('beverages', 'ka'::public.app_locale, 'სასმელები'),
    ('beverages', 'en'::public.app_locale, 'Beverages'),
    ('household', 'ka'::public.app_locale, 'საყოფაცხოვრებო'),
    ('household', 'en'::public.app_locale, 'Household'),
    ('other', 'ka'::public.app_locale, 'სხვა'),
    ('other', 'en'::public.app_locale, 'Other')
)
insert into public.aisle_translations (aisle_id, locale, name)
select aisles.id, translations.locale, translations.name
from translations
join public.aisles on aisles.slug = translations.slug
on conflict (aisle_id, locale) do update set name = excluded.name;
