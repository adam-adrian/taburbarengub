-- ============================================================
-- Tambahkan info sesi ke hasil check_in_booking.
--
-- Staff scanner perlu melihat peserta check-in untuk sesi apa. Ini lebih baik
-- dikembalikan dari RPC yang sama daripada API melakukan query kedua, karena
-- hasil check-in + konteks sesi berasal dari satu operasi database.
-- ============================================================

-- Return type function berubah, jadi harus drop function dulu. CREATE OR
-- REPLACE tidak bisa mengubah OUT columns function yang sudah ada.
drop function if exists public.check_in_booking(text);

create or replace function public.check_in_booking(p_qr_token text)
returns table (
  booking_id     uuid,
  user_id        uuid,
  session_id     uuid,
  nama           text,
  nama_sesi      text,
  tanggal_waktu  timestamptz,
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
    s.nama_sesi,
    s.tanggal_waktu,
    v_booking.status,
    v_booking.checked_in_at
  from public.users u
  join public.event_sessions s on s.id = v_booking.session_id
  where u.id = v_booking.user_id;
end;
$$;

revoke all on function public.check_in_booking(text) from public;
revoke all on function public.check_in_booking(text) from anon;
grant execute on function public.check_in_booking(text) to authenticated;
