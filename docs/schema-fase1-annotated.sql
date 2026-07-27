-- ============================================================
-- ⚠️  DOKUMENTASI — BUKAN SUMBER KEBENARAN. JANGAN DIJALANKAN.
--
-- Schema yang otoritatif ada di supabase/migrations/.
-- File ini disimpan karena komentarnya menjelaskan ALASAN di balik
-- tiap keputusan, yang hilang di output pg_dump.
--
-- Diverifikasi terhadap database live pada 2026-07-27: badan keempat
-- fungsi, kedelapan RLS policy, semua constraint dan index cocok.
-- Dua hal yang TIDAK tercermin di file ini:
--   1. Trigger on_auth_user_created di schema auth (ada di live, tidak
--      pernah ditulis di sini)
--   2. `revoke all ... from public` di bawah TIDAK bekerja seperti yang
--      terlihat — role `anon` tetap memegang EXECUTE lewat default
--      privileges Supabase. Lihat migration perbaikannya.
-- ============================================================
--
-- TaburBarengUB — Schema Fase 1 FINAL
-- Target: Supabase Postgres
-- Scope: Auth profile, event sessions, hero content, booking, QR check-in, RLS
-- ============================================================

-- Supabase biasanya sudah menyediakan pgcrypto, tapi ini aman untuk fresh project.
create extension if not exists pgcrypto;

-- ============================================================
-- USERS (profile table — linked 1:1 ke Supabase Auth)
-- ============================================================
-- Password, session, email confirmation, dll dipegang Supabase Auth.
-- Tabel public.users hanya menyimpan profil tambahan yang dibutuhkan PRD.

create table public.users (
  id         uuid primary key references auth.users(id) on delete cascade,
  nama       text not null,
  email      text not null unique,
  no_hp      text not null,
  usia       integer not null check (usia > 0),
  profesi    text,
  domisili   text,
  role       text not null default 'user' check (role in ('user', 'admin')),
  created_at timestamptz not null default now()
);

create index idx_users_email on public.users(email);

-- Trigger: otomatis membuat profile row setelah signup Supabase Auth.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nama text;
  v_no_hp text;
  v_usia integer;
begin
  v_nama := nullif(trim(coalesce(new.raw_user_meta_data->>'nama', '')), '');
  v_no_hp := nullif(trim(coalesce(new.raw_user_meta_data->>'no_hp', '')), '');

  begin
    v_usia := nullif(new.raw_user_meta_data->>'usia', '')::integer;
  exception when invalid_text_representation then
    raise exception 'Usia harus berupa angka';
  end;

  if v_nama is null then
    raise exception 'Nama wajib diisi';
  end if;

  if v_no_hp is null then
    raise exception 'No. HP wajib diisi';
  end if;

  if v_usia is null or v_usia <= 0 then
    raise exception 'Usia wajib diisi dan harus lebih dari 0';
  end if;

  insert into public.users (
    id,
    nama,
    email,
    no_hp,
    usia,
    profesi,
    domisili
  )
  values (
    new.id,
    v_nama,
    new.email,
    v_no_hp,
    v_usia,
    nullif(trim(coalesce(new.raw_user_meta_data->>'profesi', '')), ''),
    nullif(trim(coalesce(new.raw_user_meta_data->>'domisili', '')), '')
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- EVENT_SESSIONS
-- ============================================================

create table public.event_sessions (
  id               uuid primary key default gen_random_uuid(),
  nama_sesi        text not null,
  tipe             text not null check (tipe in ('offline', 'online')),
  tanggal_waktu    timestamptz not null,
  lokasi_atau_link text,
  deskripsi        text,
  kapasitas        integer not null check (kapasitas > 0),
  kuota_terisi     integer not null default 0 check (kuota_terisi >= 0),
  status           text not null default 'draft' check (status in ('draft', 'published', 'cancelled')),
  created_at       timestamptz not null default now(),

  constraint kuota_tidak_lebih_kapasitas check (kuota_terisi <= kapasitas)
);

create index idx_event_sessions_tanggal on public.event_sessions(tanggal_waktu);
create index idx_event_sessions_status on public.event_sessions(status);

-- ============================================================
-- HERO_CONTENT
-- ============================================================
-- Singleton table: hanya boleh ada satu row id = 1.

create table public.hero_content (
  id                 integer primary key default 1 check (id = 1),
  judul_acara        text not null default 'Tabur Bareng UB',
  filosofi_tabur     text,
  tagline            text,
  nama_pemateri      text,
  bio_pemateri       text,
  foto_pemateri_url  text,
  updated_at         timestamptz not null default now()
);

insert into public.hero_content (id) values (1);

-- ============================================================
-- BOOKINGS
-- ============================================================

create table public.bookings (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references public.users(id) on delete cascade,
  session_id     uuid not null references public.event_sessions(id) on delete cascade,
  qr_token       text not null unique,
  status         text not null default 'booked' check (status in ('booked', 'checked_in', 'cancelled')),
  created_at     timestamptz not null default now(),
  checked_in_at  timestamptz,

  -- Fase 1 belum ada cancel/re-book. Kalau nanti cancel aktif,
  -- pertimbangkan ganti constraint ini dengan partial unique index status <> 'cancelled'.
  constraint unique_user_per_session unique (user_id, session_id)
);

create index idx_bookings_qr_token on public.bookings(qr_token);
create index idx_bookings_session on public.bookings(session_id);
create index idx_bookings_user on public.bookings(user_id);

-- ============================================================
-- RLS HELPER: is_admin()
-- ============================================================
-- Didefinisikan sebelum policy/RPC yang memanggilnya agar file mudah dibaca.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  );
$$;

-- Function ini aman untuk anon: auth.uid() null, hasil false.
-- Grant ke anon dibutuhkan karena dipanggil di SELECT policy public event_sessions.
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ============================================================
-- RPC: create_booking
-- ============================================================
-- Atomic booking:
-- - login required
-- - hanya session published
-- - hanya offline untuk Fase 1
-- - lock row session dengan FOR UPDATE
-- - cek duplicate sebelum cek kuota untuk UX error yang akurat
-- - increment kuota_terisi
-- - insert booking + qr_token

create or replace function public.create_booking(p_session_id uuid, p_qr_token text)
returns public.bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  v_session public.event_sessions;
  v_booking public.bookings;
begin
  if auth.uid() is null then
    raise exception 'Kamu harus login dulu' using errcode = '28000';
  end if;

  select * into v_session
  from public.event_sessions
  where id = p_session_id
  for update;

  if v_session is null then
    raise exception 'Sesi tidak ditemukan' using errcode = 'P0002';
  end if;

  if v_session.status <> 'published' then
    raise exception 'Sesi belum tersedia untuk booking' using errcode = 'P0001';
  end if;

  if v_session.tipe <> 'offline' then
    raise exception 'Sesi online belum bisa dibooking di Fase 1' using errcode = 'P0001';
  end if;

  if exists (
    select 1
    from public.bookings b
    where b.user_id = auth.uid()
      and b.session_id = p_session_id
  ) then
    raise exception 'Kamu sudah booking sesi ini sebelumnya' using errcode = '23505';
  end if;

  if v_session.kuota_terisi >= v_session.kapasitas then
    raise exception 'Kuota penuh' using errcode = 'P0001';
  end if;

  update public.event_sessions
  set kuota_terisi = kuota_terisi + 1
  where id = p_session_id;

  insert into public.bookings (user_id, session_id, qr_token)
  values (auth.uid(), p_session_id, p_qr_token)
  returning * into v_booking;

  return v_booking;
exception
  when unique_violation then
    -- Biasanya unique_user_per_session. Collision qr_token secara kriptografis sangat kecil.
    raise exception 'Kamu sudah booking sesi ini sebelumnya' using errcode = '23505';
end;
$$;

revoke all on function public.create_booking(uuid, text) from public;
grant execute on function public.create_booking(uuid, text) to authenticated;

-- ============================================================
-- RPC: check_in_booking
-- ============================================================
-- Dipakai scanner staff/admin:
-- - admin only
-- - lock booking row
-- - reject QR invalid / sudah dipakai / booking tidak aktif
-- - update status checked_in
-- - return data minimal untuk layar staff

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
  if auth.uid() is null or not public.is_admin() then
    raise exception 'Akses ditolak' using errcode = '42501';
  end if;

  select * into v_booking
  from public.bookings
  where qr_token = p_qr_token
  for update;

  if v_booking is null then
    raise exception 'QR tidak valid' using errcode = 'P0002';
  end if;

  if v_booking.status = 'checked_in' then
    raise exception 'QR sudah dipakai' using errcode = 'P0001';
  end if;

  if v_booking.status <> 'booked' then
    raise exception 'Booking tidak aktif' using errcode = 'P0001';
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
grant execute on function public.check_in_booking(text) to authenticated;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================
-- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY itu public.
-- RLS adalah enforcement utama agar akses data tetap aman walau Supabase API
-- dipanggil langsung dari browser/native client.

alter table public.users enable row level security;
alter table public.event_sessions enable row level security;
alter table public.hero_content enable row level security;
alter table public.bookings enable row level security;

-- ---------- USERS ----------
-- Belum ada UPDATE policy untuk user biasa agar role tidak bisa diedit sendiri.
create policy users_select_own_or_admin
  on public.users
  for select
  to authenticated
  using (id = auth.uid() or public.is_admin());

-- ---------- EVENT_SESSIONS ----------
create policy event_sessions_select_published_or_admin
  on public.event_sessions
  for select
  to anon, authenticated
  using (status = 'published' or public.is_admin());

create policy event_sessions_admin_insert
  on public.event_sessions
  for insert
  to authenticated
  with check (public.is_admin());

create policy event_sessions_admin_update
  on public.event_sessions
  for update
  to authenticated
  using (public.is_admin())
  with check (public.is_admin());

create policy event_sessions_admin_delete
  on public.event_sessions
  for delete
  to authenticated
  using (public.is_admin());

-- ---------- HERO_CONTENT ----------
create policy hero_content_select_all
  on public.hero_content
  for select
  to anon, authenticated
  using (true);

create policy hero_content_admin_update
  on public.hero_content
  for update
  to authenticated
  using (public.is_admin())
  with check (id = 1 and public.is_admin());

-- ---------- BOOKINGS ----------
-- Tidak ada direct insert/update/delete policy untuk user biasa.
-- Booking dibuat lewat RPC create_booking(), check-in lewat RPC check_in_booking().
create policy bookings_select_own_or_admin
  on public.bookings
  for select
  to authenticated
  using (user_id = auth.uid() or public.is_admin());
