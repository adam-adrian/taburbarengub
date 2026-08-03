-- ============================================================
-- PR-02: profile_completed=true harus benar-benar berarti lengkap.
--
-- Gap sebelumnya: handle_new_user() menghitung profile_completed dari
-- nama/no_hp/usia saja, tidak ikut cek profesi/domisili. Direct Supabase
-- Auth signup dengan metadata parsial (nama+no_hp+usia tanpa profesi/
-- domisili) bisa lolos jadi profile_completed=true. Tidak ada check
-- constraint di level tabel yang menjaga invariant ini kalau ada bug di
-- trigger/RPC lain di masa depan.
-- ============================================================

-- Rekomputasi baris existing dulu, sebelum constraint aktif, supaya row
-- yang salah (profile_completed=true tapi profesi/domisili kosong) tidak
-- membuat ALTER TABLE di bawah gagal.
update public.users
set profile_completed = false
where profile_completed
  and (
    nullif(btrim(nama), '') is null
    or nullif(btrim(no_hp), '') is null
    or usia is null or usia <= 0
    or nullif(btrim(profesi), '') is null
    or nullif(btrim(domisili), '') is null
  );

alter table public.users
  add constraint profile_completed_requires_full_profile
  check (
    not profile_completed or (
      nullif(btrim(nama), '') is not null
      and nullif(btrim(no_hp), '') is not null
      and usia is not null and usia > 0
      and nullif(btrim(profesi), '') is not null
      and nullif(btrim(domisili), '') is not null
    )
  );

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
    v_nama is not null
      and v_no_hp is not null
      and v_usia is not null and v_usia > 0
      and v_profesi is not null
      and v_domisili is not null
  );

  return new;
end;
$$;
