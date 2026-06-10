# ArchiveDeew — Migration Guide

Migrating from **Replit PostgreSQL + Replit Auth** to **Supabase PostgreSQL + Supabase Auth (Google OAuth)** + Vercel static deployment.

---

## Files Created / Changed

### New files
| Path | Purpose |
|------|---------|
| `artifacts/media-tracker/src/lib/supabase.ts` | Supabase JS client (reads `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY`) |
| `artifacts/media-tracker/src/lib/auth.tsx` | `SupabaseAuthProvider` + `useAuth` hook (Google OAuth) |
| `artifacts/media-tracker/src/lib/db.ts` | Full CRUD layer calling Supabase directly from the browser |
| `supabase/schema.sql` | Media table DDL, RLS policies, storage policies |
| `vercel.json` | Vercel build + SPA rewrite config |
| `.env.example` | Documents every required/optional env var |

### Updated files
| Path | Change |
|------|--------|
| `artifacts/media-tracker/src/App.tsx` | Replaced Replit Auth provider with `SupabaseAuthProvider` |
| `artifacts/media-tracker/src/pages/login.tsx` | `useAuth` now comes from `@/lib/auth` |
| `artifacts/media-tracker/src/pages/home.tsx` | Replaced API hooks with `useQuery` + `db.*` calls |
| `artifacts/media-tracker/src/pages/library.tsx` | Same — removed `@workspace/api-client-react` |
| `artifacts/media-tracker/src/pages/search.tsx` | Same |
| `artifacts/media-tracker/src/pages/detail.tsx` | Same; mutation helpers replaced with direct `db.*` calls |
| `artifacts/media-tracker/src/pages/edit-media.tsx` | Same |
| `artifacts/media-tracker/src/pages/settings.tsx` | Export/import now call `db.exportMedia` / `db.importMedia` |
| `artifacts/media-tracker/src/components/media-form.tsx` | Cover upload via `db.uploadCover` (Supabase Storage) |
| `artifacts/media-tracker/src/components/media-card.tsx` | `MediaItem` type replaced with `Media` from `@/lib/db` |
| `artifacts/media-tracker/tsconfig.json` | Removed references to `lib/api-client-react` and `lib/replit-auth-web` |
| `artifacts/media-tracker/package.json` | Removed `@workspace/api-client-react` + `@workspace/replit-auth-web`; `@supabase/supabase-js` moved to `dependencies` |
| `artifacts/media-tracker/vite.config.ts` | `PORT` optional in production; `BASE_PATH` defaults to `/`; removed `runtimeErrorOverlay` |

---

## Required Environment Variables

### Replit secrets (dev)
| Variable | Where to get it |
|----------|----------------|
| `VITE_SUPABASE_URL` | Supabase Dashboard → Settings → API → Project URL |
| `VITE_SUPABASE_ANON_KEY` | Supabase Dashboard → Settings → API → anon / public key |

### Vercel environment variables (production)
Same two variables above — add them in Vercel → Project Settings → Environment Variables.

> `BASE_PATH=/` is already set in `vercel.json` and does not need to be added manually.

---

## Manual Migration Steps

### 1. Create a Supabase project
1. Go to [https://supabase.com](https://supabase.com) and create a new project.
2. Choose a region close to your users.
3. Save the database password somewhere safe.

### 2. Run the database schema
1. In the Supabase Dashboard, open **SQL Editor**.
2. Paste the entire contents of [`supabase/schema.sql`](supabase/schema.sql).
3. Click **Run**. This creates the `media` table, enables RLS, and sets all policies.

### 3. Create the covers storage bucket
1. In the Supabase Dashboard, open **Storage**.
2. Create a new bucket named exactly **`covers`**.
3. Set it to **Public** (so cover image URLs work without authentication).
4. The storage policies are already applied by `schema.sql` step above.

### 4. Enable Google OAuth
1. In the Supabase Dashboard, open **Auth → Providers**.
2. Enable **Google**.
3. Create a Google OAuth 2.0 client at [console.cloud.google.com](https://console.cloud.google.com):
   - Authorized redirect URI: `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Paste the **Client ID** and **Client Secret** into Supabase.

### 5. Configure redirect URLs
In **Auth → URL Configuration**, add your app domains to **Redirect URLs**:
- `https://your-vercel-domain.vercel.app`
- `https://your-custom-domain.com` (if any)
- For local dev: `http://localhost:18499` (Replit dev preview URL)

### 6. Add Replit secrets
In the Replit project → **Secrets**, add:
- `VITE_SUPABASE_URL` = your project URL (e.g. `https://abcxyz.supabase.co`)
- `VITE_SUPABASE_ANON_KEY` = your anon/public key

### 7. Deploy to Vercel
1. Import the repo in [vercel.com](https://vercel.com).
2. Vercel auto-detects `vercel.json`; no framework override needed.
3. Add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in Vercel Environment Variables.
4. Deploy. The output directory is `artifacts/media-tracker/dist/public`.

### 8. (Optional) Migrate existing data
If you have data in the old Replit PostgreSQL database:
1. Log in to the app with the old Replit instance while it still works.
2. Go to **Settings → Export Backup** to download `archivedeew-backup-*.json`.
3. Log in to the new Supabase-backed app.
4. Go to **Settings → Import Backup** and upload the JSON file.

> Old `id`, `user_id`, `created_at`, and `updated_at` fields are stripped automatically during import; new values are assigned by Supabase.

---

## What No Longer Exists
- **Express API server** (`artifacts/api-server`) — all data now flows through Supabase RLS directly from the browser. The server may be removed in a follow-up cleanup.
- **Replit Auth** — replaced by Supabase Auth with Google OAuth.
- **`@workspace/api-client-react`** — OpenAPI-generated hooks are no longer used.
- **`@workspace/replit-auth-web`** — replaced by `@/lib/auth`.
- **`DATABASE_URL` / `SESSION_SECRET`** env vars — no longer needed.
