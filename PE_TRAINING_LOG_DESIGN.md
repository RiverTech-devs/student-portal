# PE / Physical — Training Log Design (2026-07-15)

Physical is the one subject where mastery is **capability, not knowledge**. A quiz can't
evidence a mile time. So instead of an eighth quiz game, Physical ships as a **Training
Log**: an append-only record of measured performance, teacher observations, and activity
habits — with a small knowledge strand that reuses the standard lesson+quiz framework.

## Evidence model

Every node in the reworked Physical graph declares HOW it is evidenced via an `assess`
block in `data/physical_curriculum_v2.json`:

| type | count | evidence | who records | mastery rule |
|---|---|---|---|---|
| `metric` | 9 | measured fitness test (PACER, mile, push-ups, curl-ups, plank, sit-and-reach, shuttle, long jump, jump rope) | teacher (verified) · student may log practice | best **verified** result ≥ grade-band "meets" benchmark |
| `checklist` | 13 | observed motor-skill criteria (3–4 items, Not yet / Emerging / Consistent) | teacher | all items Consistent on latest verified assessment |
| `rubric` | 10 | sport-skill rubric (4 criteria × 1–4) | teacher | average ≥ 3 with no 1s |
| `quiz` | 12 | lessons + MC quiz in the Training Log Knowledge tab | student | ≥ 80% |
| `streak` | 3 | self-logged activity sessions (the one strand where self-logs count) | student | reach target count (P-340 counts unique days) |
| `capstone` | 3 | derived | — | P13: exceeds in 3+ measures · P14: quiz pass + teacher-approved plan · P15: P13 + P14 + any sport rubric |

**Verified vs practice:** teacher-recorded rows carry `verified=true` and are the only
evidence that counts toward metric/checklist/rubric mastery. Student self-logs are
`verified=false` (enforced by RLS, not just UI) and power practice trend lines, PR/growth
badges, and habit streaks. Mastery never downgrades — a worse later test doesn't demote.

**Benchmarks** are simplified sex-neutral grade-band standards (FitnessGram-inspired),
stored as `[meets, exceeds]` per band in the curriculum JSON → `shared/pe-data.js`.
They are data, not code — adjust in `data/physical_curriculum_v2.json` and re-run
`node tools/compile-phys-graph.js`. If the school later carries sex over from
`enrollment_applications.student_gender` to `user_profiles`, per-sex tables can be
added under the same `benchmarks` key shape without touching the pages.

**Growth alongside standards:** improvement ≥5% over the first verified baseline earns a
"Growing" badge, and any new personal best earns a PR badge — effort below the benchmark
is still visibly rewarded.

## Graph rework (P1–P21 → 50 nodes)

- 16 original nodes kept **with identical ids and titles** (P1–P3, P8, P10–P21) so any
  existing `skill_progress` rows (title-joined) survive.
- 5 umbrella nodes split (recorded in `merges`): P4 Motor Skills → 8 observable motor
  skills · P5 → balance checklist + shuttle metric · P6 → PACER + jump rope · P7 →
  push-ups/curl-ups/plank · P9 → 6 per-sport rubrics. The seed migration deletes these
  five explicitly (the shared compiler pattern never deletes rows on its own).
- 13 new nodes (P-3xx): mile run, sit-and-reach, long jump, 7 knowledge nodes, 3 habit nodes.
- 55 hard prereqs / 33 soft; acyclic; cross-domain edges to LS/SC/T survive where
  endpoints still exist.

## Pieces shipped

| piece | file |
|---|---|
| Curriculum source of truth | `data/physical_curriculum_v2.json` (50 nodes + 5 merges + assess blocks) |
| Compiler | `tools/compile-phys-graph.js` → compiled graph, seed SQL, `shared/pe-data.js` |
| Seed migration | `supabase/migrations/zzzzzz_physical_graph_v2_seed.sql` **(apply manually)** |
| Log table + RLS | `supabase/migrations/zzzzzz_pe_training_log.sql` **(apply manually)** |
| Shared node/benchmark data | `shared/pe-data.js` (generated — do not hand-edit) |
| Student page | `games/training-log.html` (Dashboard / Fitness / Movement / Sports / Knowledge / Habits) |
| Teacher page | `portal/pe-assessment.html` (class → roster → record tests/checklists/rubrics/plan review) |
| Host wiring | root `index.html`: game card + registry + `PE_REQUEST_LOG` / `PE_LOG_ENTRY` handlers |
| Portal wiring | `portal/index.html`: 🏃 PE Assessment button in the class action bar |

## Data flow

```
teacher (pe-assessment.html) ──verified rows──▶ pe_training_log ◀──unverified self-logs── student (training-log.html via host bridge)
                                                      │
student opens Training Log → derives node status → DOGO_SKILL_PROGRESS (subject 'Physical') → skill_progress → skill tree
```

- The student page never receives or sends user ids — the host (`index.html`) resolves
  identity from the session and RLS force-fields `verified=false` on student inserts.
- `skill_progress` states sync from the **student page** (students own their rows;
  teacher RLS on skill_progress is update-only). A teacher-recorded result lands as
  mastery the next time the student opens the Training Log — this is by design.
- Quiz nodes write mastery immediately at quiz completion like every other subject game.

## Verification (all green, 31 checks)

Headless harness (`test_pe_pages.js`, session tmp): syntax on both pages; 13/13 lessons +
generators registered, 3,250 generator runs (valid index-correct, deduped options, ≥10
distinct prompts per skill); engine sim covering band mapping, mm:ss parsing, meets/exceeds
classification, growth flag, unverified-doesn't-count, rubric no-1s rule, unique-day streak
dedup, capstone cascade (P13 → P14 quiz+plan → P15), skill_progress sync (all subject
Physical, no unmastered pushes, no downgrades), all 6 views rendering, and the empty
brand-new-K-student state. Graph validator: 50 nodes, acyclic, 0 dangling/orphans/dup
game_skills, benchmarks well-formed for all bands.

## Remaining / manual

1. **Apply the two migrations** in the Supabase SQL editor:
   `zzzzzz_physical_graph_v2_seed.sql`, then `zzzzzz_pe_training_log.sql`.
2. **PE-teacher review** of benchmarks (`PE_LESSONS_TO_REVIEW.md`) — the numbers are
   sensible defaults, not adopted standards.
3. Teacher review of the 13 knowledge lessons (same file).
4. Optional later: parent view of the log (RLS already allows it); per-sex benchmarks;
   PE report export.
