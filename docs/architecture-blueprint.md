# Sufra / სუფრა — execution blueprint

Status: Phase 0 complete (research, target architecture, schema, RLS, and Georgia-first reference data). Application and Edge Function code intentionally waits for product confirmation.

## Product position

Sufra is a bilingual Georgian/English weekly meal planner that optimizes four things together: household tastes and safety, nutrition targets, cooking constraints, and a GEL grocery budget at a preferred Georgian supermarket.

The product promise should be phrased as an estimate, not medical advice or a guaranteed checkout price. Nutrition is calculated from verified ingredient records; prices are timestamped observations and can differ by branch or promotion.

## What established products do

- Mealime collects diet, calories/macros, allergies, likes/dislikes, household size, prep time, budget per serving, and sodium preferences.
- Eat This Much asks for body/health goals or direct calorie and macro targets, then generates the plan and consolidates ingredients. Its pantry, serving changes, and meal swaps immediately update the grocery list.
- Samsung Food supports diets, allergies, avoidances, dislikes, daily macro views, drag/drop planning, notes, recurring meals, and one-tap conversion from a plan to a shopping list.
- Sorted Sidekick emphasizes serving scaling, guided cooking, shared ingredients across a recipe pack, and food-waste reduction.

The lesson for Sufra is that onboarding data alone is not enough. A useful planner also needs fast meal swaps, serving changes, pantry deductions, leftovers, and deterministic list recalculation.

Research sources:

- [Mealime personalization](https://work.mealime.com/personalization)
- [Eat This Much meal planning and grocery lists](https://www.eatthismuch.com/meal-planning-with-grocery-list)
- [Samsung Food meal planner](https://samsungfood.com/meal-planner/)
- [Sorted Sidekick features](https://help.sortedfood.com/hc/en-gb/articles/4638394094482-What-do-I-get-from-Sidekick)
- [Sorted dietary requirements and dislikes](https://help.sortedfood.com/hc/en-gb/articles/8822343840540-How-do-I-add-my-cooking-preferences-Dietary-requirements-and-dislikes)

## Recommended onboarding

Ask one decision per screen and show why it matters. Hard safety constraints must be visually separated from preferences.

1. Language: ქართული or English. Georgian is the default for the Georgia launch.
2. Household: people served, meals per day, whether leftovers are welcome, and whether batch cooking is acceptable.
3. Allergies: EU-style allergen list with `avoid` and `trace-sensitive` severity. This is a hard exclusion.
4. Diet: omnivore, vegetarian, vegan, pescatarian, Mediterranean, low-carb, keto, paleo, gluten-free, or dairy-free.
5. Tastes: loved, liked, disliked, and strictly avoided ingredients. Include Georgian staples and dishes in search suggestions.
6. Location and store: city, preferred chain, and later an optional branch. Initial chains are sourced from the Georgian government comparison catalogue.
7. Budget: daily or weekly ceiling in GEL. Clarify whether the budget covers one person or the whole household; Sufra stores household budget.
8. Nutrition: direct daily calories and protein/carbohydrate/fat/fiber targets. A later optional calculator can accept temporary age/height/weight/activity inputs and persist only the derived targets, reducing sensitive-data retention.
9. Cooking: maximum active/cook time and available appliances.
10. Pantry: items already owned, quantities, and optional expiry dates.
11. Review: show the constraints Sufra will never violate and the softer preferences it may trade off to meet budget.

For the first release, onboarding is complete when language, household size, store, budget, calorie target, allergy confirmation (including “none”), diet, and appliances are known. Macro targets and pantry input can be skipped but should improve the result.

## Georgia-first pricing

The government-backed eKalata catalogue currently compares offers across chains including Agrohub, Carrefour, Daily, Goodwill, Gvirila, Kalata, Libre, Magniti, Nikora, Ori Nabiji, SPAR, Universami, and Zgapari. The schema seeds these plus Fresco and Ambari as selectable chains. Before automated ingestion, confirm eKalata and retailer API/usage terms; the database records source, URL, observation time, promotion validity, package size, and normalized ingredient mapping.

- [eKalata supermarket comparison](https://ekalata.gov.ge/en)
- [Example Ori Nabiji offer catalogue](https://ekalata.gov.ge/en/stores/ori-nabiji)
- [Example Nikora offer catalogue](https://www.ekalata.gov.ge/en/stores/nikora)

## Monorepo target

```text
Sufra/
├── apps/
│   ├── web/
│   │   ├── app/
│   │   │   ├── [locale]/
│   │   │   │   ├── (auth)/{sign-in,sign-up}/page.tsx
│   │   │   │   ├── (onboarding)/onboarding/{layout,page}.tsx
│   │   │   │   └── (app)/{dashboard,plan,recipes,grocery-list,settings}/
│   │   │   ├── api/{health,webhooks}/route.ts
│   │   │   ├── actions/{profile,plan,grocery-list}.ts
│   │   │   ├── layout.tsx
│   │   │   └── globals.css
│   │   ├── components/{auth,onboarding,plan,recipe,grocery,ui}/
│   │   ├── lib/{i18n,supabase,server,env}/
│   │   ├── messages/{ka,en}.json
│   │   ├── middleware.ts
│   │   ├── next.config.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── mobile/
│       ├── app/
│       │   ├── (auth)/{sign-in,sign-up}.tsx
│       │   ├── (onboarding)/{index,allergies,budget,nutrition,appliances,review}.tsx
│       │   ├── (tabs)/{index,plan,grocery,settings}.tsx
│       │   ├── recipe/[id].tsx
│       │   └── _layout.tsx
│       ├── components/{auth,onboarding,plan,recipe,grocery,ui}/
│       ├── lib/{i18n,supabase,storage,env}/
│       ├── messages/{ka,en}.json
│       ├── app.config.ts
│       ├── package.json
│       └── tsconfig.json
├── packages/
│   └── shared/
│       ├── src/
│       │   ├── api/
│       │   │   ├── contracts/{profile,plan,grocery-list}.ts
│       │   │   └── client.ts
│       │   ├── database/{database.types,mappers}.ts
│       │   ├── domain/{profile,recipe,plan,grocery,pricing}.ts
│       │   ├── schemas/{profile,recipe,meal-plan,grocery-list}.ts
│       │   ├── logic/{nutrition,units,grocery-consolidation,budget,plan-validation}/
│       │   ├── i18n/{constants,formatters}.ts
│       │   ├── constants/{allergens,appliances,stores}.ts
│       │   └── index.ts
│       ├── package.json
│       ├── tsconfig.json
│       └── vitest.config.ts
├── supabase/
│   ├── functions/
│   │   ├── _shared/{auth,cors,errors,ai-provider,prompt,schemas,persistence}.ts
│   │   ├── generate-weekly-plan/index.ts
│   │   ├── regenerate-meal/index.ts
│   │   └── refresh-store-pricing/index.ts
│   ├── migrations/
│   │   ├── 20260829175031_foundation_types.sql
│   │   ├── 20260829175036_identity_preferences.sql
│   │   ├── 20260829175040_recipe_catalog.sql
│   │   ├── 20260829175044_plans_groceries_pricing.sql
│   │   ├── 20260829175047_rls_grants.sql
│   │   └── 20260829175050_reference_data.sql
│   ├── tests/{rls,functions}/
│   ├── config.toml
│   └── seed.sql
├── tooling/{eslint,typescript}/
├── docs/{architecture-blueprint,api-contracts,pricing-data-policy}.md
├── .github/workflows/{ci,database}.yml
├── package.json
├── pnpm-workspace.yaml
├── turbo.json
└── tsconfig.json
```

Expo Router is the mobile routing choice because it is built on React Navigation and gives the mobile app a file-based structure parallel to the Next.js App Router.

## Service boundaries

```text
Web / Expo client
  ├── Supabase Auth
  ├── RLS-scoped reads and preference/pantry writes
  └── authenticated Edge Function invocation
        └── generation orchestrator
              ├── candidate ingredient/recipe retrieval
              ├── OpenAI Responses API or Anthropic provider adapter
              ├── strict structured-output validation
              ├── deterministic nutrition/unit/price calculation
              ├── constraint validator and bounded repair pass
              └── transactional persistence of plan + grocery list
```

AI proposes recipe composition and scheduling. It does not author authoritative macro or price totals. The backend maps model output to known ingredient IDs, converts every amount to normalized quantities, calculates nutrition from verified per-100g records, consolidates the grocery list, subtracts pantry stock, rounds to store package sizes, and computes the current estimate. Unknown ingredients, allergen conflicts, unavailable appliances, and out-of-tolerance results fail validation.

For OpenAI, the planned integration uses the Responses API with strict JSON Schema structured output, which the current official API exposes under `text.format`. The exact model stays environment-configurable and will be selected with an evaluation set rather than hard-coded into domain logic.

- [OpenAI Responses API](https://developers.openai.com/api/reference/cli/resources/responses/methods/create)

## Database model

| Area | Main tables | Purpose |
| --- | --- | --- |
| Identity | `users`, `profiles` | Public app identity linked 1:1 to `auth.users`; onboarding goals and constraints |
| Georgia retail | `stores`, `store_translations`, `store_locations`, `store_pricing` | Bilingual chains/branches and timestamped GEL package prices |
| Preferences | `profile_appliances`, `profile_allergens`, `profile_dietary_patterns`, `profile_ingredient_preferences` | Hard and soft generation constraints |
| Food catalogue | `ingredients`, `ingredient_translations`, `ingredient_allergens`, `aisles` | Canonical bilingual ingredient identity, allergens, nutrition, and aisle mapping |
| Recipes | `recipes`, `recipe_translations`, `recipe_ingredients`, `recipe_steps`, `recipe_appliances` | Curated/user/AI recipes with localized content and normalized amounts |
| Planning | `weekly_plans`, `planned_meals`, `plan_generation_jobs` | Seven-day plan snapshots plus provider/version/audit metadata |
| Shopping | `pantry_items`, `grocery_lists`, `grocery_list_items` | Consolidated list, pantry deductions, package selection, check-off state |

The schema stores time with time zones, money as exact numeric GEL values, indexes every foreign key/access path, and keeps localization in translation tables. A bilingual recipe can therefore be displayed in either language without duplicating nutrition and pricing facts.

## RLS model

- Every table in `public` has RLS enabled and forced.
- Privileges are explicitly granted because new Supabase projects no longer necessarily expose new tables to the Data API automatically.
- Authenticated clients can read only their own profile, constraints, pantry, plans, jobs, and grocery lists.
- Profile/pantry/preferences are user-writable through ownership policies with both `USING` and `WITH CHECK` for updates.
- Generated recipes, plans, and totals are client read-only; trusted backend code writes them after validation.
- Grocery items allow owner updates for check-off and notes, but ownership cannot be reassigned.
- Catalogue and pricing records are authenticated read-only.
- `service_role` is reserved for trusted Edge Functions and never enters web or mobile bundles.
- The Auth signup trigger is a locked-down `SECURITY DEFINER` function in a non-exposed `private` schema. User metadata is used only for display/locale initialization, never authorization.

These choices track current Supabase guidance on per-operation policies, explicit grants, `(select auth.uid())`, update checks, and public user tables linked to `auth.users`.

- [Supabase RLS guide](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase user-data guide](https://supabase.com/docs/guides/auth/managing-user-data)
- [Supabase breaking-change log](https://supabase.com/changelog?types=breaking-change)

## Delivery sequence after approval

1. Workspace foundation: pnpm/Turborepo, pinned dependencies, shared package, lint/typecheck/test pipelines, Supabase config, and local reset verification.
2. Shared domain: Zod contracts, generated database types, unit conversions, nutrition calculator, grocery consolidation, budget validator, fixtures, and tests.
3. Backend: authenticated generation job endpoint, provider adapters, strict schemas/prompts, deterministic validation, transactional persistence, regeneration, and rate/idempotency controls.
4. Web: SSR Auth, localized routing, onboarding, dashboard, weekly planner, recipes, grocery list, and settings.
5. Mobile: Expo Router Auth, onboarding, tabs, plan/recipe/list screens, secure session storage, offline list check-off, and deep links.
6. Data operations: licensed nutrition import, store-price ingestion, freshness indicators, admin review tools, and monitoring.
7. Quality/security: pgTAP RLS tests, unit/integration/E2E tests, prompt evaluation corpus in Georgian and English, accessibility, privacy copy, and release automation.

## Acceptance gates

- No meal containing a declared allergen can reach `ready` state.
- Seven plan days and configured meal slots are present.
- Nutrition and budget tolerances are calculated, not trusted from model text.
- Grocery quantities reconcile with recipe servings and pantry deductions.
- Every visible recipe title, ingredient, step, store, aisle, and validation error supports Georgian and English fallback.
- RLS tests prove two authenticated users cannot read or mutate each other’s rows.
- Stale or missing store prices are labeled; no estimate is presented as a guaranteed checkout total.
