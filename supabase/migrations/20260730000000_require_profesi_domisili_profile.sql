-- ============================================================
-- Lengkapi profil peserta sekarang mensyaratkan profesi dan domisili.
--
-- Ini menjaga konsistensi antara UI, API validation, dan RPC yang bisa
-- dipanggil langsung oleh authenticated user via Supabase publishable key.
-- ============================================================

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

  if v_profesi is null then
    raise exception 'profesi wajib diisi'
      using errcode = 'TB405', hint = 'PROFESI_WAJIB';
  end if;

  if v_domisili is null then
    raise exception 'domisili wajib diisi'
      using errcode = 'TB406', hint = 'DOMISILI_WAJIB';
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
