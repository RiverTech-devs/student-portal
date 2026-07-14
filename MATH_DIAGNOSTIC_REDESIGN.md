# Math Dojo — Skill Coverage, Lesson Sufficiency & Diagnostic Redesign
**Date:** 2026-07-14 · Scope: the math skill tree, the Math Dojo lessons, and the belt/placement test.

This doc answers three questions — (1) are there gaps in the skills, (2) are the lessons sufficient, (3) how do we build the best possible diagnostic that truly finds where a student is and what holes they have — and specifies the redesign. It supersedes `Assessment_Roadmap.md`, which is **stale**: it lists the Q-matrix (Phase 1) and BKT (Phase 2) as future work, but **both already shipped** (see Part C).

---

## The core structural fact: there are TWO "skill trees," only loosely joined

1. **The Dojo taxonomy** — `TIERS` in `games/math-dojo.html` (line 1355): 10 tiers, **204 skills**, each with a lesson and a generator, keyed by *tier + name*.
2. **The curriculum DAG** — `data/compiled/master_graph.json`: the school-wide graph, **206 seeded math nodes** (224 in the pre-seed `math_merged.json`), keyed by *`M-###` node id*, with the prerequisite edges the skill-tree viewer and mastery logic use.

The Dojo writes progress under its own short names; joins back to `curriculum_nodes` rely on **name aliasing, not id equality**. Most "gaps" below live in the DAG and in this join — not in what the Dojo teaches. Unifying these two into one id-keyed graph is the highest-leverage structural fix and a prerequisite for the diagnostic in Part C.

---

## PART A — Skill coverage: gaps found

### A1. The Dojo's own coverage is complete
204 skills, 204 lessons, 204 generators — perfect 1:1, 0 skills tested-but-not-taught, 0 taught-but-not-tested.

### A2. The curriculum DAG has real holes
**18 prototype nodes exist in `math_merged.json` but were never seeded** into `master_graph.json`/`edges.json`/the viewer (they carry `sources:["prototype"]`): `M-194`–`M-211` — Integers, Euclidean Geometry, Triangle Congruence, **Trig Ratios (SOH-CAH-TOA)**, Solid Geometry, Set Theory, Polygon Properties, Sequences & Series, **Hypothesis Testing, Confidence Intervals, Regression**, Mathematical Modeling, Trig Functions, **ANOVA, Combinatorics, Modular Arithmetic, Probability Theory**, Number Recognition. Several are dupes; the rest are genuine coverage the DAG is missing. The Dojo *generates* questions for some of these (statistics/discrete) with no corresponding graph node.

**Specific missing skills worth authoring** (with suggested hard-prereq links):

| Skill | Strand | Prereqs → leads to |
|---|---|---|
| **Slope** | Algebra 1 | ← Coordinate Plane, Linear Equations → Basic Functions. *The Dojo lists "Slope" in T4 but the graph has no node.* |
| **Two-Step Equations** | Expr & Eq | ← One-Step Equations → Multi-Step Equations (chain currently skips it) |
| **Integer Operations** (+−×÷) | Number | ← Negatives → Order of Operations (seed `M-195`) |
| **Function Transformations** (shift/stretch/reflect) | Functions | ← Basic Functions, Domain & Range → Graphing Trig |
| **Quadratic Formula** | Algebra | ← Quadratic Equations → Complex Numbers |
| **Right-Triangle Trig / SOH-CAH-TOA** | Geometry | ← Pythagorean → Trigonometry (seed `M-198`) |
| **Systems of Inequalities** | Algebra | ← Graphing Linear Inequalities, Systems by Graphing |
| **Standard Deviation / Spread** | Stats | ← Mean/Median/Mode → Normal Distribution |
| **Unit Rates / Percent Applications** (tax/tip/%-change) | Ratios | ← Percentages, Ratio & Proportion |
| **Fundamental Theorem of Calculus** | Calculus | ← Integrals |

Also thin/absent across strands: comparing/ordering fractions & decimals, fraction↔decimal↔percent conversion, function notation & evaluation, quadratic graphing/vertex form, polynomial ops & long division, rational/radical expression ops, laws of exponents/logs, distance & midpoint formulas, congruence criteria, conditional probability, matrix ops, FTOC/continuity.

### A3. Structural defects in the DAG
- **13 duplicate legacy nodes** (`M12`–`M40` from `master_tree.csv`) shadow canonical `M-###` nodes (two "Linear Equations", two "Limits", etc.) forming a parallel spine. They can't just be deleted — they carry the cross-domain links, which must be migrated onto the canonical nodes first. They also sit in junk clusters named after stages.
- **Inverted / wrong prerequisites:** Limits ← [Matrices, Vectors] (should be function fluency); Trigonometry ← [Law of Sines, Law of Cosines] (backwards — those are applications *of* trig); Order of Operations ← [Square Roots, Algebraic Expressions] (backwards); Exp/Log ← [Compound Interest] (backwards).
- **Only 3 of 7 edge types exist** (`prerequisite_hard` 778, `cross_domain` 304, `leads_to` 37). **There is no `prerequisite_soft` layer** — every academic dependency is a hard lock, violating the design rule "hard prerequisites must be rare." This matters for the diagnostic: soft edges shouldn't gate, and the frontier logic needs the hard/soft distinction.
- **Layer B is nearly empty:** `description` 0/206, `evidence_types` 0/206, `grade_band` 0/206, `mastery_criteria` 34/206. ~172 nodes are bare topic labels, not observable competencies.

### A4. Granularity — split these coarse nodes to make them assessable
`Factoring` (→ GCF / trinomials / difference-of-squares / grouping), `Fraction Operations` (→ +− / × / ÷), `Decimals` (→ concept / ops / compare-round), `Conic Sections` (→ circle/parabola/ellipse/hyperbola), `Transformations` (→ translate/reflect/rotate). Atomic skills are what the diagnostic needs to pinpoint a hole; a bundled node can only ever say "something in here is weak."

---

## PART B — Lesson sufficiency: sufficient, with plumbing bugs

**Content is sufficient.** All 368 teachable units (127 flat lessons + 241 sub-skills across 77 containers) have an explanation (`teachingSteps`/`concept`), a worked example, guided interactive practice, and misconceptions. 0/368 missing a teaching field, worked example, key points, guided steps, or misconceptions. Depth is real (e.g. Derivatives has a 7-step sequence with limit-definition intuition).

**The deficiencies are all in sub-skill assessment plumbing, not content:**
1. **Two gate-key typos freeze the arena on the first sub-skill** (real bugs):
   - **Decimal Operations** — lesson stores under `3_Decimal Operations`; generator gates `getUnlockedSubSkillTypes('3_Decimals', …)` (line ~7892) → key never matches → add/subtract/multiply-decimal questions **never served** even after mastery.
   - **Systems of Equations** — lesson key `5_Systems of Equations`; generator gates `'5_Systems'` (line ~9512) → **substitution never served**.
   Fix: rename the gate key to match the lesson key.
2. **6 early-tier generators bypass gating and test untaught sub-types** (Time, Money, Measurement, Elapsed Time, Mass & Capacity, Unit Conversion) — they `pick()` over all sub-types unconditionally, some not in the lesson (Time serves "elapsed"/"convert"; Elapsed Time serves "word_problem"). Migrate them to `getUnlockedSubSkillTypes` like the other 74.
3. Minor: T8/T9 Limits each teach a sub-skill (`one_sided`, `indeterminate`) the generator never tests; 95 late-tier units carry only 1 top-level `mistakes` entry (compensated by inline per-step `commonMistakes`).

**Lesson-content conclusion: don't rewrite lessons. Fix the ~8 gating bugs and, as new skills are added in Part A, author lessons for them to keep the 1:1.**

---

## PART C — The diagnostic (belt test) redesign

### C1. What's already built (better than the roadmap says)
- **Q-matrix is live:** `Q_MATRIX` const (line ~4569), **851 entries**, each `{primary_skill, secondary_skills[], difficulty, discrimination, confidence}`. Granular keys exist (`T{tier}::{domain}::{subType}`). Built/validated by `tools/build-q-matrix.js` / `validate-q-matrix.js` / `calibrate-difficulty.js`. (Difficulty is heuristic, not response-data-fitted; discrimination is a default and unused in scoring.)
- **BKT is live end-to-end:** client compute (`bktUpdate`, `stateFromP`, graph-aware `bktPriorFor`), `p_mastered`/`last_evidence_at`/`decay_steps_applied` columns (`bkt_p_mastered.sql`, `bkt_decay.sql`), and a daily decay cron. Runs on every answered question in 5 games.

### C2. What's wrong with the current belt test
The belt test **does not use any of that** to place students. It:
- selects the next question by **tier cycling** (`getAdaptiveTier` + a competing per-answer `adaptTier`), not information gain;
- decides the belt and per-skill mastery from **coarse accuracy buckets** (100% of 2 = mastered, ≥70% of 2 = activated) — BKT runs in parallel but is ignored at decision time;
- gap-probes only a **stratified sample** (≤8 skills × 2 q), leaving most lower-tier skills marked `available` with zero evidence;
- treats **IDK as a wrong answer** (identical BKT down-update) with only a cosmetic `idk` flag and a harsher tier drop;
- ignores **response time** as an evidence signal;
- runs a **fixed 20–40 length** regardless of how (un)certain the estimate is;
- has **no joint knowledge-state model** — can't exploit the prereq graph to skip inferable skills.

### C3. Target architecture

Build a **KST learning-space core** over the prerequisite DAG, with a **DINA-style slip/guess emission model**, driven by an **information-gain item selector**, with **two-button IDK** and **response-time gating**, **variable-length stopping**, and an **ALEKS-pie + triaged-hole report**. This is the ALEKS approach plus the one thing ALEKS doesn't do (the never-seen/forgot distinction and the hole triage).

**1. State space = downward-closed knowledge states on the DAG.** A knowledge state K is a set of mastered skills such that every hard-prereq of every skill in K is also in K. The hierarchy shrinks the hypothesis space from 2^200 to a tractable set of feasible states — this is the central efficiency lever. Maintain a probability distribution over states (or, to start, a per-skill P(mastered) with the DAG enforced as constraints — a pragmatic first cut that reuses the existing BKT posterior).

**2. Emission model (don't let one answer flip a skill).** Score each response through slip σ and guess γ (reuse `BKT_PARAMS`, σ=0.10, γ=0.20 as priors; later fit per-skill from response data using the `discrimination` field). A correct answer is Bayesian evidence for mastery discounted by γ; a wrong answer is evidence against, discounted by σ.

**3. Prerequisite propagation (the reason the test is short).**
- **Pass → propagate DOWN:** mastering X sharply raises P(mastered) for all prerequisites of X; don't spend items on them.
- **Fail → propagate UP:** failing Y lowers P for skills that require Y; deprioritize them.
- **Bisect each prereq chain** for the mastered→unmastered transition (O(log n) items per chain).

**4. Item selection = expected information gain.** Pick the next generator whose answer most reduces entropy over the state distribution (Shannon/GDI or posterior-weighted KL). This naturally targets the **fringe** (skills near P≈0.5). Add a diversity guard (don't ask the same skill 3× in a row) and ~10% random exploration. This replaces `getAdaptiveTier`/`adaptTier`.

**5. Two-button IDK — replace the single "I Don't Know" with "Never seen this" and "Seen it — don't remember."** This is cognitively validated: *don't-know* = availability failure (never learned), *don't-remember* = accessibility failure (learned but not retrievable), and DR items are later recognized far more accurately than DK items. Model them differently:

| Response | Evidence to model | DAG / item-selection action | Report tag |
|---|---|---|---|
| **Correct** | mastery, discounted by guess γ (and by fast-RT, see below) | propagate mastery DOWN; move frontier up | Mastered (or *Fragile* if slow) |
| **Wrong (attempted)** | non-mastery, discounted by slip σ | probe a prerequisite; frontier at/below here | Hole — struggling |
| **"Seen it — don't remember" (DR)** | prior exposure = high, mastery-now = low; a **decay/slip signal**, NOT a hard non-mastery | **targeted re-probe**: serve an easier prerequisite or a cued/scaffolded variant. Do **not** prune the branch — this is recoverable. | **Hole — review** (previously learned) |
| **"Never seen this" (DK)** | **strong** evidence unlearned; by downward-closure its unseen **dependents are also unlearned** | **prune the entire dependent subtree** — stop asking about anything that requires this skill. Biggest item-count saving. | **Hole — teach from scratch**, with the blocked subtree it gates |

Guardrails from the literature: make IDK a **first-class, un-penalized** choice (no negative marking — it induces risk-aversion in kids); *never* infer mastery from a self-reported "I know this" (Dunning-Kruger) — the two IDK buttons are safe because they're admissions of *not* knowing, but a "sure I know it" button would not be.

**6. Response-time gating.** Capture per-item RT (already tracked). fast+correct → fluent mastery (full weight); slow+correct → *fragile*, flag for review even though right; implausibly-fast+correct → likely guess, raise effective γ and discount; slow+wrong → genuine struggle. Use RT to tag rapid-guessing/disengagement and pause rather than collect garbage.

**7. Variable-length stopping (thorough but short).** Stop a skill/branch when its posterior is confident (variance below threshold — BAMA/precision-based), not at a fixed count. Global stop when the fringe is resolved or a fatigue cap (~25–40 items for younger, more for HS/college) is hit. Seed the prior from the student's **grade level** so selection starts near the expected frontier. **Split the ~200-skill graph into strand sessions** (number, algebra, geometry, stats…) across days; persist the state distribution between sessions. Target ~20–30 min per session.

**8. Reporting — ALEKS pie + hole triage.**
- Per-skill map, every skill in one bucket: **Mastered / Ready-to-Learn (the outer fringe = what to teach next) / Not-Ready (blocked by a missing prereq) / Remaining.**
- The **frontier** called out explicitly as the assignment queue.
- The **triaged hole list** (the differentiator): each below-frontier weak skill tagged **Teach-from-scratch (DK)** / **Review (DR or slow-correct)** / **Fragile (slow/high-slip)**, with a note of which are *tested* vs *inferred* via propagation.
- Class roll-up: skill × student heat map for shared holes.
- Keep the belt/tier as a derived headline (highest tier where ≥80% of skills have P>0.7) for continuity, but the real output is the per-skill map.

### C4. Build plan (reuse-heavy)

| Step | Work | Reuses |
|---|---|---|
| **0. Unify ids** | Key the Dojo's lessons/generators/Q-matrix/progress to `M-###` node ids; make the DAG the single source of truth. | existing `DOJO_TO_TREE_SKILL`, `Q_MATRIX` |
| **1. Fix the graph (Part A)** | Seed the missing nodes, author the ~10 high-value skills, split the 5 coarse nodes, fix inverted prereqs, add the `prerequisite_soft` edge layer, merge the 13 legacy dupes (migrate cross-links first). | `tools/*` pipeline (fix the CSV re-run trap first) |
| **2. Two-button IDK** | Split the button; add `idkType:'never'\|'forgot'`; wire DK→subtree-prune + DR→prereq-reprobe into selection; stop treating IDK as a plain wrong BKT down-update. | existing `submitIDK`, `history`/`gapLog` plumbing already carries a flag |
| **3. Info-gain selector** | Replace `getAdaptiveTier`/`adaptTier` with `selectNextItem` = max expected entropy reduction over the state distribution, with prereq propagation + diversity + exploration. | `Q_MATRIX`, `bktUpdate`, `MATH_CONNECTIONS` |
| **4. KST state model** | Maintain the distribution over downward-closed states (or per-skill P + DAG constraints as a first cut); derive the frontier. | `edges.json`, existing BKT posterior |
| **5. Variable stopping + RT** | Per-skill precision stopping; grade on-ramp; RT gating; strand sessions. | existing RT capture, `p_mastered` |
| **6. Report** | ALEKS-pie + triaged holes in results screen and the teacher dashboard. | existing results screen, `portal/index.html` BKT read-back |
| **7. Calibrate** | After ~1000+ responses, fit per-skill σ/γ/difficulty/discrimination from data (replaces heuristic calibration). | `calibrate-difficulty.js`, `discrimination` field |

**Fastest high-value slice:** Steps 2 + 3 (two-button IDK + info-gain selection using the existing Q-matrix and BKT) turn the test into a genuine adaptive diagnostic without waiting for the full KST state model or the graph rebuild — those raise accuracy further but the biggest UX/quality jump is here.

---

## Prioritized next steps
1. **Fix the 2 sub-skill gate-key typos** (Decimal Operations, Systems of Equations) — real bugs freezing the arena today. Migrate the 6 ungated early-tier generators. *(small, ship now)*
2. **Two-button IDK** + stop treating IDK as a plain wrong answer. *(the feature you asked for; cognitively validated; high value)*
3. **Info-gain item selection + prereq propagation** replacing tier cycling. *(the diagnostic leap)*
4. **Graph repair:** seed the 18 missing nodes, author the ~10 high-value skills, split the 5 coarse nodes, fix inverted prereqs, add the soft-edge layer, unify Dojo↔DAG ids. *(coverage + the substrate the diagnostic reasons over)*
5. **KST state model, variable stopping, RT gating, ALEKS-pie + hole-triage report.** *(best-in-class)*
6. **Empirical calibration** once response data accrues.
