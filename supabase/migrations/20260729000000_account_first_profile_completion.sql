-- ============================================================
-- Account-first signup flow + profile completion.
--
-- Sebelumnya signup wajib mengirim metadata profil lengkap karena trigger
-- handle_new_user() langsung mengisi kolom NOT NULL di public.users.
-- Flow baru: user membuat akun dengan email/password dulu, lalu melengkapi
-- profil di /complete-profile sebelum booking.
-- ============================================================

alter table public.users
  add column if not exists nama_panggilan text;

alter table public.users
  add column if not exists profile_completed boolean not null default false;

-- Existing users yang sudah punya profil lengkap dianggap completed.
update public.users
set profile_completed = true
where nama is not null
  and btrim(nama) <> ''
  and no_hp is not null
  and btrim(no_hp) <> ''
  and usia is not null
  and usia > 0;

alter table public.users
  alter column nama drop not null,
  alter column no_hp drop not null,
  alter column usia drop not null;

-- Trigger signup sekarang membuat profile row minimal. Kalau metadata lengkap
-- tetap dikirim oleh client lama, data itu tetap disimpan dan profile bisa
-- langsung marked completed.
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nama text;
  v_nama_panggilan text;
  v_no_hp text;
  v_usia integer;
  v_profesi text;
  v_domisili text;
begin
  v_nama := nullif(trim(coalesce(new.raw_user_meta_data->>'nama', '')), '');
  v_nama_panggilan := nullif(trim(coalesce(new.raw_user_meta_data->>'nama_panggilan', '')), '');
  v_no_hp := nullif(trim(coalesce(new.raw_user_meta_data->>'no_hp', '')), '');
  v_profesi := nullif(trim(coalesce(new.raw_user_meta_data->>'profesi', '')), '');
  v_domisili := nullif(trim(coalesce(new.raw_user_meta_data->>'domisili', '')), '');

  begin
    v_usia := nullif(new.raw_user_meta_data->>'usia', '')::integer;
  exception when invalid_text_representation then
    raise exception 'Usia harus berupa angka';
  end;

  insert into public.users (
    id,
    nama,
    nama_panggilan,
    email,
    no_hp,
    usia,
    profesi,
    domisili,
    profile_completed
  )
  values (
    new.id,
    v_nama,
    v_nama_panggilan,
    new.email,
    v_no_hp,
    v_usia,
    v_profesi,
    v_domisili,
    v_nama is not null and v_no_hp is not null and v_usia is not null and v_usia > 0
  );

  return new;
end;
$$;

create or replace function public.complete_user_profile(
  p_nama text,
  p_nama_panggilan text,
  p_no_hp text,
  p_usia integer,
  p_profesi text,
  p_domisili text
)
returns public.users
language plpgsql
security definer
set search_path = public
as $$
declare
  v_profile public.users;
  v_nama text;
  v_nama_panggilan text;
  v_no_hp text;
  v_profesi text;
  v_domisili text;
begin
  if (select auth.uid()) is null then
    raise exception 'auth required'
      using errcode = '28000', hint = 'AUTH_DIPERLUKAN';
  end if;

  v_nama := nullif(trim(coalesce(p_nama, '')), '');
  v_nama_panggilan := nullif(trim(coalesce(p_nama_panggilan, '')), '');
  v_no_hp := nullif(trim(coalesce(p_no_hp, '')), '');
  v_profesi := nullif(trim(coalesce(p_profesi, '')), '');
  v_domisili := nullif(trim(coalesce(p_domisili, '')), '');

  if v_nama is null then
    raise exception 'nama wajib diisi'
      using errcode = 'TB401', hint = 'NAMA_WAJIB';
  end if;

  if v_no_hp is null then
    raise exception 'no hp wajib diisi'
      using errcode = 'TB402', hint = 'NO_HP_WAJIB';
  end if;

  if p_usia is null or p_usia <= 0 then
    raise exception 'usia wajib diisi dan harus lebih dari 0'
      using errcode = 'TB403', hint = 'USIA_TIDAK_VALID';
  end if;

  update public.users
  set nama = v_nama,
      nama_panggilan = v_nama_panggilan,
      no_hp = v_no_hp,
      usia = p_usia,
      profesi = v_profesi,
      domisili = v_domisili,
      profile_completed = true
  where id = (select auth.uid())
  returning * into v_profile;

  if not found then
    raise exception 'profile tidak ditemukan'
      using errcode = 'TB404', hint = 'PROFILE_TIDAK_DITEMUKAN';
  end if;

  return v_profile;
end;
$$;

revoke all on function public.complete_user_profile(text, text, text, integer, text, text) from public;
revoke all on function public.complete_user_profile(text, text, text, integer, text, text) from anon;
grant execute on function public.complete_user_profile(text, text, text, integer, text, text) to authenticated;

-- Booking sekarang mensyaratkan profil lengkap. Ini guard database, jadi tetap
-- berlaku walaupun user memanggil RPC langsung via publishable key.
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

  if not exists (
    select 1
    from public.users u
    where u.id = (select auth.uid())
      and u.profile_completed = true
  ) then
    raise exception 'profil belum lengkap'
      using errcode = 'TB106', hint = 'PROFIL_BELUM_LENGKAP';
  end if;

  select * into v_session
  from public.event_sessions
  where id = p_session_id
  for update;

  if not found then
    raise exception 'sesi tidak ditemukan'
      using errcode = 'TB101', hint = 'SESI_TIDAK_DITEMUKAN';
  end if;

  if v_session.status <> 'published' then
    raise exception 'sesi tidak ditemukan'
      using errcode = 'TB101', hint = 'SESI_TIDAK_DITEMUKAN';
  end if;

  if v_session.tipe <> 'offline' then
    raise exception 'sesi online terkunci di fase 1'
      using errcode = 'TB102', hint = 'SESI_ONLINE_BELUM_DIBUKA';
  end if;

  if v_session.tanggal_waktu <= now() then
    raise exception 'sesi sudah lewat'
      using errcode = 'TB104', hint = 'SESI_SUDAH_LEWAT';
  end if;

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
    raise exception 'sudah booking sesi ini'
      using errcode = 'TB105', hint = 'BOOKING_DUPLIKAT';
end;
$$;

revoke all on function public.create_booking(uuid) from public;
revoke all on function public.create_booking(uuid) from anon;
grant execute on function public.create_booking(uuid) to authenticated;
