# Audit & Hardening Notes

Living status doc for the multi-session audit pass on the Student Portal in
preparation for school deployment. Updated 2026-04-15.

For per-session commit-by-commit detail, see `git log`. This file is the
"where do we stand" summary.

---

## Subsystem status

| Subsystem | State | Notes |
|---|---|---|
| Math Dojo skill graph | ✅ Clean | 5 cycles + 38 redundant edges removed; SkillTreeViewer mirrored |
| Math Dojo lesson content (202 lessons) | ✅ Audited | 2 math errors fixed, 25 template-literal bugs fixed, 327 dead `practice` blocks stripped |
| Math Dojo question generators (204) | ✅ Audited | 4 "answer-not-in-options" bugs fixed |
| Sub-skill gating across 64 multi-sub-skill generators | ✅ Fixed | New `getUnlockedSubSkillTypes` helper enforces "test only what's been taught" |
| Supabase RLS audit | ✅ Done | 2 RLS-less notification tables fixed (FERPA leak), split-id pattern fixed for skill_progress / skill_practice_sessions / notifications |
| RTC economy | ✅ Verified | Existing `zz_harden_rtc_transaction_forge_vectors.sql` is comprehensive (sign checks, rate limit, role checks, dup prevention) |
| Grade calculation | ✅ Fixed | `calculate_quarter_grades` no longer treats no-academic-data as 0 (fixed D- bug) |
| Gamification consolidation | ✅ Done | Riutiz wired to ArcadeManager; Math Dojo / Mathletics / Mathspire / Wasteland keep their existing progress paths |
| Other 9 games content | ✅ Audited | 1 bug in Mathletics fixed (lifetime accuracy stuck at 100%) |
| Compiled curriculum graph | ✅ Clean | 756 prerequisite edges, 0 cycles, 0 redundant, 0 orphans |
| **Enrollment form validation** | ❌ Pending | `enrollment/index.html` (62k lines) not yet audited — tier-1 risk for admissions pipeline |

---

## Pending work

### High priority
- **Enrollment form validation** — bad validation lets garbage into the
  admissions pipeline. 62k-line standalone app, biggest unaudited surface.

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
