# Graph Report - .  (2026-07-30)

## Corpus Check
- Corpus is ~30,944 words - fits in a single context window. You may not need a graph.

## Summary
- 390 nodes · 581 edges · 33 communities (28 shown, 5 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 21 edges (avg confidence: 0.78)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `dc6727b3`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- createClient
- devDependencies
- [id]/route.ts
- compilerOptions
- scanner/page.tsx
- profile-completion-prompt.tsx
- schema-fase1-annotated.sql
- database.types.ts
- PRD TaburBarengUB Fase 1
- Layered Next.js Architecture
- Fase 1 Wireframe
- profile-service.ts
- createClient
- bookings/route.ts
- check-in/route.ts
- check_in_booking() RPC
- export.csv/route.ts
- session-form.tsx
- tiket-saya/[id]/page.tsx
- TaburBarengUB Fase 1 MVP
- admin/sesi/[id]/page.tsx
- create_booking() RPC
- updateSession
- users table
- app/layout.tsx
- File / Document Icon
- admin/page.tsx
- eslint.config.mjs
- next.config.ts
- Next.js Wordmark Logo
- middleware renamed to proxy

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 39 edges
2. `compilerOptions` - 16 edges
3. `Database` - 12 edges
4. `createClient()` - 10 edges
5. `scripts` - 9 edges
6. `TaburBarengUB Fase 1 MVP` - 8 edges
7. `Layered Next.js Architecture` - 8 edges
8. `PRD TaburBarengUB Fase 1` - 8 edges
9. `Home()` - 7 edges
10. `requireAdmin()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `Islamic Educational Event Dashboard` --conceptually_related_to--> `TaburBarengUB Fase 1 MVP`  [INFERRED]
  project-plan-or-context/Salinan dari Tambahkan judul.pdf → AUDIT_HANDOFF.md
- `TaburBarengUB Fase 1 MVP` --conceptually_related_to--> `PRD TaburBarengUB Fase 1`  [INFERRED]
  AUDIT_HANDOFF.md → project-plan-or-context/PRD-Fase1-Event-Platform.pdf
- `PRD Data Model (User, Session, HeroContent, Booking)` --conceptually_related_to--> `event_sessions table`  [INFERRED]
  project-plan-or-context/PRD-Fase1-Event-Platform.pdf → AUDIT_HANDOFF.md
- `PRD Data Model (User, Session, HeroContent, Booking)` --conceptually_related_to--> `hero_content table`  [INFERRED]
  project-plan-or-context/PRD-Fase1-Event-Platform.pdf → AUDIT_HANDOFF.md
- `PRD Data Model (User, Session, HeroContent, Booking)` --conceptually_related_to--> `bookings table`  [INFERRED]
  project-plan-or-context/PRD-Fase1-Event-Platform.pdf → AUDIT_HANDOFF.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Booking mutation flow across layers** — audit_handoff_api_bookings, audit_handoff_bookings_table, audit_handoff_create_booking, audit_handoff_event_sessions_table, docs_architecture_booking_flow [EXTRACTED 1.00]
- **QR check-in flow across layers** — audit_handoff_admin_scanner, audit_handoff_api_check_in, audit_handoff_check_in_booking, project_plan_or_context_wireframe_fase1_qr_scanner_screen [EXTRACTED 0.95]
- **Layered Next.js + Supabase stack** — docs_architecture_api_controller_layer, docs_architecture_client_interaction_layer, docs_architecture_database_enforcement_layer, docs_architecture_presentation_layer, docs_architecture_service_layer [EXTRACTED 1.00]

## Communities (33 total, 5 thin omitted)

### Community 0 - "createClient"
Cohesion: 0.10
Nodes (25): AdminLayout(), AdminPesertaPage(), formatDateTime(), getStatusStyle(), getUser(), ParticipantBooking, SearchParams, UserSummary (+17 more)

### Community 1 - "devDependencies"
Cohesion: 0.06
Nodes (32): babel-plugin-react-compiler, eslint, eslint-config-next, allowScripts, sharp@0.34.5, unrs-resolver@1.12.2, devDependencies, babel-plugin-react-compiler (+24 more)

### Community 2 - "[id]/route.ts"
Cohesion: 0.12
Nodes (21): PATCH(), paramsSchema, PATCH(), POST(), AuthError, requireAdmin(), HeroContent, HeroContentError (+13 more)

### Community 3 - "compilerOptions"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 4 - "scanner/page.tsx"
Cohesion: 0.08
Nodes (27): html5-qrcode, next, dependencies, html5-qrcode, next, react, react-dom, react-qr-code (+19 more)

### Community 5 - "profile-completion-prompt.tsx"
Cohesion: 0.18
Nodes (18): CompleteProfileForm(), ProfileCompletionPrompt(), PromptMode, WizardStep, createInitialState(), errorBoxStyle, inputStyle, primaryButtonStyle() (+10 more)

### Community 6 - "schema-fase1-annotated.sql"
Cohesion: 0.18
Nodes (12): on_auth_user_created, public.bookings, public.check_in_booking(), public.complete_user_profile(), public.create_booking(), public.event_sessions, public.guard_tanggal_sesi(), public.handle_new_user() (+4 more)

### Community 7 - "database.types.ts"
Cohesion: 0.13
Nodes (14): createInitialState(), HeroContent, HeroForm(), HeroFormState, AdminHeroPage(), CompositeTypes, Constants, DatabaseWithoutInternals (+6 more)

### Community 8 - "PRD TaburBarengUB Fase 1"
Cohesion: 0.18
Nodes (13): Bunny.net video learning (Fase 2), Launch target mid-August 2026, Offline traffic-driver vs online exclusive sessions, PRD TaburBarengUB Fase 1, Roadmap Fase 2 & Fase 3, User flow (sign up, booking, check-in), User roles (Publik, User terdaftar, Admin/Panitia), Customer Journey (+5 more)

### Community 9 - "Layered Next.js Architecture"
Cohesion: 0.21
Nodes (12): Next.js Agent Rules, CLAUDE.md AGENTS.md Include, API/controller layer (route.ts), API-first for domain mutation, Auth/data-access helper (supabase, requireAdmin), Client interaction layer (use client), Database-enforced invariants, Database enforcement layer (migrations) (+4 more)

### Community 10 - "Fase 1 Wireframe"
Cohesion: 0.18
Nodes (12): bookings table, hero_content table, Admin hero CMS, PRD Data Model (User, Session, HeroContent, Booking), Hero content static/global (not per-session), Ustadz Budi Ashari, Admin Dashboard screen, Landing Page screen (+4 more)

### Community 11 - "profile-service.ts"
Cohesion: 0.26
Nodes (8): PATCH(), completeUserProfile(), PETA_ERROR, ProfileError, UserProfile, CompleteProfileInput, completeProfileSchema, optionalTrimmedText

### Community 12 - "createClient"
Cohesion: 0.30
Nodes (5): ForgotPasswordPage(), LoginPage(), RegisterPage(), ResetPasswordPage(), createClient()

### Community 13 - "bookings/route.ts"
Cohesion: 0.25
Nodes (7): POST(), Booking, BookingError, createBooking(), PETA_ERROR, CreateBookingInput, createBookingSchema

### Community 14 - "check-in/route.ts"
Cohesion: 0.25
Nodes (7): POST(), checkInBooking(), CheckInError, CheckInResult, PETA_ERROR, CheckInInput, checkInSchema

### Community 15 - "check_in_booking() RPC"
Cohesion: 0.22
Nodes (10): /admin/scanner page, POST /api/check-in, check_in_booking() RPC, Scanner data minimization, html5-qrcode scanner, is_admin() role helper, RLS policies, supabase/migrations authoritative schema (+2 more)

### Community 16 - "export.csv/route.ts"
Cohesion: 0.36
Nodes (8): escapeCsvCell(), ExportBooking, formatDateTimeForFilename(), GET(), getUser(), safeFilename(), toCsv(), UserSummary

### Community 17 - "session-form.tsx"
Cohesion: 0.31
Nodes (5): createInitialState(), EventSession, SessionForm(), SessionFormState, toDateTimeLocal()

### Community 18 - "tiket-saya/[id]/page.tsx"
Cohesion: 0.33
Nodes (7): BookingStatus, formatDateTime(), SessionSummary, statusLabel(), statusStyle(), TicketDetailPage(), TicketQrCode()

### Community 19 - "TaburBarengUB Fase 1 MVP"
Cohesion: 0.25
Nodes (8): react-qr-code renderer, Supabase Auth, Supabase Postgres, Supabase SSR client (@supabase/ssr), TaburBarengUB Fase 1 MVP, QR Ticketing & Check-in, Unique QR token per booking, README Next.js Getting Started

### Community 20 - "admin/sesi/[id]/page.tsx"
Cohesion: 0.36
Nodes (7): AdminSessionDetailPage(), Badge(), badgeStyle(), formatDateTime(), getUser(), ParticipantBooking, UserSummary

### Community 21 - "create_booking() RPC"
Cohesion: 0.33
Nodes (7): POST /api/bookings, create_booking() RPC, event_sessions table, kuota_terisi denormalized counter, Zod validation, Booking data flow, Past session as derived history state

### Community 22 - "updateSession"
Cohesion: 0.53
Nodes (4): punyaCookieSesi(), updateSession(), config, proxy()

### Community 23 - "users table"
Cohesion: 0.40
Nodes (5): /admin/peserta/export.csv PII export, handle_new_user() trigger, users table, Profile completion flow (profile_completed), CSV formula injection guard

### Community 24 - "app/layout.tsx"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 25 - "File / Document Icon"
Cohesion: 1.00
Nodes (3): File / Document Icon, Globe / World Icon, Window / Browser Icon

## Knowledge Gaps
- **127 isolated node(s):** `eslintConfig`, `nextConfig`, `name`, `version`, `private` (+122 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `createClient()` connect `createClient` to `[id]/route.ts`, `profile-completion-prompt.tsx`, `database.types.ts`, `profile-service.ts`, `bookings/route.ts`, `check-in/route.ts`, `export.csv/route.ts`, `tiket-saya/[id]/page.tsx`, `admin/sesi/[id]/page.tsx`?**
  _High betweenness centrality (0.087) - this node is a cross-community bridge._
- **Why does `Database` connect `[id]/route.ts` to `createClient`, `profile-completion-prompt.tsx`, `database.types.ts`, `profile-service.ts`, `createClient`, `bookings/route.ts`, `check-in/route.ts`, `session-form.tsx`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Why does `dependencies` connect `scanner/page.tsx` to `devDependencies`?**
  _High betweenness centrality (0.015) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `name` to the rest of the system?**
  _127 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `createClient` be split into smaller, more focused modules?**
  _Cohesion score 0.10252100840336134 - nodes in this community are weakly interconnected._
- **Should `devDependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.06060606060606061 - nodes in this community are weakly interconnected._
- **Should `[id]/route.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._