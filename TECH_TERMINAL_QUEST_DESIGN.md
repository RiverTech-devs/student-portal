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

| quest:py | 2 | REAL Python executed by **PyMini**, the engine's built-in first-party interpreter | expr tests evaluated in the student's module + output checks |

(Now 193 nodes / 113 quests — added after the initial build: T-304 Mac & Windows Essentials,
T-305 Linux Essentials, T-306 Python Basics, T-307 Python Functions & Lists, T-308 The
Polyglot Tour, T-309 Which Language for the Job?.)

## Languages

| language | depth | where |
|---|---|---|
| JavaScript | **executable** (Worker sandbox) | 19 js quests + 20 robot-sim quests |
| Python | **executable** (PyMini, first-party interpreter — see below) | T-306, T-307 |
| HTML/CSS | **executable** (rendered + DOM-asserted) | 9 web quests |
| SQL | **executable** (mini engine) | 3 sql quests |
| bash/shell + regex | **executable** (the game world itself) | 14 shell quests |
| Java, C++, C#, Swift, Kotlin, Go | reading fluency (trace output, identify, compare syntax) | T-308 The Polyglot Tour |
| Assembly | reading/tracing | T-SD016 |
| genre→language map | judgment | T-309: web→JS/TS, data & ML→Python, iOS→Swift, Android→Kotlin, Unity→C#, Unreal/systems→C++, enterprise→Java (+SQL/HTML as universal companions) |

**PyMini** — an auditable ~500-line educational Python interpreter built INTO the engine
(no third-party code shipped to students; a CDN-vendored interpreter was deliberately
rejected). Supports the full beginner subset: variables, int/float/str/bool/None/lists/
dicts, f-strings, full operator set with Python semantics (//, %, **), if/elif/else,
while/break/continue, for over range/list/string/dict, def/return/recursion/closures,
core builtins and str/list/dict methods; friendly Python-style errors (NameError,
IndexError, "try str(...)") and a 300k-op runaway guard. Not supported (documented, and
content is authored strictly inside the subset): classes, imports, try/except,
comprehensions, tuples, lambdas; integer-valued floats display without .0. Swapping in
full CPython-in-browser (Skulpt/Pyodide) later only changes the runner — the `py` step
type and content format stay identical. Verified by a 45-check interpreter battery
(test_pymini.js) plus autoplay executing every Python solution.

**No multiple choice anywhere.**

## GRIDFALL 2.0 — the learning-center layer

The system now *knows the student* and demands *fluency, not just completion*:

- **`assess` — Rank Assessment (placement)**: five stages × five questions, drawn fresh
  from the drill generators across the whole curriculum. Pass a stage at 4/5 to advance;
  every quest at or below the proven stages is FIELD-CERTIFIED (marked complete, mastery 85)
  — a student who already knows the material places past it instead of grinding.
- **`drill` — infinite practice**: 16 generator topics (~1,500 variants: binary, command
  fluency, JS/Python tracing, loops, regex, git, SQL, Ohm's law, gears, JSON paths, Big-O,
  language-ID, platforms, networking, functions) with lifetime stats. New numbers every time.
- **`patrol` — spaced retention**: five quick checks drawn from skills the student has
  mastered. Fail the patrol and the rustiest skills DEMOTE to review (skill_progress
  in_progress @55) and must be re-earned — mastery decays here like it does in Math Dojo.
- **`boss` — zone exams**: each of the 8 zones has a timed (5-10 min) compound boss mixing
  the zone's step types (the Query Sphinx demands a JOIN and a GROUP BY; the Rootkit King is
  a grep-hunt, quarantine, and Caesar decode under the clock). Unlocks at zone completion.
- **`lab` — the sandbox**: free JS/Python/HTML benches, no grading, saves to ~/lab; the
  student's whole home directory persists in the save (60KB cap) — a creative space that
  survives reloads.
- **Deep-dive track** (12 nodes, 205 total): stacks & queues, searching & sorting, Big-O,
  recursion (Python), **real git** (a working mini-git lives in the shell: init/status/add/
  commit/log/branch/checkout with true snapshot restore), **networking tools** (playable
  ping/nslookup/traceroute/webget over per-quest network maps with dead hosts to diagnose),
  HTTP & APIs (getData JSON in the JS sandbox), JSON shapes, ciphers, passwords & hashes
  (search-space math), SQL joins & groups (engine upgraded: JOIN..ON, GROUP BY,
  COUNT/SUM/AVG/MIN/MAX, aliases), and measured touch-typing (accuracy gate + real WPM).

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
- **Mac, Windows AND Linux, everywhere it matters**: platform chain T2 → **T-304 "Mac &
  Windows Essentials"** (grade 3-5, quest "Two Doors, One House" + flagship 6-page lesson:
  Finder/File Explorer, Cmd/Ctrl shortcuts, Spotlight/Start search, Activity Monitor/Task
  Manager, Trash/Recycle Bin, .app/.dmg vs .exe/.msi, Terminal(zsh)/PowerShell) → **T-305
  "Linux Essentials"** (grade 6-8, quest "The Third Door": cat /etc/os-release on a mock
  Linux disk, /home, sudo/root, distros, open source, Android; flagship 6-page lesson:
  kernel/distros, filesystem layout, bash — explicitly framing the Grid shell as native
  Linux, apt/dnf + sudo, where Linux runs). OS lessons teach all three platforms
  (System Monitor/htop/kill alongside the Mac/Windows tools); shell lessons map commands
  across PowerShell/zsh/bash; path-style pages show /home/you vs /Users/you vs C:\Users\you.
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
