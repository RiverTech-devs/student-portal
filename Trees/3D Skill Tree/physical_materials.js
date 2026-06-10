// Physical Materials Inventory - mapped to skill tree nodes
// Format: { nodeKey: [ { title, type, gradeRange, notes? } ] }
// nodeKey = "domain.skillId" (e.g. "math.counting")
// type: "workbook" | "textbook" | "flashcards" | "reference" | "supplement"

window.PHYSICAL_MATERIALS = {

  // ===========================================================
  // MATH DOMAIN
  // ===========================================================

  // --- TIER 1: Elementary foundations ---
  "math.counting": [
    { title: "Math Basics 1-2", type: "workbook", gradeRange: "Gr. 1–2", notes: "Covers counting, number sense" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "100 Days of Additions & Subtractions", type: "workbook", gradeRange: "Gr. 1–3", notes: "Daily practice includes counting drills" }
  ],
  "math.number_recognition": [
    { title: "Math Basics 1-2", type: "workbook", gradeRange: "Gr. 1–2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" }
  ],
  "math.basic_addition": [
    { title: "Math Basics 1-2", type: "workbook", gradeRange: "Gr. 1–2" },
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "100 Days of Additions & Subtractions", type: "workbook", gradeRange: "Gr. 1–3" }
  ],
  "math.basic_subtraction": [
    { title: "Math Basics 1-2", type: "workbook", gradeRange: "Gr. 1–2" },
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "100 Days of Additions & Subtractions", type: "workbook", gradeRange: "Gr. 1–3" }
  ],
  "math.classifying_objects": [
    { title: "Math Basics 1-2", type: "workbook", gradeRange: "Gr. 1–2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" }
  ],
  "math.comparing_numbers": [
    { title: "Math Basics 1-2", type: "workbook", gradeRange: "Gr. 1–2" },
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" }
  ],
  "math.ordering_numbers": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" }
  ],
  "math.number_lines": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" }
  ],
  "math.number_bonds": [
    { title: "Math Basics 1-2", type: "workbook", gradeRange: "Gr. 1–2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" }
  ],
  "math.even_and_odd": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" }
  ],
  "math.teen_numbers": [
    { title: "Math Basics 1-2", type: "workbook", gradeRange: "Gr. 1–2" }
  ],
  "math.positional_words": [
    { title: "Math Basics 1-2", type: "workbook", gradeRange: "Gr. 1–2" }
  ],
  "math.comparing_lengths": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" }
  ],
  "math.composing_shapes": [
    { title: "Math Basics 1-2", type: "workbook", gradeRange: "Gr. 1–2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" }
  ],
  "math.partitioning_shapes": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" }
  ],
  "math.patterns_and_sequences": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" }
  ],
  "math.picture_graphs": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" }
  ],

  // --- TIER 2: Elementary advancing ---
  "math.place_value": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" }
  ],
  "math.multiplication": [
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Math Basics 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Multiplication & Division Math for 3–5th Gr.", type: "workbook", gradeRange: "Gr. 3–5" },
    { title: "Flashcards Mult.", type: "flashcards", gradeRange: "Gr. 3–5" }
  ],
  "math.division": [
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Math Basics 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Multiplication & Division Math for 3–5th Gr.", type: "workbook", gradeRange: "Gr. 3–5" },
    { title: "Flashcards Div.", type: "flashcards", gradeRange: "Gr. 3–5" }
  ],
  "math.fractions": [
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Math Basics 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "100 Days of Money/Fractions", type: "workbook", gradeRange: "Gr. 3–5" }
  ],
  "math.decimals": [
    { title: "Math Basics 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" }
  ],
  "math.measurement": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" }
  ],
  "math.time_math": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" }
  ],
  "math.money_math": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "100 Days of Money/Fractions", type: "workbook", gradeRange: "Gr. 3–5" }
  ],
  "math.arrays_and_area_models": [
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" }
  ],
  "math.multi_digit_addition": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "100 Days of Additions & Subtractions", type: "workbook", gradeRange: "Gr. 1–3" }
  ],
  "math.multi_digit_subtraction": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "100 Days of Additions & Subtractions", type: "workbook", gradeRange: "Gr. 1–3" }
  ],
  "math.3d_shapes": [
    { title: "Math Basics 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" }
  ],
  "math.bar_graphs": [
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" }
  ],
  "math.line_plots": [
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" }
  ],
  "math.word_problems": [
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Math Basics 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "What's The Point of Math", type: "supplement", gradeRange: "Gr. 3–6", notes: "Real-world math applications" }
  ],
  "math.rounding_and_estimation": [
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" }
  ],

  // --- TIER 3: Upper elementary / early middle ---
  "math.ratios": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" }
  ],
  "math.proportions": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" }
  ],
  "math.percentages": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" }
  ],
  "math.order_of_ops": [
    { title: "Math Basics 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" }
  ],
  "math.integers": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" }
  ],
  "math.coordinate_plane": [
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" },
    { title: "Graph Books", type: "supplement", gradeRange: "All grades", notes: "Graph paper for plotting" }
  ],
  "math.basic_geometry": [
    { title: "Math Basics 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.absolute_value": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" }
  ],
  "math.negatives": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" }
  ],
  "math.fraction_operations": [
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" },
    { title: "100 Days of Money/Fractions", type: "workbook", gradeRange: "Gr. 3–5" }
  ],
  "math.mixed_numbers": [
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" }
  ],
  "math.decimal_operations": [
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" }
  ],
  "math.factors_and_multiples": [
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Multiplication & Division Math for 3–5th Gr.", type: "workbook", gradeRange: "Gr. 3–5" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" }
  ],
  "math.gcf_and_lcm": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" }
  ],
  "math.prime_and_composite": [
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" }
  ],
  "math.powers_of_10": [
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" }
  ],
  "math.square_roots": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" }
  ],
  "math.estimation": [
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Math Basics 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" }
  ],
  "math.unit_conversion": [
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Essential Math 1", type: "textbook", gradeRange: "Gr. 5–7" }
  ],
  "math.perimeter": [
    { title: "Math Basics 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Math Basics 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" }
  ],
  "math.types_of_angles": [
    { title: "Math Basics 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.types_of_lines": [
    { title: "Math Basics 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.geometry_basics": [
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.line_symmetry": [
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.nets_of_3d_shapes": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.mean_median_mode": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" }
  ],
  "math.data_collection": [
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Graph Books", type: "supplement", gradeRange: "All grades" }
  ],
  "math.mass_and_capacity": [
    { title: "IXL Workbook Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" }
  ],

  // --- TIER 4: Middle school ---
  "math.variables_expr": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" }
  ],
  "math.linear_equations": [
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" },
    { title: "Graph Books", type: "supplement", gradeRange: "All grades", notes: "Graphing equations" }
  ],
  "math.inequalities": [
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" }
  ],
  "math.functions": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" },
    { title: "Graph Books", type: "supplement", gradeRange: "All grades" }
  ],
  "math.graphing": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" },
    { title: "Graph Books", type: "supplement", gradeRange: "All grades", notes: "Essential for graphing practice" }
  ],
  "math.systems_of_eq": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" },
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" }
  ],
  "math.polynomials": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" },
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" }
  ],
  "math.factoring": [
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" }
  ],
  "math.basic_algebraic_expressions": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" }
  ],
  "math.one_step_equations": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" }
  ],
  "math.multi_step_equations": [
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" }
  ],
  "math.solving_simple_equations": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" }
  ],
  "math.literal_equations": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" }
  ],
  "math.scientific_notation": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" }
  ],
  "math.irrational_numbers": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" }
  ],
  "math.radicals": [
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" }
  ],
  "math.ratio_and_proportion": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" }
  ],
  "math.probability_basics": [
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" },
    { title: "What's The Point of Math", type: "supplement", gradeRange: "Gr. 3–6", notes: "Probability concepts" }
  ],
  "math.statistics_basics": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" }
  ],
  "math.scatter_plots": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Graph Books", type: "supplement", gradeRange: "All grades" }
  ],
  "math.box_plots": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" }
  ],
  "math.surface_area": [
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.area": [
    { title: "Math Basics 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "IXL Workbook Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "IXL Workbook Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.angles_and_lines": [
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.parallel_lines_transversals": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.similar_figures": [
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.financial_math": [
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Essential Math 2", type: "textbook", gradeRange: "Gr. 6–8" },
    { title: "What's The Point of Math", type: "supplement", gradeRange: "Gr. 3–6", notes: "Practical money math" }
  ],
  "math.sampling_methods": [
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" }
  ],
  "math.comparing_distributions": [
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" }
  ],
  "math.two_way_tables": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" }
  ],
  "math.domain_and_range": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" }
  ],
  "math.compound_probability": [
    { title: "IXL Workbook Gr. 7", type: "workbook", gradeRange: "Gr. 7" }
  ],
  "math.cube_roots": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" }
  ],

  // --- TIER 5: High school geometry/algebra ---
  "math.euclidean_geo": [
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.proofs": [
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.triangles_cong": [
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.circles_geo": [
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.transformations": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.trig_ratios": [
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" },
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" }
  ],
  "math.solid_geometry": [
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.triangles_pythagorean": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.coordinate_geometry": [
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" },
    { title: "Graph Books", type: "supplement", gradeRange: "All grades" }
  ],
  "math.similarity": [
    { title: "Essential Math Geometry", type: "textbook", gradeRange: "Gr. 7–10" }
  ],
  "math.exponents": [
    { title: "IXL Workbook Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Essential Math Pre-Algebra", type: "textbook", gradeRange: "Gr. 7–9" },
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" }
  ],

  // --- TIER 6+: Algebra 2, Pre-Calc, Calculus ---
  "math.quadratics": [
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" }
  ],
  "math.exponential_log": [
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" }
  ],
  "math.sequences_series": [
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" }
  ],
  "math.matrices": [
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" }
  ],
  "math.complex_numbers": [
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" }
  ],
  "math.completing_the_square": [
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" }
  ],
  "math.quadratic_equations": [
    { title: "No-Nonsense Algebra", type: "textbook", gradeRange: "Gr. 8–10" }
  ],

  // ===========================================================
  // LANGUAGE DOMAIN
  // ===========================================================

  // --- TIER 1: Early literacy ---
  "lang.phonemic_awareness": [
    { title: "Spectrum Language Arts Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "How To Be Good In English, Gr 2–8", type: "textbook", gradeRange: "Gr. 2–8" }
  ],
  "lang.letter_recognition": [
    { title: "Print Boys", type: "workbook", gradeRange: "K–2", notes: "Print handwriting practice" },
    { title: "Print Girls", type: "workbook", gradeRange: "K–2", notes: "Print handwriting practice" },
    { title: "Spectrum Language Arts Gr. 2", type: "workbook", gradeRange: "Gr. 2" }
  ],
  "lang.basic_vocab": [
    { title: "Spectrum Language Arts Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Merriam Webster Elementary Dictionary", type: "reference", gradeRange: "K–5" },
    { title: "How To Be Good In English, Gr 2–8", type: "textbook", gradeRange: "Gr. 2–8" }
  ],
  "lang.listening_comp": [
    { title: "Reading Skills 1", type: "workbook", gradeRange: "Gr. 1" },
    { title: "Reading Skills 2", type: "workbook", gradeRange: "Gr. 2" }
  ],
  "lang.basic_comprehension": [
    { title: "Reading Skills 1", type: "workbook", gradeRange: "Gr. 1" },
    { title: "Reading Skills 2", type: "workbook", gradeRange: "Gr. 2" }
  ],
  "lang.main_ideas": [
    { title: "Reading Skills 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Reading Skills 3", type: "workbook", gradeRange: "Gr. 3" }
  ],

  // --- TIER 2: Developing readers ---
  "lang.phonics": [
    { title: "Spectrum Language Arts Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Spectrum Language Arts Gr. 3", type: "workbook", gradeRange: "Gr. 3" }
  ],
  "lang.sight_words": [
    { title: "Spectrum Language Arts Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Reading Skills 1", type: "workbook", gradeRange: "Gr. 1" },
    { title: "Reading Skills 2", type: "workbook", gradeRange: "Gr. 2" }
  ],
  "lang.reading_fluency": [
    { title: "Reading Skills 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Reading Skills 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "How To Be Good In English, Gr 2–8", type: "textbook", gradeRange: "Gr. 2–8" }
  ],
  "lang.handwriting": [
    { title: "Print Boys", type: "workbook", gradeRange: "K–2", notes: "Print practice" },
    { title: "Print Girls", type: "workbook", gradeRange: "K–2", notes: "Print practice" },
    { title: "Cursive Boys", type: "workbook", gradeRange: "Gr. 2–4", notes: "Cursive practice" },
    { title: "Cursive Girls", type: "workbook", gradeRange: "Gr. 2–4", notes: "Cursive practice" },
    { title: "Cursive for Teens", type: "workbook", gradeRange: "Gr. 6–12", notes: "Cursive refresher for older students" },
    { title: "Notepads", type: "supplement", gradeRange: "All grades", notes: "Writing practice paper" }
  ],
  "lang.spelling": [
    { title: "Spectrum Language Arts Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Spectrum Language Arts Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Spectrum Language Arts Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "How To Be Good In English, Gr 2–8", type: "textbook", gradeRange: "Gr. 2–8" }
  ],
  "lang.sentence_structure": [
    { title: "Spectrum Language Arts Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Spectrum Language Arts Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Kumon Writing 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Kumon Writing 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Spectrum Writing Gr. 2", type: "workbook", gradeRange: "Gr. 2" },
    { title: "Spectrum Writing Gr. 3", type: "workbook", gradeRange: "Gr. 3" }
  ],
  "lang.text_features": [
    { title: "Reading Skills 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Reading Skills 4", type: "workbook", gradeRange: "Gr. 4" }
  ],
  "lang.inferences": [
    { title: "Reading Skills 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Reading Skills 4", type: "workbook", gradeRange: "Gr. 4" }
  ],
  "lang.vocab_development": [
    { title: "Spectrum Language Arts Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Spectrum Language Arts Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Merriam Webster Elementary Dictionary", type: "reference", gradeRange: "K–5" },
    { title: "Middle School Visual Vocabulary", type: "workbook", gradeRange: "Gr. 6–8" }
  ],
  "lang.alphabetizing": [
    { title: "Merriam Webster Elementary Dictionary", type: "reference", gradeRange: "K–5", notes: "Alphabetical reference practice" },
    { title: "Webster's Dictionary", type: "reference", gradeRange: "Gr. 5+" },
    { title: "Webster's Thesaurus", type: "reference", gradeRange: "Gr. 5+" }
  ],

  // --- TIER 3: Reading comprehension & writing ---
  "lang.reading_comp": [
    { title: "Reading Skills 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Reading Skills 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Reading Skills 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Reading Skills 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "How To Be Good In English, Gr 2–8", type: "textbook", gradeRange: "Gr. 2–8" }
  ],
  "lang.grammar": [
    { title: "Spectrum Language Arts Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Spectrum Language Arts Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Spectrum Language Arts Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Spectrum Language Arts Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Spectrum Language Arts Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Spectrum Language Arts Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "How To Be Good In English, Gr 2–8", type: "textbook", gradeRange: "Gr. 2–8" }
  ],
  "lang.paragraph_writing": [
    { title: "How to Write a Paragraph, Gr 3–5", type: "workbook", gradeRange: "Gr. 3–5" },
    { title: "How to Write a Paragraph, Gr 6–8", type: "workbook", gradeRange: "Gr. 6–8" },
    { title: "Kumon Writing 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Kumon Writing 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Spectrum Writing Gr. 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Spectrum Writing Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Notepads", type: "supplement", gradeRange: "All grades" }
  ],
  "lang.expanded_vocab": [
    { title: "Spectrum Language Arts Gr. 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Spectrum Language Arts Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Middle School Visual Vocabulary", type: "workbook", gradeRange: "Gr. 6–8" },
    { title: "Vocabulary Cartoon 1", type: "supplement", gradeRange: "Gr. 6–9", notes: "Visual vocabulary building" },
    { title: "Merriam Webster Elementary Dictionary", type: "reference", gradeRange: "K–5" }
  ],
  "lang.dictionary_skills": [
    { title: "Merriam Webster Elementary Dictionary", type: "reference", gradeRange: "K–5" },
    { title: "Webster's Dictionary", type: "reference", gradeRange: "Gr. 5+" },
    { title: "Webster's Thesaurus", type: "reference", gradeRange: "Gr. 5+" },
    { title: "Roget's 21st Century Thesaurus", type: "reference", gradeRange: "Gr. 6+" }
  ],
  "lang.lit_intro": [
    { title: "Reading Skills 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Reading Skills 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "How To Write A Story, Gr 1–3", type: "workbook", gradeRange: "Gr. 1–3", notes: "Story elements introduction" }
  ],
  "lang.fiction_elements": [
    { title: "Reading Skills 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Reading Skills 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "How To Write A Story, Gr 4–6", type: "workbook", gradeRange: "Gr. 4–6" }
  ],
  "lang.plot_structure": [
    { title: "Reading Skills 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Reading Skills 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "How To Write A Story, Gr 4–6", type: "workbook", gradeRange: "Gr. 4–6" }
  ],
  "lang.supporting_details": [
    { title: "Reading Skills 3", type: "workbook", gradeRange: "Gr. 3" },
    { title: "Reading Skills 4", type: "workbook", gradeRange: "Gr. 4" }
  ],
  "lang.cause_effect_lang": [
    { title: "Reading Skills 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Reading Skills 5", type: "workbook", gradeRange: "Gr. 5" }
  ],

  // --- TIER 4: Essay writing, analysis, research ---
  "lang.essay_writing": [
    { title: "How to Write an Essay, Gr 5–8", type: "workbook", gradeRange: "Gr. 5–8" },
    { title: "Spectrum Writing Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Spectrum Writing Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Spectrum Writing Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Spectrum Writing Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Kumon Writing 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Kumon Writing 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Wordsmith", type: "textbook", gradeRange: "Gr. 5–8", notes: "Writing instruction and practice" }
  ],
  "lang.literary_analysis": [
    { title: "Reading Skills 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Reading Skills 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "How to Write a Book Report, Gr 5–8", type: "workbook", gradeRange: "Gr. 5–8" }
  ],
  "lang.figurative_lang": [
    { title: "Spectrum Language Arts Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Spectrum Language Arts Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Vocabulary Cartoon 1", type: "supplement", gradeRange: "Gr. 6–9" },
    { title: "Vocabulary Cartoon 2", type: "supplement", gradeRange: "Gr. 8–12" }
  ],
  "lang.research_skills": [
    { title: "How to Write a Book Report, Gr 5–8", type: "workbook", gradeRange: "Gr. 5–8" },
    { title: "Wordsmith", type: "textbook", gradeRange: "Gr. 5–8" },
    { title: "Webster's Dictionary", type: "reference", gradeRange: "Gr. 5+" },
    { title: "Roget's 21st Century Thesaurus", type: "reference", gradeRange: "Gr. 6+" }
  ],
  "lang.note_taking": [
    { title: "Notepads", type: "supplement", gradeRange: "All grades" },
    { title: "Kumon Writing 4", type: "workbook", gradeRange: "Gr. 4" },
    { title: "Kumon Writing 5", type: "workbook", gradeRange: "Gr. 5" }
  ],
  "lang.public_speaking_basic": [
    { title: "Wordsmith", type: "textbook", gradeRange: "Gr. 5–8", notes: "Communication foundations" }
  ],
  "lang.character_analysis": [
    { title: "Reading Skills 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Reading Skills 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "How to Write a Book Report, Gr 5–8", type: "workbook", gradeRange: "Gr. 5–8" }
  ],
  "lang.theme": [
    { title: "Reading Skills 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Reading Skills 6", type: "workbook", gradeRange: "Gr. 6" }
  ],
  "lang.textual_evidence": [
    { title: "Reading Skills 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Reading Skills 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "How to Write an Essay, Gr 5–8", type: "workbook", gradeRange: "Gr. 5–8" }
  ],
  "lang.research_basics": [
    { title: "Wordsmith", type: "textbook", gradeRange: "Gr. 5–8" },
    { title: "Webster's Dictionary", type: "reference", gradeRange: "Gr. 5+" },
    { title: "Webster's Thesaurus", type: "reference", gradeRange: "Gr. 5+" }
  ],

  // --- TIER 5: Advanced writing & rhetoric ---
  "lang.persuasive_writing": [
    { title: "Spectrum Writing Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Spectrum Writing Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Spectrum Writing Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "Wordsmith", type: "textbook", gradeRange: "Gr. 5–8" },
    { title: "Wordsmith Craftsman", type: "textbook", gradeRange: "Gr. 9–12", notes: "Advanced persuasive techniques" }
  ],
  "lang.comparative_analysis": [
    { title: "Reading Skills 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Wordsmith Craftsman", type: "textbook", gradeRange: "Gr. 9–12" }
  ],
  "lang.rhetoric": [
    { title: "Wordsmith Craftsman", type: "textbook", gradeRange: "Gr. 9–12" }
  ],
  "lang.adv_grammar": [
    { title: "Spectrum Language Arts Gr. 7", type: "workbook", gradeRange: "Gr. 7" },
    { title: "Spectrum Language Arts Gr. 8", type: "workbook", gradeRange: "Gr. 8" },
    { title: "How To Be Good In English, Gr 2–8", type: "textbook", gradeRange: "Gr. 2–8" },
    { title: "Wordsmith Craftsman", type: "textbook", gradeRange: "Gr. 9–12" }
  ],
  "lang.creative_writing": [
    { title: "How To Write A Story, Gr 4–6", type: "workbook", gradeRange: "Gr. 4–6" },
    { title: "Kumon Writing 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Kumon Writing 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Spectrum Writing Gr. 5", type: "workbook", gradeRange: "Gr. 5" },
    { title: "Spectrum Writing Gr. 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Wordsmith", type: "textbook", gradeRange: "Gr. 5–8" }
  ],
  "lang.poetry_analysis": [
    { title: "Vocabulary Cartoon 1", type: "supplement", gradeRange: "Gr. 6–9", notes: "Vocabulary for literary analysis" },
    { title: "Vocabulary Cartoon 2", type: "supplement", gradeRange: "Gr. 8–12" }
  ],
  "lang.adv_literature": [
    { title: "Reading Skills 6", type: "workbook", gradeRange: "Gr. 6" },
    { title: "Wordsmith Craftsman", type: "textbook", gradeRange: "Gr. 9–12" }
  ],
  "lang.research_writing": [
    { title: "How to Write an Essay, Gr 5–8", type: "workbook", gradeRange: "Gr. 5–8" },
    { title: "Wordsmith", type: "textbook", gradeRange: "Gr. 5–8" },
    { title: "Writing With Skill 1", type: "textbook", gradeRange: "Gr. 5–8", notes: "Systematic writing instruction" }
  ],

  // --- TIER 6+: Academic and professional writing ---
  "lang.academic_writing": [
    { title: "Writing With Skill 1", type: "textbook", gradeRange: "Gr. 5–8" },
    { title: "Writing With Skill 2", type: "textbook", gradeRange: "Gr. 7–9" },
    { title: "Wordsmith Craftsman", type: "textbook", gradeRange: "Gr. 9–12" }
  ],
  "lang.literary_criticism": [
    { title: "Wordsmith Craftsman", type: "textbook", gradeRange: "Gr. 9–12" }
  ],
  "lang.adv_rhetoric": [
    { title: "Wordsmith Craftsman", type: "textbook", gradeRange: "Gr. 9–12" }
  ],
  "lang.technical_writing": [
    { title: "Writing With Skill 2", type: "textbook", gradeRange: "Gr. 7–9" },
    { title: "Writing With Skill 3", type: "textbook", gradeRange: "Gr. 9–12" }
  ],
  "lang.adv_writing_styles": [
    { title: "Writing With Skill 2", type: "textbook", gradeRange: "Gr. 7–9" },
    { title: "Writing With Skill 3", type: "textbook", gradeRange: "Gr. 9–12" },
    { title: "Wordsmith Craftsman", type: "textbook", gradeRange: "Gr. 9–12" }
  ],
  "lang.critical_thinking_lang": [
    { title: "Wordsmith Craftsman", type: "textbook", gradeRange: "Gr. 9–12" }
  ],

  // --- TIER 7+: Advanced research and writing ---
  "lang.research_papers": [
    { title: "Writing With Skill 2", type: "textbook", gradeRange: "Gr. 7–9" },
    { title: "Writing With Skill 3", type: "textbook", gradeRange: "Gr. 9–12" }
  ],
  "lang.thesis_development": [
    { title: "Writing With Skill 3", type: "textbook", gradeRange: "Gr. 9–12" }
  ],
  "lang.editing_revision": [
    { title: "Writing With Skill 2", type: "textbook", gradeRange: "Gr. 7–9" },
    { title: "Writing With Skill 3", type: "textbook", gradeRange: "Gr. 9–12" },
    { title: "Wordsmith Craftsman", type: "textbook", gradeRange: "Gr. 9–12" }
  ],

  // ===========================================================
  // SCIENCE DOMAIN
  // ===========================================================

  // --- TIER 1-3: Elementary science ---
  "science.observation_skills": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8", notes: "Comprehensive science reference" }
  ],
  "science.animal_biology": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" }
  ],
  "science.plant_biology": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" }
  ],
  "science.human_body": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" }
  ],
  "science.ecosystems": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" }
  ],
  "science.states_of_matter": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" },
    { title: "Changes in Matter", type: "textbook", gradeRange: "Gr. 4–7" },
    { title: "What's Chemistry All About", type: "supplement", gradeRange: "Gr. 5–8", notes: "Intro to chemistry concepts" }
  ],
  "science.earth_science": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" }
  ],
  "science.weather_patterns": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" }
  ],
  "science.simple_machines": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" }
  ],
  "science.scientific_method": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" },
    { title: "How to Survive Middle School Science", type: "supplement", gradeRange: "Gr. 6–8" }
  ],
  "science.biology_intro": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" }
  ],
  "science.physics_intro": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" }
  ],
  "science.chemistry_intro": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" },
    { title: "What's Chemistry All About", type: "supplement", gradeRange: "Gr. 5–8" },
    { title: "Changes in Matter", type: "textbook", gradeRange: "Gr. 4–7" }
  ],

  // --- TIER 4: Middle school science ---
  "science.basic_chemistry": [
    { title: "What's Chemistry All About", type: "supplement", gradeRange: "Gr. 5–8" },
    { title: "Focus On Chemistry", type: "textbook", gradeRange: "Gr. 6–9" },
    { title: "Focus On Chemistry Lab", type: "workbook", gradeRange: "Gr. 6–9", notes: "Hands-on lab experiments" },
    { title: "Changes in Matter", type: "textbook", gradeRange: "Gr. 4–7" },
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" }
  ],
  "science.cells_intro": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" }
  ],
  "science.energy_types": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" },
    { title: "How to Survive Middle School Science", type: "supplement", gradeRange: "Gr. 6–8" }
  ],
  "science.forces_motion": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" },
    { title: "How to Survive Middle School Science", type: "supplement", gradeRange: "Gr. 6–8" }
  ],

  // --- TIER 5: Atoms, molecules, chemistry ---
  "science.atoms_molecules": [
    { title: "Atoms and Molecules", type: "textbook", gradeRange: "Gr. 6–9" },
    { title: "Illustrated Book of Elements", type: "reference", gradeRange: "Gr. 5–10", notes: "Visual periodic table reference" },
    { title: "Focus On Chemistry", type: "textbook", gradeRange: "Gr. 6–9" },
    { title: "What's Chemistry All About", type: "supplement", gradeRange: "Gr. 5–8" }
  ],
  "science.periodic_table": [
    { title: "Illustrated Book of Elements", type: "reference", gradeRange: "Gr. 5–10", notes: "Complete visual element guide" },
    { title: "Atoms and Molecules", type: "textbook", gradeRange: "Gr. 6–9" },
    { title: "Focus On Chemistry", type: "textbook", gradeRange: "Gr. 6–9" }
  ],
  "science.chemical_reactions": [
    { title: "Focus On Chemistry", type: "textbook", gradeRange: "Gr. 6–9" },
    { title: "Focus On Chemistry Lab", type: "workbook", gradeRange: "Gr. 6–9", notes: "Reaction experiments" },
    { title: "Changes in Matter", type: "textbook", gradeRange: "Gr. 4–7" }
  ],
  "science.acids_bases": [
    { title: "Focus On Chemistry", type: "textbook", gradeRange: "Gr. 6–9" },
    { title: "Focus On Chemistry Lab", type: "workbook", gradeRange: "Gr. 6–9", notes: "pH and indicator experiments" }
  ],
  "science.cell_biology": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" },
    { title: "How to Survive Middle School Science", type: "supplement", gradeRange: "Gr. 6–8" }
  ],
  "science.ecology": [
    { title: "DK Help Your Kids With Science", type: "reference", gradeRange: "Gr. 3–8" }
  ],

  // --- TIER 6: Advanced chemistry ---
  "science.chemistry_reactions": [
    { title: "Focus On Chemistry", type: "textbook", gradeRange: "Gr. 6–9" },
    { title: "Focus On Chemistry Lab", type: "workbook", gradeRange: "Gr. 6–9" }
  ],
  "science.chemical_bonding": [
    { title: "Focus On Chemistry", type: "textbook", gradeRange: "Gr. 6–9" },
    { title: "Atoms and Molecules", type: "textbook", gradeRange: "Gr. 6–9" },
    { title: "Illustrated Book of Elements", type: "reference", gradeRange: "Gr. 5–10" }
  ],
  "science.stoichiometry": [
    { title: "Focus On Chemistry", type: "textbook", gradeRange: "Gr. 6–9" },
    { title: "Focus On Chemistry Lab", type: "workbook", gradeRange: "Gr. 6–9" }
  ]
};
