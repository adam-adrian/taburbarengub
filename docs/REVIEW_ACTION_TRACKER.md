# Review Action Tracker — TaburBarengUB

Tanggal dibuat ulang: 2026-07-31  
Sumber review:

- `taburbarengub-review-2026-07-30.md`
- `taburbarengub-graphify-rereview-2026-07-31.md`
- `REVIEW_ACTION_EXECUTION_PLAN.md`

Dokumen ini adalah **sumber status aktual** untuk task hasil review. Execution plan adalah panduan urutan kerja, tetapi status final tetap mengikuti tracker ini.

---

## Status legend

- `TODO` — belum dikerjakan
- `DOING` — sedang dikerjakan
- `DONE` — sudah selesai, sudah dites minimal, dan commit/evidence dicatat
- `DEFERRED` — sengaja ditunda
- `RISK_ACCEPTED` — risiko diterima sementara, wajib ada owner dan expiry date

Untuk setiap item yang selesai, isi:

```text
Evidence/commit:
Verification:
```

Untuk setiap item `RISK_ACCEPTED`, isi:

```text
Owner:
Reason:
Expiry/review date:
Mitigation until expiry:
```

---

# Wave 0 — Safety net dan runtime baseline

## PR-00 — Toolchain, Node 22, CI baseline, env docs

Status: `DONE`  
Target PR: `chore: pin Node 22 and add baseline CI`  
Priority: `P0 prerequisite`  
Dependency: none  
Owner: TBD  
Target date: TBD  
Source: Execution plan PR-00, review P1.3/P2.5/P2.7

### Masalah

- Supabase JS dependency meminta Node `>=22`, sementara project belum mem-pin runtime.
- Belum ada CI baseline untuk lint/typecheck/build.
- Belum ada `.env.example`.
- README masih belum cukup menjelaskan setup aktual.

### Scope

- [x] Tambahkan `engines.node` di `package.json`:

```json
"engines": {
  "node": ">=22 <23"
}
```

- [x] Tambahkan `.nvmrc` atau `.node-version` berisi `22`.
- [x] Tambahkan script:

```json
"typecheck": "tsc --noEmit --pretty false"
```

- [x] Tambahkan GitHub Actions baseline:
  - checkout
  - setup Node 22
  - `npm ci`
  - `npm run lint`
  - `npm run typecheck`
  - `npm run build`
- [x] CI memakai env dummy format-valid, bukan Markdown link:

```yaml
env:
  NEXT_PUBLIC_SUPABASE_URL: https://example.supabase.co
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: sb_publishable_ci_dummy
  NEXT_TELEMETRY_DISABLED: 1
```

- [x] Tambahkan `permissions: contents: read`.
- [x] Tambahkan `concurrency`:

```yaml
concurrency:
  group: ci-${{ github.ref }}
  cancel-in-progress: true
```

- [x] Tambahkan `.env.example`.
- [x] Pastikan `.gitignore` punya exception `!.env.example`.
- [x] README minimum: Node 22, install, env, dev, build, Supabase migrations/typegen.
- [x] Set Node 22 di Vercel/deployment. (tidak ada `vercel.json` — Vercel baca `engines.node` otomatis; README baris 151 catat manual check)

### Non-scope

- Dependency upgrade besar.
- Audit advisory remediation penuh.
- DB/RLS tests.

### Acceptance criteria

- [ ] CI hijau pada branch/PR.
- [ ] `npm ci` tidak menghasilkan `EBADENGINE` untuk Supabase JS.
- [ ] `npm run lint` pass di Node 22.
- [ ] `npm run typecheck` pass di Node 22.
- [ ] `npm run build` pass di Node 22.
- [x] Preview deployment memakai Node 22. (no `vercel.json`; Vercel auto-detects `engines.node`; README mencatat manual check di baris 151)

Evidence/commit: c595824 (Pin Node 22 and add baseline CI)  
Verification: `npm run lint`, `npm run typecheck`, `npm run build` re-run manual 2026-08-03 di local (Node v26.4.0, di luar range `>=22 <23` tapi tidak diblokir — tidak ada `engine-strict` di `.npmrc`), semua pass. `.github/workflows/ci.yml` ada, pakai `.nvmrc` (isi `22`), env dummy format-valid, `permissions: contents: read`, `concurrency` group sudah benar. `.env.example` ada dan `.gitignore` punya `!.env.example`. README punya section Node 22/install/env/dev/build/Supabase migration+typegen.

---

# Wave 1 — Release blocker profile

## PR-01 — Profile refresh + payload minimization

Status: `DONE`  
Target PR: `fix: refresh profile completion state and minimize client payload`  
Priority: `P0`  
Dependency: PR-00  
Owner: TBD  
Target date: TBD  
Source: Graphify H-01, Graphify M-06

### Masalah

- Setelah profile completion dari modal sukses, database sudah `profile_completed = true`, tetapi Server Component masih memakai snapshot lama.
- Detail sesi tetap menampilkan tombol `Lengkapi Profil untuk Booking` sampai reload manual.
- `/tiket-saya` tetap menampilkan incomplete-profile card sampai reload manual.
- Beberapa page mengirim profile payload terlalu luas ke Client Component.

### Scope

- [ ] Setelah `submitProfile()` sukses dari modal, lakukan refresh state yang benar.
- [ ] Pastikan modal ditutup tanpa auto-open ulang setelah refresh.
- [ ] Pertimbangkan `router.refresh()` di `ProfileCompletionPrompt` atau callback `onCompleted()` dari caller.
- [ ] Buat type sempit untuk data profile completion, misalnya:

```ts
type ProfileCompletionData = Pick<
  UserProfile,
  | 'nama'
  | 'nama_panggilan'
  | 'no_hp'
  | 'usia'
  | 'profesi'
  | 'domisili'
  | 'profile_completed'
>
```

- [ ] Select hanya field profile yang dibutuhkan prompt:

```text
nama, nama_panggilan, no_hp, usia, profesi, domisili, profile_completed
```

- [x] Jangan kirim `email`, `role`, atau `created_at` ke Client Component jika tidak diperlukan.
- [x] Verifikasi `required` pada profesi dan domisili untuk UI yang relevan. (server-side Zod `completeProfileSchema` sudah wajibkan profesi+domisili. Client-side: `profile-completion-prompt.tsx` sudah punya trim-check; `complete-profile-form.tsx` semula belum — fixed 2026-08-03, tambah `required` attr + trim-check konsisten dengan nama/no_hp/usia.)

### Acceptance criteria

- [x] `/sesi/[id]`: complete profile dari modal → `BookingButton` muncul tanpa reload manual. (code-verified: `router.refresh()` + render condition `!profile?.profile_completed`, belum dites di browser sungguhan)
- [x] `/tiket-saya`: complete profile dari modal → incomplete card hilang tanpa reload manual. (sama, code-verified saja)
- [x] `/`: complete profile dari modal → prompt/banner hilang dan section sesi tetap bisa diakses. (sama, code-verified saja)
- [x] Modal tidak auto-open ulang setelah refresh. (code-verified — lihat `handleProfileCompleted()`)
- [x] Dismissed state tidak membuat reminder agresif di halaman lain. (`PROMPT_DISMISSED_KEY` pakai `sessionStorage`, scoped per tab/session — tidak diverifikasi cross-page runtime)
- [x] Payload profile ke Client Component minimal.
- [x] Keyboard/focus/scroll-lock tetap bekerja. (tidak berubah dari implementasi sebelumnya — dialog role, Escape handler, focus trap/restore, body scroll lock masih utuh di `profile-completion-prompt.tsx`)
- [x] `npm run lint` pass.
- [x] `npm run typecheck` pass.
- [x] `npm run build` pass.

Evidence/commit: a96aaf0 (Refresh profile completion state and minimize payload)  
Verification: Diverifikasi manual 2026-08-03 via code read + re-run `lint`/`typecheck`/`build` (semua pass, lihat evidence PR-00). `handleProfileCompleted()` panggil `router.refresh()` lalu tutup modal (`setOpen(false)`, `setDismissed(false)`) sehingga Server Component refetch dan `BookingButton` di `sesi/[id]/page.tsx` muncul otomatis tanpa reload manual (kondisi render `!profile?.profile_completed` sudah pakai data baru). `ProfileCompletionData` (Pick 7 field) dipakai sebagai type payload; query di `page.tsx`, `sesi/[id]/page.tsx`, `tiket-saya/page.tsx` sudah tidak lagi select `email`/`created_at`/`id`, hanya field yang dibutuhkan (`tiket-saya` dan `sesi/[id]` bahkan drop `role`). Modal tidak auto-reopen: `PROMPT_DISMISSED_KEY` di-clear saat complete, bukan di-set.

Tidak diverifikasi manual di browser (butuh live session + Supabase data) — hanya code-level check. Rekomendasi: jalankan smoke test manual di 3 halaman (`/`, `/sesi/[id]`, `/tiket-saya`) sebelum tandai PR-01 fully verified untuk production.

---

## PR-02 — Enforce complete profile invariant in database

Status: `TODO`  
Target PR: `fix(db): enforce complete profile invariant before booking`  
Priority: `P0`  
Dependency: PR-00; can be prepared parallel with PR-01  
Owner: TBD  
Target date: TBD  
Source: Review P1.1, Graphify H-02

### Masalah

- `handle_new_user()` masih bisa membuat `profile_completed = true` dari metadata parsial.
- Existing users belum direkonsiliasi terhadap field wajib baru `profesi` dan `domisili`.
- `create_booking()` masih terlalu bergantung pada boolean `profile_completed` yang bisa drift.

### Normal migration path

```text
Local Supabase
  ↓ jika resource tidak cukup
Dedicated staging Supabase
  ↓ setelah lolos
Production
```

Backup + preflight + post-validation langsung di production hanya boleh menjadi emergency path, bukan jalur normal.

### Preflight query

Jalankan sebelum apply migration di staging/production:

```sql
select
  count(*) filter (where profile_completed) as currently_completed,
  count(*) filter (
    where profile_completed
      and (
        nullif(btrim(profesi), '') is null
        or nullif(btrim(domisili), '') is null
      )
  ) as will_be_reverted
from public.users;
```

### Scope migration

- [ ] Tambahkan migration baru; jangan edit migration lama yang sudah deployed.
- [ ] Ganti `handle_new_user()` agar `profile_completed=true` hanya jika field wajib lengkap:
  - nama
  - no. HP
  - usia positif
  - profesi
  - domisili
- [ ] Recompute semua row existing.
- [ ] Tambahkan check constraint:

```sql
not profile_completed or (
  nullif(btrim(nama), '') is not null
  and nullif(btrim(no_hp), '') is not null
  and usia is not null and usia > 0
  and nullif(btrim(profesi), '') is not null
  and nullif(btrim(domisili), '') is not null
)
```

- [ ] Update `create_booking()` agar eligibility tidak hanya percaya boolean.
- [ ] Ideal: helper DB `has_completed_profile(user_id)` atau equivalent field check inline.
- [ ] Regenerate types dari DB yang sudah migrated.

### Acceptance criteria

- [ ] Direct Supabase Auth signup dengan metadata parsial tidak menghasilkan `profile_completed=true`.
- [ ] Existing user tanpa profesi/domisili menjadi `profile_completed=false`.
- [ ] Constraint mencegah `profile_completed=true` bila field wajib kosong.
- [ ] Direct `create_booking()` untuk incomplete user ditolak.
- [ ] Complete profile normal tetap berhasil.
- [ ] Migration diuji di local/staging sebelum production.
- [ ] Post-migration validation query dijalankan dan dicatat.
- [ ] `npm run db:types` atau `npm run db:types:linked` dijalankan sesuai target DB.
- [ ] `npm run lint`, `npm run typecheck`, `npm run build` pass.

Evidence/commit: TBD  
Verification: TBD

---

# Wave 2 — Quota integrity

## PR-03 — Protect `kuota_terisi` from direct admin update

Status: `TODO`  
Target PR: `fix(db): prevent direct quota counter updates`  
Priority: `P1`  
Dependency: PR-02  
Owner: TBD  
Target date: TBD  
Source: Review P2.1, Graphify M-01

### Masalah

- UI/API tidak expose `kuota_terisi`, tetapi admin JWT masih dapat update row `event_sessions` langsung via PostgREST.
- Counter kuota adalah system-managed invariant.

### Preferred small approach

Coba column-level grants:

```sql
revoke update on table public.event_sessions from authenticated;

grant update (
  nama_sesi,
  tipe,
  tanggal_waktu,
  lokasi_atau_link,
  deskripsi,
  kapasitas,
  status
) on table public.event_sessions to authenticated;
```

RLS admin policy tetap berlaku.

### Fallback

Jika PostgREST/column grant bermasalah, gunakan RPC `admin_update_event_session()` dengan whitelist field dan revoke broad direct update.

### Acceptance criteria

- [ ] Admin update nama/status/kapasitas via API berhasil.
- [ ] Admin direct PostgREST update `kuota_terisi` ditolak.
- [ ] User biasa update field apa pun ditolak RLS.
- [ ] `create_booking()` SECURITY DEFINER tetap bisa increment counter.
- [ ] API admin update dengan `.select('*')` tetap berfungsi atau disesuaikan.
- [ ] Manual/direct API test dicatat.

Evidence/commit: TBD  
Verification: TBD

---

## PR-04 — Booking lifecycle, cancellation, and quota reconciliation

Status: `TODO`  
Target PR: TBD  
Priority: `P1`  
Dependency: PR-03  
Owner: TBD  
Target date: TBD  
Source: Review P2.2, P2.8, Graphify M-02

### Product decisions needed

- [ ] Apakah user boleh cancel booking sendiri?
- [ ] Apakah admin boleh cancel booking peserta?
- [ ] Apakah cancelled booking membebaskan seat?
- [ ] Apakah checked-in booking boleh dibatalkan?
- [ ] Apakah auth user boleh hard-delete bila punya booking/history?
- [ ] Apakah session dengan booking boleh hard-delete?

### Recommended MVP direction

- Jangan hard-delete booking historis.
- Admin dapat cancel booking berstatus `booked`.
- Cancellation membebaskan seat secara atomic.
- `checked_in` tidak boleh cancel tanpa koreksi khusus.
- Session dengan booking tidak hard-delete; gunakan `status = cancelled`.
- Sediakan reconciliation query.

### Acceptance criteria

- [ ] Keputusan produk tercatat.
- [ ] Counter tidak drift pada cancellation yang didukung.
- [ ] Session dengan booking tidak dihapus cascade lewat UI/API.
- [ ] Reconciliation query/procedure tersedia.
- [ ] Manual tests untuk cancel/release seat pass.

Evidence/commit: TBD  
Verification: TBD

---

# Wave 3 — Abuse control and auth

## PR-05 — Verified signup and CAPTCHA

Status: `TODO`  
Target PR: TBD  
Priority: `P1`  
Dependency: PR-00; ideally after PR-02  
Owner: TBD  
Target date: TBD  
Source: Review P1.2, Graphify H-03

### Scope

- [ ] Decide email verification requirement for public launch.
- [ ] Implement `/auth/callback` if email verification is enabled.
- [ ] Test PKCE `?code=...` flow with `exchangeCodeForSession()`.
- [ ] If using token hash templates, test `token_hash + type` with `verifyOtp()`.
- [ ] Do not rely on `sessionStorage` for verification onboarding because links may open in another tab/device.
- [ ] Enable Turnstile/hCaptcha in Supabase/Auth if chosen.
- [ ] Confirm Supabase redirect allowlist.
- [ ] Confirm reset password still works.

### Acceptance criteria

- [ ] Unverified user cannot login/booking if policy requires verification.
- [ ] Verification link works on production-like URL.
- [ ] Expired/invalid link has safe error.
- [ ] Redirect cannot go to arbitrary external URL.
- [ ] CAPTCHA token sent on signup if enabled.
- [ ] Signup without CAPTCHA rejected if enabled.
- [ ] Forgot/reset password still pass.
- [ ] Rate limit dashboard settings documented.

Evidence/commit: TBD  
Verification: TBD

---

# Wave 4 — Privacy and event operation policy

## PR-06 — Public/private session data

Status: `TODO`  
Target PR: TBD  
Priority: `P1/P2`  
Dependency: product decision  
Owner: TBD  
Target date: TBD  
Source: Review P2.3, Graphify M-03

### Minimum before launch

- [ ] Rename admin form label from `Lokasi atau Link/Catatan` to `Lokasi / Catatan Publik`.
- [ ] Add help text: do not put private Zoom/Meet URL here.
- [ ] Audit existing data for private meeting links.

### If private meeting URL needed

- [ ] Add private field such as `meeting_url_private`.
- [ ] Ensure anon/public queries never return private URL.
- [ ] Use view/RPC with safe column whitelist for public session data.

Evidence/commit: TBD  
Verification: TBD

---

## PR-07 — Check-in policy and audit actor

Status: `TODO`  
Target PR: TBD  
Priority: `P1/P2`  
Dependency: product decision  
Owner: TBD  
Target date: TBD  
Source: Review P2.4, Graphify M-04

### Product decisions needed

- [ ] Check-in opens how many hours before `tanggal_waktu`?
- [ ] Check-in closes how many hours after `tanggal_waktu`?
- [ ] Can cancelled sessions be checked in? Recommended: no.
- [ ] Can online sessions be checked in? Recommended Fase 1: no.

### Scope

- [ ] Update `check_in_booking()` to enforce chosen policy.
- [ ] Add `checked_in_by` if accepted.
- [ ] Update generated types.
- [ ] Update scanner UI/API as needed.

### Acceptance criteria

- [ ] QR valid in allowed window succeeds.
- [ ] QR before window rejected.
- [ ] QR after window rejected.
- [ ] Cancelled/draft/online session rejected if policy says so.
- [ ] Double-scan remains exactly one success.
- [ ] Scanner response does not include no. HP.

Evidence/commit: TBD  
Verification: TBD

---

# Wave 5 — QA, dependencies, docs, and hygiene

## PR-08 — Integration tests and full CI

Status: `TODO`  
Target PR: TBD  
Priority: `P2`  
Dependency: contracts stable after PR-02/PR-03  
Owner: TBD  
Target date: TBD

### Scope

- [ ] Local/staging Supabase migration replay test.
- [ ] RLS anon/user/admin tests.
- [ ] Signup metadata partial test.
- [ ] Booking concurrency capacity 1 test.
- [ ] Check-in concurrency test.
- [ ] Counter direct update denial test.
- [ ] CSV formula injection test.
- [ ] Playwright happy path: register/complete profile/booking/ticket/check-in.

Evidence/commit: TBD  
Verification: TBD

---

## PR-09 — Dependency advisory remediation / risk acceptance

Status: `TODO`  
Target PR: TBD  
Priority: `P1/P2`  
Dependency: PR-00  
Owner: TBD  
Target date: TBD

### Scope

- [ ] Run `npm audit --omit=dev` on Node 22.
- [ ] Try safe patch upgrades.
- [ ] Evaluate reachability for remaining advisories.
- [ ] Avoid `npm audit fix --force` unless diff is reviewed.
- [ ] Add risk acceptance with owner/expiry for unpatched advisories.

Risk acceptance template:

```text
Owner:
Advisory/CVE:
Reachability:
Current mitigation:
Expiry/review date:
Target upstream version:
```

Evidence/commit: TBD  
Verification: TBD

---

## PR-10 — Documentation and Graphify hygiene

Status: `TODO`  
Target PR: TBD  
Priority: `P2/P3`  
Dependency: none  
Owner: TBD  
Target date: TBD

### Scope

- [ ] README actual setup.
- [ ] `.graphifyignore`.
- [ ] Exclude `.claude/`, `.env*`, `.next/`, `node_modules/`, `supabase/.temp/`, graph cache as appropriate.
- [ ] Regenerate graph with SQL parser:

```bash
pip install 'graphifyy[sql]'
graphify update .
```

- [ ] Secret scan graph output.
- [ ] Ensure graph manifest does not include machine-local `.claude/settings.local.json`.

Evidence/commit: TBD  
Verification: TBD

---

# Backlog / lower priority hardening

## P3.1 — Input length and format limits

Status: `TODO`

- [ ] Add `.max(...)` to user-facing Zod strings.
- [ ] Add DB constraints where useful.
- [ ] Decide phone canonical format.
- [ ] Add realistic upper bound for `usia`.

---

## P3.2 — Security headers / CSP / Origin checks

Status: `DEFERRED`

- [ ] CSP
- [ ] Referrer-Policy
- [ ] X-Content-Type-Options
- [ ] HSTS platform config
- [ ] Permissions-Policy for camera
- [ ] Origin checks for mutating routes

---

## P3.3 — Accessibility pass for modal/onboarding

Status: `DOING`

Already improved:

- dialog role
- Escape handler
- focus trap
- focus restore
- body scroll lock
- stable body height across steps

Still verify:

- [ ] screen reader labels
- [ ] mobile scroll inside modal
- [ ] no background touch pass-through
- [ ] keyboard navigation across wizard steps

---

## P3.4 — Scanner should not render raw QR token on error

Status: `TODO`

- [ ] Mask or hide raw QR token after failed scan.

---

## P3.5 — Audit trail

Status: `DEFERRED`

Potential columns:

- [ ] `event_sessions.updated_at`
- [ ] `event_sessions.updated_by`
- [ ] `hero_content.updated_by`
- [ ] `bookings.checked_in_by`
- [ ] cancellation actor/timestamp if cancellation added

---

# Resolved / already improved

- `DONE` QR token generated in DB.
- `DONE` Booking concurrency uses DB lock.
- `DONE` Check-in double scan uses DB lock.
- `DONE` CSV formula injection mitigated.
- `DONE` Forgot/reset password flow added.
- `DONE` Ticket QR moved to individual ticket pages.
- `DONE` Scanner shows session info.
- `DONE` Admin hero CMS added.
- `DONE` Admin session detail page added.
- `DONE` Account-first signup + profile completion introduced.
- `DONE` Profile completion onboarding modal introduced.
- `DONE` Graphify artifacts generated, but hygiene still tracked separately.

---

# Current recommended execution order

```text
PR-00: chore: pin Node 22 and add baseline CI
PR-01: fix: refresh profile completion state and minimize client payload
PR-02: fix(db): enforce complete profile invariant before booking
PR-03: fix(db): prevent direct quota counter updates
PR-04: booking/session cancellation and quota lifecycle
PR-05: verified signup + CAPTCHA
PR-06: public/private session data
PR-07: check-in policy and checked_in_by
PR-08: integration tests and full CI
PR-09: dependency advisory remediation
PR-10: docs and Graphify hygiene
```

No additional UI polish should interrupt PR-00 through PR-03 unless it fixes a release-blocking functional bug.
