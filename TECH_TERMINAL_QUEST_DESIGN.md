# Technology — GRIDFALL Terminal Quest Design (2026-07-15)

Technology is the last subject of the skill-tree arc, and like PE it broke the quiz mold:
you cannot multiple-choice "can navigate a filesystem" or "can write a function." GRIDFALL
is a **terminal RPG** where every skill is evidenced by *doing it for real* — real shell
commands against a virtual filesystem, real JavaScript graded by executing test cases,
HTML graded by DOM assertions, SQL against an in-page engine, and a simulated robot driven
by student code. Saved progress, XP/levels/badges, and a zone map give it the RPG loop.

## The premise

The school's systems crashed in "the Cascade." The student is a Junior Systems Operative
restoring 8 zones of the Grid (boot-sector, the-archives, logic-forge, web-harbor,
data-vaults, mech-bay, kernel-depths, signal-tower) — one real skill at a time. 107 quests,
406 graded steps, plus an engine-owned tutorial ("Boot Sequence").

## Evidence model (the PE lesson, applied again)

The 184-node Technology domain is really three trees: the K-12 Tech spine (T1–T33), a
Software Development sequence (T-SD001–056), and a 100-node physical Robotics program
(T-RB001–100). Honest evidence typing, declared per node in
`data/technology_curriculum_v2.json` (now 187 nodes — 3 added: T-301 Command Line Basics,
T-302 Regular Expressions, T-303 How the Internet Works):

| assess | count | evidence | graded by |
|---|---|---|---|
| quest:shell | 14 | typed commands (ls/cd/cat/grep/find/pipes/redirects) | filesystem + output checks after every command |
| quest:js | 19 | written JavaScript | sandboxed Web Worker running test cases (3.5s timeout) |
| quest:web | 9 | written HTML/CSS | DOM assertions on a sandboxed preview (no scripts run) |
| quest:sql | 3 | written SELECT queries | in-page mini-SQL engine, row comparison |
| quest:robot | 20 | code driving a simulated robot (led/motor/sensors/wait) | simulation outcomes (timing, goal cells, stream tracking, output) |
| quest:concept | 43 | TYPED answers — diagnose-from-output, calculate (Ohm's law, gear ratios, binary), trace code, fill-the-command | accept-lists / regex / numeric-with-tolerance |
| project | 80 | physical builds, breadboarding, soldering, CAD, prototypes, presentations | teacher rubric (4 criteria × 1–4) in portal/tech-assessment.html |

(Now 188 nodes / 108 quests — T-304 Mac & Windows Essentials added after the initial build.)

**No multiple choice anywhere.**

## The teaching layer — the Codex (`learn`)

Every quest node has a paged in-terminal lesson (108 lessons, ~238KB): `learn` opens the
active quest's lesson, `learn list` browses all topics by zone, `next`/`back` page through.
Quests point to it on start; `hint` reminds the student it exists. Coverage is enforced by
a validator (every quest node must have a lesson; page/line limits keep it terminal-readable).

- **Coding concepts, comprehensively**: variables (let/const), all data types, operators,
  statements/blocks/comments, if/else, **switch** (taught in the T10 lesson AND tested — a
  switch step was added to The Pulse Sorter), for/while/for...of + loop pitfalls, functions/
  parameters/return, scope, arrays, objects, string methods, debugging (error messages,
  off-by-one, missing return), events/callbacks, classes & OOP (constructor/methods/extends),
  the robot tick model, state machines, SQL clause by clause, and honest later-stage teaching
  (routing, game loops, statistics, kNN/gradient descent).
- **Mac AND Windows, everywhere it matters**: new node **T-304 "Mac & Windows Essentials"**
  (Tech: Fluency, grade 3-5, own quest "Two Doors, One House" + flagship 6-page lesson)
  systematically compares Finder/File Explorer, Cmd/Ctrl shortcuts, Spotlight/Start search,
  Activity Monitor/Task Manager, Trash/Recycle Bin, .app/.dmg vs .exe/.msi, Terminal(zsh)/
  PowerShell. All five OS lessons teach both platforms; every shell lesson includes a
  "same job, other machines" mapping (PowerShell aliases vs dir/type, /Users vs C:\Users
  path styles, cron/launchd vs Task Scheduler); web lessons give view-source/DevTools
  chords for both.
- Robotics-engineering lessons carry fully worked calculations (Ohm's law rearrangements,
  series/parallel, mAh runtime, gear trains, wheel circumference) using different numbers
  than their quests' answers.

## Persistence & progress

- **`tech_quest_saves`** (one JSONB save per student): XP, level, badges, per-quest step
  progress, and the student's code per step — resume anywhere, cross-device. Autosaves 4s
  after any progress event; manual `save` command too. localStorage fallback outside the portal.
- **`tech_project_log`** (append-only): teacher rubric evidence for the 80 project nodes,
  recorded in `portal/tech-assessment.html` (🤖 Tech Projects button in each class modal).
- **Skill tree**: completing a quest posts mastery to `skill_progress` under the node's
  legacy subject — `'Programming'` for spine+software, `'Robotics'` for T-RB (matches
  `shared/graph-data.js`; the seed also fixes the spine's previously-null `legacy_subject`).
  Mastery score = 100 − 10 per hint used (floor 70). Project-node mastery syncs the same
  way PE does: the game receives the project log at load and the student's own session
  writes the rows (teacher RLS on skill_progress is update-only by design).
- **Gating**: a quest unlocks when its hard-prereq QUEST nodes are done; teacher-verified
  project prereqs never block play.

## Architecture

| piece | file |
|---|---|
| Curriculum source of truth | `data/technology_curriculum_v2.json` (187 nodes, assess-typed, stages repaired, grade bands assigned) |
| Compiler | `tools/compile-tech-graph.js` → compiled graph + seed + `shared/tech-data.js` |
| Seed migration | `supabase/migrations/zzzzzz_technology_graph_v2_seed.sql` **(apply manually)** |
| Save + project tables | `supabase/migrations/zzzzzz_tech_quest_tables.sql` **(apply manually)** |
| The game | `games/terminal-quest.html` — engine (~1000 lines) + 289KB spliced quest content |
| Teacher page | `portal/tech-assessment.html` (project rubrics by cluster) |
| Host wiring | root `index.html`: GRIDFALL card + registry + `TQ_LOAD` / `TQ_SAVE` handlers (identity from session only; 400KB save cap) |

Engine internals: terminal emulator (history, tab completion, Ctrl+L), virtual filesystem,
shell with quoting/pipes/`>` `>>` redirects and 25 commands (+11 game commands: quest, hint,
answer, code, map, go, look, talk, stats, badges, save), quest engine with per-step setup
materialization and auto-checking, editor overlay with Run/Submit, Web-Worker JS sandbox,
robot simulator (tick-based: blink timing / grid driving / sensor-stream following / serial
output), mini-SQL (SELECT/WHERE/ORDER BY/LIMIT/COUNT/LIKE), and typed-answer matching
(synonym lists, regex, numeric with tolerance).

## Graph rework notes

- All 184 existing ids AND titles kept — existing `skill_progress` rows survive.
- Robotics stages were badly inverted (e.g. "Design Portfolio" was Foundations, "Public
  Present" Foundations) — recomputed from longest-path depth along prereqs; 100-node slice
  now monotone Foundations→Mastery. Spine/software got 2 stage fixes + grade bands (were
  all empty).
- Edges: all original prerequisite_hard edges preserved; acyclic; stage-monotone; combined
  validation across both slices clean.

## Verification (all green)

- Engine harness: 39 checks — shell semantics (pipes, redirects, every command), quest flow,
  gating, concept matching, SQL, and the real Worker source executed in-process (js grading,
  robot blink/drive/stream sims).
- **Autoplay harness** (`autoplay_quests.js`): loads the real engine + real data, then plays
  EVERY quest to completion through its own recorded solutions — spec validation (zones, xp
  ranges, prompts, hints, per-type schemas, module↔step-type fit) plus full execution.
  **107/107 quests, 406 steps, pass — both as standalone content and re-run against the
  final spliced file.** A quest that can't be beaten by its own solution is rejected.
- Five content authors each iterated against this harness before delivery; every numeric
  answer in the robotics-physics quests was hand-verified (Ohm's law, gear ratios, power
  budgets, wheel circumference).

## Remaining / manual

1. **Apply the two migrations**: `zzzzzz_technology_graph_v2_seed.sql`, then
   `zzzzzz_tech_quest_tables.sql`.
2. Teacher review of quest content — `TECH_QUESTS_TO_REVIEW.md` (full inventory by zone).
3. Smoke test in the browser: open GRIDFALL, play the tutorial + one quest per module,
   reload to confirm the save round-trips, and have a teacher score one project rubric,
   then reopen GRIDFALL to see it land on the tree.
4. Known scope choices: no Python (would need WASM; JS carries the programming strand),
   student web pages don't execute scripts (interactivity tested via concept steps),
   free-roam filesystem changes outside quests don't persist across reloads (the Grid
   "re-images overnight" — quest progress and code do persist).
