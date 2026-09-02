/**
 * Cognitive aptitude drill — question generation.
 *
 * Practice for the timed cognitive tests employers buy from Criteria, Revelian
 * and friends: 40 questions in 20 minutes, no verbal section, five question
 * types mixed in random order.
 *
 * Everything here is a PURE function of a seeded RNG. Nothing touches the DOM,
 * nothing reads the clock. Two reasons that matters:
 *
 *  1. A run is reproducible from its seed, so a question that looks wrong can
 *     be pulled back up and inspected instead of being lost on reload.
 *  2. `scripts/check-aptitude-drill.ts` can generate thousands of questions and
 *     assert the invariants. With a hand-written question bank you verify the
 *     answers by reading them; with a generator, correctness is a property of
 *     the code, and the only way to know is to run it a few thousand times.
 *
 * The rule every generator follows: **distractors are named errors.** A wrong
 * option is never a random number near the answer — it is the value you get by
 * subtracting instead of dividing, by measuring against the new total instead
 * of the original, by applying both halves of an alternating rule at once.
 * That is what makes the review screen able to say *why* you missed it.
 */

import { generateVerbal } from './aptitude-drill-verbal';

// ---------------------------------------------------------------- primitives

export type Rng = () => number;

/** mulberry32 — small, fast, and good enough that question order looks random. */
export function makeRng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function randomSeed(): number {
  return Math.floor(Math.random() * 0xffffffff);
}

/** Integer in [lo, hi], both inclusive. */
export function int(rng: Rng, lo: number, hi: number): number {
  return lo + Math.floor(rng() * (hi - lo + 1));
}

export function pick<T>(rng: Rng, xs: readonly T[]): T {
  return xs[Math.floor(rng() * xs.length)];
}

export function shuffle<T>(rng: Rng, xs: readonly T[]): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Pick `n` distinct members. Throws rather than looping forever if asked for too many. */
export function pickDistinct<T>(rng: Rng, xs: readonly T[], n: number): T[] {
  if (n > xs.length) throw new Error(`pickDistinct: asked for ${n} of ${xs.length}`);
  return shuffle(rng, xs).slice(0, n);
}

// -------------------------------------------------------------------- shapes

export type Corner = 'tl' | 'tr' | 'br' | 'bl' | 'c';
export type BasicShape = 'circle' | 'square' | 'pentagon' | 'triangle';
export type SizedShape = 'circle' | 'square' | 'triangle';
export type EllVariant = 'orig' | 'mirror' | 'r180' | 'r90';

/**
 * A figure is described, never drawn, in this module. The renderer in
 * `components/tools/AptitudeDrill.tsx` turns a spec into SVG — which is also
 * what lets the results export say "arrow 90deg" instead of "(figure)".
 */
export type FigureSpec =
  | { k: 'arrow'; deg: number }
  | { k: 'dotSquare'; pos: Corner }
  | { k: 'poly'; n: number }
  | { k: 'dots'; n: number }
  | { k: 'shape'; s: BasicShape }
  | { k: 'ell'; t: EllVariant }
  | { k: 'sized'; s: SizedShape; big: boolean }
  | { k: 'grid'; r: number; c: number };

/** A slot in a stem sequence: a figure, the unknown, or an analogy separator. */
export type Slot = FigureSpec | { k: 'q' } | { k: 'sep' };

/** Human-readable name for a figure, used in the results export and review. */
export function describeFigure(f: FigureSpec): string {
  switch (f.k) {
    case 'arrow': return `arrow ${f.deg}deg`;
    case 'dotSquare': return `dot ${f.pos}`;
    case 'poly': return `${f.n}-sided`;
    case 'dots': return `${f.n} dots`;
    case 'shape': return f.s;
    case 'ell': return `L-${f.t}`;
    case 'sized': return `${f.big ? 'large' : 'small'} ${f.s}`;
    case 'grid': return `cell r${f.r}c${f.c}`;
  }
}

// ----------------------------------------------------------------- questions

export type Category = 'Numerical' | 'Series' | 'Logic' | 'Spatial' | 'Detail' | 'Verbal';

export const CATEGORIES: readonly Category[] = [
  'Numerical', 'Series', 'Logic', 'Spatial', 'Detail', 'Verbal',
] as const;

export type Option =
  | { kind: 'text'; text: string; mono?: boolean }
  | { kind: 'figure'; fig: FigureSpec };

export interface Question {
  category: Category;
  /** The question itself, in prose. */
  prompt: string;
  /** Series terms, set monospaced under the prompt. */
  monoPrompt?: string;
  /** Stem figures for spatial items, ending in `{k:'q'}` where relevant. */
  figures?: Slot[];
  options: Option[];
  /** Index into `options`. */
  answer: number;
  /** Why the answer is the answer, and which error the distractors encode. */
  explanation: string;
}

export function optionLabel(o: Option): string {
  return o.kind === 'figure' ? describeFigure(o.fig) : o.text;
}

export const text = (t: string, mono = false): Option => ({ kind: 'text', text: t, mono });
const figure = (fig: FigureSpec): Option => ({ kind: 'figure', fig });

/**
 * Assemble the option list.
 *
 * Takes the answer and the *named* wrong values, drops any distractor that
 * collides with the answer or with another distractor, then tops up to `count`
 * with near-miss padding so a short distractor list never shrinks the question.
 * Padding is a fallback, not the plan — every generator should supply enough
 * real errors that padding rarely fires.
 */
export function assemble(
  rng: Rng,
  count: number,
  answer: Option,
  distractors: Option[],
  pad?: (i: number) => Option | null,
): { options: Option[]; answer: number } {
  const seen = new Set<string>([optionLabel(answer)]);
  const kept: Option[] = [];

  for (const d of distractors) {
    if (kept.length >= count - 1) break;
    const key = optionLabel(d);
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(d);
  }

  for (let i = 0; pad && kept.length < count - 1 && i < 60; i++) {
    const p = pad(i);
    if (!p) continue;
    const key = optionLabel(p);
    if (seen.has(key)) continue;
    seen.add(key);
    kept.push(p);
  }

  const options = shuffle(rng, [answer, ...kept]);
  return { options, answer: options.indexOf(answer) };
}

/** Numeric padding: values stepping away from the answer, formatted like it. */
function numericPad(value: number, fmt: (n: number) => string, step: number) {
  const deltas = [step, -step, 2 * step, -2 * step, 3 * step, -3 * step, 4 * step];
  return (i: number): Option | null => {
    const d = deltas[i % deltas.length];
    const v = value + d;
    return v > 0 ? text(fmt(v), true) : null;
  };
}

const plain = (n: number) => String(n);
const money = (n: number) => `$${n}`;
const pct = (n: number) => `${n}%`;

// =============================================================== NUMERICAL

/** Every question generator has the same shape. */
export type Generator = (rng: Rng) => Question;
type NumericalTemplate = Generator;

/** $X after a d% discount — what was the original? Reverse by dividing. */
const discountReversal: NumericalTemplate = (rng) => {
  const original = 20 * int(rng, 2, 15);
  const d = pick(rng, [10, 20, 25, 40, 50]);
  const final = (original * (100 - d)) / 100;

  const addBack = Math.round(final * (1 + d / 100));
  const { options, answer } = assemble(rng, 5, text(money(original), true), [
    text(money(addBack), true),
    text(money(final + d), true),
    text(money(Math.round(final * (1 - d / 100))), true),
  ], numericPad(original, money, 10));

  return {
    category: 'Numerical',
    prompt: `An item sells for $${final} after a ${d}% discount. What was the price before the discount?`,
    options, answer,
    explanation:
      `$${final} is ${100 - d}% of the original, so divide rather than add back: ` +
      `${final} ÷ ${(100 - d) / 100} = $${original}. Adding ${d}% onto $${final} gives $${addBack}, ` +
      `which is the trap — a percentage off and the same percentage on are not inverse operations.`,
  };
};

/** Workers and days. The inverse-proportion item; distractor is linear thinking. */
const workerDays: NumericalTemplate = (rng) => {
  const totalWork = pick(rng, [24, 36, 48, 60, 72, 96, 120]);
  const [w1, w2] = pickDistinct(
    rng,
    [2, 3, 4, 6, 8, 12].filter((w) => totalWork % w === 0),
    2,
  );
  const d1 = totalWork / w1;
  const d2 = totalWork / w2;

  // The classic error: treat it as additive — subtract the extra workers from the days.
  const linear = d1 - (w2 - w1);
  // The other classic: scale the same direction instead of inversely.
  const direct = Math.round((d1 * w2) / w1);

  // `linear` goes negative when the crew grows a lot (4 workers/6 days -> 12
  // workers gives 6 - 8 = -2). A negative number of days is not a tempting
  // wrong answer, it is a broken option, so drop it when it degenerates.
  const named = [linear, direct]
    .filter((v) => v > 0 && v !== d2)
    .map((v) => text(`${v} days`, true));

  const { options, answer } = assemble(rng, 5, text(`${d2} days`, true), named,
    numericPad(d2, (n) => `${n} days`, 1));

  return {
    category: 'Numerical',
    prompt:
      `${w1} workers complete a job in ${d1} days. Working at the same rate, ` +
      `how long would ${w2} workers take?`,
    options, answer,
    explanation:
      `Convert to worker-days — the total amount of work never changes: ` +
      `${w1} × ${d1} = ${totalWork}. Then share it out: ${totalWork} ÷ ${w2} = ${d2} days. ` +
      `Answering ${linear} means subtracting for the extra workers, which treats an inverse ` +
      `relationship as an additive one. Sanity check by size: the crew changed by a factor of ` +
      `${(w2 / w1).toFixed(2).replace(/\.?0+$/, '')}, so the time must change by the reciprocal.`,
  };
};

/** Percentage increase — measured against the original, never the new value. */
const percentChange: NumericalTemplate = (rng) => {
  const from = 20 * int(rng, 2, 20);
  const pctUp = pick(rng, [10, 20, 25, 50, 75]);
  const to = from * (1 + pctUp / 100);
  const againstNew = Math.round(((to - from) / to) * 100);

  const { options, answer } = assemble(rng, 5, text(pct(pctUp), true), [
    text(pct(againstNew), true),
    text(pct(Math.round(to - from)), true),
  ], numericPad(pctUp, pct, 5));

  return {
    category: 'Numerical',
    prompt: `The price of an item rose from $${from} to $${to}. What was the percentage increase?`,
    options, answer,
    explanation:
      `The rise is $${to - from}, measured against the ORIGINAL $${from}: ` +
      `${to - from} ÷ ${from} = ${pctUp}%. Dividing by the new price instead gives ${againstNew}%, ` +
      `which is the planted error — percentage change always takes the starting value as its base.`,
  };
};

/** Two-step percentage: recover the whole, then take a different slice of it. */
const twoStepPercent: NumericalTemplate = (rng) => {
  const whole = 20 * int(rng, 2, 15);
  const [p1, p2] = pickDistinct(rng, [20, 25, 40, 50, 60, 75, 80], 2);
  const known = (whole * p1) / 100;
  const want = (whole * p2) / 100;

  // Skipping the whole and scaling the known value directly by the ratio of percentages
  // happens to be correct, so the real errors here are arithmetic: neighbouring tenths.
  const tenth = whole / 10;
  const { options, answer } = assemble(rng, 5, text(plain(want), true), [
    text(plain(Math.round(want + tenth * 1.5)), true),
    text(plain(Math.round(want - tenth * 1.5)), true),
    text(plain(Math.round((known * p2) / 100)), true),
  ], numericPad(want, plain, Math.max(1, Math.round(tenth))));

  return {
    category: 'Numerical',
    prompt: `${p1}% of a number is ${known}. What is ${p2}% of that same number?`,
    options, answer,
    explanation:
      `Recover the whole first: ${known} ÷ ${p1 / 100} = ${whole}. Then ${p2}% of ${whole} = ${want}. ` +
      `Two-step percentage questions always want the whole in between, and the second step is where ` +
      `the slips happen — people get the whole right and then take the wrong slice of it.`,
  };
};

/** Constant speed — distance scales with time. */
const rateDistance: NumericalTemplate = (rng) => {
  const speed = 10 * int(rng, 4, 12);
  const t1 = int(rng, 2, 4);
  const t2 = int(rng, 5, 8);
  const d1 = speed * t1;
  const d2 = speed * t2;

  const { options, answer } = assemble(rng, 5, text(`${d2} km`, true), [
    text(`${d1 + speed} km`, true),
    text(`${Math.round(d1 * (t2 / t1) - speed)} km`, true),
  ], numericPad(d2, (n) => `${n} km`, 20));

  return {
    category: 'Numerical',
    prompt: `A train covers ${d1} km in ${t1} hours. At the same speed, how far does it travel in ${t2} hours?`,
    options, answer,
    explanation: `${d1} ÷ ${t1} = ${speed} km/h, and ${speed} × ${t2} = ${d2} km.`,
  };
};

/** x is what percent of y — the fraction you should recognise on sight. */
const percentOf: NumericalTemplate = (rng) => {
  const answerPct = pick(rng, [20, 25, 30, 40, 50, 60, 75, 80]);
  const whole = 20 * int(rng, 2, 15);
  const part = (whole * answerPct) / 100;

  const { options, answer } = assemble(rng, 5, text(pct(answerPct), true), [
    text(pct(Math.round((whole / part) * 10)), true),
    text(pct(100 - answerPct), true),
  ], numericPad(answerPct, pct, 5));

  return {
    category: 'Numerical',
    prompt: `${part} is what percent of ${whole}?`,
    options, answer,
    explanation:
      `${part} ÷ ${whole} = ${answerPct / 100}, so ${answerPct}%. Read the direction carefully — ` +
      `"what percent of ${whole}" puts ${whole} in the denominator.`,
  };
};

/** Split a total in a k:1 ratio. Asks for the smaller share, to punish skimming. */
const splitRatio: NumericalTemplate = (rng) => {
  const k = int(rng, 2, 4);
  const smaller = int(rng, 3, 15);
  const total = smaller * (k + 1);

  const { options, answer } = assemble(rng, 5, text(money(smaller), true), [
    text(money(smaller * k), true),
    text(money(Math.round(total / 2)), true),
  ], numericPad(smaller, money, 1));

  return {
    category: 'Numerical',
    prompt:
      `Two items cost $${total} in total. One costs ${k === 2 ? 'twice' : `${k} times`} ` +
      `as much as the other. What does the CHEAPER one cost?`,
    options, answer,
    explanation:
      `Let the cheaper be x: x + ${k}x = ${total}, so ${k + 1}x = ${total} and x = $${smaller}. ` +
      `$${smaller * k} is the other item — the question asks for the cheaper one.`,
  };
};

/** Probability of drawing one colour. */
const probability: NumericalTemplate = (rng) => {
  const target = pick(rng, [4, 5, 6, 8, 10]);
  const totalPct = pick(rng, [20, 25, 40, 50]);
  const total = (target * 100) / totalPct;
  if (!Number.isInteger(total)) return probability(rng);
  const rest = total - target;
  const b = int(rng, 1, rest - 1);

  const { options, answer } = assemble(rng, 5, text(pct(totalPct), true), [
    text(pct(Math.round((target / rest) * 100)), true),
    text(pct(100 - totalPct), true),
  ], numericPad(totalPct, pct, 5));

  return {
    category: 'Numerical',
    prompt:
      `A jar holds ${target} red, ${b} blue and ${rest - b} green marbles. ` +
      `What is the probability of drawing a red one at random?`,
    options, answer,
    explanation:
      `The total is ${target} + ${b} + ${rest - b} = ${total}, and red is ${target} of ${total} = ${totalPct}%. ` +
      `Dividing by the non-red count instead of the total is the usual slip.`,
  };
};

const NUMERICAL: NumericalTemplate[] = [
  discountReversal, workerDays, percentChange, twoStepPercent,
  rateDistance, percentOf, splitRatio, probability,
];

// ================================================================== SERIES

interface SeriesRule {
  terms: number[];
  next: number;
  /** Wrong values a plausible misreading produces. */
  errors: number[];
  explain: string;
}

function seriesRule(rng: Rng): SeriesRule {
  const kind = pick(rng, ['growingGap', 'geometric', 'affine', 'alternating', 'squares', 'fib', 'shrinkingGap'] as const);

  if (kind === 'growingGap') {
    const start = int(rng, 1, 6);
    const gap0 = int(rng, 2, 5);
    const grow = int(rng, 1, 3);
    const terms = [start];
    let g = gap0;
    for (let i = 0; i < 4; i++) { terms.push(terms[terms.length - 1] + g); g += grow; }
    const next = terms[terms.length - 1] + g;
    return {
      terms, next,
      errors: [terms[terms.length - 1] + g - grow, terms[terms.length - 1] + g + grow],
      explain:
        `Take the differences: ${terms.slice(1).map((t, i) => t - terms[i]).join(', ')} — each is ${grow} more ` +
        `than the last. The next gap is ${g}, so ${terms[terms.length - 1]} + ${g} = ${next}.`,
    };
  }

  if (kind === 'geometric') {
    const start = int(rng, 2, 6);
    const r = pick(rng, [2, 3]);
    const terms = [start];
    for (let i = 0; i < 3; i++) terms.push(terms[terms.length - 1] * r);
    const next = terms[terms.length - 1] * r;
    return {
      terms, next,
      errors: [terms[terms.length - 1] + terms[terms.length - 2], next + r, next - r],
      explain: `Each term is ${r === 2 ? 'double' : 'triple'} the one before it: ${terms[terms.length - 1]} × ${r} = ${next}.`,
    };
  }

  if (kind === 'affine') {
    const start = int(rng, 2, 6);
    const k = pick(rng, [1, 2, 3, -1]);
    const terms = [start];
    for (let i = 0; i < 3; i++) terms.push(terms[terms.length - 1] * 2 + k);
    const next = terms[terms.length - 1] * 2 + k;
    return {
      terms, next,
      errors: [terms[terms.length - 1] * 2, next + k, next - k],
      explain:
        `Each term is double the previous ${k >= 0 ? `plus ${k}` : `minus ${-k}`}: ` +
        `${terms[terms.length - 1]} × 2 ${k >= 0 ? '+' : '−'} ${Math.abs(k)} = ${next}. ` +
        `When terms roughly double but drift, test ×2 with a small constant.`,
    };
  }

  if (kind === 'alternating') {
    const start = int(rng, 4, 9);
    const sub = pick(rng, [2, 3, 4]);
    const terms = [start];
    for (let i = 0; i < 5; i++) {
      const prev = terms[terms.length - 1];
      terms.push(i % 2 === 0 ? prev * 2 : prev - sub);
    }
    const last = terms[terms.length - 1];
    const nextIsDouble = terms.length % 2 === 1;
    const next = nextIsDouble ? last * 2 : last - sub;
    return {
      terms, next,
      // Applying BOTH halves of the rule in one step — the error Jorge actually made.
      errors: [nextIsDouble ? last * 2 - sub : (last - sub) * 2, last + sub, last * 2],
      explain:
        `Two rules alternate: ×2, then −${sub}. The step after ${last} is ` +
        `${nextIsDouble ? `×2, giving ${next}` : `−${sub}, giving ${next}`}. ` +
        `Applying both halves at once is the usual miss — write only the NEXT operation. ` +
        `A series that lurches up and down is almost always two interleaved rules.`,
    };
  }

  if (kind === 'squares') {
    const start = int(rng, 1, 4);
    const offset = pick(rng, [0, 0, 1, -1]);
    const terms: number[] = [];
    for (let i = 0; i < 5; i++) terms.push((start + i) ** 2 + offset);
    const n = start + 5;
    const next = n ** 2 + offset;
    return {
      terms, next,
      errors: [next + 2 * n, terms[terms.length - 1] + (terms[terms.length - 1] - terms[terms.length - 2])],
      explain:
        offset === 0
          ? `Perfect squares: ${terms.map((_, i) => `${start + i}²`).join(', ')}, then ${n}² = ${next}.`
          : `Each term is a square ${offset > 0 ? 'plus' : 'minus'} ${Math.abs(offset)}: ` +
            `${n}² ${offset > 0 ? '+' : '−'} ${Math.abs(offset)} = ${next}.`,
    };
  }

  if (kind === 'fib') {
    const a = int(rng, 1, 4);
    const b = int(rng, a + 1, a + 4);
    const terms = [a, b];
    for (let i = 0; i < 4; i++) terms.push(terms[terms.length - 1] + terms[terms.length - 2]);
    const next = terms[terms.length - 1] + terms[terms.length - 2];
    return {
      terms, next,
      errors: [terms[terms.length - 1] * 2, next + terms[terms.length - 2]],
      explain: `Each term is the sum of the two before it: ${terms[terms.length - 2]} + ${terms[terms.length - 1]} = ${next}.`,
    };
  }

  // shrinkingGap
  const gap0 = int(rng, 6, 10);
  const start = int(rng, 60, 120);
  const terms = [start];
  let g = gap0;
  for (let i = 0; i < 4; i++) { terms.push(terms[terms.length - 1] - g); g -= 1; }
  const next = terms[terms.length - 1] - g;
  return {
    terms, next,
    errors: [terms[terms.length - 1] - g - 1, terms[terms.length - 1] - g + 1, terms[terms.length - 1] - gap0],
    explain:
      `The gaps shrink by one each step: ${terms.slice(1).map((t, i) => t - terms[i]).join(', ')}, ` +
      `so the next is −${g}. ${terms[terms.length - 1]} − ${g} = ${next}.`,
  };
}

function generateSeries(rng: Rng): Question {
  const rule = seriesRule(rng);
  const { options, answer } = assemble(
    rng, 5,
    text(plain(rule.next), true),
    rule.errors.filter((e) => e > 0 && Number.isFinite(e)).map((e) => text(plain(e), true)),
    numericPad(rule.next, plain, Math.max(1, Math.round(Math.abs(rule.next) * 0.05) || 1)),
  );

  return {
    category: 'Series',
    prompt: 'What number comes next?',
    monoPrompt: rule.terms.join(' ') + ' ?',
    options, answer,
    explanation: rule.explain,
  };
}

// =================================================================== LOGIC

const NONSENSE = ['Bloops', 'Razzies', 'Lazzies', 'Wugs', 'Fims', 'Trell', 'Dorbs', 'Quibs'] as const;
const PEOPLE = ['Ana', 'Ben', 'Carla', 'Dan', 'Elena', 'Farid', 'Gita', 'Hugo', 'Ines', 'Javi'] as const;
const JOBS = ['engineers', 'nurses', 'teachers', 'chefs', 'pilots', 'divers'] as const;
const HABITS = ['cyclists', 'early risers', 'swimmers', 'vegetarians', 'runners'] as const;

type LogicTemplate = Generator;

/** Chained universals — the answer is always yes, so vary which is asked. */
const syllogismChain: LogicTemplate = (rng) => {
  const [a, b, c] = pickDistinct(rng, NONSENSE, 3);
  const { options, answer } = assemble(rng, 3, text('Yes'), [text('No'), text('Cannot be determined')]);
  return {
    category: 'Logic',
    prompt: `All ${a} are ${b}. All ${b} are ${c}. Are all ${a} necessarily ${c}?`,
    options, answer,
    explanation:
      `The universals chain: ${a} sit inside ${b}, which sit inside ${c}, so every ${a.replace(/s$/, '')} ` +
      `is a ${c.replace(/s$/, '')}. Nonsense words are deliberate — they stop world knowledge interfering.`,
  };
};

/** Modus tollens. Deny the consequence, and you deny the antecedent. */
const modusTollens: LogicTemplate = (rng) => {
  const scene = pick(rng, [
    { p: 'it rains', q: 'the match is cancelled', notQ: 'The match was not cancelled', notP: 'It did not rain', yesP: 'It rained' },
    { p: 'the alarm sounds', q: 'the doors lock', notQ: 'The doors did not lock', notP: 'The alarm did not sound', yesP: 'The alarm sounded' },
    { p: 'the batch fails', q: 'the line stops', notQ: 'The line did not stop', notP: 'The batch did not fail', yesP: 'The batch failed' },
  ]);
  const { options, answer } = assemble(rng, 4, text(scene.notP), [
    text(scene.yesP),
    text('Cannot be determined'),
    text('Both happened'),
  ]);
  return {
    category: 'Logic',
    prompt: `If ${scene.p}, ${scene.q}. ${scene.notQ}. What follows?`,
    options, answer,
    explanation:
      `Deny the consequence and you deny the antecedent. The common error is treating the rule as ` +
      `reversible — the consequence happening would NOT prove the antecedent did.`,
  };
};

/** "Some" never upgrades to "all". */
const someAll: LogicTemplate = (rng) => {
  const job = pick(rng, JOBS);
  const habit = pick(rng, HABITS);
  const other = pick(rng, HABITS.filter((h) => h !== habit));
  const { options, answer } = assemble(rng, 4, text(`Some ${job} are ${habit}`), [
    text(`All ${job} are ${habit}`),
    text(`No ${job} are ${habit}`),
    text(`All ${habit} are ${other}`),
  ]);
  return {
    category: 'Logic',
    prompt: `Some ${job} are ${other}. All ${other} are ${habit}. Which statement must be true?`,
    options, answer,
    explanation:
      `Only the overlap carries through: the ${job} who are ${other} must be ${habit}, so "some" holds. ` +
      `"Some" never upgrades to "all" — nothing was said about the rest.`,
  };
};

/** Ordering. Randomised chain length so the shape isn't memorable. */
const ordering: LogicTemplate = (rng) => {
  const n = int(rng, 4, 5);
  const names = pickDistinct(rng, PEOPLE, n);
  const order = shuffle(rng, names); // fastest first
  const facts: string[] = [`${order[0]} finishes first`];
  for (let i = 1; i < n - 1; i++) facts.push(`${order[i]} beats ${order[i + 1]}`);

  const last = order[n - 1];
  const { options, answer } = assemble(rng, 5, text(last), [
    ...order.slice(0, n - 1).map((p) => text(p)),
    text('Cannot be determined'),
  ]);

  return {
    category: 'Logic',
    prompt: `${n} runners finish a race. ${facts.join('. ')}. Who finishes last?`,
    options, answer,
    explanation:
      `The chain fixes the whole order: ${order.join(' > ')}, so ${last} is last. ` +
      `Sketch ordering questions on one line rather than holding them in your head.`,
  };
};

/** "Only X may Y" restricts permission, it does not impose obligation. */
const onlyMembers: LogicTemplate = (rng) => {
  const scene = pick(rng, [
    { group: 'members', act: 'enter' },
    { group: 'staff', act: 'use the lift' },
    { group: 'residents', act: 'park here' },
  ]);
  const { options, answer } = assemble(rng, 4, text(`Everyone who does is ${scene.group === 'staff' ? 'staff' : `a ${scene.group.replace(/s$/, '')}`}`), [
    text(`All ${scene.group} do`),
    text(`${scene.group[0].toUpperCase() + scene.group.slice(1)} are required to`),
    text(`Others sometimes do`),
  ]);
  return {
    category: 'Logic',
    prompt: `A sign reads: "Only ${scene.group} may ${scene.act}." Which statement must be true?`,
    options, answer,
    explanation:
      `"Only ${scene.group} may ${scene.act}" restricts who is PERMITTED, so anyone doing it belongs to ` +
      `that group. It places no obligation on the group to do it at all.`,
  };
};

/** Letter-shift substitution code. */
const letterCode: LogicTemplate = (rng) => {
  const shift = pick(rng, [1, 2, 25]); // 25 reads as "back one"
  const words = ['MONDAY', 'FRIDAY', 'SUNDAY', 'AUGUST', 'MARKET', 'ORANGE', 'PLANET'];
  const [sample, target] = pickDistinct(rng, words, 2);
  const enc = (w: string) => w.split('').map((ch) =>
    String.fromCharCode(((ch.charCodeAt(0) - 65 + shift) % 26) + 65)).join('');

  const right = enc(target);
  const wrongShift = (s: number) => target.split('').map((ch) =>
    String.fromCharCode(((ch.charCodeAt(0) - 65 + s) % 26) + 65)).join('');
  const swapped = right.slice(0, -2) + right.slice(-1) + right.slice(-2, -1);

  const { options, answer } = assemble(rng, 5, text(right, true), [
    text(wrongShift((shift + 1) % 26), true),
    text(wrongShift((shift + 25) % 26), true),
    text(swapped, true),
    text(target, true),
  ]);

  const dir = shift === 25 ? 'back one place' : `forward ${shift} place${shift > 1 ? 's' : ''}`;
  return {
    category: 'Logic',
    prompt: `In a certain code, ${sample} is written as ${enc(sample)}. How is ${target} written in that code?`,
    options, answer,
    explanation:
      `Every letter moves ${dir} in the alphabet. Check one letter against the sample before ` +
      `encoding the whole word — confirming the shift takes a second and rules out three options.`,
  };
};

const LOGIC: LogicTemplate[] = [
  syllogismChain, modusTollens, someAll, ordering, onlyMembers, letterCode,
];

// ================================================================= SPATIAL

type SpatialTemplate = Generator;

const CORNERS: Corner[] = ['tl', 'tr', 'br', 'bl'];

/** Arrow rotating a fixed amount each step. */
const arrowRotation: SpatialTemplate = (rng) => {
  // 180 is excluded on purpose: the sequence alternates between two angles, so
  // there are not enough distinct figures to build five options, and the rule
  // itself is ambiguous (is it turning left or right?).
  const step = pick(rng, [90, -90, 45, -45]);
  const start = pick(rng, [0, 90, 180, 270]);
  const norm = (d: number) => ((d % 360) + 360) % 360;
  const seq = [0, 1, 2].map((i) => norm(start + i * step));
  const next = norm(start + 3 * step);

  const { options, answer } = assemble(rng, 5, figure({ k: 'arrow', deg: next }), [
    figure({ k: 'arrow', deg: norm(start - step) }),   // rotated the wrong way
    figure({ k: 'arrow', deg: norm(next + step) }),    // one step too far
    ...seq.map((d) => figure({ k: 'arrow', deg: d })), // an earlier frame
  ], (i) => {
    // At 90-degree steps the wrong-direction distractor collides with the
    // answer, so top up from the off-axis angles to keep five options.
    const pool = [45, 135, 225, 315, 0, 90, 180, 270];
    return i < pool.length ? figure({ k: 'arrow', deg: pool[i] }) : null;
  });

  return {
    category: 'Spatial',
    prompt: 'Which figure comes next in the sequence?',
    figures: [...seq.map((deg) => ({ k: 'arrow' as const, deg })), { k: 'q' as const }],
    options, answer,
    explanation:
      `The arrow turns ${Math.abs(step)}° ${step > 0 ? 'clockwise' : 'anticlockwise'} each step. ` +
      `Name the transformation before you look at the options — deciding first stops the ` +
      `wrong-direction distractor pulling you around.`,
  };
};

/** Dot walking around the corners of a square. */
const dotWalk: SpatialTemplate = (rng) => {
  const dir = pick(rng, [1, -1]);
  const start = int(rng, 0, 3);
  const at = (i: number) => CORNERS[(((start + dir * i) % 4) + 4) % 4];
  const seq = [0, 1, 2].map(at);
  const next = at(3);

  const { options, answer } = assemble(rng, 5, figure({ k: 'dotSquare', pos: next }), [
    figure({ k: 'dotSquare', pos: at(-1) }),
    figure({ k: 'dotSquare', pos: 'c' }),
    ...seq.map((pos) => figure({ k: 'dotSquare', pos })),
  ]);

  return {
    category: 'Spatial',
    prompt: 'Which figure comes next in the sequence?',
    figures: [...seq.map((pos) => ({ k: 'dotSquare' as const, pos })), { k: 'q' as const }],
    options, answer,
    explanation: `The dot walks ${dir > 0 ? 'clockwise' : 'anticlockwise'} around the corners, one at a time.`,
  };
};

/** Polygons gaining a side each step. */
const polygonCount: SpatialTemplate = (rng) => {
  const start = int(rng, 3, 5);
  const seq = [0, 1, 2].map((i) => start + i);
  const next = start + 3;
  const { options, answer } = assemble(rng, 5, figure({ k: 'poly', n: next }), [
    figure({ k: 'poly', n: next + 1 }),
    ...seq.map((n) => figure({ k: 'poly', n })),
  ]);
  return {
    category: 'Spatial',
    prompt: 'Which figure comes next in the sequence?',
    figures: [...seq.map((n) => ({ k: 'poly' as const, n })), { k: 'q' as const }],
    options, answer,
    explanation: `The side count rises by one each step: ${seq.join(', ')}, then ${next}.`,
  };
};

/** Dot count following an arithmetic step. Count twice — distractors sit ±1 away. */
const dotCount: SpatialTemplate = (rng) => {
  const step = int(rng, 1, 2);
  const start = int(rng, 1, 2);
  const seq = [0, 1, 2].map((i) => start + i * step);
  const next = start + 3 * step;
  if (next > 9) return dotCount(rng);

  const { options, answer } = assemble(rng, 5, figure({ k: 'dots', n: next }), [
    figure({ k: 'dots', n: next + 1 }),
    figure({ k: 'dots', n: next - 1 }),
    ...seq.map((n) => figure({ k: 'dots', n })),
  ]);

  return {
    category: 'Spatial',
    prompt: 'Which figure comes next in the sequence?',
    figures: [...seq.map((n) => ({ k: 'dots' as const, n })), { k: 'q' as const }],
    options, answer,
    explanation:
      `The count goes up by ${step} each step: ${seq.join(', ')}, then ${next}. ` +
      `Count twice — the distractors sit one either side deliberately.`,
  };
};

/** Odd one out: the circle has no vertices. */
const oddShapeOut: SpatialTemplate = (rng) => {
  const others: BasicShape[] = ['square', 'pentagon', 'triangle'];
  const { options, answer } = assemble(rng, 4, figure({ k: 'shape', s: 'circle' }),
    others.map((s) => figure({ k: 'shape', s })));
  return {
    category: 'Spatial',
    prompt: 'Which figure does not belong with the other three?',
    options, answer,
    explanation:
      `The square, pentagon and triangle are straight-sided polygons with vertices. ` +
      `The circle has neither, so it is the odd one out.`,
  };
};

/** Mirror an L across a vertical line. The 180° rotation is the designed trap. */
const mirrorEll: SpatialTemplate = (rng) => {
  const { options, answer } = assemble(rng, 4, figure({ k: 'ell', t: 'mirror' }), [
    figure({ k: 'ell', t: 'orig' }),
    figure({ k: 'ell', t: 'r180' }),
    figure({ k: 'ell', t: 'r90' }),
  ]);
  return {
    category: 'Spatial',
    prompt: 'Which of these is the mirror image of the figure above, reflected across a vertical line?',
    figures: [{ k: 'ell', t: 'orig' }],
    options, answer,
    explanation:
      `Reflection swaps left and right and leaves top and bottom alone: the upright bar moves to the ` +
      `right and the foot points left. The 180° rotation also puts the bar on the right but flips the ` +
      `foot to the top. Picking the UNCHANGED figure means the transformation was never performed — ` +
      `say "flip left-right" out loud before scanning the options.`,
  };
};

/** Size analogy: the shape has to survive the transformation. */
const sizeAnalogy: SpatialTemplate = (rng) => {
  const [a, b] = pickDistinct<SizedShape>(rng, ['circle', 'square', 'triangle'], 2);
  const grow = rng() < 0.5;
  const { options, answer } = assemble(rng, 5, figure({ k: 'sized', s: b, big: grow }), [
    figure({ k: 'sized', s: b, big: !grow }),
    figure({ k: 'sized', s: a, big: grow }),
    figure({ k: 'sized', s: a, big: !grow }),
    figure({ k: 'sized', s: 'triangle', big: grow }),
  ]);
  return {
    category: 'Spatial',
    prompt: `${grow ? 'Small' : 'Large'} to ${grow ? 'large' : 'small'} — which figure completes the pair?`,
    figures: [
      { k: 'sized', s: a, big: !grow },
      { k: 'sized', s: a, big: grow },
      { k: 'sep' },
      { k: 'sized', s: b, big: !grow },
      { k: 'q' },
    ],
    options, answer,
    explanation:
      `The relationship is size only, so the shape must survive it: the ${b} ${grow ? 'grows' : 'shrinks'} ` +
      `and stays a ${b}. Options that change the shape are testing whether you tracked both properties.`,
  };
};

/** A filled cell reading left-to-right, wrapping down a row. Four frames set the rule. */
const gridWalk: SpatialTemplate = (rng) => {
  const startIndex = int(rng, 0, 3);
  const cell = (i: number) => ({ k: 'grid' as const, r: Math.floor(i / 3) % 3, c: i % 3 });
  const seq = [0, 1, 2, 3].map((i) => cell(startIndex + i));
  const next = cell(startIndex + 4);

  const { options, answer } = assemble(rng, 5, figure(next), [
    figure(cell(startIndex + 5)),
    figure(cell(startIndex + 3)),
    ...seq.slice(0, 2).map(figure),
    figure(cell(startIndex + 6)),
  ]);

  return {
    category: 'Spatial',
    prompt: 'Which figure comes next in the sequence?',
    figures: [...seq, { k: 'q' as const }],
    options, answer,
    explanation:
      `The filled cell moves one place right and wraps down to the start of the next row when it runs ` +
      `out — like reading. Four frames are shown precisely so the wrap is stated, not guessed.`,
  };
};

const SPATIAL: SpatialTemplate[] = [
  arrowRotation, dotWalk, polygonCount, dotCount,
  oddShapeOut, mirrorEll, sizeAnalogy, gridWalk,
];

// ================================================================== DETAIL

const HEX = '0123456789abcdef';
const UPPER = 'ABCDEFGHJKLMNPQRSTUVWXYZ';

function digits(rng: Rng, n: number): string {
  let s = '';
  for (let i = 0; i < n; i++) s += int(rng, 0, 9);
  return s;
}

/** Swap two adjacent characters — the single most common transcription error. */
function transpose(rng: Rng, s: string): string {
  for (let tries = 0; tries < 20; tries++) {
    const i = int(rng, 0, s.length - 2);
    if (s[i] !== s[i + 1]) return s.slice(0, i) + s[i + 1] + s[i] + s.slice(i + 2);
  }
  return s.slice(0, -1) + (s.endsWith('9') ? '8' : '9');
}

/** Change one character to a different one. */
function substitute(rng: Rng, s: string): string {
  const i = int(rng, 0, s.length - 1);
  const alt = s[i] === '9' ? '8' : String(Number.isNaN(Number(s[i])) ? 'X' : Number(s[i]) + 1);
  return s.slice(0, i) + alt + s.slice(i + 1);
}

const digitPairs: Generator = (rng) => {
  const same = digits(rng, int(rng, 7, 8));
  const corrupt = () => {
    const base = digits(rng, same.length);
    return `${base} · ${rng() < 0.5 ? transpose(rng, base) : substitute(rng, base)}`;
  };
  const { options, answer } = assemble(rng, 4, text(`${same} · ${same}`, true),
    [corrupt(), corrupt(), corrupt()].map((t) => text(t, true)));
  return {
    category: 'Detail',
    prompt: 'Which pair is exactly alike?',
    options, answer,
    explanation:
      `Only one pair matches; the others each carry a single transposition or substitution. ` +
      `Compare in chunks of three digits rather than sweeping left to right, and check the ends first.`,
  };
};

const codeOddOneOut: Generator = (rng) => {
  const body = digits(rng, 5);
  const tail = pickDistinct(rng, UPPER.split(''), 2).join('');
  const head = pickDistinct(rng, UPPER.split(''), 3).join('');
  const same = `${head}-${body}-${tail}`;
  const odd = `${head}-${body}-${tail[1]}${tail[0]}`;

  // This is the one question type whose options are SUPPOSED to repeat: three
  // identical codes and one that differs. assemble() would dedupe them away,
  // so the option list is built by hand here.
  const all = shuffle(rng, [odd, same, same, same]);
  const idx = all.indexOf(odd);
  return {
    category: 'Detail',
    prompt: 'Which of these is different from the other three?',
    options: all.map((t) => text(t, true)),
    answer: idx,
    explanation:
      `The odd one reverses the final two letters (${tail} became ${odd.slice(-2)}). ` +
      `When three of four are identical, scan the ends first — that is where transpositions hide.`,
  };
};

const hexPairs: Generator = (rng) => {
  const mk = () => '0x' + Array.from({ length: 8 }, () => pick(rng, HEX.split(''))).join('');
  const same = mk();
  const zeroSwap = (s: string) => s.includes('0', 2) ? s.replace(/0(?!x)/, 'O') : s.slice(0, -1) + 'O';
  const caseSwap = (s: string) => {
    const i = s.split('').findIndex((ch, j) => j > 1 && /[a-f]/.test(ch));
    return i < 0 ? s + 'A' : s.slice(0, i) + s[i].toUpperCase() + s.slice(i + 1);
  };
  const a = mk(), b = mk();
  const { options, answer } = assemble(rng, 4, text(`${same} · ${same}`, true), [
    text(`${a} · ${zeroSwap(a)}`, true),
    text(`${b} · ${caseSwap(b)}`, true),
    text(`${mk()} · ${mk()}`, true),
  ]);
  return {
    category: 'Detail',
    prompt: 'Which pair is exactly alike?',
    options, answer,
    explanation:
      `One pair matches exactly. The others differ by a zero swapped for a capital O, or by the case of ` +
      `a single character. Case and the 0/O collision are the two classics — and both survive a careless ` +
      `read because the shapes are nearly identical.`,
  };
};

const DETAIL: Generator[] = [digitPairs, codeOddOneOut, hexPairs];

// ================================================================= assembly

/**
 * Criteria sells more than one test and employers do not say which they bought.
 * The two shapes below cover what actually turns up, and the platform states
 * its own count and time limit before you start — read that screen and pick the
 * matching mode, because the pacing is the part that differs most. 40-in-20 is
 * 30 seconds a question; 50-in-15 is eighteen, and a strategy tuned for the
 * first is a disaster in the second.
 */
export type DrillMode = 'noVerbal' | 'withVerbal';

export interface ModeSpec {
  label: string;
  blurb: string;
  seconds: number;
  mix: Record<Category, number>;
}

export const MODES: Record<DrillMode, ModeSpec> = {
  noVerbal: {
    label: '40 questions · 20:00 · no verbal',
    blurb: 'The UCAT shape — language-neutral, no English vocabulary. 30 seconds a question.',
    seconds: 20 * 60,
    mix: { Numerical: 12, Series: 8, Logic: 8, Spatial: 8, Detail: 4, Verbal: 0 },
  },
  withVerbal: {
    label: '50 questions · 15:00 · with verbal',
    blurb: 'The CCAT shape — a third of it is English vocabulary, analogies and spelling. 18 seconds a question.',
    seconds: 15 * 60,
    mix: { Numerical: 11, Series: 6, Logic: 5, Spatial: 8, Detail: 3, Verbal: 17 },
  },
};

export function modeTotal(mode: DrillMode): number {
  return Object.values(MODES[mode].mix).reduce((a, b) => a + b, 0);
}

/** Kept for callers that predate the mode switch. */
export const MIX = MODES.noVerbal.mix;
export const TOTAL_QUESTIONS = modeTotal('noVerbal');
export const DURATION_SECONDS = MODES.noVerbal.seconds;

/**
 * Build one question of a given type. `offset` walks the template list so a run
 * never leans on a single generator; the RNG randomises the values inside
 * whichever template comes up.
 */
export function generateOne(rng: Rng, category: Category, offset: number): Question {
  switch (category) {
    case 'Numerical': return NUMERICAL[offset % NUMERICAL.length](rng);
    case 'Series': return generateSeries(rng);
    case 'Logic': return LOGIC[offset % LOGIC.length](rng);
    case 'Spatial': return SPATIAL[offset % SPATIAL.length](rng);
    case 'Detail': return DETAIL[offset % DETAIL.length](rng);
    case 'Verbal': return generateVerbal(rng, offset);
  }
}

/**
 * A full run: the mode's mix, template-cycled within each type, then shuffled so
 * the types interleave the way they do on the real thing.
 */
export function generateRun(seed: number, mode: DrillMode = 'noVerbal'): {
  seed: number; mode: DrillMode; questions: Question[];
} {
  const rng = makeRng(seed);
  const { mix } = MODES[mode];
  const out: Question[] = [];

  for (const category of CATEGORIES) {
    const n = mix[category];
    if (!n) continue;
    const start = int(rng, 0, 20);
    for (let i = 0; i < n; i++) out.push(generateOne(rng, category, start + i));
  }

  return { seed, mode, questions: shuffle(rng, out) };
}
