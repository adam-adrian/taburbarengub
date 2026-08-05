# Roadmap — TaburBarengUB

> Dokumen keputusan & rencana kerja menuju rilis **pertengahan Agustus 2026**.
> Ditulis: 2026-08-03 · Diperbarui: 2026-08-05 (Fase R + Fase R+ selesai)
> HEAD saat ditulis: `8c74d8a` (PR-00..03 `DONE`, sudah di `origin/main`)
>
> Dokumen ini melengkapi:
> - `docs/REVIEW_ACTION_TRACKER.md` — status action item PR-00..10 & backlog P3.x
> - `hasil-review-analisa/docs/ANALISIS_MENDALAM.md` — audit performa/keamanan/konsistensi
> - `hasil-review-analisa/docs/EXECUTION_GRAPH.md` — alur eksekusi nyata per fitur
> - `hasil-review-analisa/docs/DATA_MODEL.md` — skema DB lengkap

---

## 1. Tujuan & batasan

**Deadline:** app siap dipakai **pertengahan Agustus 2026** (~12 hari kerja dari 2026-08-03).

**Wajib selesai sebelum deadline:**
1. **Restyle/redesign** seluruh app mengikuti design system baru.
2. **Restrukturisasi** struktur project (arsitektur feature-based).

**Ditunda sampai setelah deadline:** PR-04 s/d PR-10 dan backlog P3.1–P3.7 di `REVIEW_ACTION_TRACKER.md`, **kecuali** muncul blocker kritis (app benar-benar tidak bisa dipakai — bukan sekadar kurang aman/rapi).

**Rencana jangka panjang yang memengaruhi keputusan arsitektur sekarang:**
- Fitur **subscription** (berbayar, kemungkinan QRIS/Midtrans/Xendit)
- Fitur **exclusive content** (konten khusus member berbayar)
- Kemungkinan **native Android client** yang memakai backend yang sama

---

## 2. Arsitektur target

### 2.1 Keputusan: Feature-based (vertical slice) + split `client/server/shared`

**Struktur target:**

```
src/
├── app/                          ← routing shell TIPIS (Next.js filesystem routing)
│   ├── api/bookings/route.ts     ← import dari features/booking/server
│   ├── sesi/[id]/page.tsx        ← import dari features/session/{server,client}
│   └── ...
│
├── features/
│   ├── booking/
│   │   ├── client/               ← Client Component ("use client")
│   │   ├── server/               ← service, business logic
│   │   └── shared/               ← Zod schema, types, DTO
│   ├── checkin/
│   ├── profile/
│   ├── session/
│   ├── hero/
│   ├── subscription/             ← nanti
│   └── content/                  ← nanti
│
├── components/ui/                ← komponen design system (hasil restyle)
└── lib/                          ← infra lintas fitur
    ├── supabase/                 ← client.ts, server.ts, middleware.ts
    ├── auth/                     ← require-admin.ts
    ├── types/                    ← database.types.ts
    └── format.ts                 ← helper presentational bersama (BARU)
```

**Mental model** (dipetakan dari MVVM/Compose):

| Folder | Padanan Android |
|---|---|
| `features/*/client/` | Compose UI (composable interaktif — state + event saja) |
| `features/*/server/` | ViewModel + Repository + backend logic |
| `features/*/shared/` | data class, DTO, sealed class |
| `app/` | Navigation graph (routing saja) |

**Kenapa pilihan ini:**

1. **Seam-nya sudah ada.** `booking-service.ts` + `booking.schema.ts` + `api/bookings/route.ts` sudah satu fitur, cuma tersebar horizontal di 3 folder. Sama untuk checkin, profile, session, hero. Ini memutar 90°, bukan restrukturisasi radikal.

2. **Subscription akan memecah pola layered.** Fitur sekarang = 1 service + 1 schema. Subscription butuh: payment gateway call, webhook handler, invoice, entitlement check, expiry/renewal — 4-5 file untuk satu fitur. Di `lib/services/` flat, itu menumpuk tanpa indikasi kesatuan.

3. **Split `client/server` bikin boundary eksekusi kelihatan di filesystem.** Ini menutup gap yang teridentifikasi: graphify (AST-based) tidak bisa melihat boundary Server/Client Component, dan tidak bisa melacak `supabase.rpc('nama')` → SQL function (string literal, bukan import).

4. **Kontrak REST untuk Android tetap aman** — route handler tetap di `app/api/`, isinya tipis, import dari `features/*/server/`.

**Constraint teknis:** `page.tsx` dan `route.ts` **tidak bisa pindah** dari `app/` — filesystem routing Next.js mengharuskannya. Jadi `app/` = shell tipis (routing + composition), logic pindah ke `features/`.

### 2.2 Yang sengaja DITOLAK (jangan disarankan ulang)

| Ditolak | Alasan |
|---|---|
| **Layer `repository/` terpisah** | Service sudah tipis; mayoritas business logic ada di Postgres RPC (`create_booking()`, `check_in_booking()`, `complete_user_profile()`). Repository sekarang = passthrough kosong. Tambah **nanti** kalau subscription butuh query kompleks yang tidak cocok di RPC. |
| **Clean Architecture** (domain/application/infrastructure) | Overkill untuk skala ini; tiap fitur kecil jadi butuh 4 file boilerplate. |
| **Atomic Design** (atoms/molecules/organisms) | `components/ui/` flat sudah cukup — design system sudah menentukan komponennya. |
| **Server Actions untuk mutation utama** | Server Action Next.js-only, tidak bisa dipanggil native Android client. Semua mutation lintas-platform tetap lewat Route Handler + service. Lihat §2.3. |
| **Back-link dihoist ke `layout.tsx`** | Terlihat rapi di atas kertas, tapi back-link ada **di dalam** `<div maxWidth>` tiap page, dan lebarnya beda-beda (680/760/820). Hoist berarti layout harus ikut mengambil alih `<main>` + container + menyeragamkan lebar = refactor page-shell + perubahan visual, yang itu kerjaan restyle. `<BackLink />` menyelesaikan duplikasinya tanpa menyentuh visual sama sekali. Lihat §7.6. |
| **`router.back()` polos untuk semua back-link** | Banyak entry point app ini tanpa history in-app (link tiket di-share, QR discan, bookmark scanner). Di situ `back()` keluar dari app. Lihat §7.6. |
| **Menyimpan "halaman sebelumnya" untuk back-link** | Versi satu-slot bikin bolak-balik antara dua halaman tanpa pernah naik. Versi stack = menulis ulang history browser yang sudah benar. Lihat §7.6. |

### 2.3 Kontrak lintas platform (untuk Android nanti)

```
                 Service Layer (features/*/server/)
                          ▲
              ┌───────────┴───────────┐
              │                       │
      Route Handler              (Server Action)
      app/api/.../route.ts       hanya untuk aksi web-spesifik
              │
      ┌───────┴────────┐
   Browser          Android (nanti)
```

**Aturan:** business logic **selalu** di service layer. Route handler tipis (parse → auth → panggil service → return JSON). Jangan pernah taruh business logic di route handler atau di Client Component.

**Jangan** migrasi API route yang ada ke Server Action "demi simplicity" — itu merusak kontrak Android.

---

## 3. Audit gaya kode (2026-08-03)

Diperiksa langsung terhadap kode, bukan asumsi.

### 3.1 Functional Programming — ✅ sudah bagus, pertahankan

- Service layer: **nol class** (kecuali subclass `Error`), **nol `let`**, **nol mutasi array** (`.push`/`.sort`/`.splice` — grep bersih).
- `submitProfile()` return `{ ok: true } | { ok: false; error: string }` — **Result type / discriminated union**, padanan sealed class Kotlin.
- `createInitialState(profile)` — pure function.
- Server Component = fungsi dari props ke UI (padanan `@Composable`).

**Aksi: tidak ada.** Jangan diubah saat restrukturisasi.

### 3.2 Unified Data Flow — ⚠️ struktur benar, state modeling bocor

**Yang sudah benar** — aliran data satu arah nyata:

```
Server Component (fetch) → props → Client Component
      ↑                                    ↓
      └──── router.refresh() ←──── fetch /api → service → Supabase
```

`router.refresh()` berperan sebagai `emit(newState)` — me-re-run Server Component, jadi **source of truth tetap di server**. Tidak ada store client yang bisa drift. Tidak ada pola `useEffect(() => fetch(), [])` untuk ambil data.

**Yang bocor** — state terpecah jadi banyak `useState` independen, bukan satu state object:

| File | Jumlah `useState` |
|---|---|
| `complete-profile/profile-completion-prompt.tsx` | 9 |
| `(auth)/reset-password/page.tsx` | 8 |
| `(auth)/register/page.tsx` | 7 |
| `admin/scanner/page.tsx` | 7 |

`useReducer` dipakai **0 kali** di seluruh project.

**Konsekuensi:** impossible state bisa direpresentasikan — misal `loading=true` bersamaan `error!=null`, atau `mode='reminder'` sementara `step='welcome'`. Tidak ada yang mencegah di level tipe. Tidak ada `reduce()` — transisi state tersebar inline di event handler.

**Aksi:** konversi 4 file di atas ke **discriminated union + `useReducer`**. Contoh untuk scanner:

```ts
// sebelum: 6 useState independen
const [status, setStatus] = useState<ScannerStatus>('idle')
const [result, setResult] = useState<string | null>(null)
const [checkInResult, setCheckInResult] = useState<CheckInResult | null>(null)
const [checkingIn, setCheckingIn] = useState(false)
const [error, setError] = useState<string | null>(null)

// sesudah: satu discriminated union — impossible state tidak bisa dibuat
type ScannerState =
  | { tag: 'idle' }
  | { tag: 'scanning' }
  | { tag: 'checking_in'; token: string }
  | { tag: 'success'; result: CheckInResult }
  | { tag: 'error'; message: string }
```

Padanan sealed class + `when` di Kotlin; exhaustiveness dijamin TypeScript.

### 3.3 DRY — ⚠️ logic layer rapi, helper presentational bolong

| Duplikasi | Kali | Lokasi |
|---|---|---|
| `formatDateTime` | **8** | `admin/peserta/page`, `admin/sesi/page`, `admin/sesi/[id]/page`, `admin/scanner/page`, `tiket-saya/page`, `tiket-saya/[id]/page`, `app/page`, `sesi/[id]/page` |
| `getUser` + type `UserSummary` | 3 | `admin/peserta/page`, `admin/peserta/export.csv/route`, `admin/sesi/[id]/page` |
| `statusStyle` | 3 | `tiket-saya/page`, `tiket-saya/[id]/page`, `admin/sesi/page` |
| `nullableTrimmedText` (Zod) | 2 | `validators/session.schema.ts`, `validators/hero.schema.ts` |
| auth admin inline | 1 | `admin/peserta/export.csv/route.ts` pakai cek inline, bukan `requireAdmin()` |

**Yang sudah DRY dengan benar** (jangan diusik): `complete-profile/profile-form-shared.ts` (dipakai form standalone + modal), `requireAdmin()` (3 admin route), pola `PETA_ERROR` per service.

**Aksi:** ekstrak ke `lib/format.ts` + `features/*/shared/` saat restrukturisasi (gratis, sekalian pindah file).

---

## 4. Design system

**Sumber:** `/home/neikami/Unduhan/tabur-design/` (di luar repo)

| File | Isi |
|---|---|
| `design-tokens.css` | Token lengkap: warna (primitive → semantic), spacing 2xs–3xl, radius, tipografi, shadow, motion |
| `components.css` | Komponen: button, field/input, card, navbar, footer, badge/tag, avatar, photo treatment |
| `design tabur.html` | Preview/showcase design system |
| `main logo tabur.svg`, `utama.svg` | Aset logo |

**Font:**
- `--font-body`: **Hauora Sans** — open-source (SIL OFL), self-host via `npm install @fontsource/hauora-sans`
- `--font-headline`: Fraunces (placeholder untuk Roca One — berbayar)
- `--font-subheadline`: Poppins (placeholder untuk Agrandir Bold — berbayar)
- `--font-accent`: Dancing Script (placeholder untuk ITC Edwardian Script — berbayar)

Ganti nilai `--font-*` saja kalau lisensi asli tersedia; tidak perlu sentuh komponen.

**Aturan brand penting:** foto berisi ayat/hadits/doa **tidak boleh** pakai overlay foto — treatment lewat tipografi saja (class `.photo--type-only`).

### 4.1 Gap komponen (belum ada di design system)

Halaman app butuh komponen ini, belum tersedia. **Keputusan: didesain sendiri dengan inspirasi Google Material You** (tonal container, elevation tier, radius besar), tetap memakai token warna/spacing yang ada agar konsisten dengan brand.

| Komponen | Dibutuhkan oleh |
|---|---|
| Table | `admin/peserta` |
| Modal/dialog | `complete-profile/profile-completion-prompt` |
| Dashboard stat card | `admin/page` (dashboard) |
| Alert/error banner | semua form (mengganti `errorBoxStyle`) |
| Scanner viewfinder chrome | `admin/scanner` |

Ditulis di file terpisah `src/styles/components-app.css` agar tidak tercampur dengan file asli dari desainer.

### 4.2 Keputusan teknis restyle

- `design-tokens.css` + `components.css` **disalin apa adanya** ke `src/styles/`. Kalau ada update dari tim desain, tinggal replace — tidak tercampur kode sendiri.
- Import global sekali di `app/layout.tsx` (bukan CSS Module — file aslinya memang ditulis sebagai global class `.btn`/`.card`/dst).
- Font berbayar via `next/font/google` (pola sama seperti Geist sekarang). Hauora Sans self-host via Fontsource.
- `src/app/page.module.css` **dihapus** (dead file, sisa scaffold Next.js — tidak diimport siapa pun).
- `src/app/admin/sesi/sesi.module.css` dimigrasi ke sistem baru.
- Style helper lokal di `profile-form-shared.ts` (`inputStyle`, `errorBoxStyle`, `primaryButtonStyle`) dihapus, diganti className.

### 4.3 Kondisi awal (baseline)

- **24 file** mengandung inline style, total **496 instance** `style={{...}}`
- Hanya 1 file pakai CSS Module (`admin/sesi/page.tsx` → `sesi.module.css`)
- `globals.css` cuma 49 baris
- Font saat ini: Geist + Geist Mono via `next/font/google`
- Tidak ada design token, tidak ada shared style constant (kecuali helper lokal per form)

---

## 5. Urutan kerja

**Rekomendasi: restrukturisasi dulu (1-2 hari), baru restyle (~10 hari).**

Alasan: restyle akan menulis ulang isi 24 file yang sama. Memindahkan file yang belum disentuh jauh lebih murah daripada memindahkan file yang baru selesai di-restyle. Kalau restyle duluan, tiap file disentuh 2x.

### Fase R — Restrukturisasi — **SELESAI** (2026-08-05)

1. ✅ Bikin struktur `features/*/{client,server,shared}/`
2. ✅ Pindahkan service + schema + client component per fitur
3. ✅ Tipiskan `app/api/*/route.ts` jadi shell (import dari `features/*/server/`)
4. ✅ Ekstrak duplikasi: `formatDateTime`, `statusStyle` → `lib/format.ts`; `getUser`/`UserSummary` → `features/*/shared/`; `nullableTrimmedText` → shared Zod helper
5. ✅ `export.csv/route.ts` pakai `requireAdmin()` (hapus cek inline)
6. ✅ Konversi ke discriminated union + `useReducer` — **2 file, bukan 4**. `scanner/page.tsx` (`scanner-reducer.ts`) dan `profile-completion-prompt.tsx` (`prompt-visibility-reducer.ts`). Dua kandidat sisanya diaudit dan ditolak: state-nya nggak punya kombinasi mustahil, konversi cuma nambah indirection.
7. ✅ `npm run lint && npm run typecheck && npm run build` lulus di tiap langkah

**Risiko:** sedang. Banyak import path berubah, tapi typecheck menangkap semuanya. Tidak ada perubahan behavior.

### Fase R+ — Konsolidasi navigasi — **SELESAI** (2026-08-05)

Tidak direncanakan di awal; muncul dari keluhan "tiap page ada link back yang diset manual, dan back-nya serasa reload".

1. ✅ 14 back-link manual → `<BackLink />` tanpa argumen + `lib/navigation/parent-routes.ts`
2. ✅ `loading.tsx` per `layout.tsx` (3 file) — bukan per page
3. ✅ `router.push` → `router.replace` pasca-login/register (form yang sudah dilewati nggak boleh dicapai lewat back)
4. ✅ `router.back()` kalau ada history in-app, `replace` ke parent kalau nggak (`lib/navigation/history-depth.ts`)

Dikerjakan sekarang, bukan ditunda ke restyle, karena memangkas permukaan edit
restyle dari 14 page jadi 1 komponen. Detail keputusan di §7.6.

### Fase 0–6 — Restyle (~10-13 hari)

| Fase | Isi | Estimasi |
|---|---|---|
| 0 | Setup token + font + navbar/footer + alert banner (paling sering dipakai) | 1 hari |
| 1 | Komponen gap sisanya: modal, table, stat card, scanner chrome | 1-2 hari |
| 2 | Auth pages (login/register/forgot/reset/logout) — kecil, validasi workflow | 1 hari |
| 3 | Public & member: landing, sesi detail, booking-button, complete-profile + modal, tiket-saya | 2-3 hari |
| 4 | Admin: dashboard, sesi (list/detail/new/edit/form), hero, peserta + table | 3-4 hari |
| 5 | Scanner — paling custom, paling akhir | 1 hari |
| 6 | QA: responsive check, hapus dead code, lint/typecheck/build, smoke test manual | 1-2 hari |

**Total:** ~12-15 hari termasuk restrukturisasi. Deadline pertengahan Agustus masih realistis, buffer tipis.

---

## 6. Ditunda (bukan bagian roadmap ini)

Semua tercatat detail di `docs/REVIEW_ACTION_TRACKER.md`:

- **PR-04** Booking lifecycle, cancellation, quota reconciliation — butuh keputusan produk dulu (boleh cancel sendiri? admin boleh cancel peserta? cancelled bebasin seat?)
- **PR-05** Verified signup + CAPTCHA (scope diperluas: S5 enumerasi email, S6 password policy)
- **PR-06** Public/private session data (sebagian sudah ada)
- **PR-07** Check-in policy & audit actor (`checked_in_by` belum ada di schema)
- **PR-08** Integration tests & full CI (**nol test** di repo saat ini)
- **PR-09** Dependency advisory (4 high — `sharp` dorman karena app tidak pakai `next/image`; **jangan** `npm audit fix --force`, itu menurunkan ke `next@9.3.3`)
- **PR-10** Docs & graphify hygiene (`.graphifyignore` belum ada)
- **P3.6** 🔴 Rate limiting `/api/bookings` & `/api/check-in` — prioritas tertinggi di backlog
- **P3.7** Error mapping `hero-service` (outlier: 4 dari 5 service konsisten, hero langsung 500 tanpa mapping)

---

## 7. Ringkasan diskusi arsitektur

> Sumber: `/home/neikami/Proyek/ChatGPT-Arsitektur_App_di_Next.js.md` (riset sebelum project ini berjalan) + sesi analisis 2026-08-03.

### 7.1 Pemetaan mental model Android → Next.js

| ArchiveTune (Android) | Next.js App Router |
|---|---|
| Screen | `app/.../page.tsx` |
| Composable | React Component |
| ViewModel | **Tidak ada padanan langsung** — dipecah jadi Server Component (fetch) + Client Component (UI state) + Server Action/Route Handler (aksi) + Service (business logic) |
| Repository | Service layer |
| Room | Supabase/Postgres |
| Navigation Compose | App Router (filesystem routing) |
| StateFlow | Props + React state |
| UDF | Tetap relevan, malah jadi model mental utama |

**Kunci yang membuat konsep "klik":** jangan cari padanan ViewModel di Next.js. Anggap **Client Component = composable interaktif** (cuma terima state + kirim event, tidak tahu SQL/Supabase), dan **Server Component = parent yang menyiapkan data**.

### 7.2 Perbedaan fundamental dari Android

Di Android semua kode ada di device (bisa di-decompile). Di Next.js dunia terbagi dua: kode server **tidak pernah** sampai ke browser. File yang cuma di-import Server Component/Server Action tidak masuk bundle browser sama sekali. Karena itu:

- Browser = *hostile environment* — jangan pernah percaya client, server selalu validasi ulang
- Cek role dilakukan **sebelum** HTML dikirim; browser bahkan tidak menerima halaman admin kalau tidak berhak
- Business logic + secret + validasi tetap di server

Di project ini prinsip itu diperkuat lagi: **tidak ada service-role key di `src/`** — seluruh akses data lewat publishable key + RLS, dan invariant dipaksa di level database (CHECK constraint, RLS policy, SECURITY DEFINER function), bukan cuma di aplikasi.

### 7.3 Kenapa REST API, bukan Server Action

Pertanyaan aslinya: "gimana kalau backend app Next.js ini mau dipakai native Android client juga?"

Jawaban: **jangan jadikan Server Action sebagai public API.** Server Action cuma bisa dipanggil dari Next.js — Android tidak bisa. Pisahkan business logic dari transport layer:

- **Service layer** = pusat business logic (satu-satunya)
- **Route Handler** (`app/api/`) = kontrak publik lintas platform
- **Server Action** = hanya untuk aksi web-spesifik

Ini persis pola yang sudah dipakai codebase ini (semua mutation lewat `app/api/*` + `service.ts`) — keputusan sadar, bukan kebetulan.

### 7.4 Catatan tentang Supabase

Supabase memang didesain supaya client boleh connect langsung (anon key + RLS + policy). Model hybrid yang dianggap paling cocok:

- **Langsung ke Supabase:** CRUD sederhana milik user sendiri (login, baca/update profil, avatar, realtime) — cukup dijaga RLS
- **Lewat backend:** semua yang punya business logic atau nilai finansial (booking, membership, payment, webhook, admin action)

Saat ini **semua** operasi di project ini lewat service layer (belum ada yang direct-to-Supabase dari client), kecuali auth (`supabase.auth.*` dipanggil langsung dari halaman auth — wajar, itu SDK auth).

**Aturan mutlak:** jangan pernah taruh `service_role` key di browser atau aplikasi Android.

### 7.5 Keterbatasan graphify yang perlu diingat

graphify (AST-based) bagus untuk dependency & impact analysis (god node, community detection), **tapi**:

- Tidak membedakan Server Component vs Client Component
- Tidak melacak `supabase.rpc('nama_fungsi')` → SQL function (string literal, tidak ada `import`) — makanya node SQL RPC terlihat "terisolasi" padahal secara eksekusi satu rantai penuh
- Cohesion score ≠ kualitas desain software

Untuk memahami alur eksekusi nyata, baca `hasil-review-analisa/docs/EXECUTION_GRAPH.md` (dilacak manual per fitur), bukan dependency graph.

### 7.6 Navigasi "Kembali": Up vs Back

Ini bagian yang paling banyak salah belok, jadi ditulis lengkap supaya nggak diulang.

**Masalah yang dilaporkan:** back-link "serasa load ulang dan nggak preserve route history, beda dengan gesture back di Android yang instan".

Ternyata itu **dua masalah berbeda** yang kebetulan muncul sebagai satu gejala.

**Masalah kecepatan.** `<Link>` itu soft navigation, bukan reload. Tapi semua
tujuan back-link kecuali `/login` dirender dinamis (baca cookie Supabase), dan
per dokumentasi Next: dynamic page **tidak di-prefetch dan tidak di-client-cache
tanpa `loading.js`**, jadi tiap klik dijamin roundtrip server tanpa umpan balik
visual apa pun. Diukur pada production build: 115–280ms waktu render server,
spike sampai detik. `loading.tsx` menutupi itu dengan skeleton — tidak
menghilangkannya. Perlu dicatat: **prefetch cuma jalan di production**, jadi
efek `loading.tsx` tidak kelihatan sama sekali kalau ditest di `npm run dev`.

**Masalah semantik.** Istilah Android-nya persis: **Up** (parent tetap sesuai
hierarki, terlepas dari cara user sampai) vs **Back** (pop history stack apa
adanya). Dipetakan ke alur nyata app ini, keduanya menghasilkan tujuan yang
**sama** di hampir semua halaman. Bedanya cuma dua tempat, dan hasilnya split:
di `/admin/sesi/[id]/edit` Back lebih benar (kembali ke detail, bukan dibuang ke
daftar); di `/tiket-saya/[id]` sesudah booking Up lebih benar (ke daftar tiket,
bukan balik ke sesi yang barusan dibooking).

**Jadi kenapa tetap pakai `back()`?** Bukan demi ketepatan tujuan — Up sudah
cukup benar. Demi kecepatan: Next secara khusus mengecualikan navigasi
back/forward dari aturan cache ("pages are not cached by default but are reused
during browser back/forward navigation"), justru supaya scroll position dan
layout tidak lompat. Artinya `back()` = nol request, dan 115–280ms itu hilang,
bukan disamarkan.

**Yang perlu app ketahui cuma satu hal:** apakah history stack-nya punya isi
in-app. Itu satu integer (`lib/navigation/history-depth.ts`), bukan daftar route
— history browser sudah menyimpan route-nya dengan benar.

**Jebakan yang sudah menggigit sekali.** Waktu tidak ada history in-app, fallback
**harus** `replace`, tidak boleh `push`. Push menambah entri maju; entri itu lalu
berada di belakang halaman parent, jadi klik berikutnya — yang sekarang melihat
depth > 0 — malah `back()` ke anak yang barusan ditinggal, lalu push lagi.
Infinite loop, dan cukup dua klik dari deep link QR untuk memicunya. Ini bukan
edge case; ini alur utama tiket yang di-share.

**Konsekuensi yang diterima sadar:** sesudah naik lewat `replace`, tombol back
browser tidak kembali ke halaman asal. Untuk entry point dari luar app itu
memang semantik Up yang benar — posisi ditukar, bukan ditumpuk.

**Kalau nanti mau roundtrip-nya benar-benar hilang** (bukan cuma untuk back),
jalurnya `cacheComponents: true` + `use cache` + `export const unstable_instant`
untuk validasi struktur Suspense di build time. Itu perubahan arsitektur, belum
diambil.

---

## 8. Log keputusan

| Tanggal | Keputusan | Alasan |
|---|---|---|
| 2026-08-03 | Arsitektur target: feature-based vertical slice + `client/server/shared` | Seam sudah ada; subscription butuh modul boundary; boundary eksekusi jadi terlihat |
| 2026-08-03 | Tolak repository layer, Clean Architecture, Atomic Design | Premature/overkill untuk skala sekarang |
| 2026-08-03 | Restrukturisasi **sebelum** restyle | Restyle menulis ulang 24 file yang sama — hindari sentuh 2x |
| 2026-08-03 | Komponen gap didesain sendiri, inspirasi Material You | Design system belum cover table/modal/stat card/alert/scanner |
| 2026-08-03 | File design system disalin apa adanya ke `src/styles/` | Update dari desainer tinggal replace, tidak tercampur kode sendiri |
| 2026-08-03 | PR-04..10 & P3.x ditunda sampai setelah deadline | Restyle prioritas; kecuali blocker kritis |
| 2026-08-03 | 4 komponen ber-`useState`-banyak dikonversi ke discriminated union + `useReducer` | Menghilangkan impossible state; sesuai gaya UDF/Compose |
| 2026-08-05 | Konversi `useReducer` cuma 2 file, bukan 4 | Dua kandidat sisanya nggak punya kombinasi state mustahil — konversi cuma nambah indirection |
| 2026-08-05 | Back-link dikonsolidasi ke `<BackLink />` + `PARENT_ROUTES`, bukan dihoist ke `layout.tsx` | Hoist butuh layout mengambil alih container tiap page + menyeragamkan lebar = perubahan visual, itu kerjaan restyle. Lihat §7.6 |
| 2026-08-05 | `loading.tsx` ditaruh per `layout.tsx` (3 file), bukan per page | Boundary di atas layout yang di-share nggak berefek pada client navigation |
| 2026-08-05 | Back-link pakai `router.back()` kalau ada history in-app, `replace` ke parent kalau nggak | Diukur: tujuan back-link dinamis makan 115–280ms roundtrip yang `loading.tsx` cuma bisa tutupi. `back()` baca dari client cache = nol request. Lihat §7.6 |
| 2026-08-05 | Fallback back-link wajib `replace`, dilarang `push` | Push bikin infinite loop lewat deep link QR dalam dua klik. Lihat §7.6 |
| 2026-08-05 | Konsolidasi navigasi dikerjakan sekarang, bukan ditunda ke restyle | Memangkas permukaan edit restyle dari 14 page jadi 1 komponen |
