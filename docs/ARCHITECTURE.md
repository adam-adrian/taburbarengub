# Architecture Notes — TaburBarengUB

Dokumen ini menjelaskan keputusan arsitektur project TaburBarengUB Fase 1.
Tujuannya bukan membuat arsitektur terlihat keren, tapi supaya developer berikutnya tahu **di mana logic seharusnya ditaruh** dan **kenapa**.

## 1. Ringkasan singkat

Project ini adalah aplikasi Next.js + Supabase dengan pendekatan layered:

```text
Browser UI
  ↓
Next.js pages/components
  ↓
Next.js API routes untuk mutasi domain
  ↓
Service layer
  ↓
Supabase Auth + Postgres
  ↓
RLS/RPC/constraints sebagai enforcement terakhir
```

Kalau dipetakan ke istilah klasik:

```text
View        ≈ React pages/components
Controller  ≈ src/app/api/**/route.ts
Service     ≈ src/features/*/server/*
Model/Data  ≈ Supabase tables + generated Database types
Invariant   ≈ Postgres RLS/RPC/triggers/constraints
```

Ini bukan MVC/MVVM murni. Lebih tepat disebut **layered Next.js architecture** dengan pola **API-first untuk mutasi** dan **database-enforced invariants**.

## 2. Tujuan arsitektur

1. MVP cepat untuk Fase 1.
2. Tetap cukup rapi untuk dipelihara setelah launch.
3. Aman walaupun browser/client tidak dipercaya.
4. Native/mobile app bisa memakai API yang sama di masa depan.
5. Tidak melakukan refactor besar yang tidak perlu sebelum launch.

## 3. Stack utama

- Next.js App Router
- TypeScript
- Supabase Auth
- Supabase Postgres
- RLS policies
- Postgres RPC functions
- Zod validation
- `html5-qrcode` untuk scanner
- `react-qr-code` untuk QR ticket

## 4. Layer dan tanggung jawab

### 4.1 Presentation layer

Lokasi:

```text
src/app/**/page.tsx
src/app/**/layout.tsx
src/app/**/loading.tsx
src/components/ui/*
```

Tugas:

- render halaman,
- menampilkan data,
- layout/UI state ringan,
- link/navigation,
- empty state/error state sederhana.

Contoh:

```text
src/app/page.tsx
src/app/(member)/tiket-saya/page.tsx
src/app/admin/sesi/page.tsx
src/components/ui/back-link.tsx
```

`src/components/ui/` adalah komponen presentational lintas fitur. Komponen
yang cuma dipakai satu fitur tinggal di `src/features/<fitur>/client/`.

### 4.2 Client interaction layer

Lokasi:

```text
Client Component dengan 'use client'
```

Tugas:

- `useState`,
- handle `onSubmit` / `onClick`,
- memanggil API route via `fetch`,
- menampilkan loading/error.

Contoh:

```text
src/features/booking/client/booking-button.tsx
src/features/session/client/session-form.tsx
src/app/admin/scanner/page.tsx
```

State yang punya banyak kemungkinan kombinasi ditulis sebagai discriminated
union + `useReducer` di modul terpisah tanpa import React, supaya transisinya
bisa diuji lepas dari komponen — lihat `src/features/checkin/client/scanner-reducer.ts`
dan `src/features/profile/client/prompt-visibility-reducer.ts`.

### 4.3 API/controller layer

Lokasi:

```text
src/app/api/**/route.ts
```

Tugas:

- menerima HTTP request,
- cek auth/role,
- parse JSON,
- validasi Zod,
- panggil service,
- mapping error ke HTTP response.

Contoh:

```text
POST /api/bookings
POST /api/check-in
POST /api/admin/sessions
PATCH /api/admin/sessions/[id]
```

### 4.4 Service layer

Lokasi:

```text
src/features/*/server/*
```

Tugas:

- operasi aplikasi reusable,
- call Supabase table/RPC,
- mapping error DB ke error aplikasi,
- logic kecil yang tidak semestinya ada di route handler.

Contoh:

```text
src/features/booking/server/booking-service.ts
src/features/checkin/server/checkin-service.ts
src/features/session/server/session-service.ts
```

Zod schema, DTO, dan tipe yang dipakai bareng server + client ada di
`src/features/*/shared/`.

### 4.5 Auth/data-access helper

Lokasi:

```text
src/lib/supabase/*
src/lib/auth/*
```

Tugas:

- membuat Supabase client browser/server,
- refresh session cookie via proxy,
- helper `requireAdmin()`.

### 4.6 Database enforcement layer

Lokasi:

```text
supabase/migrations/*
```

Tugas:

- table schema,
- constraints,
- RLS policies,
- RPC functions,
- triggers,
- grants/revokes.

Aturan penting seperti kuota booking, double-scan QR, dan hak akses data **harus** ditegakkan di layer ini.

### 4.7 Navigation layer

Lokasi:

```text
src/lib/navigation/*
src/components/ui/back-link.tsx
src/components/ui/history-depth-tracker.tsx
src/app/**/loading.tsx
```

Tugas:

- memetakan route ke parent-nya (`parent-routes.ts`),
- melacak apakah ada history in-app (`history-depth.ts`),
- render tombol "Kembali" tanpa argumen per halaman (`back-link.tsx`),
- menyediakan loading state instan per boundary layout.

Aturan yang gampang salah:

- **Tujuan back-link nggak boleh ditulis manual di page.** Semua ada di
  `PARENT_ROUTES`. Menambah route baru tanpa mendaftarkannya bikin `BackLink`
  nggak render dan nge-`console.warn` di dev.
- **`loading.tsx` ditaruh mengikuti `layout.tsx`, bukan mengikuti page.** Pada
  client navigation Next cuma me-render ulang di bawah layout yang di-share
  source dan destination; boundary di atas layout itu nggak berefek. App ini
  punya tiga layout (`app/`, `app/admin/`, `app/(member)/`), jadi tiga
  `loading.tsx`. Menambah `loading.tsx` di folder tanpa `layout.tsx` menghasilkan
  file mubazir.
- **Setiap `router.replace()` wajib didahului `notifyRouteReplaced()`.** replace
  menukar entri history, bukan menambah; tanpa penanda itu perubahan pathname-nya
  terhitung sebagai navigasi maju dan penghitung kedalaman jadi kelebihan.

## 5. Keputusan arsitektur utama

### 5.1 Auth tetap direct ke Supabase Auth

Aturan:

- Login/register/logout boleh memakai Supabase Auth client langsung.
- Tidak perlu proxy semua auth lewat `/api/auth/*` untuk Fase 1.

Kenapa:

- Supabase Auth sudah merupakan identity API.
- Native app nanti juga bisa memakai Supabase Auth SDK.
- Membungkus auth lewat API sendiri sekarang menambah kompleksitas tanpa manfaat besar.

### 5.2 Mutasi domain lewat API route

Aturan:

- Operasi write/mutation domain tidak dilakukan langsung dari Client Component ke tabel Supabase.
- Client Component memanggil API route.

Contoh yang sudah mengikuti pola ini:

```text
booking seat              → POST /api/bookings
QR check-in               → POST /api/check-in
admin create session      → POST /api/admin/sessions
admin update session      → PATCH /api/admin/sessions/[id]
participant CSV export    → GET /admin/peserta/export.csv
```

Kenapa:

- auth check, role check, validasi, dan error mapping konsisten di satu jalur,
- UI tidak perlu tahu detail tabel,
- native app/admin client lain bisa memakai endpoint yang sama,
- mengurangi direct write dari browser ke database.

### 5.3 Server Component boleh membaca data server-side

Aturan:

- Server Component boleh membaca data memakai Supabase server client atau service function.
- Tidak wajib melakukan `fetch()` ke API route sendiri hanya demi terlihat API-first.

Kenapa:

- Native reuse sudah terpenuhi ketika endpoint `/api/*` tersedia.
- Server Component fetch ke API sendiri menambah HTTP hop, base URL, dan cookie forwarding tanpa manfaat reuse tambahan.
- Read path server-side tetap tidak mengekspos secret ke browser.

Catatan:

- Untuk operasi read yang ingin dipakai native app, tetap boleh buat API endpoint paralel.
- Web page internal boleh panggil service langsung agar lebih efisien.

### 5.4 RLS/RPC tetap final enforcement

Aturan:

- Jangan menghapus atau melonggarkan RLS hanya karena sudah ada API route.
- Business invariant penting tetap ditegakkan di Postgres.

Kenapa:

- Supabase publishable key bersifat public.
- User bisa memanggil Supabase API langsung dari browser/native client.
- API route bisa punya bug.
- RLS/RPC/constraints adalah jaring pengaman terakhir.

### 5.5 Invariant sensitif harus di database

Aturan:

Taruh invariant berikut di database/RPC/constraints, bukan hanya di UI/API:

- user hanya boleh booking sesi yang valid,
- sesi harus `published`, `offline`, dan belum lewat untuk booking,
- kuota tidak boleh jebol,
- user tidak boleh booking sesi yang sama dua kali,
- QR tidak boleh dipakai check-in dua kali,
- check-in hanya admin,
- user tidak boleh self-escalate role.

Kenapa:

- UI dan API bisa dilewati atau salah implementasi.
- Concurrency seperti booking dan scan QR harus atomic di DB.

### 5.6 Sesi lampau adalah histori, bukan hilang

Aturan:

- Sesi `published` dengan `tanggal_waktu < now()` tidak ditampilkan sebagai `Sesi Mendatang`.
- Sesi tersebut masuk section `Histori Sesi`.
- Detail sesi lampau tetap bisa dibuka, tapi booking disabled.

Kenapa:

- Fase mendatang berpotensi menambahkan replay/video arsip.
- Histori sesi berguna sebagai bukti program berjalan.
- Past session bukan status bisnis; itu state turunan dari waktu.

### 5.7 Jangan edit `kuota_terisi` manual dari UI

Aturan:

- Admin boleh edit `kapasitas`.
- Admin tidak boleh edit `kuota_terisi` manual.

Kenapa:

- `kuota_terisi` adalah counter system-managed.
- Sumber kebenaran booking tetap tabel `bookings` + RPC booking.
- Edit manual bisa menyebabkan mismatch kuota.

## 6. Data flow utama

### 6.1 Booking

```text
booking-button.tsx
  ↓ POST /api/bookings
api/bookings/route.ts
  ↓ Zod + auth check
booking-service.ts
  ↓ rpc('create_booking')
Postgres create_booking()
  ↓
event_sessions + bookings
```

`create_booking()` melakukan:

- login required,
- session harus ada,
- session harus `published`,
- session harus `offline`,
- session belum lewat,
- duplicate booking ditolak,
- kuota dicek dalam lock,
- `qr_token` dibuat di database,
- booking row dibuat,
- `kuota_terisi` naik.

### 6.2 QR check-in

```text
admin/scanner/page.tsx
  ↓ POST /api/check-in
api/check-in/route.ts
  ↓ Zod + auth check
checkin-service.ts
  ↓ rpc('check_in_booking')
Postgres check_in_booking()
  ↓
bookings.status = checked_in
```

`check_in_booking()` melakukan:

- admin required,
- lock booking row,
- QR invalid ditolak,
- QR sudah dipakai ditolak,
- status booking harus `booked`,
- update ke `checked_in`.

### 6.3 Admin create/edit session

```text
session-form.tsx
  ↓ POST/PATCH /api/admin/sessions
api/admin/sessions route
  ↓ requireAdmin + Zod
session-service.ts
  ↓ Supabase server client
event_sessions
```

Validasi server:

- nama sesi non-empty,
- tipe valid,
- status valid,
- tanggal valid,
- kapasitas integer positif,
- kapasitas tidak boleh lebih kecil dari `kuota_terisi`.

Database tetap punya constraint/trigger tambahan.

## 7. Do / Don't

### Do

- Tambahkan API route untuk mutasi baru.
- Pakai Zod untuk validasi input API.
- Pakai service layer untuk logic reusable.
- Tambahkan migration untuk perubahan schema/RLS/RPC.
- Regenerate `database.types.ts` setelah migration.
- Pertahankan RLS sebagai enforcement utama.
- Pikirkan data flow sebelum mengubah fitur.

### Don't

- Jangan pakai service role key di browser.
- Jangan taruh `sb_secret_*` di `NEXT_PUBLIC_*`.
- Jangan direct write ke tabel Supabase dari Client Component untuk domain data.
- Jangan mengandalkan UI untuk security.
- Jangan mengedit `kuota_terisi` manual.
- Jangan hard delete data penting tanpa keputusan domain.
- Jangan menulis `<Link href="/...">← Kembali` manual di page — daftarkan di `PARENT_ROUTES`, pakai `<BackLink />`.
- Jangan memanggil `router.replace()` tanpa `notifyRouteReplaced()` lebih dulu.
- Jangan menjalankan migration baseline ke production yang sudah punya schema tanpa repair/history yang benar.

## 8. Cara menambah fitur baru

Sebelum coding, jawab dulu:

```text
Fitur ini read atau write?
Entry point-nya halaman/API mana?
Kalau menambah halaman: parent-nya apa? (daftarkan di PARENT_ROUTES)
Role siapa yang boleh?
Data input-nya apa?
Perlu Zod schema?
Tabel apa yang berubah?
Perlu RPC/transaction/lock?
RLS policy apa yang relevan?
Apa yang rusak kalau fitur ini salah?
Bagaimana manual test-nya?
```

Untuk fitur write/mutation, pola default:

```text
Client Component
  ↓ fetch()
API route
  ↓ auth/role + Zod
Service layer
  ↓ Supabase/RPC
Database
```

## 9. Database conventions awal

Belum semua tabel punya audit columns lengkap. Untuk perubahan ke depan:

- tabel mutable admin sebaiknya punya `updated_at` dan mungkin `updated_by`,
- lifecycle domain lebih baik memakai `status`, `cancelled_at`, `cancelled_by` daripada boolean `deleted`,
- action sensitif seperti check-in nantinya bisa butuh `checked_in_by`,
- audit columns harus diisi server/API/trigger, bukan mengandalkan UI.

Jangan menambah audit columns besar-besaran menjelang launch tanpa kebutuhan jelas.

## 10. Current known exceptions

- Login/register masih direct Supabase Auth dari Client Component. Ini disengaja.
- Beberapa Server Components masih membaca Supabase langsung. Ini boleh untuk read path.
- Styling masih banyak inline karena Fase 1 fokus fungsi. Restyle menyeluruh
  adalah fase kerja berikutnya — lihat `docs/ROADMAP.md`.
- Auth pages belum punya styling matang.
- Nol automated test di repo. Logic murni yang paling rawan (reducer, resolver
  parent route, penghitung kedalaman history) sengaja ditulis tanpa import React
  supaya gampang diuji begitu ada test runner. Lihat PR-08 di
  `docs/REVIEW_ACTION_TRACKER.md`.
- `loading.tsx` cuma menutupi latensi dengan skeleton, bukan menghilangkannya.
  Menghilangkan roundtrip butuh `cacheComponents` + `use cache` + validasi
  `unstable_instant` — perubahan arsitektur yang belum diambil.

## 11. Smoke test wajib sebelum deploy besar

Minimal:

```text
[ ] landing tampil
[ ] register user
[ ] login user
[ ] admin masuk /admin
[ ] admin buat sesi future published
[ ] user booking sesi
[ ] QR tampil di /tiket-saya
[ ] admin scan QR berhasil
[ ] scan ulang ditolak
[ ] peserta tampil di /admin/peserta
[ ] CSV export jalan
[ ] user biasa tidak bisa akses admin
[ ] tombol Kembali dari deep link tiket sampai ke / tanpa muter
```

Checklist lengkap ada di `docs/SMOKE_TEST.md`.

