# Sufra · სუფრა

Sufra is a Georgia-first, Georgian/English weekly meal planner. It combines household preferences, hard allergen exclusions, nutrition targets, available kitchen equipment, pantry deductions, and a GEL budget tied to a preferred Georgian supermarket.

The repository is a pnpm/Turborepo monorepo with a Next.js web app, Expo mobile app, shared TypeScript domain package, and Supabase database/Edge Function backend.

## What is implemented

- Bilingual landing, authentication, onboarding, weekly plan, recipes, grocery list, and settings on web.
- The equivalent native flows for iOS and Android with Expo Router.
- Shared Zod request/provider schemas, types, translations, unit conversion, nutrition aggregation, candidate filtering, grocery consolidation, budget validation, and week handling.
- PostgreSQL migrations for identity, preferences, appliances, allergens, diets, ingredients, recipes, plans, grocery lists, Georgian stores, pricing observations, explicit grants, and RLS.
- Transactional profile saving and generated-plan persistence functions.
- An authenticated, idempotent, rate-limited meal-plan Edge Function with OpenAI Responses API and Anthropic structured-output adapters.
- A bounded repair pass followed by deterministic server-side constraint validation. AI output is never trusted for nutrition, pricing, or grocery arithmetic.
- A small bilingual starter catalogue for development. Its nutrition records are deliberately flagged unverified.

The broader product and research rationale is in [docs/architecture-blueprint.md](docs/architecture-blueprint.md).

## Workspace

```text
apps/
  web/                   Next.js 16 App Router
  mobile/                Expo SDK 57 + Expo Router
packages/
  shared/                schemas, contracts, business logic, i18n
supabase/
  functions/             authenticated generation function and shared orchestration
  migrations/            schema, RLS, reference data, transactional RPCs
tooling/typescript/       shared compiler configurations
```

## Prerequisites

- Node.js 22.13 or newer
- pnpm 10.12.1 through Corepack
- Supabase CLI
- Docker Desktop for the local Supabase stack
- Xcode or Android Studio only when running a native simulator

## Local setup

1. Install dependencies:

   ```bash
   corepack enable
   pnpm install --frozen-lockfile
   ```

2. Copy the public client environment templates:

   ```bash
   cp apps/web/.env.example apps/web/.env.local
   cp apps/mobile/.env.example apps/mobile/.env
   cp supabase/functions/.env.example supabase/functions/.env
   ```

3. Start Docker, reset the local database, and note the local project URL and publishable key:

   ```bash
   supabase start
   supabase db reset
   supabase status
   ```

4. Put the project URL and publishable key in both client env files. Put one AI provider key and model in `supabase/functions/.env`. Never put a Supabase secret/service key or AI provider key in either client app.

5. Serve the function and clients:

   ```bash
   supabase functions serve generate-weekly-plan --env-file supabase/functions/.env
   pnpm dev:web
   pnpm dev:mobile
   ```

The mobile app needs a LAN-reachable Supabase URL when running on a physical device; `127.0.0.1` points to the device itself.

## AI configuration

OpenAI:

```dotenv
AI_PROVIDER=openai
OPENAI_API_KEY=...
OPENAI_MODEL=...
```

Anthropic:

```dotenv
AI_PROVIDER=anthropic
ANTHROPIC_API_KEY=...
ANTHROPIC_MODEL=...
```

The model is intentionally an environment choice. Select it with a Georgian/English evaluation set before production instead of coupling domain logic to a model name.

For a hosted project, set secrets with `supabase secrets set` and deploy the function with the API bundler because it imports the monorepo shared package:

```bash
supabase functions deploy generate-weekly-plan --use-api
```

## Verification

```bash
pnpm typecheck
pnpm test
pnpm build
```

The Edge Function can be checked independently with Deno:

```bash
deno check --config supabase/functions/deno.json supabase/functions/generate-weekly-plan/index.ts
```

Current verification covers all three TypeScript projects, nine shared-domain tests, Next.js production compilation, iOS/Android Metro exports, Expo dependency compatibility, and Deno typechecking. A full migration/RLS integration run still requires Docker or a linked Supabase project.

## Data policy before production

The seeded recipes and observed prices are development fixtures, not a production food database. Production launch needs:

- licensed or properly attributed Georgian nutrition data reviewed per edible 100 g;
- retailer/eKalata ingestion permission and branch/package mapping;
- price freshness UI and scheduled ingestion monitoring;
- pgTAP tests that prove cross-user RLS isolation;
- prompt regression/evaluation cases in both Georgian and English;
- clinical review of nutrition copy and a clear non-medical-advice disclaimer.
