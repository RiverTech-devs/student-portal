# PE / Physical — Review Checklist (2026-07-15)

Three things need human (ideally PE-teacher) review before this goes live to students.
Everything here is data-driven: fix numbers/wording in `data/physical_curriculum_v2.json`,
re-run `node tools/compile-phys-graph.js`, and re-apply the seed migration.

## 1. Fitness benchmarks — `[meets / exceeds]` per grade band

These are **simplified, sex-neutral defaults** (FitnessGram-inspired midpoints), not an
adopted standard. A student at "meets" masters the skill; "exceeds" feeds the Advanced
Conditioning capstone (3+ measures at exceeds).

| Measure | unit | K-2 | 3-5 | 6-8 | 9-10 | 11-12 |
|---|---|---|---|---|---|---|
| Endurance Run (PACER) | laps | 10 / 20 | 20 / 35 | 35 / 55 | 50 / 70 | 55 / 80 |
| Mile Run | time (lower=better) | — | 11:30 / 10:00 | 10:00 / 8:30 | 9:00 / 7:30 | 9:00 / 7:15 |
| Push-Ups | reps | 5 / 10 | 8 / 15 | 12 / 22 | 16 / 30 | 18 / 35 |
| Curl-Ups | reps | 10 / 20 | 20 / 35 | 30 / 50 | 40 / 65 | 45 / 75 |
| Plank Hold | time | 20s / 40s | 45s / 1:15 | 1:10 / 1:50 | 1:30 / 2:30 | 1:40 / 3:00 |
| Sit-and-Reach | cm | 23 / 30 | 22 / 28 | 20 / 28 | 20 / 28 | 20 / 28 |
| Shuttle Run 4×10m | seconds (lower=better) | 14 / 12.5 | 12.5 / 11.5 | 11.5 / 10.5 | 10.8 / 9.8 | 10.5 / 9.5 |
| Standing Long Jump | cm | 90 / 120 | 125 / 155 | 155 / 185 | 175 / 210 | 185 / 220 |
| Jump Rope Endurance | consecutive jumps | 15 / 40 | 40 / 80 | 60 / 120 | 80 / 150 | 80 / 150 |

Review questions: are these achievable-but-honest for our students? Should Mile Run be
offered below grade 3 at all (currently no K-2 standard — PACER covers that band)? Keep
sex-neutral, or carry gender over from enrollment and use per-sex tables?

## 2. Knowledge lessons + question banks (13, in `games/training-log.html`)

AI-authored; each has a 5-step lesson, 4-5 common mistakes, and a 15-16 question bank
(quiz = 10 questions, pass at 80%). Verify facts, age-appropriateness, and tone.

- [ ] Safety & Warm-Up Basics (K-2)
- [ ] Sportsmanship & Fair Play (K-2)
- [ ] Components of Fitness (3-5)
- [ ] Rules of Major Sports (3-5) — check rules match how WE play (basketball, soccer, volleyball, kickball/baseball)
- [ ] Hydration & Recovery (3-5)
- [ ] Fitness Routines (3-5)
- [ ] Body Systems & Exercise (6-8)
- [ ] Health & Nutrition (6-8) — MyPlate-based
- [ ] Game Strategy (6-8)
- [ ] Fitness Goal Setting (6-8) — SMART
- [ ] Injury Prevention (6-8) — RICE, 15-20 min icing, when to get an adult
- [ ] Performance Training (9-10) — FITT, progressive overload, 220−age max HR, ~10%/week
- [ ] Personal Fitness Planning (9-10) — capstone: quiz + teacher-approved written plan

## 3. Observation instruments (teacher-facing, `portal/pe-assessment.html`)

- [ ] 13 motor-skill checklists (3-4 observable criteria each, Not yet / Emerging / Consistent) —
      do the criteria match how you actually assess (e.g. overhand throw: side to target,
      opposite-foot step, hip rotation, follow-through)?
- [ ] 10 sport rubrics (4 criteria × 1-4; mastery = avg 3+ with no 1s) — basketball, soccer,
      volleyball, throwing & fielding, racket & net, track & field, Team Play, Individual
      Sports, Team Sports, Competitive Performance
- [ ] Habit targets: Daily Activity 20 days (30+ min, 1/day) · Weekly Workout 12 sessions ·
      Stretching 10 sessions (10+ min)
- [ ] Plan Review criteria for the Personal Fitness Planning capstone

## Manual apply steps (blocking)

1. Supabase SQL editor → run `supabase/migrations/zzzzzz_physical_graph_v2_seed.sql`
2. Supabase SQL editor → run `supabase/migrations/zzzzzz_pe_training_log.sql`
3. Smoke test: student opens Games → Training Log (logs a practice + a habit session,
   takes one quiz); teacher opens a class → 🏃 PE Assessment (records one measurement,
   one checklist, one rubric); student reopens Training Log and sees mastery land.
