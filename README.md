# TaburBarengUB

Platform event TaburBarengUB Fase 1: landing page event, autentikasi, booking seat sesi offline, tiket QR, check-in QR, dan dashboard admin dasar.

## Requirements

- Node.js 22.x
- npm
- Supabase project yang sudah menjalankan migration di `supabase/migrations`

Versi Node dipin melalui:

```bash
.nvmrc
```

Jika memakai `nvm`:

```bash
nvm use
```

## Environment

Salin template env:

```bash
cp .env.example .env.local
```

Isi:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

Jangan pernah menaruh `sb_secret_*` atau service-role key di variable `NEXT_PUBLIC_*`.

## Install

```bash
npm ci
```

## Development

```bash
npm run dev
```

Buka:

```text
http://localhost:3000
```

## Quality checks

```bash
npm run lint
npm run typecheck
npm run build
```

CI menjalankan tiga command tersebut pada Node 22.

## Supabase workflow

Migration ada di:

```text
supabase/migrations/
```

Push migration ke project linked:

```bash
npm run db:push
```

Generate TypeScript types dari Supabase linked project:

```bash
npm run db:types:linked
```

Untuk local Supabase jika dipakai:

```bash
npx supabase start
npm run db:types
```

Catatan: beberapa workflow lokal Supabase membutuhkan Docker.

## Main routes

Public/auth:

```text
/
/login
/register
/forgot-password
/reset-password
/sesi/[id]
```

Member:

```text
/tiket-saya
/tiket-saya/[id]
```

Admin:

```text
/admin
/admin/hero
/admin/sesi
/admin/sesi/[id]
/admin/sesi/new
/admin/sesi/[id]/edit
/admin/peserta
/admin/scanner
```

API:

```text
POST /api/bookings
POST /api/check-in
PATCH /api/me/profile
POST /api/admin/sessions
PATCH /api/admin/sessions/[id]
PATCH /api/admin/hero
GET /admin/peserta/export.csv?session_id=...
```

## Documentation

- `docs/ARCHITECTURE.md` — keputusan arsitektur dan pola layering.
- `docs/SMOKE_TEST.md` — checklist smoke test manual.
- `docs/REVIEW_ACTION_TRACKER.md` — tracker action item hasil review.
- `AUDIT_HANDOFF.md` — konteks audit/handoff sebelumnya.

## Deployment notes

- Pastikan runtime deployment memakai Node 22.
- Set env production di platform deploy.
- Pastikan Supabase Auth redirect URL mengarah ke domain deploy.
- Jalankan smoke test setelah deploy dan migration.
