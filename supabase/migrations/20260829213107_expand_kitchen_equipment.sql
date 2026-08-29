-- Expand onboarding from major appliances to the cooking and preparation
-- equipment a user actually has available at home.
insert into public.appliances (slug) values
  ('basic-kitchen-tools'),
  ('electric-kettle'),
  ('toaster'),
  ('sandwich-press'),
  ('hand-mixer'),
  ('stand-mixer')
on conflict (slug) do update set is_active = true;

with translations (slug, locale, name) as (
  values
    (
      'basic-kitchen-tools',
      'ka'::public.app_locale,
      'ძირითადი ინვენტარი (დანა, დაფა, ქვაბი, ტაფა)'
    ),
    (
      'basic-kitchen-tools',
      'en'::public.app_locale,
      'Basic tools (knife, board, pots & pans)'
    ),
    ('electric-kettle', 'ka'::public.app_locale, 'ელექტრო ჩაიდანი'),
    ('electric-kettle', 'en'::public.app_locale, 'Electric Kettle'),
    ('toaster', 'ka'::public.app_locale, 'ტოსტერი'),
    ('toaster', 'en'::public.app_locale, 'Toaster'),
    ('sandwich-press', 'ka'::public.app_locale, 'სენდვიჩის აპარატი'),
    ('sandwich-press', 'en'::public.app_locale, 'Sandwich Press'),
    ('hand-mixer', 'ka'::public.app_locale, 'ხელის მიქსერი'),
    ('hand-mixer', 'en'::public.app_locale, 'Hand Mixer'),
    ('stand-mixer', 'ka'::public.app_locale, 'სტაციონარული მიქსერი'),
    ('stand-mixer', 'en'::public.app_locale, 'Stand Mixer'),
    ('stovetop', 'ka'::public.app_locale, 'ქურა / გაზქურა'),
    ('stovetop', 'en'::public.app_locale, 'Stovetop / gas cooker'),
    ('instant-pot', 'ka'::public.app_locale, 'წნევის / მულტიფუნქციური ქვაბი'),
    ('instant-pot', 'en'::public.app_locale, 'Pressure Cooker / Instant Pot')
)
insert into public.appliance_translations (appliance_id, locale, name)
select appliances.id, translations.locale, translations.name
from translations
join public.appliances on appliances.slug = translations.slug
on conflict (appliance_id, locale) do update set name = excluded.name;
