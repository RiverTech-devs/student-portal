// Technology data — generated from data/technology_curriculum_v2.json by tools/compile-tech-graph.js. Do not hand-edit.
window.TECH_DATA = {
 "nodes": {
  "T1": {
   "id": "T1",
   "title": "Device Basics",
   "cluster": "Tech: Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Device Basics",
   "mastery_criteria": "Student can power a device on and off safely, log in, launch and close an app, and correctly identify the screen, keyboard, mouse/trackpad, and charging port when prompted.",
   "hard_prereqs": [],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T2": {
   "id": "T2",
   "title": "Digital Navigation",
   "cluster": "Tech: Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Digital Navigation",
   "mastery_criteria": "Student can move between apps and windows, use menus and icons, and navigate a simple folder tree in a guided terminal interface to locate a named item.",
   "hard_prereqs": [
    "T1"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T3": {
   "id": "T3",
   "title": "Keyboarding & Input",
   "cluster": "Tech: Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Keyboarding & Input",
   "mastery_criteria": "Student types short sentences with correct capitalization via Shift and basic punctuation, reaching at least 10 WPM with 90% accuracy in a timed terminal typing challenge.",
   "hard_prereqs": [
    "T2"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T4": {
   "id": "T4",
   "title": "Digital Citizenship",
   "cluster": "Tech: Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Digital Citizenship",
   "mastery_criteria": "Student identifies personal information that should never be shared online, recognizes unkind or unsafe messages in scenarios, and states the correct response when something online feels wrong (stop, don't respond, tell a trusted adult).",
   "hard_prereqs": [
    "T3"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T5": {
   "id": "T5",
   "title": "File Management",
   "cluster": "Tech: Fluency",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "File Management",
   "mastery_criteria": "Student can create, rename, copy, move, and delete files and folders from the command line (mkdir, cp, mv, rm) and organize a messy directory into a sensible folder structure.",
   "hard_prereqs": [
    "T4",
    "T-301"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T6": {
   "id": "T6",
   "title": "Productivity Tools",
   "cluster": "Tech: Fluency",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Productivity Tools",
   "mastery_criteria": "Student produces a formatted document, a structured slide deck, and a spreadsheet with a working formula, all named and organized so a classmate could find and open them.",
   "hard_prereqs": [
    "T5"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Creates a formatted document with headings, images, and page layout",
     "Builds a slide presentation with a clear structure and consistent design",
     "Uses a spreadsheet with labeled columns and at least one working formula",
     "Saves, names, and organizes the files so a classmate could find them"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T7": {
   "id": "T7",
   "title": "Internet Research",
   "cluster": "Tech: Fluency",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Internet Research",
   "mastery_criteria": "Student forms an effective search query, distinguishes a sponsored result from an organic one, and identifies which of several presented sources is most credible for a given question, explaining why in a typed answer.",
   "hard_prereqs": [
    "T6"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T8": {
   "id": "T8",
   "title": "Digital Communication",
   "cluster": "Tech: Fluency",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Digital Communication",
   "mastery_criteria": "Student composes an appropriately-toned message for a given audience (teacher vs. friend) with a clear subject, greeting, and sign-off, and identifies in scenarios when reply-all or forwarding is inappropriate.",
   "hard_prereqs": [
    "T7"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T9": {
   "id": "T9",
   "title": "Algorithmic Thinking",
   "cluster": "Tech: Application",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Algorithmic Thinking",
   "mastery_criteria": "Student orders shuffled steps into a working algorithm, traces a simple algorithm to predict its exact output, and identifies the flawed step in a broken sequence via typed answers.",
   "hard_prereqs": [
    "T8"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T10": {
   "id": "T10",
   "title": "Programming Logic",
   "cluster": "Tech: Application",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Programming Logic",
   "mastery_criteria": "Student writes JavaScript functions using variables, conditionals, and loops that pass all provided test cases, e.g. classifying numbers, summing ranges, and branching on compound conditions.",
   "hard_prereqs": [
    "T9"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T11": {
   "id": "T11",
   "title": "Programming Projects",
   "cluster": "Tech: Application",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Programming Projects",
   "mastery_criteria": "Student completes a multi-function JavaScript program (e.g. a text-adventure turn handler or score tracker) in which several functions work together and all integration test cases pass.",
   "hard_prereqs": [
    "T10"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T12": {
   "id": "T12",
   "title": "Software Design",
   "cluster": "Tech: Integration",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Software Design",
   "mastery_criteria": "Student decomposes a described program into named functions and modules, identifies the inputs and outputs of each, and selects appropriate data structures for stated requirements via typed answers.",
   "hard_prereqs": [
    "T11"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T13": {
   "id": "T13",
   "title": "Debugging & Testing",
   "cluster": "Tech: Integration",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Debugging & Testing",
   "mastery_criteria": "Given broken JavaScript functions, student locates and fixes logic and syntax bugs until all test cases pass, and writes at least one new test case that exposes a described bug.",
   "hard_prereqs": [
    "T12"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T14": {
   "id": "T14",
   "title": "Versioning & Iteration",
   "cluster": "Tech: Integration",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Versioning & Iteration",
   "mastery_criteria": "Student initializes a repository, stages and commits changes with meaningful messages, inspects history with git log, and restores a file to a previous commit, all from the command line.",
   "hard_prereqs": [
    "T13"
   ],
   "soft_deps": [
    "T-301"
   ],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T15": {
   "id": "T15",
   "title": "Systems Integration",
   "cluster": "Tech: Integration",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Systems Integration",
   "mastery_criteria": "Student chains multiple command-line tools with pipes and redirection so the output of one program feeds the next, producing a required end result from raw input files.",
   "hard_prereqs": [
    "T14"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T16": {
   "id": "T16",
   "title": "Engineering Design Process",
   "cluster": "Tech: Integration",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Engineering Design Process",
   "mastery_criteria": "Student carries a design challenge through the full engineering design process — define, ideate, prototype, test, iterate — with documentation produced at every step.",
   "hard_prereqs": [
    "T15"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Defines the problem with explicit constraints and success criteria",
     "Produces and compares at least two candidate designs",
     "Builds and tests a prototype against the stated criteria",
     "Documents iteration: what failed, what changed, and why"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T17": {
   "id": "T17",
   "title": "Independent Build Project",
   "cluster": "Tech: Mastery",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Independent Build Project",
   "mastery_criteria": "Student independently scopes, plans, builds, tests, and presents an original technology project that meets its own stated requirements and survives questioning.",
   "hard_prereqs": [
    "T16"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Scopes an original project with a written plan and milestones",
     "Implements a working build that meets its stated requirements",
     "Tests, debugs, and documents the final product",
     "Presents the project and answers technical questions about it"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T19": {
   "id": "T19",
   "title": "Visual Programming",
   "cluster": "Tech: Application",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Visual Programming",
   "mastery_criteria": "Student builds a working block-based program using sequences, loops, conditionals, variables, and events, and explains what each script stack does when asked.",
   "hard_prereqs": [
    "T10"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Builds a block-based program with sequences, loops, and conditionals",
     "Uses variables and events to control program behavior",
     "Program runs without errors and meets the stated goal",
     "Explains what each script stack does when asked"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T20": {
   "id": "T20",
   "title": "Game Logic",
   "cluster": "Tech: Application",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Game Logic",
   "mastery_criteria": "Student implements game rules as JavaScript functions — win/lose detection, score updates, and turn state transitions — that pass all provided test cases.",
   "hard_prereqs": [
    "T19"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T22": {
   "id": "T22",
   "title": "Web Foundations",
   "cluster": "Tech: Application",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Web Foundations",
   "mastery_criteria": "Student builds a valid HTML page with headings, paragraphs, lists, images, and links, and applies CSS colors, fonts, and spacing that satisfy the DOM assertions.",
   "hard_prereqs": [
    "T10"
   ],
   "soft_deps": [
    "T-SD008"
   ],
   "assess": {
    "type": "quest",
    "module": "web"
   },
   "legacy_subject": "Programming"
  },
  "T25": {
   "id": "T25",
   "title": "Robotics Basics",
   "cluster": "Tech: Application",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Robotics Basics",
   "mastery_criteria": "Student drives a simulated robot through a course using the JS motor API — sequencing forward, turn, and stop commands to reach the goal without collisions.",
   "hard_prereqs": [
    "T10"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Programming"
  },
  "T26": {
   "id": "T26",
   "title": "Sensors & Actuators",
   "cluster": "Tech: Integration",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Sensors & Actuators",
   "mastery_criteria": "Student writes JS that reads simulated sensor values (distance, line, light) and drives actuators in response, e.g. following a line and stopping at an obstacle.",
   "hard_prereqs": [
    "T25"
   ],
   "soft_deps": [
    "T-RB026"
   ],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Programming"
  },
  "T27": {
   "id": "T27",
   "title": "Robotics Engineering",
   "cluster": "Tech: Mastery",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Robotics Engineering",
   "mastery_criteria": "Student designs, builds, and programs a physical robot that reliably completes a defined challenge across repeated runs, documenting iterations and trade-offs.",
   "hard_prereqs": [
    "T26"
   ],
   "soft_deps": [
    "T-RB019"
   ],
   "assess": {
    "type": "project",
    "criteria": [
     "Designs a robot to meet a defined challenge with documented constraints",
     "Integrates mechanical build, wiring, and control code into one working system",
     "Robot completes the challenge task reliably across repeated runs",
     "Documents design iterations and explains engineering trade-offs"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T28": {
   "id": "T28",
   "title": "Digital Media Creation",
   "cluster": "Tech: Fluency",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Digital Media Creation",
   "mastery_criteria": "Student creates and edits an original digital media artifact (image, audio, or video), exports it in a suitable format, and credits any sourced assets.",
   "hard_prereqs": [
    "T6"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Creates an original image, audio, or video artifact with an appropriate tool",
     "Applies at least two editing techniques (crop/trim, layers, transitions)",
     "Exports the artifact in a suitable format and resolution",
     "Credits any sourced assets and respects usage rights"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T29": {
   "id": "T29",
   "title": "Media Production",
   "cluster": "Tech: Application",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Media Production",
   "mastery_criteria": "Student plans, records, edits, and publishes a polished media piece appropriate to a defined audience, using storyboarding before production and editing techniques after.",
   "hard_prereqs": [
    "T28"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Plans the production with a storyboard or script before creating",
     "Records or assembles original footage, audio, or graphics",
     "Edits with cuts, transitions, titles, and level-balanced sound",
     "Publishes a finished piece appropriate to its stated audience"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T31": {
   "id": "T31",
   "title": "Data & Spreadsheets",
   "cluster": "Tech: Application",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Data & Spreadsheets",
   "mastery_criteria": "Student writes SELECT queries with WHERE filters, ORDER BY sorting, LIMIT, and COUNT aggregates over provided tables to answer concrete data questions correctly.",
   "hard_prereqs": [
    "T6"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "sql"
   },
   "legacy_subject": "Programming"
  },
  "T32": {
   "id": "T32",
   "title": "Automation Basics",
   "cluster": "Tech: Integration",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Automation Basics",
   "mastery_criteria": "Student writes a shell script with variables and a loop that automates a repetitive multi-step task (e.g. batch-renaming files or generating a summary report) and runs it successfully.",
   "hard_prereqs": [
    "T31"
   ],
   "soft_deps": [
    "T-301"
   ],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T33": {
   "id": "T33",
   "title": "Advanced Automation",
   "cluster": "Tech: Mastery",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Advanced Automation",
   "mastery_criteria": "Student builds a multi-stage automation pipeline — scripts invoking scripts with arguments, conditionals, error handling, and logging — that processes a dataset end-to-end unattended.",
   "hard_prereqs": [
    "T32"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T-SD001": {
   "id": "T-SD001",
   "title": "Introduction to Operating Systems",
   "cluster": "Software: Core Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "6-8",
   "game_skill": "Introduction to Operating Systems",
   "mastery_criteria": "Student identifies what an operating system does, names its major parts (kernel, file system, processes, user interface), and matches common computing tasks to the OS feature responsible via typed answers.",
   "hard_prereqs": [],
   "soft_deps": [
    "T5"
   ],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD002": {
   "id": "T-SD002",
   "title": "Basic Computer Operations",
   "cluster": "Software: Core Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "6-8",
   "game_skill": "Basic Computer Operations",
   "mastery_criteria": "Student performs core operations from a terminal: printing the working directory, listing contents, launching a program, and checking basic system information with the correct commands.",
   "hard_prereqs": [],
   "soft_deps": [
    "T1"
   ],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T-SD003": {
   "id": "T-SD003",
   "title": "Basic Arithmetic",
   "cluster": "Software: Core Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "6-8",
   "game_skill": "Basic Arithmetic",
   "mastery_criteria": "Student converts values between binary, decimal, and hexadecimal, evaluates integer expressions with correct order of operations, and computes modulo results via typed answers.",
   "hard_prereqs": [],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD004": {
   "id": "T-SD004",
   "title": "Basic Software Tools",
   "cluster": "Software: Basic Programming",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "6-8",
   "game_skill": "Basic Software Tools",
   "mastery_criteria": "Student uses a terminal text editor to create and modify a file, runs a program from the command line, and passes arguments to it to change its behavior.",
   "hard_prereqs": [
    "T-SD001"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T-SD005": {
   "id": "T-SD005",
   "title": "Programming/Basic Theory",
   "cluster": "Software: Basic Programming",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "6-8",
   "game_skill": "Programming/Basic Theory",
   "mastery_criteria": "Student writes JavaScript using variables, data types, operators, and if/else branching, producing small functions that pass all provided test cases.",
   "hard_prereqs": [
    "T-SD002",
    "T-SD003"
   ],
   "soft_deps": [
    "T9"
   ],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD006": {
   "id": "T-SD006",
   "title": "Text Manipulation",
   "cluster": "Software: Basic Programming",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "6-8",
   "game_skill": "Text Manipulation",
   "mastery_criteria": "Student uses grep, sort, uniq, wc, head/tail, and output redirection to search, filter, and transform text files, producing the exact required output.",
   "hard_prereqs": [
    "T-SD003"
   ],
   "soft_deps": [
    "T-301"
   ],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T-SD007": {
   "id": "T-SD007",
   "title": "Basic Database Concepts",
   "cluster": "Software: Intermediate Programming",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Basic Database Concepts",
   "mastery_criteria": "Student explains tables, rows, columns, and keys by writing simple SELECT queries against provided tables and retrieving specific rows with WHERE conditions.",
   "hard_prereqs": [
    "T-SD004"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "sql"
   },
   "legacy_subject": "Programming"
  },
  "T-SD008": {
   "id": "T-SD008",
   "title": "Markup Languages",
   "cluster": "Software: Intermediate Programming",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Markup Languages",
   "mastery_criteria": "Student writes well-formed HTML with correctly nested elements and attributes, demonstrating the difference between document structure and presentation by satisfying the DOM assertions.",
   "hard_prereqs": [
    "T-SD005"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "web"
   },
   "legacy_subject": "Programming"
  },
  "T-SD009": {
   "id": "T-SD009",
   "title": "Object Oriented Programming",
   "cluster": "Software: Intermediate Programming",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "9-10",
   "game_skill": "Object Oriented Programming",
   "mastery_criteria": "Student defines JavaScript classes with constructors, properties, and methods, uses inheritance to extend a base class, and instantiates objects that pass all behavioral test cases.",
   "hard_prereqs": [
    "T-SD005"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD010": {
   "id": "T-SD010",
   "title": "Computer Science Algebra",
   "cluster": "Software: Intermediate Programming",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Computer Science Algebra",
   "mastery_criteria": "Student writes functions that evaluate boolean expressions with AND/OR/NOT, simplify expressions using De Morgan's laws, and compose functions, passing all provided test cases.",
   "hard_prereqs": [
    "T-SD006"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD011": {
   "id": "T-SD011",
   "title": "Introduction to Hardware",
   "cluster": "Software: Intermediate Development",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Introduction to Hardware",
   "mastery_criteria": "Student identifies the CPU, RAM, storage, and I/O components, explains what each contributes to running a program, and diagnoses which component is the bottleneck in described scenarios via typed answers.",
   "hard_prereqs": [
    "T-SD007"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD012": {
   "id": "T-SD012",
   "title": "Intro Computer Science",
   "cluster": "Software: Intermediate Development",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "9-10",
   "game_skill": "Intro Computer Science",
   "mastery_criteria": "Student explains how data is represented in bits and bytes, traces an algorithm step by step to its output, and compares two algorithms' efficiency in plain terms via typed answers.",
   "hard_prereqs": [
    "T-SD008"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD013": {
   "id": "T-SD013",
   "title": "Basic Concepts",
   "cluster": "Software: Intermediate Development",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "9-10",
   "game_skill": "Basic Concepts",
   "mastery_criteria": "Student uses arrays and objects to store structured data, iterates over collections, and writes functions that search, filter, and aggregate collection data, passing all test cases.",
   "hard_prereqs": [
    "T-SD009"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD014": {
   "id": "T-SD014",
   "title": "Console UI Fundamentals",
   "cluster": "Software: Intermediate Development",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Console UI Fundamentals",
   "mastery_criteria": "Student writes programs that read input, validate it, and print formatted output — menus, prompts, and aligned tables — matching the expected console transcripts.",
   "hard_prereqs": [
    "T-SD010"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD015": {
   "id": "T-SD015",
   "title": "Advanced Debugging Techniques",
   "cluster": "Software: Advanced Development",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "9-10",
   "game_skill": "Advanced Debugging Techniques",
   "mastery_criteria": "Given programs with subtle bugs (off-by-one, wrong scope, unintended mutation, ordering errors), student isolates each fault, explains its root cause, and fixes the code so all tests pass.",
   "hard_prereqs": [
    "T-SD011"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD016": {
   "id": "T-SD016",
   "title": "Assembly Language Programming",
   "cluster": "Software: Advanced Development",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "9-10",
   "game_skill": "Assembly Language Programming",
   "mastery_criteria": "Student traces short assembly-style instruction sequences (load, store, add, compare, jump), predicts register and memory contents after execution, and identifies what a given sequence computes via typed answers.",
   "hard_prereqs": [
    "T-SD012"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD017": {
   "id": "T-SD017",
   "title": "SQL",
   "cluster": "Software: Advanced Development",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "9-10",
   "game_skill": "SQL",
   "mastery_criteria": "Student writes SELECT queries combining WHERE with multiple conditions, ORDER BY, LIMIT, and COUNT and other aggregates, answering multi-step data questions across provided tables.",
   "hard_prereqs": [
    "T-SD013"
   ],
   "soft_deps": [
    "T31"
   ],
   "assess": {
    "type": "quest",
    "module": "sql"
   },
   "legacy_subject": "Programming"
  },
  "T-SD018": {
   "id": "T-SD018",
   "title": "Web to Desktop Design",
   "cluster": "Software: Advanced Development",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "9-10",
   "game_skill": "Web to Desktop Design",
   "mastery_criteria": "Student builds page layouts that adapt to different window sizes using containers, spacing, and alignment, applying a consistent visual hierarchy that satisfies the DOM assertions.",
   "hard_prereqs": [
    "T-SD013"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "web"
   },
   "legacy_subject": "Programming"
  },
  "T-SD019": {
   "id": "T-SD019",
   "title": "HTML CSS",
   "cluster": "Software: Advanced Development",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "9-10",
   "game_skill": "HTML CSS",
   "mastery_criteria": "Student builds a complete styled page: semantic HTML structure plus CSS selectors, the box model, colors, and typography, satisfying all DOM and style assertions.",
   "hard_prereqs": [
    "T-SD014"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "web"
   },
   "legacy_subject": "Programming"
  },
  "T-SD020": {
   "id": "T-SD020",
   "title": "JavaScript/jQuery",
   "cluster": "Software: Advanced Development",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "9-10",
   "game_skill": "JavaScript/jQuery",
   "mastery_criteria": "Student writes JavaScript that selects and manipulates DOM-style structures, transforms collections with map and filter, and uses callbacks, passing all provided test cases.",
   "hard_prereqs": [
    "T-SD014"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD021": {
   "id": "T-SD021",
   "title": "Event Driven Programming",
   "cluster": "Software: Advanced Development",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "9-10",
   "game_skill": "Event Driven Programming",
   "mastery_criteria": "Student registers event handlers, manages state across multiple events, and implements conditional responses so simulated event sequences produce the expected outcomes in all test cases.",
   "hard_prereqs": [
    "T-SD014"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD022": {
   "id": "T-SD022",
   "title": "HTML CSS Concepts",
   "cluster": "Software: Web Development",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "HTML CSS Concepts",
   "mastery_criteria": "Student demonstrates the cascade, specificity, inheritance, and box-model behavior by constructing pages whose computed styles match the asserted values.",
   "hard_prereqs": [
    "T-SD019",
    "T-SD020"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "web"
   },
   "legacy_subject": "Programming"
  },
  "T-SD023": {
   "id": "T-SD023",
   "title": "Basic HTML Design",
   "cluster": "Software: Web Development",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Basic HTML Design",
   "mastery_criteria": "Student designs a multi-section page with a header, navigation, content areas, and footer, using classes and a coherent stylesheet that passes the design assertions.",
   "hard_prereqs": [
    "T-SD022"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "web"
   },
   "legacy_subject": "Programming"
  },
  "T-SD024": {
   "id": "T-SD024",
   "title": "HTML to Web Fundamentals",
   "cluster": "Software: Web Development",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "HTML to Web Fundamentals",
   "mastery_criteria": "Student applies how a page is requested, parsed, and rendered — linking external CSS, ordering scripts, and using meta tags correctly so the page satisfies all structure assertions.",
   "hard_prereqs": [
    "T-SD023"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "web"
   },
   "legacy_subject": "Programming"
  },
  "T-SD025": {
   "id": "T-SD025",
   "title": "Building Responsive Websites",
   "cluster": "Software: Web Development",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Building Responsive Websites",
   "mastery_criteria": "Student builds a page that reflows correctly across phone, tablet, and desktop widths using fluid units, flexible layouts, and breakpoints, verified by DOM assertions at each width.",
   "hard_prereqs": [
    "T-SD024"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "web"
   },
   "legacy_subject": "Programming"
  },
  "T-SD026": {
   "id": "T-SD026",
   "title": "Building Interactive Websites",
   "cluster": "Software: Web Development",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Building Interactive Websites",
   "mastery_criteria": "Student wires JavaScript to page elements so clicks, input, and form events update content dynamically — an interactive widget whose behavior passes all simulated-event test cases.",
   "hard_prereqs": [
    "T-SD025"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD027": {
   "id": "T-SD027",
   "title": "Systems and Application Programming",
   "cluster": "Software: Systems Programming",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Systems and Application Programming",
   "mastery_criteria": "Student manages processes from the terminal (run, background, list, kill), inspects environment variables, and writes scripts that combine system utilities to complete multi-step tasks.",
   "hard_prereqs": [
    "T-SD015"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T-SD028": {
   "id": "T-SD028",
   "title": "Operating System Fundamentals",
   "cluster": "Software: Systems Programming",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Operating System Fundamentals",
   "mastery_criteria": "Student explains processes vs. threads, virtual memory, file-system permissions, and scheduling, and diagnoses OS-level problems from described symptoms or command output via typed answers.",
   "hard_prereqs": [
    "T-SD027"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD029": {
   "id": "T-SD029",
   "title": "Cybersecurity Pathways",
   "cluster": "Software: Systems Programming",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Cybersecurity Pathways",
   "mastery_criteria": "Student identifies common attack types (phishing, injection, brute force), reads simulated logs to spot an intrusion, and selects the correct defense (hashing, least privilege, patching) via typed answers.",
   "hard_prereqs": [
    "T-SD028"
   ],
   "soft_deps": [
    "T-303"
   ],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD030": {
   "id": "T-SD030",
   "title": "Advanced Systems Programming",
   "cluster": "Software: Systems Programming",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Advanced Systems Programming",
   "mastery_criteria": "Student writes advanced shell programs using functions, traps, exit-code handling, and process substitution to build robust command-line tools that pass all behavioral checks.",
   "hard_prereqs": [
    "T-SD029",
    "T29"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T-SD031": {
   "id": "T-SD031",
   "title": "Systems and Application Automation",
   "cluster": "Software: Systems Programming",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Systems and Application Automation",
   "mastery_criteria": "Student automates a recurring workflow end-to-end: a parameterized script suite with scheduling logic, logging, and failure recovery that runs correctly against provided scenarios.",
   "hard_prereqs": [
    "T-SD030"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T-SD032": {
   "id": "T-SD032",
   "title": "Industrial Automation",
   "cluster": "Software: Systems Programming",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Industrial Automation",
   "mastery_criteria": "Student implements an automated control system for an industrial-style process with sensing, decision logic, actuation, safe failure handling, and operator documentation.",
   "hard_prereqs": [
    "T-SD031"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Designs an automated control workflow for a real or simulated industrial process",
     "Implements sensing, decision logic, and actuation with appropriate tooling",
     "Demonstrates safe failure handling and an emergency stop path",
     "Documents the system so an operator could run and troubleshoot it"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T-SD033": {
   "id": "T-SD033",
   "title": "Software Engineering",
   "cluster": "Software: Software Engineering",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Software Engineering",
   "mastery_criteria": "Student explains the software lifecycle (requirements, design, implementation, testing, maintenance), writes acceptance criteria for a described feature, and identifies which practice failed in post-mortem scenarios via typed answers.",
   "hard_prereqs": [
    "T-SD016"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD034": {
   "id": "T-SD034",
   "title": "Advanced Software Development",
   "cluster": "Software: Software Engineering",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Advanced Software Development",
   "mastery_criteria": "Student builds a multi-module program with clear interfaces, input validation, and error handling whose components pass both unit and integration test cases.",
   "hard_prereqs": [
    "T-SD033"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD035": {
   "id": "T-SD035",
   "title": "Building Scalable Applications",
   "cluster": "Software: Software Engineering",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Building Scalable Applications",
   "mastery_criteria": "Student explains caching, load balancing, horizontal vs. vertical scaling, and stateless design, and selects the right scaling remedy for described performance bottlenecks via typed answers.",
   "hard_prereqs": [
    "T-SD034"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD036": {
   "id": "T-SD036",
   "title": "Software Architecture",
   "cluster": "Software: Software Engineering",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Software Architecture",
   "mastery_criteria": "Student compares architectural styles (layered, client-server, microservices, event-driven), justifies an architecture choice for a described system, and identifies coupling problems in a given design via typed answers.",
   "hard_prereqs": [
    "T-SD035"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD037": {
   "id": "T-SD037",
   "title": "Application Security",
   "cluster": "Software: Software Engineering",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Application Security",
   "mastery_criteria": "Student identifies vulnerabilities in described code and requests (injection, XSS, insecure storage, broken auth), names the correct mitigation for each, and orders a secure development checklist via typed answers.",
   "hard_prereqs": [
    "T-SD036"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD038": {
   "id": "T-SD038",
   "title": "Modern Software Practices",
   "cluster": "Software: Software Engineering",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Modern Software Practices",
   "mastery_criteria": "Student demonstrates modern practice by shipping a change through version control with branching, automated CI tests, a code review, and agile task tracking.",
   "hard_prereqs": [
    "T-SD037"
   ],
   "soft_deps": [
    "T14"
   ],
   "assess": {
    "type": "project",
    "criteria": [
     "Works from a versioned repository with branching and meaningful commits",
     "Sets up automated tests that run on every change (CI)",
     "Conducts and responds to a code review with documented changes",
     "Ships an increment using an agile board with tracked tasks"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T-SD039": {
   "id": "T-SD039",
   "title": "Front-End Development",
   "cluster": "Software: Full Stack Development",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Front-End Development",
   "mastery_criteria": "Student builds a complete front-end interface — semantic structure, styled components, and layout — implementing a provided design spec so that all DOM assertions pass.",
   "hard_prereqs": [
    "T-SD018"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "web"
   },
   "legacy_subject": "Programming"
  },
  "T-SD040": {
   "id": "T-SD040",
   "title": "Back-End Development",
   "cluster": "Software: Full Stack Development",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Back-End Development",
   "mastery_criteria": "Student implements server-side logic as functions: routing requests to handlers, validating payloads, and returning correct structured responses across all provided test scenarios.",
   "hard_prereqs": [
    "T-SD017"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD041": {
   "id": "T-SD041",
   "title": "Full-Stack Development",
   "cluster": "Software: Full Stack Development",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Full-Stack Development",
   "mastery_criteria": "Student builds and demos a working full-stack application: a front end communicating with a real back end and database, with graceful error handling end-to-end.",
   "hard_prereqs": [
    "T-SD039",
    "T-SD040"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Builds a working front end that communicates with a real back end",
     "Persists data in a database with sensible schema design",
     "Handles errors and invalid input gracefully across the stack",
     "Deploys or demos the application end-to-end and explains its architecture"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T-SD042": {
   "id": "T-SD042",
   "title": "Web Development Pathways",
   "cluster": "Software: Full Stack Development",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Web Development Pathways",
   "mastery_criteria": "Student maps the modern web ecosystem — frameworks, build tools, hosting models, and professional roles — and recommends an appropriate stack with justification for described project scenarios via typed answers.",
   "hard_prereqs": [
    "T-SD041",
    "T22"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD043": {
   "id": "T-SD043",
   "title": "Cloud Computing and DevOps",
   "cluster": "Software: Full Stack Development",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Cloud Computing and DevOps",
   "mastery_criteria": "Student explains IaaS/PaaS/SaaS, containers, CI/CD pipelines, and infrastructure-as-code, and diagnoses deployment failures from described pipeline output via typed answers.",
   "hard_prereqs": [
    "T-SD042"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD044": {
   "id": "T-SD044",
   "title": "Advanced Cloud Development",
   "cluster": "Software: Full Stack Development",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Advanced Cloud Development",
   "mastery_criteria": "Student deploys an application to a real cloud platform with automated CI/CD, working monitoring or logging, and documented scaling and rollback procedures.",
   "hard_prereqs": [
    "T-SD043"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Deploys an application to a real cloud provider or equivalent platform",
     "Configures automated build and deployment triggered by commits",
     "Implements monitoring or logging with a demonstrated alert or dashboard",
     "Documents costs, scaling behavior, and rollback procedure"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T-SD045": {
   "id": "T-SD045",
   "title": "Intro to Game Programming",
   "cluster": "Software: Game Development",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Intro to Game Programming",
   "mastery_criteria": "Student implements core game-loop logic in JavaScript — updating positions, detecting collisions, and tracking score and lives per tick — passing all simulation test cases.",
   "hard_prereqs": [
    "T-SD021"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD046": {
   "id": "T-SD046",
   "title": "Service Oriented Architecture",
   "cluster": "Software: Game Development",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Service Oriented Architecture",
   "mastery_criteria": "Student explains services, APIs, contracts, and message passing, decomposes a described monolith into sensible services, and identifies where a described service boundary leaks via typed answers.",
   "hard_prereqs": [
    "T-SD045"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD047": {
   "id": "T-SD047",
   "title": "Advanced Game Programming",
   "cluster": "Software: Game Development",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Advanced Game Programming",
   "mastery_criteria": "Student implements advanced game systems — state machines for entity behavior, simple pathfinding or physics steps, and difficulty scaling — that pass all simulation test cases.",
   "hard_prereqs": [
    "T-SD046"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD048": {
   "id": "T-SD048",
   "title": "Game Engine Development",
   "cluster": "Software: Game Development",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Game Engine Development",
   "mastery_criteria": "Student builds or extends a real engine-level system (rendering loop, entity system, or physics) and demonstrates it running a small playable scene with a documented performance improvement.",
   "hard_prereqs": [
    "T-SD047",
    "T20"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Builds or extends an engine-level system (rendering loop, entity system, or physics)",
     "Demonstrates the system running a small playable scene",
     "Profiles and documents at least one performance improvement",
     "Explains the engine architecture and its main trade-offs"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T-SD049": {
   "id": "T-SD049",
   "title": "Mobile App Development",
   "cluster": "Software: Game Development",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Mobile App Development",
   "mastery_criteria": "Student builds and runs a multi-screen mobile app on a device or emulator, with working navigation, persistent data across restarts, and platform-appropriate UI.",
   "hard_prereqs": [
    "T-SD048"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Builds a mobile app with multiple screens and working navigation",
     "Handles user input and persists data across app restarts",
     "Runs the app on a real device or emulator without crashes",
     "Follows platform UI conventions and documents the build process"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T-SD050": {
   "id": "T-SD050",
   "title": "Game Design Principles",
   "cluster": "Software: Game Development",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Game Design Principles",
   "mastery_criteria": "Student produces a game design document, prototypes a playable slice expressing the core mechanic, runs a playtest, and iterates the design from recorded feedback.",
   "hard_prereqs": [
    "T-SD049"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Produces a design document defining mechanics, goals, and player experience",
     "Prototypes a playable slice that expresses the core mechanic",
     "Runs a playtest and records structured feedback",
     "Iterates the design based on feedback with documented changes"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T-SD051": {
   "id": "T-SD051",
   "title": "Data Science and Machine Learning",
   "cluster": "Software: Data Science",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Data Science and Machine Learning",
   "mastery_criteria": "Student explains the data-science workflow (collect, clean, explore, model, evaluate), distinguishes supervised from unsupervised learning, and matches problem descriptions to appropriate ML task types via typed answers.",
   "hard_prereqs": [
    "T-SD017"
   ],
   "soft_deps": [
    "T31"
   ],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-SD052": {
   "id": "T-SD052",
   "title": "Statistical Analysis",
   "cluster": "Software: Data Science",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Statistical Analysis",
   "mastery_criteria": "Student implements statistical functions — mean, median, variance, standard deviation, and correlation — and applies them to provided datasets, passing all numeric test cases.",
   "hard_prereqs": [
    "T-SD051"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD053": {
   "id": "T-SD053",
   "title": "Machine Learning Algorithms",
   "cluster": "Software: Data Science",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Machine Learning Algorithms",
   "mastery_criteria": "Student implements simple learning algorithms from scratch — k-nearest-neighbors classification and single-variable linear regression via gradient steps — whose predictions pass all test tolerances.",
   "hard_prereqs": [
    "T-SD052"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "js"
   },
   "legacy_subject": "Programming"
  },
  "T-SD054": {
   "id": "T-SD054",
   "title": "Deep Learning",
   "cluster": "Software: Data Science",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "11-12",
   "game_skill": "Deep Learning",
   "mastery_criteria": "Student trains and evaluates a neural network on a real dataset using an established framework, documenting architecture, hyperparameters, metrics, and failure cases.",
   "hard_prereqs": [
    "T-SD053"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Prepares and splits a real dataset for training and evaluation",
     "Trains a neural network with an established framework",
     "Evaluates the model with appropriate metrics and a baseline comparison",
     "Documents architecture, hyperparameters, and failure cases"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T-SD055": {
   "id": "T-SD055",
   "title": "AI Development",
   "cluster": "Software: Data Science",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "AI Development",
   "mastery_criteria": "Student builds an application that integrates a trained or hosted AI model, with output-quality evaluation, guardrails for bad outputs, and documented limitations and ethics considerations.",
   "hard_prereqs": [
    "T-SD054"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Builds an application that integrates a trained or hosted AI model",
     "Designs the interface between user input, model, and output handling",
     "Evaluates output quality and implements guardrails for bad outputs",
     "Documents limitations, ethics considerations, and intended use"
    ]
   },
   "legacy_subject": "Programming"
  },
  "T-SD056": {
   "id": "T-SD056",
   "title": "Advanced Machine Learning",
   "cluster": "Software: Data Science",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Advanced Machine Learning",
   "mastery_criteria": "Student explains regularization, overfitting vs. underfitting, ensemble methods, and modern architectures (CNNs, transformers), and selects the correct remedy for described training pathologies via typed answers.",
   "hard_prereqs": [
    "T-SD055"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-301": {
   "id": "T-301",
   "title": "Command Line Basics",
   "cluster": "Tech: Fluency",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Command Line Basics",
   "mastery_criteria": "Student can open a terminal, read the prompt, run commands with arguments and flags, use --help to discover options, and recover from a mistyped command.",
   "hard_prereqs": [
    "T2"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T-302": {
   "id": "T-302",
   "title": "Regular Expressions",
   "cluster": "Tech: Application",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "9-10",
   "game_skill": "Regular Expressions",
   "mastery_criteria": "Student writes regular expressions with character classes, anchors, quantifiers, and groups to search and extract patterns from text files using grep and sed.",
   "hard_prereqs": [
    "T-SD006"
   ],
   "soft_deps": [
    "T-301"
   ],
   "assess": {
    "type": "quest",
    "module": "shell"
   },
   "legacy_subject": "Programming"
  },
  "T-303": {
   "id": "T-303",
   "title": "How the Internet Works",
   "cluster": "Tech: Application",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "How the Internet Works",
   "mastery_criteria": "Student explains IP addresses, DNS, packets, and client-server request flow, and interprets simulated ping and traceroute output to diagnose where a connection fails via typed answers.",
   "hard_prereqs": [
    "T7"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Programming"
  },
  "T-RB001": {
   "id": "T-RB001",
   "title": "Mechanics Basics",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "3-5",
   "game_skill": "Mechanics Basics",
   "mastery_criteria": "Student answers typed questions identifying simple machines (lever, wheel and axle, pulley, inclined plane) and explains how each trades force for distance in a described mechanism.",
   "hard_prereqs": [],
   "soft_deps": [
    "T25"
   ],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB002": {
   "id": "T-RB002",
   "title": "Circuits Basics",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "6-8",
   "game_skill": "Circuits Basics",
   "mastery_criteria": "Student answers typed questions tracing a battery-switch-LED circuit, identifying what makes a complete circuit, and predicting whether described circuits will light.",
   "hard_prereqs": [],
   "soft_deps": [
    "T25"
   ],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB003": {
   "id": "T-RB003",
   "title": "Coding Basics",
   "cluster": "Robotics: Code Commander",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "6-8",
   "game_skill": "Coding Basics",
   "mastery_criteria": "In the terminal simulator, student writes a short program using print(), variables, and wait() that runs without errors and produces the requested output sequence.",
   "hard_prereqs": [],
   "soft_deps": [
    "T25"
   ],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB004": {
   "id": "T-RB004",
   "title": "Design Basics",
   "cluster": "Robotics: Tech Designer",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "3-5",
   "game_skill": "Design Basics",
   "mastery_criteria": "Student answers typed questions ordering the steps of the engineering design process and distinguishing criteria from constraints in described design scenarios.",
   "hard_prereqs": [],
   "soft_deps": [
    "T25"
   ],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB005": {
   "id": "T-RB005",
   "title": "Innovation Basics",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "6-8",
   "game_skill": "Innovation Basics",
   "mastery_criteria": "Student answers typed questions distinguishing problems from solutions, identifying user needs in described scenarios, and correctly ordering iterate-test-improve steps.",
   "hard_prereqs": [],
   "soft_deps": [
    "T25"
   ],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB006": {
   "id": "T-RB006",
   "title": "Frame Build",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Frame Build",
   "mastery_criteria": "Student builds a rigid rectangular frame from kit parts that holds its shape when lifted, shaken, and pressed on each corner.",
   "hard_prereqs": [
    "T-RB001"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Joints fully seated and fasteners tight",
     "Frame stays square and rigid under press and shake test",
     "Part selection appropriate to size and load",
     "Build completed safely with an organized workspace"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB007": {
   "id": "T-RB007",
   "title": "Axles & Wheels",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Axles & Wheels",
   "mastery_criteria": "Student assembles a wheeled base with two free-spinning axles that rolls straight for at least 2 meters when pushed.",
   "hard_prereqs": [
    "T-RB001"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Axles mounted parallel and spinning freely",
     "Wheels secured with no wobble",
     "Base rolls straight for 2 meters when pushed",
     "Student explains the roles of axle vs wheel when asked"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB008": {
   "id": "T-RB008",
   "title": "Motion Device",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Motion Device",
   "mastery_criteria": "Student builds a device that converts one type of motion into another (e.g., rotary crank to linear slider) and demonstrates it operating smoothly through 10 cycles.",
   "hard_prereqs": [
    "T-RB001"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Motion conversion works as intended (e.g., rotary to linear)",
     "Runs 10 cycles smoothly without jamming",
     "Parts aligned and securely fastened",
     "Student explains how the mechanism converts motion"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB009": {
   "id": "T-RB009",
   "title": "Build Stability",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Build Stability",
   "mastery_criteria": "Student modifies an unstable structure with bracing and a wider or lower base so it survives a tilt-and-bump test, and explains which change mattered most.",
   "hard_prereqs": [
    "T-RB006"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Correctly identifies why the original build tips",
     "Bracing and base changes address the diagnosed cause",
     "Modified build passes tilt and bump test",
     "Student explains which change contributed most to stability"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB010": {
   "id": "T-RB010",
   "title": "Gears & Torque",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Gears & Torque",
   "mastery_criteria": "Student computes gear ratios and resulting output speed and torque for described two-gear and compound gear trains, and selects the correct train for a stated speed-vs-torque goal.",
   "hard_prereqs": [
    "T-RB006",
    "T-RB008",
    "T-RB011"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB011": {
   "id": "T-RB011",
   "title": "Axle Compare",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Axle Compare",
   "mastery_criteria": "Student compares fixed vs free axle setups and different axle diameters in typed answers, predicting which configuration rolls farther or carries more load and justifying why.",
   "hard_prereqs": [
    "T-RB007"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB012": {
   "id": "T-RB012",
   "title": "Cranks & Pulleys",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Cranks & Pulleys",
   "mastery_criteria": "Student builds a working crank-driven pulley system that lifts a small load, and demonstrates how changing pulley count changes the effort required.",
   "hard_prereqs": [
    "T-RB010"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Crank turns smoothly and drives the pulley system",
     "System lifts the target load reliably",
     "Belt or string routing is correct with proper tension",
     "Student demonstrates how pulley count changes required effort"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB013": {
   "id": "T-RB013",
   "title": "2-Joint Arm",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "2-Joint Arm",
   "mastery_criteria": "Student builds a two-joint mechanical arm that can reach into a target zone with both joints moving independently and without binding.",
   "hard_prereqs": [
    "T-RB009",
    "T-RB012"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Both joints articulate independently",
     "Arm reaches and touches or grips the target zone",
     "Structure supports its own weight without sagging",
     "Joints move smoothly without binding"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB014": {
   "id": "T-RB014",
   "title": "Gear Integration",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Gear Integration",
   "mastery_criteria": "Student integrates a gear train into an existing build to change its output speed or torque, and demonstrates the measurable before/after difference.",
   "hard_prereqs": [
    "T-RB013"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Gear train correctly meshed and secured",
     "Achieves the intended speed or torque change",
     "Integration does not compromise the original build",
     "Student demonstrates and explains the before/after difference"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB015": {
   "id": "T-RB015",
   "title": "Walker/Biped",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Walker/Biped",
   "mastery_criteria": "Student builds a linkage-driven walker or biped that travels at least 1 meter under motor or crank power without falling over.",
   "hard_prereqs": [
    "T-RB014"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Walker travels 1 meter without falling",
     "Linkages produce a stable, repeating gait",
     "Weight distribution keeps balance through the stride",
     "Mechanism survives repeated runs without loosening"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB016": {
   "id": "T-RB016",
   "title": "Balance & Springs",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Balance & Springs",
   "mastery_criteria": "Student adds counterweights or springs to a mechanism so it stays balanced through its full motion, demonstrating the failure before and the stability after.",
   "hard_prereqs": [
    "T-RB015"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Correctly diagnoses the source of imbalance",
     "Counterweight or spring placement is effective",
     "Mechanism stays stable through its full range of motion",
     "Student demonstrates failure-before vs stability-after"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB017": {
   "id": "T-RB017",
   "title": "Materials Choice",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Materials Choice",
   "mastery_criteria": "Student reasons in typed answers about trade-offs (weight, strength, stiffness, cost) among wood, plastic, aluminum, and steel for described robot parts, choosing and justifying a material for each.",
   "hard_prereqs": [
    "T-RB015"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB018": {
   "id": "T-RB018",
   "title": "Real-World Chassis",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Real-World Chassis",
   "mastery_criteria": "Student designs and builds a robot chassis for a stated real-world task (payload, terrain, size limits) and demonstrates it meeting the constraints.",
   "hard_prereqs": [
    "T-RB016",
    "T-RB017"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Chassis meets stated size and payload constraints",
     "Structure handles the target terrain or task in a live demo",
     "Design choices are justified against the requirements",
     "Clean construction: secure fasteners, no part interference"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB019": {
   "id": "T-RB019",
   "title": "Mech-Control Integr.",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Mech-Control Integr.",
   "mastery_criteria": "Student integrates mechanism, circuit, and code into one machine in which a program-controlled motor drives a mechanical subsystem to complete a defined task.",
   "hard_prereqs": [
    "T-RB018",
    "T-RB042",
    "T-RB072"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Mechanism, circuit, and code each function correctly",
     "Integrated system completes the task end to end",
     "Interfaces (mounts, wiring, control signals) are robust",
     "Student explains the flow of signal and force through the system"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB020": {
   "id": "T-RB020",
   "title": "Test Iteration",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Test Iteration",
   "mastery_criteria": "Student runs a structured test-fail-fix cycle on a build, documenting at least three test rounds with the failure found and the fix applied in each.",
   "hard_prereqs": [
    "T-RB018"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "At least three documented test rounds",
     "Each failure clearly identified with evidence",
     "Each fix targets the identified failure",
     "Final version measurably improved over the first"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB021": {
   "id": "T-RB021",
   "title": "Labeled Mechanism",
   "cluster": "Robotics: Mechanical Maker",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Labeled Mechanism",
   "mastery_criteria": "Student produces a labeled diagram of a mechanism they built, naming each part and annotating the force and motion paths, then walks a reviewer through it.",
   "hard_prereqs": [
    "T-RB020"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "All parts named correctly on the diagram",
     "Force and motion paths annotated accurately",
     "Diagram is legible and reasonably proportioned",
     "Student walks a reviewer through the mechanism clearly"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB022": {
   "id": "T-RB022",
   "title": "Components ID",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Components ID",
   "mastery_criteria": "Student identifies resistors, LEDs, capacitors, switches, motors, and batteries from typed descriptions and states the job each component does in a circuit.",
   "hard_prereqs": [
    "T-RB002"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB023": {
   "id": "T-RB023",
   "title": "Electricity Flow",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Electricity Flow",
   "mastery_criteria": "Student explains the relationship between current, voltage, and resistance and solves basic Ohm's law problems (V = IR) for described circuits.",
   "hard_prereqs": [
    "T-RB002"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB024": {
   "id": "T-RB024",
   "title": "LED Switch",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "LED Switch",
   "mastery_criteria": "Student wires a physical battery, switch, resistor, and LED circuit that reliably turns on and off, and traces its current path aloud.",
   "hard_prereqs": [
    "T-RB002"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Circuit wired correctly with a resistor protecting the LED",
     "Switch reliably turns the LED on and off",
     "Correct polarity throughout the circuit",
     "Student traces the current path aloud"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB025": {
   "id": "T-RB025",
   "title": "Breadboard Use",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Breadboard Use",
   "mastery_criteria": "Student builds a multi-component circuit on a breadboard from a schematic, using rows and power rails correctly.",
   "hard_prereqs": [
    "T-RB022",
    "T-RB023",
    "T-RB024"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Correct use of breadboard rows and power rails",
     "Circuit matches the given schematic",
     "Neat wiring with appropriate jumper lengths",
     "Circuit works on first power-up or after a self-directed fix"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB026": {
   "id": "T-RB026",
   "title": "Sensor Read",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Sensor Read",
   "mastery_criteria": "Student wires a sensor (light, distance, or button) into a circuit and demonstrates its readings changing as the environment changes.",
   "hard_prereqs": [
    "T-RB025"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Sensor wired with correct power and signal connections",
     "Readings observed and change with the environment",
     "Student explains what the sensor values represent",
     "Demonstrates both a high and a low reading condition"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB027": {
   "id": "T-RB027",
   "title": "Multimeter Use",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Multimeter Use",
   "mastery_criteria": "Student measures voltage, current, and resistance at labeled test points with a multimeter, using the correct mode, range, and probe placement for each.",
   "hard_prereqs": [
    "T-RB025"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Correct meter mode and range chosen for each measurement",
     "Probes placed correctly (series for current, parallel for voltage)",
     "Readings recorded accurately at each labeled test point",
     "Safe practice: correct lead sockets, no shorted probes"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB028": {
   "id": "T-RB028",
   "title": "Servo Drive",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Servo Drive",
   "mastery_criteria": "Student wires and powers a servo or DC motor with an appropriate driver and power source, demonstrating controlled movement in both directions.",
   "hard_prereqs": [
    "T-RB025"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Motor or servo wired with appropriate power and driver",
     "Controlled motion demonstrated in both directions",
     "No overheating or brownout during the demo",
     "Student explains why the driver and power choices were needed"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB029": {
   "id": "T-RB029",
   "title": "Sensor Logic",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Sensor Logic",
   "mastery_criteria": "In the robot simulator, student writes code that reads a sensor and produces different output behaviors across at least three threshold-based conditions.",
   "hard_prereqs": [
    "T-RB026"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB030": {
   "id": "T-RB030",
   "title": "Light/Sound React",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Light/Sound React",
   "mastery_criteria": "Student builds a circuit that reacts to light or sound (e.g., a buzzer that triggers in the dark) and demonstrates the working sense-and-respond loop.",
   "hard_prereqs": [
    "T-RB026"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Circuit responds correctly to the target stimulus",
     "Threshold or sensitivity tuned for reliable triggering",
     "Clean, traceable wiring on the breadboard",
     "Student explains the sense-to-respond chain"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB031": {
   "id": "T-RB031",
   "title": "Sensor Toggle",
   "cluster": "Robotics: Code Commander",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Sensor Toggle",
   "mastery_criteria": "Student writes robot code in which a sensor event toggles a persistent state (e.g., a button press flips an LED mode on/off) using a state variable.",
   "hard_prereqs": [
    "T-RB026",
    "T-RB046",
    "T-RB049"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB032": {
   "id": "T-RB032",
   "title": "Motor+Sensor Circuit",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Motor+Sensor Circuit",
   "mastery_criteria": "Student builds a combined physical circuit in which a sensor input controls a motor's behavior, and demonstrates it working live across repeated trials.",
   "hard_prereqs": [
    "T-RB028",
    "T-RB029"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Sensor input measurably controls the motor behavior",
     "Wiring correct with proper power separation and protection",
     "Behavior reliable across repeated trials",
     "Student explains the control path from sensor to motor"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB033": {
   "id": "T-RB033",
   "title": "Power Budget",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Power Budget",
   "mastery_criteria": "Student computes the total current draw of a described multi-component robot, compares it to battery capacity to estimate runtime, and flags over-budget designs.",
   "hard_prereqs": [
    "T-RB027",
    "T-RB035"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB034": {
   "id": "T-RB034",
   "title": "Sensor Control",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Sensor Control",
   "mastery_criteria": "Student builds and demonstrates a closed-loop rig in which sensor readings continuously adjust an actuator (e.g., a motor slows as an object gets closer).",
   "hard_prereqs": [
    "T-RB031",
    "T-RB032"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Actuator responds continuously to sensor changes",
     "Response is tuned: no oscillation or dead spots",
     "Demonstration covers the full sensor range",
     "Student explains the feedback loop"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB035": {
   "id": "T-RB035",
   "title": "Regulators & Polarity",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Regulators & Polarity",
   "mastery_criteria": "Student explains in typed answers why voltage regulators are needed, selects a regulator for described voltage rails, and predicts the effect of reversed polarity plus how to protect against it.",
   "hard_prereqs": [
    "T-RB032"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB036": {
   "id": "T-RB036",
   "title": "Alarm Device",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Alarm Device",
   "mastery_criteria": "Student builds a working alarm device that senses a trigger condition and produces a clear alert, with no false alarms during a normal-conditions demo.",
   "hard_prereqs": [
    "T-RB030",
    "T-RB035"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Alarm triggers reliably on the target condition",
     "No false alarms under normal conditions during the demo",
     "Alert output (sound or light) is clear and unmistakable",
     "Device is securely constructed and self-contained"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB037": {
   "id": "T-RB037",
   "title": "Transistors/Relays",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Transistors/Relays",
   "mastery_criteria": "Student wires a transistor or relay so that a small control signal switches a larger load, demonstrating low-power control of a high-power device.",
   "hard_prereqs": [
    "T-RB033"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Transistor or relay wired correctly, with protection diode where needed",
     "A small control signal switches the larger load in the demo",
     "Load power appropriately isolated from the control side",
     "Student explains why driving the load directly would fail"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB038": {
   "id": "T-RB038",
   "title": "Multi-Load Power",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Multi-Load Power",
   "mastery_criteria": "Student analyzes described circuits powering multiple loads, computing current per branch in series vs parallel arrangements and choosing the wiring that keeps every load at its rated voltage.",
   "hard_prereqs": [
    "T-RB037"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB039": {
   "id": "T-RB039",
   "title": "Soldering",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "9-10",
   "game_skill": "Soldering",
   "mastery_criteria": "Student solders through-hole connections that are shiny and secure, passing both a tug test and a continuity test, with safe iron handling throughout.",
   "hard_prereqs": [
    "T-RB038"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Joints are shiny, wetted, and fully cover the pad or lead",
     "Joints pass a tug test and a continuity test",
     "No solder bridges, cold joints, or lifted pads",
     "Safe iron handling and workspace practice throughout"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB040": {
   "id": "T-RB040",
   "title": "Autonomous Power",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "9-10",
   "game_skill": "Autonomous Power",
   "mastery_criteria": "Student builds an untethered battery-powered system with switch, regulation, and safe wiring that runs a robot standalone for the full demonstration task.",
   "hard_prereqs": [
    "T-RB038"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "System runs untethered on battery power",
     "Power switch and regulation wired correctly",
     "Wiring secured with strain relief and insulation",
     "Runtime is adequate for the demonstration task"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB041": {
   "id": "T-RB041",
   "title": "Enclosure Build",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "9-10",
   "game_skill": "Enclosure Build",
   "mastery_criteria": "Student designs and builds an enclosure that houses their circuit with secure mounting, strain relief, and outside access to controls and ports.",
   "hard_prereqs": [
    "T-RB039",
    "T-RB040"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Enclosure fits and protects all components",
     "Mounting prevents movement; cables have strain relief",
     "Controls and ports are accessible from outside",
     "Clean finish with no sharp edges or pinch points"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB042": {
   "id": "T-RB042",
   "title": "Circuit Diagram",
   "cluster": "Robotics: Electric Explorer",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "9-10",
   "game_skill": "Circuit Diagram",
   "mastery_criteria": "Student draws a standard-symbol schematic of a working circuit they built that is complete and correct enough for another student to rebuild it.",
   "hard_prereqs": [
    "T-RB039"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Standard schematic symbols used correctly",
     "Diagram topology matches the physical circuit",
     "Component values and labels are complete",
     "Another student could rebuild the circuit from the diagram alone"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB043": {
   "id": "T-RB043",
   "title": "Starter Code",
   "cluster": "Robotics: Code Commander",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Starter Code",
   "mastery_criteria": "Student modifies provided starter code for the simulated robot to change its behavior as specified (e.g., different speed and message) and runs it successfully.",
   "hard_prereqs": [
    "T-RB003"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB044": {
   "id": "T-RB044",
   "title": "Inputs ID",
   "cluster": "Robotics: Code Commander",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Inputs ID",
   "mastery_criteria": "Student identifies, from typed descriptions, which robot components are inputs vs outputs and states what data each sensor supplies to a program.",
   "hard_prereqs": [
    "T-RB003"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB045": {
   "id": "T-RB045",
   "title": "Parameter Tuning",
   "cluster": "Robotics: Code Commander",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Parameter Tuning",
   "mastery_criteria": "Student tunes numeric parameters (motor power, delays, thresholds) in a given robot program until the simulated robot completes the course within the stated tolerance.",
   "hard_prereqs": [
    "T-RB003"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB046": {
   "id": "T-RB046",
   "title": "If/Else & Loops",
   "cluster": "Robotics: Code Commander",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "If/Else & Loops",
   "mastery_criteria": "Student writes robot code using if/else branches and loops so the simulated robot repeats an action and changes behavior based on a sensor condition.",
   "hard_prereqs": [
    "T-RB043"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB047": {
   "id": "T-RB047",
   "title": "Debug Syntax",
   "cluster": "Robotics: Code Commander",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Debug Syntax",
   "mastery_criteria": "Student fixes all syntax and simple logic errors in a broken robot program so that it runs and produces the specified behavior in the simulator.",
   "hard_prereqs": [
    "T-RB043"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB048": {
   "id": "T-RB048",
   "title": "Blink LED",
   "cluster": "Robotics: Code Commander",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Blink LED",
   "mastery_criteria": "Student writes a program that blinks the simulated robot's LED on a 1-second cycle using a loop and wait() timing calls.",
   "hard_prereqs": [
    "T-RB043"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB049": {
   "id": "T-RB049",
   "title": "Input → Output",
   "cluster": "Robotics: Code Commander",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Input → Output",
   "mastery_criteria": "Student writes a program in which a sensor reading directly drives an output (e.g., the LED turns on when readSensor(\"light\") drops below a threshold).",
   "hard_prereqs": [
    "T-RB044",
    "T-RB045"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB050": {
   "id": "T-RB050",
   "title": "Functions",
   "cluster": "Robotics: Code Commander",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Functions",
   "mastery_criteria": "Student refactors robot code into named functions with parameters (e.g., driveForward(power, ms)) and calls them to complete a multi-step task.",
   "hard_prereqs": [
    "T-RB046"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB051": {
   "id": "T-RB051",
   "title": "Serial Monitor",
   "cluster": "Robotics: Code Commander",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Serial Monitor",
   "mastery_criteria": "Student instruments a robot program with print() logging of sensor values and state changes, then uses the log to explain the program's behavior.",
   "hard_prereqs": [
    "T-RB047"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB052": {
   "id": "T-RB052",
   "title": "Libraries",
   "cluster": "Robotics: Code Commander",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Libraries",
   "mastery_criteria": "Student uses provided library/helper modules in the simulator, calling their documented functions correctly instead of re-implementing the behavior.",
   "hard_prereqs": [
    "T-RB050",
    "T-RB051"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB053": {
   "id": "T-RB053",
   "title": "Menu/UI",
   "cluster": "Robotics: Code Commander",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Menu/UI",
   "mastery_criteria": "Student builds a text menu in the simulator that lets a user choose among at least three robot behaviors and handles invalid input gracefully.",
   "hard_prereqs": [
    "T-RB052"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB054": {
   "id": "T-RB054",
   "title": "Timers/Millis",
   "cluster": "Robotics: Code Commander",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Timers/Millis",
   "mastery_criteria": "Student writes non-blocking robot code using elapsed-time checks instead of long waits, so two timed actions run on independent cycles simultaneously.",
   "hard_prereqs": [
    "T-RB048",
    "T-RB052"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB055": {
   "id": "T-RB055",
   "title": "Interrupts/States",
   "cluster": "Robotics: Code Commander",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Interrupts/States",
   "mastery_criteria": "Student implements a state machine in robot code with at least three states and event-driven transitions triggered by sensor changes.",
   "hard_prereqs": [
    "T-RB053",
    "T-RB054"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB056": {
   "id": "T-RB056",
   "title": "Concurrent Code",
   "cluster": "Robotics: Code Commander",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Concurrent Code",
   "mastery_criteria": "Student writes robot code in which two behaviors run concurrently (e.g., a status LED blinks while the robot drives) without either blocking the other.",
   "hard_prereqs": [
    "T-RB055"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB057": {
   "id": "T-RB057",
   "title": "Optimize Code",
   "cluster": "Robotics: Code Commander",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Optimize Code",
   "mastery_criteria": "Student refactors a working robot program to remove repetition and unnecessary polling, keeping identical simulated behavior with measurably less code.",
   "hard_prereqs": [
    "T-RB055"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB058": {
   "id": "T-RB058",
   "title": "RF/Bluetooth",
   "cluster": "Robotics: Code Commander",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "RF/Bluetooth",
   "mastery_criteria": "Student pairs an RF or Bluetooth link and drives a physical robot or device remotely, demonstrating reliable command response and sane disconnect handling.",
   "hard_prereqs": [
    "T-RB056"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Wireless link pairs and stays connected through the demo",
     "Commands produce correct, low-latency responses",
     "Out-of-range or disconnect conditions handled sanely",
     "Student explains the pairing process and command protocol"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB059": {
   "id": "T-RB059",
   "title": "Auto Behavior",
   "cluster": "Robotics: Code Commander",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Auto Behavior",
   "mastery_criteria": "Student programs the simulated robot to complete a course fully autonomously, combining sensing, state logic, and timing with no manual input after start.",
   "hard_prereqs": [
    "T-RB019",
    "T-RB034",
    "T-RB040",
    "T-RB056",
    "T-RB057"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "robot"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB060": {
   "id": "T-RB060",
   "title": "Code Docs",
   "cluster": "Robotics: Code Commander",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Code Docs",
   "mastery_criteria": "Student documents a robot program with a header summary, function comments, and wiring/setup notes complete enough that another student can run and modify it.",
   "hard_prereqs": [
    "T-RB058",
    "T-RB059"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Header comment states purpose, setup, and usage",
     "Functions and non-obvious logic are commented accurately",
     "Wiring and configuration documented for reproduction",
     "A peer runs and modifies the program using only the docs"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB061": {
   "id": "T-RB061",
   "title": "Labeled Sketch",
   "cluster": "Robotics: Tech Designer",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Labeled Sketch",
   "mastery_criteria": "Student produces a clear labeled sketch of a device with parts named and key dimensions or functions annotated so its purpose is evident.",
   "hard_prereqs": [
    "T-RB004"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "All major parts labeled correctly",
     "Sketch is clear and reasonably proportioned",
     "Key dimensions or functions annotated",
     "Device's purpose is evident from the sketch alone"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB062": {
   "id": "T-RB062",
   "title": "Part Explain",
   "cluster": "Robotics: Tech Designer",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Part Explain",
   "mastery_criteria": "Student explains in typed answers the function of each named part in a described device and predicts what would fail if a given part were removed.",
   "hard_prereqs": [
    "T-RB004"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB063": {
   "id": "T-RB063",
   "title": "Design Weakness",
   "cluster": "Robotics: Tech Designer",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Design Weakness",
   "mastery_criteria": "Student analyzes described designs in typed answers, identifying the most likely failure point and proposing a specific, feasible improvement.",
   "hard_prereqs": [
    "T-RB004"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB064": {
   "id": "T-RB064",
   "title": "Plan Template",
   "cluster": "Robotics: Tech Designer",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Plan Template",
   "mastery_criteria": "Student completes a build-plan template covering goal, materials, steps, roles, and timeline in enough detail that another team could execute it.",
   "hard_prereqs": [
    "T-RB061",
    "T-RB063"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Goal and success measures clearly stated",
     "Materials and steps complete and correctly ordered",
     "Roles and timeline are realistic",
     "Another team could execute the plan as written"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB065": {
   "id": "T-RB065",
   "title": "Record Measures",
   "cluster": "Robotics: Tech Designer",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Record Measures",
   "mastery_criteria": "Student measures parts with ruler and calipers and records the dimensions in an organized table with consistent units and stated tolerances.",
   "hard_prereqs": [
    "T-RB061"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Correct tool choice and technique for each measurement",
     "Consistent units and appropriate precision",
     "Data table organized and complete",
     "Measurements repeatable within stated tolerance"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB066": {
   "id": "T-RB066",
   "title": "Present Concept",
   "cluster": "Robotics: Tech Designer",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Present Concept",
   "mastery_criteria": "Student presents a design concept to the class, explaining the problem, the solution, and how it works, and answers audience questions.",
   "hard_prereqs": [
    "T-RB061",
    "T-RB062"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Problem and solution clearly explained",
     "Visuals or prop meaningfully support the explanation",
     "Delivery: audible voice, eye contact, steady pacing",
     "Audience questions answered accurately"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB067": {
   "id": "T-RB067",
   "title": "BOM",
   "cluster": "Robotics: Tech Designer",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "BOM",
   "mastery_criteria": "Student builds a complete bill of materials with part names, quantities, sources, and unit and total costs for a planned build.",
   "hard_prereqs": [
    "T-RB061"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "All required parts listed with correct quantities",
     "Sources or part numbers included for each line",
     "Unit and total costs computed correctly",
     "Formatting is clean and usable for actual purchasing"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB068": {
   "id": "T-RB068",
   "title": "Tinkercad Model",
   "cluster": "Robotics: Tech Designer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Tinkercad Model",
   "mastery_criteria": "Student models a multi-part object in Tinkercad using grouping and hole features, matching real-world dimensions.",
   "hard_prereqs": [
    "T-RB064"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Grouping and hole features used correctly",
     "Dimensions match the real-world specification",
     "Parts aligned and assembled correctly in the model",
     "Geometry is manufacturable: no floating or intersecting solids"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB069": {
   "id": "T-RB069",
   "title": "Label Schematics",
   "cluster": "Robotics: Tech Designer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Label Schematics",
   "mastery_criteria": "Student labels schematic diagrams with correct component names and values and annotates the signal and power flow through the circuit.",
   "hard_prereqs": [
    "T-RB068"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Component names and values labeled correctly",
     "Signal and power flow annotated accurately",
     "Standard notation used throughout",
     "Labels complete across the entire schematic"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB070": {
   "id": "T-RB070",
   "title": "Goals Fit",
   "cluster": "Robotics: Tech Designer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Goals Fit",
   "mastery_criteria": "Student evaluates in typed answers whether described designs satisfy their stated goals and constraints, citing specific evidence for each fit or misfit judgment.",
   "hard_prereqs": [
    "T-RB066"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB071": {
   "id": "T-RB071",
   "title": "Scaled Drawings",
   "cluster": "Robotics: Tech Designer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Scaled Drawings",
   "mastery_criteria": "Student produces a scaled technical drawing with the scale stated, accurate proportions, and correct dimension callouts.",
   "hard_prereqs": [
    "T-RB065"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Scale stated and applied consistently",
     "Proportions accurate to the real object",
     "Dimension callouts correct and legible",
     "Chosen views show all necessary detail"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB072": {
   "id": "T-RB072",
   "title": "Simulate System",
   "cluster": "Robotics: Tech Designer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Simulate System",
   "mastery_criteria": "Student builds and runs a simulation of their design (e.g., Tinkercad Circuits), using the results to verify behavior and drive a design decision before physical build.",
   "hard_prereqs": [
    "T-RB068",
    "T-RB070"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Simulation faithfully represents the design",
     "Runs demonstrate the intended behavior",
     "Results recorded and interpreted correctly",
     "Findings drive at least one documented design decision"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB073": {
   "id": "T-RB073",
   "title": "Design Log",
   "cluster": "Robotics: Tech Designer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Design Log",
   "mastery_criteria": "Student maintains a dated design log across a project, capturing decisions, changes, and the reasons for them at each work session.",
   "hard_prereqs": [
    "T-RB072"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Entries dated for every work session",
     "Decisions recorded with their reasons",
     "Changes traceable from entry to entry",
     "Log tells the project story to an outside reader"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB074": {
   "id": "T-RB074",
   "title": "Material Eval",
   "cluster": "Robotics: Tech Designer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Material Eval",
   "mastery_criteria": "Student compares candidate materials in typed answers across strength, weight, cost, and workability, and selects one with justification for a described part.",
   "hard_prereqs": [
    "T-RB072"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB075": {
   "id": "T-RB075",
   "title": "Fusion 360",
   "cluster": "Robotics: Tech Designer",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Fusion 360",
   "mastery_criteria": "Student models a parametric part in Fusion 360 using constrained sketches and extrude/revolve features, matching a provided specification.",
   "hard_prereqs": [
    "T-RB071",
    "T-RB074"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Sketches fully constrained and dimensioned",
     "Correct feature use: extrude, revolve, fillet",
     "Part matches the provided specification dimensions",
     "Timeline/history is clean and editable"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB076": {
   "id": "T-RB076",
   "title": "CAD Assemblies",
   "cluster": "Robotics: Tech Designer",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "CAD Assemblies",
   "mastery_criteria": "Student builds a multi-part CAD assembly with joints or mates so the mechanism articulates correctly with no component interference.",
   "hard_prereqs": [
    "T-RB075"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "All parts positioned with proper joints or mates",
     "Assembly articulates as intended",
     "No interference between components",
     "Assembly organized: named components, sensible tree"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB077": {
   "id": "T-RB077",
   "title": "Tech Prints",
   "cluster": "Robotics: Tech Designer",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Tech Prints",
   "mastery_criteria": "Student produces dimensioned technical prints (orthographic views with title block) from a CAD model, complete enough to fabricate from.",
   "hard_prereqs": [
    "T-RB069",
    "T-RB075"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Orthographic views correct and properly aligned",
     "Dimensions and tolerances complete for fabrication",
     "Title block filled out properly",
     "Print follows standard drafting conventions"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB078": {
   "id": "T-RB078",
   "title": "Client Design",
   "cluster": "Robotics: Tech Designer",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Client Design",
   "mastery_criteria": "Student develops a design against a real client brief, documenting the requirements gathered and showing how the design answers each one.",
   "hard_prereqs": [
    "T-RB076",
    "T-RB077"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Client requirements gathered and documented",
     "Design maps explicitly to each requirement",
     "Client feedback incorporated in a revision",
     "Final proposal is professional and complete"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB079": {
   "id": "T-RB079",
   "title": "Pro Presentation",
   "cluster": "Robotics: Tech Designer",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Pro Presentation",
   "mastery_criteria": "Student delivers a professional design presentation with slides and a prototype or CAD walkthrough, handling audience questions with substance.",
   "hard_prereqs": [
    "T-RB078"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Slides and materials are professional and organized",
     "Technical content accurate and well explained",
     "Confident delivery within the time limit",
     "Handles questions with substantive answers"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB080": {
   "id": "T-RB080",
   "title": "Design Portfolio",
   "cluster": "Robotics: Tech Designer",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Design Portfolio",
   "mastery_criteria": "Student assembles a curated portfolio of their design work, from sketches through CAD to builds, with a reflection on growth for each piece.",
   "hard_prereqs": [
    "T-RB073",
    "T-RB079"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Portfolio shows range: sketches, CAD, and builds",
     "Each piece includes context and reflection",
     "Growth over time is evident across pieces",
     "Presentation quality: organized, polished, navigable"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB081": {
   "id": "T-RB081",
   "title": "Budget Limits",
   "cluster": "Robotics: Tech Designer",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Budget Limits",
   "mastery_criteria": "Student works typed budgeting problems: totals a parts list against a fixed budget, identifies cheaper substitutions, and adjusts the design to stay within cost and weight limits.",
   "hard_prereqs": [
    "T-RB067"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quest",
    "module": "concept"
   },
   "legacy_subject": "Robotics"
  },
  "T-RB082": {
   "id": "T-RB082",
   "title": "Idea Brainstorm",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Idea Brainstorm",
   "mastery_criteria": "Student generates at least 15 distinct ideas in a timed brainstorm without self-censoring, then clusters them and selects top candidates with reasoning.",
   "hard_prereqs": [
    "T-RB005"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "At least 15 distinct ideas generated",
     "Judgment deferred during generation: no self-censoring",
     "Ideas clustered into meaningful themes afterward",
     "Selection reasoning ties back to the problem"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB083": {
   "id": "T-RB083",
   "title": "Problem Describe",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Problem Describe",
   "mastery_criteria": "Student writes a problem statement that names the user, need, context, and supporting evidence without embedding a solution.",
   "hard_prereqs": [
    "T-RB005"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Names the user, need, and context specifically",
     "Includes evidence that the problem is real",
     "Statement is solution-free",
     "Scope is actionable: neither too broad nor too narrow"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB084": {
   "id": "T-RB084",
   "title": "Success Criteria",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Success Criteria",
   "mastery_criteria": "Student defines measurable success criteria and constraints for a project, each with a target value and a method for testing it.",
   "hard_prereqs": [
    "T-RB005"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Criteria are measurable with target values",
     "Each criterion has a defined test method",
     "Constraints identified and kept separate from criteria",
     "Set covers function, user experience, and feasibility"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB085": {
   "id": "T-RB085",
   "title": "Invention Sketch",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "6-8",
   "game_skill": "Invention Sketch",
   "mastery_criteria": "Student sketches an original invention concept with labeled features and captions explaining how it solves the target problem.",
   "hard_prereqs": [
    "T-RB082",
    "T-RB083"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Concept is original and addresses the stated problem",
     "Key features labeled on the sketch",
     "Operation explained in captions or annotations",
     "Sketch communicates the idea without verbal explanation"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB086": {
   "id": "T-RB086",
   "title": "Test Plan",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Test Plan",
   "mastery_criteria": "Student writes a test plan specifying what to test, the procedure, the materials, and pass/fail thresholds tied to the project's success criteria.",
   "hard_prereqs": [
    "T-RB084",
    "T-RB087"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Tests map directly to the success criteria",
     "Procedures specific enough for someone else to repeat",
     "Materials and setup fully listed",
     "Pass/fail thresholds defined before testing"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB087": {
   "id": "T-RB087",
   "title": "Low-Fi Proto",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Low-Fi Proto",
   "mastery_criteria": "Student builds a low-fidelity prototype (cardboard, foam, tape) that demonstrates the core interaction of their concept in a hands-on demo.",
   "hard_prereqs": [
    "T-RB085"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Prototype demonstrates the core interaction",
     "Built quickly from appropriate low-fidelity materials",
     "Sturdy enough to survive a hands-on demo",
     "Student states what the prototype is and is not testing"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB088": {
   "id": "T-RB088",
   "title": "User Interview",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "User Interview",
   "mastery_criteria": "Student plans and conducts a user interview with open-ended questions, records the answers, and extracts at least three actionable insights.",
   "hard_prereqs": [
    "T-RB087"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Questions are open-ended and unbiased",
     "Active listening with relevant follow-ups",
     "Responses recorded accurately",
     "At least three actionable insights extracted"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB089": {
   "id": "T-RB089",
   "title": "Usability Test",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Usability Test",
   "mastery_criteria": "Student runs a usability test in which a user attempts tasks with the prototype while the student observes and logs issues without coaching.",
   "hard_prereqs": [
    "T-RB086"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Realistic tasks given without coaching the user",
     "Observations logged systematically during the session",
     "User struggles identified without blaming the user",
     "Findings prioritized for the next redesign"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB090": {
   "id": "T-RB090",
   "title": "Multi Prototypes",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Multi Prototypes",
   "mastery_criteria": "Student produces two or more distinct prototype variants of the same concept and compares their trade-offs with evidence.",
   "hard_prereqs": [
    "T-RB088"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Two or more genuinely distinct variants built",
     "Each variant tests a different approach",
     "Trade-offs compared with concrete evidence",
     "Recommendation for the next step is justified"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB091": {
   "id": "T-RB091",
   "title": "Feedback Iterate",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Feedback Iterate",
   "mastery_criteria": "Student revises a prototype based on collected feedback, documenting each change and the specific feedback item that motivated it.",
   "hard_prereqs": [
    "T-RB088",
    "T-RB089"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Every change traces to specific feedback",
     "Revision measurably addresses the reported issues",
     "Strengths of the prior version preserved",
     "Change log documents what changed and why"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB092": {
   "id": "T-RB092",
   "title": "Constraint Track",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Constraint Track",
   "mastery_criteria": "Student tracks project constraints (time, budget, materials, rules) in a living document, flagging risks early and recording adjustments with reasoning.",
   "hard_prereqs": [
    "T-RB081",
    "T-RB089"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "All constraint types tracked: time, budget, materials, rules",
     "Document kept current throughout the project",
     "Risks flagged before they became blockers",
     "Adjustments recorded with reasoning"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB093": {
   "id": "T-RB093",
   "title": "Version Compare",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Version Compare",
   "mastery_criteria": "Student compares prototype versions against the same success criteria using measured results and recommends which version to advance.",
   "hard_prereqs": [
    "T-RB090"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "All versions tested against the same criteria",
     "Results measured rather than estimated",
     "Comparison presented clearly in a table or chart",
     "Advancement recommendation follows the data"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB094": {
   "id": "T-RB094",
   "title": "Team Lead",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Team Lead",
   "mastery_criteria": "Student leads a project team: assigns roles, runs regular check-ins, tracks tasks, and resolves at least one blocking issue.",
   "hard_prereqs": [
    "T-RB092"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Roles assigned to match member strengths",
     "Check-ins run consistently and tasks tracked",
     "At least one blocking issue resolved through leadership",
     "Team members report having clear direction"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB095": {
   "id": "T-RB095",
   "title": "Research Docs",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Research Docs",
   "mastery_criteria": "Student compiles research documentation with cited sources, honest comparisons to existing solutions, and explicit implications for their own design.",
   "hard_prereqs": [
    "T-RB094"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Sources cited and credible",
     "Existing solutions compared honestly",
     "Findings explicitly connected to design implications",
     "Documentation organized and readable"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB096": {
   "id": "T-RB096",
   "title": "Final Prototype",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Final Prototype",
   "mastery_criteria": "Student delivers a refined final prototype that meets its defined success criteria in a live demonstration, with all subsystems working together.",
   "hard_prereqs": [
    "T-RB091",
    "T-RB093",
    "T-RB095"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Meets the defined success criteria in a live demo",
     "Craftsmanship: robust, finished, and safe",
     "All subsystems function together",
     "Shows clear iteration from earlier versions"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB097": {
   "id": "T-RB097",
   "title": "Reliability Test",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Reliability Test",
   "mastery_criteria": "Student stress-tests the final prototype over at least 10 repeated trials, recording the failure rate and identifying the weakest subsystem from the data.",
   "hard_prereqs": [
    "T-RB096"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Repeated-trial protocol executed (10+ trials)",
     "Failure data recorded honestly and completely",
     "Weakest subsystem identified from the data",
     "Improvement or mitigation proposed"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB098": {
   "id": "T-RB098",
   "title": "Impact Project",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Impact Project",
   "mastery_criteria": "Student completes a project addressing a real community or school need, deploying it with actual users and collecting evidence of its impact.",
   "hard_prereqs": [
    "T-RB096"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Addresses a verified real community or school need",
     "Deployed or tested with actual users",
     "Evidence of impact collected",
     "Stakeholder feedback incorporated"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB099": {
   "id": "T-RB099",
   "title": "Public Present",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Public Present",
   "mastery_criteria": "Student presents their project to a public audience (fair, panel, or community event), communicating problem, process, and results and fielding questions.",
   "hard_prereqs": [
    "T-RB079",
    "T-RB098"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Clear narrative: problem, process, results",
     "Engages a public, non-classroom audience",
     "Visuals or live demo support the talk",
     "Fields audience questions credibly"
    ]
   },
   "legacy_subject": "Robotics"
  },
  "T-RB100": {
   "id": "T-RB100",
   "title": "Scale Plan",
   "cluster": "Robotics: Innovator & Problem Solver",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Scale Plan",
   "mastery_criteria": "Student writes a scale-up plan covering costs at quantity, manufacturing or process changes, and the risks of taking the prototype to a larger user base.",
   "hard_prereqs": [
    "T-RB097",
    "T-RB099"
   ],
   "soft_deps": [],
   "assess": {
    "type": "project",
    "criteria": [
     "Costs estimated at quantity with cited sources",
     "Process changes needed for scale identified",
     "Risks named with mitigations",
     "Plan is realistic for the prototype's maturity"
    ]
   },
   "legacy_subject": "Robotics"
  }
 },
 "skillToId": {
  "Device Basics": "T1",
  "Digital Navigation": "T2",
  "Keyboarding & Input": "T3",
  "Digital Citizenship": "T4",
  "File Management": "T5",
  "Productivity Tools": "T6",
  "Internet Research": "T7",
  "Digital Communication": "T8",
  "Algorithmic Thinking": "T9",
  "Programming Logic": "T10",
  "Programming Projects": "T11",
  "Software Design": "T12",
  "Debugging & Testing": "T13",
  "Versioning & Iteration": "T14",
  "Systems Integration": "T15",
  "Engineering Design Process": "T16",
  "Independent Build Project": "T17",
  "Visual Programming": "T19",
  "Game Logic": "T20",
  "Web Foundations": "T22",
  "Robotics Basics": "T25",
  "Sensors & Actuators": "T26",
  "Robotics Engineering": "T27",
  "Digital Media Creation": "T28",
  "Media Production": "T29",
  "Data & Spreadsheets": "T31",
  "Automation Basics": "T32",
  "Advanced Automation": "T33",
  "Introduction to Operating Systems": "T-SD001",
  "Basic Computer Operations": "T-SD002",
  "Basic Arithmetic": "T-SD003",
  "Basic Software Tools": "T-SD004",
  "Programming/Basic Theory": "T-SD005",
  "Text Manipulation": "T-SD006",
  "Basic Database Concepts": "T-SD007",
  "Markup Languages": "T-SD008",
  "Object Oriented Programming": "T-SD009",
  "Computer Science Algebra": "T-SD010",
  "Introduction to Hardware": "T-SD011",
  "Intro Computer Science": "T-SD012",
  "Basic Concepts": "T-SD013",
  "Console UI Fundamentals": "T-SD014",
  "Advanced Debugging Techniques": "T-SD015",
  "Assembly Language Programming": "T-SD016",
  "SQL": "T-SD017",
  "Web to Desktop Design": "T-SD018",
  "HTML CSS": "T-SD019",
  "JavaScript/jQuery": "T-SD020",
  "Event Driven Programming": "T-SD021",
  "HTML CSS Concepts": "T-SD022",
  "Basic HTML Design": "T-SD023",
  "HTML to Web Fundamentals": "T-SD024",
  "Building Responsive Websites": "T-SD025",
  "Building Interactive Websites": "T-SD026",
  "Systems and Application Programming": "T-SD027",
  "Operating System Fundamentals": "T-SD028",
  "Cybersecurity Pathways": "T-SD029",
  "Advanced Systems Programming": "T-SD030",
  "Systems and Application Automation": "T-SD031",
  "Industrial Automation": "T-SD032",
  "Software Engineering": "T-SD033",
  "Advanced Software Development": "T-SD034",
  "Building Scalable Applications": "T-SD035",
  "Software Architecture": "T-SD036",
  "Application Security": "T-SD037",
  "Modern Software Practices": "T-SD038",
  "Front-End Development": "T-SD039",
  "Back-End Development": "T-SD040",
  "Full-Stack Development": "T-SD041",
  "Web Development Pathways": "T-SD042",
  "Cloud Computing and DevOps": "T-SD043",
  "Advanced Cloud Development": "T-SD044",
  "Intro to Game Programming": "T-SD045",
  "Service Oriented Architecture": "T-SD046",
  "Advanced Game Programming": "T-SD047",
  "Game Engine Development": "T-SD048",
  "Mobile App Development": "T-SD049",
  "Game Design Principles": "T-SD050",
  "Data Science and Machine Learning": "T-SD051",
  "Statistical Analysis": "T-SD052",
  "Machine Learning Algorithms": "T-SD053",
  "Deep Learning": "T-SD054",
  "AI Development": "T-SD055",
  "Advanced Machine Learning": "T-SD056",
  "Command Line Basics": "T-301",
  "Regular Expressions": "T-302",
  "How the Internet Works": "T-303",
  "Mechanics Basics": "T-RB001",
  "Circuits Basics": "T-RB002",
  "Coding Basics": "T-RB003",
  "Design Basics": "T-RB004",
  "Innovation Basics": "T-RB005",
  "Frame Build": "T-RB006",
  "Axles & Wheels": "T-RB007",
  "Motion Device": "T-RB008",
  "Build Stability": "T-RB009",
  "Gears & Torque": "T-RB010",
  "Axle Compare": "T-RB011",
  "Cranks & Pulleys": "T-RB012",
  "2-Joint Arm": "T-RB013",
  "Gear Integration": "T-RB014",
  "Walker/Biped": "T-RB015",
  "Balance & Springs": "T-RB016",
  "Materials Choice": "T-RB017",
  "Real-World Chassis": "T-RB018",
  "Mech-Control Integr.": "T-RB019",
  "Test Iteration": "T-RB020",
  "Labeled Mechanism": "T-RB021",
  "Components ID": "T-RB022",
  "Electricity Flow": "T-RB023",
  "LED Switch": "T-RB024",
  "Breadboard Use": "T-RB025",
  "Sensor Read": "T-RB026",
  "Multimeter Use": "T-RB027",
  "Servo Drive": "T-RB028",
  "Sensor Logic": "T-RB029",
  "Light/Sound React": "T-RB030",
  "Sensor Toggle": "T-RB031",
  "Motor+Sensor Circuit": "T-RB032",
  "Power Budget": "T-RB033",
  "Sensor Control": "T-RB034",
  "Regulators & Polarity": "T-RB035",
  "Alarm Device": "T-RB036",
  "Transistors/Relays": "T-RB037",
  "Multi-Load Power": "T-RB038",
  "Soldering": "T-RB039",
  "Autonomous Power": "T-RB040",
  "Enclosure Build": "T-RB041",
  "Circuit Diagram": "T-RB042",
  "Starter Code": "T-RB043",
  "Inputs ID": "T-RB044",
  "Parameter Tuning": "T-RB045",
  "If/Else & Loops": "T-RB046",
  "Debug Syntax": "T-RB047",
  "Blink LED": "T-RB048",
  "Input → Output": "T-RB049",
  "Functions": "T-RB050",
  "Serial Monitor": "T-RB051",
  "Libraries": "T-RB052",
  "Menu/UI": "T-RB053",
  "Timers/Millis": "T-RB054",
  "Interrupts/States": "T-RB055",
  "Concurrent Code": "T-RB056",
  "Optimize Code": "T-RB057",
  "RF/Bluetooth": "T-RB058",
  "Auto Behavior": "T-RB059",
  "Code Docs": "T-RB060",
  "Labeled Sketch": "T-RB061",
  "Part Explain": "T-RB062",
  "Design Weakness": "T-RB063",
  "Plan Template": "T-RB064",
  "Record Measures": "T-RB065",
  "Present Concept": "T-RB066",
  "BOM": "T-RB067",
  "Tinkercad Model": "T-RB068",
  "Label Schematics": "T-RB069",
  "Goals Fit": "T-RB070",
  "Scaled Drawings": "T-RB071",
  "Simulate System": "T-RB072",
  "Design Log": "T-RB073",
  "Material Eval": "T-RB074",
  "Fusion 360": "T-RB075",
  "CAD Assemblies": "T-RB076",
  "Tech Prints": "T-RB077",
  "Client Design": "T-RB078",
  "Pro Presentation": "T-RB079",
  "Design Portfolio": "T-RB080",
  "Budget Limits": "T-RB081",
  "Idea Brainstorm": "T-RB082",
  "Problem Describe": "T-RB083",
  "Success Criteria": "T-RB084",
  "Invention Sketch": "T-RB085",
  "Test Plan": "T-RB086",
  "Low-Fi Proto": "T-RB087",
  "User Interview": "T-RB088",
  "Usability Test": "T-RB089",
  "Multi Prototypes": "T-RB090",
  "Feedback Iterate": "T-RB091",
  "Constraint Track": "T-RB092",
  "Version Compare": "T-RB093",
  "Team Lead": "T-RB094",
  "Research Docs": "T-RB095",
  "Final Prototype": "T-RB096",
  "Reliability Test": "T-RB097",
  "Impact Project": "T-RB098",
  "Public Present": "T-RB099",
  "Scale Plan": "T-RB100"
 }
};
