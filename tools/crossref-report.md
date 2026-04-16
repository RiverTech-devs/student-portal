# Cross-reference: master_tree.csv vs seed_2_nodes.sql / seed_3_edges.sql

**Truth:** the migration. Anything in the CSV that disagrees is flagged.

- CSV rows:               300
- CSV unique IDs:         240
- CSV duplicate IDs:      60
- Migration nodes:        658
- Migration edges:        1097
- Nodes with csv_id set:  33
- Unique csv_id values:   33

## 1. Duplicate IDs in CSV

Each listed ID appears on more than one CSV line. The user added a
simplified pass at the end of the file that re-uses the first-pass IDs.

| ID | Lines | Names (per row) |
|---|---|---|
| B1 | 2 | L2: "Bible Structure" • L297: "Bible Structure" |
| B2 | 2 | L3: "Key Bible Stories" • L298: "Biblical Understanding" |
| B3 | 2 | L4: "Memory Verses" • L299: "Theology" |
| B4 | 2 | L5: "Basic Biblical Themes" • L300: "Apologetics" |
| B5 | 2 | L6: "Understanding Context" • L301: "Christian Living" |
| C1 | 2 | L22: "Creative Exploration" • L281: "Creative Basics" |
| C2 | 2 | L23: "Basic Art Skills" • L282: "Art Fundamentals" |
| C3 | 2 | L24: "Music & Rhythm Basics" • L283: "Performance" |
| C4 | 2 | L25: "Creative Techniques" • L284: "Production" |
| C5 | 2 | L26: "Visual Design Principles" • L285: "Advanced Creative Work" |
| E1 | 2 | L44: "Phonemic Awareness" • L255: "Phonics" |
| E2 | 2 | L45: "Phonics" • L256: "Reading Fluency" |
| E3 | 2 | L46: "Sight Words" • L257: "Reading Comprehension" |
| E4 | 2 | L47: "Reading Fluency" • L258: "Paragraph Writing" |
| E5 | 2 | L48: "Basic Comprehension" • L259: "Essay Writing" |
| E6 | 2 | L49: "Vocabulary Development" • L260: "Rhetoric" |
| E7 | 2 | L50: "Sentence Structure" • L261: "Advanced Communication" |
| LS1 | 2 | L71: "Self-Awareness" • L292: "Self-Management" |
| LS2 | 2 | L72: "Personal Responsibility" • L293: "Personal Finance" |
| LS3 | 2 | L73: "Time Management" • L294: "Interpersonal Skills" |
| LS4 | 2 | L74: "Goal Setting" • L295: "Career Skills" |
| LS5 | 2 | L75: "Decision Making" • L296: "Independent Living" |
| M1 | 2 | L95: "Counting" • L242: "Counting" |
| M2 | 2 | L96: "Number Recognition" • L243: "Addition" |
| M3 | 2 | L97: "Place Value (Intro)" • L244: "Subtraction" |
| M4 | 2 | L98: "Addition (Single Digit)" • L245: "Multiplication" |
| M5 | 2 | L99: "Subtraction (Single Digit)" • L246: "Division" |
| M6 | 2 | L100: "Addition (Multi-Digit)" • L247: "Fractions" |
| M7 | 2 | L101: "Subtraction (Multi-Digit)" • L248: "Decimals" |
| M8 | 2 | L102: "Multiplication Concepts" • L249: "Pre-Algebra" |
| M9 | 2 | L103: "Multiplication Fluency" • L250: "Algebra" |
| M10 | 2 | L104: "Division Concepts" • L251: "Advanced Math" |
| M11 | 2 | L105: "Division Fluency" • L252: "Geometry Basics" |
| M12 | 2 | L106: "Fractions (Concepts)" • L253: "Geometry Advanced" |
| M13 | 2 | L107: "Fraction Operations" • L254: "Statistics" |
| P1 | 2 | L135: "Basic Movement" • L286: "Movement Basics" |
| P2 | 2 | L136: "Body Awareness" • L287: "Coordination" |
| P3 | 2 | L137: "Coordination" • L288: "Fitness Development" |
| P4 | 2 | L138: "Motor Skills" • L289: "Sport Skills" |
| P5 | 2 | L139: "Agility & Balance" • L290: "Advanced Training" |
| P6 | 2 | L140: "Endurance Basics" • L291: "Physical Mastery" |
| SC1 | 2 | L156: "Observation Skills" • L262: "Observation" |
| SC2 | 2 | L157: "Questioning & Curiosity" • L263: "Experimentation" |
| SC3 | 2 | L158: "Basic Experimentation" • L264: "Scientific Method" |
| SC4 | 2 | L159: "Measurement & Tools" • L265: "Biology Basics" |
| SC5 | 2 | L160: "Data Recording" • L266: "Physical Science" |
| SC6 | 2 | L161: "Scientific Method" • L267: "Chemistry" |
| SC7 | 2 | L162: "Variables & Controls" • L268: "Physics" |
| SC8 | 2 | L163: "Data Analysis (Basic)" • L269: "Advanced Science" |
| SS1 | 2 | L185: "Community Awareness" • L270: "Community Awareness" |
| SS2 | 2 | L186: "Local Geography" • L271: "Local History" |
| SS3 | 2 | L187: "Local History" • L272: "World History" |
| SS4 | 2 | L188: "National Symbols & Identity" • L273: "Civics" |
| SS5 | 2 | L189: "Early Civilizations" • L274: "Economics" |
| SS6 | 2 | L190: "World Geography" • L275: "Global Systems" |
| T1 | 2 | L209: "Device Basics" • L276: "Digital Literacy" |
| T2 | 2 | L210: "Digital Navigation" • L277: "Programming Basics" |
| T3 | 2 | L211: "Keyboarding & Input" • L278: "Game Development" |
| T4 | 2 | L212: "Digital Citizenship" • L279: "Software Development" |
| T5 | 2 | L213: "File Management" • L280: "Advanced Systems" |

## 2. CSV rows with no matching migration node (csv_id not found)

These IDs exist in the CSV but no `curriculum_nodes.csv_id` points to them.
Either the CSV row is stale or the migration is missing that skill.

| CSV ID | CSV Name | Domain | Stage | Line(s) |
|---|---|---|---|---|
| B1 | Bible Structure | Bible | Foundations | 2, 297 |
| B10 | Theological Reasoning | Bible | Integration | 11 |
| B11 | Worldview Analysis | Bible | Integration | 12 |
| B12 | Apologetics (Foundations) | Bible | Integration | 13 |
| B13 | Advanced Apologetics | Bible | Integration | 14 |
| B14 | Spiritual Disciplines | Bible | Integration | 15 |
| B15 | Discipleship | Bible | Mastery | 16 |
| B16 | Faith in Action | Bible | Mastery | 17 |
| B17 | Church History | Bible | Application | 18 |
| B18 | Modern Theology | Bible | Integration | 19 |
| B19 | Biblical Languages (Intro) | Bible | Integration | 20 |
| B2 | Key Bible Stories | Bible | Foundations | 3, 298 |
| B20 | Ethics & Moral Reasoning | Bible | Integration | 21 |
| B3 | Memory Verses | Bible | Foundations | 4, 299 |
| B4 | Basic Biblical Themes | Bible | Fluency | 5, 300 |
| B5 | Understanding Context | Bible | Fluency | 6, 301 |
| B6 | Reading Scripture Independently | Bible | Fluency | 7 |
| B7 | Doctrinal Basics | Bible | Application | 8 |
| B8 | Biblical Interpretation | Bible | Application | 9 |
| B9 | Applying Scripture | Bible | Application | 10 |
| C1 | Creative Exploration | Creative | Foundations | 22, 281 |
| C10 | Creative Collaboration | Creative | Integration | 31 |
| C11 | Production & Design | Creative | Integration | 32 |
| C12 | Creative Iteration | Creative | Integration | 33 |
| C14 | Specialization | Creative | Mastery | 35 |
| C15 | Creative Mastery | Creative | Mastery | 36 |
| C16 | Visual Arts | Creative | Application | 37 |
| C18 | Theater & Acting | Creative | Application | 39 |
| C19 | Digital Art & Design | Creative | Integration | 40 |
| C2 | Basic Art Skills | Creative | Foundations | 23, 282 |
| C20 | Film & Media Production | Creative | Integration | 41 |
| C21 | Creative Writing | Creative | Application | 42 |
| C22 | Advanced Creative Projects | Creative | Mastery | 43 |
| C3 | Music & Rhythm Basics | Creative | Foundations | 24, 283 |
| C4 | Creative Techniques | Creative | Fluency | 25, 284 |
| C5 | Visual Design Principles | Creative | Fluency | 26, 285 |
| C6 | Performance Basics | Creative | Fluency | 27 |
| C7 | Artistic Expression | Creative | Application | 28 |
| C9 | Stage Performance | Creative | Application | 30 |
| E1 | Phonemic Awareness | Language | Foundations | 44, 255 |
| E10 | Multi-Paragraph Writing | Language | Application | 53 |
| E11 | Grammar & Mechanics | Language | Application | 54 |
| E12 | Essay Writing | Language | Application | 55 |
| E13 | Textual Evidence | Language | Application | 56 |
| E14 | Research Basics | Language | Application | 57 |
| E15 | Rhetoric (Persuasion) | Language | Integration | 58 |
| E16 | Public Speaking | Language | Integration | 59 |
| E17 | Advanced Writing Styles | Language | Integration | 60 |
| E18 | Research Writing | Language | Integration | 61 |
| E19 | Argumentation & Debate | Language | Integration | 62 |
| E20 | Advanced Communication | Language | Mastery | 63 |
| E21 | Literature (Intro) | Language | Fluency | 64 |
| E22 | Literary Analysis | Language | Application | 65 |
| E23 | Advanced Literature | Language | Integration | 66 |
| E24 | Creative Writing | Language | Application | 67 |
| E25 | Advanced Creative Writing | Language | Integration | 68 |
| E26 | Media Literacy | Language | Application | 69 |
| E27 | Digital Communication | Language | Integration | 70 |
| E5 | Basic Comprehension | Language | Fluency | 48, 259 |
| E7 | Sentence Structure | Language | Fluency | 50, 261 |
| E8 | Paragraph Writing | Language | Fluency | 51 |
| E9 | Reading Analysis | Language | Application | 52 |
| LS1 | Self-Awareness | LifeSkills | Foundations | 71, 292 |
| LS10 | Work Habits | LifeSkills | Application | 80 |
| LS11 | Collaboration | LifeSkills | Application | 81 |
| LS12 | Conflict Resolution | LifeSkills | Application | 82 |
| LS13 | Professional Communication | LifeSkills | Integration | 83 |
| LS14 | Career Exploration | LifeSkills | Integration | 84 |
| LS15 | Job Readiness | LifeSkills | Integration | 85 |
| LS16 | Independent Living Basics | LifeSkills | Integration | 86 |
| LS17 | Health & Wellness | LifeSkills | Integration | 87 |
| LS18 | Long-Term Planning | LifeSkills | Mastery | 88 |
| LS19 | Financial Independence | LifeSkills | Mastery | 89 |
| LS2 | Personal Responsibility | LifeSkills | Foundations | 72, 293 |
| LS20 | Adult Responsibility | LifeSkills | Mastery | 90 |
| LS21 | Entrepreneurship | LifeSkills | Integration | 91 |
| LS22 | Home Management | LifeSkills | Application | 92 |
| LS23 | Digital Productivity | LifeSkills | Application | 93 |
| LS24 | Ethics & Integrity | LifeSkills | Integration | 94 |
| LS3 | Time Management | LifeSkills | Foundations | 73, 294 |
| LS4 | Goal Setting | LifeSkills | Fluency | 74, 295 |
| LS5 | Decision Making | LifeSkills | Fluency | 75, 296 |
| LS6 | Problem Solving | LifeSkills | Fluency | 76 |
| LS7 | Basic Money Concepts | LifeSkills | Fluency | 77 |
| LS8 | Budgeting | LifeSkills | Application | 78 |
| LS9 | Banking & Transactions | LifeSkills | Application | 79 |
| M1 | Counting | Math | Foundations | 95, 242 |
| M10 | Division Concepts | Math | Fluency | 104, 251 |
| M12 | Fractions (Concepts) | Math | Fluency | 106, 253 |
| M15 | Decimal Operations | Math | Fluency | 109 |
| M16 | Ratios | Math | Application | 110 |
| M20 | Equations (1-Step) | Math | Application | 114 |
| M23 | Functions (Intro) | Math | Integration | 117 |
| M24 | Linear Functions | Math | Integration | 118 |
| M25 | Systems of Equations | Math | Integration | 119 |
| M28 | Quadratics | Math | Integration | 122 |
| M31 | Pre-Calculus | Math | Mastery | 125 |
| M32 | Calculus (Intro) | Math | Mastery | 126 |
| M33 | Geometry Basics | Math | Fluency | 127 |
| M36 | Statistics Basics | Math | Application | 130 |
| M39 | Financial Math | Math | Application | 133 |
| M4 | Addition (Single Digit) | Math | Foundations | 98, 245 |
| M40 | Investments & Growth | Math | Mastery | 134 |
| M6 | Addition (Multi-Digit) | Math | Fluency | 100, 247 |
| M8 | Multiplication Concepts | Math | Fluency | 102, 249 |
| P1 | Basic Movement | Physical | Foundations | 135, 286 |
| P10 | Game Strategy | Physical | Integration | 144 |
| P11 | Team Play | Physical | Integration | 145 |
| P12 | Performance Training | Physical | Integration | 146 |
| P13 | Advanced Conditioning | Physical | Integration | 147 |
| P14 | Personal Fitness Planning | Physical | Mastery | 148 |
| P15 | Physical Mastery | Physical | Mastery | 149 |
| P16 | Individual Sports | Physical | Application | 150 |
| P17 | Team Sports | Physical | Application | 151 |
| P18 | Health & Nutrition | Physical | Application | 152 |
| P19 | Injury Prevention | Physical | Integration | 153 |
| P2 | Body Awareness | Physical | Foundations | 136, 287 |
| P20 | Outdoor Skills | Physical | Application | 154 |
| P21 | Competitive Performance | Physical | Mastery | 155 |
| P3 | Coordination | Physical | Foundations | 137, 288 |
| P4 | Motor Skills | Physical | Fluency | 138, 289 |
| P5 | Agility & Balance | Physical | Fluency | 139, 290 |
| P6 | Endurance Basics | Physical | Fluency | 140, 291 |
| P7 | Strength Development | Physical | Application | 141 |
| P8 | Fitness Routines | Physical | Application | 142 |
| P9 | Sport Fundamentals | Physical | Application | 143 |
| SC10 | Systems Thinking | Science | Application | 165 |
| SC11 | Scientific Communication | Science | Application | 166 |
| SC12 | Lab Design | Science | Integration | 167 |
| SC13 | Data Analysis (Advanced) | Science | Integration | 168 |
| SC14 | Mathematical Modeling | Science | Integration | 169 |
| SC15 | Theory & Explanation | Science | Integration | 170 |
| SC16 | Independent Investigation | Science | Mastery | 171 |
| SC17 | Scientific Mastery Project | Science | Mastery | 172 |
| SC18 | Biology (Intro) | Science | Fluency | 173 |
| SC19 | Biology Systems | Science | Application | 174 |
| SC2 | Questioning & Curiosity | Science | Foundations | 157, 263 |
| SC20 | Advanced Biology | Science | Integration | 175 |
| SC21 | Chemistry (Intro) | Science | Application | 176 |
| SC22 | Chemistry Reactions | Science | Integration | 177 |
| SC23 | Advanced Chemistry | Science | Mastery | 178 |
| SC24 | Physics (Intro) | Science | Application | 179 |
| SC25 | Physics Systems | Science | Integration | 180 |
| SC26 | Advanced Physics | Science | Mastery | 181 |
| SC27 | Earth Science | Science | Fluency | 182 |
| SC28 | Climate & Environment | Science | Application | 183 |
| SC29 | Space Science | Science | Integration | 184 |
| SC3 | Basic Experimentation | Science | Foundations | 158, 264 |
| SC4 | Measurement & Tools | Science | Fluency | 159, 265 |
| SC5 | Data Recording | Science | Fluency | 160, 266 |
| SC7 | Variables & Controls | Science | Fluency | 162, 268 |
| SC8 | Data Analysis (Basic) | Science | Application | 163, 269 |
| SC9 | Scientific Models | Science | Application | 164 |
| SS1 | Community Awareness | Social | Foundations | 185, 270 |
| SS10 | Government Basics | Social | Application | 194 |
| SS11 | Citizenship & Responsibility | Social | Application | 195 |
| SS12 | Economics Basics | Social | Integration | 196 |
| SS13 | Global Interactions | Social | Integration | 197 |
| SS14 | Historical Analysis | Social | Integration | 198 |
| SS15 | Political Systems | Social | Integration | 199 |
| SS16 | Modern Issues & Society | Social | Integration | 200 |
| SS17 | Civic Engagement | Social | Mastery | 201 |
| SS18 | Leadership & Influence | Social | Mastery | 202 |
| SS19 | US History | Social | Application | 203 |
| SS2 | Local Geography | Social | Foundations | 186, 271 |
| SS20 | Comparative History | Social | Integration | 204 |
| SS21 | Geopolitics | Social | Integration | 205 |
| SS22 | Advanced Economics | Social | Mastery | 206 |
| SS23 | Law & Justice | Social | Integration | 207 |
| SS24 | Cultural Studies | Social | Application | 208 |
| SS3 | Local History | Social | Foundations | 187, 272 |
| SS4 | National Symbols & Identity | Social | Fluency | 188, 273 |
| SS5 | Early Civilizations | Social | Fluency | 189, 274 |
| SS6 | World Geography | Social | Fluency | 190, 275 |
| SS7 | World History Overview | Social | Application | 191 |
| SS8 | Cause & Effect in History | Social | Application | 192 |
| SS9 | Primary & Secondary Sources | Social | Application | 193 |
| T1 | Device Basics | Technology | Foundations | 209, 276 |
| T10 | Programming Logic | Technology | Application | 218 |
| T11 | Programming Projects | Technology | Application | 219 |
| T12 | Software Design | Technology | Integration | 220 |
| T13 | Debugging & Testing | Technology | Integration | 221 |
| T14 | Versioning & Iteration | Technology | Integration | 222 |
| T15 | Systems Integration | Technology | Integration | 223 |
| T16 | Engineering Design Process | Technology | Integration | 224 |
| T17 | Independent Build Project | Technology | Mastery | 225 |
| T18 | Advanced Systems Project | Technology | Mastery | 226 |
| T19 | Visual Programming | Technology | Application | 227 |
| T2 | Digital Navigation | Technology | Foundations | 210, 277 |
| T20 | Game Logic | Technology | Application | 228 |
| T22 | Web Foundations | Technology | Application | 230 |
| T24 | Advanced Web Systems | Technology | Mastery | 232 |
| T25 | Robotics Basics | Technology | Application | 233 |
| T26 | Sensors & Actuators | Technology | Integration | 234 |
| T27 | Robotics Engineering | Technology | Mastery | 235 |
| T28 | Digital Media Creation | Technology | Fluency | 236 |
| T29 | Media Production | Technology | Application | 237 |
| T3 | Keyboarding & Input | Technology | Foundations | 211, 278 |
| T31 | Data & Spreadsheets | Technology | Application | 239 |
| T32 | Automation Basics | Technology | Integration | 240 |
| T33 | Advanced Automation | Technology | Mastery | 241 |
| T4 | Digital Citizenship | Technology | Foundations | 212, 279 |
| T5 | File Management | Technology | Fluency | 213, 280 |
| T6 | Productivity Tools | Technology | Fluency | 214 |
| T7 | Internet Research | Technology | Fluency | 215 |
| T8 | Digital Communication | Technology | Fluency | 216 |
| T9 | Algorithmic Thinking | Technology | Application | 217 |

## 3. Migration nodes with csv_id that is missing from CSV

These migration nodes claim a csv_id but no CSV row has that ID.

_(none — every csv_id in the migration resolves to a CSV row)_

## 4. Field mismatches (CSV row vs migration node linked by csv_id)

Comparing CSV **Name / Domain / Stage / PathType** against migration
**title / domain / stage / path_type**. CSV duplicates are compared
against the same migration node — both CSV versions can mismatch.

| CSV ID | CSV Line | CSV Name | Migration id | Disagreements |
|---|---|---|---|---|
| C17 | 38 | Music Performance | CR-011 | Name: "Music Performance" ≠ migration title "Form" |
| E2 | 256 | Reading Fluency | L-002 | Name: "Reading Fluency" ≠ migration title "Phonics" |
| E3 | 257 | Reading Comprehension | L-003 | Name: "Reading Comprehension" ≠ migration title "Sight Words"<br>Stage: "Fluency" ≠ "Foundations" |
| E4 | 47 | Reading Fluency | L-005 | Name: "Reading Fluency" ≠ migration title "Fluency" |
| E4 | 258 | Paragraph Writing | L-005 | Name: "Paragraph Writing" ≠ migration title "Fluency"<br>Stage: "Fluency" ≠ "Foundations" |
| E6 | 49 | Vocabulary Development | L-006 | Name: "Vocabulary Development" ≠ migration title "Vocabulary" |
| E6 | 260 | Rhetoric | L-006 | Name: "Rhetoric" ≠ migration title "Vocabulary"<br>Stage: "Integration" ≠ "Fluency" |
| M11 | 105 | Division Fluency | M-027 | Name: "Division Fluency" ≠ migration title "Division" |
| M11 | 252 | Geometry Basics | M-027 | Name: "Geometry Basics" ≠ migration title "Division"<br>PathType: "Branch" ≠ "Spine" |
| M13 | 254 | Statistics | M-033 | Name: "Statistics" ≠ migration title "Fraction Operations"<br>Stage: "Application" ≠ "Fluency"<br>PathType: "Branch" ≠ "Spine" |
| M14 | 108 | Decimals (Concepts) | M-053 | Name: "Decimals (Concepts)" ≠ migration title "Decimals" |
| M19 | 113 | Expressions | M-066 | Name: "Expressions" ≠ migration title "Expressions with Variables" |
| M2 | 96 | Number Recognition | M-001 | Name: "Number Recognition" ≠ migration title "Counting and Number Recognition" |
| M2 | 243 | Addition | M-001 | Name: "Addition" ≠ migration title "Counting and Number Recognition" |
| M21 | 115 | Equations (Multi-Step) | M-067 | Name: "Equations (Multi-Step)" ≠ migration title "One-Step Equations" |
| M29 | 123 | Functions (Advanced) | M-145 | Name: "Functions (Advanced)" ≠ migration title "Advanced Functions" |
| M3 | 97 | Place Value (Intro) | M-007 | Name: "Place Value (Intro)" ≠ migration title "Place Value Understanding" |
| M3 | 244 | Subtraction | M-007 | Name: "Subtraction" ≠ migration title "Place Value Understanding" |
| M30 | 124 | Trigonometry Basics | M-149 | Name: "Trigonometry Basics" ≠ migration title "Trigonometry" |
| M34 | 128 | Area & Volume | M-043 | Name: "Area & Volume" ≠ migration title "Area" |
| M35 | 129 | Geometry Proofs | M-101 | Name: "Geometry Proofs" ≠ migration title "Proofs" |
| M37 | 131 | Probability | M-063 | Name: "Probability" ≠ migration title "Simple Probability" |
| M5 | 99 | Subtraction (Single Digit) | M-023 | Name: "Subtraction (Single Digit)" ≠ migration title "Multi-Digit Subtraction" |
| M5 | 246 | Division | M-023 | Name: "Division" ≠ migration title "Multi-Digit Subtraction"<br>Stage: "Fluency" ≠ "Foundations" |
| M7 | 101 | Subtraction (Multi-Digit) | M-022 | Name: "Subtraction (Multi-Digit)" ≠ migration title "Multi-Digit Addition" |
| M7 | 248 | Decimals | M-022 | Name: "Decimals" ≠ migration title "Multi-Digit Addition" |
| M9 | 103 | Multiplication Fluency | M-025 | Name: "Multiplication Fluency" ≠ migration title "Multiplication" |
| M9 | 250 | Algebra | M-025 | Name: "Algebra" ≠ migration title "Multiplication"<br>Stage: "Integration" ≠ "Fluency" |
| SC1 | 262 | Observation | SC-EX002 | Name: "Observation" ≠ migration title "Observation Skills" |
| SC6 | 267 | Chemistry | SC-EX001 | Name: "Chemistry" ≠ migration title "Scientific Method"<br>Stage: "Integration" ≠ "Fluency" |
| T21 | 229 | Game Development | T-SD048 | Name: "Game Development" ≠ migration title "Game Engine Development" |
| T23 | 231 | Web Development | T-SD042 | Name: "Web Development" ≠ migration title "Web Development Pathways" |
| T30 | 238 | Advanced Media Systems | T-SD030 | Name: "Advanced Media Systems" ≠ migration title "Advanced Systems Programming" |

## 5. Prerequisite edges in CSV with no matching migration edge

The CSV `Prerequisites` column lists IDs that should lead TO the current
row. We check whether the migration has an edge `prereq_csv_id -> row_csv_id`
(of any `prerequisite_*` type). If absent, the edge is stale in CSV or
missing in migration.

| CSV Row | Line | Claimed Prereq | Reason |
|---|---|---|---|
| C8 | 29 | C7 | prereq ID has no migration node |
| C13 | 34 | C12 | prereq ID has no migration node |
| C17 | 38 | C6 | prereq ID has no migration node |
| E2 | 45 | E1 | prereq ID has no migration node |
| E4 | 47 | E3 | no prereq edge in migration |
| E6 | 49 | E5 | prereq ID has no migration node |
| M2 | 96 | M1 | prereq ID has no migration node |
| M3 | 97 | M2 | no prereq edge in migration |
| M5 | 99 | M4 | prereq ID has no migration node |
| M7 | 101 | M6 | prereq ID has no migration node |
| M9 | 103 | M8 | prereq ID has no migration node |
| M11 | 105 | M10 | prereq ID has no migration node |
| M13 | 107 | M12 | prereq ID has no migration node |
| M17 | 111 | M16 | prereq ID has no migration node |
| M19 | 113 | M18 | no prereq edge in migration |
| M21 | 115 | M20 | prereq ID has no migration node |
| M26 | 120 | M25 | prereq ID has no migration node |
| M29 | 123 | M28 | prereq ID has no migration node |
| M34 | 128 | M33 | prereq ID has no migration node |
| M37 | 131 | M36 | prereq ID has no migration node |
| SC6 | 161 | SC5 | prereq ID has no migration node |
| T21 | 229 | T20 | prereq ID has no migration node |
| T23 | 231 | T22 | prereq ID has no migration node |
| T30 | 238 | T29 | prereq ID has no migration node |
| M2 | 243 | M1 | prereq ID has no migration node |
| M3 | 244 | M2 | no prereq edge in migration |
| M5 | 246 | M4 | prereq ID has no migration node |
| M7 | 248 | M6 | prereq ID has no migration node |
| M9 | 250 | M8 | prereq ID has no migration node |
| M11 | 252 | M4 | prereq ID has no migration node |
| M13 | 254 | M7 | no prereq edge in migration |
| E2 | 256 | E1 | prereq ID has no migration node |
| E4 | 258 | E3 | no prereq edge in migration |
| E6 | 260 | E5 | prereq ID has no migration node |
| SC6 | 267 | SC5 | prereq ID has no migration node |

## 6. LeadsTo edges in CSV with no matching migration edge

CSV `LeadsTo` is the forward edge (row → dest). The migration should have
`row_csv_id -> leads_csv_id` as a `prerequisite_*` or `leads_to` edge.

| CSV Row | Line | LeadsTo | Reason |
|---|---|---|---|
| C8 | 29 | C9 | LeadsTo ID has no migration node |
| C13 | 34 | C14 | LeadsTo ID has no migration node |
| C17 | 38 | C11 | LeadsTo ID has no migration node |
| E3 | 46 | E4 | no forward edge in migration |
| E4 | 47 | E5 | LeadsTo ID has no migration node |
| E6 | 49 | E7 | LeadsTo ID has no migration node |
| M2 | 96 | M3 | no forward edge in migration |
| M3 | 97 | M4 | LeadsTo ID has no migration node |
| M5 | 99 | M6 | LeadsTo ID has no migration node |
| M7 | 101 | M8 | LeadsTo ID has no migration node |
| M9 | 103 | M10 | LeadsTo ID has no migration node |
| M11 | 105 | M12 | LeadsTo ID has no migration node |
| M14 | 108 | M15 | LeadsTo ID has no migration node |
| M18 | 112 | M19 | no forward edge in migration |
| M19 | 113 | M20 | LeadsTo ID has no migration node |
| M22 | 116 | M23 | LeadsTo ID has no migration node |
| M27 | 121 | M28 | LeadsTo ID has no migration node |
| M30 | 124 | M31 | LeadsTo ID has no migration node |
| SC1 | 156 | SC2 | LeadsTo ID has no migration node |
| SC6 | 161 | SC7 | LeadsTo ID has no migration node |
| T21 | 229 | T18 | LeadsTo ID has no migration node |
| T23 | 231 | T24 | LeadsTo ID has no migration node |
| T30 | 238 | T18 | LeadsTo ID has no migration node |
| M2 | 243 | M3 | no forward edge in migration |
| M3 | 244 | M4 | LeadsTo ID has no migration node |
| M5 | 246 | M6 | LeadsTo ID has no migration node |
| M7 | 248 | M8 | LeadsTo ID has no migration node |
| M9 | 250 | M10 | LeadsTo ID has no migration node |
| M11 | 252 | M12 | LeadsTo ID has no migration node |
| M13 | 254 | M10 | LeadsTo ID has no migration node |
| E3 | 257 | E4 | no forward edge in migration |
| E4 | 258 | E5 | LeadsTo ID has no migration node |
| E6 | 260 | E7 | LeadsTo ID has no migration node |
| SC1 | 262 | SC2 | LeadsTo ID has no migration node |
| SC6 | 267 | SC7 | LeadsTo ID has no migration node |

## 7. CrossLinks in CSV with no matching migration edge

CSV `CrossLinks` (pipe-separated) should appear as cross-domain edges in
the migration (same csv_id pair, either direction).

| CSV Row | Line | CrossLink | Reason |
|---|---|---|---|
| C8 | 29 | E10 | CrossLink ID has no migration node |
| C13 | 34 | E17 | CrossLink ID has no migration node |
| C13 | 34 | LS15 | CrossLink ID has no migration node |
| C17 | 38 | M12 | CrossLink ID has no migration node |
| E6 | 49 | SC4 | CrossLink ID has no migration node |
| M13 | 107 | LS2 | CrossLink ID has no migration node |
| M14 | 108 | LS2 | CrossLink ID has no migration node |
| M17 | 111 | SC5 | CrossLink ID has no migration node |
| M17 | 111 | LS2 | CrossLink ID has no migration node |
| M18 | 112 | LS2 | CrossLink ID has no migration node |
| M19 | 113 | T2 | CrossLink ID has no migration node |
| M21 | 115 | T2 | CrossLink ID has no migration node |
| M22 | 116 | T2 | CrossLink ID has no migration node |
| M27 | 121 | T4 | CrossLink ID has no migration node |
| M29 | 123 | T4 | CrossLink ID has no migration node |
| M30 | 124 | SC7 | CrossLink ID has no migration node |
| M34 | 128 | SC5 | CrossLink ID has no migration node |
| M35 | 129 | C4 | CrossLink ID has no migration node |
| M38 | 132 | SS6 | CrossLink ID has no migration node |
| M38 | 132 | SC8 | CrossLink ID has no migration node |
| SC6 | 161 | M12 | CrossLink ID has no migration node |
| T21 | 229 | C4 | CrossLink ID has no migration node |
| T21 | 229 | M24 | CrossLink ID has no migration node |
| T23 | 231 | E27 | CrossLink ID has no migration node |
| T23 | 231 | M23 | CrossLink ID has no migration node |
| T30 | 238 | C5 | CrossLink ID has no migration node |
| T30 | 238 | E20 | CrossLink ID has no migration node |
| M7 | 248 | LS2 | CrossLink ID has no migration node |
| M9 | 250 | T3 | CrossLink ID has no migration node |
| M9 | 250 | SC7 | CrossLink ID has no migration node |
| M11 | 252 | C2 | CrossLink ID has no migration node |
| M13 | 254 | SC6 | no edge in either direction |
| M13 | 254 | SS5 | CrossLink ID has no migration node |
| E3 | 257 | SS3 | CrossLink ID has no migration node |
| E3 | 257 | B2 | CrossLink ID has no migration node |
| E6 | 260 | SS5 | CrossLink ID has no migration node |
| E6 | 260 | B4 | CrossLink ID has no migration node |
| SC6 | 267 | M13 | no edge in either direction |

## Summary

- Duplicate CSV IDs:               60
- CSV rows not in migration:       207
- Migration csv_id → missing CSV:  0
- Field mismatches:                33
- Missing prereq edges:            35
- Missing LeadsTo edges:           35
- Missing CrossLinks:              38

_Per CLAUDE.md protocol: the migration is truth. To reconcile, fix the CSV._