// PE Training Log data — generated from data/physical_curriculum_v2.json by tools/compile-phys-graph.js. Do not hand-edit.
// Benchmarks are simplified grade-band standards (FitnessGram-inspired, sex-neutral). [meets, exceeds] per band.
window.PE_DATA = {
 "nodes": {
  "P1": {
   "id": "P1",
   "title": "Basic Movement",
   "cluster": "Motor Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Basic Movement",
   "mastery_criteria": "Student walks, runs, and stops with control, changes speed and direction on cue, and moves safely in shared space.",
   "hard_prereqs": [],
   "soft_deps": [],
   "assess": {
    "type": "checklist",
    "items": [
     "Walks and runs with control and stops safely on signal",
     "Changes speed and direction on cue",
     "Moves safely in shared space without collisions"
    ]
   }
  },
  "P2": {
   "id": "P2",
   "title": "Body Awareness",
   "cluster": "Motor Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Body Awareness",
   "mastery_criteria": "Student identifies body parts while moving, travels at high, middle, and low levels, and mirrors a simple movement sequence.",
   "hard_prereqs": [
    "P1"
   ],
   "soft_deps": [],
   "assess": {
    "type": "checklist",
    "items": [
     "Identifies and uses named body parts while moving",
     "Travels at high, middle, and low levels on cue",
     "Mirrors a simple 3-move sequence shown by a partner"
    ]
   }
  },
  "P3": {
   "id": "P3",
   "title": "Coordination",
   "cluster": "Motor Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Coordination",
   "mastery_criteria": "Student performs cross-lateral movements, repeats a three-step movement pattern, and keeps a steady beat with claps or steps.",
   "hard_prereqs": [
    "P2"
   ],
   "soft_deps": [],
   "assess": {
    "type": "checklist",
    "items": [
     "Performs cross-crawl / cross-lateral marching smoothly",
     "Repeats a 3-step movement pattern after one demonstration",
     "Keeps a steady beat with claps or steps to music"
    ]
   }
  },
  "P-301": {
   "id": "P-301",
   "title": "Locomotor Skills",
   "cluster": "Motor Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Locomotor Skills",
   "mastery_criteria": "Student hops on each foot, skips smoothly, gallops with either foot leading, and slides in both directions with mature form.",
   "hard_prereqs": [
    "P1"
   ],
   "soft_deps": [],
   "assess": {
    "type": "checklist",
    "items": [
     "Hops 5 times on each foot without losing balance",
     "Skips smoothly with alternating step-hop pattern",
     "Gallops with either foot leading",
     "Slides sideways in both directions"
    ]
   }
  },
  "P-302": {
   "id": "P-302",
   "title": "Jumping & Landing",
   "cluster": "Motor Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Jumping & Landing",
   "mastery_criteria": "Student takes off and lands on two feet, lands quietly with bent knees, and jumps for both distance and height.",
   "hard_prereqs": [
    "P-301"
   ],
   "soft_deps": [],
   "assess": {
    "type": "checklist",
    "items": [
     "Takes off and lands on two feet",
     "Lands quietly with knees bent (soft landing)",
     "Jumps for distance and for height with arm swing"
    ]
   }
  },
  "P-303": {
   "id": "P-303",
   "title": "Overhand Throw",
   "cluster": "Motor Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Overhand Throw",
   "mastery_criteria": "Student throws overhand with side orientation, opposite-foot step, hip-shoulder rotation, and follow-through toward the target.",
   "hard_prereqs": [
    "P3"
   ],
   "soft_deps": [],
   "assess": {
    "type": "checklist",
    "items": [
     "Turns side to target and steps with opposite foot",
     "Rotates hips then shoulders during the throw",
     "Follows through across the body toward the target"
    ]
   }
  },
  "P-304": {
   "id": "P-304",
   "title": "Catching",
   "cluster": "Motor Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Catching",
   "mastery_criteria": "Student tracks the ball with the eyes, catches with hands only (no trapping), and adjusts position for high and low throws.",
   "hard_prereqs": [
    "P3"
   ],
   "soft_deps": [
    "P-303"
   ],
   "assess": {
    "type": "checklist",
    "items": [
     "Tracks the ball with eyes all the way into the hands",
     "Catches with hands only, without trapping against the body",
     "Moves feet to adjust for high and low throws"
    ]
   }
  },
  "P-305": {
   "id": "P-305",
   "title": "Kicking",
   "cluster": "Motor Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Kicking",
   "mastery_criteria": "Student plants the non-kicking foot beside the ball, contacts with the laces, and kicks a moving ball with control.",
   "hard_prereqs": [
    "P3"
   ],
   "soft_deps": [],
   "assess": {
    "type": "checklist",
    "items": [
     "Plants non-kicking foot beside the ball",
     "Contacts the ball with laces, not toes",
     "Kicks a slowly moving ball with control"
    ]
   }
  },
  "P-306": {
   "id": "P-306",
   "title": "Underhand Roll & Toss",
   "cluster": "Motor Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Underhand Roll & Toss",
   "mastery_criteria": "Student uses a pendulum arm swing with opposite-foot step and releases smoothly to hit a target from 3 meters.",
   "hard_prereqs": [
    "P3"
   ],
   "soft_deps": [],
   "assess": {
    "type": "checklist",
    "items": [
     "Uses pendulum arm swing with opposite-foot step",
     "Releases smoothly at knee level",
     "Hits a target from 3 meters on most attempts"
    ]
   }
  },
  "P-307": {
   "id": "P-307",
   "title": "Hand Dribbling",
   "cluster": "Motor Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Hand Dribbling",
   "mastery_criteria": "Student dribbles with finger pads at waist height, continues while walking, and can switch hands without stopping.",
   "hard_prereqs": [
    "P3"
   ],
   "soft_deps": [
    "P-304"
   ],
   "assess": {
    "type": "checklist",
    "items": [
     "Dribbles with finger pads (not slapping) at waist height",
     "Keeps the dribble going while walking",
     "Switches hands without stopping the dribble"
    ]
   }
  },
  "P-308": {
   "id": "P-308",
   "title": "Striking with Implement",
   "cluster": "Motor Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Striking with Implement",
   "mastery_criteria": "Student strikes from a sideways stance with a level swing, making contact off a tee and with a gently tossed ball.",
   "hard_prereqs": [
    "P-303"
   ],
   "soft_deps": [],
   "assess": {
    "type": "checklist",
    "items": [
     "Stands sideways to the target with bat/paddle back",
     "Swings level and makes contact off a tee",
     "Makes contact with a gently tossed ball"
    ]
   }
  },
  "P-309": {
   "id": "P-309",
   "title": "Static & Dynamic Balance",
   "cluster": "Motor Foundations",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Static & Dynamic Balance",
   "mastery_criteria": "Student balances on one foot for 15 seconds per side, walks a line or beam forward and backward, and holds three body shapes for 5 seconds each.",
   "hard_prereqs": [
    "P2"
   ],
   "soft_deps": [],
   "assess": {
    "type": "checklist",
    "items": [
     "Balances on one foot 15 seconds on each side",
     "Walks a line or low beam forward and backward",
     "Holds 3 different balance shapes for 5 seconds each"
    ]
   }
  },
  "P-310": {
   "id": "P-310",
   "title": "Endurance Run (PACER)",
   "cluster": "Fitness Measures",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Endurance Run (PACER)",
   "mastery_criteria": "Student completes the PACER shuttle-run test reaching the grade-band lap benchmark, with results recorded over time.",
   "hard_prereqs": [
    "P-301"
   ],
   "soft_deps": [],
   "assess": {
    "type": "metric",
    "metric": "pacer_laps",
    "unit": "laps",
    "direction": "higher",
    "input": "integer",
    "benchmarks": {
     "K-2": [
      10,
      20
     ],
     "3-5": [
      20,
      35
     ],
     "6-8": [
      35,
      55
     ],
     "9-10": [
      50,
      70
     ],
     "11-12": [
      55,
      80
     ]
    }
   }
  },
  "P-311": {
   "id": "P-311",
   "title": "Mile Run",
   "cluster": "Fitness Measures",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Mile Run",
   "mastery_criteria": "Student completes a timed one-mile run at or under the grade-band benchmark time, with pacing recorded over the year.",
   "hard_prereqs": [
    "P-310"
   ],
   "soft_deps": [],
   "assess": {
    "type": "metric",
    "metric": "mile_run",
    "unit": "seconds",
    "direction": "lower",
    "input": "time",
    "benchmarks": {
     "3-5": [
      690,
      600
     ],
     "6-8": [
      600,
      510
     ],
     "9-10": [
      540,
      450
     ],
     "11-12": [
      540,
      435
     ]
    }
   }
  },
  "P-312": {
   "id": "P-312",
   "title": "Push-Ups",
   "cluster": "Fitness Measures",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Push-Ups",
   "mastery_criteria": "Student performs consecutive full-form push-ups (90-degree elbow bend) meeting the grade-band benchmark count.",
   "hard_prereqs": [
    "P2"
   ],
   "soft_deps": [],
   "assess": {
    "type": "metric",
    "metric": "pushups",
    "unit": "reps",
    "direction": "higher",
    "input": "integer",
    "benchmarks": {
     "K-2": [
      5,
      10
     ],
     "3-5": [
      8,
      15
     ],
     "6-8": [
      12,
      22
     ],
     "9-10": [
      16,
      30
     ],
     "11-12": [
      18,
      35
     ]
    }
   }
  },
  "P-313": {
   "id": "P-313",
   "title": "Curl-Ups",
   "cluster": "Fitness Measures",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Curl-Ups",
   "mastery_criteria": "Student performs consecutive controlled curl-ups meeting the grade-band benchmark count.",
   "hard_prereqs": [
    "P2"
   ],
   "soft_deps": [],
   "assess": {
    "type": "metric",
    "metric": "curlups",
    "unit": "reps",
    "direction": "higher",
    "input": "integer",
    "benchmarks": {
     "K-2": [
      10,
      20
     ],
     "3-5": [
      20,
      35
     ],
     "6-8": [
      30,
      50
     ],
     "9-10": [
      40,
      65
     ],
     "11-12": [
      45,
      75
     ]
    }
   }
  },
  "P-314": {
   "id": "P-314",
   "title": "Plank Hold",
   "cluster": "Fitness Measures",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Plank Hold",
   "mastery_criteria": "Student holds a straight-body forearm plank for the grade-band benchmark time.",
   "hard_prereqs": [
    "P2"
   ],
   "soft_deps": [],
   "assess": {
    "type": "metric",
    "metric": "plank",
    "unit": "seconds",
    "direction": "higher",
    "input": "time",
    "benchmarks": {
     "K-2": [
      20,
      40
     ],
     "3-5": [
      45,
      75
     ],
     "6-8": [
      70,
      110
     ],
     "9-10": [
      90,
      150
     ],
     "11-12": [
      100,
      180
     ]
    }
   }
  },
  "P-315": {
   "id": "P-315",
   "title": "Sit-and-Reach",
   "cluster": "Fitness Measures",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Sit-and-Reach",
   "mastery_criteria": "Student reaches the grade-band benchmark distance on the sit-and-reach flexibility test on both sides.",
   "hard_prereqs": [
    "P2"
   ],
   "soft_deps": [],
   "assess": {
    "type": "metric",
    "metric": "sit_reach",
    "unit": "cm",
    "direction": "higher",
    "input": "integer",
    "benchmarks": {
     "K-2": [
      23,
      30
     ],
     "3-5": [
      22,
      28
     ],
     "6-8": [
      20,
      28
     ],
     "9-10": [
      20,
      28
     ],
     "11-12": [
      20,
      28
     ]
    }
   }
  },
  "P-316": {
   "id": "P-316",
   "title": "Shuttle Run",
   "cluster": "Fitness Measures",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Shuttle Run",
   "mastery_criteria": "Student completes the 4x10-meter shuttle run at or under the grade-band benchmark time, demonstrating agility and quick direction change.",
   "hard_prereqs": [
    "P-309"
   ],
   "soft_deps": [],
   "assess": {
    "type": "metric",
    "metric": "shuttle_run",
    "unit": "seconds",
    "direction": "lower",
    "input": "decimal",
    "benchmarks": {
     "K-2": [
      14,
      12.5
     ],
     "3-5": [
      12.5,
      11.5
     ],
     "6-8": [
      11.5,
      10.5
     ],
     "9-10": [
      10.8,
      9.8
     ],
     "11-12": [
      10.5,
      9.5
     ]
    }
   }
  },
  "P-317": {
   "id": "P-317",
   "title": "Standing Long Jump",
   "cluster": "Fitness Measures",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Standing Long Jump",
   "mastery_criteria": "Student jumps the grade-band benchmark distance from a standing two-foot take-off with a controlled landing.",
   "hard_prereqs": [
    "P-302"
   ],
   "soft_deps": [],
   "assess": {
    "type": "metric",
    "metric": "long_jump",
    "unit": "cm",
    "direction": "higher",
    "input": "integer",
    "benchmarks": {
     "K-2": [
      90,
      120
     ],
     "3-5": [
      125,
      155
     ],
     "6-8": [
      155,
      185
     ],
     "9-10": [
      175,
      210
     ],
     "11-12": [
      185,
      220
     ]
    }
   }
  },
  "P-318": {
   "id": "P-318",
   "title": "Jump Rope Endurance",
   "cluster": "Fitness Measures",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "K-2",
   "game_skill": "Jump Rope Endurance",
   "mastery_criteria": "Student jumps rope consecutively without a miss, meeting the grade-band benchmark count.",
   "hard_prereqs": [
    "P3"
   ],
   "soft_deps": [
    "P-302"
   ],
   "assess": {
    "type": "metric",
    "metric": "jump_rope",
    "unit": "jumps",
    "direction": "higher",
    "input": "integer",
    "benchmarks": {
     "K-2": [
      15,
      40
     ],
     "3-5": [
      40,
      80
     ],
     "6-8": [
      60,
      120
     ],
     "9-10": [
      80,
      150
     ],
     "11-12": [
      80,
      150
     ]
    }
   }
  },
  "P13": {
   "id": "P13",
   "title": "Advanced Conditioning",
   "cluster": "Fitness Measures",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Advanced Conditioning",
   "mastery_criteria": "Student reaches the exceeds level in at least three fitness measures on verified assessments in the same season.",
   "hard_prereqs": [
    "P-311",
    "P-312"
   ],
   "soft_deps": [
    "P-313",
    "P-314",
    "P-316",
    "P-317"
   ],
   "assess": {
    "type": "capstone",
    "rule": "exceeds_count",
    "count": 3,
    "of": [
     "P-310",
     "P-311",
     "P-312",
     "P-313",
     "P-314",
     "P-316",
     "P-317"
    ]
   }
  },
  "P-320": {
   "id": "P-320",
   "title": "Basketball Skills",
   "cluster": "Sport & Team Skills",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "3-5",
   "game_skill": "Basketball Skills",
   "mastery_criteria": "Student demonstrates game-ready dribbling, passing and catching, shooting form, and defensive footwork, scored on a teacher rubric.",
   "hard_prereqs": [
    "P-307"
   ],
   "soft_deps": [
    "P-304"
   ],
   "assess": {
    "type": "rubric",
    "criteria": [
     "Dribbling control under pressure",
     "Passing and catching on the move",
     "Shooting form and accuracy",
     "Defensive footwork and positioning"
    ]
   }
  },
  "P-321": {
   "id": "P-321",
   "title": "Soccer Skills",
   "cluster": "Sport & Team Skills",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "3-5",
   "game_skill": "Soccer Skills",
   "mastery_criteria": "Student demonstrates game-ready dribbling, passing accuracy, receiving and first touch, and shooting, scored on a teacher rubric.",
   "hard_prereqs": [
    "P-305"
   ],
   "soft_deps": [],
   "assess": {
    "type": "rubric",
    "criteria": [
     "Dribbling control at speed",
     "Passing accuracy over distance",
     "Receiving and first touch",
     "Shooting technique and placement"
    ]
   }
  },
  "P-322": {
   "id": "P-322",
   "title": "Volleyball Skills",
   "cluster": "Sport & Team Skills",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Volleyball Skills",
   "mastery_criteria": "Student demonstrates the forearm pass, overhead set, serve, and court movement, scored on a teacher rubric.",
   "hard_prereqs": [
    "P-304"
   ],
   "soft_deps": [
    "P-308"
   ],
   "assess": {
    "type": "rubric",
    "criteria": [
     "Forearm pass (bump) control",
     "Overhead set technique",
     "Serve over the net",
     "Court movement and readiness"
    ]
   }
  },
  "P-323": {
   "id": "P-323",
   "title": "Throwing & Fielding Games",
   "cluster": "Sport & Team Skills",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "3-5",
   "game_skill": "Throwing & Fielding Games",
   "mastery_criteria": "Student demonstrates throwing accuracy, fielding of grounders and flies, base running and game sense, and batting or striking, scored on a teacher rubric.",
   "hard_prereqs": [
    "P-303",
    "P-304"
   ],
   "soft_deps": [
    "P-308"
   ],
   "assess": {
    "type": "rubric",
    "criteria": [
     "Throwing accuracy and arm strength",
     "Fielding grounders and fly balls",
     "Base running and game sense",
     "Batting / striking a pitched ball"
    ]
   }
  },
  "P-324": {
   "id": "P-324",
   "title": "Racket & Net Sports",
   "cluster": "Sport & Team Skills",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Racket & Net Sports",
   "mastery_criteria": "Student demonstrates ready position and footwork, forehand, backhand, and serving or sustained rally, scored on a teacher rubric.",
   "hard_prereqs": [
    "P-308"
   ],
   "soft_deps": [],
   "assess": {
    "type": "rubric",
    "criteria": [
     "Ready position and footwork",
     "Forehand stroke",
     "Backhand stroke",
     "Serve and sustained rally"
    ]
   }
  },
  "P-325": {
   "id": "P-325",
   "title": "Track & Field Events",
   "cluster": "Sport & Team Skills",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Track & Field Events",
   "mastery_criteria": "Student demonstrates sprint form, distance pacing, one jumping event, and one throwing event with sound technique, scored on a teacher rubric.",
   "hard_prereqs": [
    "P-301",
    "P-302"
   ],
   "soft_deps": [
    "P-303"
   ],
   "assess": {
    "type": "rubric",
    "criteria": [
     "Sprint start and running form",
     "Distance pacing strategy",
     "Jumping event technique (long/high jump)",
     "Throwing event technique (shot/discus-style)"
    ]
   }
  },
  "P11": {
   "id": "P11",
   "title": "Team Play",
   "cluster": "Sport & Team Skills",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "6-8",
   "game_skill": "Team Play",
   "mastery_criteria": "Student communicates with teammates, maintains positioning and spacing, supports the player with the ball, and fulfills a role within a team strategy.",
   "hard_prereqs": [
    "P-321"
   ],
   "soft_deps": [
    "P-320",
    "P-322",
    "P-333"
   ],
   "assess": {
    "type": "rubric",
    "criteria": [
     "Communicates with teammates during play",
     "Positioning and spacing without the ball",
     "Supports teammates (passing options, encouragement)",
     "Fulfills assigned role within team strategy"
    ]
   }
  },
  "P16": {
   "id": "P16",
   "title": "Individual Sports",
   "cluster": "Sport & Team Skills",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Individual Sports",
   "mastery_criteria": "Student demonstrates consistent technique, self-pacing and strategy, rules and etiquette, and measurable improvement over a season in a chosen individual sport.",
   "hard_prereqs": [
    "P-325"
   ],
   "soft_deps": [
    "P-324"
   ],
   "assess": {
    "type": "rubric",
    "criteria": [
     "Consistent sport-specific technique",
     "Self-pacing and personal strategy",
     "Knows and follows rules and etiquette",
     "Measurable improvement across the season"
    ]
   }
  },
  "P17": {
   "id": "P17",
   "title": "Team Sports",
   "cluster": "Sport & Team Skills",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Team Sports",
   "mastery_criteria": "Student applies sport skills in live games, makes sound tactical decisions, works with teammates under pressure, and shows sportsmanship in competition.",
   "hard_prereqs": [
    "P11"
   ],
   "soft_deps": [
    "P-320",
    "P-321",
    "P-322",
    "P-323"
   ],
   "assess": {
    "type": "rubric",
    "criteria": [
     "Applies skills in live game situations",
     "Tactical decision-making",
     "Teamwork under pressure",
     "Sportsmanship in competition"
    ]
   }
  },
  "P20": {
   "id": "P20",
   "title": "Outdoor Skills",
   "cluster": "Sport & Team Skills",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Outdoor Skills",
   "mastery_criteria": "Student manages personal gear, navigates using a map and landmarks, and applies leave-no-trace and weather-safety practices outdoors.",
   "hard_prereqs": [
    "P-301"
   ],
   "soft_deps": [
    "P-330"
   ],
   "assess": {
    "type": "checklist",
    "items": [
     "Packs, carries, and keeps track of personal gear",
     "Navigates a simple route using a map and landmarks",
     "Applies leave-no-trace principles",
     "Explains and follows weather and terrain safety rules"
    ]
   }
  },
  "P21": {
   "id": "P21",
   "title": "Competitive Performance",
   "cluster": "Sport & Team Skills",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "9-10",
   "game_skill": "Competitive Performance",
   "mastery_criteria": "Student prepares for competition, executes under pressure, maintains composure and resilience, and reflects on performance afterward.",
   "hard_prereqs": [
    "P17"
   ],
   "soft_deps": [
    "P16",
    "P12"
   ],
   "assess": {
    "type": "rubric",
    "criteria": [
     "Pre-competition preparation (warm-up, plan)",
     "Performance execution under pressure",
     "Composure and resilience after setbacks",
     "Post-competition reflection and adjustment"
    ]
   }
  },
  "P-330": {
   "id": "P-330",
   "title": "Safety & Warm-Up Basics",
   "cluster": "Health & Fitness Knowledge",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Safety & Warm-Up Basics",
   "mastery_criteria": "Student explains why we warm up and cool down, identifies safe practice space and equipment rules, and passes the concept quiz at 80 percent.",
   "hard_prereqs": [],
   "soft_deps": [],
   "assess": {
    "type": "quiz"
   }
  },
  "P-331": {
   "id": "P-331",
   "title": "Components of Fitness",
   "cluster": "Health & Fitness Knowledge",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Components of Fitness",
   "mastery_criteria": "Student names and distinguishes cardiovascular endurance, muscular strength, muscular endurance, and flexibility, and matches activities to each component.",
   "hard_prereqs": [
    "P-330"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quiz"
   }
  },
  "P-332": {
   "id": "P-332",
   "title": "Rules of Major Sports",
   "cluster": "Health & Fitness Knowledge",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Rules of Major Sports",
   "mastery_criteria": "Student answers rules questions for basketball, soccer, volleyball, and baseball or kickball, including scoring, boundaries, and common violations.",
   "hard_prereqs": [
    "P-330"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quiz"
   }
  },
  "P-333": {
   "id": "P-333",
   "title": "Sportsmanship & Fair Play",
   "cluster": "Health & Fitness Knowledge",
   "stage": "Foundations",
   "stage_id": 1,
   "grade_band": "K-2",
   "game_skill": "Sportsmanship & Fair Play",
   "mastery_criteria": "Student identifies fair and unfair behavior in game scenarios, wins and loses graciously, and explains why rules keep games fair and fun.",
   "hard_prereqs": [
    "P-330"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quiz"
   }
  },
  "P-334": {
   "id": "P-334",
   "title": "Hydration & Recovery",
   "cluster": "Health & Fitness Knowledge",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "3-5",
   "game_skill": "Hydration & Recovery",
   "mastery_criteria": "Student explains when and how much to drink around exercise, recognizes signs of dehydration and overheating, and describes why sleep and rest days matter.",
   "hard_prereqs": [
    "P-331"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quiz"
   }
  },
  "P-335": {
   "id": "P-335",
   "title": "Body Systems & Exercise",
   "cluster": "Health & Fitness Knowledge",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Body Systems & Exercise",
   "mastery_criteria": "Student explains how the heart, lungs, and muscles respond to exercise, including heart rate, breathing rate, and how muscles grow stronger.",
   "hard_prereqs": [
    "P-331"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quiz"
   }
  },
  "P18": {
   "id": "P18",
   "title": "Health & Nutrition",
   "cluster": "Health & Fitness Knowledge",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Health & Nutrition",
   "mastery_criteria": "Student identifies food groups and balanced meals, explains how nutrition fuels activity, and evaluates everyday food choices.",
   "hard_prereqs": [
    "P-331"
   ],
   "soft_deps": [
    "P-334"
   ],
   "assess": {
    "type": "quiz"
   }
  },
  "P19": {
   "id": "P19",
   "title": "Injury Prevention",
   "cluster": "Health & Fitness Knowledge",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "6-8",
   "game_skill": "Injury Prevention",
   "mastery_criteria": "Student explains how to prevent common activity injuries, applies RICE for minor injuries, and recognizes when to stop and get adult help.",
   "hard_prereqs": [
    "P-335"
   ],
   "soft_deps": [
    "P-330"
   ],
   "assess": {
    "type": "quiz"
   }
  },
  "P10": {
   "id": "P10",
   "title": "Game Strategy",
   "cluster": "Health & Fitness Knowledge",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "6-8",
   "game_skill": "Game Strategy",
   "mastery_criteria": "Student explains offensive and defensive concepts such as creating space, defending space, and transitions, and chooses sound tactics in game scenarios.",
   "hard_prereqs": [
    "P-332"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quiz"
   }
  },
  "P8": {
   "id": "P8",
   "title": "Fitness Routines",
   "cluster": "Health & Fitness Knowledge",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "3-5",
   "game_skill": "Fitness Routines",
   "mastery_criteria": "Student sequences a warm-up, main activity, and cool-down, and explains what each phase does for the body.",
   "hard_prereqs": [
    "P-330",
    "P-331"
   ],
   "soft_deps": [],
   "assess": {
    "type": "quiz"
   }
  },
  "P12": {
   "id": "P12",
   "title": "Performance Training",
   "cluster": "Health & Fitness Knowledge",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "9-10",
   "game_skill": "Performance Training",
   "mastery_criteria": "Student applies the FITT principle and progressive overload to design training that improves a chosen fitness component safely.",
   "hard_prereqs": [
    "P8",
    "P-331"
   ],
   "soft_deps": [
    "P-335"
   ],
   "assess": {
    "type": "quiz"
   }
  },
  "P-337": {
   "id": "P-337",
   "title": "Fitness Goal Setting",
   "cluster": "Health & Fitness Knowledge",
   "stage": "Integration",
   "stage_id": 4,
   "grade_band": "6-8",
   "game_skill": "Fitness Goal Setting",
   "mastery_criteria": "Student writes SMART fitness goals, tracks progress against a baseline, and adjusts goals based on results.",
   "hard_prereqs": [
    "P-331"
   ],
   "soft_deps": [
    "P-340"
   ],
   "assess": {
    "type": "quiz"
   }
  },
  "P14": {
   "id": "P14",
   "title": "Personal Fitness Planning",
   "cluster": "Health & Fitness Knowledge",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "9-10",
   "game_skill": "Personal Fitness Planning",
   "mastery_criteria": "Student passes the planning quiz and submits a personal fitness plan with SMART goals, a weekly schedule covering all fitness components, and a reflection, approved by the teacher.",
   "hard_prereqs": [
    "P12",
    "P-337"
   ],
   "soft_deps": [
    "P13",
    "P8"
   ],
   "assess": {
    "type": "capstone",
    "rule": "quiz_plus_rubric",
    "criteria": [
     "Goals are specific and measurable (SMART)",
     "Weekly schedule covers all fitness components",
     "Plan matches the student's baseline data",
     "Reflection shows understanding of progress"
    ]
   }
  },
  "P-340": {
   "id": "P-340",
   "title": "Daily Activity Log",
   "cluster": "Active Habits",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Daily Activity Log",
   "mastery_criteria": "Student logs at least 30 minutes of physical activity on 20 different days, building a consistent movement habit.",
   "hard_prereqs": [
    "P1"
   ],
   "soft_deps": [],
   "assess": {
    "type": "streak",
    "target": 20,
    "session_label": "active day (30+ min)"
   }
  },
  "P-341": {
   "id": "P-341",
   "title": "Weekly Workout Habit",
   "cluster": "Active Habits",
   "stage": "Application",
   "stage_id": 3,
   "grade_band": "6-8",
   "game_skill": "Weekly Workout Habit",
   "mastery_criteria": "Student completes and logs three structured workouts per week for four weeks (12 sessions).",
   "hard_prereqs": [
    "P-340"
   ],
   "soft_deps": [
    "P8"
   ],
   "assess": {
    "type": "streak",
    "target": 12,
    "session_label": "structured workout"
   }
  },
  "P-342": {
   "id": "P-342",
   "title": "Stretching Routine",
   "cluster": "Active Habits",
   "stage": "Fluency",
   "stage_id": 2,
   "grade_band": "3-5",
   "game_skill": "Stretching Routine",
   "mastery_criteria": "Student completes and logs ten stretching or mobility sessions of at least 10 minutes.",
   "hard_prereqs": [
    "P-340"
   ],
   "soft_deps": [
    "P-315"
   ],
   "assess": {
    "type": "streak",
    "target": 10,
    "session_label": "stretching session (10+ min)"
   }
  },
  "P15": {
   "id": "P15",
   "title": "Physical Mastery",
   "cluster": "Active Habits",
   "stage": "Mastery",
   "stage_id": 5,
   "grade_band": "11-12",
   "game_skill": "Physical Mastery",
   "mastery_criteria": "Student has earned Advanced Conditioning, an approved Personal Fitness Plan, and mastery of at least one sport rubric — the capstone of the Physical path.",
   "hard_prereqs": [
    "P13",
    "P14"
   ],
   "soft_deps": [
    "P16",
    "P17",
    "P21"
   ],
   "assess": {
    "type": "capstone",
    "rule": "prereqs_plus_any_rubric",
    "of": [
     "P-320",
     "P-321",
     "P-322",
     "P-323",
     "P-324",
     "P-325",
     "P16",
     "P17"
    ]
   }
  }
 },
 "skillToId": {
  "Basic Movement": "P1",
  "Body Awareness": "P2",
  "Coordination": "P3",
  "Locomotor Skills": "P-301",
  "Jumping & Landing": "P-302",
  "Overhand Throw": "P-303",
  "Catching": "P-304",
  "Kicking": "P-305",
  "Underhand Roll & Toss": "P-306",
  "Hand Dribbling": "P-307",
  "Striking with Implement": "P-308",
  "Static & Dynamic Balance": "P-309",
  "Endurance Run (PACER)": "P-310",
  "Mile Run": "P-311",
  "Push-Ups": "P-312",
  "Curl-Ups": "P-313",
  "Plank Hold": "P-314",
  "Sit-and-Reach": "P-315",
  "Shuttle Run": "P-316",
  "Standing Long Jump": "P-317",
  "Jump Rope Endurance": "P-318",
  "Advanced Conditioning": "P13",
  "Basketball Skills": "P-320",
  "Soccer Skills": "P-321",
  "Volleyball Skills": "P-322",
  "Throwing & Fielding Games": "P-323",
  "Racket & Net Sports": "P-324",
  "Track & Field Events": "P-325",
  "Team Play": "P11",
  "Individual Sports": "P16",
  "Team Sports": "P17",
  "Outdoor Skills": "P20",
  "Competitive Performance": "P21",
  "Safety & Warm-Up Basics": "P-330",
  "Components of Fitness": "P-331",
  "Rules of Major Sports": "P-332",
  "Sportsmanship & Fair Play": "P-333",
  "Hydration & Recovery": "P-334",
  "Body Systems & Exercise": "P-335",
  "Health & Nutrition": "P18",
  "Injury Prevention": "P19",
  "Game Strategy": "P10",
  "Fitness Routines": "P8",
  "Performance Training": "P12",
  "Fitness Goal Setting": "P-337",
  "Personal Fitness Planning": "P14",
  "Daily Activity Log": "P-340",
  "Weekly Workout Habit": "P-341",
  "Stretching Routine": "P-342",
  "Physical Mastery": "P15"
 },
 "clusters": [
  "Motor Foundations",
  "Fitness Measures",
  "Sport & Team Skills",
  "Health & Fitness Knowledge",
  "Active Habits"
 ]
};
