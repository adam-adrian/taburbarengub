-- ============================================================
-- Baseline Fase 1 — diambil dari database live 2026-07-27
-- via `supabase db dump --linked`, BUKAN dari file tulis tangan.
--
-- Alasannya: AUDIT_HANDOFF.md mencatat "patch v2 sudah diaplikasikan
-- di Supabase live" di luar jalur file, jadi file tidak bisa dianggap
-- sebagai kebenaran. Hasil diff-nya sudah diverifikasi:
--   - 4 fungsi: badan identik, beda hanya format pg_dump
--   - 8 RLS policy: identik
--   - constraint & index: identik
--   - SATU drift nyata: grant ke role `anon` (lihat migration berikutnya)
--
-- Versi beranotasi yang mudah dibaca ada di docs/schema-fase1-annotated.sql
-- dan TIDAK otoritatif.
-- ============================================================




SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."check_in_booking"("p_qr_token" "text") RETURNS TABLE("booking_id" "uuid", "user_id" "uuid", "session_id" "uuid", "nama" "text", "booking_status" "text", "checked_in_at" timestamp with time zone)
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."check_in_booking"("p_qr_token" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."bookings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "session_id" "uuid" NOT NULL,
    "qr_token" "text" NOT NULL,
    "status" "text" DEFAULT 'booked'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "checked_in_at" timestamp with time zone,
    CONSTRAINT "bookings_status_check" CHECK (("status" = ANY (ARRAY['booked'::"text", 'checked_in'::"text", 'cancelled'::"text"])))
);


ALTER TABLE "public"."bookings" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."create_booking"("p_session_id" "uuid", "p_qr_token" "text") RETURNS "public"."bookings"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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

  -- Better UX: if user already booked, say that even when quota is already full.
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
    -- Usually unique_user_per_session. qr_token collision is cryptographically negligible,
    -- and the app can retry if it ever happens.
    raise exception 'Kamu sudah booking sesi ini sebelumnya' using errcode = '23505';
end;
$$;


ALTER FUNCTION "public"."create_booking"("p_session_id" "uuid", "p_qr_token" "text") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
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


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_admin"() RETURNS boolean
    LANGUAGE "sql" STABLE SECURITY DEFINER
    SET "search_path" TO 'public'
    AS $$
  select exists (
    select 1
    from public.users u
    where u.id = auth.uid()
      and u.role = 'admin'
  );
$$;


ALTER FUNCTION "public"."is_admin"() OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."event_sessions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "nama_sesi" "text" NOT NULL,
    "tipe" "text" NOT NULL,
    "tanggal_waktu" timestamp with time zone NOT NULL,
    "lokasi_atau_link" "text",
    "deskripsi" "text",
    "kapasitas" integer NOT NULL,
    "kuota_terisi" integer DEFAULT 0 NOT NULL,
    "status" "text" DEFAULT 'draft'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "event_sessions_kapasitas_check" CHECK (("kapasitas" > 0)),
    CONSTRAINT "event_sessions_kuota_terisi_check" CHECK (("kuota_terisi" >= 0)),
    CONSTRAINT "event_sessions_status_check" CHECK (("status" = ANY (ARRAY['draft'::"text", 'published'::"text", 'cancelled'::"text"]))),
    CONSTRAINT "event_sessions_tipe_check" CHECK (("tipe" = ANY (ARRAY['offline'::"text", 'online'::"text"]))),
    CONSTRAINT "kuota_tidak_lebih_kapasitas" CHECK (("kuota_terisi" <= "kapasitas"))
);


ALTER TABLE "public"."event_sessions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."hero_content" (
    "id" integer DEFAULT 1 NOT NULL,
    "judul_acara" "text" DEFAULT 'Tabur Bareng UB'::"text" NOT NULL,
    "filosofi_tabur" "text",
    "tagline" "text",
    "nama_pemateri" "text",
    "bio_pemateri" "text",
    "foto_pemateri_url" "text",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "hero_content_id_check" CHECK (("id" = 1))
);


ALTER TABLE "public"."hero_content" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."users" (
    "id" "uuid" NOT NULL,
    "nama" "text" NOT NULL,
    "email" "text" NOT NULL,
    "no_hp" "text" NOT NULL,
    "usia" integer NOT NULL,
    "profesi" "text",
    "domisili" "text",
    "role" "text" DEFAULT 'user'::"text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    CONSTRAINT "users_role_check" CHECK (("role" = ANY (ARRAY['user'::"text", 'admin'::"text"]))),
    CONSTRAINT "users_usia_check" CHECK (("usia" > 0))
);


ALTER TABLE "public"."users" OWNER TO "postgres";


ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_qr_token_key" UNIQUE ("qr_token");



ALTER TABLE ONLY "public"."event_sessions"
    ADD CONSTRAINT "event_sessions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."hero_content"
    ADD CONSTRAINT "hero_content_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "unique_user_per_session" UNIQUE ("user_id", "session_id");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_bookings_qr_token" ON "public"."bookings" USING "btree" ("qr_token");



CREATE INDEX "idx_bookings_session" ON "public"."bookings" USING "btree" ("session_id");



CREATE INDEX "idx_bookings_user" ON "public"."bookings" USING "btree" ("user_id");



CREATE INDEX "idx_event_sessions_status" ON "public"."event_sessions" USING "btree" ("status");



CREATE INDEX "idx_event_sessions_tanggal" ON "public"."event_sessions" USING "btree" ("tanggal_waktu");



CREATE INDEX "idx_users_email" ON "public"."users" USING "btree" ("email");



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_session_id_fkey" FOREIGN KEY ("session_id") REFERENCES "public"."event_sessions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."bookings"
    ADD CONSTRAINT "bookings_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."users"
    ADD CONSTRAINT "users_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."bookings" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "bookings_select_own_or_admin" ON "public"."bookings" FOR SELECT TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR "public"."is_admin"()));



ALTER TABLE "public"."event_sessions" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "event_sessions_admin_delete" ON "public"."event_sessions" FOR DELETE TO "authenticated" USING ("public"."is_admin"());



CREATE POLICY "event_sessions_admin_insert" ON "public"."event_sessions" FOR INSERT TO "authenticated" WITH CHECK ("public"."is_admin"());



CREATE POLICY "event_sessions_admin_update" ON "public"."event_sessions" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ("public"."is_admin"());



CREATE POLICY "event_sessions_select_published_or_admin" ON "public"."event_sessions" FOR SELECT TO "authenticated", "anon" USING ((("status" = 'published'::"text") OR "public"."is_admin"()));



ALTER TABLE "public"."hero_content" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "hero_content_admin_update" ON "public"."hero_content" FOR UPDATE TO "authenticated" USING ("public"."is_admin"()) WITH CHECK ((("id" = 1) AND "public"."is_admin"()));



CREATE POLICY "hero_content_select_all" ON "public"."hero_content" FOR SELECT TO "authenticated", "anon" USING (true);



ALTER TABLE "public"."users" ENABLE ROW LEVEL SECURITY;


CREATE POLICY "users_select_own_or_admin" ON "public"."users" FOR SELECT TO "authenticated" USING ((("id" = "auth"."uid"()) OR "public"."is_admin"()));





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";






















































































































































REVOKE ALL ON FUNCTION "public"."check_in_booking"("p_qr_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."check_in_booking"("p_qr_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."check_in_booking"("p_qr_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."check_in_booking"("p_qr_token" "text") TO "service_role";



GRANT ALL ON TABLE "public"."bookings" TO "anon";
GRANT ALL ON TABLE "public"."bookings" TO "authenticated";
GRANT ALL ON TABLE "public"."bookings" TO "service_role";



REVOKE ALL ON FUNCTION "public"."create_booking"("p_session_id" "uuid", "p_qr_token" "text") FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."create_booking"("p_session_id" "uuid", "p_qr_token" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."create_booking"("p_session_id" "uuid", "p_qr_token" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."create_booking"("p_session_id" "uuid", "p_qr_token" "text") TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



REVOKE ALL ON FUNCTION "public"."is_admin"() FROM PUBLIC;
GRANT ALL ON FUNCTION "public"."is_admin"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_admin"() TO "service_role";


















GRANT ALL ON TABLE "public"."event_sessions" TO "anon";
GRANT ALL ON TABLE "public"."event_sessions" TO "authenticated";
GRANT ALL ON TABLE "public"."event_sessions" TO "service_role";



GRANT ALL ON TABLE "public"."hero_content" TO "anon";
GRANT ALL ON TABLE "public"."hero_content" TO "authenticated";
GRANT ALL ON TABLE "public"."hero_content" TO "service_role";



GRANT ALL ON TABLE "public"."users" TO "anon";
GRANT ALL ON TABLE "public"."users" TO "authenticated";
GRANT ALL ON TABLE "public"."users" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";
































-- ============================================================
-- Trigger di schema auth — TIDAK ikut dalam dump schema public.
-- Tanpa baris ini, replay ke database kosong menghasilkan signup
-- yang diam-diam tidak pernah membuat row di public.users.
-- ============================================================
CREATE OR REPLACE TRIGGER "on_auth_user_created"
  AFTER INSERT ON "auth"."users"
  FOR EACH ROW EXECUTE FUNCTION "public"."handle_new_user"();
