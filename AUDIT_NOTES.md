# Audit & Hardening Notes

Living status doc for the multi-session audit pass on the Student Portal in
preparation for school deployment. Updated 2026-07-13.

For per-session commit-by-commit detail, see `git log`. This file is the
"where do we stand" summary. The full 2026-07-09 audit report (findings with
`file:line` + failure scenarios, feature breakdown, and market comparison)
lives in `AUDIT_2026-07-09.md`.

---

## 2026-07-09 full audit + 2026-07-13 remediation

An 8-pass parallel audit (frontend, portal core, Riven/RTC, Supabase backend,
games, enrollment/tools/viewers, plus feature inventory and market research)
found **4 critical + ~30 high + ~40 medium** findings. Fixes landed in commit
`4dbb04d` (2026-07-13). **Frontend fixes are live via GitHub Pages; the backend
migrations and edge-function change were applied to Supabase on 2026-07-13.**

**Applied / fixed:**
- **RTC economy hole closed** — `earn_skill` was uncapped and the mastery
  trigger minted on free-text `skill_progress` rows → unbounded RTC. Now
  rate-limited (200 RTC/24h) and gated on a real `curriculum_nodes` match;
  new `award_skill_gauntlet_rtc` RPC is the legit gauntlet award path.
  (Migration `zzzzzz_security_hardening_2026_07_09.sql`.)
- **XSS family** — one quote-safe `escapeHtml` (+ `jsAttr`/`sanitizeLink`)
  applied across messages, notifications, grading modals, discussion replies,
  student names, enrollment-review UI, testing-center, and cosmetics.
- **Notifications INSERT RLS tightened** (students self-only, staff broadcast)
  — closes cross-user notification/`onclick` injection.
- **Open email/phishing relay closed** — `send-notification-email` raw-recipient
  branch now gated to staff/service-role.
- **PIN exposure** — `admin_bank_list_students` masks PINs to admins only.
- **Account activation loop** — `reactivate_student` now also sets
  `can_login`/`account_status` (SECURITY DEFINER, bypasses the protect trigger).
- **Enrollment** — sibling applications now submit (sequential inserts →
  distinct app numbers); emergency medical info + waivers + phone now carried
  into the student record on approval; client validation + duplicate-submit
  guard added.
- **Riven** — explicit command verbs beat the "…too" relay; question phrasings
  no longer mutate balances; single award/transfer are confirmation-gated;
  attendance dates computed in local time. RTC double-award guard added;
  recurring facility bookings now conflict-check every occurrence.
- **Broken redirects** — `/student-portal/...` paths corrected to root-relative
  (auth confirm / teacher invite were 404ing on the live domain).
- **Attendance** — delete-then-insert guarded; uniform daily-upsert payload.
- **Pagination** — quarter/grade/attendance/notes/recipient/broadcast fetches
  now page past the 1000-row cap.
- **Games** — no more writing `locked` / demoting teacher-set mastery;
  mastery-inflation gates; Riutiz MP constructor + ranked flags; Mathspire
  PEMDAS/shield.
- **Curriculum pipeline** — `master_tree.csv` dead-zone removed so a re-run no
  longer drops the 22 English nodes (extractor reaches 262/680).
- **Skill viewers** — dynamic canvas bounds (Technology nodes were off-screen),
  duplicate-name disambiguation, `leads_to` no longer gates unlocks,
  subject-scoped progress storage, NetworkGraph stable pagination.
- **Hygiene** — untracked OS/editor/temp junk; cache-bust versions bumped.

**⚠️ Still open — action required:**
- **Rotate the exposed Gemini API key** (`AIzaSyBF9kLa911sOy1G1xT13lI2RSdSLY0wUII`).
  It was removed from `games/teacher-challenge.html` source but is still in git
  history and was live on a public repo — revoke/regenerate in Google Cloud.
  The game now reads the key from `window.GEMINI_API_KEY`/localStorage and
  degrades gracefully; long-term it should move to an edge-function proxy.

**Deferred (need live-gradebook testing before it's safe to change):**
- **M1** — admin grade report averages raw `points_earned` across differing
  `max_points` and labels it `%`; needs the weighting model to compute a proper
  weighted %.
- **M6** — 8 scattered JS due-date-vs-`quarters.end_date` comparisons are
  UTC/date-only (SQL twin already fixed); mirror the SQL fix once testable.

**Verification owed:**
- Run the Riven regression suite `../debug-tools/nlp-stress.js` (~240 checks) on
  a machine that has it — the H-21/H-22 matcher changes passed `node --check`
  here but that suite lives outside the repo.

**Low-priority hygiene not yet done:**
- ~2.4 MB unreferenced QA screenshots (`Trees/3D Skill Tree/qa_*.png`) and the
  self-labeled `Trees/3D Skill Tree (Depricated)/` prototype dir are still
  tracked/served — bulk-delete when convenient.
- **H-12 note:** the `assignment_submissions` auth-uid-vs-profile-id split was
  fixed on the *read* side (teacher/test-center now match either id). The write
  path was intentionally left keyed as-is because that table's write RLS isn't
  in the tracked migrations — revisit if a submission still shows the wrong id.

---

## Subsystem status

| Subsystem | State | Notes |
|---|---|---|
| Math Dojo skill graph | ✅ Clean | 5 cycles + 38 redundant edges removed; SkillTreeViewer mirrored |
| Math Dojo lesson content (202 lessons) | ✅ Audited | 2 math errors fixed, 25 template-literal bugs fixed, 327 dead `practice` blocks stripped |
| Math Dojo question generators (204) | ✅ Audited | 4 "answer-not-in-options" bugs fixed |
| Sub-skill gating across 64 multi-sub-skill generators | ✅ Fixed | New `getUnlockedSubSkillTypes` helper enforces "test only what's been taught" |
| Supabase RLS audit | ✅ Done | Notification tables RLS fixed (FERPA); split-id pattern fixed; **notifications INSERT tightened (self-only / staff-broadcast) 2026-07-13** |
| RTC economy | ✅ Hardened | `zz_harden_...` covered earn_arcade; **2026-07-13 closed the earn_skill unbounded-mint hole** (rate limit + curriculum-node gate + `award_skill_gauntlet_rtc` RPC) |
| XSS / output escaping | ✅ Fixed 2026-07-13 | Single quote-safe `escapeHtml`+`jsAttr`+`sanitizeLink` across portal, testing-center, enrollment review, cosmetics |
| Riven NLP terminal | ✅ Hardened 2026-07-13 | Relay-verb precedence, question-phrasing write guard, confirmation-gated award/transfer, local-time dates. **Run `nlp-stress.js` to confirm** |
| Grade calculation | ✅ Fixed | `calculate_quarter_grades` no longer treats no-academic-data as 0 (fixed D- bug) |
| Gamification consolidation | ✅ Done | Riutiz wired to ArcadeManager; Math Dojo / Mathletics / Mathspire / Wasteland keep their existing progress paths |
| Other 9 games content | ✅ Audited | 1 bug in Mathletics fixed (lifetime accuracy stuck at 100%) |
| Compiled curriculum graph | ✅ Clean | 756 prerequisite edges, 0 cycles, 0 redundant, 0 orphans |
| Enrollment form + review | ✅ Audited & fixed 2026-07-13 | Sibling-submit fixed, XSS in admin review escaped, client validation + dup guard, medical/waivers carried to profile on approval |

---

## Pending work

### High priority
- **Rotate the exposed Gemini API key** (see the 2026-07-13 remediation section
  above) — still live in git history on a public repo.

### Deferred (need live-gradebook testing)
- **M1** weighted-% grade report math; **M6** 8 UTC due-date/quarter-end JS
  comparisons. See the 2026-07-13 section for detail.

### Repo-integrity gaps (production works but fresh deploys would fail)
- `is_admin()` function used by 8+ policies but never `CREATE`d in any
  migration file
- `parent_child_links` table referenced everywhere but `CREATE TABLE` is
  missing from the migration chain — comment in
  `parent_child_links_admin_policies.sql` says "Already fixed via SQL Editor"
- `mathletics_progress` table read/written by Mathletics but not in
  migrations
- `skill_progress.state` CHECK constraint allows `('locked', 'available',
  'in_progress', 'mastered', 'activated')` but Math Dojo also uses
  `'needs_review'`; latent (Math Dojo currently never sends it)
- `skill_progress_enhanced.sql` references `profiles` (should be
  `user_profiles`), `class_students` (should be `class_enrollments`),
  `profiles.role` (should be `user_profiles.user_type`) — production has
  aliases or these were created via SQL editor

### `protect_user_profile_columns` trigger must stay SECURITY INVOKER

This trigger gates direct UPDATEs to protected `user_profiles` columns
(`rtc_balance`, `user_type`, `account_status`, `can_login`,
`enrollment_type`). It must be defined **without** `SECURITY DEFINER` so
that `current_user` reflects the actual caller:

| Call path                                  | `current_user`       | Branch    |
|--------------------------------------------|----------------------|-----------|
| Direct PostgREST UPDATE (student/parent)   | `authenticated`/`anon` | restrict |
| Inside a SECURITY DEFINER RPC (rtc_bank_deposit, process_rtc_transaction, admin_set_rtc_balance, etc.) | function owner (e.g. `postgres`) | bypass |

If anyone redefines the trigger function with `SECURITY DEFINER`,
`current_user` becomes the function owner regardless of how it was
invoked — the bypass branch fires for *every* caller, including a
direct PostgREST UPDATE, and students can edit their own
`rtc_balance` straight from the browser. Or worse: the SECURITY
DEFINER variant typically also removes the `current_user NOT IN
('authenticated','anon')` check, in which case the trigger reverts the
wallet debit *inside* `rtc_bank_deposit` and students get a free copy
of the deposited RTC in their bank balance.

History to watch out for:
- `zz_fix_protect_profile_trigger_invoker_v2.sql` (2026-ish) was the
  original canonical fix. Several earlier `zz_fix_user_profiles_*`
  migrations and later cleanups *re-define* the function as SECURITY
  DEFINER and sort alphabetically AFTER the v2 fix, silently
  re-introducing the bug on fresh deploys.
- `zzz_fix_protect_profile_invoker_canonical.sql` re-applies the
  SECURITY INVOKER body and uses a `zzz_` prefix so it sorts after
  every `zz_*` file. This is the version your DB should currently be
  running. Verify with:
  ```sql
  SELECT prosecdef FROM pg_proc
  WHERE proname = 'protect_user_profile_columns';
  -- prosecdef = false (i.e. 'f') is correct. 't' means the exploit is open.
  ```

If a future migration ever needs to change this trigger, copy the
function body from `zzz_fix_protect_profile_invoker_canonical.sql`
verbatim and name the migration to sort after `zzz_*`.

### PIN-login edge function must be deployed with verify_jwt = false

The `pin-login` function is anonymously callable — students don't have
a session when they're signing in via PIN. Supabase's gateway rejects
unauthenticated requests by default with
`sb-error-code: UNAUTHORIZED_NO_AUTH_HEADER` (HTTP 401) **before the
function code runs**. The fix is committed in `supabase/config.toml`:

```toml
[functions.pin-login]
verify_jwt = false
```

`supabase functions deploy pin-login` reads that file and applies the
flag automatically. If you ever deploy without the config.toml present
(e.g. ad-hoc from another machine), pass `--no-verify-jwt` explicitly,
or the entire flow returns 401s that look like "no PIN match" but
aren't reaching the function at all. Diagnostic header on a failing
response: look for `sb-error-code: UNAUTHORIZED_NO_AUTH_HEADER`.

### PIN auth hardening (the games-PIN sign-in flow)

The 4-character PIN is now the *only* credential for the games-only sign-in
(`pin-login` edge function + inline tab on the login screen). Math: alphabet
is 31 chars (`A–Z` minus `O/I/L`, plus `2–9`), so 31⁴ ≈ **923K combinations**.
With N students enrolled (each with a unique PIN), random brute force has an
N/923K hit rate per request. At 100 students that's ~0.01% per guess; at 10K
it's ~1%. Worth hardening before the feature gets wide use:

- **Edge-function rate limit.** Supabase Edge Functions support per-IP
  request limits — tighten `pin-login` to ~5 requests/minute. Cheapest fix,
  do this first.
- **`pin_login_attempts` lockout table.** Track failures per-IP and/or
  per-PIN; lock the target PIN for N minutes after K failures. Pairs with
  the rate limit (rate limit slows down, lockout stops). Schema sketch:
  `(id, ip inet, pin text, attempted_at timestamptz)` with an index on
  `(pin, attempted_at)` and a counter query in the edge function before it
  calls `pin_lookup_by_pin`.
- **CAPTCHA on the PIN form** after K failures from the same IP. Cloudflare
  Turnstile is the lowest-friction option here.

Related: the new `idx_user_profiles_games_pin_unique` partial unique index
guarantees PIN-alone identifies one student, and `staff_set_student_pin`
now rejects duplicates — so a single correct PIN always lands you on the
same account. That's a feature for UX but it's also why the brute-force
math is what it is.

### PIN-only session UI gating is not enforced by RLS

When a student signs in via PIN, `buildUnifiedNav` and `showTab` strip
everything except **Games** and **Skills** for `account_status='inactive'`
sessions. This is **UI-only** — the underlying RLS policies on grade,
class, messaging, and assignment tables still allow the session to read
its own rows. A PIN-only student poking at `supabase.from(...).select()`
from the browser console could still pull grades and messages for their
own profile.

Hardening plan when this matters:
- Add a `WHERE` clause to the SELECT policies on `homework_assignments`,
  `class_attendance`, `notifications`, `test_submissions`, etc.:
  `(SELECT account_status FROM user_profiles WHERE auth_user_id = auth.uid()) = 'active'`.
- Or add a single helper SQL function `public.is_fully_claimed()` and
  reference it from every relevant SELECT policy.
- The `_renderRTCBankHelper` admin path is unaffected (admin/teacher
  user_types bypass these checks).

### Minor / future
- Duplicate-options in some practice generators (~100 cases, cosmetic only —
  both copies render and clicking either still registers correctly)
- Wasteland's answer-comparison tolerance is `< 0.1` which is loose for
  decimal problems but not strictly wrong
- Mathspire `eval()` usage is properly sandboxed but worth a security review
  if expression sources ever expand

---

## Reusable audit tools (in `tools/`)

Each is invoked with `node tools/<name>.js`.

| Tool | What it does |
|---|---|
| `tools/audit-lessons.js` | Runtime eval of all 202 Math Dojo lessons; checks for missing fields, commonMistakes/answer collisions, sub-skill ordering |
| `tools/audit-generators.js` | Runtime eval of all 204 question generators; same checks plus duplicate-option detection and template-literal bugs |
| `tools/check-template-bugs.js` | Standalone template-literal hunter (finds `"...${var}..."` strings) |
| `tools/fix-template-bugs.js` | One-shot codemod that swaps `"..."` → `` `...` `` for all matches |
| `tools/strip-dead-practice.js` | One-shot codemod that removed 327 dead `practice` blocks (kept for record) |
| `tools/rls-audit.js` | Walks `supabase/migrations/*.sql` and builds per-table RLS state |
| `tools/fix-subskill-gates.js` | Bulk migration script for the 64 generators using `getUnlockedSubSkillTypes` helper |

Re-run any of these after lesson/generator edits to verify nothing
regressed.

---

## Major commit history

| Commit | What |
|---|---|
| `7e4fa5d` | Remove 5 circular prerequisites in Math Dojo skill graph |
| `dc0ee97` | Transitive reduction (38 redundant edges) |
| `f961ca2` | Mirror skill-graph fixes to SkillTreeViewer |
| `c5c21af` | Fix Order of Operations tier mismatch + add audit tool |
| `edc9fb1` | Strip 327 dead `practice` blocks (-2k lines) |
| `cc9dd92` | Fix 2 math content errors (Multi-Step Equations, Vector Curl) |
| `adf792e` | Fix 25 template-literal bugs in lesson content |
| `78d74bf` | Enable RLS on notification dedupe tables (FERPA) |
| `40006a0` | Fix 4 generators where correct answer wasn't in options |
| `e535d34` | Reinstate NULL-academic-grade handling in `calculate_quarter_grades` |
| `3024300` | Wire Riutiz to ArcadeManager (gamification consolidation) |
| `e56fab7` | Revert detach for Math Dojo / Mathletics (priority correction) |
| `f2d50d4` | Fix split-id RLS for skill_progress / skill_practice_sessions / notifications |
| `3cf9ff7` | Wasteland uses user_profiles.id instead of auth.uid() |
| `d5110ab` | Add `getUnlockedSubSkillTypes` helper + fix Advanced Fractions |
| `1461ee1` | Bulk migrate 63 more generators to the helper |
| `ce3fd20` | Fix Mathletics lifetime accuracy stuck at 100% |

---

## Process notes

- **`gh auth switch -h github.com -u RiverTech-devs`** before pushing — this
  repo expects the RiverTech-devs account, but the active gh login may be
  Densanon-devs.
- **Migration files apply alphabetically.** Use a `zz_` prefix for fixes
  that must override earlier migrations (the existing
  `zz_fix_protect_profile_trigger_invoker_v2.sql` etc. follow this convention).
- **Don't touch `portal/index.html` or `index.html` casually** — they are
  ~5k and ~40k lines respectively. Use Grep to find target sections.
- **The audit tools are the primary regression check** — there is no
  automated test suite in this repo.
