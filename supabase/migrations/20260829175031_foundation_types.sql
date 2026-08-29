-- Core extensions, internal helpers, and stable domain enums for Sufra.
create extension if not exists pgcrypto with schema extensions;

create schema if not exists private;
revoke all on schema private from public, anon, authenticated;

create type public.app_locale as enum ('ka', 'en');
create type public.budget_period as enum ('daily', 'weekly');
create type public.meal_slot as enum ('breakfast', 'lunch', 'dinner', 'snack');
create type public.plan_status as enum ('generating', 'ready', 'failed', 'archived');
create type public.generation_job_status as enum ('queued', 'running', 'succeeded', 'failed');
create type public.recipe_origin as enum ('curated', 'user', 'ai');
create type public.measurement_unit as enum (
  'g',
  'kg',
  'ml',
  'l',
  'tsp',
  'tbsp',
  'cup',
  'piece',
  'pack'
);
create type public.ingredient_preference as enum ('love', 'like', 'neutral', 'dislike', 'avoid');
create type public.pricing_source as enum ('manual', 'retailer', 'government', 'partner');

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

revoke execute on function private.set_updated_at() from public, anon, authenticated;
