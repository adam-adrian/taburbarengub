-- PR-03: kuota_terisi is system-managed (only create_booking() should write
-- it). Baseline granted blanket UPDATE on event_sessions to authenticated/
-- anon; RLS (event_sessions_admin_update) gates by is_admin() but does not
-- restrict which columns an admin can write. Restrict UPDATE to the columns
-- the admin UI actually edits so a direct PostgREST call from an admin JWT
-- can't touch kuota_terisi, id, or created_at.

revoke update on table public.event_sessions from authenticated;
revoke update on table public.event_sessions from anon;

grant update (
  nama_sesi,
  tipe,
  tanggal_waktu,
  lokasi_atau_link,
  deskripsi,
  kapasitas,
  status
) on table public.event_sessions to authenticated;
