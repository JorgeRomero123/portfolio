'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  CATEGORIES, MODES, generateRun, modeTotal, optionLabel, randomSeed,
  type Category, type DrillMode, type FigureSpec, type Option, type Question, type Slot,
} from '@/lib/aptitude-drill';

// ------------------------------------------------------------------- figures

/**
 * Figure specs become SVG here and nowhere else. Strokes use `currentColor` so
 * a figure inherits the colour of whatever it sits inside — the same spec draws
 * correctly in a question, in a selected option, and in the review list.
 */
function Figure({ spec, size = 52 }: { spec: FigureSpec; size?: number }) {
  const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 3.4, strokeLinejoin: 'round', strokeLinecap: 'round' } as const;
  const solid = { fill: 'currentColor', stroke: 'none' } as const;

  const poly = (n: number, r: number, cx: number, cy: number) =>
    Array.from({ length: n }, (_, i) => {
      const a = -Math.PI / 2 + (i * 2 * Math.PI) / n;
      return `${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`;
    }).join(' ');

  const body = (() => {
    switch (spec.k) {
      case 'arrow':
        return (
          <g transform={`rotate(${spec.deg} 30 30)`}>
            <line x1="30" y1="49" x2="30" y2="17" {...stroke} />
            <polyline points="20,26 30,15 40,26" {...stroke} />
          </g>
        );
      case 'dotSquare': {
        const at: Record<string, [number, number]> = {
          tl: [19, 19], tr: [41, 19], br: [41, 41], bl: [19, 41], c: [30, 30],
        };
        const [cx, cy] = at[spec.pos];
        return (
          <>
            <rect x="9" y="9" width="42" height="42" rx="2" {...stroke} />
            <circle cx={cx} cy={cy} r="5" {...solid} />
          </>
        );
      }
      case 'poly':
        return <polygon points={poly(spec.n, 22, 30, 31)} {...stroke} />;
      case 'dots': {
        const rows = Math.ceil(spec.n / 4);
        const out = [];
        for (let r = 0; r < rows; r++) {
          const inRow = Math.min(4, spec.n - r * 4);
          const y = 30 - (rows - 1) * 9 + r * 18;
          for (let c = 0; c < inRow; c++) {
            out.push(<circle key={`${r}-${c}`} cx={30 - (inRow - 1) * 7 + c * 14} cy={y} r="4" {...solid} />);
          }
        }
        return <>{out}</>;
      }
      case 'shape':
        if (spec.s === 'circle') return <circle cx="30" cy="30" r="21" {...stroke} />;
        if (spec.s === 'square') return <rect x="10" y="10" width="40" height="40" rx="2" {...stroke} />;
        return <polygon points={poly(spec.s === 'pentagon' ? 5 : 3, spec.s === 'pentagon' ? 22 : 23, 30, spec.s === 'pentagon' ? 31 : 32)} {...stroke} />;
      case 'ell': {
        const t = { orig: undefined, mirror: 'translate(60,0) scale(-1,1)', r180: 'rotate(180 30 30)', r90: 'rotate(90 30 30)' }[spec.t];
        return <polygon transform={t} points="12,10 26,10 26,34 48,34 48,50 12,50" {...stroke} />;
      }
      case 'sized':
        if (spec.s === 'circle') return <circle cx="30" cy="30" r={spec.big ? 22 : 10} {...stroke} />;
        if (spec.s === 'square') {
          const w = spec.big ? 42 : 20;
          return <rect x={30 - w / 2} y={30 - w / 2} width={w} height={w} rx="2" {...stroke} />;
        }
        return <polygon points={poly(3, spec.big ? 23 : 11, 30, spec.big ? 32 : 31)} {...stroke} />;
      case 'grid':
        return (
          <>
            {Array.from({ length: 9 }, (_, i) => {
              const r = Math.floor(i / 3), c = i % 3;
              const on = r === spec.r && c === spec.c;
              return (
                <rect key={i} x={8 + c * 15} y={8 + r * 15} width="14" height="14" rx="1.5"
                  {...(on ? solid : { ...stroke, strokeWidth: 2.2 })} />
              );
            })}
          </>
        );
    }
  })();

  return (
    <svg viewBox="0 0 60 60" width={size} height={size} aria-hidden="true" className="block">
      {body}
    </svg>
  );
}

function StemRow({ slots, size = 44 }: { slots: Slot[]; size?: number }) {
  return (
    <div className="flex items-center gap-2 overflow-x-auto py-1">
      {slots.map((s, i) => {
        if (s.k === 'sep') return <span key={i} className="px-1 text-xl text-gray-400">::</span>;
        if (s.k === 'q') {
          return (
            <span key={i}
              className="grid shrink-0 place-items-center rounded-lg border-2 border-dashed border-gray-300 text-xl font-bold text-gray-400"
              style={{ width: size + 22, height: size + 22 }}>?</span>
          );
        }
        return (
          <span key={i}
            className="grid shrink-0 place-items-center rounded-lg border border-gray-200 bg-white text-gray-900"
            style={{ width: size + 22, height: size + 22 }}>
            <Figure spec={s} size={size} />
          </span>
        );
      })}
    </div>
  );
}

// --------------------------------------------------------------------- types

type Phase = 'idle' | 'running' | 'done';

interface PastRun {
  seed: number;
  shape?: DrillMode;
  score: number;
  attempted: number;
  seconds: number;
  byType: Record<string, { n: number; ok: number }>;
  at: string;
}

const HISTORY_KEY = 'aptitude-drill-history';

function readHistory(): PastRun[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed.slice(-12) : [];
  } catch {
    return []; // private windows and blocked storage both land here
  }
}

function writeHistory(runs: PastRun[]) {
  try {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(runs.slice(-12)));
  } catch {
    /* history is a convenience, never a requirement */
  }
}

const mmss = (s: number) => {
  const t = Math.max(0, Math.round(s));
  return `${String(Math.floor(t / 60)).padStart(2, '0')}:${String(t % 60).padStart(2, '0')}`;
};

/** What to work on, keyed to the type that went worst. */
const COACHING: Record<Category, string> = {
  Numerical:
    'Rehearse the four moves that cover most of them: reverse a percentage by dividing, measure an increase against the original, convert workers-and-days to worker-days, and recover the whole before taking a second percentage.',
  Series:
    'Run a fixed checklist on every series — differences first, then ratios, then differences-of-differences, then two alternating rules. Working the checklist beats staring at the numbers.',
  Logic:
    'Draw it. Nested circles for all/some statements, a single ordered line for rankings. Holding these in your head is what costs the time.',
  Spatial:
    'Name the transformation out loud before you look at the options — "rotating 90° clockwise", "flip left-right". Deciding first stops the distractors pulling you around.',
  Detail:
    'Compare in chunks of three characters and check the ends before the middle. Case, accents and the 0/O collision are where the planted differences live.',
  Verbal:
    'Read the instruction word first — "opposite", "incorrectly", "best completes" — because the traps are built for someone who read the options first. On antonyms one option is always a synonym of the prompt; on analogies, name the relationship out loud before you scan the pairs.',
};

// ----------------------------------------------------------------- component

export default function AptitudeDrill() {
  const [phase, setPhase] = useState<Phase>('idle');
  const [timed, setTimed] = useState(true);
  const [mode, setMode] = useState<DrillMode>('noVerbal');
  // A run in progress keeps the limit it began with, even if the selector moves.
  const [runSeconds, setRunSeconds] = useState(MODES.noVerbal.seconds);
  const [seed, setSeed] = useState<number | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [flags, setFlags] = useState<boolean[]>([]);
  const [index, setIndex] = useState(0);
  const [left, setLeft] = useState(MODES.noVerbal.seconds);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState<PastRun[]>([]);
  const [filter, setFilter] = useState<'all' | 'wrong' | 'blank'>('all');
  const [copied, setCopied] = useState(false);
  const startedAt = useRef(0);

  useEffect(() => setHistory(readHistory()), []);

  const start = useCallback((withSeed?: number, withMode?: DrillMode) => {
    const s = withSeed ?? randomSeed();
    const m = withMode ?? mode;
    const run = generateRun(s, m);
    setMode(m);
    setRunSeconds(MODES[m].seconds);
    setSeed(s);
    setQuestions(run.questions);
    setAnswers(new Array(run.questions.length).fill(null));
    setFlags(new Array(run.questions.length).fill(false));
    setIndex(0);
    setLeft(MODES[m].seconds);
    setElapsed(0);
    startedAt.current = Date.now();
    setFilter('all');
    setPhase('running');
    window.scrollTo(0, 0);
  }, [mode]);

  const finish = useCallback(() => {
    setPhase((p) => {
      if (p !== 'running') return p;
      const seconds = (Date.now() - startedAt.current) / 1000;
      setElapsed(seconds);
      window.scrollTo(0, 0);
      return 'done';
    });
  }, []);

  // The clock. Only mounted while a timed run is in progress.
  useEffect(() => {
    if (phase !== 'running' || !timed) return;
    const id = setInterval(() => {
      setLeft((v) => {
        if (v <= 1) { finish(); return 0; }
        return v - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [phase, timed, finish]);

  // Untimed runs still show a counting clock, so the pace is visible afterwards.
  useEffect(() => {
    if (phase !== 'running' || timed) return;
    const id = setInterval(() => setElapsed((Date.now() - startedAt.current) / 1000), 1000);
    return () => clearInterval(id);
  }, [phase, timed]);

  const current = questions[index];

  const choose = useCallback((i: number) => {
    setAnswers((prev) => {
      const next = prev.slice();
      next[index] = next[index] === i ? null : i;
      return next;
    });
  }, [index]);

  const move = useCallback((d: number) => {
    setIndex((i) => Math.min(questions.length - 1, Math.max(0, i + d)));
    window.scrollTo(0, 0);
  }, [questions.length]);

  useEffect(() => {
    if (phase !== 'running') return;
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key >= '1' && e.key <= '5') {
        const i = Number(e.key) - 1;
        if (current && i < current.options.length) { choose(i); e.preventDefault(); }
      } else if (e.key === 'ArrowRight' || e.key === 'Enter') { move(1); e.preventDefault(); }
      else if (e.key === 'ArrowLeft') { move(-1); e.preventDefault(); }
      else if (e.key.toLowerCase() === 'f') {
        setFlags((prev) => { const n = prev.slice(); n[index] = !n[index]; return n; });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [phase, current, choose, move, index]);

  // ------------------------------------------------------------- scoring
  const result = useMemo(() => {
    const byType = Object.fromEntries(
      CATEGORIES.map((c) => [c, { n: 0, ok: 0 }]),
    ) as Record<Category, { n: number; ok: number }>;

    let score = 0, attempted = 0;
    questions.forEach((q, i) => {
      byType[q.category].n++;
      if (answers[i] === null || answers[i] === undefined) return;
      attempted++;
      if (answers[i] === q.answer) { score++; byType[q.category].ok++; }
    });

    const weakest = CATEGORIES
      .filter((c) => byType[c].n > 0)
      .sort((a, b) => byType[a].ok / byType[a].n - byType[b].ok / byType[b].n)[0];

    return { score, attempted, byType, weakest };
  }, [questions, answers]);

  /**
   * A compact machine-readable summary of the run.
   *
   * Correct answers cost one line each; only the misses and skips carry the
   * question text and what was picked, which keeps a full 40-question run to a
   * couple of KB — small enough to paste into a chat without truncation, and
   * detailed enough to diagnose WHY a question went wrong rather than just that
   * it did.
   */
  const exportJson = useMemo(() => {
    if (phase !== 'done' || !questions.length) return '';
    const { score, attempted, byType } = result;

    return JSON.stringify({
      tool: 'aptitude-drill',
      seed,
      shape: mode,
      mode: timed ? 'timed' : 'untimed',
      at: new Date().toISOString().slice(0, 16).replace('T', ' '),
      score,
      total: questions.length,
      attempted,
      timeUsed: mmss(elapsed),
      secPerQuestion: attempted ? Number((elapsed / attempted).toFixed(1)) : null,
      // [correct, asked] per type — terser than an object and just as readable
      byType: Object.fromEntries(
        CATEGORIES.filter((c) => byType[c].n > 0).map((c) => [c, [byType[c].ok, byType[c].n]]),
      ),
      questions: questions.map((q, i) => {
        const mine = answers[i];
        const blank = mine === null || mine === undefined;
        const ok = !blank && mine === q.answer;
        const row: Record<string, unknown> = { n: i + 1, c: q.category, r: blank ? '-' : ok ? 'y' : 'n' };
        if (!ok) {
          row.q = (q.monoPrompt ? `${q.prompt} ${q.monoPrompt}` : q.prompt).slice(0, 80);
          row.mine = blank ? null : optionLabel(q.options[mine]);
          row.correct = optionLabel(q.options[q.answer]);
        }
        return row;
      }),
    });
  }, [phase, questions, answers, result, seed, timed, mode, elapsed]);

  const copyResults = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(exportJson);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access can be refused; the textarea below is the fallback.
      setCopied(false);
    }
  }, [exportJson]);

  // Record the run once, when it finishes.
  const recorded = useRef<number | null>(null);
  useEffect(() => {
    if (phase !== 'done' || seed === null || recorded.current === seed) return;
    recorded.current = seed;
    const entry: PastRun = {
      seed, shape: mode, score: result.score, attempted: result.attempted,
      seconds: Math.round(elapsed), byType: result.byType,
      at: new Date().toISOString().slice(0, 16).replace('T', ' '),
    };
    setHistory((prev) => { const next = [...prev, entry]; writeHistory(next); return next; });
  }, [phase, seed, mode, result, elapsed]);

  const answeredCount = answers.filter((a) => a !== null).length;

  // ==================================================================== idle
  if (phase === 'idle') {
    const spec = MODES[mode];
    const total = modeTotal(mode);
    const sameShape = history.filter((h) => (h.shape ?? 'noVerbal') === mode);
    const best = sameShape.length ? Math.max(...sameShape.map((h) => h.score)) : null;
    const perQuestion = Math.round(spec.seconds / total);
    return (
      <div className="mx-auto max-w-3xl">
        <div className="mb-8 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:grid-cols-4">
          {[
            [String(total), 'Questions'],
            [mmss(spec.seconds), 'Time limit'],
            [`${perQuestion}s`, 'Per question'],
            [best === null ? '—' : `${best}/${total}`, 'Your best'],
          ].map(([v, k]) => (
            <div key={k} className="bg-white px-4 py-3">
              <div className="font-mono text-xl font-bold tabular-nums text-gray-900">{v}</div>
              <div className="text-xs uppercase tracking-wider text-gray-500">{k}</div>
            </div>
          ))}
        </div>

        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="mb-1 text-xl font-bold text-gray-900">Which test did they send?</h2>
          <p className="mb-4 text-sm text-gray-600">
            The platform states its question count and time limit before you start. Match it here —
            the pacing is what differs most between the two.
          </p>
          <div className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(MODES) as DrillMode[]).map((m) => (
              <button key={m} onClick={() => setMode(m)} aria-pressed={mode === m}
                className={`rounded-lg border p-4 text-left transition
                  ${mode === m ? 'border-blue-600 bg-blue-50' : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'}`}>
                <span className={`block font-semibold ${mode === m ? 'text-blue-900' : 'text-gray-900'}`}>
                  {MODES[m].label}
                </span>
                <span className="mt-1 block text-sm text-gray-600">{MODES[m].blurb}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="mb-4 text-xl font-bold text-gray-900">Before you start</h2>
          <ol className="space-y-3">
            {[
              ['Answer everything.', 'There is no penalty for a wrong answer, so a guess is free. Blank and wrong score the same.'],
              [`Never spend more than ${perQuestion} seconds on one question.`, 'They are not ordered by difficulty — a hard one early costs you easy ones at the end.'],
              ['Skip freely, then sweep back.', 'Use the square strip to flag and return. Almost nobody finishes all forty.'],
              ['Keyboard beats mouse.', '1–5 selects, ← → move between questions, F flags one for review.'],
            ].map(([title, body], i) => (
              <li key={title} className="grid grid-cols-[1.75rem_1fr] gap-3 text-sm">
                <span className="font-mono font-bold text-blue-600">{String(i + 1).padStart(2, '0')}</span>
                <span className="text-gray-600"><b className="font-semibold text-gray-900">{title}</b> {body}</span>
              </li>
            ))}
          </ol>

          <div className="mt-6 flex flex-wrap items-center gap-5 border-t border-gray-100 pt-5">
            <label className="flex cursor-pointer items-center gap-2 text-sm text-gray-600">
              <input type="checkbox" className="h-4 w-4 accent-blue-600"
                checked={!timed} onChange={(e) => setTimed(!e.target.checked)} />
              Untimed practice run
            </label>
            <button onClick={() => start()}
              className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700">
              {timed ? 'Start the clock' : 'Start untimed'}
            </button>
          </div>
        </div>

        {history.length > 0 && (
          <div className="mt-8">
            <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Your runs</h2>
            <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
              <table className="w-full text-sm">
                <thead className="border-b border-gray-200 text-left text-xs uppercase tracking-wider text-gray-500">
                  <tr>
                    <th className="px-4 py-2 font-medium">When</th>
                    <th className="px-4 py-2 font-medium">Score</th>
                    <th className="px-4 py-2 font-medium">Shape</th>
                    <th className="px-4 py-2 font-medium">Time</th>
                    <th className="px-4 py-2 font-medium">Pace</th>
                    <th className="px-4 py-2 font-medium">Seed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {history.slice().reverse().map((h) => (
                    <tr key={`${h.seed}-${h.at}`}>
                      <td className="px-4 py-2 text-gray-600">{h.at}</td>
                      <td className="px-4 py-2 font-mono font-semibold tabular-nums text-gray-900">
                        {h.score}/{modeTotal(h.shape ?? 'noVerbal')}
                      </td>
                      <td className="px-4 py-2 text-xs text-gray-500">
                        {(h.shape ?? 'noVerbal') === 'withVerbal' ? 'with verbal' : 'no verbal'}
                      </td>
                      <td className="px-4 py-2 font-mono tabular-nums text-gray-600">{mmss(h.seconds)}</td>
                      <td className="px-4 py-2 font-mono tabular-nums text-gray-600">
                        {h.attempted ? `${(h.seconds / h.attempted).toFixed(1)}s` : '—'}
                      </td>
                      <td className="px-4 py-2">
                        <button onClick={() => start(h.seed, h.shape ?? 'noVerbal')}
                          className="font-mono text-xs text-blue-600 hover:text-blue-700 hover:underline"
                          title="Replay this exact run">
                          {h.seed}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              Every run is newly generated, so scores are comparable across runs. Click a seed to replay that exact set.
            </p>
          </div>
        )}
      </div>
    );
  }

  // ================================================================= running
  if (phase === 'running' && current) {
    const warn = timed && left <= 120;
    return (
      <div className="mx-auto max-w-3xl">
        <div className="sticky top-0 z-10 -mx-4 mb-4 border-b border-gray-200 bg-white/95 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-4">
            <span className={`font-mono text-2xl font-bold tabular-nums ${warn ? 'text-red-600' : 'text-gray-900'}`}>
              {timed ? mmss(left) : mmss(elapsed)}
            </span>
            <span className="ml-auto text-sm text-gray-500">
              <b className="font-semibold text-gray-900">{index + 1}</b> of {questions.length}
              {' · '}
              <b className="font-semibold text-gray-900">{answeredCount}</b> answered
            </span>
          </div>
          {timed && (
            <div className="mt-2 h-1 rounded-full bg-gray-200">
              <div className={`h-full rounded-full transition-[width] duration-1000 ease-linear ${warn ? 'bg-red-500' : 'bg-blue-600'}`}
                style={{ width: `${(left / runSeconds) * 100}%` }} />
            </div>
          )}
        </div>

        <div className="mb-5 flex flex-wrap gap-1">
          {questions.map((_, i) => (
            <button key={i} onClick={() => { setIndex(i); window.scrollTo(0, 0); }}
              aria-label={`Question ${i + 1}`}
              aria-current={i === index}
              className={`h-5 w-5 rounded border text-[0px] transition
                ${answers[i] !== null ? 'border-blue-600 bg-blue-600'
                  : flags[i] ? 'border-amber-500 bg-amber-100' : 'border-gray-300 bg-white'}
                ${i === index ? 'outline outline-2 outline-offset-1 outline-gray-900' : ''}`}>
              {i + 1}
            </button>
          ))}
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
          <div className="mb-3 flex items-baseline gap-3">
            <span className="rounded bg-blue-50 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-blue-700">
              {current.category}
            </span>
            <span className="font-mono text-xs text-gray-400">
              {String(index + 1).padStart(2, '0')} / {questions.length}
            </span>
          </div>

          <p className="whitespace-pre-line text-lg leading-relaxed text-gray-900">{current.prompt}</p>
          {current.monoPrompt && (
            <p className="mt-3 overflow-x-auto whitespace-pre font-mono text-base leading-relaxed tracking-wide text-gray-900 sm:text-lg">{current.monoPrompt}</p>
          )}
          {current.figures && <div className="mt-4"><StemRow slots={current.figures} /></div>}

          <ul className={`mt-6 gap-2 ${current.options[0].kind === 'figure'
            ? 'grid grid-cols-2 sm:grid-cols-5' : 'grid grid-cols-1'}`}>
            {current.options.map((o, i) => {
              const on = answers[index] === i;
              return (
                <li key={i}>
                  <button onClick={() => choose(i)} aria-pressed={on}
                    className={`flex w-full items-center gap-3 rounded-lg border p-3 text-left transition
                      ${o.kind === 'figure' ? 'flex-col items-center' : ''}
                      ${on ? 'border-blue-600 bg-blue-50 text-blue-900' : 'border-gray-200 bg-white text-gray-900 hover:border-gray-300 hover:bg-gray-50'}`}>
                    <span className={`grid h-6 w-6 shrink-0 place-items-center rounded border font-mono text-xs
                      ${on ? 'border-blue-600 bg-blue-600 text-white' : 'border-gray-300 text-gray-500'}
                      ${o.kind === 'figure' ? 'self-start' : ''}`}>{i + 1}</span>
                    {o.kind === 'figure'
                      ? <Figure spec={o.fig} size={54} />
                      : <span className={o.mono ? 'font-mono' : ''}>{o.text}</span>}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-2">
          <button onClick={() => move(-1)} disabled={index === 0}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-40">
            ← Back
          </button>
          <button onClick={() => setFlags((p) => { const n = p.slice(); n[index] = !n[index]; return n; })}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
            {flags[index] ? 'Unflag' : 'Flag'}
          </button>
          <button onClick={() => move(1)} disabled={index === questions.length - 1}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-40">
            Next →
          </button>
          <button onClick={finish}
            className="ml-auto rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50">
            Finish
          </button>
        </div>
      </div>
    );
  }

  // ==================================================================== done
  const { score, attempted, byType, weakest } = result;
  const verdict =
    score >= 35 ? { text: 'Top-decile territory. Hold this pace.', tone: 'text-green-700' }
      : score >= 30 ? { text: 'Strong — above the usual competitive bar.', tone: 'text-green-700' }
        : score >= 24 ? { text: 'Around average. Worth another run.', tone: 'text-amber-600' }
          : { text: 'Below the competitive bar — drill the weak type.', tone: 'text-red-600' };

  const skipped = questions.length - attempted;
  const previous = history.length > 1 ? history[history.length - 2] : null;
  const delta = previous ? score - previous.score : null;

  const shown = questions
    .map((q, i) => ({ q, i }))
    .filter(({ q, i }) => {
      if (filter === 'all') return true;
      if (filter === 'blank') return answers[i] === null;
      return answers[i] !== null && answers[i] !== q.answer;
    });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-md">
        <div className="flex flex-wrap items-end gap-5">
          <div className="font-mono text-6xl font-bold leading-none tabular-nums text-gray-900">
            {score}<span className="text-2xl font-normal text-gray-400">/{questions.length}</span>
          </div>
          <div className="pb-1">
            <p className={`font-semibold ${verdict.tone}`}>{verdict.text}</p>
            {delta !== null && (
              <p className="text-sm text-gray-500">
                {delta > 0 ? `Up ${delta} on your last run` : delta < 0 ? `Down ${-delta} on your last run` : 'Level with your last run'}
              </p>
            )}
          </div>
        </div>

        <div className="relative mt-6 h-6 rounded-lg border border-gray-200 bg-gray-100">
          <div className="h-full rounded-l-lg bg-blue-600" style={{ width: `${(score / questions.length) * 100}%` }} />
          {[[30, '30 · strong'], [35, '35 · top 10%']].map(([v, label]) => (
            <span key={label as string} className="absolute top-0 h-full border-l border-gray-400"
              style={{ left: `${((v as number) / questions.length) * 100}%` }}>
              <span className="absolute top-full whitespace-nowrap pt-1 font-mono text-[10px] text-gray-500"
                style={{ transform: 'translateX(-50%)' }}>{label}</span>
            </span>
          ))}
        </div>

        <div className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-xl border border-gray-200 bg-gray-200 sm:grid-cols-4">
          {[
            [mmss(elapsed), 'Time used'],
            [attempted ? `${(elapsed / attempted).toFixed(1)}` : '—', 'Sec / question'],
            [`${attempted}/${questions.length}`, 'Attempted'],
            [attempted ? `${Math.round((score / attempted) * 100)}%` : '—', 'Accuracy'],
          ].map(([v, k]) => (
            <div key={k} className="bg-white px-4 py-3">
              <div className="font-mono text-xl font-bold tabular-nums text-gray-900">{v}</div>
              <div className="text-xs uppercase tracking-wider text-gray-500">{k}</div>
            </div>
          ))}
        </div>
      </div>

      <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">By question type</h2>
      <div className="space-y-2 rounded-xl border border-gray-200 bg-white p-5">
        {CATEGORIES.filter((c) => byType[c].n > 0).map((c) => {
          const p = byType[c];
          const pctOk = p.n ? (p.ok / p.n) * 100 : 0;
          return (
            <div key={c} className="grid grid-cols-[6rem_1fr_3rem] items-center gap-3 text-sm">
              <span className="text-gray-700">{c}</span>
              <span className="h-2.5 overflow-hidden rounded-full bg-gray-200">
                <span className={`block h-full rounded-full ${c === weakest && pctOk < 100 ? 'bg-red-500' : 'bg-blue-600'}`}
                  style={{ width: `${pctOk}%` }} />
              </span>
              <span className="text-right font-mono tabular-nums text-gray-600">{p.ok}/{p.n}</span>
            </div>
          );
        })}
      </div>

      <div className="mt-4 rounded-lg border-l-4 border-amber-400 bg-amber-50 p-4 text-sm text-gray-700">
        <b className="font-semibold text-gray-900">{weakest}</b> is your weakest type at {byType[weakest].ok}/{byType[weakest].n}. {COACHING[weakest]}
        {skipped > 6 && ` You also left ${skipped} blank — there is no penalty for a wrong answer, so blanket-fill anything untouched in the last twenty seconds.`}
      </div>

      <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Every question, worked</h2>
      <div className="mb-4 flex flex-wrap gap-2">
        {([['all', `All ${questions.length}`], ['wrong', 'Missed'], ['blank', 'Skipped']] as const).map(([k, label]) => (
          <button key={k} onClick={() => setFilter(k)}
            className={`rounded-lg border px-3 py-1.5 text-sm transition
              ${filter === k ? 'border-gray-900 bg-gray-900 text-white' : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'}`}>
            {label}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {shown.map(({ q, i }) => {
          const mine = answers[i];
          const blank = mine === null;
          const ok = !blank && mine === q.answer;
          const border = ok ? 'border-l-green-500' : blank ? 'border-l-gray-300' : 'border-l-red-500';
          const chip = ok ? ['bg-green-50 text-green-700', 'Correct']
            : blank ? ['bg-gray-100 text-gray-500', 'Skipped'] : ['bg-red-50 text-red-700', 'Missed'];
          const answerOption = q.options[q.answer];
          const isFigure = answerOption.kind === 'figure';

          return (
            <div key={i} className={`rounded-xl border border-l-4 border-gray-200 bg-white p-5 ${border}`}>
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <span className="font-mono text-xs text-gray-400">{String(i + 1).padStart(2, '0')}</span>
                <span className="rounded bg-blue-50 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-blue-700">{q.category}</span>
                <span className={`rounded px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${chip[0]}`}>{chip[1]}</span>
              </div>

              <p className="whitespace-pre-line text-gray-900">{q.prompt}</p>
              {q.monoPrompt && <p className="mt-2 overflow-x-auto whitespace-pre font-mono text-sm leading-relaxed text-gray-900">{q.monoPrompt}</p>}
              {q.figures && <div className="mt-2"><StemRow slots={q.figures} size={38} /></div>}

              {isFigure ? (
                <div className="mt-3">
                  <p className="mb-1 text-sm text-gray-600">
                    {ok ? 'You picked correctly.'
                      : blank ? 'Skipped. The correct figure:'
                        : 'You picked the first figure; the correct one is second.'}
                  </p>
                  <div className="flex items-center gap-2 text-gray-900">
                    {!ok && !blank && mine !== null && (
                      <>
                        <span className="grid h-12 w-12 place-items-center rounded-lg border border-red-300 bg-red-50">
                          <Figure spec={(q.options[mine] as Extract<Option, { kind: 'figure' }>).fig} size={34} />
                        </span>
                        <span className="text-gray-400">→</span>
                      </>
                    )}
                    <span className="grid h-12 w-12 place-items-center rounded-lg border border-green-300 bg-green-50">
                      <Figure spec={answerOption.fig} size={34} />
                    </span>
                  </div>
                </div>
              ) : (
                <p className="mt-3 text-sm text-gray-600">
                  You answered <b className="font-semibold text-gray-900">{blank ? 'nothing' : optionLabel(q.options[mine!])}</b>
                  {!ok && <> · correct answer <b className="font-semibold text-gray-900">{optionLabel(answerOption)}</b></>}
                </p>
              )}

              <p className="mt-3 rounded-lg bg-gray-50 p-3 text-sm text-gray-600">{q.explanation}</p>
            </div>
          );
        })}
      </div>

      <h2 className="mt-10 mb-3 text-sm font-semibold uppercase tracking-wider text-gray-500">Export this run</h2>
      <div className="rounded-xl border border-gray-200 bg-white p-5">
        <div className="mb-3 flex flex-wrap items-center gap-3">
          <button onClick={copyResults}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white transition ${copied ? 'bg-green-600' : 'bg-blue-600 hover:bg-blue-700'}`}>
            {copied ? 'Copied ✓' : 'Copy results as JSON'}
          </button>
          <span className="text-sm text-gray-500">
            Paste this into a chat to have the run analysed — misses carry the question and what you picked.
          </span>
        </div>
        <textarea
          readOnly
          value={exportJson}
          onFocus={(e) => e.currentTarget.select()}
          rows={5}
          aria-label="Run results as JSON"
          className="w-full resize-y rounded-lg border border-gray-200 bg-gray-50 p-3 font-mono text-xs text-gray-600"
        />
      </div>

      <div className="mt-8 flex flex-wrap gap-3">
        <button onClick={() => start()}
          className="rounded-lg bg-blue-600 px-6 py-3 font-semibold text-white transition hover:bg-blue-700">
          New run, new questions
        </button>
        <button onClick={() => { setPhase('idle'); window.scrollTo(0, 0); }}
          className="rounded-lg border border-gray-300 px-6 py-3 font-semibold text-gray-700 transition hover:bg-gray-50">
          Back to the brief
        </button>
        {seed !== null && (
          <span className="self-center font-mono text-xs text-gray-400">seed {seed}</span>
        )}
      </div>
    </div>
  );
}
