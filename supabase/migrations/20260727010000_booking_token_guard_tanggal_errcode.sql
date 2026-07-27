-- ============================================================
-- Menggabungkan tiga perubahan yang menyentuh fungsi yang sama.
-- Badan fungsi Postgres diganti utuh, jadi memecahnya jadi beberapa
-- migration hanya akan saling menimpa.
--
--   1. qr_token digenerate di database, bukan dikirim client
--   2. Guard tanggal: sesi yang sudah lewat tidak bisa dibooking
--   3. Errcode unik per kondisi, menggantikan P0001 yang dipakai
--      untuk empat hal berbeda
--   4. Cabut EXECUTE dari role `anon` (drift yang ditemukan saat
--      membandingkan live dengan file)
-- ============================================================

-- ------------------------------------------------------------
-- 1. Cabut akses anon dari kedua RPC.
--
-- `revoke all ... from public` di schema lama TIDAK mencabut apa pun
-- dari `anon`: itu role bernama yang menerima EXECUTE lewat
-- ALTER DEFAULT PRIVILEGES milik Supabase, bukan lewat pseudo-role
-- PUBLIC. Terbukti di live — panggilan anon ke check_in_booking masuk
-- sampai ke badan fungsi dan ditolak oleh guard auth.uid() di dalamnya,
-- bukan oleh Postgres.
--
-- Belum bisa dieksploitasi karena kedua fungsi memeriksa auth.uid()
-- sendiri, tapi defense-in-depth-nya bolong.
-- ------------------------------------------------------------
revoke all on function public.check_in_booking(text) from anon;

-- ------------------------------------------------------------
-- 2. create_booking: ganti arity.
--
-- WAJIB drop eksplisit. Membuang parameter menghasilkan fungsi dengan
-- arity berbeda, jadi `create or replace` akan MENINGGALKAN overload
-- lama tetap hidup dan tetap ter-grant ke authenticated — perbaikan
-- keamanannya jadi kosmetik belaka.
-- ------------------------------------------------------------
drop function if exists public.create_booking(uuid, text);

create or replace function public.create_booking(p_session_id uuid)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.event_sessions;
  v_booking public.bookings;
begin
  if (select auth.uid()) is null then
    raise exception 'auth required'
      using errcode = '28000', hint = 'AUTH_DIPERLUKAN';
  end if;

  select * into v_session
  from public.event_sessions
  where id = p_session_id
  for update;

  -- `if not found` lebih tepat daripada `if v_session is null`. Yang lama
  -- kebetulan bekerja karena semua kolom jadi NULL saat tidak ada row,
  -- tapi itu bergantung pada bentuk tabel.
  if not found then
    raise exception 'sesi tidak ditemukan'
      using errcode = 'TB101', hint = 'SESI_TIDAK_DITEMUKAN';
  end if;

  -- Sesi draft/cancelled sengaja dilaporkan sebagai "tidak ditemukan".
  -- Membedakannya akan memberi tahu siapa pun yang menebak UUID bahwa
  -- ada sesi draft di sana — bocor lebih banyak daripada SELECT policy.
  --
  -- Teks message-nya HARUS sama persis dengan cabang `not found` di atas.
  -- PostgREST meneruskan message ke client, jadi membedakannya di situ
  -- membatalkan seluruh maksud penyamaran ini walau errcode-nya sama.
  if v_session.status <> 'published' then
    raise exception 'sesi tidak ditemukan'
      using errcode = 'TB101', hint = 'SESI_TIDAK_DITEMUKAN';
  end if;

  if v_session.tipe <> 'offline' then
    raise exception 'sesi online terkunci di fase 1'
      using errcode = 'TB102', hint = 'SESI_ONLINE_BELUM_DIBUKA';
  end if;

  -- Guard baru. Tanpa ini sesi yang sudah lewat tetap bisa dibooking,
  -- dan itu pasti kejadian tepat setelah sesi pertama selesai.
  if v_session.tanggal_waktu <= now() then
    raise exception 'sesi sudah lewat'
      using errcode = 'TB104', hint = 'SESI_SUDAH_LEWAT';
  end if;

  -- Dicek sebelum kuota supaya pesan errornya akurat: orang yang sudah
  -- punya tiket tidak perlu diberi tahu bahwa kuotanya penuh.
  if exists (
    select 1 from public.bookings b
    where b.user_id = (select auth.uid())
      and b.session_id = p_session_id
  ) then
    raise exception 'sudah booking sesi ini'
      using errcode = 'TB105', hint = 'BOOKING_DUPLIKAT';
  end if;

  if v_session.kuota_terisi >= v_session.kapasitas then
    raise exception 'kuota penuh'
      using errcode = 'TB103', hint = 'SESI_KUOTA_PENUH';
  end if;

  update public.event_sessions
  set kuota_terisi = kuota_terisi + 1
  where id = p_session_id;

  -- Token dibuat di sini, bukan diterima dari pemanggil. Sebelumnya
  -- p_qr_token datang dari client dan RPC ini ter-grant ke authenticated,
  -- jadi user login mana pun bisa memanggil PostgREST langsung dan memilih
  -- token yang bisa ditebak untuk tiketnya sendiri — melanggar PRD §7.
  --
  -- pgcrypto terpasang di schema `extensions`, sementara search_path
  -- fungsi ini `public`. Tanpa kualifikasi, gen_random_bytes tidak resolve.
  insert into public.bookings (user_id, session_id, qr_token)
  values (
    (select auth.uid()),
    p_session_id,
    encode(extensions.gen_random_bytes(32), 'hex')
  )
  returning * into v_booking;

  return v_booking;
exception
  when unique_violation then
    -- unique_user_per_session. Tabrakan qr_token secara kriptografis
    -- dapat diabaikan. Errcode-nya disamakan dengan pre-check di atas
    -- supaya client hanya perlu mengenali satu kode.
    raise exception 'sudah booking sesi ini'
      using errcode = 'TB105', hint = 'BOOKING_DUPLIKAT';
end;
$$;

revoke all on function public.create_booking(uuid) from public;
revoke all on function public.create_booking(uuid) from anon;
grant execute on function public.create_booking(uuid) to authenticated;

-- ------------------------------------------------------------
-- 3. check_in_booking: errcode unik.
--
-- Logikanya tidak berubah — locking FOR UPDATE dan urutan pemeriksaannya
-- sudah benar dan aman dari double-scan. Yang diganti hanya P0001/P0002
-- yang sebelumnya dipakai untuk beberapa kondisi berbeda sehingga tidak
-- bisa dibedakan oleh pemanggil.
-- ------------------------------------------------------------
create or replace function public.check_in_booking(p_qr_token text)
returns table (
  booking_id     uuid,
  user_id        uuid,
  session_id     uuid,
  nama           text,
  booking_status text,
  checked_in_at  timestamptz
)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_booking public.bookings;
begin
  if (select auth.uid()) is null or not public.is_admin() then
    raise exception 'akses ditolak'
      using errcode = '42501', hint = 'AKSES_DITOLAK';
  end if;

  select * into v_booking
  from public.bookings
  where qr_token = p_qr_token
  for update;

  if not found then
    raise exception 'qr tidak valid'
      using errcode = 'TB201', hint = 'QR_TIDAK_VALID';
  end if;

  if v_booking.status = 'checked_in' then
    raise exception 'qr sudah dipakai'
      using errcode = 'TB202', hint = 'QR_SUDAH_DIPAKAI';
  end if;

  if v_booking.status <> 'booked' then
    raise exception 'booking tidak aktif'
      using errcode = 'TB203', hint = 'BOOKING_TIDAK_AKTIF';
  end if;

  update public.bookings b
  set status = 'checked_in',
      checked_in_at = now()
  where b.id = v_booking.id
  returning * into v_booking;

  return query
  select
    v_booking.id,
    v_booking.user_id,
    v_booking.session_id,
    u.nama,
    v_booking.status,
    v_booking.checked_in_at
  from public.users u
  where u.id = v_booking.user_id;
end;
$$;

revoke all on function public.check_in_booking(text) from public;
revoke all on function public.check_in_booking(text) from anon;
grant execute on function public.check_in_booking(text) to authenticated;
