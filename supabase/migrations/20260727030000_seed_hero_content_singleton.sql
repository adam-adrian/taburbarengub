-- ============================================================
-- Pastikan baris singleton hero_content (id = 1) selalu ada.
--
-- Kenapa perlu: baseline diambil lewat `supabase db dump`, yang
-- schema-only. Baris `insert into hero_content (id) values (1)` dari
-- schema tulis tangan tidak ikut terbawa.
--
-- Akibatnya di database baru mana pun (lokal, staging, atau kalau
-- produksi pernah dibangun ulang): hero_content kosong, dan karena
-- tabel ini hanya punya policy UPDATE tanpa INSERT, admin tidak akan
-- pernah bisa membuat barisnya lewat API. Konten hero jadi terkunci
-- permanen di nilai fallback yang di-hardcode di komponen — persis
-- kebalikan dari PRD 5.2 yang mewajibkannya dikelola admin.
--
-- Database produksi saat ini sudah punya barisnya, jadi di sana
-- migration ini tidak melakukan apa-apa.
-- ============================================================

insert into public.hero_content (id)
values (1)
on conflict (id) do nothing;

-- Admin tetap tidak boleh menyisipkan baris kedua — constraint id = 1
-- sudah mencegahnya — tapi tanpa policy ini baris yang hilang tidak
-- bisa dipulihkan lewat aplikasi sama sekali.
create policy hero_content_admin_insert
  on public.hero_content
  for insert
  to authenticated
  with check (id = 1 and (select public.is_admin()));
