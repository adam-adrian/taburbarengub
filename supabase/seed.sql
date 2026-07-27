-- ============================================================
-- Data contoh untuk pengembangan lokal.
--
-- Hanya dijalankan oleh `supabase db reset` / `supabase start`.
-- TIDAK PERNAH ikut ke produksi lewat `supabase db push`.
--
-- Tanggalnya relatif terhadap now() supaya tidak basi dan tidak
-- tertolak trigger guard_tanggal_sesi setiap beberapa hari.
-- ============================================================

insert into public.hero_content (id, judul_acara, filosofi_tabur, tagline, nama_pemateri, bio_pemateri)
values (
  1,
  'Tabur Bareng UB',
  'Tabur adalah ikhtiar menebar ilmu dan menumbuhkan kesadaran melalui tadabbur yang bertahap, terarah, dan konsisten.',
  'Tadabbur kekuatan muslimin yang tertidur',
  'Ustadz Budi Ashari',
  'Pemateri utama program Tabur Bareng UB.'
)
on conflict (id) do update set
  judul_acara    = excluded.judul_acara,
  filosofi_tabur = excluded.filosofi_tabur,
  tagline        = excluded.tagline,
  nama_pemateri  = excluded.nama_pemateri,
  bio_pemateri   = excluded.bio_pemateri;

-- Satu sesi per skenario yang perlu diuji di UI.
insert into public.event_sessions
  (nama_sesi, tipe, tanggal_waktu, lokasi_atau_link, deskripsi, kapasitas, kuota_terisi, status)
values
  -- Jalur bahagia: bisa dibooking.
  ('Sesi 1 — Tadabbur Pembuka', 'offline', now() + interval '10 days',
   'Masjid Raden Patah UB', 'Sesi pembuka yang terbuka untuk umum.', 60, 0, 'published'),

  -- Tombol harus mati dengan alasan "Kuota Penuh".
  ('Sesi 2 — Kelas Penuh', 'offline', now() + interval '14 days',
   'Gedung Widyaloka UB', 'Dipakai untuk menguji tampilan kuota habis.', 5, 5, 'published'),

  -- Tombol harus mati dengan alasan "Terkunci" (Fase 2).
  ('Sesi 3 — Kelas Online', 'online', now() + interval '21 days',
   'Link Zoom dikirim ke member', 'Sesi online terkunci sampai membership aktif.', 40, 0, 'published'),

  -- Tidak boleh muncul di landing sama sekali.
  ('Sesi 4 — Draft Belum Terbit', 'offline', now() + interval '30 days',
   'Belum ditentukan', 'Masih draft, hanya admin yang boleh melihat.', 50, 0, 'draft')
on conflict do nothing;
