# Smoke Test Checklist — TaburBarengUB

Gunakan checklist ini setelah deploy, setelah migration Supabase, atau setelah perubahan yang menyentuh auth, booking, admin, QR, atau RLS.

## 0. Environment

- [ ] App yang diuji adalah URL deploy yang benar.
- [ ] Supabase project yang dipakai adalah production/staging yang benar.
- [ ] Migration remote sudah sinkron:

```bash
npx supabase migration list --linked
```

- [ ] Jangan uji production dengan `.env.development.local` yang masih menunjuk ke Supabase lokal.

## 1. Public landing

- [ ] `/` terbuka tanpa login.
- [ ] Hero content tampil.
- [ ] `Sesi Mendatang` hanya menampilkan sesi published yang belum lewat.
- [ ] `Histori Sesi` menampilkan sesi published yang sudah lewat jika ada.
- [ ] Sesi `draft` tidak tampil di publik.
- [ ] Sesi online tampil locked.
- [ ] Sesi offline future punya tombol `Lihat Detail`.

## 2. Auth

- [ ] User baru bisa register dengan email/password.
- [ ] Row muncul di Supabase Auth.
- [ ] Row profile minimal muncul di `public.users` dengan `profile_completed = false`.
- [ ] Setelah signup, user diarahkan ke `/complete-profile` jika session langsung aktif.
- [ ] User bisa melengkapi profil di `/complete-profile`.
- [ ] Setelah profil lengkap, `profile_completed = true`.
- [ ] User bisa login.
- [ ] Tombol logout berfungsi.
- [ ] Link `/login` ↔ `/register` berfungsi.
- [ ] `/forgot-password` mengirim pesan generik setelah submit email.
- [ ] Link reset password mengarah ke `/reset-password` dan password baru bisa disimpan.

## 3. Admin access

- [ ] User biasa tidak bisa membuka `/admin`.
- [ ] Admin bisa membuka `/admin`.
- [ ] Admin bisa membuka `/admin/sesi`.
- [ ] Admin bisa membuka `/admin/peserta`.
- [ ] Admin bisa membuka `/admin/scanner`.
- [ ] Admin bisa membuka `/admin/hero`.

## 4. Admin kelola sesi

- [ ] Admin bisa membuat sesi `draft`.
- [ ] Admin bisa membuat sesi `published` dengan tanggal masa depan.
- [ ] Admin tidak bisa publish sesi bertanggal lampau.
- [ ] Admin bisa edit nama/deskripsi/lokasi sesi.
- [ ] Admin tidak bisa set kapasitas lebih kecil dari `kuota_terisi`.
- [ ] `kuota_terisi` tidak bisa diedit manual dari UI.

## 5. Admin hero CMS

- [ ] Admin bisa mengubah `judul_acara`.
- [ ] Admin bisa mengubah `filosofi_tabur`.
- [ ] Admin bisa mengubah `tagline`.
- [ ] Admin bisa mengubah `nama_pemateri`.
- [ ] Admin bisa mengubah `bio_pemateri`.
- [ ] Admin bisa mengisi/menghapus `foto_pemateri_url`.
- [ ] Perubahan terlihat di landing page.

## 6. Booking user

Siapkan sesi offline published dengan tanggal masa depan dan kuota tersedia.

- [ ] User login dengan profil belum lengkap tidak bisa booking dan diarahkan/diminta melengkapi profil.
- [ ] User login dengan profil lengkap bisa membuka detail sesi.
- [ ] User bisa klik `Booking Seat`.
- [ ] Setelah sukses, user diarahkan ke `/tiket-saya`.
- [ ] Tiket tampil dengan status `Booked`.
- [ ] `/tiket-saya` menampilkan list tiket tanpa QR besar.
- [ ] Klik `Lihat QR` membuka halaman detail satu tiket.
- [ ] QR tampil hanya di halaman detail tiket.
- [ ] Row `bookings` bertambah.
- [ ] `event_sessions.kuota_terisi` naik.
- [ ] Booking kedua untuk sesi yang sama ditolak / UI menampilkan sudah booking.
- [ ] Sesi online tidak bisa dibooking.
- [ ] Sesi lampau tidak bisa dibooking.
- [ ] Sesi penuh tidak bisa dibooking.

## 7. QR check-in

Gunakan HP/browser admin untuk test scanner di HTTPS deploy URL.

- [ ] Admin bisa membuka `/admin/scanner`.
- [ ] Browser meminta izin kamera.
- [ ] QR tiket valid menghasilkan `Check-in berhasil`.
- [ ] Hasil check-in menampilkan nama sesi dan jadwal sesi.
- [ ] `bookings.status` berubah menjadi `checked_in`.
- [ ] `checked_in_at` terisi.
- [ ] Scan ulang QR yang sama menghasilkan `QR sudah dipakai`.
- [ ] QR random/palsu menghasilkan `QR tidak valid`.
- [ ] Response scanner tidak menampilkan `no_hp`.

## 8. Admin peserta dan CSV

- [ ] `/admin/peserta` bisa memilih sesi.
- [ ] Peserta booking muncul di tabel.
- [ ] Status `booked` / `checked_in` tampil benar.
- [ ] Export CSV terdownload.
- [ ] CSV berisi peserta sesi yang benar.
- [ ] CSV tidak mengeksekusi formula spreadsheet dari input user.
- [ ] User biasa/non-admin tidak bisa mengakses export CSV.

## 9. Navigasi "Kembali"

Perilaku back-link beda tergantung ada/tidaknya history in-app, jadi dua jalurnya
harus dites terpisah. Lihat `docs/ROADMAP.md` §7.6.

- [ ] Turun normal `/` → `/tiket-saya` → tiket detail, lalu Kembali 2x sampai `/`. Harus **instan** (tidak ada skeleton, tidak ada request baru) dan posisi scroll kembali seperti semula.
- [ ] Buka URL tiket detail langsung di tab baru (simulasi link di-share / QR), lalu Kembali 2x. Harus sampai `/` tanpa keluar dari app dan **tanpa muter** balik ke halaman tiket.
- [ ] Buka `/admin/scanner` langsung di tab baru, klik Kembali. Harus ke `/admin`, bukan keluar app.
- [ ] Pakai tombol back/forward browser di tengah alur, lalu klik Kembali. Tidak boleh muter antara dua halaman.
- [ ] Sesudah login berhasil, tombol back browser tidak boleh kembali ke form login.
- [ ] Klik-tengah / buka-di-tab-baru pada tombol Kembali tetap membuka halaman parent di tab baru.

Prefetch cuma aktif di production build. Untuk mengukur kecepatan, tes lewat
`npm run build && npm run start`, bukan `npm run dev`.

## 10. Build checks

Sebelum deploy besar:

```bash
npm run lint
npm run build
```

Keduanya harus lulus.

## 11. Catatan hasil

Isi manual setelah test:

```text
Tanggal test:
URL app:
Supabase project:
Tester:
Hasil: PASS / FAIL
Catatan:
```
