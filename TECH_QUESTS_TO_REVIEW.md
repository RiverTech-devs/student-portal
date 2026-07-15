# Technology — GRIDFALL Quest Review Checklist (2026-07-15)

All 107 quests are machine-verified (every quest completes via its own solution in the real
engine; every graded step is deterministic). What machines can't judge: tone, difficulty
calibration, and whether the challenge matches how YOU teach it. Review priorities:

1. **K-2 quests** (boot-sector: First Light, Wake the Keys, The Whisper Gate, The Lost Teddy) —
   gentlest language in the system; make sure they land for real 5-7 year olds.
2. **Digital citizenship / security content** (The Whisper Gate T4, Intrusion at Gate Seven
   T-SD029, Hardening the Gates T-SD037) — safety framing is teacher territory.
3. **Robotics physics numbers** (mech-bay concept quests) — values were hand-verified, but
   confirm they match your actual kit components (9V packs, 220Ω, 20mA LEDs, 1500mAh).
4. **Difficulty spot-checks**: play one quest per module at the grade band you know best.
5. **The 80 project rubrics** in portal/tech-assessment.html (criteria authored per node) —
   same review as the PE rubrics: do the 4 criteria match how you actually assess builds?

Fix wording in games/terminal-quest.html (quest content is plainly readable JS near the
bottom); structural changes should go through the autoplay harness before shipping.

## Manual apply steps (blocking)
1. Supabase SQL editor → run supabase/migrations/zzzzzz_technology_graph_v2_seed.sql
2. Supabase SQL editor → run supabase/migrations/zzzzzz_tech_quest_tables.sql
3. Browser smoke test per TECH_TERMINAL_QUEST_DESIGN.md §Remaining.

## Full quest inventory (107 quests · 406 graded steps · 8 zones)

### boot-sector (7 quests)

| Quest | Skill node | Module | Grade | Steps |
|---|---|---|---|---|
| The Gatehouse Speaks | Command Line Basics (T-301) | shell | 3-5 | 5 |
| Console Wake-Up Call | Basic Computer Operations (T-SD002) | shell | 6-8 | 5 |
| Sparks in the Dark | Programming/Basic Theory (T-SD005) | js | 6-8 | 4 |
| The Console That Mumbles | Console UI Fundamentals (T-SD014) | js | 6-8 | 3 |
| The Lost Teddy of the Playroom | Digital Navigation (T2) | shell | K-2 | 5 |
| First Light | Device Basics (T1) | concept | K-2 | 5 |
| Wake the Keys | Keyboarding & Input (T3) | concept | K-2 | 3 |

### data-vaults (8 quests)

| Quest | Skill node | Module | Grade | Steps |
|---|---|---|---|---|
| The Analyst's Return | Statistical Analysis (T-SD052) | js | 11-12 | 3 |
| The Machine That Learns | Machine Learning Algorithms (T-SD053) | js | 11-12 | 4 |
| The Pattern Miners | Data Science and Machine Learning (T-SD051) | concept | 11-12 | 4 |
| The Overfit Oracle 🏅 | Advanced Machine Learning (T-SD056) | concept | 11-12 | 5 |
| The Crystal Catalog | Basic Database Concepts (T-SD007) | sql | 6-8 | 4 |
| The Quartermaster's Ledger | Data & Spreadsheets (T31) | sql | 6-8 | 4 |
| Manifest of the Lost Crates | Basic Concepts (T-SD013) | js | 9-10 | 3 |
| Clearance: Deep Vault 🏅 | SQL (T-SD017) | sql | 9-10 | 4 |

### kernel-depths (10 quests)

| Quest | Skill node | Module | Grade | Steps |
|---|---|---|---|---|
| The Unattended Night Shift 🏅 | Advanced Automation (T33) | shell | 11-12 | 5 |
| The Rogue Process | Systems and Application Programming (T-SD027) | shell | 11-12 | 5 |
| Anatomy of a Guard Script | Advanced Systems Programming (T-SD030) | shell | 11-12 | 5 |
| The Patch Pipeline | Advanced Software Development (T-SD034) | js | 11-12 | 3 |
| The Zombie in the Table | Operating System Fundamentals (T-SD028) | concept | 11-12 | 5 |
| Intrusion at Gate Seven | Cybersecurity Pathways (T-SD029) | concept | 11-12 | 5 |
| Hardening the Gates 🏅 | Application Security (T-SD037) | concept | 11-12 | 5 |
| Heart of the Machine | Introduction to Operating Systems (T-SD001) | concept | 6-8 | 5 |
| Ghosts in the Kernel | Advanced Debugging Techniques (T-SD015) | js | 9-10 | 4 |
| Register Ghosts | Assembly Language Programming (T-SD016) | concept | 9-10 | 4 |

### logic-forge (16 quests)

| Quest | Skill node | Module | Grade | Steps |
|---|---|---|---|---|
| The Guardian's Mind | Advanced Game Programming (T-SD047) | js | 11-12 | 4 |
| The Post-Mortem Files | Software Engineering (T-SD033) | concept | 11-12 | 4 |
| The Master Blueprint 🏅 | Software Architecture (T-SD036) | concept | 11-12 | 5 |
| The Apprentice Toolbench | Basic Software Tools (T-SD004) | shell | 6-8 | 5 |
| The Pulse Sorter | Programming Logic (T10) | js | 6-8 | 3 |
| Scoreboard of the Old Arcade | Programming Projects (T11) | js | 6-8 | 3 |
| Cabinet of Glitch Duel | Game Logic (T20) | js | 6-8 | 3 |
| Gates of the Old Logic | Computer Science Algebra (T-SD010) | js | 6-8 | 4 |
| The Recipe Engine | Algorithmic Thinking (T9) | concept | 6-8 | 4 |
| The Number Smelter | Basic Arithmetic (T-SD003) | concept | 6-8 | 5 |
| Ghost in the Assembly Line | Automation Basics (T32) | shell | 9-10 | 5 |
| The Saboteur's Fingerprints | Debugging & Testing (T13) | js | 9-10 | 3 |
| The Golem Foundry | Object Oriented Programming (T-SD009) | js | 9-10 | 3 |
| One Tick at a Time | Intro to Game Programming (T-SD045) | js | 9-10 | 3 |
| Blueprints for JUKEBOX-9 | Software Design (T12) | concept | 9-10 | 5 |
| The Counting Depths | Intro Computer Science (T-SD012) | concept | 9-10 | 5 |

### mech-bay (39 quests)

| Quest | Skill node | Module | Grade | Steps |
|---|---|---|---|---|
| No Hands on the Wheel 🏅 | Auto Behavior (T-RB059) | robot | 11-12 | 3 |
| The Lifting Gallery | Mechanics Basics (T-RB001) | concept | 3-5 | 4 |
| Blueprint Shuffle | Design Basics (T-RB004) | concept | 3-5 | 4 |
| First Words of MITE-1 | Coding Basics (T-RB003) | robot | 6-8 | 3 |
| The Hand-Me-Down Mule | Starter Code (T-RB043) | robot | 6-8 | 2 |
| Dial It In | Parameter Tuning (T-RB045) | robot | 6-8 | 2 |
| The Overheating Coil | If/Else & Loops (T-RB046) | robot | 6-8 | 2 |
| Gremlins in the Code | Debug Syntax (T-RB047) | robot | 6-8 | 2 |
| The Bay Beacon | Blink LED (T-RB048) | robot | 6-8 | 2 |
| Wired Straight Through | Input → Output (T-RB049) | robot | 6-8 | 2 |
| The Bent Corridor | Robotics Basics (T25) | robot | 6-8 | 2 |
| Three Bands of Pressure | Sensor Logic (T-RB029) | robot | 6-8 | 2 |
| The Sticky Lamp Switch | Sensor Toggle (T-RB031) | robot | 6-8 | 2 |
| Forge Your Own Tools | Functions (T-RB050) | robot | 6-8 | 2 |
| Read the Black Box | Serial Monitor (T-RB051) | robot | 6-8 | 2 |
| The MECHLIB Toolbox | Libraries (T-RB052) | robot | 6-8 | 2 |
| The Dispatch Desk | Menu/UI (T-RB053) | robot | 6-8 | 2 |
| Two Clocks, One Loop | Timers/Millis (T-RB054) | robot | 6-8 | 2 |
| Anatomy of a Giant | Introduction to Hardware (T-SD011) | concept | 6-8 | 4 |
| The Broken Loop | Circuits Basics (T-RB002) | concept | 6-8 | 4 |
| The Complaint Console | Innovation Basics (T-RB005) | concept | 6-8 | 4 |
| The Stubborn Ramp 🏅 | Gears & Torque (T-RB010) | concept | 6-8 | 5 |
| The Long Roll | Axle Compare (T-RB011) | concept | 6-8 | 5 |
| Parts Bin Triage | Components ID (T-RB022) | concept | 6-8 | 5 |
| The Current Whisperer | Electricity Flow (T-RB023) | concept | 6-8 | 4 |
| Eyes and Ears | Inputs ID (T-RB044) | concept | 6-8 | 4 |
| Anatomy of a Cart | Part Explain (T-RB062) | concept | 6-8 | 4 |
| The Tipping Point | Design Weakness (T-RB063) | concept | 6-8 | 4 |
| Spec Check | Goals Fit (T-RB070) | concept | 6-8 | 4 |
| The Bumper Bake-Off | Material Eval (T-RB074) | concept | 6-8 | 4 |
| Fifty Credits 🏅 | Budget Limits (T-RB081) | concept | 6-8 | 5 |
| Reactor Watchdog | Interrupts/States (T-RB055) | robot | 9-10 | 2 |
| Running Lights | Concurrent Code (T-RB056) | robot | 9-10 | 2 |
| The Forty-Eight Line Shame | Optimize Code (T-RB057) | robot | 9-10 | 2 |
| Eyes Open, Motors Hot | Sensors & Actuators (T26) | robot | 9-10 | 3 |
| The Quartermaster's Bench 🏅 | Materials Choice (T-RB017) | concept | 9-10 | 4 |
| Running on Empty 🏅 | Power Budget (T-RB033) | concept | 9-10 | 4 |
| The Reversed Pack | Regulators & Polarity (T-RB035) | concept | 9-10 | 4 |
| Split the Load 🏅 | Multi-Load Power (T-RB038) | concept | 9-10 | 5 |

### signal-tower (10 quests)

| Quest | Skill node | Module | Grade | Steps |
|---|---|---|---|---|
| The Nightwatch Protocol 🏅 | Systems and Application Automation (T-SD031) | shell | 11-12 | 5 |
| Requests in the Storm | Back-End Development (T-SD040) | js | 11-12 | 3 |
| The Flood of Requests | Building Scalable Applications (T-SD035) | concept | 11-12 | 4 |
| The Sky Foundry | Cloud Computing and DevOps (T-SD043) | concept | 11-12 | 5 |
| The Broken Treaty | Service Oriented Architecture (T-SD046) | concept | 11-12 | 4 |
| The Courier's Code | Digital Communication (T8) | concept | 3-5 | 4 |
| The Lost Packet Road | How the Internet Works (T-303) | concept | 6-8 | 5 |
| The Relay Assembly Line | Systems Integration (T15) | shell | 9-10 | 4 |
| The Button That Remembered | Event Driven Programming (T-SD021) | js | 9-10 | 3 |
| The Whisper Gate | Digital Citizenship (T4) | concept | K-2 | 4 |

### the-archives (5 quests)

| Quest | Skill node | Module | Grade | Steps |
|---|---|---|---|---|
| The Scattered Shelves | File Management (T5) | shell | 3-5 | 5 |
| The Truth Sifter | Internet Research (T7) | concept | 3-5 | 3 |
| The Scriptorium Sift | Text Manipulation (T-SD006) | shell | 6-8 | 5 |
| The Cipher Room 🏅 | Regular Expressions (T-302) | shell | 9-10 | 5 |
| The Vault of Versions 🏅 | Versioning & Iteration (T14) | shell | 9-10 | 5 |

### web-harbor (12 quests)

| Quest | Skill node | Module | Grade | Steps |
|---|---|---|---|---|
| The Harbormaster Console 🏅 | Front-End Development (T-SD039) | web | 11-12 | 5 |
| Charting the Harbor | Web Development Pathways (T-SD042) | concept | 11-12 | 5 |
| The Well-Formed Scroll | Markup Languages (T-SD008) | web | 6-8 | 3 |
| Signal Over the Water | Web Foundations (T22) | web | 6-8 | 3 |
| The Selector's Apprentice | JavaScript/jQuery (T-SD020) | js | 9-10 | 3 |
| The Shop at Pier Nine | Building Interactive Websites (T-SD026) | js | 9-10 | 4 |
| Panels of the Chart Room | Web to Desktop Design (T-SD018) | web | 9-10 | 4 |
| Ink and Rigging | HTML CSS (T-SD019) | web | 9-10 | 4 |
| The Cascade, Literally | HTML CSS Concepts (T-SD022) | web | 9-10 | 4 |
| Bones of the Dock Office | Basic HTML Design (T-SD023) | web | 9-10 | 4 |
| Before the First Paint | HTML to Web Fundamentals (T-SD024) | web | 9-10 | 3 |
| One Page, Every Deck | Building Responsive Websites (T-SD025) | web | 9-10 | 5 |
