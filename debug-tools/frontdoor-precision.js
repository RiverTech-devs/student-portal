#!/usr/bin/env node
// ─────────────────────────────────────────────────────────────────────────────
// Riven front-door WRITE-PRECISION bench.
//
// Why this exists (portfolio lesson, not a Riven-specific hunch):
//   On 2026-06-24 two freshly-shipped deterministic front-doors in this
//   portfolio — PIE's non-LLM matcher and ulcagent's deterministic_frontdoor —
//   both looked fully green on their unit suites and each still had real false
//   positives, found only by a precision bench with an adversarial bucket.
//   PIE's `interest` matcher fired on "explain why simple interest ... is worse
//   than compound" and answered a bare "150.00"; ulcagent's rename fired on
//   "rename it to bar" and rewrote every .py in the tree. Neither hole was
//   visible to the tests that shipped alongside them.
//
//   `nlp-stress.js` is Riven's equivalent of those unit suites: it asserts that
//   in-scope phrasings reach the right intent. That is RECALL. It never measures
//   what fraction of the sentences Riven decides to WRITE on were genuinely
//   commands — which is the metric that matters, because Riven's front-door
//   mutates balances, grades, attendance and enrollment.
//
//   The load-bearing rule from that lesson: never trade precision for recall on
//   a money or mutation path. Over-deferral is free (it just routes to the
//   semantic layer, or asks). Over-firing is a wrong write.
//
// What it measures:
//   WRITE-PRECISION = correct writes / everything classified as a write.
//   Target is 1.0. Recall is reported for information but is NOT gated —
//   a missed write costs the teacher one rephrase.
//
// Buckets:
//   A  in-scope commands            → expect WRITE (and the right one)
//   B  reads / out-of-scope         → expect SAFE
//   C  ADVERSARIAL look-alikes      → expect SAFE   ← the bucket that finds bugs
//
// SCOPE: this covers the REGEX front-door only (`_matchIntent`), which is the
// tier that runs for every teacher with no download. The MiniLM and Llama tiers
// sit behind it and have their own guards (semantic writes always confirm;
// phi3 output is re-validated through this same matcher). A false positive here
// is the one that reaches a teacher with nothing in front of it.
//
// Run:  node debug-tools/frontdoor-precision.js
// Exit: 0 if write-precision == 1.0, else 1.
// ─────────────────────────────────────────────────────────────────────────────
const fs = require('fs');
const path = require('path');

const SRC_CANDIDATES = [
  path.join(__dirname, '..', 'portal', 'index.html'),
  path.join(__dirname, '..', 'student-portal', 'portal', 'index.html'),
  path.join(__dirname, '..', '..', 'portal', 'index.html'),
  path.join(process.cwd(), 'portal', 'index.html'),
];
const SRC = SRC_CANDIDATES.find(p => fs.existsSync(p));
if (!SRC) {
  console.error('frontdoor-precision: could not locate portal/index.html. Tried:\n  ' + SRC_CANDIDATES.join('\n  '));
  process.exit(2);
}
const src = fs.readFileSync(SRC, 'utf8');

// Pull a method body out of the class by name using brace matching, so the
// bench runs the SHIPPED code and can never drift from it.
function extract(name) {
  const re = new RegExp('\\n    ' + name + '\\s*\\(', 'g');
  const m = re.exec(src);
  if (!m) throw new Error('method not found: ' + name);
  let i = src.indexOf('{', m.index + m[0].length - 1);
  let depth = 0, start = i;
  for (; i < src.length; i++) {
    const c = src[i];
    if (c === '{') depth++;
    else if (c === '}') { depth--; if (depth === 0) { i++; break; } }
  }
  const sig = src.slice(m.index + 1, start).trim();
  const args = sig.slice(sig.indexOf('(') + 1, sig.lastIndexOf(')'));
  const body = src.slice(start + 1, i - 1);
  // eslint-disable-next-line no-new-func
  return new Function(...args.split(',').map(s => s.trim()).filter(Boolean), body);
}

const methods = ['_normalizeInput', '_resolvePronouns', '_isFollowUpCommand',
  '_extractEntities', '_parseTimeframe', '_fuzzyFindStudent', '_calculateSimilarity',
  '_levenshteinDistance', '_matchIntent', '_matchSmalltalk', '_isAggregateQuery',
  '_rivenMatchClass', '_rivenCanManageClass', '_preferOwnedClasses', '_isoDaysAgo',
  '_hasCommandVerb', '_hasCommandSignal', '_isCommonWordTypo', '_commonWords',
  '_segmentClauses', '_classifyClauseShape'];

const app = { _nlpContext: {} };
for (const name of methods) { const fn = extract(name); app[name] = function (...a) { return fn.apply(app, a); }; }

// The production write list, lifted verbatim out of _matchIntent so this bench
// cannot drift from the code it is grading.
function productionWriteIntents() {
  const m = src.match(/const WRITE_INTENTS = \[([\s\S]*?)\];/);
  if (!m) throw new Error('could not locate the WRITE_INTENTS array in _matchIntent');
  return m[1].match(/'([A-Z_]+)'/g).map(s => s.replace(/'/g, ''));
}
const WRITE_INTENTS = new Set(productionWriteIntents());
// Writes that destroy or move records rather than adjust a number. A false
// positive on one of these is materially worse than on the others.
const DESTRUCTIVE = new Set(['DELETE_CLASS', 'CLOSE_ALL_CLASSES', 'UNENROLL_STUDENT',
  'MOVE_STUDENT', 'REMOVE_SHOP_ITEM', 'REMOVE_PRIVILEGE', 'DELETE_NOTE', 'REVOKE_PRIVILEGE']);

// Same roster/classes as nlp-stress.js so findings are comparable across benches.
const roster = [
  ['Charlotte', 'Tebow'], ['Eli', 'Morris'], ['Elijah', 'Douglas'], ['Elijah', 'Killackey'],
  ['Evelyn', 'Hegelund'], ['John', 'Smith'], ['Johnny', 'Appleseed'],
  ['Sarah', 'Jones'], ['Sam', 'Carter'], ['Samuel', 'Brooks'],
  ['Sophia', 'Nguyen'], ['Sofia', 'Martinez'], ['Liam', 'Jones'],
  ['Olivia', 'Brown'], ['Noah', 'Williams'], ['Ava', 'Davis'],
  ['Mia', 'Wilson'], ['Lucas', 'Anderson'], ['Mason', 'Thomas'],
];
app._terminalAllStudents = roster.map(([f, l], i) => ({
  full_name: `${f} ${l}`, first_name: f, last_name: l,
  rtc_balance: 100 + i, email: `${f.toLowerCase()}@x.com`, status: 'active', id: 'id' + i
}));
app.userInfo = { profile: { user_type: 'teacher' }, user: { id: 't1' } };
app._terminalAllClasses = [
  { id: 'c1', name: 'Math', subject: 'Mathematics', teacher_id: 't1', secondary_teacher_id: null, is_active: true },
  { id: 'c2', name: 'Robotics', subject: 'Science', teacher_id: 't1', secondary_teacher_id: null, is_active: true },
  { id: 'c3', name: 'Filmmaking - Freshman', subject: 'Art', teacher_id: 't2', secondary_teacher_id: null, is_active: true },
  { id: 'c4', name: 'World History', subject: 'History', teacher_id: 't2', secondary_teacher_id: null, is_active: true },
];

// Replicate the production decision path exactly (mirrors _executeNaturalLanguage).
// Returns { verdict: 'WRITE'|'SAFE', intent, why }.
function decide(input) {
  app._nlpContext = {};   // every item is judged cold — no borrowed context

  const small = app._matchSmalltalk(input);
  if (small && !small.remainder) return { verdict: 'SAFE', intent: 'SMALLTALK:' + small.key, why: 'smalltalk' };
  const text = small?.remainder || input;

  // Correction / filler peeling, as in _executeNaturalLanguage
  let peeled = text;
  const corrLead = peeled.match(/^\s*(?:no+[,!. ]+|i meant?[,: ]+|actually[,: ]+|i mean[,: ]+|sorry[,: ]+i meant?\s+)/i);
  if (corrLead) {
    const rest = peeled.slice(corrLead[0].length).trim();
    if (rest.split(/\s+/).length >= 3 && !/^not what/i.test(rest)) peeled = rest;
  }
  const filler = peeled.match(/^\s*(?:now|ok(?:ay)?|also|please|then|next)[,\s]+/i);
  if (filler && peeled.slice(filler[0].length).trim().split(/\s+/).length >= 2) peeled = peeled.slice(filler[0].length);

  const normalized = app._normalizeInput(peeled);
  const resolved = app._resolvePronouns(normalized);
  const entities = app._extractEntities(resolved, peeled);

  // An unresolved pronoun with no context never reaches the matcher in
  // production — it asks "Who do you mean?" instead.
  if (!entities.student && /\b(he|she|him|her|his|hers)\b/.test(resolved)) {
    return { verdict: 'SAFE', intent: 'ASK_WHO', why: 'unresolved pronoun' };
  }
  const hasPair = (entities.studentFrom && entities.studentTo) || (entities.students && entities.students.length >= 2);
  if (entities.student && entities.student.ambiguous && !hasPair) {
    return { verdict: 'SAFE', intent: 'AMBIGUOUS', why: 'ambiguity dialog' };
  }

  const intent = app._matchIntent(resolved, entities);
  if (!intent) return { verdict: 'SAFE', intent: 'NONE', why: 'no match' };
  const conf = intent.confidence ?? intent.conf ?? 0;
  // Below 0.5 the regex layer defers to the semantic/LLM tier — not a write here.
  if (conf < 0.5) return { verdict: 'SAFE', intent: intent.intent, why: 'below threshold, defers' };
  // CLARIFY_INTENT is the near-tie guard: it ASKS rather than writing.
  if (intent.intent === 'CLARIFY_INTENT') return { verdict: 'SAFE', intent: 'CLARIFY_INTENT', why: 'asks which write' };

  if (!WRITE_INTENTS.has(intent.intent)) return { verdict: 'SAFE', intent: intent.intent, why: 'read intent' };

  // A write intent whose target is missing does NOT write in production — the
  // executor asks for the missing piece ("Tell me like: give [name] 5"). The
  // matcher deliberately returns the intent anyway so the executor can name
  // what it needs, so grading on the intent alone over-counts writes.
  const NEEDS_TARGET = new Set(['ADD_RTC', 'SUBTRACT_RTC', 'TRANSFER_RTC', 'MARK_ATTENDANCE',
    'ENROLL_STUDENT', 'UNENROLL_STUDENT', 'MOVE_STUDENT', 'SET_GRADE', 'ADD_NOTE',
    'BUY_ITEM', 'BUY_PRIVILEGE', 'GRANT_PRIVILEGE', 'REVOKE_PRIVILEGE']);
  if (NEEDS_TARGET.has(intent.intent)) {
    const hasTarget = !!(entities.student || entities.students?.length || entities.studentFrom || entities.classMatch);
    if (!hasTarget) return { verdict: 'SAFE', intent: intent.intent, why: 'no target — executor asks' };
  }

  return { verdict: 'WRITE', intent: intent.intent, why: 'matched write intent' };
}

// ── The bench ────────────────────────────────────────────────────────────────
// [input, expectedVerdict, expectedIntent|null, note]

const BUCKET_A = [ // in-scope commands — these SHOULD write
  ['give charlotte 5 rtc', 'WRITE', 'ADD_RTC'],
  ['award noah 10 rtc for great work', 'WRITE', 'ADD_RTC'],
  ['give eli 3 gold', 'WRITE', 'ADD_RTC'],
  ['+5 rtc for mia', 'WRITE', 'ADD_RTC'],
  ['dock eli 3 rtc', 'WRITE', 'SUBTRACT_RTC'],
  ['take 5 rtc from mia', 'WRITE', 'SUBTRACT_RTC'],
  ['remove 4 rtc from noah', 'WRITE', 'SUBTRACT_RTC'],
  ['fine charlotte 2 rtc for her phone', 'WRITE', 'SUBTRACT_RTC'],
  ['give 5 rtc from charlotte to noah', 'WRITE', 'TRANSFER_RTC'],
  ['mark charlotte present in math', 'WRITE', 'MARK_ATTENDANCE'],
  ['mark eli absent in robotics yesterday', 'WRITE', 'MARK_ATTENDANCE'],
  ['mark mia tardy in math', 'WRITE', 'MARK_ATTENDANCE'],
  ['add olivia to math', 'WRITE', 'ENROLL_STUDENT'],
  ['enroll lucas in robotics', 'WRITE', 'ENROLL_STUDENT'],
  ['remove noah from robotics', 'WRITE', 'UNENROLL_STUDENT'],
  ['unenroll mason from math', 'WRITE', 'UNENROLL_STUDENT'],
  ['note for eli: forgot his homework again', 'WRITE', 'ADD_NOTE'],
  ['add a note for charlotte: great participation today', 'WRITE', 'ADD_NOTE'],
  ["set charlotte's grade in math to 92", 'WRITE', 'SET_GRADE'],
  ['create a class called Advanced Physics', 'WRITE', 'CREATE_CLASS'],
  ['move olivia from math to robotics', 'WRITE', 'MOVE_STUDENT'],
  ['give the whole math class 2 rtc', 'WRITE', null],  // GROUP_RTC or ADD_RTC — either writes
];

const BUCKET_B = [ // reads and out-of-scope — must not write
  ['how much rtc does charlotte have', 'SAFE', null],
  ["what are noah's grades", 'SAFE', null],
  ['show me the roster for math', 'SAFE', null],
  ["who's been absent in robotics this month", 'SAFE', null],
  ['list all active students', 'SAFE', null],
  ['show me the top 10 students', 'SAFE', null],
  ["what's charlotte's attendance in math", 'SAFE', null],
  ['anything i should know', 'SAFE', null],
  ['what classes is eli in', 'SAFE', null],
  ['compare charlotte and noah', 'SAFE', null],
  ['show me the shop', 'SAFE', null],
  ['what privileges does mia have', 'SAFE', null],
  ["what homework does eli have coming up", 'SAFE', null],
  ['how is the math class doing', 'SAFE', null],
  ['show me notes about charlotte from last month', 'SAFE', null],
  ['hello', 'SAFE', null],
  ['thanks riven', 'SAFE', null],
  ['what can you do', 'SAFE', null],
  ['how much rtc did charlotte have last week', 'SAFE', null],
  ["what's noah's contact info", 'SAFE', null],
];

const BUCKET_C = [ // ADVERSARIAL: looks like a command, is not one
  // — hypothetical / deliberative —
  ['should i give charlotte 5 rtc for this', 'SAFE', null, 'hypothetical'],
  ['would it be fair to give noah 10 rtc', 'SAFE', null, 'hypothetical'],
  ['wondering whether to dock eli 3 rtc', 'SAFE', null, 'hypothetical'],
  ['not sure if i should mark eli absent in math', 'SAFE', null, 'hypothetical'],
  ['thinking about removing noah from robotics', 'SAFE', null, 'hypothetical'],
  ['debating whether to give mia 5 rtc', 'SAFE', null, 'hypothetical'],

  // — past tense / already happened / reported —
  ['i already gave charlotte 5 rtc yesterday', 'SAFE', null, 'past tense'],
  ['did i mark eli present in math', 'SAFE', null, 'past tense question'],
  ['have i given noah his 5 rtc yet', 'SAFE', null, 'past tense question'],
  ['charlotte says i gave her 5 rtc', 'SAFE', null, 'reported speech'],
  ['i think someone already enrolled olivia in math', 'SAFE', null, 'reported'],
  ['was eli marked absent in robotics', 'SAFE', null, 'past tense question'],

  // — negated —
  ["don't give charlotte any rtc", 'SAFE', null, 'negated'],
  ['do not mark eli absent', 'SAFE', null, 'negated'],
  ['no need to award noah rtc today', 'SAFE', null, 'negated'],
  ["i'm not going to dock mia 3 rtc", 'SAFE', null, 'negated'],

  // — command text quoted INSIDE note content —
  ['note for eli: i told him i would give him 5 rtc if he finishes', 'WRITE', 'ADD_NOTE', 'command inside note'],
  ['note for charlotte: asked to be marked present next time', 'WRITE', 'ADD_NOTE', 'command inside note'],
  ['note for noah: wants me to remove him from robotics', 'WRITE', 'ADD_NOTE', 'command inside note'],

  // — prose ABOUT the mechanism —
  ['the policy says teachers can give 5 rtc for participation', 'SAFE', null, 'prose about mechanism'],
  ['explain how awarding rtc works', 'SAFE', null, 'prose about mechanism'],
  ['what happens if i delete a class', 'SAFE', null, 'prose about mechanism'],
  ['how do i mark a student absent', 'SAFE', null, 'how-to question'],
  ['remind me how transfers work', 'SAFE', null, 'how-to question'],
  ['is 5 rtc too much for finishing homework', 'SAFE', null, 'prose about amount'],

  // — polite / interrogative command forms (the isQuestion guard) —
  ['can i give charlotte 5 rtc', 'SAFE', null, 'interrogative'],
  ['could you dock eli 3 rtc', 'SAFE', null, 'interrogative'],

  // — conditional —
  ['if eli finishes his work give him 5 rtc', 'SAFE', null, 'conditional'],
  ['give charlotte 5 rtc once she turns it in', 'SAFE', null, 'conditional'],

  // — no resolvable target —
  ['give them 5 rtc', 'SAFE', null, 'no referent'],
  ['mark him absent', 'SAFE', null, 'no referent'],
  ['remove the student from the class', 'SAFE', null, 'placeholder target'],

  // — info questions that name a mutation verb —
  ["what did charlotte get on her last test", 'SAFE', null, 'info + verb'],
  ["give me eli's attendance in math over the last 5 weeks", 'SAFE', null, 'give = show'],
  ['show me who i marked absent yesterday', 'SAFE', null, 'info + verb'],
  ['pull up the grades i set for math', 'SAFE', null, 'info + verb'],
];

// ── Runner ───────────────────────────────────────────────────────────────────
const buckets = [['A in-scope commands', BUCKET_A], ['B reads / out-of-scope', BUCKET_B], ['C ADVERSARIAL look-alikes', BUCKET_C]];

let truePos = 0, falsePos = 0, trueNeg = 0, falseNeg = 0;
const falsePositives = [], falseNegatives = [], wrongWrite = [];

for (const [label, items] of buckets) {
  console.log(`\n== ${label} (${items.length}) ==`);
  for (const [input, expectVerdict, expectIntent, note] of items) {
    let got;
    try { got = decide(input); }
    catch (e) { got = { verdict: 'ERROR', intent: 'ERROR:' + e.message, why: 'threw' }; }

    const verdictOk = got.verdict === expectVerdict;
    const intentOk = !expectIntent || got.intent === expectIntent;
    const ok = verdictOk && intentOk;

    if (expectVerdict === 'WRITE' && got.verdict === 'WRITE') {
      if (intentOk) truePos++; else { truePos++; wrongWrite.push([input, expectIntent, got.intent]); }
    } else if (expectVerdict === 'SAFE' && got.verdict === 'WRITE') {
      falsePos++; falsePositives.push([input, got.intent, note || '']);
    } else if (expectVerdict === 'WRITE' && got.verdict !== 'WRITE') {
      falseNeg++; falseNegatives.push([input, expectIntent, got.intent + ' (' + got.why + ')']);
    } else {
      trueNeg++;
    }

    const mark = ok ? ' ok ' : (got.verdict === 'WRITE' && expectVerdict === 'SAFE' ? 'FIRE' : 'miss');
    const tag = note ? `  [${note}]` : '';
    console.log(`  ${mark} ${JSON.stringify(input).padEnd(62)} -> ${got.verdict}/${got.intent}${tag}`);
  }
}

const classifiedWrite = truePos + falsePos;
const precision = classifiedWrite ? truePos / classifiedWrite : 1;
const recall = (truePos + falseNeg) ? truePos / (truePos + falseNeg) : 1;

console.log('\n' + '─'.repeat(72));
console.log('CONFUSION MATRIX (write vs safe)');
console.log(`  true  write : ${truePos}`);
console.log(`  FALSE write : ${falsePos}   <-- the number that matters`);
console.log(`  true  safe  : ${trueNeg}`);
console.log(`  missed write: ${falseNeg}`);
console.log(`\n  WRITE-PRECISION : ${(precision * 100).toFixed(1)}%  (target 100%)`);
console.log(`  write-recall    : ${(recall * 100).toFixed(1)}%  (informational, not gated)`);

if (falsePositives.length) {
  console.log('\nFALSE POSITIVES — Riven would have written on these:');
  for (const [input, intent, note] of falsePositives) {
    console.log(`  ${DESTRUCTIVE.has(intent) ? '!! ' : '   '}${JSON.stringify(input)}`);
    console.log(`       fired: ${intent}${DESTRUCTIVE.has(intent) ? '   ** DESTRUCTIVE **' : ''}${note ? '   [' + note + ']' : ''}`);
  }
}
if (wrongWrite.length) {
  console.log('\nWRITE FIRED, WRONG INTENT (still a write, but not the one asked for):');
  for (const [input, want, got] of wrongWrite) console.log(`  ${JSON.stringify(input)}  want ${want}, got ${got}`);
}
if (falseNegatives.length) {
  console.log('\nMISSED WRITES (safe failure — costs one rephrase):');
  for (const [input, want, got] of falseNegatives) console.log(`  ${JSON.stringify(input)}  want ${want}, got ${got}`);
}

const pass = falsePos === 0 && wrongWrite.length === 0;
console.log('\n' + (pass
  ? 'PASS — write-precision is 1.0 on the adversarial stream.'
  : `FAIL — ${falsePos} false positive(s), ${wrongWrite.length} misrouted write(s). Fix by making the matcher ABSTAIN more (negative-cue guards, tighter anchors); never by loosening a read.`));
process.exit(pass ? 0 : 1);
