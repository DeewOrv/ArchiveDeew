# Media Progress Tracker

A mobile-first personal tracker for anime, donghua, manga, manhwa, manhua, novels, web novels, dramas, and movies. Solves "I forgot where I stopped" — search any title, see progress instantly, update in one tap.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080, proxied at /api)
- `pnpm --filter @workspace/media-tracker run dev` — run the frontend (port 18499, proxied at /)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string
- Optional env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — for cover image uploads

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Tailwind CSS v4 + shadcn/ui (mobile-first, dark UI)
- API: Express 5
- Auth: Replit Auth (OpenID Connect)
- DB: PostgreSQL + Drizzle ORM
- Storage: Supabase Storage (covers bucket) — optional for cover images
- Validation: Zod, drizzle-zod
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for all API contracts
- `lib/db/src/schema/media.ts` — media table schema
- `lib/db/src/schema/auth.ts` — auth/session schema
- `artifacts/api-server/src/routes/media.ts` — all media CRUD routes
- `artifacts/api-server/src/routes/upload.ts` — Supabase cover upload route
- `artifacts/api-server/src/routes/seed.ts` — first-time data seeding
- `artifacts/media-tracker/src/` — frontend app
- `artifacts/media-tracker/src/pages/` — all pages (home, library, search, detail, add, edit, settings)
- `artifacts/media-tracker/src/components/` — shared components (media-card, cover-image, media-form, bottom-nav)

## Architecture decisions

- Replit Auth (OIDC/PKCE) — no local auth, no passwords
- Supabase Storage only for cover images — DB stores only the public URL
- All media is user-scoped (user_id FK on every row) — no cross-user data access
- Acronym auto-generation on title input; manually overridable
- Cover fallback: gradient placeholder with acronym — never broken images
- POST /api/seed — seeds 11 initial entries if user has 0 entries (first-time UX)

## Product

- Home: stats dashboard + continue reading/watching + recent + favorites
- Library: filterable/searchable/sortable media list
- Search: realtime search by title, alt_title, acronym
- Detail: full media view with +1/+5/+10/-1 quick progress buttons
- Add/Edit: full form with cover upload
- Settings: export/import JSON backup, theme, logout

## User preferences

- Language: Indonesian for explanations
- No emojis in UI
- Premium dark UI (inspired by AniList, Notion, Linear, Apple)

## Gotchas

- After OpenAPI spec changes, always run codegen before using types
- `pnpm run typecheck:libs` must pass before leaf artifact typechecks
- `replit-auth-web` lib needs `composite: true` in tsconfig for leaf artifact references
- `pb-safe` is a custom CSS class — do NOT use it in Tailwind `@apply` directives
- Supabase upload uses signed URL pattern: POST /api/upload/cover → GET signed URL → PUT file to Supabase
- Run `pnpm --filter @workspace/db run push` after any schema changes

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
