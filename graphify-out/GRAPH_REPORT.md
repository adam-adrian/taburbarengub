# Graph Report - .  (2026-08-03)

## Corpus Check
- 13 files · ~35,067 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 454 nodes · 681 edges · 28 communities (22 shown, 6 thin omitted)
- Extraction: 96% EXTRACTED · 4% INFERRED · 0% AMBIGUOUS · INFERRED: 29 edges (avg confidence: 0.81)
- Token cost: 93,211 input · 0 output

## Community Hubs (Navigation)
- Project Docs & Review Tracker
- Product Spec & Architecture Docs
- Admin & Layout Pages (Server)
- Auth Pages & Admin Forms
- Member-Facing Booking Pages
- Build Tooling & Package Config
- Admin API & Session/Hero Services
- TypeScript Config
- QR Scanner & Runtime Dependencies
- Database Schema & Migrations (Baseline)
- Profile Completion Service
- Layered Architecture Doc
- Booking Service
- Check-in Service
- Ticket Detail & QR Code
- Auth Middleware & Proxy
- CSV Export & Signup Audit Notes
- Root Layout
- Static Icon Assets
- Admin Dashboard Home
- Profile Completion Invariant Migration
- ESLint Config
- Next Config
- Brand Logo Assets
- Middleware-to-Proxy Rename Note

## God Nodes (most connected - your core abstractions)
1. `createClient()` - 36 edges
2. `Review Action Tracker — TaburBarengUB` - 22 edges
3. `compilerOptions` - 16 edges
4. `README.md — TaburBarengUB Project README` - 15 edges
5. `Database` - 12 edges
6. `PR-02: Enforce complete profile invariant in database (DONE)` - 12 edges
7. `Current Recommended Execution Order (PR-00 through PR-10)` - 12 edges
8. `PR-00: Toolchain, Node 22, CI baseline, env docs (DONE)` - 11 edges
9. `PR-03: Protect kuota_terisi from direct admin update (DONE)` - 11 edges
10. `createClient()` - 10 edges

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
- **CI Quality Gate: Lint + Typecheck + Build** — github_workflows_ci_workflow, github_workflows_ci_lint_step, github_workflows_ci_typecheck_step, github_workflows_ci_build_step [EXTRACTED 1.00]
- **Wave 0 Safety Net: Node 22 Pin + CI Baseline + README Docs** — docs_review_action_tracker_pr00, github_workflows_ci_workflow, readme_document [EXTRACTED 1.00]
- **Profile Completion Invariant Enforcement (client + DB layers)** — docs_review_action_tracker_pr01, docs_review_action_tracker_pr02, docs_review_action_tracker_profile_completed_invariant, docs_review_action_tracker_handle_new_user, docs_review_action_tracker_create_booking [INFERRED 0.85]
- **Booking mutation flow across layers** — audit_handoff_api_bookings, audit_handoff_bookings_table, audit_handoff_create_booking, audit_handoff_event_sessions_table, docs_architecture_booking_flow [EXTRACTED 1.00]
- **QR check-in flow across layers** — audit_handoff_admin_scanner, audit_handoff_api_check_in, audit_handoff_check_in_booking, project_plan_or_context_wireframe_fase1_qr_scanner_screen [EXTRACTED 0.95]
- **Layered Next.js + Supabase stack** — docs_architecture_api_controller_layer, docs_architecture_client_interaction_layer, docs_architecture_database_enforcement_layer, docs_architecture_presentation_layer, docs_architecture_service_layer [EXTRACTED 1.00]

## Communities (28 total, 6 thin omitted)

### Community 0 - "Project Docs & Review Tracker"
Cohesion: 0.06
Nodes (56): AUDIT_HANDOFF.md (referenced, not read), docs/ARCHITECTURE.md (referenced, not read), Rationale: tracker is the actual-status source of truth over the execution plan, check_in_booking() DB function, create_booking() DB function (SECURITY DEFINER, owner postgres), Review Action Tracker — TaburBarengUB, Current Recommended Execution Order (PR-00 through PR-10), REVIEW_ACTION_EXECUTION_PLAN.md (cited source, not read) (+48 more)

### Community 1 - "Product Spec & Architecture Docs"
Cohesion: 0.05
Nodes (50): /admin/scanner page, POST /api/bookings, POST /api/check-in, bookings table, check_in_booking() RPC, create_booking() RPC, Scanner data minimization, event_sessions table (+42 more)

### Community 2 - "Admin & Layout Pages (Server)"
Cohesion: 0.08
Nodes (32): AdminHeroPage(), AdminLayout(), escapeCsvCell(), ExportBooking, formatDateTimeForFilename(), GET(), getUser(), safeFilename() (+24 more)

### Community 3 - "Auth Pages & Admin Forms"
Cohesion: 0.08
Nodes (24): createInitialState(), HeroContent, HeroForm(), HeroFormState, createInitialState(), EventSession, SessionForm(), SessionFormState (+16 more)

### Community 4 - "Member-Facing Booking Pages"
Cohesion: 0.10
Nodes (29): CompleteProfileForm(), ProfileCompletionPrompt(), PromptMode, WizardStep, createInitialState(), errorBoxStyle, inputStyle, primaryButtonStyle() (+21 more)

### Community 5 - "Build Tooling & Package Config"
Cohesion: 0.06
Nodes (35): babel-plugin-react-compiler, eslint, eslint-config-next, allowScripts, sharp@0.34.5, unrs-resolver@1.12.2, devDependencies, babel-plugin-react-compiler (+27 more)

### Community 6 - "Admin API & Session/Hero Services"
Cohesion: 0.13
Nodes (20): PATCH(), paramsSchema, PATCH(), POST(), AuthError, requireAdmin(), HeroContent, HeroContentError (+12 more)

### Community 7 - "TypeScript Config"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 8 - "QR Scanner & Runtime Dependencies"
Cohesion: 0.08
Nodes (27): html5-qrcode, next, dependencies, html5-qrcode, next, react, react-dom, react-qr-code (+19 more)

### Community 9 - "Database Schema & Migrations (Baseline)"
Cohesion: 0.18
Nodes (12): on_auth_user_created, public.bookings, public.check_in_booking(), public.complete_user_profile(), public.create_booking(), public.event_sessions, public.guard_tanggal_sesi(), public.handle_new_user() (+4 more)

### Community 10 - "Profile Completion Service"
Cohesion: 0.26
Nodes (8): PATCH(), completeUserProfile(), PETA_ERROR, ProfileError, UserProfile, CompleteProfileInput, completeProfileSchema, optionalTrimmedText

### Community 11 - "Layered Architecture Doc"
Cohesion: 0.24
Nodes (11): Next.js Agent Rules, CLAUDE.md AGENTS.md Include, API/controller layer (route.ts), API-first for domain mutation, Auth/data-access helper (supabase, requireAdmin), Client interaction layer (use client), Database-enforced invariants, Database enforcement layer (migrations) (+3 more)

### Community 12 - "Booking Service"
Cohesion: 0.25
Nodes (7): POST(), Booking, BookingError, createBooking(), PETA_ERROR, CreateBookingInput, createBookingSchema

### Community 13 - "Check-in Service"
Cohesion: 0.25
Nodes (7): POST(), checkInBooking(), CheckInError, CheckInResult, PETA_ERROR, CheckInInput, checkInSchema

### Community 14 - "Ticket Detail & QR Code"
Cohesion: 0.33
Nodes (7): BookingStatus, formatDateTime(), SessionSummary, statusLabel(), statusStyle(), TicketDetailPage(), TicketQrCode()

### Community 15 - "Auth Middleware & Proxy"
Cohesion: 0.53
Nodes (4): punyaCookieSesi(), updateSession(), config, proxy()

### Community 16 - "CSV Export & Signup Audit Notes"
Cohesion: 0.40
Nodes (5): /admin/peserta/export.csv PII export, handle_new_user() trigger, users table, Profile completion flow (profile_completed), CSV formula injection guard

### Community 17 - "Root Layout"
Cohesion: 0.40
Nodes (3): geistMono, geistSans, metadata

### Community 18 - "Static Icon Assets"
Cohesion: 1.00
Nodes (3): File / Document Icon, Globe / World Icon, Window / Browser Icon

## Ambiguous Edges - Review These
- `PR-02: Enforce complete profile invariant in database (DONE)` → `PR-05: Verified signup and CAPTCHA (TODO)`  [AMBIGUOUS]
  docs/REVIEW_ACTION_TRACKER.md · relation: references

## Knowledge Gaps
- **153 isolated node(s):** `eslintConfig`, `nextConfig`, `BookingStatus`, `SessionSummary`, `HeroContent` (+148 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `PR-02: Enforce complete profile invariant in database (DONE)` and `PR-05: Verified signup and CAPTCHA (TODO)`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **Why does `createClient()` connect `Admin & Layout Pages (Server)` to `Member-Facing Booking Pages`, `Admin API & Session/Hero Services`, `Profile Completion Service`, `Booking Service`, `Check-in Service`, `Ticket Detail & QR Code`?**
  _High betweenness centrality (0.060) - this node is a cross-community bridge._
- **Why does `Database` connect `Auth Pages & Admin Forms` to `Admin & Layout Pages (Server)`, `Member-Facing Booking Pages`, `Admin API & Session/Hero Services`, `Profile Completion Service`, `Booking Service`, `Check-in Service`?**
  _High betweenness centrality (0.026) - this node is a cross-community bridge._
- **Why does `dependencies` connect `QR Scanner & Runtime Dependencies` to `Build Tooling & Package Config`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
- **What connects `eslintConfig`, `nextConfig`, `BookingStatus` to the rest of the system?**
  _153 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Project Docs & Review Tracker` be split into smaller, more focused modules?**
  _Cohesion score 0.06298701298701298 - nodes in this community are weakly interconnected._
- **Should `Product Spec & Architecture Docs` be split into smaller, more focused modules?**
  _Cohesion score 0.05142857142857143 - nodes in this community are weakly interconnected._