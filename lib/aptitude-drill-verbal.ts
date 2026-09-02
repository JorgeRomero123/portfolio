/**
 * Verbal and basic-skills questions for the aptitude drill.
 *
 * Criteria ships more than one test. The UCAT is language-neutral and has no
 * verbal section; the CCAT and the Basic Skills Test both do, and lean on
 * English vocabulary, analogies and spelling. Which one an employer sends is
 * not visible until the platform's own practice test, so the drill supports
 * both and the mode is chosen on the start screen.
 *
 * Unlike the numerical and spatial generators, these cannot be synthesised from
 * arithmetic — vocabulary is content, not computation. So the word data is
 * curated below and the generators randomise WHICH items appear and which
 * distractors accompany them. That still gives a large question space (a few
 * hundred thousand distinct option sets) without ever emitting a word pair that
 * is subtly wrong, which is the failure mode of generating vocabulary by rule.
 *
 * Distractor discipline is the same as everywhere else in this drill: for an
 * antonym, one option is a SYNONYM of the prompt word, because that is the trap
 * these tests actually plant and the one that catches a hurried reader.
 */

import {
  assemble, pick, pickDistinct, int, text,
  type Generator, type Question, type Rng,
} from './aptitude-drill';

// ================================================================== antonyms

/** word, its opposite, and a synonym of the word to serve as the planted trap. */
const ANTONYMS: readonly [string, string, string][] = [
  ['FAST', 'SLOW', 'RAPID'],
  ['SCARCE', 'PLENTIFUL', 'RARE'],
  ['CANDID', 'GUARDED', 'FRANK'],
  ['TRIVIAL', 'CRUCIAL', 'MINOR'],
  ['LENIENT', 'STRICT', 'TOLERANT'],
  ['OBSCURE', 'OBVIOUS', 'VAGUE'],
  ['DIMINISH', 'INCREASE', 'REDUCE'],
  ['HOSTILE', 'FRIENDLY', 'AGGRESSIVE'],
  ['PERMANENT', 'TEMPORARY', 'LASTING'],
  ['ABUNDANT', 'SPARSE', 'AMPLE'],
  ['CONCEAL', 'REVEAL', 'HIDE'],
  ['RELUCTANT', 'EAGER', 'HESITANT'],
  ['PROSPER', 'FAIL', 'THRIVE'],
  ['RIGID', 'FLEXIBLE', 'STIFF'],
  ['NOVICE', 'EXPERT', 'BEGINNER'],
  ['DEFICIT', 'SURPLUS', 'SHORTAGE'],
  ['VOLATILE', 'STABLE', 'ERRATIC'],
  ['COMMEND', 'CRITICISE', 'PRAISE'],
  ['ARROGANT', 'HUMBLE', 'CONCEITED'],
  ['EXPAND', 'CONTRACT', 'ENLARGE'],
  ['GENUINE', 'FAKE', 'AUTHENTIC'],
  ['TEDIOUS', 'EXCITING', 'DULL'],
  ['ACCELERATE', 'DECELERATE', 'HASTEN'],
  ['FLAWED', 'PERFECT', 'DEFECTIVE'],
  ['SUMMIT', 'BASE', 'PEAK'],
  ['DEPART', 'ARRIVE', 'LEAVE'],
  ['COMPLEX', 'SIMPLE', 'COMPLICATED'],
  ['GENEROUS', 'STINGY', 'CHARITABLE'],
  ['TRANQUIL', 'AGITATED', 'CALM'],
  ['VITAL', 'UNIMPORTANT', 'ESSENTIAL'],
  ['DENY', 'ADMIT', 'REFUSE'],
  ['FERTILE', 'BARREN', 'PRODUCTIVE'],
  ['PROLONG', 'SHORTEN', 'EXTEND'],
  ['OPAQUE', 'TRANSPARENT', 'CLOUDY'],
  ['ASCEND', 'DESCEND', 'CLIMB'],
];

/** Unrelated filler, so an option list is not all near-misses. */
const FILLER = [
  'LARGE', 'COLD', 'AFRAID', 'HARD', 'QUIET', 'ROUND', 'HEAVY', 'BRIGHT',
  'NARROW', 'SUDDEN', 'PLEASANT', 'CURIOUS', 'ANCIENT', 'HOLLOW', 'STEADY',
  'PATIENT', 'BRAVE', 'CLEVER', 'GENTLE', 'SOLID',
];

const antonym: Generator = (rng) => {
  const [word, opposite, synonym] = pick(rng, ANTONYMS);
  const filler = pickDistinct(rng, FILLER.filter((f) => f !== opposite && f !== synonym), 3);

  const { options, answer } = assemble(rng, 5, text(opposite), [
    text(synonym),
    ...filler.map((f) => text(f)),
  ]);

  return {
    category: 'Verbal',
    prompt: `Choose the word that is most nearly OPPOSITE in meaning to: ${word}`,
    options, answer,
    explanation:
      `${word} means roughly the same as ${synonym.toLowerCase()}, so its opposite is ` +
      `${opposite.toLowerCase()}. ${synonym} is the planted trap: under time pressure people ` +
      `grab the word that FEELS related to the prompt, and a synonym feels more related than ` +
      `an antonym does. Read the instruction word — "opposite" — before you read the options.`,
  };
};

// ================================================================= analogies

/**
 * Analogies are stored as a relation plus pairs that share it. The question
 * shows one pair and the options are other pairs; only one carries the same
 * relation, and the distractors deliberately carry NEARBY relations.
 */
interface Relation {
  name: string;
  /** How to phrase the relationship in the explanation. */
  gloss: string;
  pairs: readonly [string, string][];
}

const RELATIONS: readonly Relation[] = [
  {
    name: 'part-to-whole', gloss: 'the first is a part of the second',
    pairs: [['WHEEL', 'CAR'], ['PAGE', 'BOOK'], ['PETAL', 'FLOWER'], ['KEY', 'KEYBOARD'],
            ['BRANCH', 'TREE'], ['ROOM', 'HOUSE'], ['STRING', 'GUITAR']],
  },
  {
    name: 'tool-to-user', gloss: 'the second uses the first to do their work',
    pairs: [['BRUSH', 'PAINTER'], ['SCALPEL', 'SURGEON'], ['HAMMER', 'CARPENTER'],
            ['WHISTLE', 'REFEREE'], ['CAMERA', 'PHOTOGRAPHER'], ['COMPASS', 'NAVIGATOR']],
  },
  {
    name: 'category', gloss: 'the first is a kind of the second',
    pairs: [['SPARROW', 'BIRD'], ['OAK', 'TREE'], ['COPPER', 'METAL'], ['TRUMPET', 'INSTRUMENT'],
            ['NOVEL', 'BOOK'], ['LIZARD', 'REPTILE'], ['TULIP', 'FLOWER']],
  },
  {
    name: 'degree', gloss: 'the second is a much stronger version of the first',
    pairs: [['WARM', 'SCORCHING'], ['DAMP', 'SOAKED'], ['LIKE', 'ADORE'], ['TIRED', 'EXHAUSTED'],
            ['LARGE', 'ENORMOUS'], ['SAD', 'DEVASTATED'], ['ANNOY', 'ENRAGE']],
  },
  {
    name: 'opposite', gloss: 'the two are opposites',
    pairs: [['ANCIENT', 'MODERN'], ['ARRIVE', 'DEPART'], ['SCARCE', 'ABUNDANT'],
            ['ASCEND', 'DESCEND'], ['GUILTY', 'INNOCENT'], ['EXPAND', 'CONTRACT']],
  },
  {
    name: 'worker-to-workplace', gloss: 'the first works in the second',
    pairs: [['CHEF', 'KITCHEN'], ['TEACHER', 'CLASSROOM'], ['JUDGE', 'COURTROOM'],
            ['PILOT', 'COCKPIT'], ['ACTOR', 'THEATRE'], ['FARMER', 'FIELD']],
  },
  {
    name: 'function', gloss: 'the first exists to do the second',
    pairs: [['LAMP', 'ILLUMINATE'], ['FILTER', 'PURIFY'], ['LOCK', 'SECURE'],
            ['ENGINE', 'PROPEL'], ['SHIELD', 'PROTECT'], ['VALVE', 'REGULATE']],
  },
];

const analogy: Generator = (rng) => {
  const relation = pick(rng, RELATIONS);
  const [stem, correct] = pickDistinct(rng, relation.pairs, 2);

  // Distractors are pairs from OTHER relations — each internally sensible,
  // which is what makes the question about the relationship rather than the words.
  const others = RELATIONS.filter((r) => r.name !== relation.name);
  const wrongPairs = pickDistinct(rng, others, 4).map((r) => pick(rng, r.pairs));

  const fmt = (p: readonly [string, string]) => `${p[0]} is to ${p[1]}`;
  const { options, answer } = assemble(rng, 5, text(fmt(correct)),
    wrongPairs.map((p) => text(fmt(p))));

  return {
    category: 'Verbal',
    prompt: `${stem[0]} is to ${stem[1]} as:`,
    options, answer,
    explanation:
      `The relationship is ${relation.name}: ${relation.gloss}. ${stem[0]} → ${stem[1]} and ` +
      `${correct[0]} → ${correct[1]} both fit it. Name the relationship in words before you ` +
      `look at the options — every distractor is a perfectly sensible pair, so the only thing ` +
      `separating them is whether the relationship matches.`,
  };
};

// ======================================================= sentence completion

interface Sentence {
  /** `___` marks the blank. */
  text: string;
  answer: string;
  /** Wrong words that are the right register but the wrong meaning or part of speech. */
  wrong: readonly string[];
}

const SENTENCES: readonly Sentence[] = [
  { text: 'Maria wanted to ___ her most important client with the new proposal.',
    answer: 'impress', wrong: ['innocent', 'patient', 'brave', 'laugh'] },
  { text: 'The manager asked the team to ___ the report before Friday.',
    answer: 'complete', wrong: ['completion', 'complex', 'compete', 'compliment'] },
  { text: 'Heavy rain forced the organisers to ___ the outdoor ceremony.',
    answer: 'postpone', wrong: ['propose', 'compose', 'expose', 'dispose'] },
  { text: 'The witness gave a ___ account of what happened that evening.',
    answer: 'detailed', wrong: ['detail', 'detain', 'derailed', 'detected'] },
  { text: 'Because the evidence was ___, the committee delayed its decision.',
    answer: 'inconclusive', wrong: ['inconsiderate', 'inconvenient', 'incompetent', 'inconsistent'] },
  { text: 'The new policy will ___ every department, not just engineering.',
    answer: 'affect', wrong: ['effect', 'infect', 'defect', 'perfect'] },
  { text: 'She was praised for her ___ handling of a difficult negotiation.',
    answer: 'skilful', wrong: ['skill', 'skilled', 'unskilled', 'skimming'] },
  { text: 'The company had to ___ its forecast after a weak quarter.',
    answer: 'revise', wrong: ['revive', 'devise', 'reverse', 'review'] },
  { text: 'Please ___ from using mobile phones during the presentation.',
    answer: 'refrain', wrong: ['restrain', 'remain', 'retain', 'refresh'] },
  { text: 'His explanation was so ___ that nobody had any further questions.',
    answer: 'thorough', wrong: ['through', 'though', 'throughout', 'thoughtful'] },
  { text: 'The two accounts of the incident were completely ___.',
    answer: 'contradictory', wrong: ['contributory', 'controversial', 'contractual', 'contemporary'] },
  { text: 'A good manager will ___ responsibility rather than hoard it.',
    answer: 'delegate', wrong: ['deliberate', 'dedicate', 'designate', 'denigrate'] },
  { text: 'The results were ___ with what the earlier study had found.',
    answer: 'consistent', wrong: ['persistent', 'insistent', 'resistant', 'constant'] },
  { text: 'They offered a ___ discount to customers who renewed early.',
    answer: 'substantial', wrong: ['substantive', 'subsequent', 'sustainable', 'substituted'] },
  { text: 'The instructions were ___, so half the team did the wrong thing.',
    answer: 'ambiguous', wrong: ['ambitious', 'amphibious', 'anonymous', 'autonomous'] },
  { text: 'It is important to ___ between correlation and causation.',
    answer: 'distinguish', wrong: ['extinguish', 'distribute', 'distract', 'diminish'] },
  { text: 'The building was ___ after the earthquake made it unsafe.',
    answer: 'evacuated', wrong: ['evaluated', 'elevated', 'excavated', 'escalated'] },
  { text: 'Her argument was ___ by three independent sources.',
    answer: 'corroborated', wrong: ['collaborated', 'corrugated', 'coordinated', 'contaminated'] },
];

const sentenceCompletion: Generator = (rng) => {
  const s = pick(rng, SENTENCES);
  const wrong = pickDistinct(rng, s.wrong, Math.min(4, s.wrong.length));
  const { options, answer } = assemble(rng, 5, text(s.answer), wrong.map((w) => text(w)));

  return {
    category: 'Verbal',
    prompt: `Choose the word that best completes the sentence:\n${s.text}`,
    options, answer,
    explanation:
      `"${s.answer}" is the only option that fits both the meaning and the grammar. ` +
      `The distractors are chosen to look and sound like the answer — read the whole sentence ` +
      `with your choice substituted in before committing, because near-homophones are exactly ` +
      `what a fast reader mistakes for the right word.`,
  };
};

// ================================================================== spelling

/** [correctly spelled, plausibly misspelled] — curated, never generated by rule. */
const SPELLING: readonly [string, string][] = [
  ['sleep', 'sleap'], ['receive', 'recieve'], ['separate', 'seperate'],
  ['definitely', 'definately'], ['occurred', 'occured'], ['necessary', 'neccessary'],
  ['accommodate', 'acommodate'], ['embarrass', 'embarass'], ['maintenance', 'maintainance'],
  ['recommend', 'recomend'], ['argument', 'arguement'], ['calendar', 'calender'],
  ['category', 'catagory'], ['cemetery', 'cemetary'], ['conscience', 'concience'],
  ['existence', 'existance'], ['foreign', 'foriegn'], ['grateful', 'greatful'],
  ['harass', 'harrass'], ['immediately', 'immediatly'], ['independent', 'independant'],
  ['knowledge', 'knowlege'], ['library', 'libary'], ['millennium', 'millenium'],
  ['noticeable', 'noticable'], ['occasion', 'ocassion'], ['perseverance', 'perseverence'],
  ['possession', 'posession'], ['privilege', 'priviledge'], ['questionnaire', 'questionaire'],
  ['restaurant', 'restaraunt'], ['rhythm', 'rythm'], ['schedule', 'schedual'],
  ['successful', 'succesful'], ['tomorrow', 'tommorow'], ['until', 'untill'],
  ['vacuum', 'vaccum'], ['weird', 'wierd'], ['acknowledge', 'aknowledge'],
  ['believe', 'beleive'],
];

const spelling: Generator = (rng) => {
  const [correctWord, misspelled] = pick(rng, SPELLING);
  const others = pickDistinct(
    rng,
    SPELLING.filter(([w]) => w !== correctWord),
    4,
  ).map(([w]) => w);

  const { options, answer } = assemble(rng, 5, text(misspelled), others.map((w) => text(w)));

  return {
    category: 'Verbal',
    prompt: 'Which of the following words is spelled INCORRECTLY?',
    options, answer,
    explanation:
      `"${misspelled}" is wrong; the correct spelling is "${correctWord}". ` +
      `The other four are all spelled correctly. Sound the word out syllable by syllable — ` +
      `most planted misspellings are a doubled letter dropped, an extra letter added, or ` +
      `two vowels swapped.`,
  };
};

// ====================================================== basic-skills numeracy

/** Comparing decimals — trivial arithmetic, easy to misread at speed. */
const decimalCompare: Generator = (rng) => {
  const wantSmallest = rng() < 0.5;
  const values = new Set<string>();
  while (values.size < 5) {
    const whole = int(rng, 1, 4);
    const frac = int(rng, 0, 999).toString().padStart(3, '0').replace(/0+$/, '') || '5';
    values.add(`${whole}.${frac}`);
  }
  const list = [...values];
  const sorted = list.slice().sort((a, b) => Number(a) - Number(b));
  const target = wantSmallest ? sorted[0] : sorted[sorted.length - 1];

  const { options, answer } = assemble(rng, 5, text(target, true),
    list.filter((v) => v !== target).map((v) => text(v, true)));

  return {
    category: 'Verbal',
    prompt: `Which of the following is the ${wantSmallest ? 'SMALLEST' : 'LARGEST'} value?`,
    options, answer,
    explanation:
      `${target} is the ${wantSmallest ? 'smallest' : 'largest'}. Compare the whole-number part ` +
      `first and only look at the decimals if it ties — most errors here come from reading the ` +
      `digits after the point as if they were a whole number, so that 2.665 looks bigger than 3.66.`,
  };
};

const FIRST_NAMES = ['Xavier', 'Henry', 'Sarah', 'Wendy', 'Bruce', 'Marcus', 'Elena', 'Colin',
  'Rachel', 'Damien', 'Priya', 'Gordon', 'Alicia', 'Trevor', 'Nadia'];
const LAST_NAMES = ['Smyth', 'Wyatt', 'Collins', 'Hall', 'Raynelds', 'Whitfield', 'Barnes',
  'Kowalski', 'Ferreira', 'Nakamura', 'Osborne', 'Larkin', 'Vaughn', 'Ashby'];

/** "How many of these five pairs match?" — the format the Criteria practice test uses. */
const countMatchingPairs: Generator = (rng) => {
  const matches = int(rng, 1, 4);
  const rows: [string, string][] = [];

  for (let i = 0; i < 5; i++) {
    const name = `${pick(rng, FIRST_NAMES)} ${pick(rng, LAST_NAMES)}`;
    if (i < matches) {
      rows.push([name, name]);
    } else {
      // One-character difference: a vowel swap or a dropped double letter.
      const idx = [...name].findIndex((c, j) => j > 2 && /[aeiou]/i.test(c));
      const swapped = idx < 0
        ? name.slice(0, -1)
        : name.slice(0, idx) + (name[idx].toLowerCase() === 'a' ? 'e' : 'a') + name.slice(idx + 1);
      rows.push([name, swapped]);
    }
  }

  const shown = rows.slice().sort(() => rng() - 0.5);
  const listing = shown.map(([l, r]) => `${l.padEnd(22)}${r}`).join('\n');

  const { options, answer } = assemble(rng, 5, text(String(matches), true),
    [0, 1, 2, 3, 4, 5].filter((n) => n !== matches).map((n) => text(String(n), true)));

  return {
    category: 'Verbal',
    prompt: 'How many of these five pairs are EXACTLY the same?',
    monoPrompt: listing,
    options, answer,
    explanation:
      `${matches} of the five match exactly. Each mismatch differs by a single letter, usually a ` +
      `vowel. Read the pairs right-to-left, or cover one column and compare in chunks — sweeping ` +
      `left to right is how single-letter differences get read straight past.`,
  };
};

// =================================================================== exports

export const VERBAL: Generator[] = [
  antonym, antonym, analogy, analogy, sentenceCompletion, sentenceCompletion,
  spelling, decimalCompare, countMatchingPairs,
];

export function generateVerbal(rng: Rng, offset: number): Question {
  return VERBAL[offset % VERBAL.length](rng);
}
