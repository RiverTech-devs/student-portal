# Project Instructions

You are working on this website repository via remote tasks sent from a phone.
Follow these rules for every task.

## Workflow
1. Read and understand the full task before making changes.
2. Make the requested changes to the codebase.
3. Run `npm run build` (if available) to verify no build errors. (There is no npm/build step for this project — it's static HTML.)
4. Stage all changes: `git add -A`
5. Commit with a clear, descriptive message: `git commit -m "feat: description"` or `fix:`, `refactor:`, etc.
6. Push to main: `git push origin main`
7. Write a clear summary of what you did for the outbox.

## Commit Message Format
- `feat: ...` for new features
- `fix: ...` for bug fixes
- `refactor: ...` for code restructuring
- `style: ...` for CSS/visual changes
- `docs: ...` for documentation changes
- `chore: ...` for maintenance tasks

## Safety Rules
- Never delete files without creating them elsewhere first.
- If a task is ambiguous, make the most reasonable interpretation and note your assumptions in the summary.
- If something breaks during build, attempt to fix it before pushing.
- Always push to main when done — every change goes live.

## Special Commands
If the task contains any of these keywords, handle them accordingly:
- **"rollback"** — Revert the last commit: `git revert --no-edit HEAD && git push origin main`
- **"status"** — Don't change anything. Just report: current branch, last 5 commits, any uncommitted changes.
- **"diff"** — Show what changed in the last commit.

## Summary Format
Always end your work with a summary like:
```
DONE: [one-line description]
Files changed: [list]
Commit: [hash + message]
Pushed: yes
```

---

# Project Context

## What this is
**River Tech Student Portal** — a K-12 school management web app deployed at **rivertech.me**. It handles students, parents, teachers, and admins. Features cover classes, grades, attendance, assignments, messaging, a curriculum skill graph, a virtual currency (RTC) with cosmetics/privileges, extracurricular activities, facility booking, an enrollment application, a testing center, and 10 in-house educational games.

Repo: `RiverTech-devs/student-portal` → GitHub Pages (CNAME → rivertech.me).

## Tech stack
- **Frontend:** Vanilla JS + HTML + CSS. **No framework. No build step. No npm.** Each page is a single self-contained HTML file with embedded JS.
- **Backend:** Supabase (Postgres + Auth + RLS + Realtime + Edge Functions). Public anon key is hardcoded in `shared/config.js` — that is by design; security is enforced via RLS policies on every table.
- **Auth:** Supabase Auth (email/password), with magic-link confirm in `confirm.html` and password recovery in `reset.html`. Sessions persist via `detectSessionInUrl: true`.
- **Realtime:** Enabled only on the `notifications` table. Everything else needs explicit refetch.
- **Edge functions** (TypeScript, in `supabase/functions/`): `delete-account`, `send-notification-email`, `due-date-reminders`, `missed-emails`, `get-drive-upload-url`.
- **Hosting:** GitHub Pages (static). Supabase is the backend. Cache-bust JS/CSS edits with `?v=N` query params.

## Architecture: there are TWO frontends
1. **`index.html`** at the repo root (~5k lines) — the **student-facing** portal: dashboard, grades, skills, games, login.
2. **`portal/index.html`** (~40k lines) — the **teacher / admin / parent** dashboard. **This is a monolith** containing all of: classes, gradebook, assignments, attendance, messaging, announcements, RTC management, IRL store, activities, facilities, enrollment review, admin settings, class sheets, and more. Almost every teacher/admin task lives here.

When a task says "teacher side" or "admin side," it almost always means `portal/index.html`. When it says "student side" or "main site," it means root `index.html`.

## Key files
| Path | Purpose |
|---|---|
| `portal/index.html` | THE monolith. Teacher/admin/parent dashboard. ~40k lines. Section-based tabs (`<section id="*-section">` shown/hidden via `display`). |
| `index.html` (root) | Student-facing dashboard. Login, grades, skills, games. |
| `shared/config.js` | `PortalAuth` class, Supabase client init, session/auth handling, **shared nav builder** (`PortalUI.buildUnifiedNav`), themes. The nav for both apps is built here. |
| `shared/components.js` | UI utilities (loading manager, notification toasts). |
| `shared/styles.css` | Global theme tokens (CSS vars: `--bg`, `--card`, `--accent`, etc.), buttons, forms, nav. |
| `shared/graph-data.js` | Static curriculum graph data (used as fallback). |
| `SkillTreeViewer.html` | Constellation-style skill tree viewer with pan/zoom. |
| `NetworkGraph.html` | 3D network graph viewer (in development). |
| `enrollment/index.html` | Self-contained multi-step enrollment application form (~62k lines). Effectively its own app. |
| `extensions/JCalculator.html`, `extensions/testing-center.html` | Standalone embeddable widgets. |
| `confirm.html`, `reset.html` | Supabase magic-link confirm and password reset flows. |
| `Trees/master_tree.csv` | Source-of-truth curriculum data (subjects, prerequisites). |
| `data/compiled/master_graph.json`, `edges.json`, `radial_layout.json` | Compiled curriculum graph used for rendering. |
| `tools/*.js` | Node scripts for building the curriculum graph (extract → merge → reduce → layout → seed SQL). Run manually when curriculum changes. |
| `supabase/migrations/*.sql` | 120+ migration files. **No timestamp prefixes — they sort alphabetically.** |
| `tests/portal-core-tests.html` | In-browser test suite for portal features. |

## Database (Supabase Postgres)
~45 tables across these feature areas. Don't memorize the full schema — read `supabase/migrations/` when you need exact columns. Major groupings:

- **Auth & profiles:** `user_profiles` (with `user_type`: student/parent/teacher/admin, `rtc_balance`, theme), `parent_student_links`.
- **Classes:** `classes`, `class_enrollments`, `class_schedule`, `class_attendance`, `class_attendance_sessions`, `daily_attendance`.
- **Curriculum graph:** `curriculum_nodes`, `curriculum_edges`, `curriculum_clusters`. New system; `skill_progress` is the legacy per-student mastery table and is bridged via a view.
- **Assignments & testing:** `homework_assignments`, `skill_practice_sessions`, `test_assignments`, `test_submissions`, `test_questions`, `test_question_grades`, per-quarter grade tables.
- **RTC currency:** `rtc_transactions` (immutable ledger), `rtc_spend_categories`, `rtc_privileges`, `rtc_student_privileges`, `rtc_cosmetics`, `rtc_cosmetic_purchases`, `irl_purchases`, `irl_store_items`. Balance is mutated via the `process_rtc_transaction()` RPC; clients cannot directly update balances (RLS DENY).
- **Messaging & notifications:** `notifications` (the in-app bell — only realtime-enabled table). Direct messages live in messaging tables; broadcast announcements write into `notifications` with `metadata.broadcast = true`.
- **Activities & facilities:** `activities`, `activity_enrollments`, `activity_schedule`, `facilities`, `facility_bookings`, `school_events`.
- **Student records:** `student_strikes`, `student_waivers`, `student_notes`, `teacher_class_notes`, `teacher_private_notes`, `student_medical_info`, `emergency_contacts`.
- **Teacher tools:** `teacher_sheets` (per-class CSV-backed spreadsheets — class-scoped via `class_id`).
- **School config:** `school_settings`, `school_documents`, `site_theme`, `button_color_scheme`.
- **Enrollment & ops:** `enrollment_applications`, `bug_reports`, `material_requests`, `email_log`, missing/due-date notification tables.

## User roles
The `user_profiles.user_type` column drives everything:
- **student** — own grades/skills/messages, practice skills, earn/spend RTC, submit work.
- **parent** — view their linked child's grades/skills/notes, message teachers. Linked via `parent_student_links`.
- **teacher** — manage their classes (assignments, grading, attendance, RTC awards, class notes/sheets, messaging students/parents).
- **admin** — full access. Most admin sections gate UI client-side via `if (userProfile.user_type !== 'admin') return`, but the real enforcement is RLS server-side.

RLS policies are strict and load-bearing. If a user "can't see something they should," it's almost always an RLS issue, not a UI bug.

## Major features (where to look)
- **Curriculum skill graph** — graph-first design (not tree). Nodes have `path_type` (Spine/Branch/Leaf), `stage` (Foundations → Mastery), and edges have types (`prerequisite_hard`, `prerequisite_soft`, `leads_to`, `cross_domain`, `co_requisite`, `reinforces`, etc.). Per-student state: locked/available/in_progress/activated/mastered/needs_review. See `TreeGraphPlan.txt` for the design philosophy. Rendered by `SkillTreeViewer.html` and `NetworkGraph.html`.
- **RTC economy** — students earn RTC for skill mastery (50 RTC auto-awarded on state transition), assignment completion (tiered by score), and arcade play. They spend on cosmetics, privileges, and IRL store items. **Duplicate-prevention** via UNIQUE constraint on `(reference_id, reference_type, user_id)` in `rtc_transactions`.
- **Messaging & broadcasts** — direct messages between roles, plus admin broadcast announcements (with audience filters: Everyone / All Staff / All Students / All Parents / All Teachers, optionally narrowed by grade or class). Email forwarding via the `send-notification-email` edge function.
- **Gradebook** — per-class teacher gradebook UI in `portal/index.html`, plus a separate per-class **Class Sheets** spreadsheet system (CSV-backed in `teacher_sheets`).
- **Class Notes vs Class Sheets** — both live inside the per-class detail modal. Class Notes = simple dated notes (`teacher_class_notes`). Class Sheets = full spreadsheet editor scoped to one class.
- **Attendance** — daily/period attendance with auto-alerts on absences.
- **Activities & facilities** — extracurriculars with schedules and rosters; facility booking system.
- **Enrollment** — `enrollment/index.html` is a public multi-step form. Applications go to `enrollment_applications` for admin approval.
- **Games** — 10 standalone HTML mini-games in `/games/` (Mathletics, Math Dojo, Practice Pilot, Clockwork Defense, Dimension Shift, Riutiz, Teacher Challenge, Wasteland Adventure, etc.). They feed skill progress and earn RTC.

## Conventions
- **Section pattern** in `portal/index.html`: every top-level feature is a `<section id="X-section">` shown/hidden by `app.showSection('X')`. Adding a feature = add a section + a render method + a `case 'X':` in the section switch + (usually) a nav item in `shared/config.js`.
- **Nav bar** is built in one place: `shared/config.js` → `PortalUI.buildUnifiedNav()`. Both root and portal use it. Items are filtered by `user_type` via the `roles` array on each item. The portal nav supports horizontal scrolling with left/right arrow buttons (`#nav-scroll-left/right`) that show/hide based on overflow.
- **Modal system**: `app.showModal(id, title, content)` / `app.closeModal(id)`. Modals stack with z-index based on `modalStack.length`. Same-id modals replace existing ones. Closing the topmost modal pops the stack. Per-modal cleanup (e.g., keyboard listeners) lives in `closeModal`.
- **Naming:** snake_case for tables/columns, kebab-case for HTML ids/classes, PascalCase for JS classes, camelCase for JS methods.
- **Theme:** dark theme via CSS variables. Don't hardcode colors — use `var(--bg)`, `var(--card)`, `var(--text)`, `var(--accent)`, `var(--muted)`, `var(--border)`, `var(--danger)`, etc.
- **Cache busting:** when editing `shared/*.js` or `shared/*.css`, bump the `?v=N` query param in any HTML file that imports it, or users will see stale assets.

## Gotchas
1. **`portal/index.html` is ~40k lines.** Use Grep liberally; never read the whole file. Read targeted ranges.
2. **No build step**, so syntax errors crash the page silently in some browsers — there's no compiler to catch them. Be careful with template literal escaping.
3. **RLS is the security model**, not client checks. Client `if (admin)` gates are UX only.
4. **Migrations sort alphabetically**, no timestamps. New migrations should have descriptive names. Be careful with any migration that touches `user_profiles` RLS — there's a recovery file (`fix_user_profiles_rls_lockout.sql`) because it's been broken before.
5. **Two GitHub accounts on this dev machine**: `RiverTech-devs` (this repo) and `Densanon-devs` (other projects). The remote URL embeds the username; if a push fails with 403, it's a credential mismatch — see the saved memory file for the recovery procedure.
6. **The student `index.html` and `portal/index.html` are NOT shared modules** — they each duplicate some logic. When changing shared behavior, check both.
7. **`enrollment/index.html` is essentially its own app** — don't assume it shares state with the rest.
8. **Some Supabase queries paginate at 1000 rows by default** — for full data fetches (e.g., curriculum edges), explicitly paginate. There's a recent fix for this in the edges loader.
9. **Curriculum graph compilation is a manual pipeline.** Source is `Trees/master_tree.csv`; output is in `data/compiled/`. Run the `tools/*.js` scripts in order when curriculum changes.
10. **`teacher_sheets` is now class-scoped** via a `class_id` column. New code must include `class_id` when inserting.

## Where to find more
- `ROADMAP.md` — planned features (payment system, SMS, PWA, accessibility).
- `TreeGraphPlan.txt` — full design doc for the curriculum graph architecture.
- `README.md` — minimal, not useful as a reference.
