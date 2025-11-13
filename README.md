# MOOOOD

Creative research cockpit built on Next.js 14, Prisma, Postgres + pgvector, and Tailwind. Upload assets, tag them, explore contextual suggestions, and craft AI-assisted moodboards.

## Prerequisites

- Node.js 18+
- npm 9+
- Local Postgres 15+ with the `vector` extension (`CREATE EXTENSION IF NOT EXISTS vector;`)
- (Optional) Supabase project for storage + public hosting
- (Optional) OpenAI API key for captions/embeddings. Without a key, deterministic pseudo-embeddings keep the app usable.

## Environment variables

Copy `.env.example` to `.env.local` and set the following:

| Variable | Description |
| --- | --- |
| `DATABASE_URL` | Postgres connection string. |
| `NEXTAUTH_SECRET` | Random string for NextAuth JWT encryption. |
| `NEXTAUTH_URL` | Base URL of the app (default `http://localhost:3000`). |
| `OPENAI_API_KEY` | Enables real captions/embeddings (optional). |
| `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Required only when `USE_SUPABASE_STORAGE=true`. |
| `SUPABASE_BUCKET` | Supabase storage bucket name (default `images`). |
| `USE_SUPABASE_STORAGE` | `true` to store uploads in Supabase; otherwise `/public/uploads`. |
| `USE_EXTERNAL_SOURCES` | Placeholder for upcoming external partner feeds. |
| `USE_VISION` | Toggles OpenAI vision tagging. |

## Local development

```bash
npm install
npx prisma migrate dev
npm run dev
```

Visit `http://localhost:3000`.

### Testing & quality

```bash
npm run lint
npm run test        # Jest unit tests
npm run test:e2e    # Playwright smoke test (start `npm run dev` first)
```

### Database & seeding

Prisma schema lives in `prisma/schema.prisma`. The first migration (`prisma/migrations/0001_init`) creates the full data model and activates `pgvector`.

Create demo data with:

```bash
npm run seed
```

This script provisions a demo user (`demo@mood.app`), a few folders, placeholder images sourced from `picsum.photos`, and deterministic embeddings (falls back to pseudo-embeddings when no OpenAI key is set).

## Storage abstraction

`lib/storage.ts` routes uploads either to Supabase Storage (when `USE_SUPABASE_STORAGE=true`) or to `/public/uploads`. Toggle by switching the env flag; no code changes required.

## Feature flags

`FEATURE_FLAGS.ts` centralizes the toggles:

- `USE_SUPABASE_STORAGE` – upload target.
- `USE_EXTERNAL_SOURCES` – reserved stub for integrating Unsplash/Pexels.
- `USE_VISION` – disables expensive OpenAI vision calls when set to `false`.

## Architecture overview

```
/app                Next.js App Router routes (auth, dashboard, folders, images, moodboards, APIs)
/components         Reusable UI building blocks (dropzone, grids, rails, moodboard canvas)
/lib                Prisma client, NextAuth config, storage + AI utilities, recommendation engine, validators
/prisma             Prisma schema + migrations
/scripts            Seed script
/tests              Jest unit tests + Playwright smoke test
```

Key utilities:

- `lib/colors.ts` – dominant color calculation & HSV helpers.
- `lib/embeddings.ts` – OpenAI + pseudo embedding fallback.
- `lib/reco.ts` – cosine similarity, MMR diversification, semantic/color ordering.
- `lib/storage.ts` – Supabase/local adapter.
- `lib/auth.ts` – NextAuth credentials provider wired to Prisma.

## API surface

All endpoints live under `app/api/*` using Next.js route handlers:

- `POST /api/auth/register` – Register new credentials with bcrypt hashing + Zod validation.
- `POST /api/upload` – Multipart upload with MIME/weight checks, dominant color extraction via `sharp`, storage abstraction, auto-caption + embedding tasks.
- `GET /api/images` – Cursor pagination with folder, tag, and free-text filters.
- `POST /api/tags/bulk` – Assign/replace tags for an image.
- `POST /api/folders` / `PATCH /api/folders/:id` – Manage folders.
- `POST /api/moodboards` – Generate board ordering (color/semantic/manual) + default layout.
- `POST /api/moodboards/:id/layout` – Persist drag-and-drop layout JSON.
- `POST /api/moodboards/:id/export` – SVG → PNG fallback exporter via `sharp`.
- `GET /api/recommendations/context` – Returns hybrid recommendations for the requested scope (after upload, folder, single image, moodboard).

## Frontend UX

- `/login` + `/register` – Credentials auth (NextAuth Credentials provider).
- `/dashboard` – Upload dropzone, grid of latest images, contextual suggestion rail.
- `/folders/[id]` – Folder grid with dedicated recommendation rail.
- `/images/[id]` – Full-screen image viewer, editable tags, embedding status, similar images.
- `/moodboard/new` – Prompt + folder-based creation with strategy selector.
- `/moodboard/[id]` – Drag-and-drop canvas powered by `@dnd-kit/core`, autosaves layout, PNG export button.

Client-side helpers include `useDebouncedSearch` for future search experiences and `html-to-image` (client) combined with `/api/moodboards/:id/export` as a fallback exporter when the canvas is too heavy for the browser.

## Graceful degradation

- When OpenAI credentials are absent, `lib/embeddings.ts` produces deterministic pseudo-embeddings so search and recommendations stay functional.
- Vision tagging can be toggled off via `USE_VISION=false`; uploads still succeed with manual tags.
- Storage defaults to disk; Supabase can be enabled later without code changes.

## Security & ownership

- Middleware (`middleware.ts`) protects dashboard, folder, image, and moodboard routes.
- API handlers always resolve the authenticated Prisma user and scope queries by `userId`.
- Upload endpoint enforces MIME whitelist + 15MB guardrails.

## Development workflow

1. `npm install`
2. `cp .env.example .env.local` and fill credentials.
3. `npx prisma migrate dev`
4. `npm run dev`
5. (Optional) `npm run seed`
6. `npm run test` / `npm run test:e2e`

Happy building! 🚀
