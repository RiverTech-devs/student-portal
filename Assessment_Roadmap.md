# Skill Assessment Roadmap: From Gap-Probing to Knowledge Space Theory

**Goal:** Evolve the Math Dojo belt test from a tier-bucketed heuristic with gap-probing (current state) into an ALEKS-style adaptive assessment that maintains a Bayesian estimate of mastery per skill and selects each question by information gain.

This is a multi-quarter arc. Each phase delivers standalone value — you don't need Phase 4 to benefit from Phase 1.

---

## Phase 0 — Current State (shipped)

What's in production now:
- Tier-based adaptive placement (20–40 questions, converges by accuracy bands per tier).
- **Gap-probing verification pass** (up to 8 skills × 2 questions) after initial convergence — probes a stratified sample of lower-tier skills the student wasn't directly tested on, weighted toward tiers closer to the placement tier.
- Unprobed lower-tier skills → marked `available` (not `mastered`).
- Conservative prereq inference: only direct (1-hop) prerequisites of mastered skills get marked `activated`; deep transitive inference removed.
- Verified gaps surfaced separately in results UI.

**What this fixes:** phantom mastery. A student who passes Algebra no longer gets ~50+ lower-tier skills auto-credited with zero evidence.

**What this doesn't fix:** the assessment unit is still a tier-domain bucket, not the individual skill. Questions are loosely tied to skills via the `DOJO_TO_TREE_SKILL` map but there's no formal Q-matrix. Skills mastery is still a discrete state (`mastered` / `activated` / `in_progress` / `available` / `locked`), not a probability.

---

## Phase 1 — Q-matrix Foundation *(4–6 weeks)*

**Goal:** every question knows exactly which skill(s) it tests.

The single biggest blocker to any Bayesian or KST approach is that we don't have a clean question→skill mapping. Right now a generator named `"Counting"` in Tier 1 produces three different question shapes ("what comes after N", "what comes before N", "count the stars") that arguably test different sub-skills. The Q-matrix formalizes this.

### Work items
1. **Schema:** Add a `question_skill_tags` table in Supabase:
   ```
   generator_key TEXT      (e.g., "T1::Counting::after")
   primary_skill TEXT      → curriculum_nodes.id
   secondary_skills TEXT[]
   difficulty SMALLINT     (1-5; default 3)
   discrimination FLOAT    (default 1.0; refined later from response data)
   ```
2. **Generator instrumentation:** Update every generator in `games/math-dojo.html` (and the other 9 games) to emit a `q.generatorKey` along with `q.tier`, `q.domain`. ~200 generators to touch — most are mechanical edits.
3. **Tagging pass:** Two-step:
   - LLM-assisted: feed each generator's source to Claude, ask for primary + secondary skill tags using `curriculum_nodes` as the vocabulary.
   - Human review of the suggestions — fast (3–5 sec per item) but mandatory; mis-tags poison everything downstream.
4. **Validation script:** `tools/validate-qmatrix.js` — confirms every generator has a tag, every tag matches a real `curriculum_nodes.id`, and tagged prereqs respect the curriculum graph.

### Deliverable
For any question asked in any game, we can answer: *"which curriculum skills did this exercise?"* This is the foundation.

### Risk
Underestimating the labeling effort. **Mitigation:** start with the 50 highest-traffic generators (placement test + Sparring Arena), defer the long tail.

---

## Phase 2 — Per-skill Mastery Probability *(2–3 weeks, after Phase 1)*

**Goal:** replace discrete `mastered`/`activated`/etc. with a continuous P(mastered) per (user, skill).

This is Bayesian Knowledge Tracing (BKT) lite. Khan Academy and most modern adaptive systems use some variant.

### Work items
1. **Schema:** Add `p_mastered FLOAT` and `last_evidence_at TIMESTAMPTZ` to `skill_progress` (or a sidecar table to preserve the existing one).
2. **Prior:**
   - If all prereqs have P > 0.7 → prior P = 0.30
   - If at least one sibling skill is mastered → prior P = 0.15
   - Otherwise → prior P = 0.05
3. **Update rule** (per answered question, applied to each tagged skill):
   - Slip rate σ = 0.10 (master answers wrong)
   - Guess rate γ = 0.20 (non-master answers right)
   - On **correct**: `P' = P·(1-σ) / (P·(1-σ) + (1-P)·γ)`
   - On **incorrect**: `P' = P·σ / (P·σ + (1-P)·(1-γ))`
   - Secondary skills update with reduced weight (apply 50% of the delta).
4. **Discrete state derived from P:**
   - P ≥ 0.85 → `mastered`
   - 0.60 ≤ P < 0.85 → `activated`
   - 0.30 ≤ P < 0.60 → `in_progress`
   - 0.05 ≤ P < 0.30 → `available`
   - P < 0.05 with locked prereqs → `locked`
5. **Decay:** Every 30 days without evidence, P decays toward prior: `P_new = 0.9·P_old + 0.1·prior`.
6. **UI:** Skill tree colors become a gradient instead of discrete buckets. Tooltip shows raw P% for teachers.

### Deliverable
Mastery becomes a continuous signal. Existing UI keeps working via derived states, but new views (teacher dashboards, recommendations) can use the raw probability.

### Risk
Slip/guess parameters are wrong for your population. **Mitigation:** start with literature defaults (0.10/0.20), recalibrate after collecting 1000+ responses by fitting per-skill σ and γ from the data.

---

## Phase 3 — Adaptive Item Selection *(3–4 weeks, after Phase 2)*

**Goal:** the next question is the one that yields the most information about the student's knowledge state.

This replaces the tier-cycling logic in `loadQuestion()` for placement mode and gives the Sparring Arena and Practice Pilot a smarter "what to ask next" engine.

### Work items
1. **Information score per candidate question:**
   ```
   I(q) = Σ_{s ∈ skills(q)}  variance(P(s)) · proximity_to_0.5(P(s)) · staleness(s)
   ```
   Questions targeting skills where P is near 0.5 (maximum uncertainty) score highest.
2. **Selection function:** `selectNextItem(userId, candidatePool)` → returns generator_key. Replaces the `getAdaptiveTier()` + `generateQuestion(tier, domain)` flow.
3. **Diversity guard:** don't ask three questions about the same skill in a row — round-robin within the top-quintile by information score.
4. **Stopping rule:** test ends when:
   - Mean variance across fringe skills < 0.05 (we're confident), OR
   - Question count ≥ 35 (fail-safe).
5. **Backward compat:** Tier number still exposed in results — derived as the highest tier where ≥80% of skills have P > 0.7.

### Deliverable
Placement test runs ~20 questions and produces a per-skill confidence map. Same engine powers "what should I practice next" in other modes.

### Risk
The selector picks questions that always target the same handful of fuzzy skills. **Mitigation:** explicit diversity guard above; periodic random "exploration" question (~10% of the test).

---

## Phase 4 — Knowledge Space Theory (KST) *(3–4 weeks, after Phase 3)*

**Goal:** maintain a probability distribution over plausible knowledge states (not just per-skill probabilities) and pick each question to maximally disambiguate between high-likelihood states.

This is full ALEKS. It's a step up from per-skill BKT because it respects the **joint** structure of the prerequisite graph — you can't be in a knowledge state that includes "Derivatives" but not "Limits", so the test never needs to question that combination.

### Work items
1. **Knowledge space enumeration:**
   - A knowledge state K ⊆ skills is *valid* iff for every skill s ∈ K, all prereqs of s are also in K (downward-closed).
   - The space of valid K for ~200 skills under your prerequisite graph is typically a few thousand states — far less than 2^200.
   - Generate them via the curriculum graph in `data/compiled/`. Cache.
2. **Posterior P(K | responses):** maintain a probability distribution over the (~thousands of) valid states. Updated by likelihood of each response under each candidate state.
3. **Item selection:** pick the question whose answer maximally splits the high-probability portion of the posterior (information-theoretic; the entropy reduction of the posterior).
4. **Output:**
   - Collapse to single best K when posterior concentrates (e.g., one state holds >70% of mass).
   - Otherwise report top-3 candidate states for teacher disambiguation.
5. **Caching:** posterior updates are O(K), expensive. Precompute the response→state likelihood matrix offline.

### Deliverable
The student doesn't get a "tier" — they get a precise per-skill map: "you've mastered everything in this set; you're at the fringe with these skills; everything beyond is locked." Identical to what ALEKS produces.

### Risk
- **Q-matrix accuracy is critical.** Garbage in, garbage out. Don't start Phase 4 until Phase 1 has been QA'd against real response data for at least a semester.
- **State space might be too large** for some curricula. Mitigation: sampling-based posterior (Monte Carlo over knowledge states) instead of explicit enumeration.

---

## Phase 5 — System-wide Integration *(2–3 weeks, after Phase 4 or in parallel with Phase 3)*

**Goal:** every question answered anywhere updates the central knowledge model.

### Work items
1. Unify assessment paths: Math Dojo (placement, sparring, retention), Mathletics, Practice Pilot, Clockwork Defense, Testing Center, Teacher-assigned homework — all flow through the same `recordResponse(userId, generatorKey, correct, elapsedMs)` API.
2. Spaced-repetition scheduler: pulls skills with decayed P or high uncertainty, surfaces them in retention gauntlet.
3. Teacher dashboard: per-student knowledge state visualization, top-N intervention targets, class-aggregate gaps.

### Deliverable
The skill graph state in `skill_progress` is the single source of truth, fed by every game.

---

## Recommended sequence

| Order | Phase | Why |
|---|---|---|
| 1 | Phase 0 (gap-probing) | ✅ Shipped |
| 2 | Phase 1 (Q-matrix) | Blocking dependency for everything else; can start now |
| 3 | Phase 2 (BKT probabilities) | Standalone value (better tree colors, recommendations) even without 3+ |
| 4 | Phase 3 (adaptive selection) | The big UX win; replaces tier logic |
| 5 | Phase 5 partial — unify the response pipeline | Lets every game contribute data |
| 6 | Phase 4 (full KST) | Only if Phase 3 isn't precise enough |

**Total wall time to full KST:** ~4–6 months of part-time work, or 2–3 months full-time. But Phase 1 + Phase 2 + Phase 3 alone is a major upgrade and could ship in ~10 weeks.

---

## Open design questions (defer until ready)

- **Skill granularity.** Is "Factoring" one skill or three (factor by grouping / factor trinomials / factor difference of squares)? Finer-grained Q-matrix is more accurate but exponentially harder to label.
- **Decay model.** Power-law forgetting curve (more accurate, more parameters) vs. linear decay (simpler, good enough).
- **Surfacing probabilities to students.** Does seeing "P(mastered) = 67%" help or stress them out? Likely keep teacher-only.
- **Multi-skill question weighting.** If a question requires both "Slope" and "Linear Equations", how do we split credit on a correct answer? Equal? Primary-heavy? Use the discrimination parameter?
- **Cold-start for new students.** Belt test on first login is fine for placement, but mid-year transfers need a faster path — possibly seeded from district test data if available.

---

## Files this will touch

| File | Phase | Change |
|---|---|---|
| `games/math-dojo.html` | 1, 3 | Generator tagging; replace `loadQuestion` selector |
| `games/*.html` (other 9) | 1, 5 | Generator tagging; unified response API |
| `shared/config.js` | 5 | `recordResponse()` API; central mastery sync |
| `supabase/migrations/` | 1, 2 | `question_skill_tags`, `p_mastered` column |
| `data/compiled/` | 4 | Knowledge state enumeration cache |
| `portal/index.html` | 5 | Teacher dashboard knowledge-state view |
| `tools/` | 1, 4 | Q-matrix validator; K-space generator |
