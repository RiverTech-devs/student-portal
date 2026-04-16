# 3D Skill Tree vs curriculum seed migrations

Source-of-truth: `supabase/migrations/seed_2_nodes.sql` + `seed_3_edges.sql`.
Comparison target: `Trees/3D Skill Tree/data.js`.

## Headline counts

| Domain (migration) | Migration nodes | 3D tree id | 3D skills | Δ |
|---|---:|---|---:|---:|
| Math | 206 | math | 54 | **+152** |
| Language | 42 | lang | 45 | -3 |
| Social | 24 | social | 48 | -24 |
| Bible | 20 | religion | 49 | -29 |
| LifeSkills | 24 | life | 59 | -35 |
| Creative | 90 | creative | 60 | **+30** |
| Technology | 184 | tech | 52 | **+132** |
| Physical | 21 | fitness | 55 | -34 |
| Science | 47 | — | 0 | **missing domain** |

## 1. Missing domain: Science

The migration has a full `Science` domain (47 nodes). The 3D tree has
no `science` domain at all. Every skill below is absent.

| Migration id | Title | Stage | Cluster | Path |
|---|---|---|---|---|
| SC-EX014 | Animal Biology | Foundations | Life Science | Spine |
| SC3 | Basic Experimentation | Foundations | Science: Foundations | Spine |
| SC-EX015 | Ecosystems | Foundations | Life Science | Spine |
| SC-EX016 | Human Body | Foundations | Life Science | Leaf |
| SC-EX002 | Observation Skills | Foundations | Scientific Thinking | Spine |
| SC2 | Questioning & Curiosity | Foundations | Science: Foundations | Spine |
| SC18 | Biology (Intro) | Fluency | Science: Fluency | Branch |
| SC5 | Data Recording | Fluency | Science: Fluency | Spine |
| SC27 | Earth Science | Fluency | Science: Fluency | Branch |
| SC4 | Measurement & Tools | Fluency | Science: Fluency | Spine |
| SC-EX013 | Plant Biology | Fluency | Life Science | Spine |
| SC-EX001 | Scientific Method | Fluency | Core Science | Spine |
| SC7 | Variables & Controls | Fluency | Science: Fluency | Spine |
| SC-EX005 | Basic Chemistry | Application | Physical Science | Spine |
| SC19 | Biology Systems | Application | Science: Application | Branch |
| SC21 | Chemistry (Intro) | Application | Science: Application | Branch |
| SC28 | Climate & Environment | Application | Science: Application | Branch |
| SC8 | Data Analysis (Basic) | Application | Science: Application | Spine |
| SC24 | Physics (Intro) | Application | Science: Application | Branch |
| SC11 | Scientific Communication | Application | Science: Application | Spine |
| SC9 | Scientific Models | Application | Science: Application | Spine |
| SC-EX006 | States of Matter | Application | Physical Science | Spine |
| SC10 | Systems Thinking | Application | Science: Application | Spine |
| SC20 | Advanced Biology | Integration | Science: Integration | Branch |
| SC-EX008 | Atoms and Molecules | Integration | Physical Science | Leaf |
| SC-EX007 | Chemical Reactions | Integration | Physical Science | Spine |
| SC22 | Chemistry Reactions | Integration | Science: Integration | Branch |
| SC13 | Data Analysis (Advanced) | Integration | Science: Integration | Spine |
| SC-EX004 | Data Collection | Integration | Scientific Thinking | Leaf |
| SC-EX010 | Energy Types | Integration | Physics | Spine |
| SC-EX009 | Forces and Motion | Integration | Physics | Spine |
| SC12 | Lab Design | Integration | Science: Integration | Spine |
| SC-EX012 | Magnetism | Integration | Physics | Leaf |
| SC14 | Mathematical Modeling | Integration | Science: Integration | Spine |
| SC25 | Physics Systems | Integration | Science: Integration | Branch |
| SC-EX011 | Simple Machines | Integration | Physics | Spine |
| SC29 | Space Science | Integration | Science: Integration | Branch |
| SC15 | Theory & Explanation | Integration | Science: Integration | Spine |
| SC23 | Advanced Chemistry | Mastery | Science: Mastery | Branch |
| SC26 | Advanced Physics | Mastery | Science: Mastery | Branch |
| SC-EX020 | Climate Change | Mastery | Earth Science | Leaf |
| SC-EX003 | Hypothesis Formation | Mastery | Scientific Thinking | Leaf |
| SC16 | Independent Investigation | Mastery | Science: Mastery | Spine |
| SC-EX018 | Rock Cycle | Mastery | Earth Science | Spine |
| SC17 | Scientific Mastery Project | Mastery | Science: Mastery | Leaf |
| SC-EX019 | Solar System | Mastery | Earth Science | Spine |
| SC-EX017 | Weather Patterns | Mastery | Earth Science | Spine |

## 2. Per-domain: skills in migration NOT present in the 3D tree

Fuzzy match on normalized title (lowercased, punctuation stripped, common
words like "the/of/and" ignored). Skills here are in the migration but
have no recognizable counterpart in the 3D tree for that domain.

### Math → math  (135 of 206 migration nodes unmatched)

| Stage | Migration id | Title | Cluster | Path |
|---|---|---|---|---|
| Foundations | M-019 | 3D Shapes | Basic Arithmetic | Spine |
| Foundations | M-026 | Arrays and Area Models | Intermediate Arithmetic | Leaf |
| Foundations | M-013 | Classifying Objects | Basic Arithmetic | Leaf |
| Foundations | M-011 | Comparing Lengths | Basic Arithmetic | Spine |
| Foundations | M-009 | Comparing Numbers | Basic Arithmetic | Spine |
| Foundations | M-021 | Composing Shapes | Basic Arithmetic | Leaf |
| Foundations | M-003 | Even and Odd | Basic Arithmetic | Leaf |
| Foundations | M-023 | Multi-Digit Subtraction | Intermediate Arithmetic | Spine |
| Foundations | M-008 | Number Bonds | Basic Arithmetic | Spine |
| Foundations | M-002 | Number Lines | Basic Arithmetic | Leaf |
| Foundations | M-010 | Ordering Numbers | Basic Arithmetic | Leaf |
| Foundations | M-020 | Partitioning Shapes | Basic Arithmetic | Spine |
| Foundations | M-016 | Patterns and Sequences | Basic Arithmetic | Leaf |
| Foundations | M-005 | Picture Graphs | Basic Arithmetic | Leaf |
| Foundations | M-012 | Positional Words | Basic Arithmetic | Spine |
| Foundations | M-006 | Teen Numbers | Basic Arithmetic | Spine |
| Fluency | M-059 | Absolute Value | Advanced Arithmetic | Spine |
| Fluency | M-046 | Bar Graphs | Intermediate Arithmetic | Spine |
| Fluency | M-061 | Data Collection | Advanced Arithmetic | Spine |
| Fluency | M15 | Decimal Operations | Fluency | Spine |
| Fluency | M-036 | Estimation | Intermediate Arithmetic | Leaf |
| Fluency | M-044 | Factors and Multiples | Intermediate Arithmetic | Spine |
| Fluency | M-033 | Fraction Operations | Intermediate Arithmetic | Spine |
| Fluency | M-034 | Fraction Word Problems | Intermediate Arithmetic | Spine |
| Fluency | M-052 | GCF and LCM | Advanced Arithmetic | Spine |
| Fluency | M33 | Geometry Basics | Fluency | Branch |
| Fluency | M-047 | Line Plots | Intermediate Arithmetic | Spine |
| Fluency | M-048 | Line Symmetry | Intermediate Arithmetic | Leaf |
| Fluency | M-040 | Mass and Capacity | Intermediate Arithmetic | Leaf |
| Fluency | M-062 | Mean Median Mode | Advanced Arithmetic | Spine |
| Fluency | M-032 | Mixed Numbers | Intermediate Arithmetic | Spine |
| Fluency | M-022 | Multi-Digit Addition | Intermediate Arithmetic | Spine |
| Fluency | M-058 | Negatives | Advanced Arithmetic | Spine |
| Fluency | M-065 | Nets of 3D Shapes | Advanced Arithmetic | Leaf |
| Fluency | M-042 | Perimeter | Intermediate Arithmetic | Spine |
| Fluency | M-054 | Powers of 10 | Advanced Arithmetic | Spine |
| Fluency | M-045 | Prime and Composite | Intermediate Arithmetic | Spine |
| Fluency | M-035 | Rounding and Estimation | Intermediate Arithmetic | Spine |
| Fluency | M-060 | Square Roots | Advanced Arithmetic | Spine |
| Fluency | M-049 | Types of Angles | Intermediate Arithmetic | Spine |
| Fluency | M-050 | Types of Lines | Intermediate Arithmetic | Spine |
| Fluency | M-039 | Unit Conversion | Intermediate Arithmetic | Spine |
| Fluency | M-037 | Word Problems | Intermediate Arithmetic | Leaf |
| Application | M-095 | Angle Bisectors | Geometry | Spine |
| Application | M-088 | Angles and Lines | Geometry | Spine |
| Application | M-043 | Area | Intermediate Arithmetic | Branch |
| Application | M-071 | Basic Algebraic Expressions | Pre-Algebra | Spine |
| Application | M-079 | Box Plots | Pre-Algebra | Leaf |
| Application | M-064 | Comparing Distributions | Advanced Arithmetic | Leaf |
| Application | M-081 | Compound Probability | Pre-Algebra | Spine |
| Application | M-129 | Correlation and Trend Lines | Algebra 1 | Spine |
| Application | M-075 | Cube Roots | Pre-Algebra | Spine |
| Application | M-124 | Domain and Range | Algebra 1 | Spine |
| Application | M39 | Financial Math | Application | Branch |
| Application | M-074 | Irrational Numbers | Pre-Algebra | Spine |
| Application | M-116 | Literal Equations | Algebra 1 | Spine |
| Application | M-115 | Multi-Step Equations | Algebra 1 | Spine |
| Application | M-067 | One-Step Equations | Advanced Arithmetic | Spine |
| Application | M-086 | Parallel Lines and Transversals | Pre-Algebra | Spine |
| Application | M-096 | Perpendicular Bisectors | Geometry | Spine |
| Application | M-080 | Probability Basics | Pre-Algebra | Spine |
| Application | M-113 | Quadratic Equations | Algebra 1 | Spine |
| Application | M-112 | Radicals | Algebra 1 | Spine |
| Application | M-073 | Ratio and Proportion | Pre-Algebra | Spine |
| Application | M-082 | Sampling Methods | Pre-Algebra | Spine |
| Application | M-078 | Scatter Plots | Pre-Algebra | Spine |
| Application | M-055 | Scientific Notation | Advanced Arithmetic | Leaf |
| Application | M-085 | Similar Figures | Pre-Algebra | Spine |
| Application | M-072 | Solving Simple Equations | Pre-Algebra | Spine |
| Application | M36 | Statistics Basics | Application | Branch |
| Application | M-083 | Surface Area | Pre-Algebra | Spine |
| Application | M-077 | Two-Way Tables | Pre-Algebra | Leaf |
| Application | M-084 | Volume of Cylinders Cones Spheres | Pre-Algebra | Spine |
| Integration | M-117 | Absolute Value Equations | Algebra 1 | Spine |
| Integration | M-104 | Arc Length | Geometry | Spine |
| Integration | M-097 | Area and Perimeter | Geometry | Spine |
| Integration | M-127 | Arithmetic Sequences | Algebra 1 | Spine |
| Integration | M-137 | Asymptotes | Algebra 2 | Spine |
| Integration | M-139 | Binomial Theorem | Algebra 2 | Spine |
| Integration | M-141 | Combinations | Algebra 2 | Spine |
| Integration | M-131 | Completing the Square | Algebra 2 | Spine |
| Integration | M-126 | Compound Interest | Algebra 1 | Spine |
| Integration | M-109 | Coordinate Geometry | Geometry | Spine |
| Integration | M-090 | Dilations | Geometry | Leaf |
| Integration | M-142 | Expected Value | Algebra 2 | Spine |
| Integration | M-070 | Exponents | Pre-Algebra | Spine |
| Integration | M-128 | Geometric Sequences | Algebra 1 | Spine |
| Integration | M-103 | Inscribed Angles | Geometry | Spine |
| Integration | M-154 | Inverse Trig | Pre-Calculus | Spine |
| Integration | M-108 | Law of Cosines | Geometry | Spine |
| Integration | M-107 | Law of Sines | Geometry | Spine |
| Integration | M-094 | Midsegments | Geometry | Spine |
| Integration | M-157 | Normal Distribution | Pre-Calculus | Spine |
| Integration | M-146 | Parametric Equations | Pre-Calculus | Spine |
| Integration | M-140 | Permutations | Algebra 2 | Spine |
| Integration | M28 | Quadratics | Integration | Spine |
| Integration | M-150 | Radian Measure | Pre-Calculus | Spine |
| Integration | M-105 | Sector Area | Geometry | Leaf |
| Integration | M-138 | Sequence and Series | Algebra 2 | Spine |
| Integration | M-147 | Series Convergence | Pre-Calculus | Spine |
| Integration | M-099 | Similarity | Geometry | Spine |
| Integration | M-063 | Simple Probability | Advanced Arithmetic | Branch |
| Integration | M-122 | Systems by Elimination | Algebra 1 | Spine |
| Integration | M-121 | Systems by Substitution | Algebra 1 | Spine |
| Integration | M-106 | Tangent Lines | Geometry | Spine |
| Integration | M-093 | Triangle Centers | Geometry | Leaf |
| Integration | M-092 | Triangle Inequality | Geometry | Spine |
| Integration | M-091 | Triangles and Pythagorean Theorem | Geometry | Spine |
| Integration | M-152 | Trig Identities | Pre-Calculus | Spine |
| Integration | M-151 | Unit Circle | Pre-Calculus | Spine |
| Integration | M-098 | Volume | Geometry | Spine |
| Mastery | M-190 | Advanced Computational Methods | Mastery and Research | Spine |
| Mastery | M-193 | Advanced Statistics | Final Specializations | Branch |
| Mastery | M-165 | Applications | Calculus | Spine |
| Mastery | M-187 | Applied Mathematics | Mastery and Research | Spine |
| Mastery | M-160 | Chain Rule | Calculus | Spine |
| Mastery | M-177 | Complex Analysis | Advanced Mathematics | Spine |
| Mastery | M-191 | Differential Geometry | Final Specializations | Leaf |
| Mastery | M-179 | Eigenvalues | Advanced Mathematics | Leaf |
| Mastery | M-163 | Implicit Differentiation | Calculus | Spine |
| Mastery | M-168 | Integration by Parts | Calculus | Spine |
| Mastery | M-169 | Integration Techniques | Calculus | Spine |
| Mastery | M40 | Investments & Growth | Mastery | Branch |
| Mastery | M-186 | Mathematical Logic | Specialized Topics | Leaf |
| Mastery | M-189 | Mathematical Research Techniques | Mastery and Research | Spine |
| Mastery | M31 | Pre-Calculus | Mastery | Spine |
| Mastery | M-181 | Probability and Statistics | Advanced Mathematics | Spine |
| Mastery | M-161 | Product Rule | Calculus | Spine |
| Mastery | M-162 | Quotient Rule | Calculus | Spine |
| Mastery | M-164 | Related Rates | Calculus | Spine |
| Mastery | M-188 | Theoretical Mathematics | Mastery and Research | Spine |
| Mastery | M-192 | Topology | Final Specializations | Leaf |
| Mastery | M-149 | Trigonometry | Pre-Calculus | Spine |
| Mastery | M-167 | U-Substitution | Calculus | Spine |
| Mastery | M-175 | Vector Calculus | Advanced Mathematics | Leaf |

### Language → lang  (22 of 42 migration nodes unmatched)

| Stage | Migration id | Title | Cluster | Path |
|---|---|---|---|---|
| Fluency | E5 | Basic Comprehension | Language: Fluency | Spine |
| Fluency | E21 | Literature (Intro) | Language: Fluency | Branch |
| Application | L-012 | Fiction Elements | Literary Analysis | Spine |
| Application | E26 | Media Literacy | Language: Application | Branch |
| Application | E9 | Reading Analysis | Language: Application | Spine |
| Application | E14 | Research Basics | Language: Application | Spine |
| Application | E13 | Textual Evidence | Language: Application | Spine |
| Integration | E23 | Advanced Literature | Language: Integration | Branch |
| Integration | E17 | Advanced Writing Styles | Language: Integration | Spine |
| Integration | L-011 | Cause and Effect | Comprehension | Spine |
| Integration | L-013 | Character Analysis | Literary Analysis | Spine |
| Integration | E27 | Digital Communication | Language: Integration | Branch |
| Integration | L-010 | Inferences | Comprehension | Spine |
| Integration | L-008 | Main Ideas | Comprehension | Spine |
| Integration | L-014 | Plot Structure | Literary Analysis | Spine |
| Integration | E18 | Research Writing | Language: Integration | Spine |
| Integration | L-009 | Supporting Details | Comprehension | Spine |
| Integration | L-015 | Theme | Literary Analysis | Leaf |
| Mastery | E20 | Advanced Communication | Language: Mastery | Leaf |
| Mastery | L-019 | Critical Thinking | Advanced Reading | Leaf |
| Mastery | L-016 | Poetry Analysis | Advanced Reading | Spine |
| Mastery | L-017 | Text Features | Advanced Reading | Spine |

### Social → social  (18 of 24 migration nodes unmatched)

| Stage | Migration id | Title | Cluster | Path |
|---|---|---|---|---|
| Foundations | SS2 | Local Geography | Foundations | Spine |
| Foundations | SS3 | Local History | Foundations | Spine |
| Fluency | SS5 | Early Civilizations | Fluency | Spine |
| Fluency | SS4 | National Symbols & Identity | Fluency | Spine |
| Application | SS8 | Cause & Effect in History | Application | Spine |
| Application | SS11 | Citizenship & Responsibility | Application | Spine |
| Application | SS24 | Cultural Studies | Application | Branch |
| Application | SS10 | Government Basics | Application | Spine |
| Application | SS9 | Primary & Secondary Sources | Application | Spine |
| Integration | SS20 | Comparative History | Integration | Branch |
| Integration | SS13 | Global Interactions | Integration | Spine |
| Integration | SS14 | Historical Analysis | Integration | Spine |
| Integration | SS23 | Law & Justice | Integration | Branch |
| Integration | SS16 | Modern Issues & Society | Integration | Spine |
| Integration | SS15 | Political Systems | Integration | Spine |
| Mastery | SS22 | Advanced Economics | Mastery | Branch |
| Mastery | SS17 | Civic Engagement | Mastery | Spine |
| Mastery | SS18 | Leadership & Influence | Mastery | Leaf |

### Bible → religion  (13 of 20 migration nodes unmatched)

| Stage | Migration id | Title | Cluster | Path |
|---|---|---|---|---|
| Foundations | B1 | Bible Structure | Foundations | Spine |
| Foundations | B3 | Memory Verses | Foundations | Spine |
| Fluency | B4 | Basic Biblical Themes | Fluency | Spine |
| Fluency | B6 | Reading Scripture Independently | Fluency | Spine |
| Fluency | B5 | Understanding Context | Fluency | Spine |
| Application | B9 | Applying Scripture | Application | Spine |
| Application | B8 | Biblical Interpretation | Application | Spine |
| Application | B7 | Doctrinal Basics | Application | Spine |
| Integration | B18 | Modern Theology | Integration | Branch |
| Integration | B10 | Theological Reasoning | Integration | Spine |
| Integration | B11 | Worldview Analysis | Integration | Spine |
| Mastery | B15 | Discipleship | Mastery | Spine |
| Mastery | B16 | Faith in Action | Mastery | Leaf |

### LifeSkills → life  (19 of 24 migration nodes unmatched)

| Stage | Migration id | Title | Cluster | Path |
|---|---|---|---|---|
| Foundations | LS2 | Personal Responsibility | Foundations | Spine |
| Foundations | LS1 | Self-Awareness | Foundations | Spine |
| Fluency | LS7 | Basic Money Concepts | Fluency | Spine |
| Fluency | LS5 | Decision Making | Fluency | Spine |
| Fluency | LS4 | Goal Setting | Fluency | Spine |
| Fluency | LS6 | Problem Solving | Fluency | Spine |
| Application | LS11 | Collaboration | Application | Spine |
| Application | LS23 | Digital Productivity | Application | Branch |
| Application | LS22 | Home Management | Application | Branch |
| Application | LS10 | Work Habits | Application | Spine |
| Integration | LS14 | Career Exploration | Integration | Spine |
| Integration | LS24 | Ethics & Integrity | Integration | Branch |
| Integration | LS17 | Health & Wellness | Integration | Spine |
| Integration | LS16 | Independent Living Basics | Integration | Spine |
| Integration | LS15 | Job Readiness | Integration | Spine |
| Integration | LS13 | Professional Communication | Integration | Spine |
| Mastery | LS20 | Adult Responsibility | Mastery | Leaf |
| Mastery | LS19 | Financial Independence | Mastery | Spine |
| Mastery | LS18 | Long-Term Planning | Mastery | Spine |

### Creative → creative  (68 of 90 migration nodes unmatched)

| Stage | Migration id | Title | Cluster | Path |
|---|---|---|---|---|
| Foundations | CR-047 | 3D Basics | Animation | Spine |
| Foundations | C2 | Basic Art Skills | Creative: Foundations | Spine |
| Foundations | CR-053 | Compositing | Animation | Leaf |
| Foundations | CR-057 | Creative Coding | Creative Technology | Spine |
| Foundations | C1 | Creative Exploration | Creative: Foundations | Spine |
| Foundations | CR-058 | Generative Art | Creative Technology | Leaf |
| Foundations | CR-059 | Machine Learning | Creative Technology | Spine |
| Foundations | CR-060 | Neural Networks | Creative Technology | Leaf |
| Foundations | CR-020 | Pastels | Traditional Media | Leaf |
| Foundations | CR-055 | Prompt Crafting | Creative Technology | Spine |
| Foundations | CR-051 | Rigging | Animation | Leaf |
| Foundations | CR-048 | Stop Motion | Animation | Leaf |
| Foundations | CR-054 | Style Transfer | Creative Technology | Spine |
| Fluency | CR-023 | Acrylic | Traditional Media | Spine |
| Fluency | CR-007 | AI-Assisted Art | Creative Technology | Spine |
| Fluency | CR-056 | Art Ethics | Creative Technology | Leaf |
| Fluency | CR-031 | Character Design | Digital Art | Spine |
| Fluency | CR-034 | Concept Art | Digital Art | Spine |
| Fluency | C4 | Creative Techniques | Creative: Fluency | Spine |
| Fluency | CR-035 | Digital Illustration | Digital Art | Leaf |
| Fluency | CR-001 | Foundational Drawing | Core | Spine |
| Fluency | CR-049 | Motion Graphics | Animation | Spine |
| Fluency | CR-027 | Portraiture | Traditional Media | Leaf |
| Fluency | CR-052 | VFX | Animation | Leaf |
| Fluency | CR-022 | Watercolor | Traditional Media | Spine |
| Application | C7 | Artistic Expression | Creative: Application | Spine |
| Application | CR-024 | Charcoal | Traditional Media | Leaf |
| Application | CR-018 | Color Mixing | Traditional Media | Spine |
| Application | CR-004 | Digital Drawing Tools | Digital Art | Spine |
| Application | CR-028 | Digital Sketching | Digital Art | Spine |
| Application | CR-032 | Environment Art | Digital Art | Spine |
| Application | CR-073 | Fashion Illustration | Specialized | Leaf |
| Application | CR-015 | Figure Drawing | Art Fundamentals | Spine |
| Application | CR-026 | Landscapes | Traditional Media | Leaf |
| Application | CR-021 | Oil Techniques | Traditional Media | Spine |
| Application | CR-025 | Still Life | Traditional Media | Leaf |
| Application | C16 | Visual Arts | Creative: Application | Branch |
| Integration | CR-012 | Anatomy | Art Fundamentals | Spine |
| Integration | CR-061 | Art Business | Professional | Spine |
| Integration | CR-070 | Botanical Art | Specialized | Leaf |
| Integration | C10 | Creative Collaboration | Creative: Integration | Spine |
| Integration | C12 | Creative Iteration | Creative: Integration | Spine |
| Integration | CR-063 | Freelancing | Professional | Spine |
| Integration | CR-016 | Gesture Drawing | Art Fundamentals | Leaf |
| Integration | CR-041 | Layout Design | Design | Spine |
| Integration | CR-002 | Line | Art Fundamentals | Spine |
| Integration | CR-038 | Logo Design | Design | Spine |
| Integration | CR-069 | Medical Art | Specialized | Leaf |
| Integration | CR-068 | Networking | Professional | Leaf |
| Integration | CR-030 | Photo Manipulation | Digital Art | Leaf |
| Integration | C11 | Production & Design | Creative: Integration | Spine |
| Integration | CR-009 | Scientific Illustration | Specialized | Spine |
| Integration | CR-039 | Typography | Design | Spine |
| Mastery | C22 | Advanced Creative Projects | Creative: Mastery | Branch |
| Mastery | CR-072 | Architectural Rendering | Specialized | Leaf |
| Mastery | CR-067 | Art Critique | Professional | Leaf |
| Mastery | CR-042 | Branding | Design | Spine |
| Mastery | CR-064 | Client Work | Professional | Spine |
| Mastery | C15 | Creative Mastery | Creative: Mastery | Leaf |
| Mastery | CR-066 | Marketing | Professional | Leaf |
| Mastery | CR-043 | Package Design | Design | Leaf |
| Mastery | CR-040 | Print Design | Design | Leaf |
| Mastery | CR-010 | Shape | Art Fundamentals | Spine |
| Mastery | C14 | Specialization | Creative: Mastery | Spine |
| Mastery | CR-062 | Teaching Art | Professional | Spine |
| Mastery | CR-071 | Technical Drawing | Specialized | Spine |
| Mastery | CR-013 | Value & Perspective | Art Fundamentals | Spine |
| Mastery | CR-045 | Web Design | Design | Leaf |

### Technology → tech  (167 of 184 migration nodes unmatched)

| Stage | Migration id | Title | Cluster | Path |
|---|---|---|---|---|
| Foundations | T-SD003 | Basic Arithmetic | Software: Core Foundations | Spine |
| Foundations | T-SD002 | Basic Computer Operations | Software: Core Foundations | Spine |
| Foundations | T-SD004 | Basic Software Tools | Software: Basic Programming | Spine |
| Foundations | T-RB092 | Constraint Track | Robotics: Innovator & Problem Solver | Spine |
| Foundations | T-RB080 | Design Portfolio | Robotics: Tech Designer | Leaf |
| Foundations | T1 | Device Basics | Tech: Foundations | Spine |
| Foundations | T2 | Digital Navigation | Tech: Foundations | Spine |
| Foundations | T-RB096 | Final Prototype | Robotics: Innovator & Problem Solver | Spine |
| Foundations | T-RB098 | Impact Project | Robotics: Innovator & Problem Solver | Spine |
| Foundations | T3 | Keyboarding & Input | Tech: Foundations | Spine |
| Foundations | T-SD005 | Programming/Basic Theory | Software: Basic Programming | Spine |
| Foundations | T-RB099 | Public Present | Robotics: Innovator & Problem Solver | Spine |
| Foundations | T-RB097 | Reliability Test | Robotics: Innovator & Problem Solver | Spine |
| Foundations | T-RB095 | Research Docs | Robotics: Innovator & Problem Solver | Spine |
| Foundations | T-RB100 | Scale Plan | Robotics: Innovator & Problem Solver | Leaf |
| Foundations | T-RB094 | Team Lead | Robotics: Innovator & Problem Solver | Spine |
| Foundations | T-SD006 | Text Manipulation | Software: Basic Programming | Spine |
| Fluency | T-SD013 | Basic Concepts | Software: Intermediate Development | Spine |
| Fluency | T-RB067 | BOM | Robotics: Tech Designer | Spine |
| Fluency | T-RB081 | Budget Limits | Robotics: Tech Designer | Spine |
| Fluency | T-RB076 | CAD Assemblies | Robotics: Tech Designer | Spine |
| Fluency | T-RB078 | Client Design | Robotics: Tech Designer | Spine |
| Fluency | T-SD010 | Computer Science Algebra | Software: Intermediate Programming | Spine |
| Fluency | T-SD014 | Console UI Fundamentals | Software: Intermediate Development | Spine |
| Fluency | T-RB073 | Design Log | Robotics: Tech Designer | Spine |
| Fluency | T8 | Digital Communication | Tech: Fluency | Spine |
| Fluency | T28 | Digital Media Creation | Tech: Fluency | Branch |
| Fluency | T-RB091 | Feedback Iterate | Robotics: Innovator & Problem Solver | Spine |
| Fluency | T-RB075 | Fusion 360 | Robotics: Tech Designer | Spine |
| Fluency | T7 | Internet Research | Tech: Fluency | Spine |
| Fluency | T-SD011 | Introduction to Hardware | Software: Intermediate Development | Spine |
| Fluency | T-RB069 | Label Schematics | Robotics: Tech Designer | Spine |
| Fluency | T-RB061 | Labeled Sketch | Robotics: Tech Designer | Spine |
| Fluency | T-SD008 | Markup Languages | Software: Intermediate Programming | Spine |
| Fluency | T-RB074 | Material Eval | Robotics: Tech Designer | Spine |
| Fluency | T-RB090 | Multi Prototypes | Robotics: Innovator & Problem Solver | Spine |
| Fluency | T-RB064 | Plan Template | Robotics: Tech Designer | Spine |
| Fluency | T-RB079 | Pro Presentation | Robotics: Tech Designer | Spine |
| Fluency | T6 | Productivity Tools | Tech: Fluency | Spine |
| Fluency | T-RB065 | Record Measures | Robotics: Tech Designer | Spine |
| Fluency | T-RB071 | Scaled Drawings | Robotics: Tech Designer | Spine |
| Fluency | T-RB077 | Tech Prints | Robotics: Tech Designer | Spine |
| Fluency | T-RB086 | Test Plan | Robotics: Innovator & Problem Solver | Spine |
| Fluency | T-RB068 | Tinkercad Model | Robotics: Tech Designer | Spine |
| Fluency | T-RB089 | Usability Test | Robotics: Innovator & Problem Solver | Spine |
| Fluency | T-RB088 | User Interview | Robotics: Innovator & Problem Solver | Spine |
| Fluency | T-RB093 | Version Compare | Robotics: Innovator & Problem Solver | Spine |
| Application | T-SD015 | Advanced Debugging Techniques | Software: Advanced Development | Spine |
| Application | T9 | Algorithmic Thinking | Tech: Application | Spine |
| Application | T-SD016 | Assembly Language Programming | Software: Advanced Development | Spine |
| Application | T-RB004 | Design Basics | Robotics: Tech Designer | Spine |
| Application | T-RB063 | Design Weakness | Robotics: Tech Designer | Spine |
| Application | T-SD021 | Event Driven Programming | Software: Advanced Development | Spine |
| Application | T-RB006 | Frame Build | Robotics: Mechanical Maker | Spine |
| Application | T20 | Game Logic | Tech: Application | Branch |
| Application | T-RB070 | Goals Fit | Robotics: Tech Designer | Spine |
| Application | T-SD019 | HTML CSS | Software: Advanced Development | Spine |
| Application | T-RB082 | Idea Brainstorm | Robotics: Innovator & Problem Solver | Spine |
| Application | T-RB005 | Innovation Basics | Robotics: Innovator & Problem Solver | Spine |
| Application | T-SD012 | Intro Computer Science | Software: Intermediate Development | Spine |
| Application | T-RB085 | Invention Sketch | Robotics: Innovator & Problem Solver | Spine |
| Application | T-SD020 | JavaScript/jQuery | Software: Advanced Development | Spine |
| Application | T-RB087 | Low-Fi Proto | Robotics: Innovator & Problem Solver | Spine |
| Application | T29 | Media Production | Tech: Application | Branch |
| Application | T-RB062 | Part Explain | Robotics: Tech Designer | Spine |
| Application | T-RB066 | Present Concept | Robotics: Tech Designer | Spine |
| Application | T-RB083 | Problem Describe | Robotics: Innovator & Problem Solver | Spine |
| Application | T10 | Programming Logic | Tech: Application | Spine |
| Application | T11 | Programming Projects | Tech: Application | Spine |
| Application | T-RB072 | Simulate System | Robotics: Tech Designer | Spine |
| Application | T-RB084 | Success Criteria | Robotics: Innovator & Problem Solver | Spine |
| Application | T19 | Visual Programming | Tech: Application | Branch |
| Application | T22 | Web Foundations | Tech: Application | Branch |
| Application | T-SD018 | Web to Desktop Design | Software: Advanced Development | Spine |
| Integration | T-RB013 | 2-Joint Arm | Robotics: Mechanical Maker | Spine |
| Integration | T-SD047 | Advanced Game Programming | Software: Game Development | Spine |
| Integration | T-SD034 | Advanced Software Development | Software: Software Engineering | Spine |
| Integration | T-SD030 | Advanced Systems Programming | Software: Systems Programming | Branch |
| Integration | T-RB036 | Alarm Device | Robotics: Electric Explorer | Leaf |
| Integration | T32 | Automation Basics | Tech: Integration | Branch |
| Integration | T-RB011 | Axle Compare | Robotics: Mechanical Maker | Spine |
| Integration | T-RB007 | Axles & Wheels | Robotics: Mechanical Maker | Spine |
| Integration | T-SD040 | Back-End Development | Software: Full Stack Development | Spine |
| Integration | T-RB016 | Balance & Springs | Robotics: Mechanical Maker | Spine |
| Integration | T-SD023 | Basic HTML Design | Software: Web Development | Spine |
| Integration | T-RB048 | Blink LED | Robotics: Code Commander | Spine |
| Integration | T-RB025 | Breadboard Use | Robotics: Electric Explorer | Spine |
| Integration | T-RB009 | Build Stability | Robotics: Mechanical Maker | Spine |
| Integration | T-SD026 | Building Interactive Websites | Software: Web Development | Leaf |
| Integration | T-SD025 | Building Responsive Websites | Software: Web Development | Spine |
| Integration | T-SD035 | Building Scalable Applications | Software: Software Engineering | Spine |
| Integration | T-RB002 | Circuits Basics | Robotics: Electric Explorer | Spine |
| Integration | T-RB003 | Coding Basics | Robotics: Code Commander | Spine |
| Integration | T-RB022 | Components ID | Robotics: Electric Explorer | Spine |
| Integration | T-RB012 | Cranks & Pulleys | Robotics: Mechanical Maker | Spine |
| Integration | T-SD051 | Data Science and Machine Learning | Software: Data Science | Spine |
| Integration | T-RB047 | Debug Syntax | Robotics: Code Commander | Spine |
| Integration | T13 | Debugging & Testing | Tech: Integration | Spine |
| Integration | T-SD054 | Deep Learning | Software: Data Science | Spine |
| Integration | T-RB023 | Electricity Flow | Robotics: Electric Explorer | Spine |
| Integration | T16 | Engineering Design Process | Tech: Integration | Spine |
| Integration | T-SD039 | Front-End Development | Software: Full Stack Development | Spine |
| Integration | T-RB050 | Functions | Robotics: Code Commander | Spine |
| Integration | T-SD048 | Game Engine Development | Software: Game Development | Branch |
| Integration | T-RB014 | Gear Integration | Robotics: Mechanical Maker | Spine |
| Integration | T-RB010 | Gears & Torque | Robotics: Mechanical Maker | Spine |
| Integration | T-SD022 | HTML CSS Concepts | Software: Web Development | Spine |
| Integration | T-RB049 | Input → Output | Robotics: Code Commander | Spine |
| Integration | T-RB044 | Inputs ID | Robotics: Code Commander | Spine |
| Integration | T-SD045 | Intro to Game Programming | Software: Game Development | Spine |
| Integration | T-RB024 | LED Switch | Robotics: Electric Explorer | Spine |
| Integration | T-RB052 | Libraries | Robotics: Code Commander | Spine |
| Integration | T-RB030 | Light/Sound React | Robotics: Electric Explorer | Spine |
| Integration | T-RB001 | Mechanics Basics | Robotics: Mechanical Maker | Spine |
| Integration | T-RB053 | Menu/UI | Robotics: Code Commander | Spine |
| Integration | T-RB008 | Motion Device | Robotics: Mechanical Maker | Spine |
| Integration | T-RB027 | Multimeter Use | Robotics: Electric Explorer | Spine |
| Integration | T-SD028 | Operating System Fundamentals | Software: Systems Programming | Spine |
| Integration | T-RB045 | Parameter Tuning | Robotics: Code Commander | Spine |
| Integration | T-RB033 | Power Budget | Robotics: Electric Explorer | Spine |
| Integration | T-RB058 | RF/Bluetooth | Robotics: Code Commander | Spine |
| Integration | T-RB026 | Sensor Read | Robotics: Electric Explorer | Spine |
| Integration | T-RB031 | Sensor Toggle | Robotics: Code Commander | Spine |
| Integration | T26 | Sensors & Actuators | Tech: Integration | Branch |
| Integration | T-RB051 | Serial Monitor | Robotics: Code Commander | Spine |
| Integration | T-SD046 | Service Oriented Architecture | Software: Game Development | Spine |
| Integration | T12 | Software Design | Tech: Integration | Spine |
| Integration | T-RB043 | Starter Code | Robotics: Code Commander | Spine |
| Integration | T-SD052 | Statistical Analysis | Software: Data Science | Spine |
| Integration | T-SD027 | Systems and Application Programming | Software: Systems Programming | Spine |
| Integration | T15 | Systems Integration | Tech: Integration | Spine |
| Integration | T-RB054 | Timers/Millis | Robotics: Code Commander | Spine |
| Integration | T14 | Versioning & Iteration | Tech: Integration | Spine |
| Integration | T-RB015 | Walker/Biped | Robotics: Mechanical Maker | Spine |
| Mastery | T33 | Advanced Automation | Tech: Mastery | Branch |
| Mastery | T-SD044 | Advanced Cloud Development | Software: Full Stack Development | Leaf |
| Mastery | T-SD055 | AI Development | Software: Data Science | Spine |
| Mastery | T-SD037 | Application Security | Software: Software Engineering | Spine |
| Mastery | T-RB059 | Auto Behavior | Robotics: Code Commander | Spine |
| Mastery | T-RB040 | Autonomous Power | Robotics: Electric Explorer | Spine |
| Mastery | T-RB042 | Circuit Diagram | Robotics: Electric Explorer | Spine |
| Mastery | T-RB060 | Code Docs | Robotics: Code Commander | Leaf |
| Mastery | T-RB056 | Concurrent Code | Robotics: Code Commander | Spine |
| Mastery | T-RB041 | Enclosure Build | Robotics: Electric Explorer | Leaf |
| Mastery | T-SD050 | Game Design Principles | Software: Game Development | Leaf |
| Mastery | T-SD024 | HTML to Web Fundamentals | Software: Web Development | Spine |
| Mastery | T-RB046 | If/Else & Loops | Robotics: Code Commander | Spine |
| Mastery | T17 | Independent Build Project | Tech: Mastery | Spine |
| Mastery | T-SD032 | Industrial Automation | Software: Systems Programming | Leaf |
| Mastery | T-RB055 | Interrupts/States | Robotics: Code Commander | Spine |
| Mastery | T-RB021 | Labeled Mechanism | Robotics: Mechanical Maker | Leaf |
| Mastery | T-RB017 | Materials Choice | Robotics: Mechanical Maker | Spine |
| Mastery | T-RB019 | Mech-Control Integr. | Robotics: Mechanical Maker | Spine |
| Mastery | T-SD038 | Modern Software Practices | Software: Software Engineering | Leaf |
| Mastery | T-RB032 | Motor+Sensor Circuit | Robotics: Electric Explorer | Spine |
| Mastery | T-RB038 | Multi-Load Power | Robotics: Electric Explorer | Spine |
| Mastery | T-RB057 | Optimize Code | Robotics: Code Commander | Spine |
| Mastery | T-RB018 | Real-World Chassis | Robotics: Mechanical Maker | Spine |
| Mastery | T-RB035 | Regulators & Polarity | Robotics: Electric Explorer | Spine |
| Mastery | T-RB034 | Sensor Control | Robotics: Electric Explorer | Spine |
| Mastery | T-RB029 | Sensor Logic | Robotics: Electric Explorer | Spine |
| Mastery | T-RB028 | Servo Drive | Robotics: Electric Explorer | Spine |
| Mastery | T-SD036 | Software Architecture | Software: Software Engineering | Spine |
| Mastery | T-RB039 | Soldering | Robotics: Electric Explorer | Spine |
| Mastery | T-SD031 | Systems and Application Automation | Software: Systems Programming | Spine |
| Mastery | T-RB020 | Test Iteration | Robotics: Mechanical Maker | Spine |
| Mastery | T-RB037 | Transistors/Relays | Robotics: Electric Explorer | Spine |

### Physical → fitness  (17 of 21 migration nodes unmatched)

| Stage | Migration id | Title | Cluster | Path |
|---|---|---|---|---|
| Foundations | P1 | Basic Movement | Foundations | Spine |
| Foundations | P2 | Body Awareness | Foundations | Spine |
| Fluency | P6 | Endurance Basics | Fluency | Spine |
| Fluency | P4 | Motor Skills | Fluency | Spine |
| Application | P8 | Fitness Routines | Application | Spine |
| Application | P18 | Health & Nutrition | Application | Branch |
| Application | P16 | Individual Sports | Application | Branch |
| Application | P20 | Outdoor Skills | Application | Branch |
| Application | P9 | Sport Fundamentals | Application | Spine |
| Application | P7 | Strength Development | Application | Spine |
| Integration | P13 | Advanced Conditioning | Integration | Spine |
| Integration | P10 | Game Strategy | Integration | Spine |
| Integration | P12 | Performance Training | Integration | Spine |
| Integration | P11 | Team Play | Integration | Spine |
| Mastery | P21 | Competitive Performance | Mastery | Branch |
| Mastery | P14 | Personal Fitness Planning | Mastery | Spine |
| Mastery | P15 | Physical Mastery | Mastery | Leaf |

## 3. Skills in the 3D tree with no obvious migration counterpart

Reverse direction: 3D-tree-only skills (not found in migration by name).
These might be *new* concepts the 3D tree introduced beyond the migration.

### math (Math): 4 of 54 skills have no migration match

| Tier | 3D id | Name |
|---|---|---|
| 3 | integers | Integers |
| 5 | euclidean_geo | Euclidean Geometry |
| 5 | solid_geometry | Solid Geometry |
| 8 | probability_theory | Probability Theory |

### lang (Language): 26 of 45 skills have no migration match

| Tier | 3D id | Name |
|---|---|---|
| 1 | listening_comp | Listening Comprehension |
| 2 | handwriting | Handwriting |
| 2 | spelling | Spelling |
| 3 | dictionary_skills | Dictionary Skills |
| 4 | figurative_lang | Figurative Language |
| 4 | note_taking | Note-Taking |
| 5 | adv_grammar | Advanced Grammar |
| 5 | comparative_analysis | Comparative Analysis |
| 5 | persuasive_writing | Persuasive Writing |
| 6 | academic_writing | Academic Writing |
| 6 | journalism | Journalism |
| 6 | linguistics_basics | Linguistics Basics |
| 6 | literary_criticism | Literary Criticism |
| 6 | technical_writing | Technical Writing |
| 7 | discourse_analysis | Discourse Analysis |
| 7 | editing_revision | Editing & Revision |
| 7 | prof_communication | Professional Communication |
| 7 | research_papers | Research Papers |
| 7 | semiotics | Semiotics |
| 7 | thesis_development | Thesis Development |
| 8 | academic_publishing | Academic Publishing |
| 8 | comp_linguistics | Computational Linguistics |
| 8 | grant_writing | Grant Writing |
| 8 | literary_theory | Literary Theory |
| 8 | screenwriting_lang | Screenwriting |
| 8 | translation_theory | Translation Theory |

### social (Social): 39 of 48 skills have no migration match

| Tier | 3D id | Name |
|---|---|---|
| 1 | basic_maps | Basic Maps |
| 1 | family_structures | Family Structures |
| 1 | rules_laws | Rules & Laws |
| 1 | sharing_coop | Sharing & Cooperation |
| 2 | citizenship_basics | Citizenship Basics |
| 2 | cultural_awareness | Cultural Awareness |
| 2 | historical_figures | Historical Figures |
| 2 | timeline_chrono | Timeline & Chronology |
| 2 | us_geography | US Geography |
| 3 | ancient_civs | Ancient Civilizations |
| 3 | gov_structure | Government Structure |
| 3 | map_globe | Map & Globe Skills |
| 4 | civics_gov | Civics & Government |
| 4 | critical_analysis | Critical Analysis of Sources |
| 4 | microeconomics | Microeconomics |
| 4 | sociology_basics | Sociology Basics |
| 4 | world_hist_medieval | World History: Medieval–Renaissance |
| 5 | anthropology | Anthropology |
| 5 | intl_relations | International Relations |
| 5 | macroeconomics | Macroeconomics |
| 5 | media_literacy | Media Literacy |
| 5 | political_sci | Political Science |
| 6 | ap_history | AP-Level History |
| 6 | behavioral_econ | Behavioral Economics |
| 6 | comparative_gov | Comparative Government |
| 6 | constitutional_law | Constitutional Law |
| 6 | historiography | Historiography |
| 7 | demographic_analysis | Demographic Analysis |
| 7 | economic_theory | Economic Theory |
| 7 | foreign_policy | Foreign Policy Analysis |
| 7 | political_philosophy | Political Philosophy |
| 7 | public_policy | Public Policy |
| 7 | urban_planning | Urban Planning |
| 8 | dev_economics | Development Economics |
| 8 | diplomatic_strategy | Diplomatic Strategy |
| 8 | game_theory | Game Theory |
| 8 | intl_law | International Law |
| 8 | political_economy | Political Economy |
| 8 | research_methodology | Research Methodology |

### religion (Bible): 42 of 49 skills have no migration match

| Tier | 3D id | Name |
|---|---|---|
| 1 | church_community | Church Community |
| 1 | gods_love | God's Love |
| 1 | prayer_basics | Prayer Basics |
| 1 | ten_commandments | Ten Commandments |
| 1 | worship | Worship |
| 2 | baptism | Baptism Understanding |
| 2 | fruits_spirit | Fruits of the Spirit |
| 2 | key_verses | Key Verse Memorization |
| 2 | nt_survey | New Testament Survey |
| 2 | ot_survey | Old Testament Survey |
| 2 | parables | Parables of Jesus |
| 3 | acts_early_church | Acts & Early Church |
| 3 | biblical_geography | Biblical Geography |
| 3 | christian_ethics | Christian Ethics Basics |
| 3 | denominational | Denominational Awareness |
| 3 | life_of_christ | Life of Christ Study |
| 3 | personal_devotion | Personal Devotion |
| 3 | psalms_wisdom | Psalms & Wisdom Literature |
| 4 | hermeneutics | Hermeneutics |
| 4 | mission_evangelism | Mission & Evangelism |
| 4 | systematic_theo_basic | Systematic Theology Basics |
| 5 | christian_philosophy | Christian Philosophy |
| 5 | comparative_theology | Comparative Theology |
| 5 | homiletics | Homiletics (Preaching) |
| 5 | nt_exegesis | New Testament Exegesis |
| 5 | ot_exegesis | Old Testament Exegesis |
| 5 | pastoral_care | Pastoral Care |
| 6 | biblical_languages_basic | Biblical Hebrew & Greek Basics |
| 6 | counseling | Christian Counseling |
| 6 | ecclesiology | Ecclesiology |
| 6 | historical_theology | Historical Theology |
| 6 | missiology | Missiology |
| 7 | church_admin | Church Administration |
| 7 | interfaith_dialogue | Interfaith Dialogue |
| 7 | liturgical_studies | Liturgical Studies |
| 7 | philosophical_theology | Philosophical Theology |
| 7 | systematic_theology | Systematic Theology |
| 8 | academic_biblical_criticism | Academic Biblical Criticism |
| 8 | original_lang_scholarship | Original Language Scholarship |
| 8 | public_theology | Public Theology |
| 8 | theological_research | Theological Research & Publishing |
| 8 | theology_of_culture | Theology of Culture |

### life (LifeSkills): 54 of 59 skills have no migration match

| Tier | 3D id | Name |
|---|---|---|
| 1 | basic_manners | Basic Manners |
| 1 | basic_safety | Basic Safety |
| 1 | dressing_self | Dressing Self |
| 1 | following_instructions | Following Instructions |
| 1 | personal_hygiene | Personal Hygiene |
| 1 | recognizing_coins | Recognizing Coins |
| 1 | sharing_turns | Sharing & Taking Turns |
| 1 | telling_time | Telling Time |
| 2 | basic_cooking | Basic Cooking |
| 2 | basic_first_aid | Basic First Aid |
| 2 | chores | Chores |
| 2 | fire_safety | Fire Safety |
| 2 | money_counting | Money Counting |
| 2 | phone_skills | Phone Skills |
| 2 | stranger_danger | Stranger Danger |
| 3 | emotional_reg | Emotional Regulation |
| 3 | internet_safety | Internet Safety |
| 3 | laundry | Laundry |
| 3 | meal_planning | Meal Planning & Cooking |
| 3 | study_skills | Study Skills |
| 4 | drivers_ed | Driver's Education |
| 4 | grocery_shopping | Grocery Shopping |
| 4 | home_maintenance | Home Maintenance Basics |
| 4 | job_interview | Job Interview Skills |
| 4 | nutrition | Nutrition |
| 4 | resume_writing | Resume Writing |
| 4 | stress_management | Stress Management |
| 5 | adv_cooking | Advanced Cooking |
| 5 | apartment_hunting | Apartment Hunting |
| 5 | critical_thinking | Critical Thinking |
| 5 | financial_planning | Financial Planning |
| 5 | insurance | Insurance Understanding |
| 5 | networking | Networking |
| 5 | self_advocacy | Self-Advocacy |
| 5 | taxes | Taxes & Filing |
| 6 | career_planning | Career Planning |
| 6 | contract_understanding | Contract Understanding |
| 6 | emergency_prep | Emergency Preparedness |
| 6 | home_buying | Home Buying |
| 6 | investing | Investing Basics |
| 6 | leadership | Leadership |
| 6 | legal_literacy | Legal Literacy |
| 6 | parenting | Parenting Skills |
| 7 | adv_investing | Advanced Investing |
| 7 | adv_negotiation | Advanced Negotiation |
| 7 | estate_planning | Estate Planning |
| 7 | mentoring | Mentoring |
| 7 | project_management | Project Management |
| 7 | policy_engagement | Public Policy Engagement |
| 8 | business_strategy | Business Strategy |
| 8 | exec_leadership | Executive Leadership |
| 8 | legacy_planning | Legacy Planning |
| 8 | philanthropy | Philanthropy |
| 8 | wealth_management | Wealth Management |

### creative (Creative): 44 of 60 skills have no migration match

| Tier | 3D id | Name |
|---|---|---|
| 1 | building_blocks | Building Blocks |
| 1 | coloring | Coloring |
| 1 | finger_painting | Finger Painting |
| 1 | imaginative_play | Imaginative Play |
| 1 | rhythm_beat | Rhythm & Beat |
| 1 | scribbling | Scribbling & Drawing |
| 1 | singing_along | Singing Along |
| 2 | basic_drawing | Basic Drawing |
| 2 | basic_instrument | Basic Musical Instrument |
| 2 | crafts | Crafts |
| 2 | dance_basics | Dance Basics |
| 2 | photography_basics | Photography Basics |
| 2 | singing_choir | Singing & Choir |
| 3 | instrument_proficiency | Instrument Proficiency |
| 3 | pottery_sculpture | Pottery & Sculpture |
| 3 | sketching_shading | Sketching & Shading |
| 4 | directing | Directing |
| 4 | ensemble_band | Ensemble & Band |
| 4 | film_video_basics | Film & Video Basics |
| 4 | music_theory_intermediate | Intermediate Music Theory |
| 4 | screenwriting | Screenwriting |
| 5 | adv_acting | Advanced Acting |
| 5 | adv_drawing_painting | Advanced Drawing & Painting |
| 5 | audio_production | Audio Production |
| 5 | fashion_design | Fashion Design |
| 5 | poetry | Poetry |
| 6 | adv_sculpture | Advanced Sculpture |
| 6 | architecture | Architecture Basics |
| 6 | art_history | Art History |
| 6 | choreography | Choreography |
| 6 | game_design | Game Design |
| 6 | music_production | Music Production |
| 7 | art_criticism | Art Criticism |
| 7 | exhibition_gallery | Exhibition & Gallery Work |
| 7 | film_post_prod | Film Editing & Post-Production |
| 7 | industrial_design | Industrial Design |
| 7 | mixed_media | Mixed Media |
| 7 | orchestration | Orchestration |
| 7 | sound_design | Sound Design |
| 8 | cinematography | Cinematography |
| 8 | conducting | Conducting |
| 8 | curation | Curation |
| 8 | installation_art | Installation Art |
| 8 | master_craftsmanship | Master Craftsmanship |

### tech (Technology): 35 of 52 skills have no migration match

| Tier | 3D id | Name |
|---|---|---|
| 1 | basic_app_usage | Basic App Usage |
| 1 | internet_browsing | Internet Browsing |
| 1 | mouse_keyboard | Mouse & Keyboard Skills |
| 1 | device_onoff | Turning On/Off Devices |
| 1 | typing_basics | Typing Basics |
| 2 | basic_troubleshooting | Basic Troubleshooting |
| 2 | email | Email |
| 2 | internet_search | Internet Search Skills |
| 2 | presentation_software | Presentation Software |
| 2 | word_processing | Word Processing |
| 3 | cloud_storage | Cloud Storage |
| 3 | digital_security | Digital Security |
| 3 | hardware_basics | Hardware Basics |
| 3 | social_media_lit | Social Media Literacy |
| 3 | touch_typing | Touch Typing |
| 4 | networking_basics | Networking Basics |
| 4 | prog_fundamentals | Programming Fundamentals |
| 4 | version_control | Version Control |
| 5 | apis | APIs |
| 5 | linux_cli | Linux & Command Line |
| 5 | python_js | Python / JavaScript |
| 6 | computer_architecture | Computer Architecture |
| 6 | data_structures | Data Structures & Algorithms |
| 7 | advanced_ml | Advanced ML & AI |
| 7 | blockchain | Blockchain |
| 7 | compiler_design | Compiler Design |
| 7 | computer_graphics | Computer Graphics |
| 7 | distributed_systems | Distributed Systems |
| 7 | system_design | System Design |
| 8 | advanced_ai_research | Advanced AI Research |
| 8 | comp_biology | Computational Biology |
| 8 | cryptography | Cryptography |
| 8 | formal_verification | Formal Verification |
| 8 | hci_research | HCI Research |
| 8 | quantum_computing | Quantum Computing |

### fitness (Physical): 51 of 55 skills have no migration match

| Tier | 3D id | Name |
|---|---|---|
| 1 | catching | Catching |
| 1 | crawling | Crawling |
| 1 | jumping | Jumping |
| 1 | running | Running |
| 1 | throwing | Throwing |
| 1 | walking | Walking |
| 2 | ball_sports_basics | Ball Sports Basics |
| 2 | bodyweight_exercises | Bodyweight Exercises |
| 2 | cycling | Cycling |
| 2 | gymnastics_basics | Gymnastics Basics |
| 2 | stretching | Stretching |
| 2 | swimming_basics | Swimming Basics |
| 3 | endurance | Endurance Training |
| 3 | flexibility | Flexibility Training |
| 3 | nutrition_fitness | Nutrition for Fitness |
| 3 | sport_specific | Sport-Specific Skills |
| 3 | sportsmanship | Sportsmanship |
| 3 | strength_basics | Strength Training Basics |
| 3 | warmup_cooldown | Warm-Up & Cool-Down |
| 4 | adv_swimming | Advanced Swimming |
| 4 | cross_training | Cross-Training |
| 4 | interval_training | Interval Training |
| 4 | martial_arts | Martial Arts Basics |
| 4 | sport_strategy | Sport Strategy |
| 4 | weight_training | Weight Training |
| 4 | yoga | Yoga |
| 5 | adv_strength | Advanced Strength Training |
| 5 | coaching_basics | Coaching Basics |
| 5 | competition_prep | Competition Preparation |
| 5 | mobility_recovery | Mobility & Recovery |
| 5 | periodization | Periodization Training |
| 5 | sport_conditioning | Sport-Specific Conditioning |
| 5 | sports_psychology | Sports Psychology |
| 6 | adv_sport_strategy | Advanced Sport Strategy |
| 6 | endurance_events | Endurance Events |
| 6 | exercise_physiology | Exercise Physiology |
| 6 | personal_training | Personal Training & Coaching |
| 6 | rehabilitation | Rehabilitation |
| 6 | sports_nutrition | Sports Nutrition |
| 7 | athletic_optimization | Athletic Performance Optimization |
| 7 | biomechanics | Biomechanics |
| 7 | elite_competition | Elite Competition |
| 7 | kinesiology | Kinesiology |
| 7 | sports_medicine | Sports Medicine Basics |
| 7 | strength_conditioning_prog | Strength & Conditioning Programming |
| 8 | adaptive_athletics | Adaptive Athletics |
| 8 | elite_coaching | Elite Coaching Certification |
| 8 | exercise_prescription | Exercise Prescription |
| 8 | performance_analytics | Performance Analytics |
| 8 | professional_athletics | Professional Athletics |
| 8 | sports_science | Sports Science Research |

## Summary

- Migration nodes total:            658
- Migration edges total:            1097
- 3D tree skills total:             422
- Missing domain in 3D tree:        Science (47 skills)
- Total migration skills missing from 3D tree: 506