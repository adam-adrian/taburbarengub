-- ============================================================
--   1. Pemegang tiket boleh membaca sesinya walau sudah di-unpublish
--   2. Sesi bertanggal lampau tidak bisa dipublikasikan
--   3. nama_sesi tidak boleh kosong (sebelumnya hanya dijaga di browser)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Policy pemegang tiket.
--
-- event_sessions_select_published_or_admin hanya mengizinkan
-- status='published'. Begitu admin mengubah sesi jadi draft atau
-- cancelled, pemegang tiket yang sah kehilangan seluruh detail sesinya
-- dan /tiket-saya menampilkan "Data sesi tidak bisa dimuat. Hubungi
-- panitia." — padahal QR-nya masih ada dan masih valid.
--
-- Dibatasi ke status <> 'draft': sesi yang dibatalkan tetap perlu
-- terlihat oleh peserta yang sudah terlanjur booking, tapi sesi yang
-- belum pernah dipublikasi jangan sampai bocor lewat booking hasil test.
--
-- Tidak rekursif: policy `bookings` tidak merujuk balik ke
-- event_sessions. Subquery-nya sendiri sudah tersaring oleh
-- bookings_select_own_or_admin, jadi hanya bisa cocok dengan row
-- milik pemanggil. Index (user_id, session_id) sudah disediakan oleh
-- constraint unique_user_per_session.
--
-- auth.uid() dibungkus subselect supaya planner mengevaluasinya sekali
-- sebagai InitPlan, bukan sekali per row.
-- ------------------------------------------------------------
create policy event_sessions_select_pemegang_tiket
  on public.event_sessions
  for select
  to authenticated
  using (
    status <> 'draft'
    and exists (
      select 1
      from public.bookings b
      where b.session_id = event_sessions.id
        and b.user_id = (select auth.uid())
    )
  );

-- ------------------------------------------------------------
-- 2. Guard tanggal sisi publish.
--
-- Harus trigger, bukan CHECK constraint: now() tidak IMMUTABLE, jadi
-- Postgres menolaknya di dalam check constraint.
--
-- Draft tetap boleh bertanggal lampau supaya sesi lama bisa diarsipkan.
-- Yang diblokir hanya menerbitkannya.
--
-- Guard-nya sengaja TIDAK tanpa syarat. Database ini sudah punya sesi
-- published bertanggal lampau ("abcfe", 2026-07-25). Kalau setiap update
-- pada row semacam itu ditolak, admin justru terkunci dari datanya
-- sendiri — mengubah deskripsinya pun gagal, dan pesan errornya akan
-- terbaca seperti bug.
--
-- Jadi yang diblokir hanya perubahan yang benar-benar memperburuk:
--   - menyisipkan sesi published yang tanggalnya sudah lewat
--   - menerbitkan sesi yang tanggalnya sudah lewat
--   - memundurkan tanggal sesi published ke masa lalu
-- Mengedit field lain pada sesi lampau yang sudah terlanjur published
-- tetap boleh, termasuk membatalkannya atau memperbaiki tanggalnya.
-- ------------------------------------------------------------
create or replace function public.guard_tanggal_sesi()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.status = 'published'
     and new.tanggal_waktu <= now()
     and (
       tg_op = 'INSERT'
       or old.status <> 'published'
       or old.tanggal_waktu is distinct from new.tanggal_waktu
     )
  then
    raise exception 'sesi bertanggal lampau tidak bisa dipublikasikan'
      using errcode = 'TB301', hint = 'SESI_TANGGAL_LAMPAU';
  end if;
  return new;
end;
$$;

create trigger trg_guard_tanggal_sesi
  before insert or update on public.event_sessions
  for each row execute function public.guard_tanggal_sesi();

-- ------------------------------------------------------------
-- 3. nama_sesi tidak boleh kosong.
--
-- Sebelumnya hanya dijaga di session-form.tsx, yaitu di browser —
-- tempat JWT admin sendiri bisa melewatinya dengan memanggil PostgREST
-- langsung. Semua invariant harus hidup di database, karena kebijakan
-- "tanpa service-role key" berarti backend nanti punya privilege yang
-- persis sama dengan browser admin.
-- ------------------------------------------------------------
alter table public.event_sessions
  add constraint nama_sesi_tidak_kosong
  check (length(btrim(nama_sesi)) > 0);
