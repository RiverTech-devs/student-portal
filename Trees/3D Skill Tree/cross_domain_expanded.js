// Cross-domain connections (chain-pruned): kept only deepest-source + deepest-target for each bridge.
// Total: 1028 connections across 741 skills.
// Lower skills in a prereq chain inherit their descendant's cross-domain links via the chain itself.

window.CROSS_DOMAIN_EXPANDED = {
  "creative.3d_rendering": [
    { target: "tech.computer_graphics", label: "Ray tracing and rendering engine physics" },
    { target: "science.light_optics", label: "Simulated light behavior in 3D renders" }
  ],
  "creative.3d_sculpting": [
    { target: "math.3d_shapes", label: "3D surface topology and geometry" }
  ],
  "creative.adv_acting": [
    { target: "social.psychology_intro", label: "Emotional memory and character psychology" }
  ],
  "creative.adv_choreography": [
    { target: "science.forces_motion", label: "Kinetic energy and momentum in movement" },
    { target: "math.patterns_and_sequences", label: "Complex movement pattern and sequence design" }
  ],
  "creative.adv_playwriting": [
    { target: "lang.drama_analysis", label: "Dramaturgical structure and text analysis" },
    { target: "lang.narrative_theory", label: "Advanced narrative theory in drama" }
  ],
  "creative.adv_sculpture": [
    { target: "math.3d_shapes", label: "3D geometric form and volume in sculpture" }
  ],
  "creative.ai_assisted_art": [
    { target: "tech.generative_ai_eng", label: "Generative model prompting and output" }
  ],
  "creative.architectural_rendering": [
    { target: "tech.cad_3d_modeling", label: "3D modeling and rendering software" },
    { target: "science.light_optics", label: "Light simulation in architectural renders" }
  ],
  "creative.architecture": [
    { target: "math.trig_ratios", label: "Structural angle and load calculations" },
    { target: "math.solid_geometry", label: "Spatial geometry" }
  ],
  "creative.art_appreciation": [
    { target: "social.cultural_studies", label: "Cultural meaning and artistic tradition" },
    { target: "social.world_hist_modern", label: "Historical context shaping artistic movements" }
  ],
  "creative.art_criticism": [
    { target: "lang.literary_criticism", label: "Critical theory applied to visual art" }
  ],
  "creative.art_ethics": [
    { target: "social.ethical_theory", label: "Intellectual property and moral rights" },
    { target: "tech.data_privacy", label: "AI art and data sourcing ethics" }
  ],
  "creative.art_history": [
    { target: "social.world_hist_modern", label: "Art movements in historical context" }
  ],
  "creative.art_therapy": [
    { target: "social.psychology_intro", label: "Therapeutic use of creative expression" },
    { target: "science.nervous_system", label: "Neurological benefits of art in therapy" }
  ],
  "creative.ballroom_dance": [
    { target: "science.forces_motion", label: "Partner weight and centripetal force" },
    { target: "math.patterns_and_sequences", label: "Repeating footwork pattern sequences" }
  ],
  "creative.building_blocks": [
    { target: "science.engineering_design_intro", label: "Basic structural design principles" }
  ],
  "creative.calligraphy_lettering": [
    { target: "math.angles_and_lines", label: "Stroke angles and geometric letterforms" }
  ],
  "creative.ceramics_adv": [
    { target: "science.materials_science", label: "Ceramic glaze chemistry and kiln science" }
  ],
  "creative.cinematography": [
    { target: "science.light_optics", label: "Lens physics and depth of field" },
    { target: "math.angles_and_lines", label: "Camera angle geometry and composition" }
  ],
  "creative.circus_arts": [
    { target: "science.forces_motion", label: "Acrobatic physics and center of gravity" }
  ],
  "creative.color_theory": [
    { target: "science.electromagnetic_spectrum", label: "Visible light spectrum physics" }
  ],
  "creative.comic_graphic_novel": [
    { target: "lang.narrative_techniques", label: "Panel-based visual narrative pacing" },
    { target: "science.anatomy_physiology", label: "Anatomical figure accuracy in comics" }
  ],
  "creative.concept_art": [
    { target: "science.anatomy_physiology", label: "Anatomy for believable concept figures" }
  ],
  "creative.conducting": [
    { target: "science.waves_sound", label: "Ensemble acoustic blend and dynamics" },
    { target: "math.fractions", label: "Beat subdivision conducting patterns" }
  ],
  "creative.content_creation": [
    { target: "tech.digital_media_creation", label: "Digital platform content tools" },
    { target: "social.media_studies", label: "Audience engagement and platform culture" }
  ],
  "creative.creative_entrepreneurship": [
    { target: "social.microeconomics", label: "Creative market pricing and economics" }
  ],
  "creative.curation": [
    { target: "social.cultural_studies", label: "Cultural context in artwork selection" }
  ],
  "creative.darkroom_photo": [
    { target: "science.chemistry_reactions", label: "Photochemical development reactions" },
    { target: "science.light_optics", label: "Enlarger optics and exposure control" }
  ],
  "creative.documentary_filmmaking": [
    { target: "lang.journalism", label: "Journalistic research and fact-checking" },
    { target: "social.primary_secondary_sources", label: "Historical source research methods" }
  ],
  "creative.documentary_sound": [
    { target: "science.waves_sound", label: "Field recording and acoustic environment" },
    { target: "tech.signal_processing", label: "Location audio processing and mixing" }
  ],
  "creative.encaustic_mixed": [
    { target: "science.chemistry_intro", label: "Wax melting and pigment chemistry" }
  ],
  "creative.exhibition_design": [
    { target: "math.measurement", label: "Spatial layout and dimensional planning" },
    { target: "science.light_optics", label: "Exhibition lighting design principles" }
  ],
  "creative.fashion_design": [
    { target: "math.measurement", label: "Body measurement and pattern sizing" },
    { target: "science.materials_science", label: "Textile fiber properties" }
  ],
  "creative.fashion_illustration": [
    { target: "science.anatomy_physiology", label: "Human body proportions for illustration" }
  ],
  "creative.film_post_prod": [
    { target: "tech.signal_processing", label: "Audio and video digital post-processing" },
    { target: "tech.digital_media_creation", label: "Non-linear editing software tools" }
  ],
  "creative.film_production": [
    { target: "lang.screenwriting_lang", label: "Script-to-screen production process" }
  ],
  "creative.film_scoring": [
    { target: "science.waves_sound", label: "Audio-visual synchronization physics" },
    { target: "math.fractions", label: "Tempo synchronization to frame rate" }
  ],
  "creative.freelancing": [
    { target: "math.percentages", label: "Tax percentage on freelance income" }
  ],
  "creative.game_design": [
    { target: "math.probability_basics", label: "Probability and randomness in game systems" },
    { target: "social.psychology_intro", label: "Player motivation and behavioral loops" }
  ],
  "creative.glass_art": [
    { target: "science.materials_science", label: "Glass thermal properties and kiln firing" }
  ],
  "creative.grant_writing": [
    { target: "lang.grant_writing", label: "Grant proposal writing and structure" }
  ],
  "creative.guitar_basics": [
    { target: "math.ratios", label: "Fret spacing and frequency ratios" },
    { target: "science.waves_sound", label: "String vibration and resonance physics" }
  ],
  "creative.harmony_counterpoint": [
    { target: "math.ratios", label: "Consonant and dissonant frequency ratios" }
  ],
  "creative.icon_symbol_design": [
    { target: "math.basic_geometry", label: "Geometric simplification and icon forms" }
  ],
  "creative.improv_theater": [
    { target: "social.psychology_intro", label: "Spontaneity and cognitive flexibility" }
  ],
  "creative.industrial_design": [
    { target: "math.measurement", label: "Precise dimensional measurement and tolerance" },
    { target: "tech.cad_3d_modeling", label: "CAD modeling for industrial prototyping" }
  ],
  "creative.infographic_design": [
    { target: "math.statistics_basics", label: "Accurate data representation in charts" },
    { target: "tech.data_viz", label: "Data visualization design principles" }
  ],
  "creative.installation_art": [
    { target: "science.materials_science", label: "Structural material choices for installations" }
  ],
  "creative.jazz_studies": [
    { target: "math.ratios", label: "Extended harmonic ratios in jazz chords" },
    { target: "science.waves_sound", label: "Acoustic improvisation and overtones" }
  ],
  "creative.layout_design": [
    { target: "math.basic_geometry", label: "Grid systems and geometric layout" }
  ],
  "creative.leather_bookbinding": [
    { target: "science.materials_science", label: "Leather and adhesive material properties" },
    { target: "math.measurement", label: "Precise dimensional cutting and assembly" }
  ],
  "creative.machine_learning_creative": [
    { target: "tech.deep_learning", label: "Neural network models for creative output" },
    { target: "math.statistics_basics", label: "Statistical foundations of ML models" }
  ],
  "creative.marketing_creative": [
    { target: "social.psychology_intro", label: "Audience persuasion and emotional appeal" }
  ],
  "creative.master_craftsmanship": [
    { target: "science.materials_science", label: "Deep material knowledge for craft mastery" }
  ],
  "creative.metalworking": [
    { target: "science.materials_science", label: "Metal properties under heat and stress" }
  ],
  "creative.mosaic_tile": [
    { target: "math.basic_geometry", label: "Tessellation and geometric tiling patterns" }
  ],
  "creative.motion_design_adv": [
    { target: "math.transformations", label: "Easing curves and geometric animation math" },
    { target: "tech.computer_graphics", label: "Advanced motion graphics rendering" }
  ],
  "creative.mural_public_art": [
    { target: "math.measurement", label: "Large-scale proportional grid measurement" },
    { target: "social.cultural_studies", label: "Community context and public art meaning" }
  ],
  "creative.music_history": [
    { target: "social.world_hist_modern", label: "Musical movements in historical context" }
  ],
  "creative.music_performance": [
    { target: "science.waves_sound", label: "Performance venue acoustics" }
  ],
  "creative.music_theater": [
    { target: "lang.drama_analysis", label: "Musical script and dramatic interpretation" }
  ],
  "creative.narrative_design": [
    { target: "lang.narrative_techniques", label: "Branching narrative and story structure" },
    { target: "tech.game_dev_basics", label: "Interactive narrative in game systems" }
  ],
  "creative.nft_digital_assets": [
    { target: "tech.blockchain", label: "Blockchain token ownership mechanics" }
  ],
  "creative.oil_acrylic_painting": [
    { target: "science.chemistry_intro", label: "Paint medium chemistry and drying" }
  ],
  "creative.opera_musical_theater": [
    { target: "science.anatomy_physiology", label: "Vocal anatomy for operatic technique" },
    { target: "lang.drama_analysis", label: "Libretto analysis and dramatic performance" }
  ],
  "creative.orchestration": [
    { target: "math.ratios", label: "Harmonic frequency ratios in scoring" }
  ],
  "creative.package_design": [
    { target: "science.materials_science", label: "Packaging material structural properties" },
    { target: "math.3d_shapes", label: "Net diagrams and 3D unfolding geometry" }
  ],
  "creative.perspective_drawing": [
    { target: "math.coordinate_geometry", label: "Vanishing points and coordinate geometry" },
    { target: "math.similar_figures", label: "Proportional scaling in perspective" }
  ],
  "creative.photo_composition": [
    { target: "math.basic_geometry", label: "Rule-of-thirds geometric framing" }
  ],
  "creative.piano_keyboard": [
    { target: "math.fractions", label: "Rhythmic note values as fractions" },
    { target: "science.waves_sound", label: "String vibration and pitch production" }
  ],
  "creative.playwriting": [
    { target: "lang.narrative_techniques", label: "Scene and act narrative structure" }
  ],
  "creative.podcast_production": [
    { target: "science.waves_sound", label: "Microphone acoustics and audio quality" },
    { target: "tech.signal_processing", label: "Audio editing and signal processing" }
  ],
  "creative.poetry": [
    { target: "lang.poetry_analysis", label: "Meter, form, and poetic devices" }
  ],
  "creative.portraiture": [
    { target: "science.anatomy_physiology", label: "Facial musculature and bone structure" },
    { target: "math.proportions", label: "Facial proportion measurement ratios" }
  ],
  "creative.print_design": [
    { target: "tech.digital_media_creation", label: "Print-ready file and color management" }
  ],
  "creative.printmaking": [
    { target: "science.chemistry_intro", label: "Acid etching and chemical reactions" }
  ],
  "creative.production_design": [
    { target: "science.materials_science", label: "Set material properties and durability" }
  ],
  "creative.prompt_crafting": [
    { target: "lang.word_choice_style", label: "Precise language for descriptive prompts" }
  ],
  "creative.rigging": [
    { target: "math.transformations", label: "Skeletal transformation math" },
    { target: "tech.computer_graphics", label: "3D rigging in graphics software" }
  ],
  "creative.scientific_illustration": [
    { target: "science.anatomy_physiology", label: "Anatomical detail in scientific diagrams" }
  ],
  "creative.sight_reading": [
    { target: "math.fractions", label: "Instant note duration calculation" }
  ],
  "creative.songwriting": [
    { target: "lang.creative_writing", label: "Lyric craft and poetic structure" },
    { target: "math.fractions", label: "Rhythmic syllable and beat matching" }
  ],
  "creative.stage_combat": [
    { target: "science.forces_motion", label: "Safe force application and momentum control" }
  ],
  "creative.stage_design": [
    { target: "science.light_optics", label: "Stage lighting physics and color" },
    { target: "math.measurement", label: "Scale measurement for stage construction" }
  ],
  "creative.still_life": [
    { target: "science.light_optics", label: "Light source direction and shadow casting" }
  ],
  "creative.stop_motion": [
    { target: "science.forces_motion", label: "Physical material manipulation and gravity" },
    { target: "tech.digital_media_creation", label: "Frame capture and editing tools" }
  ],
  "creative.street_photography": [
    { target: "science.light_optics", label: "Available light and exposure adaptation" },
    { target: "social.cultural_studies", label: "Documenting urban cultural life" }
  ],
  "creative.string_orchestra": [
    { target: "science.waves_sound", label: "Bowed string resonance and harmonics" }
  ],
  "creative.textile_arts": [
    { target: "math.patterns_and_sequences", label: "Repeating geometric pattern design" }
  ],
  "creative.typography": [
    { target: "lang.linguistics_basics", label: "Letterform and script systems" }
  ],
  "creative.ux_ui_design": [
    { target: "social.psychology_intro", label: "Cognitive load and user behavior" }
  ],
  "creative.vfx": [
    { target: "science.forces_motion", label: "Physics simulation for VFX realism" }
  ],
  "creative.voice_technique": [
    { target: "science.waves_sound", label: "Resonance chambers and vocal acoustics" }
  ],
  "creative.watercolor_gouache": [
    { target: "science.chemistry_intro", label: "Pigment-water interaction chemistry" }
  ],
  "creative.web_design": [
    { target: "tech.ui_ux_design", label: "User experience and interaction design" }
  ],
  "creative.woodworking": [
    { target: "science.materials_science", label: "Wood grain, strength, and material properties" },
    { target: "math.measurement", label: "Precise dimensional measurement in joinery" }
  ],
  "creative.world_music": [
    { target: "social.cultural_studies", label: "Music as cultural identity expression" },
    { target: "math.ratios", label: "Microtonal tuning and non-Western scales" }
  ],
  "creative.xr_experience": [
    { target: "tech.ar_vr_dev", label: "XR/VR development tools and platforms" },
    { target: "math.transformations", label: "3D spatial transformation math for XR" },
    { target: "science.light_optics", label: "Virtual light simulation in XR environments" }
  ],
  "fitness.adaptive_athletics": [
    { target: "science.anatomy_physiology", label: "Adaptive physiology and disability-specific needs" }
  ],
  "fitness.adaptive_pe_intro": [
    { target: "science.anatomy_physiology", label: "Modified movement for physical limitations" }
  ],
  "fitness.adv_sport_strategy": [
    { target: "social.game_theory", label: "Advanced game-theoretic strategic frameworks" }
  ],
  "fitness.aquatic_rescue": [
    { target: "science.fluid_mechanics", label: "Water resistance and swimmer support physics" }
  ],
  "fitness.baseball_softball": [
    { target: "science.forces_motion", label: "Projectile physics of pitched and batted balls" }
  ],
  "fitness.basketball_basics": [
    { target: "math.angles_and_lines", label: "Shot arc and angle geometry" },
    { target: "science.forces_motion", label: "Projectile physics of basketball shots" }
  ],
  "fitness.biomechanics": [
    { target: "math.trig_ratios", label: "Joint angle and limb torque calculation" }
  ],
  "fitness.body_composition": [
    { target: "math.percentages", label: "Body fat percentage calculations" }
  ],
  "fitness.cardiorespiratory_training": [
    { target: "science.anatomy_physiology", label: "Heart rate, VO2, and respiratory adaptation" }
  ],
  "fitness.climbing_advanced": [
    { target: "science.forces_motion", label: "Load distribution and friction on climbing holds" },
    { target: "math.angles_and_lines", label: "Body angle optimization on steep terrain" }
  ],
  "fitness.coaching_basics": [
    { target: "life.leadership", label: "Leadership skills" },
    { target: "lang.public_speaking_basic", label: "Communication" }
  ],
  "fitness.coaching_practicum": [
    { target: "social.psychology_intro", label: "Applied coaching psychology in practice" },
    { target: "science.anatomy_physiology", label: "Practical application of exercise physiology" }
  ],
  "fitness.dance_choreography": [
    { target: "math.patterns_and_sequences", label: "Structured movement sequence and timing patterns" },
    { target: "science.forces_motion", label: "Choreographic physics and weight transfer" }
  ],
  "fitness.elite_coaching": [
    { target: "science.anatomy_physiology", label: "Elite physiological programming knowledge" },
    { target: "social.psychology_intro", label: "Elite athlete psychology and coaching methods" }
  ],
  "fitness.elite_competition": [
    { target: "social.psychology_intro", label: "Elite athlete mindset and pressure management" }
  ],
  "fitness.endurance_events": [
    { target: "science.biochemistry", label: "Fat oxidation and glycogen management" }
  ],
  "fitness.exercise_prescription": [
    { target: "math.statistics_basics", label: "Quantitative exercise dosage prescription" }
  ],
  "fitness.first_aid_cpr": [
    { target: "science.anatomy_physiology", label: "Cardiac and airway emergency anatomy" },
    { target: "science.forces_motion", label: "CPR compression force and depth mechanics" }
  ],
  "fitness.fitness_assessment_advanced": [
    { target: "math.statistics_basics", label: "Advanced statistical fitness assessment scoring" },
    { target: "science.anatomy_physiology", label: "Multi-parameter physiological assessment" }
  ],
  "fitness.fitness_technology": [
    { target: "tech.sensors_actuators", label: "Wearable sensor data collection technology" },
    { target: "math.statistics_basics", label: "Interpreting wearable fitness metrics" }
  ],
  "fitness.flag_football": [
    { target: "science.forces_motion", label: "Passing trajectory and run mechanics" }
  ],
  "fitness.folk_dance": [
    { target: "social.cultural_studies", label: "Cultural tradition in folk dance forms" }
  ],
  "fitness.functional_fitness": [
    { target: "science.anatomy_physiology", label: "Movement pattern and joint function assessment" }
  ],
  "fitness.game_strategy": [
    { target: "math.probability_basics", label: "Probabilistic play-call decision making" }
  ],
  "fitness.golf_basics": [
    { target: "science.forces_motion", label: "Club impact and ball trajectory physics" },
    { target: "math.angles_and_lines", label: "Swing angle and shot geometry" }
  ],
  "fitness.group_exercise_instruction": [
    { target: "social.psychology_intro", label: "Group motivation and class dynamics" }
  ],
  "fitness.health_behavior_theory": [
    { target: "social.psychology_intro", label: "Behavioral change models in health psychology" }
  ],
  "fitness.injury_rehabilitation": [
    { target: "science.pharmacology_basics", label: "Anti-inflammatory medications in rehab protocols" }
  ],
  "fitness.jump_rope": [
    { target: "science.forces_motion", label: "Rope rotation and jump timing mechanics" }
  ],
  "fitness.manipulative_skills": [
    { target: "science.forces_motion", label: "Force application to external objects" },
    { target: "science.nervous_system", label: "Fine motor control neural pathways" }
  ],
  "fitness.mindfulness_sport": [
    { target: "science.nervous_system", label: "Attention regulation and neural focus" },
    { target: "social.psychology_intro", label: "Mindful awareness in competitive performance" }
  ],
  "fitness.motor_learning": [
    { target: "science.nervous_system", label: "Neural plasticity and motor skill acquisition" },
    { target: "social.psychology_intro", label: "Learning theory applied to motor skill acquisition" }
  ],
  "fitness.nonlocomotor_skills": [
    { target: "science.anatomy_physiology", label: "Stabilizer muscle function in static movement" }
  ],
  "fitness.nutrition_fitness": [
    { target: "life.nutrition", label: "Nutrition knowledge" }
  ],
  "fitness.nutrition_timing": [
    { target: "science.biochemistry", label: "Nutrient timing and metabolic window science" }
  ],
  "fitness.olympic_lifting": [
    { target: "science.forces_motion", label: "Force-velocity curve in explosive lifting" },
    { target: "science.anatomy_physiology", label: "Fast-twitch fiber recruitment mechanics" }
  ],
  "fitness.outdoor_education": [
    { target: "science.ecology", label: "Ecosystem awareness in outdoor settings" }
  ],
  "fitness.performance_analytics": [
    { target: "math.statistics_basics", label: "Performance data statistical analysis" },
    { target: "tech.data_viz", label: "Athlete performance data visualization" },
    { target: "math.regression", label: "Predictive regression modeling in performance" }
  ],
  "fitness.personal_training": [
    { target: "science.anatomy_physiology", label: "Client-specific physiological programming" }
  ],
  "fitness.physical_activity_habits": [
    { target: "social.psychology_intro", label: "Habit formation and behavioral change theory" }
  ],
  "fitness.pickleball_lifetime": [
    { target: "science.forces_motion", label: "Paddle-ball impact and court geometry" }
  ],
  "fitness.plyometrics": [
    { target: "science.forces_motion", label: "Elastic energy storage in stretch-shortening" }
  ],
  "fitness.professional_athletics": [
    { target: "science.anatomy_physiology", label: "Professional-level physiological conditioning" }
  ],
  "fitness.research_methods_pe": [
    { target: "math.statistics_basics", label: "Research statistics for PE data analysis" },
    { target: "science.research_design", label: "Experimental design in PE research" }
  ],
  "fitness.self_defense": [
    { target: "science.forces_motion", label: "Force and leverage in defensive techniques" }
  ],
  "fitness.skipping_galloping": [
    { target: "science.forces_motion", label: "Rhythmic locomotor force patterns" }
  ],
  "fitness.sleep_recovery_science": [
    { target: "science.nervous_system", label: "Sleep stages and neural recovery processes" }
  ],
  "fitness.soccer_basics": [
    { target: "science.forces_motion", label: "Ball spin and kick trajectory physics" }
  ],
  "fitness.spatial_awareness": [
    { target: "science.nervous_system", label: "Proprioception and spatial perception" }
  ],
  "fitness.sport_specific_strength": [
    { target: "science.anatomy_physiology", label: "Sport-specific muscle group conditioning" },
    { target: "science.forces_motion", label: "Movement-specific force demands" }
  ],
  "fitness.sports_ethics_law": [
    { target: "social.law_justice", label: "Legal frameworks governing sport" },
    { target: "social.ethical_theory", label: "Ethical principles applied to sport contexts" }
  ],
  "fitness.sports_medicine": [
    { target: "science.pharmacology_basics", label: "Medications and treatments in sports injury" }
  ],
  "fitness.sports_psychology": [
    { target: "life.stress_management", label: "Mental health" }
  ],
  "fitness.sports_science": [
    { target: "math.statistics_basics", label: "Research statistics in sports science" },
    { target: "science.data_analysis_advanced", label: "Research methods" }
  ],
  "fitness.sportsmanship": [
    { target: "religion.christian_ethics", label: "Ethical conduct" }
  ],
  "fitness.strength_cond_cert_prep": [
    { target: "science.anatomy_physiology", label: "Anatomy and physiology exam content" },
    { target: "math.statistics_basics", label: "Statistical analysis in certification exam material" }
  ],
  "fitness.swimming_competitive": [
    { target: "math.statistics_basics", label: "Split time analysis and race strategy" }
  ],
  "fitness.swimming_strokes": [
    { target: "science.anatomy_physiology", label: "Muscle groups in each swimming stroke" }
  ],
  "fitness.track_field_basics": [
    { target: "science.forces_motion", label: "Sprint mechanics and field event physics" }
  ],
  "fitness.triathlon_training": [
    { target: "science.anatomy_physiology", label: "Multi-sport physiological adaptation" },
    { target: "math.statistics_basics", label: "Multi-discipline training volume analysis" }
  ],
  "fitness.tumbling": [
    { target: "science.forces_motion", label: "Rotational inertia and angular momentum" }
  ],
  "fitness.volleyball_basics": [
    { target: "science.forces_motion", label: "Ball trajectory and impact physics" }
  ],
  "fitness.water_sports": [
    { target: "science.fluid_mechanics", label: "Buoyancy and hydrodynamic resistance" }
  ],
  "fitness.weight_room_safety": [
    { target: "science.anatomy_physiology", label: "Injury risk from improper loading mechanics" },
    { target: "science.forces_motion", label: "Safe force application and spotting technique" }
  ],
  "fitness.wellness_programming": [
    { target: "science.anatomy_physiology", label: "Evidence-based wellness physiology design" },
    { target: "social.health_policy", label: "Wellness program policy and population health" }
  ],
  "fitness.wrestling_basics": [
    { target: "science.forces_motion", label: "Leverage, torque, and balance in grappling" }
  ],
  "lang.academic_publishing": [
    { target: "science.peer_review", label: "Scholarly peer review process" },
    { target: "tech.internet_research", label: "Journal database submission" }
  ],
  "lang.adaptation_study": [
    { target: "creative.film_video_basics", label: "Source-to-screen adaptation" },
    { target: "creative.screenwriting", label: "Cross-medium narrative translation" }
  ],
  "lang.adv_communication": [
    { target: "life.exec_leadership", label: "Executive presence and delivery" }
  ],
  "lang.ap_lang_reading": [
    { target: "science.scientific_argumentation", label: "Rhetorical evidence analysis" }
  ],
  "lang.ap_lit_analysis": [
    { target: "creative.art_criticism", label: "Advanced literary aesthetic critique" }
  ],
  "lang.applied_linguistics": [
    { target: "tech.nlp", label: "Computational applied linguistics" },
    { target: "science.observation_skills", label: "Field language research methods" }
  ],
  "lang.author_study": [
    { target: "creative.art_criticism", label: "Author voice and context" }
  ],
  "lang.book_editing": [
    { target: "creative.print_design", label: "Book design and layout" },
    { target: "life.work_habits", label: "Manuscript development process" }
  ],
  "lang.cause_effect_lang": [
    { target: "math.mathematical_logic", label: "Logical conditional reasoning" }
  ],
  "lang.character_analysis": [
    { target: "life.emotional_intelligence", label: "Empathic perspective-taking" }
  ],
  "lang.citation_skills": [
    { target: "science.peer_review", label: "Academic attribution standards" },
    { target: "tech.word_processing", label: "Citation formatting tools" }
  ],
  "lang.close_reading": [
    { target: "science.observation_skills", label: "Detailed textual observation" }
  ],
  "lang.college_essay": [
    { target: "life.college_planning", label: "Application narrative strategy" }
  ],
  "lang.compare_contrast": [
    { target: "math.mathematical_logic", label: "Attribute comparison logic" },
    { target: "science.scientific_method", label: "Systematic comparison design" }
  ],
  "lang.content_creation": [
    { target: "tech.digital_media_creation", label: "Content platform production" },
    { target: "creative.content_creation", label: "Creative publishing workflow" }
  ],
  "lang.context_clues": [
    { target: "math.mathematical_logic", label: "Inferential word-meaning logic" }
  ],
  "lang.corpus_linguistics": [
    { target: "tech.data_cleaning", label: "Text corpus preprocessing" }
  ],
  "lang.creative_nonfiction": [
    { target: "life.media_awareness", label: "Narrative journalism ethics" }
  ],
  "lang.creative_writing_adv": [
    { target: "creative.poetry", label: "Advanced poetic form" }
  ],
  "lang.critical_thinking_lang": [
    { target: "science.scientific_argumentation", label: "Evaluating evidence quality" }
  ],
  "lang.decoding": [
    { target: "math.patterns_and_sequences", label: "Letter pattern decoding" },
    { target: "science.waves_sound", label: "Phoneme-grapheme mapping" }
  ],
  "lang.descriptive_writing": [
    { target: "creative.painting", label: "Sensory detail and imagery" }
  ],
  "lang.digital_humanities": [
    { target: "tech.data_viz", label: "Humanities data visualization" },
    { target: "tech.nlp", label: "Text mining for humanities" },
    { target: "math.probability_and_statistics", label: "Quantitative textual analysis" }
  ],
  "lang.digital_storytelling": [
    { target: "tech.digital_media_creation", label: "Multimedia narrative tools" },
    { target: "creative.film_video_basics", label: "Video storytelling format" }
  ],
  "lang.drama_analysis": [
    { target: "creative.directing", label: "Director's interpretive choices" }
  ],
  "lang.editing_revision": [
    { target: "tech.code_review", label: "Structured revision process" }
  ],
  "lang.esl_foreign_lang": [
    { target: "life.cultural_awareness", label: "Cross-cultural language context" }
  ],
  "lang.genre_theory": [
    { target: "creative.storytelling_creative", label: "Genre convention frameworks" },
    { target: "math.set_theory", label: "Genre classification systems" }
  ],
  "lang.grammar_mechanics": [
    { target: "tech.prog_fundamentals", label: "Formal syntax rule application" }
  ],
  "lang.grant_writing": [
    { target: "life.grant_fundraising", label: "Funding proposal structure" },
    { target: "life.financial_planning", label: "Budget narrative writing" }
  ],
  "lang.handwriting": [
    { target: "creative.calligraphy_lettering", label: "Letterform fine motor control" },
    { target: "fitness.motor_skills", label: "Fine motor coordination" }
  ],
  "lang.ib_lang_lit": [
    { target: "creative.art_criticism", label: "IB aesthetic analysis" }
  ],
  "lang.informational_text": [
    { target: "life.reading_labels", label: "Practical informational reading" }
  ],
  "lang.informational_writing": [
    { target: "science.scientific_communication", label: "Technical explanation writing" }
  ],
  "lang.interview_skills": [
    { target: "life.prof_communication_life", label: "Formal conversational skills" }
  ],
  "lang.journalism": [
    { target: "tech.internet_research", label: "Digital investigative sourcing" },
    { target: "creative.photo_composition", label: "Photojournalism framing" },
    { target: "social.media_literacy", label: "Media analysis" }
  ],
  "lang.literary_analysis": [
    { target: "religion.psalms_wisdom", label: "Biblical literature" }
  ],
  "lang.literary_theory": [
    { target: "creative.art_criticism", label: "Theoretical aesthetic frameworks" }
  ],
  "lang.magazine_journalism": [
    { target: "creative.print_design", label: "Magazine layout and design" },
    { target: "tech.digital_media_creation", label: "Digital long-form publishing" }
  ],
  "lang.media_criticism": [
    { target: "tech.social_media_lit", label: "Platform media critique" },
    { target: "life.media_awareness", label: "Critical media consumption" },
    { target: "creative.film_post_prod", label: "Film production analysis" }
  ],
  "lang.multimedia_presentation": [
    { target: "tech.presentation_software", label: "Slide design and delivery" },
    { target: "creative.graphic_design_basic", label: "Visual communication design" }
  ],
  "lang.mythological_allusion": [
    { target: "creative.storytelling_creative", label: "Mythic narrative intertextuality" }
  ],
  "lang.narrative_theory": [
    { target: "creative.storytelling_creative", label: "Narrative structure frameworks" }
  ],
  "lang.narrator_voice": [
    { target: "creative.acting_theater", label: "Narrative persona performance" }
  ],
  "lang.nonfiction_analysis": [
    { target: "science.scientific_communication", label: "Factual text evaluation" }
  ],
  "lang.oral_lang_dev": [
    { target: "science.waves_sound", label: "Phonological development" },
    { target: "life.empathy_basics", label: "Conversational turn-taking" }
  ],
  "lang.paragraph_writing": [
    { target: "social.us_hist_colonial", label: "History essays" }
  ],
  "lang.poetry_analysis": [
    { target: "creative.music_theory_basic", label: "Meter and rhythm patterns" }
  ],
  "lang.poetry_intro": [
    { target: "creative.poetry", label: "Poetic form introduction" },
    { target: "creative.music_theory_basic", label: "Meter and rhythm basics" }
  ],
  "lang.point_of_view": [
    { target: "life.emotional_intelligence", label: "Perspective-taking empathy" }
  ],
  "lang.print_awareness": [
    { target: "life.library_skills", label: "Book and print conventions" }
  ],
  "lang.prof_communication": [
    { target: "life.workplace_etiquette", label: "Workplace communication norms" }
  ],
  "lang.psycholinguistics": [
    { target: "science.neuroscience_advanced", label: "Neural language processing" },
    { target: "science.observation_skills", label: "Experimental language research" },
    { target: "math.probability_and_statistics", label: "Reaction time statistical analysis" }
  ],
  "lang.public_speaking_basic": [
    { target: "religion.homiletics", label: "Preaching" }
  ],
  "lang.research_note_taking": [
    { target: "tech.word_processing", label: "Digital note organization" },
    { target: "life.study_skills", label: "Information management" }
  ],
  "lang.research_papers": [
    { target: "science.research_design", label: "Research methodology framing" }
  ],
  "lang.research_skills": [
    { target: "social.research_methodology", label: "Social science research" }
  ],
  "lang.research_writing": [
    { target: "life.library_skills", label: "Archival research navigation" }
  ],
  "lang.rhetoric": [
    { target: "religion.apologetics", label: "Apologetic arguments" },
    { target: "social.political_philosophy", label: "Political rhetoric" }
  ],
  "lang.rhetoric_of_science": [
    { target: "science.peer_review", label: "Scholarly discourse analysis" }
  ],
  "lang.rhetorical_analysis": [
    { target: "math.mathematical_logic", label: "Argument structure analysis" },
    { target: "life.leadership", label: "Persuasive strategy evaluation" }
  ],
  "lang.rhetorical_theory": [
    { target: "math.mathematical_logic", label: "Formal argumentation theory" },
    { target: "life.leadership", label: "Influence and persuasion theory" }
  ],
  "lang.rhyming": [
    { target: "creative.poetry", label: "Phonological sound patterns" },
    { target: "creative.music_theory_basic", label: "Rhyme scheme recognition" }
  ],
  "lang.satire_irony": [
    { target: "creative.acting_theater", label: "Comic and ironic performance" },
    { target: "life.media_awareness", label: "Satirical media literacy" }
  ],
  "lang.screenwriting_lang": [
    { target: "creative.screenwriting", label: "Script format and structure" },
    { target: "creative.film_video_basics", label: "Screen narrative conventions" }
  ],
  "lang.script_writing": [
    { target: "creative.screenwriting", label: "Script format conventions" },
    { target: "creative.acting_theater", label: "Dialogue and stage direction" }
  ],
  "lang.semiotics": [
    { target: "creative.icon_symbol_design", label: "Symbol meaning construction" },
    { target: "math.set_theory", label: "Sign-system formal structure" }
  ],
  "lang.setting_analysis": [
    { target: "creative.environment_art", label: "Visual world-building" }
  ],
  "lang.short_story_writing": [
    { target: "creative.storytelling_creative", label: "Short narrative form craft" }
  ],
  "lang.sociolinguistics": [
    { target: "math.probability_and_statistics", label: "Sociolinguistic variation stats" }
  ],
  "lang.source_evaluation": [
    { target: "science.peer_review", label: "Scholarly credibility criteria" },
    { target: "life.media_awareness", label: "Source bias identification" }
  ],
  "lang.speech_writing": [
    { target: "creative.acting_theater", label: "Performance delivery planning" }
  ],
  "lang.spoken_word_poetry": [
    { target: "creative.poetry", label: "Performance poetry craft" },
    { target: "creative.acting_theater", label: "Spoken word delivery" }
  ],
  "lang.story_retelling": [
    { target: "life.empathy_basics", label: "Perspective comprehension" }
  ],
  "lang.stylistics": [
    { target: "creative.typography", label: "Typographic style and voice" },
    { target: "math.mathematical_logic", label: "Formal linguistic pattern analysis" }
  ],
  "lang.summarizing": [
    { target: "life.study_skills", label: "Main idea distillation" }
  ],
  "lang.symbolism": [
    { target: "creative.icon_symbol_design", label: "Visual symbol meaning" },
    { target: "math.set_theory", label: "Symbol-referent mapping" }
  ],
  "lang.synthesis_writing": [
    { target: "science.research_design", label: "Multi-source synthesis method" },
    { target: "math.mathematical_logic", label: "Integrating multiple claims" }
  ],
  "lang.technical_writing": [
    { target: "tech.tech_documentation", label: "Software documentation format" },
    { target: "tech.software_eng", label: "Documentation" }
  ],
  "lang.text_structure": [
    { target: "tech.word_processing", label: "Document structure formatting" }
  ],
  "lang.thesis_development": [
    { target: "math.mathematical_logic", label: "Central claim formulation" },
    { target: "science.scientific_argumentation", label: "Hypothesis-argument alignment" }
  ],
  "lang.timed_writing": [
    { target: "life.time_management", label: "Writing under time pressure" }
  ],
  "lang.tone_mood": [
    { target: "creative.music_theory_basic", label: "Emotional atmosphere in art" }
  ],
  "lang.translation_theory": [
    { target: "science.observation_skills", label: "Cross-linguistic pattern analysis" },
    { target: "tech.nlp", label: "Computational translation models" }
  ],
  "lang.word_choice_style": [
    { target: "creative.storytelling_creative", label: "Voice and diction craft" }
  ],
  "lang.word_families": [
    { target: "math.patterns_and_sequences", label: "Morphological pattern groups" }
  ],
  "lang.word_roots": [
    { target: "science.scientific_communication", label: "Greek/Latin scientific terminology" }
  ],
  "lang.world_literature": [
    { target: "creative.world_music", label: "Cross-cultural artistic expression" }
  ],
  "lang.writing_center_tutor": [
    { target: "life.mentoring", label: "Peer writing coaching" }
  ],
  "lang.writing_process_basic": [
    { target: "life.work_habits", label: "Drafting and revision discipline" }
  ],
  "life.adv_cooking": [
    { target: "math.ratio_and_proportion", label: "Recipe scaling ratios" }
  ],
  "life.adv_negotiation": [
    { target: "social.game_theory", label: "Game-theoretic negotiation strategy" },
    { target: "lang.adv_rhetoric", label: "Persuasion and framing techniques" }
  ],
  "life.advanced_cooking_nutrition": [
    { target: "science.biochemistry", label: "Macronutrient and micronutrient chemistry" }
  ],
  "life.advanced_financial_modeling": [
    { target: "math.statistics_basics", label: "Statistical modeling of financial data" },
    { target: "tech.spreadsheets", label: "Spreadsheet-based financial models" }
  ],
  "life.advanced_negotiation": [
    { target: "social.game_theory", label: "Game-theoretic negotiation frameworks" },
    { target: "lang.adv_rhetoric", label: "Persuasion and argumentation tactics" }
  ],
  "life.advanced_parenting": [
    { target: "science.human_body", label: "Child neurological and physical development" },
    { target: "social.psychology_intro", label: "Developmental psychology stages" }
  ],
  "life.basic_car_care": [
    { target: "science.simple_machines", label: "Engine mechanics and force transmission" }
  ],
  "life.basic_cooking": [
    { target: "math.measurement", label: "Measuring ingredients by volume/weight" }
  ],
  "life.boundaries_consent": [
    { target: "social.psychology_intro", label: "Consent in interpersonal psychology" }
  ],
  "life.business_strategy": [
    { target: "social.game_theory", label: "Strategic decision under competition" }
  ],
  "life.civic_literacy": [
    { target: "social.civics_gov", label: "Government structure and civic process" }
  ],
  "life.cleaning_basics": [
    { target: "science.chemistry_intro", label: "Cleaning agents and chemical reactions" }
  ],
  "life.college_planning": [
    { target: "math.statistics_basics", label: "Interpreting admission statistics" }
  ],
  "life.conflict_mediation": [
    { target: "social.psychology_intro", label: "De-escalation and mediation psychology" }
  ],
  "life.consumer_rights": [
    { target: "social.law_justice", label: "Legal protections for consumers" }
  ],
  "life.contract_understanding": [
    { target: "lang.close_reading", label: "Parsing precise legal language" }
  ],
  "life.credit_score": [
    { target: "math.percentages", label: "Credit utilization ratio calculation" },
    { target: "social.personal_finance", label: "Credit scoring system mechanics" }
  ],
  "life.critical_thinking": [
    { target: "lang.rhetorical_analysis", label: "Evaluating argument structure and logic" }
  ],
  "life.cross_cultural_competency": [
    { target: "social.anthropology", label: "Ethnographic understanding of culture" }
  ],
  "life.debt_management": [
    { target: "math.compound_interest", label: "Debt amortization and interest costs" },
    { target: "social.personal_finance", label: "Debt repayment strategy" }
  ],
  "life.digital_basics": [
    { target: "tech.device_basics", label: "Basic device and software operation" }
  ],
  "life.digital_identity": [
    { target: "tech.data_privacy", label: "Online footprint and data exposure" }
  ],
  "life.drivers_ed": [
    { target: "science.forces_motion", label: "Braking distance and momentum" },
    { target: "science.speed_distance", label: "Speed-distance-time physics" }
  ],
  "life.emergency_prep": [
    { target: "science.earth_science", label: "Natural disaster causes and effects" }
  ],
  "life.entrepreneurship": [
    { target: "tech.software_eng", label: "Tech startups" }
  ],
  "life.ethics_integrity": [
    { target: "social.ethical_theory", label: "Applied moral philosophy frameworks" }
  ],
  "life.exec_leadership": [
    { target: "social.leadership_influence", label: "Organizational power and influence" }
  ],
  "life.executive_communication": [
    { target: "lang.adv_rhetoric", label: "Executive-level persuasive communication" }
  ],
  "life.financial_aid": [
    { target: "math.percentages", label: "Award percentage and loan interest" },
    { target: "social.personal_finance", label: "Grant and loan financial planning" }
  ],
  "life.financial_records": [
    { target: "math.decimal_operations", label: "Accurate ledger arithmetic" },
    { target: "tech.spreadsheets", label: "Digital record-keeping in spreadsheets" }
  ],
  "life.fire_safety": [
    { target: "science.energy_types", label: "Combustion and heat energy" }
  ],
  "life.governance_nonprofit": [
    { target: "social.public_policy", label: "Nonprofit regulatory frameworks" }
  ],
  "life.grant_fundraising": [
    { target: "lang.grant_writing", label: "Grant proposal writing mechanics" }
  ],
  "life.grocery_shopping": [
    { target: "math.decimal_operations", label: "Comparing prices with decimals" },
    { target: "science.anatomy_physiology", label: "Nutritional value of food groups" }
  ],
  "life.healthcare_literacy": [
    { target: "science.health_science", label: "Understanding medical diagnoses and terms" }
  ],
  "life.home_buying": [
    { target: "math.compound_interest", label: "Mortgage amortization math" },
    { target: "social.personal_finance", label: "Real estate financial literacy" }
  ],
  "life.home_electrical_basics": [
    { target: "science.electricity_basics", label: "Basic circuit safety and wiring" }
  ],
  "life.home_plumbing_basics": [
    { target: "science.fluid_mechanics", label: "Water pressure and pipe flow" }
  ],
  "life.insurance": [
    { target: "math.probability_basics", label: "Risk probability in premium pricing" },
    { target: "social.personal_finance", label: "Risk management in personal finance" }
  ],
  "life.intergenerational_impact": [
    { target: "social.adv_economics", label: "Wealth transfer and economic mobility" },
    { target: "social.law_justice", label: "Estate and inheritance law" }
  ],
  "life.internet_safety": [
    { target: "tech.cybersecurity_awareness", label: "Online threat recognition" }
  ],
  "life.leadership": [
    { target: "religion.pastoral_care", label: "Servant leadership" }
  ],
  "life.library_skills": [
    { target: "lang.research_skills", label: "Information location and evaluation" }
  ],
  "life.life_coaching_basics": [
    { target: "social.psychology_intro", label: "Motivational interviewing techniques" }
  ],
  "life.local_government": [
    { target: "social.state_local_gov", label: "Municipal governance and civic action" }
  ],
  "life.long_term_planning": [
    { target: "math.compound_interest", label: "Time-value of money projections" }
  ],
  "life.media_awareness": [
    { target: "social.media_literacy", label: "Source evaluation and misinformation" }
  ],
  "life.media_production": [
    { target: "tech.digital_media_creation", label: "Digital media creation tools" }
  ],
  "life.mental_health_literacy": [
    { target: "science.nervous_system", label: "Neurological basis of mental disorders" }
  ],
  "life.mindfulness": [
    { target: "science.nervous_system", label: "Parasympathetic nervous system response" }
  ],
  "life.nutrition": [
    { target: "fitness.nutrition_fitness", label: "Sports nutrition" }
  ],
  "life.org_strategy": [
    { target: "social.adv_economics", label: "Strategic economics and competitive advantage" }
  ],
  "life.personal_branding": [
    { target: "lang.prof_communication", label: "Crafting professional self-narrative" }
  ],
  "life.pet_care": [
    { target: "science.animal_biology", label: "Animal physiology and health needs" }
  ],
  "life.philanthropy": [
    { target: "social.civic_engagement", label: "Community impact and social good" }
  ],
  "life.policy_engagement": [
    { target: "lang.argumentative_writing", label: "Evidence-based policy arguments" }
  ],
  "life.power_of_attorney": [
    { target: "social.law_justice", label: "Legal authority and proxy instruments" }
  ],
  "life.problem_solving": [
    { target: "math.word_problems", label: "Structured quantitative reasoning" }
  ],
  "life.project_management": [
    { target: "math.statistics_basics", label: "Risk estimation and scheduling math" },
    { target: "tech.agile_practices", label: "Agile iterative project methodology" }
  ],
  "life.public_safety": [
    { target: "social.community_workers", label: "Role of emergency service workers" }
  ],
  "life.public_transportation": [
    { target: "social.local_geography", label: "Urban transit route navigation" }
  ],
  "life.reading_labels": [
    { target: "math.percentages", label: "Percent daily value interpretation" }
  ],
  "life.reading_maps": [
    { target: "math.coordinate_plane", label: "Grid coordinates and spatial math" },
    { target: "social.physical_geography", label: "Topographic and geographic reading" }
  ],
  "life.rental_management": [
    { target: "social.law_justice", label: "Landlord-tenant law and contracts" },
    { target: "math.decimal_operations", label: "Rent and expense accounting" }
  ],
  "life.retirement_planning": [
    { target: "math.compound_interest", label: "Retirement fund compound growth" },
    { target: "social.personal_finance", label: "Retirement income strategy" }
  ],
  "life.saving_money": [
    { target: "math.compound_interest", label: "Interest accrual on savings" }
  ],
  "life.small_business_basics": [
    { target: "math.statistics_basics", label: "Revenue and expense analysis" }
  ],
  "life.social_media_literacy": [
    { target: "lang.media_literacy_lang", label: "Critical analysis of online content" },
    { target: "tech.social_media_lit", label: "Algorithmic content and filter bubbles" }
  ],
  "life.sustainability_living": [
    { target: "science.environmental_science", label: "Resource consumption and ecological impact" }
  ],
  "life.systems_leadership": [
    { target: "science.systems_thinking", label: "Applying systems models to organizations" }
  ],
  "life.tax_planning": [
    { target: "math.percentages", label: "Marginal tax rate calculations" },
    { target: "social.personal_finance", label: "Tax-advantaged account strategies" }
  ],
  "life.time_management": [
    { target: "math.time_math", label: "Scheduling and elapsed time" }
  ],
  "life.travel_skills": [
    { target: "social.world_geography", label: "Geographic navigation and orientation" }
  ],
  "life.volunteering": [
    { target: "social.civic_engagement", label: "Social capital through community service" }
  ],
  "life.voting_civic": [
    { target: "social.us_constitution", label: "Constitutional voting rights" }
  ],
  "life.wealth_management": [
    { target: "math.statistics_basics", label: "Portfolio variance and optimization" }
  ],
  "life.wealth_psychology": [
    { target: "social.behavioral_econ", label: "Behavioral biases in financial decisions" },
    { target: "social.psychology_intro", label: "Money mindset and cognitive patterns" }
  ],
  "life.workplace_wellness": [
    { target: "science.anatomy_physiology", label: "Ergonomics and occupational health" },
    { target: "social.psychology_intro", label: "Workplace stress and burnout psychology" }
  ],
  "math.advanced_computational_methods": [
    { target: "social.quantitative_social", label: "Computational social science methods" }
  ],
  "math.advanced_statistics": [
    { target: "social.quantitative_social", label: "Advanced quantitative social analysis" },
    { target: "fitness.sports_science", label: "Advanced sports performance statistics" }
  ],
  "math.applications": [
    { target: "life.financial_planning", label: "Mathematics in financial planning" },
    { target: "social.macroeconomics", label: "Applied mathematics in economics" }
  ],
  "math.applied_mathematics": [
    { target: "fitness.sports_science", label: "Applied math in sports analytics" }
  ],
  "math.arc_length": [
    { target: "creative.animation", label: "Arc path length in animation" }
  ],
  "math.area_and_perimeter": [
    { target: "life.home_maintenance", label: "Room dimensions for renovation" },
    { target: "creative.architecture", label: "Floor plan area calculations" }
  ],
  "math.basic_algebraic_expressions": [
    { target: "life.budgeting", label: "Algebraic budget formulas" }
  ],
  "math.basic_geometry": [
    { target: "science.scientific_models", label: "Spatial models" }
  ],
  "math.combinatorics": [
    { target: "creative.music_composition", label: "Combinatorial melodic arrangement" }
  ],
  "math.comparing_distributions": [
    { target: "social.quantitative_social", label: "Comparing social data distributions" }
  ],
  "math.confidence_intervals": [
    { target: "social.research_methodology", label: "Confidence bounds in survey research" }
  ],
  "math.conic_sections": [
    { target: "creative.architecture", label: "Parabolic and elliptical architectural forms" }
  ],
  "math.coordinate_plane": [
    { target: "science.data_recording", label: "Data plotting" }
  ],
  "math.diff_equations": [
    { target: "science.fluid_mechanics", label: "Flow equations" }
  ],
  "math.dilations": [
    { target: "creative.animation", label: "Scale transforms in animation" }
  ],
  "math.discrete_math": [
    { target: "tech.data_structures", label: "Algorithm foundations" }
  ],
  "math.eigenvalues": [
    { target: "creative.animation", label: "Eigenvalue decomposition in 3D transforms" }
  ],
  "math.estimation": [
    { target: "life.grocery_shopping", label: "Estimating total grocery cost" }
  ],
  "math.fraction_operations": [
    { target: "life.basic_cooking", label: "Fractional ingredient arithmetic" }
  ],
  "math.functions": [
    { target: "creative.music_theory_intermediate", label: "Mathematical wave functions in sound" }
  ],
  "math.geometry_basics": [
    { target: "creative.architecture", label: "Geometric form in architecture" }
  ],
  "math.inequalities": [
    { target: "life.budgeting", label: "Budget constraint inequalities" }
  ],
  "math.investments_growth": [
    { target: "life.investing", label: "Investment portfolio growth math" },
    { target: "social.personal_finance", label: "Personal investment growth planning" }
  ],
  "math.law_of_cosines": [
    { target: "social.basic_maps", label: "Distance calculation in navigation" }
  ],
  "math.law_of_sines": [
    { target: "social.basic_maps", label: "Triangulation in geographic surveying" }
  ],
  "math.line_symmetry": [
    { target: "creative.graphic_design_basic", label: "Symmetry in visual design" }
  ],
  "math.linear_algebra": [
    { target: "tech.advanced_ml", label: "ML foundations" }
  ],
  "math.linear_equations": [
    { target: "science.data_analysis_basic", label: "Linear relationships" }
  ],
  "math.mass_and_capacity": [
    { target: "life.basic_cooking", label: "Measuring cooking quantities" }
  ],
  "math.mathematical_logic": [
    { target: "lang.argumentative_writing", label: "Formal logic structure in arguments" },
    { target: "social.philosophy_intro", label: "Logical reasoning in philosophy" }
  ],
  "math.mathematical_research_techniques": [
    { target: "social.research_methodology", label: "Mathematical research methodology" }
  ],
  "math.matrices": [
    { target: "tech.computer_graphics", label: "Transformations in CG" }
  ],
  "math.mixed_numbers": [
    { target: "life.basic_cooking", label: "Mixed-number recipe quantities" }
  ],
  "math.multi_digit_addition": [
    { target: "life.budgeting", label: "Adding multi-item expenses" }
  ],
  "math.multi_digit_subtraction": [
    { target: "life.budgeting", label: "Calculating remaining balance" }
  ],
  "math.multi_step_equations": [
    { target: "life.financial_planning", label: "Multi-step financial calculations" }
  ],
  "math.multivariable_calc": [
    { target: "social.macroeconomics", label: "Multivariable optimization in economics" }
  ],
  "math.negatives": [
    { target: "life.banking", label: "Overdraft as negative balance" }
  ],
  "math.normal_distribution": [
    { target: "fitness.fitness_testing", label: "Normal distribution of fitness scores" }
  ],
  "math.parametric_equations": [
    { target: "creative.animation", label: "Parametric curves for animation paths" }
  ],
  "math.patterns_and_sequences": [
    { target: "creative.basic_drawing", label: "Visual pattern repetition" }
  ],
  "math.perpendicular_bisectors": [
    { target: "creative.architecture", label: "Perpendicular layout in floor plans" }
  ],
  "math.polar_coords": [
    { target: "creative.animation", label: "Polar coordinate spiral paths" }
  ],
  "math.polygon_properties": [
    { target: "creative.architecture", label: "Polygonal floor plans" }
  ],
  "math.probability_and_statistics": [
    { target: "social.research_methodology", label: "Statistical methods for research" },
    { target: "life.investing", label: "Investment risk statistics" }
  ],
  "math.quadratic_equations": [
    { target: "social.microeconomics", label: "Profit maximization quadratic models" }
  ],
  "math.quadratics": [
    { target: "creative.animation", label: "Parabolic motion curves" }
  ],
  "math.ratio_and_proportion": [
    { target: "life.basic_cooking", label: "Proportional recipe scaling" },
    { target: "creative.color_theory", label: "Proportional color mixing" },
    { target: "social.demographic_analysis", label: "Population ratio comparisons" }
  ],
  "math.ratios": [
    { target: "science.scientific_method", label: "Experimental ratios" }
  ],
  "math.scientific_notation": [
    { target: "life.banking", label: "Expressing very large monetary values" }
  ],
  "math.sequences_series": [
    { target: "creative.music_theory_basic", label: "Musical sequence patterns" }
  ],
  "math.set_theory": [
    { target: "lang.grammar", label: "Set-based grammatical categories" }
  ],
  "math.similarity": [
    { target: "creative.perspective_drawing", label: "Proportional scaling in perspective" }
  ],
  "math.solving_simple_equations": [
    { target: "life.money_counting", label: "Solving for unknown cost" }
  ],
  "math.statistics_basics": [
    { target: "science.data_analysis_basic", label: "Scientific data analysis" }
  ],
  "math.surface_area": [
    { target: "life.home_maintenance", label: "Calculating paint coverage area" }
  ],
  "math.time_math": [
    { target: "life.telling_time", label: "Elapsed time computation" },
    { target: "fitness.basic_movement", label: "Calculating workout durations" }
  ],
  "math.triangles_pythagorean": [
    { target: "creative.architecture", label: "Right-angle structural calculations" },
    { target: "fitness.biomechanics", label: "Force vector triangle resolution" }
  ],
  "math.trig_functions": [
    { target: "creative.music_theory_intermediate", label: "Trig wave functions in sound" }
  ],
  "math.trig_ratios": [
    { target: "science.forces_motion", label: "Force components" },
    { target: "tech.computer_graphics", label: "Graphics calculations" }
  ],
  "math.two_way_tables": [
    { target: "social.research_methodology", label: "Cross-tabulation in social research" }
  ],
  "math.unit_conversion": [
    { target: "fitness.basic_movement", label: "Converting km/miles distances" }
  ],
  "math.vector_calculus": [
    { target: "fitness.biomechanics", label: "Vector field analysis of forces" }
  ],
  "math.volume": [
    { target: "life.basic_cooking", label: "Measuring liquid volumes in cooking" },
    { target: "creative.architecture", label: "Building volume calculations" }
  ],
  "math.volume_cylinders_cones_spheres": [
    { target: "life.basic_cooking", label: "Volume for cooking container measurements" },
    { target: "creative.architecture", label: "Volumetric calculations in design" }
  ],
  "math.word_problems": [
    { target: "lang.reading_comp", label: "Reading comprehension for problem context" }
  ],
  "religion.academic_biblical_criticism": [
    { target: "math.mathematical_logic", label: "Source-critical argument logic" }
  ],
  "religion.acts_early_church": [
    { target: "science.earth_science", label: "Mediterranean geographic context" }
  ],
  "religion.angelology_demonology": [
    { target: "math.mathematical_logic", label: "Systematic angelology logic" }
  ],
  "religion.apologetics": [
    { target: "lang.debate", label: "Debate skills" }
  ],
  "religion.biblical_archaeology": [
    { target: "science.geology", label: "Stratigraphic site excavation" },
    { target: "science.materials_science", label: "Artifact materials analysis" }
  ],
  "religion.biblical_counseling_basic": [
    { target: "life.conflict_mediation", label: "Biblical mediation techniques" }
  ],
  "religion.biblical_criticism_adv": [
    { target: "science.observation_skills", label: "Historical-critical observation" },
    { target: "tech.nlp", label: "Computational biblical criticism" },
    { target: "math.probability_and_statistics", label: "Textual frequency statistics" }
  ],
  "religion.biblical_geography": [
    { target: "social.world_geography", label: "Ancient geography" }
  ],
  "religion.biblical_hermeneutics_adv": [
    { target: "math.mathematical_logic", label: "Advanced hermeneutical logic" },
    { target: "tech.nlp", label: "Computational hermeneutic tools" }
  ],
  "religion.biblical_interpretation": [
    { target: "science.observation_skills", label: "Systematic text analysis" }
  ],
  "religion.biblical_languages_basic": [
    { target: "lang.linguistics_basics", label: "Language study" }
  ],
  "religion.biblical_manhood_womanhood": [
    { target: "life.ethics_integrity", label: "Ethical gender role application" }
  ],
  "religion.camp_outdoor_ministry": [
    { target: "fitness.outdoor_skills", label: "Outdoor ministry activities" },
    { target: "life.community_service", label: "Camp community service" }
  ],
  "religion.charismatic_theology": [
    { target: "creative.singing_choir", label: "Charismatic worship music" },
    { target: "life.emotional_intelligence", label: "Emotional spiritual expression" }
  ],
  "religion.christian_apologetics_adv": [
    { target: "math.mathematical_logic", label: "Advanced modal argument logic" },
    { target: "science.scientific_method", label: "Scientific-apologetics interface" }
  ],
  "religion.christian_calendar": [
    { target: "math.time_math", label: "Liturgical calendar time cycles" },
    { target: "creative.music_history", label: "Seasonal liturgical music" }
  ],
  "religion.christian_ethics": [
    { target: "social.sociology_basics", label: "Social ethics" }
  ],
  "religion.christian_leadership": [
    { target: "life.mentoring", label: "Spiritual leadership mentoring" }
  ],
  "religion.christian_worldview": [
    { target: "math.mathematical_logic", label: "Worldview logical consistency" },
    { target: "science.scientific_method", label: "Faith-science integration" }
  ],
  "religion.christology": [
    { target: "math.mathematical_logic", label: "Two-natures logical argument" }
  ],
  "religion.church_and_state": [
    { target: "life.civic_literacy", label: "Church-state constitutional knowledge" },
    { target: "life.legal_literacy", label: "Religious freedom law" }
  ],
  "religion.church_hist_reformation": [
    { target: "creative.printmaking", label: "Gutenberg press in Reformation" },
    { target: "social.world_hist_medieval", label: "Medieval history" }
  ],
  "religion.church_planting": [
    { target: "life.project_management", label: "Church plant project management" },
    { target: "life.entrepreneurship", label: "Ministry entrepreneurial strategy" }
  ],
  "religion.comparative_theology": [
    { target: "social.world_religions_overview", label: "World religions" }
  ],
  "religion.counseling": [
    { target: "life.conflict_mediation", label: "Pastoral mediation techniques" },
    { target: "life.mental_health_literacy", label: "Mental health referral literacy" }
  ],
  "religion.creation_story": [
    { target: "science.astronomy", label: "Creation and cosmological origins" },
    { target: "creative.storytelling_creative", label: "Genesis narrative form" }
  ],
  "religion.creation_theology": [
    { target: "science.astronomy", label: "Cosmology-creation dialogue" },
    { target: "science.geology", label: "Geological creation timeline" }
  ],
  "religion.creedal_study": [
    { target: "math.mathematical_logic", label: "Creedal doctrinal logic" }
  ],
  "religion.dispensationalism": [
    { target: "math.mathematical_logic", label: "Dispensational division logic" }
  ],
  "religion.dogmatics": [
    { target: "math.mathematical_logic", label: "Reformed dogmatic systematization" }
  ],
  "religion.ethics_moral_theo": [
    { target: "math.mathematical_logic", label: "Ethical deductive reasoning" }
  ],
  "religion.evangelism_methods": [
    { target: "life.cross_cultural_competency", label: "Cross-cultural evangelism" },
    { target: "creative.storytelling_creative", label: "Gospel narrative presentation" }
  ],
  "religion.gender_sexuality_theology": [
    { target: "life.ethics_integrity", label: "Ethical theology of gender" }
  ],
  "religion.general_epistles": [
    { target: "math.mathematical_logic", label: "Epistolary theological argument" }
  ],
  "religion.global_christianity": [
    { target: "life.cross_cultural_competency", label: "Global church cultural navigation" }
  ],
  "religion.golden_rule": [
    { target: "life.empathy_basics", label: "Empathy-based ethical principle" },
    { target: "life.ethics_integrity", label: "Golden rule moral application" }
  ],
  "religion.greek_intro": [
    { target: "math.mathematical_logic", label: "Greek morphological parsing logic" }
  ],
  "religion.hamartiology": [
    { target: "life.ethics_integrity", label: "Doctrine of sin and moral failure" }
  ],
  "religion.hebrew_intro": [
    { target: "math.mathematical_logic", label: "Hebrew grammatical analysis logic" }
  ],
  "religion.historical_books": [
    { target: "creative.storytelling_creative", label: "OT historical narrative" },
    { target: "science.earth_science", label: "Canaan geographic context" }
  ],
  "religion.holy_spirit_basics": [
    { target: "life.mindfulness", label: "Spirit-guided contemplation" }
  ],
  "religion.inter_religious_theo": [
    { target: "life.cross_cultural_competency", label: "Interfaith cultural literacy" },
    { target: "math.mathematical_logic", label: "Comparative theological argument" }
  ],
  "religion.jesus_birth": [
    { target: "creative.storytelling_creative", label: "Nativity narrative form" }
  ],
  "religion.key_verses": [
    { target: "lang.expanded_vocab", label: "Vocabulary building" }
  ],
  "religion.liberation_theology": [
    { target: "life.community_service", label: "Liberation community praxis" }
  ],
  "religion.liturgical_studies": [
    { target: "creative.music_history", label: "Liturgical music history" },
    { target: "creative.architecture", label: "Liturgical sacred space design" }
  ],
  "religion.lords_prayer": [
    { target: "life.mindfulness", label: "Prayer as focused meditation" },
    { target: "life.study_skills", label: "Memorization of sacred text" }
  ],
  "religion.lords_supper": [
    { target: "life.community_service", label: "Communal rite participation" }
  ],
  "religion.major_prophets": [
    { target: "creative.poetry", label: "Prophetic Hebrew poetic form" }
  ],
  "religion.medieval_theology": [
    { target: "creative.architecture", label: "Medieval cathedral theology" },
    { target: "math.mathematical_logic", label: "Scholastic syllogistic logic" }
  ],
  "religion.minor_prophets": [
    { target: "creative.poetry", label: "Minor prophet poetic forms" }
  ],
  "religion.miracles_of_jesus": [
    { target: "creative.storytelling_creative", label: "Gospel miracle narrative" }
  ],
  "religion.missiology": [
    { target: "social.intl_relations", label: "Cross-cultural context" },
    { target: "lang.translation_theory", label: "Bible translation" }
  ],
  "religion.music_worship": [
    { target: "creative.instrument_proficiency", label: "Worship instrumental skill" }
  ],
  "religion.narrative_theology": [
    { target: "creative.storytelling_creative", label: "Narrative theological method" }
  ],
  "religion.new_birth": [
    { target: "life.emotional_intelligence", label: "Transformation and identity" }
  ],
  "religion.nt_biblical_theology": [
    { target: "creative.storytelling_creative", label: "NT canonical narrative arc" }
  ],
  "religion.ot_biblical_theology": [
    { target: "creative.storytelling_creative", label: "OT canonical narrative" }
  ],
  "religion.pastoral_theology": [
    { target: "life.emotional_intelligence", label: "Pastoral empathy and care" },
    { target: "life.leadership", label: "Pastoral leadership practice" }
  ],
  "religion.patristics": [
    { target: "creative.architecture", label: "Patristic era church architecture" },
    { target: "science.materials_science", label: "Ancient manuscript preservation" }
  ],
  "religion.pauline_epistles": [
    { target: "creative.storytelling_creative", label: "Epistolary narrative form" },
    { target: "math.mathematical_logic", label: "Pauline theological argument" }
  ],
  "religion.pentateuch": [
    { target: "science.geology", label: "Ancient Near East archaeological context" },
    { target: "creative.storytelling_creative", label: "Torah narrative forms" }
  ],
  "religion.philosophy_religion": [
    { target: "math.mathematical_logic", label: "Modal and ontological argument" },
    { target: "science.scientific_method", label: "Empirical-religious dialogue" }
  ],
  "religion.pneumatology": [
    { target: "math.mathematical_logic", label: "Systematic doctrine of Spirit" }
  ],
  "religion.prayer_advanced": [
    { target: "life.mindfulness", label: "Contemplative advanced practice" },
    { target: "life.stress_management", label: "Prayer-based stress regulation" }
  ],
  "religion.preaching_practicum": [
    { target: "creative.acting_theater", label: "Sermon delivery performance" },
    { target: "life.leadership", label: "Preaching leadership presence" }
  ],
  "religion.psalms_wisdom": [
    { target: "creative.poetry", label: "Hebrew poetic form analysis" },
    { target: "creative.music_history", label: "Psalms as liturgical music" }
  ],
  "religion.public_theology": [
    { target: "life.civic_literacy", label: "Faith in public civic sphere" },
    { target: "life.policy_engagement", label: "Faith-based policy advocacy" }
  ],
  "religion.revelation_intro": [
    { target: "creative.storytelling_creative", label: "Apocalyptic narrative genre" },
    { target: "math.mathematical_logic", label: "Symbolic number interpretation" }
  ],
  "religion.sanctification": [
    { target: "life.emotional_intelligence", label: "Virtue formation and growth" }
  ],
  "religion.sermon_mount": [
    { target: "life.ethics_integrity", label: "Beatitude ethical teaching" },
    { target: "creative.storytelling_creative", label: "Sermon rhetorical structure" }
  ],
  "religion.service_ministry": [
    { target: "life.volunteering", label: "Faith-motivated service" },
    { target: "life.community_service", label: "Organized service ministry" }
  ],
  "religion.small_group_leadership": [
    { target: "life.leadership", label: "Small group facilitation" }
  ],
  "religion.social_justice_faith": [
    { target: "life.community_service", label: "Justice-oriented service" }
  ],
  "religion.spiritual_formation_adv": [
    { target: "life.mindfulness", label: "Advanced contemplative formation" },
    { target: "life.stress_management", label: "Spiritual resilience practices" }
  ],
  "religion.testimony_sharing": [
    { target: "life.prof_communication_life", label: "Public narrative delivery" }
  ],
  "religion.theo_dissertation": [
    { target: "science.research_design", label: "Theological research design" },
    { target: "tech.internet_research", label: "Academic database research" },
    { target: "math.probability_and_statistics", label: "Quantitative theological research" }
  ],
  "religion.theo_of_arts": [
    { target: "creative.art_criticism", label: "Theological aesthetic critique" },
    { target: "creative.architecture", label: "Sacred arts theology" }
  ],
  "religion.theo_of_mission": [
    { target: "life.cross_cultural_competency", label: "Cross-cultural mission theology" }
  ],
  "religion.theodicy": [
    { target: "math.mathematical_logic", label: "Logical problem of evil argument" },
    { target: "science.scientific_method", label: "Empirical evil evidence" }
  ],
  "religion.theological_reasoning": [
    { target: "math.mathematical_logic", label: "Formal theological inference" }
  ],
  "religion.theological_research": [
    { target: "life.library_skills", label: "Seminary library navigation" }
  ],
  "religion.theology_of_culture": [
    { target: "creative.film_video_basics", label: "Film as cultural theology" }
  ],
  "religion.urban_ministry": [
    { target: "life.community_service", label: "Urban faith-based service" },
    { target: "life.cross_cultural_competency", label: "Urban multicultural ministry" }
  ],
  "religion.wesleyan_arminian": [
    { target: "math.mathematical_logic", label: "Arminian free-will argument" }
  ],
  "religion.youth_ministry": [
    { target: "life.mentoring", label: "Youth mentorship and discipleship" },
    { target: "creative.storytelling_creative", label: "Youth engaging narrative" }
  ],
  "science.acids_bases": [
    { target: "life.health_wellness", label: "Body pH in health maintenance" }
  ],
  "science.advanced_biochemistry": [
    { target: "life.nutrition", label: "Biochemical nutrient metabolism detail" },
    { target: "fitness.exercise_physiology", label: "Biochemistry of muscle energy systems" }
  ],
  "science.advanced_physics_mastery": [
    { target: "fitness.biomechanics", label: "Advanced mechanics applied to biomechanics" }
  ],
  "science.agroecology": [
    { target: "social.environmental_policy", label: "Agroecological practices in farm policy" },
    { target: "life.sustainability_living", label: "Agroecology for sustainable food systems" }
  ],
  "science.anatomy_physiology": [
    { target: "creative.anatomy_for_art", label: "Anatomical knowledge for figure art" }
  ],
  "science.animal_biology": [
    { target: "life.pet_care", label: "Animal biology for pet health" }
  ],
  "science.astrobiology": [
    { target: "social.philosophy_intro", label: "Life origin questions in philosophy" }
  ],
  "science.basic_chemistry": [
    { target: "math.ratios", label: "Chemical ratios" }
  ],
  "science.biodiversity": [
    { target: "life.environmental_stewardship", label: "Biodiversity as stewardship concern" }
  ],
  "science.biology_systems": [
    { target: "life.health_wellness", label: "Biological systems knowledge for health" }
  ],
  "science.biomedical_science": [
    { target: "life.healthcare_literacy", label: "Biomedical knowledge for patient health literacy" },
    { target: "social.health_policy", label: "Biomedical science informing health policy" }
  ],
  "science.botany": [
    { target: "life.nutrition", label: "Plant biology for nutritional knowledge" }
  ],
  "science.chemical_equilibrium": [
    { target: "life.basic_cooking", label: "Chemical equilibrium in fermentation" }
  ],
  "science.chemical_physical_changes": [
    { target: "life.basic_cooking", label: "Physical and chemical changes in cooking" }
  ],
  "science.climate_systems_modeling": [
    { target: "social.climate_change_policy", label: "Climate models driving climate legislation" }
  ],
  "science.computational_science": [
    { target: "social.quantitative_social", label: "Computational methods in quantitative social science" }
  ],
  "science.data_recording": [
    { target: "math.coordinate_plane", label: "Graphing data" }
  ],
  "science.ecology_theory": [
    { target: "social.environmental_policy", label: "Ecological theory in policy design" }
  ],
  "science.ecosystem_services": [
    { target: "social.dev_economics", label: "Natural capital in development economics" }
  ],
  "science.electricity_basics": [
    { target: "life.home_electrical_basics", label: "Basic electricity for safe home wiring" }
  ],
  "science.electrodynamics": [
    { target: "life.home_electrical_basics", label: "Electrodynamics in household circuits" }
  ],
  "science.electromagnetic_spectrum": [
    { target: "creative.color_theory", label: "Electromagnetic basis of visible color" }
  ],
  "science.electromagnetism": [
    { target: "creative.audio_production", label: "Electromagnetic basis of microphones" }
  ],
  "science.endocrinology": [
    { target: "fitness.sports_nutrition", label: "Hormones regulating athletic metabolism" },
    { target: "life.health_wellness", label: "Endocrine health in personal wellness" }
  ],
  "science.energy_transfer": [
    { target: "life.sustainability_living", label: "Efficient energy transfer for sustainable home" },
    { target: "fitness.exercise_physiology", label: "Energy transfer in metabolic pathways" }
  ],
  "science.engineering_design": [
    { target: "life.problem_solving", label: "Engineering design process for problem solving" }
  ],
  "science.engineering_design_adv": [
    { target: "creative.industrial_design", label: "Advanced engineering in product design" }
  ],
  "science.evolution": [
    { target: "religion.comparative_theology", label: "Science & faith dialogue" }
  ],
  "science.fluid_mechanics": [
    { target: "fitness.swimming_basics", label: "Fluid dynamics in swimming technique" }
  ],
  "science.forces_motion": [
    { target: "math.trig_ratios", label: "Force vectors" }
  ],
  "science.forensic_science": [
    { target: "social.law_justice", label: "Forensic evidence in criminal justice" },
    { target: "lang.technical_writing", label: "Forensic report technical writing" }
  ],
  "science.genetic_engineering": [
    { target: "social.health_policy", label: "Genetic engineering in healthcare policy" }
  ],
  "science.genetics_intro": [
    { target: "math.probability_basics", label: "Genetic probability" }
  ],
  "science.geologic_time": [
    { target: "social.physical_geography", label: "Geologic history in landscape formation" }
  ],
  "science.geology": [
    { target: "social.physical_geography", label: "Geological processes shape landforms" }
  ],
  "science.gravitational_fields": [
    { target: "fitness.biomechanics", label: "Gravity in human movement mechanics" }
  ],
  "science.habitats": [
    { target: "social.physical_geography", label: "Habitat zones in physical geography" }
  ],
  "science.health_science": [
    { target: "life.healthcare_literacy", label: "Health science for medical literacy" },
    { target: "social.health_policy", label: "Health science informing healthcare policy" }
  ],
  "science.heredity_basics": [
    { target: "life.health_wellness", label: "Hereditary factors in family health" }
  ],
  "science.human_body_systems": [
    { target: "fitness.exercise_physiology", label: "Body systems in exercise physiology" },
    { target: "creative.anatomy_for_art", label: "Body systems in anatomical drawing" }
  ],
  "science.human_impact": [
    { target: "social.environmental_policy", label: "Human impact science in policy debates" },
    { target: "life.sustainability_living", label: "Understanding human environmental footprint" }
  ],
  "science.hypothesis_formation": [
    { target: "lang.research_basics", label: "Hypothesis as research question" }
  ],
  "science.immunology_advanced": [
    { target: "life.healthcare_literacy", label: "Advanced immunology for health decisions" },
    { target: "social.health_policy", label: "Immunology in vaccine policy debates" }
  ],
  "science.immunology_intro": [
    { target: "life.health_wellness", label: "Immune system knowledge for health" }
  ],
  "science.life_cycles": [
    { target: "life.parenting", label: "Understanding biological life stages" }
  ],
  "science.materials_science": [
    { target: "life.home_maintenance", label: "Material knowledge for home repair" }
  ],
  "science.matter_conservation": [
    { target: "life.sustainability_living", label: "Conservation principles for reducing waste" }
  ],
  "science.momentum": [
    { target: "creative.animation", label: "Momentum physics in realistic animation" }
  ],
  "science.nanotechnology": [
    { target: "social.ethical_theory", label: "Ethical implications of nanotechnology" },
    { target: "creative.industrial_design", label: "Nanomaterial properties in product design" }
  ],
  "science.natural_selection": [
    { target: "social.ethical_theory", label: "Social Darwinism ethical critique" }
  ],
  "science.neuroscience_advanced": [
    { target: "fitness.sports_psychology", label: "Neuroscience of sports decision making" },
    { target: "life.mental_health_literacy", label: "Neuroscience basis of mental health" }
  ],
  "science.newtons_laws": [
    { target: "creative.animation", label: "Newton's laws for realistic animation physics" }
  ],
  "science.nuclear_intro": [
    { target: "social.foreign_policy", label: "Nuclear arms in foreign policy" }
  ],
  "science.nuclear_physics": [
    { target: "social.environmental_policy", label: "Nuclear energy in energy policy" },
    { target: "social.foreign_policy", label: "Nuclear weapons in foreign policy" }
  ],
  "science.observation_skills": [
    { target: "lang.descriptive_writing", label: "Observation into descriptive writing" }
  ],
  "science.oceanography": [
    { target: "social.physical_geography", label: "Ocean systems in physical geography" }
  ],
  "science.optics_advanced": [
    { target: "creative.cinematography", label: "Optical principles in cinematography" }
  ],
  "science.peer_review": [
    { target: "lang.editing_revision", label: "Critical feedback in writing revision" }
  ],
  "science.pharmacology_basics": [
    { target: "life.healthcare_literacy", label: "Drug mechanisms for medical literacy" },
    { target: "social.health_policy", label: "Pharmacology in drug regulation policy" }
  ],
  "science.photosynthesis_respiration": [
    { target: "life.nutrition", label: "Cellular respiration producing energy from food" },
    { target: "fitness.exercise_physiology", label: "Aerobic respiration in exercise energy" }
  ],
  "science.plant_growth": [
    { target: "life.sustainability_living", label: "Plant cultivation for sustainable living" }
  ],
  "science.population_ecology": [
    { target: "social.demographic_analysis", label: "Ecological population dynamics models" }
  ],
  "science.population_genetics": [
    { target: "social.anthropology", label: "Genetic diversity in human anthropology" }
  ],
  "science.properties_materials": [
    { target: "creative.industrial_design", label: "Material properties in design selection" },
    { target: "life.home_maintenance", label: "Material properties in repairs" }
  ],
  "science.reaction_rates": [
    { target: "life.basic_cooking", label: "Reaction rate affecting cooking speed" }
  ],
  "science.renewable_energy_science": [
    { target: "social.environmental_policy", label: "Renewable energy policy basis" },
    { target: "life.sustainability_living", label: "Renewable energy for sustainable home" },
    { target: "social.geopolitics", label: "Energy politics" }
  ],
  "science.research_methods_adv": [
    { target: "social.research_methodology", label: "Advanced scientific research methods" },
    { target: "lang.research_papers", label: "Advanced methods in scientific publication" }
  ],
  "science.rotational_mechanics": [
    { target: "fitness.biomechanics", label: "Rotational forces in athletic technique" }
  ],
  "science.science_policy": [
    { target: "social.public_policy", label: "Science-informed public policy making" },
    { target: "social.environmental_policy", label: "Science in environmental regulatory policy" }
  ],
  "science.scientific_argumentation": [
    { target: "lang.argumentative_writing", label: "Evidence-based argument construction" },
    { target: "lang.debate", label: "Scientific evidence use in debate" }
  ],
  "science.scientific_mastery_project": [
    { target: "lang.research_papers", label: "Mastery project as research paper" }
  ],
  "science.scientific_method": [
    { target: "math.variables_expr", label: "Variables" }
  ],
  "science.solar_system": [
    { target: "creative.music_history", label: "Celestial music of the spheres concept" }
  ],
  "science.solution_chemistry": [
    { target: "life.basic_cooking", label: "Solutions and concentrations in cooking" }
  ],
  "science.sorting_classifying": [
    { target: "lang.grammar", label: "Classification categories in grammar" }
  ],
  "science.sound_basics": [
    { target: "creative.audio_production", label: "Sound properties in audio production" }
  ],
  "science.space_exploration": [
    { target: "social.foreign_policy", label: "Space diplomacy and international relations" },
    { target: "lang.technical_writing", label: "Space mission technical documentation" }
  ],
  "science.space_science": [
    { target: "social.physical_geography", label: "Space-based Earth observation for geography" }
  ],
  "science.speed_distance": [
    { target: "fitness.basic_movement", label: "Speed-distance calculations in fitness" }
  ],
  "science.string_theory_intro": [
    { target: "social.philosophy_intro", label: "String theory in philosophy of physics" }
  ],
  "science.sun_earth_basics": [
    { target: "social.physical_geography", label: "Solar cycles driving geographic seasons" }
  ],
  "science.synthetic_biology": [
    { target: "social.ethical_theory", label: "Ethical analysis of life engineering" }
  ],
  "science.systems_biology": [
    { target: "life.healthcare_literacy", label: "Systems biology in medical understanding" }
  ],
  "science.systems_thinking": [
    { target: "social.political_economy", label: "Systems thinking in political economy" },
    { target: "life.problem_solving", label: "Systems approach to complex problems" }
  ],
  "science.theory_explanation": [
    { target: "lang.technical_writing", label: "Explaining theory in technical writing" }
  ],
  "science.water_cycle": [
    { target: "social.physical_geography", label: "Water cycle in geographic landform processes" },
    { target: "social.environmental_policy", label: "Water management in environmental policy" }
  ],
  "science.weather_climate_modeling": [
    { target: "social.climate_change_policy", label: "Climate models informing climate policy" }
  ],
  "science.weather_observation": [
    { target: "life.emergency_prep", label: "Weather observation for disaster preparedness" }
  ],
  "science.weather_patterns": [
    { target: "life.emergency_prep", label: "Weather prediction for emergency prep" }
  ],
  "social.africa_history": [
    { target: "science.ecology", label: "African ecological historical context" },
    { target: "creative.world_music", label: "African cultural musical traditions" }
  ],
  "social.age_exploration": [
    { target: "science.astronomy", label: "Celestial navigation" }
  ],
  "social.american_revolution_detail": [
    { target: "math.word_problems", label: "Economic revolutionary context" },
    { target: "science.materials_science", label: "Revolutionary era technology" }
  ],
  "social.ap_economics": [
    { target: "math.derivatives", label: "Marginal analysis in AP economics" },
    { target: "math.probability_and_statistics", label: "Econometric statistics" }
  ],
  "social.ap_gov_politics": [
    { target: "math.probability_and_statistics", label: "Political science statistics" },
    { target: "life.voting_civic", label: "Electoral analysis" }
  ],
  "social.ap_history": [
    { target: "science.research_design", label: "Advanced historical methodology" }
  ],
  "social.ap_human_geography": [
    { target: "math.probability_and_statistics", label: "Demographic geographic stats" },
    { target: "science.environmental_science", label: "Human environment interaction" }
  ],
  "social.ap_world_history": [
    { target: "math.probability_and_statistics", label: "World historical data analysis" },
    { target: "science.research_design", label: "AP-level research methodology" }
  ],
  "social.bill_rights": [
    { target: "life.legal_literacy", label: "Constitutional rights knowledge" },
    { target: "life.civic_literacy", label: "Rights and freedoms awareness" }
  ],
  "social.cardinal_directions": [
    { target: "math.basic_geometry", label: "Directional spatial reasoning" }
  ],
  "social.civic_engagement": [
    { target: "life.community_service", label: "Active civic contribution" }
  ],
  "social.civil_war_era": [
    { target: "math.probability_and_statistics", label: "Civil War demographic data" },
    { target: "science.materials_science", label: "Civil War era technology" }
  ],
  "social.climate_change_policy": [
    { target: "science.renewable_energy_science", label: "Renewable energy policy" },
    { target: "math.probability_and_statistics", label: "Climate statistical modeling" }
  ],
  "social.cold_war": [
    { target: "science.space_exploration", label: "Space race scientific context" },
    { target: "math.probability_and_statistics", label: "Arms race numerical analysis" }
  ],
  "social.colonial_daily_life": [
    { target: "science.materials_science", label: "Colonial technology and materials" },
    { target: "creative.storytelling_creative", label: "Historical narrative" }
  ],
  "social.community_awareness": [
    { target: "life.volunteering", label: "Local civic engagement" }
  ],
  "social.community_workers": [
    { target: "life.career_exploration", label: "Community occupational roles" }
  ],
  "social.continents_oceans": [
    { target: "science.oceanography", label: "Ocean system overview" }
  ],
  "social.critical_analysis": [
    { target: "science.scientific_argumentation", label: "Evidence quality assessment" }
  ],
  "social.critical_race_theory": [
    { target: "math.probability_and_statistics", label: "Racial disparity statistics" },
    { target: "life.ethics_integrity", label: "Anti-racism ethical framework" }
  ],
  "social.current_events": [
    { target: "life.media_awareness", label: "Current news evaluation" },
    { target: "tech.social_media_lit", label: "Social media event analysis" }
  ],
  "social.decolonization": [
    { target: "life.ethics_integrity", label: "Decolonial ethical frameworks" }
  ],
  "social.demographic_analysis": [
    { target: "tech.data_viz", label: "Demographic data visualization" }
  ],
  "social.dev_economics": [
    { target: "science.environmental_science", label: "Resource ecology in development" }
  ],
  "social.diplomatic_strategy": [
    { target: "life.cross_cultural_competency", label: "Cross-cultural negotiation" },
    { target: "life.adv_negotiation", label: "Advanced negotiation tactics" }
  ],
  "social.economic_systems": [
    { target: "math.mathematical_logic", label: "Economic system comparison logic" },
    { target: "life.financial_planning", label: "Personal economic system knowledge" }
  ],
  "social.economic_theory": [
    { target: "math.linear_algebra", label: "Linear economic modeling" }
  ],
  "social.economics_trade": [
    { target: "math.ratios", label: "Exchange rate ratio math" },
    { target: "math.money_math", label: "Trade value calculation" },
    { target: "science.environmental_science", label: "Trade resource ecology" }
  ],
  "social.election_basics": [
    { target: "life.voting_civic", label: "Electoral process knowledge" },
    { target: "math.simple_probability", label: "Election probability basics" }
  ],
  "social.empire_studies": [
    { target: "science.environmental_science", label: "Imperial resource extraction ecology" },
    { target: "math.probability_and_statistics", label: "Imperial demographic data" }
  ],
  "social.environmental_justice": [
    { target: "science.environmental_science", label: "Environmental impact science" },
    { target: "life.ethics_integrity", label: "Environmental equity ethics" }
  ],
  "social.environmental_policy": [
    { target: "life.sustainability_living", label: "Sustainable policy practice" }
  ],
  "social.ethical_theory": [
    { target: "math.mathematical_logic", label: "Formal ethical argument structure" },
    { target: "life.ethics_integrity", label: "Applied ethical principles" }
  ],
  "social.ethnic_studies": [
    { target: "creative.world_music", label: "Ethnic cultural expression" }
  ],
  "social.financial_literacy": [
    { target: "math.compound_interest", label: "Savings growth calculation" },
    { target: "life.banking", label: "Banking services knowledge" }
  ],
  "social.game_theory": [
    { target: "math.probability_and_statistics", label: "Probability in strategic choice" }
  ],
  "social.gender_studies": [
    { target: "science.observation_skills", label: "Social science research methods" }
  ],
  "social.geography_analysis": [
    { target: "tech.data_viz", label: "GIS data visualization" }
  ],
  "social.geopolitics": [
    { target: "science.earth_science", label: "Physical geography and power" },
    { target: "religion.missiology", label: "Global missions context" }
  ],
  "social.global_economics": [
    { target: "math.probability_and_statistics", label: "Global economic statistics" }
  ],
  "social.global_governance": [
    { target: "math.mathematical_logic", label: "Collective action logic" },
    { target: "life.cross_cultural_competency", label: "Cross-cultural governance" }
  ],
  "social.globalization": [
    { target: "tech.internet_browsing", label: "Digital globalization tools" }
  ],
  "social.government_types": [
    { target: "math.mathematical_logic", label: "Comparative governance logic" }
  ],
  "social.health_policy": [
    { target: "science.health_science", label: "Medical evidence for policy" },
    { target: "math.probability_and_statistics", label: "Health statistics for policy" },
    { target: "life.healthcare_literacy", label: "Healthcare system navigation" }
  ],
  "social.historical_figures": [
    { target: "creative.storytelling_creative", label: "Biographical narrative" }
  ],
  "social.historical_geography": [
    { target: "science.earth_science", label: "Physical geographic change" },
    { target: "math.coordinate_plane", label: "Historical mapping coordinates" }
  ],
  "social.holocaust_studies": [
    { target: "math.probability_and_statistics", label: "Holocaust demographic data" },
    { target: "life.ethics_integrity", label: "Moral responsibility ethics" }
  ],
  "social.human_rights": [
    { target: "life.civic_literacy", label: "Rights and duties framework" }
  ],
  "social.human_rights_law": [
    { target: "math.mathematical_logic", label: "Rights-based legal argument" },
    { target: "life.legal_literacy", label: "International rights law" }
  ],
  "social.immigration_studies": [
    { target: "math.probability_and_statistics", label: "Immigration demographic data" },
    { target: "life.cultural_awareness", label: "Immigrant cultural experience" }
  ],
  "social.intl_economics": [
    { target: "math.probability_and_statistics", label: "Trade econometric analysis" },
    { target: "math.matrices", label: "Input-output international models" }
  ],
  "social.latin_america": [
    { target: "science.climate_environment", label: "Latin American ecosystems" },
    { target: "creative.world_music", label: "Latin musical cultural forms" }
  ],
  "social.leadership_influence": [
    { target: "life.exec_leadership", label: "Executive influence strategies" }
  ],
  "social.map_globe": [
    { target: "math.basic_geometry", label: "Spherical map projection basics" }
  ],
  "social.media_literacy": [
    { target: "tech.internet_research", label: "Digital misinformation detection" },
    { target: "lang.journalism", label: "News literacy" }
  ],
  "social.media_policy": [
    { target: "tech.data_privacy", label: "Digital privacy policy" }
  ],
  "social.media_studies": [
    { target: "tech.social_media_lit", label: "Digital media platform analysis" },
    { target: "tech.digital_media_creation", label: "Media production analysis" },
    { target: "math.probability_and_statistics", label: "Media audience statistics" }
  ],
  "social.microeconomics": [
    { target: "math.word_problems", label: "Economic word problem solving" }
  ],
  "social.middle_east_history": [
    { target: "science.earth_science", label: "Middle East geographic context" },
    { target: "creative.architecture", label: "Islamic architectural history" }
  ],
  "social.mythology_folklore": [
    { target: "creative.storytelling_creative", label: "Mythic narrative structure" }
  ],
  "social.national_symbols": [
    { target: "creative.icon_symbol_design", label: "Flag and seal symbolism" }
  ],
  "social.native_peoples": [
    { target: "science.ecology", label: "Indigenous ecological knowledge" },
    { target: "creative.world_music", label: "Indigenous cultural traditions" }
  ],
  "social.past_present": [
    { target: "math.time_math", label: "Chronological time calculation" }
  ],
  "social.peace_conflict": [
    { target: "life.conflict_resolution", label: "Conflict mediation methods" },
    { target: "math.probability_and_statistics", label: "Conflict probability modeling" }
  ],
  "social.philosophy_gov": [
    { target: "math.mathematical_logic", label: "Normative political logic" }
  ],
  "social.physical_geography": [
    { target: "science.plate_tectonics", label: "Tectonic geographic features" }
  ],
  "social.political_economy": [
    { target: "math.derivatives", label: "Optimization in political economy" }
  ],
  "social.primary_secondary_sources": [
    { target: "science.peer_review", label: "Source credibility evaluation" }
  ],
  "social.propaganda_analysis": [
    { target: "life.media_awareness", label: "Propaganda recognition" },
    { target: "math.mathematical_logic", label: "Fallacy identification logic" }
  ],
  "social.public_policy": [
    { target: "science.research_design", label: "Policy evaluation methods" },
    { target: "life.critical_thinking", label: "Policy argument analysis" }
  ],
  "social.quantitative_social": [
    { target: "math.probability_and_statistics", label: "Social science statistics" },
    { target: "tech.data_cleaning", label: "Social data preparation" },
    { target: "tech.statistics_data", label: "Statistical software tools" }
  ],
  "social.research_methodology": [
    { target: "science.research_design", label: "Scientific methodology transfer" }
  ],
  "social.social_movements": [
    { target: "life.community_service", label: "Civic movement participation" }
  ],
  "social.social_psychology": [
    { target: "science.nervous_system", label: "Neural social behavior basis" }
  ],
  "social.state_formation": [
    { target: "math.mathematical_logic", label: "State logic and institutional theory" },
    { target: "science.systems_thinking", label: "State as complex system" }
  ],
  "social.state_local_gov": [
    { target: "life.local_government", label: "Municipal governance navigation" }
  ],
  "social.supply_demand_basic": [
    { target: "math.basic_geometry", label: "Supply-demand curve graph" }
  ],
  "social.urban_planning": [
    { target: "math.basic_geometry", label: "Urban spatial geometry" },
    { target: "creative.architecture", label: "Urban design principles" },
    { target: "science.environmental_science", label: "Urban ecological impact" }
  ],
  "social.us_constitution": [
    { target: "math.mathematical_logic", label: "Constitutional legal logic" },
    { target: "life.legal_literacy", label: "Constitutional law literacy" }
  ],
  "social.us_hist_civil_rights": [
    { target: "life.ethics_integrity", label: "Civil rights ethical principles" },
    { target: "creative.music_history", label: "Civil rights movement music" }
  ],
  "social.us_hist_rev": [
    { target: "creative.storytelling_creative", label: "Revolutionary narrative history" }
  ],
  "social.world_hist_renaissance": [
    { target: "creative.art_criticism", label: "Renaissance artistic analysis" },
    { target: "creative.architecture", label: "Renaissance architectural design" },
    { target: "science.scientific_method", label: "Renaissance scientific revolution" }
  ],
  "social.ww1_ww2": [
    { target: "science.materials_science", label: "Wartime technological innovation" }
  ],
  "tech.3d_printing_fab": [
    { target: "creative.industrial_design", label: "Rapid prototyping in industrial design" }
  ],
  "tech.accessibility_tech": [
    { target: "social.human_rights", label: "Digital accessibility as civil right" },
    { target: "life.diversity_inclusion", label: "Accessibility for inclusive digital experiences" }
  ],
  "tech.advanced_ai_research": [
    { target: "social.ethical_theory", label: "AI ethics and moral philosophy" },
    { target: "creative.ai_assisted_art", label: "Advanced AI models in creative generation" }
  ],
  "tech.advanced_automation": [
    { target: "social.global_economics", label: "Automation impact on global labor economics" },
    { target: "life.digital_productivity", label: "Advanced automation for professional productivity" }
  ],
  "tech.advanced_ml": [
    { target: "social.quantitative_social", label: "ML for computational social science" }
  ],
  "tech.agile_practices": [
    { target: "life.project_management", label: "Agile methodology in project management" }
  ],
  "tech.ai_literacy": [
    { target: "social.media_literacy", label: "AI tools as media literacy challenge" },
    { target: "life.critical_thinking", label: "Critical evaluation of AI outputs" }
  ],
  "tech.algorithmic_thinking": [
    { target: "lang.argumentative_writing", label: "Logical step-by-step argument structure" }
  ],
  "tech.api_design": [
    { target: "lang.technical_writing", label: "API documentation technical writing" }
  ],
  "tech.basic_troubleshooting": [
    { target: "life.problem_solving", label: "Systematic problem-solving approach" }
  ],
  "tech.blockchain": [
    { target: "life.investing", label: "Cryptocurrency as investment vehicle" }
  ],
  "tech.circuit_design": [
    { target: "life.home_electrical_basics", label: "Circuit design principles in home wiring" }
  ],
  "tech.cloud_computing": [
    { target: "social.global_economics", label: "Cloud infrastructure in global tech economy" }
  ],
  "tech.code_review": [
    { target: "lang.editing_revision", label: "Code review as peer editing process" },
    { target: "life.work_habits", label: "Code review as professional quality habit" }
  ],
  "tech.comp_biology": [
    { target: "life.healthcare_literacy", label: "Computational biology in medical research" },
    { target: "science.genetics_intro", label: "Biological data" }
  ],
  "tech.computer_graphics": [
    { target: "creative.3d_rendering", label: "Computer graphics in 3D rendering" },
    { target: "math.matrices", label: "Transform matrices" }
  ],
  "tech.computer_vision": [
    { target: "creative.photography_basics", label: "Image recognition mirrors photographic analysis" }
  ],
  "tech.cpp_programming": [
    { target: "creative.game_design", label: "C++ for game engine development" }
  ],
  "tech.cryptography": [
    { target: "social.law_justice", label: "Encryption law and digital rights" },
    { target: "life.digital_identity", label: "Cryptographic identity verification" }
  ],
  "tech.css_advanced": [
    { target: "creative.web_design", label: "Advanced CSS for visual web design" }
  ],
  "tech.cybersecurity_awareness": [
    { target: "life.digital_identity", label: "Awareness of identity theft risks" }
  ],
  "tech.data_privacy": [
    { target: "life.digital_identity", label: "Privacy rights in digital identity protection" },
    { target: "social.law_justice", label: "Data privacy legislation and rights" }
  ],
  "tech.data_science": [
    { target: "social.quantitative_social", label: "Data science methods in social research" },
    { target: "life.financial_planning", label: "Data-driven personal financial analysis" }
  ],
  "tech.data_structures": [
    { target: "math.discrete_math", label: "Graph theory" }
  ],
  "tech.data_viz": [
    { target: "creative.infographic_design", label: "Data visualization as infographic design" },
    { target: "social.research_methodology", label: "Visual data presentation in research" }
  ],
  "tech.database_concepts": [
    { target: "math.set_theory", label: "Set operations" }
  ],
  "tech.database_design": [
    { target: "social.research_methodology", label: "Database schema for research data storage" }
  ],
  "tech.debugging_testing": [
    { target: "life.problem_solving", label: "Systematic debugging as problem solving strategy" }
  ],
  "tech.deep_learning": [
    { target: "creative.ai_assisted_art", label: "Deep learning models generating creative art" }
  ],
  "tech.design_patterns": [
    { target: "creative.architecture", label: "Design pattern analogy to architectural patterns" }
  ],
  "tech.devops": [
    { target: "life.project_management", label: "DevOps pipeline project management" }
  ],
  "tech.digital_communication": [
    { target: "lang.digital_communication", label: "Digital tools for written communication" },
    { target: "life.workplace_etiquette", label: "Professional digital communication norms" }
  ],
  "tech.digital_forensics": [
    { target: "social.law_justice", label: "Digital evidence in criminal justice" }
  ],
  "tech.digital_media_creation": [
    { target: "lang.content_creation", label: "Creating digital media content" }
  ],
  "tech.digital_navigation": [
    { target: "life.digital_basics", label: "Digital navigation for everyday tasks" }
  ],
  "tech.edge_ai": [
    { target: "fitness.fitness_technology", label: "Edge AI in real-time fitness wearables" }
  ],
  "tech.engineering_design_process": [
    { target: "life.problem_solving", label: "Iterative engineering design for problem solving" }
  ],
  "tech.feature_engineering": [
    { target: "social.research_methodology", label: "Feature construction for research models" }
  ],
  "tech.full_stack": [
    { target: "life.entrepreneurship", label: "Full-stack skills for digital entrepreneurship" }
  ],
  "tech.game_dev_advanced": [
    { target: "creative.narrative_design", label: "Narrative systems in game development" }
  ],
  "tech.generative_ai_eng": [
    { target: "creative.ai_assisted_art", label: "Generative AI engineering for art creation" }
  ],
  "tech.hci_research": [
    { target: "creative.ux_ui_design", label: "HCI research informs UX design" },
    { target: "social.psychology_intro", label: "Cognitive psychology in user research" }
  ],
  "tech.identity_access": [
    { target: "life.digital_identity", label: "Identity access management for security" }
  ],
  "tech.independent_build_project": [
    { target: "life.project_management", label: "Self-directed project management skills" }
  ],
  "tech.internet_research": [
    { target: "lang.research_skills", label: "Internet as primary research tool" },
    { target: "lang.source_evaluation", label: "Online source credibility evaluation" }
  ],
  "tech.intro_coding": [
    { target: "lang.writing_process_basic", label: "Coding as structured writing process" }
  ],
  "tech.iot": [
    { target: "life.home_management", label: "IoT devices in smart home management" },
    { target: "fitness.fitness_technology", label: "IoT wearables in fitness tracking" }
  ],
  "tech.java_oop": [
    { target: "creative.game_design", label: "Java OOP in game system architecture" }
  ],
  "tech.javascript_adv": [
    { target: "creative.animation", label: "JavaScript for web-based animation" }
  ],
  "tech.mechanisms_structures": [
    { target: "creative.architecture", label: "Structural mechanisms in architectural design" }
  ],
  "tech.media_production": [
    { target: "creative.audio_production", label: "Audio production in media creation" },
    { target: "creative.film_video_basics", label: "Video production for media content" }
  ],
  "tech.microcontroller_basics": [
    { target: "creative.installation_art", label: "Microcontrollers in interactive art" }
  ],
  "tech.ml_basics": [
    { target: "math.linear_algebra", label: "ML math" },
    { target: "science.data_analysis_advanced", label: "Scientific analysis" }
  ],
  "tech.mobile_dev": [
    { target: "life.digital_productivity", label: "Mobile apps for personal productivity" }
  ],
  "tech.model_evaluation": [
    { target: "social.research_methodology", label: "Model evaluation in empirical research" }
  ],
  "tech.nlp": [
    { target: "lang.linguistics_basics", label: "Natural language processing and linguistics" }
  ],
  "tech.no_code_low_code": [
    { target: "life.digital_productivity", label: "No-code tools for productivity automation" },
    { target: "creative.web_design", label: "Low-code tools for website building" }
  ],
  "tech.open_source_contribution": [
    { target: "life.community_service", label: "Open source as digital community service" },
    { target: "lang.technical_writing", label: "Open source documentation writing" }
  ],
  "tech.penetration_testing": [
    { target: "social.law_justice", label: "Ethical hacking within legal frameworks" }
  ],
  "tech.power_systems_wiring": [
    { target: "life.home_electrical_basics", label: "Power systems in home electrical work" }
  ],
  "tech.presentation_software": [
    { target: "lang.oral_presentation", label: "Slides supporting oral presentations" }
  ],
  "tech.pwa_mobile_web": [
    { target: "creative.ux_ui_design", label: "Progressive web app UX design" }
  ],
  "tech.quantum_computing": [
    { target: "social.philosophy_intro", label: "Quantum computation in philosophy of mind" }
  ],
  "tech.react_frontend": [
    { target: "creative.web_design", label: "React components for web design implementation" }
  ],
  "tech.regex_text": [
    { target: "lang.grammar", label: "Regex pattern matching text grammar" }
  ],
  "tech.reinforcement_learning": [
    { target: "creative.game_design", label: "Reinforcement learning in game AI agents" }
  ],
  "tech.robotics": [
    { target: "creative.industrial_design", label: "Robotic system design and fabrication" },
    { target: "fitness.exercise_physiology", label: "Robotic prosthetics based on physiology" },
    { target: "science.forces_motion", label: "Physics of motion" },
    { target: "math.trig_ratios", label: "Kinematics math" }
  ],
  "tech.secure_coding": [
    { target: "life.internet_safety", label: "Secure coding prevents user data exposure" }
  ],
  "tech.sensors_actuators": [
    { target: "fitness.fitness_technology", label: "Sensors in wearable fitness tech" }
  ],
  "tech.signal_processing": [
    { target: "creative.music_production", label: "Digital signal processing in music production" }
  ],
  "tech.social_media_lit": [
    { target: "lang.media_literacy_lang", label: "Social media as media literacy context" },
    { target: "life.social_media_literacy", label: "Critical social media use skills" }
  ],
  "tech.software_architecture": [
    { target: "life.project_management", label: "Software architecture as system project planning" }
  ],
  "tech.spatial_computing": [
    { target: "creative.xr_experience", label: "Spatial computing for XR experiences" },
    { target: "social.physical_geography", label: "Spatial computing in geographic information systems" }
  ],
  "tech.spreadsheet_adv": [
    { target: "life.financial_planning", label: "Advanced spreadsheets for financial modeling" },
    { target: "social.quantitative_social", label: "Spreadsheet analysis of social data" }
  ],
  "tech.sql": [
    { target: "life.financial_records", label: "SQL for financial database management" }
  ],
  "tech.statistics_data": [
    { target: "social.quantitative_social", label: "Statistical computing for social data" }
  ],
  "tech.systems_integration": [
    { target: "life.problem_solving", label: "Systems integration problem solving" }
  ],
  "tech.tdd_bdd": [
    { target: "life.work_habits", label: "Test-driven development as systematic work habit" }
  ],
  "tech.tech_documentation": [
    { target: "lang.technical_writing", label: "Technical documentation writing skills" }
  ],
  "tech.tech_ethics": [
    { target: "social.ethical_theory", label: "Ethical reasoning applied to technology" },
    { target: "life.critical_thinking", label: "Ethical critical analysis of tech choices" }
  ],
  "tech.touch_typing": [
    { target: "lang.writing_process_basic", label: "Touch typing accelerates written composition" }
  ],
  "tech.web3_smart_contracts": [
    { target: "social.financial_literacy", label: "Smart contracts in decentralized finance" },
    { target: "social.law_justice", label: "Smart contract enforceability in law" }
  ],
  "tech.web_security": [
    { target: "life.internet_safety", label: "Web security practices for user protection" }
  ],
  "tech.wireless_embedded": [
    { target: "fitness.fitness_technology", label: "Wireless embedded chips in fitness wearables" }
  ],
  "tech.word_processing": [
    { target: "lang.writing_process_basic", label: "Word processing for written composition" },
    { target: "lang.editing_revision", label: "Word processor tools for revision" }
  ]
};
