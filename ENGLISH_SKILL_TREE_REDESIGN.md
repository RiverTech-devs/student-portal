# English (Language) Skill Tree — Findings & Redesign Plan
**Date:** 2026-07-14 · Mirrors the Math redesign (`MATH_DIAGNOSTIC_REDESIGN.md`); the diagnostic architecture is inherited from there.

Applies the same treatment to English that was just done for Math: reconcile the skill graph, complete connections, ensure lessons, and rebuild the game's placement test into the adaptive KST diagnostic. English is smaller (64 nodes, a 2,305-line game) and the game↔node join is cleaner, but the graph has the same structural pathologies.

The English game is `games/english-lyceum.html` (`SUBJECT='Reading'`). `teacher-challenge.html` is an unrelated Gemini roleplay/collectible game — not part of this.

---

## PART A — Skill coverage: gaps found

### A1. Structure (same pathologies as math)
64 Language nodes across **two parallel id schemes**: 19 reading-focused `L-###` + 45 writing/grammar/rhetoric `E###` (E1–E49; E2/E3/E4/E6 already folded into L-002/003/005/006). The two schemes run **two largely disconnected reading spines** that share no prereq edge below `L-006`.

**Five L/E overlaps to reconcile (the legacy-duplicate problem):**
1. `L-007 Reading Comprehension` ↔ `E9 Reading Analysis` (+ `E5 Basic Comprehension`) — canonical spine E5→L-007→E9.
2. `L-012/013/014/015` (Fiction/Character/Plot/Theme) ↔ `E21/E22/E23` (Literature/Literary Analysis/Advanced Lit) — the biggest duplication; make E21→E22→E23 the analytical spine, keep L-013/L-014 as atomics.
3. `L-018 Research Skills` ↔ `E14 Research Basics`/`E18 Research Writing` — retire L-018.
4. `L-019 Critical Thinking` ↔ `E47 Formal Logic`/`E19 Argumentation`/`E44 Rhetorical Analysis` — retire L-019.
5. `L-011 Cause and Effect` ⊂ `E34 Text Structures` — keep as atomic under E34.

### A2. Missing skills to add (~23)
**Highest priority — Spelling** (the game already teaches it with a full lesson + question bank, but there is **no graph node**). Then: Print Concepts, Phonological Awareness, Point of View, **Figurative Language**, Literary Devices, Setting & Conflict, **Subject-Verb Agreement**, **Pronoun Usage & Agreement**, **Verb Tense & Consistency**, Fragments & Run-ons, Dialogue/Quotation Punctuation, Commonly-Confused Words, Word Relationships (syn/ant/analogies/homophones), Multiple-Meaning Words, Denotation & Connotation, Idioms/Adages, Reference/Dictionary Skills, **Opinion Writing (K-5)**, Evaluate-an-Argument (reading side), Register/Formal-Informal, Dialect.

### A3. Coarse nodes to split into drill-down atomics
- **E11 Grammar & Mechanics** (worst) → subject-verb agreement / pronoun agreement / verb tense / usage / capitalization / punctuation / spelling.
- **E7 Sentence Structure** → sentence types / simple-compound-complex / subject & predicate / fragments & run-ons.
- **E28 Parts of Speech** → the 8 parts (or grouped).
- **E31 Punctuation & Capitalization** → end marks / commas / apostrophes / quotation-dialogue / capitalization.
- **L-006 Vocabulary** → context clues (E29) / roots & affixes (E33) / word relationships / multiple-meaning / denotation-connotation / reference tools.
- **E39 Writing Process** → prewriting / drafting / revising / editing / publishing.
- **L-012 Fiction Elements**, **E22 Literary Analysis**, **E19 Argumentation** similarly.

### A4. Structural defects
- **0 prerequisite_soft edges** (all 64 hard) — add the soft layer; several cross-strand hard edges should be soft (fluency→comprehension, reading↔writing cross-links).
- **Inverted prereqs:** `E7→E28` (parts of speech is foundational to sentence structure), `E10→E11` (grammar precedes multi-paragraph writing), `E8→E9` (reading gated behind writing), `E5→L-006`, `E11→E31` (circular nesting).
- **Two disconnected reading sub-graphs** (D3) — the Part-A1 merges + a cross-link fix this.
- Grade/stage misplacements: Poetry, Text Features, Research, Critical Thinking parked at Mastery.
- Layer-B empty: nodes have no `grade_band`/`mastery_criteria`/`hard_prereqs`/`soft_deps` — a `data/english_curriculum_v2.json` mirroring the math v2 schema is the deliverable.

---

## PART B — Lesson sufficiency: complete but thinner than math
65 game skills = 65 generators = 65 lessons, perfect 1:1; every one of the 64 nodes covered by a game skill (clean name join). But lessons are lighter than math's: **no misconceptions/common-mistakes field, no guided interactive practice, and many worked-example (`ex`) fields are empty.** Fix: enrich the 65 lessons with a misconceptions layer + fill examples (needed for the diagnostic's "teach-from-scratch" hole tags), and author lessons+generators for the new skills. (`Spelling` is taught but has no node — the graph fix adds the node.)

---

## PART C — The assessment: rebuild into the KST diagnostic
The current placement is a **toy**: fixed 12 questions, a uniformly-random skill within a staircase stage, result = wherever the staircase lands (a cosmetic rank); ~53/65 skills get zero evidence per run. It never loads the prerequisite graph, has **no "I don't know" button at all**, uses a "BKT-lite" toy (no slip/guess, no Q-matrix), and produces no hole report.

**Rebuild it into the same engine as math** (`MATH_DIAGNOSTIC_REDESIGN.md` Part C): embed an `ENGLISH_GRAPH_V2` bundle, add the **two-button IDK** (🆕 Never seen — prune dependents; 🤔 Don't remember — re-probe a prerequisite), **information-gain item selection** over the 65 generators, **prerequisite propagation**, **grade on-ramp**, **variable-length stopping**, and the **ALEKS-pie + triaged-hole report**. Infrastructure already in place: clean skill→item map, a per-skill posterior already shipped as `p_mastered` to `skill_progress(Reading)` on the same wire math uses, grade bands for the prior, and the DAG itself (the game just needs to read it).

---

## Build plan (mirrors math)
1. **Graph** — author `data/english_curriculum_v2.json` (reconcile L/E, add ~23 skills, split coarse nodes, fix inverted prereqs, add soft layer, fill grade_band/mastery_criteria, map every node to its game skill). Compile into `master_graph.json`/`edges.json` + a seed migration.
2. **Lessons** — enrich the 65 with misconceptions + examples; author lessons+generators for the new skills.
3. **Diagnostic** — port the KST engine into `english-lyceum.html` (two-button IDK, info-gain, propagation, report).
4. Verify end-to-end; apply the seed migration to Supabase; teacher review of new/enriched lessons.
