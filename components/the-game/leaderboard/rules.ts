// Speedrun leaderboard rules for /the-game, shared by the API routes and the browser.
// Pure (no React, no network): limits, validation, the profanity check, countries and time format.
import { RIVAL_LAP, RIVAL_LOSS, RIVAL_WIN_BACK } from '../race';
import { SECTION_IDS } from '../types';

/** A won race can't plausibly be faster than this (11 mini-games plus a lap of the board). */
export const MIN_WIN_MS = 3 * 60_000;
/** Jorge can finish his lap in a handful of quick turns (skipped games make it quicker still). */
export const MIN_LOSS_MS = 20_000;
/** Matches the table's check constraint. */
export const MAX_RUN_MS = 7 * 24 * 3_600_000;
/** Winning times above this still count for the percentile but never enter the curve. */
export const MAX_CURVE_MS = 6 * 3_600_000;
/** Below this many recorded wins there is no curve, only a sentence. */
export const CURVE_MIN_WINS = 20;
/** Rows shown on the leaderboard. */
export const BOARD_SIZE = 10;

export const NICK_MIN = 2;
export const NICK_MAX = 20;

export type Outcome = 'won' | 'lost';

export interface RunInput {
  outcome: Outcome;
  timeMs: number;
  losses: number;
  stamps: number;
}

const STAMPS = SECTION_IDS.length;

// Loss caps from the race rules (race.ts), as generous upper bounds: they ignore the RIVAL_TURN
// tiles Jorge also takes every turn, which only lower the real maximum.
/** A win: after every lost game (+RIVAL_LOSS) and all 11 won ones (−RIVAL_WIN_BACK) he is still short of the line. */
export const MAX_WIN_LOSSES = Math.floor((RIVAL_LAP - 1 + STAMPS * RIVAL_WIN_BACK) / RIVAL_LOSS);
/** A lost race: he was short of the line before the last lost game, with at most 10 won ones. */
export const MAX_LOST_LOSSES = Math.floor((RIVAL_LAP - 1 + (STAMPS - 1) * RIVAL_WIN_BACK) / RIVAL_LOSS) + 1;

const int = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

/**
 * Checks a finished race against the race rules (race.ts). A win is all 11 stamps with any loss
 * count up to MAX_WIN_LOSSES. A lost race is at most 10 stamps with any loss count up to
 * MAX_LOST_LOSSES, including zero: Jorge advances every turn, so turns alone can beat you.
 * There is deliberately no check that the losses, stamps and turns add up to a finished lap:
 * the browser reports all of them, so it would only reject honest runs after a bookkeeping slip
 * while a forger simply sends consistent numbers.
 */
export function validateRun(raw: unknown): { ok: true; run: RunInput } | { ok: false; error: string } {
  if (!raw || typeof raw !== 'object') return { ok: false, error: 'bad_body' };
  const r = raw as Record<string, unknown>;
  const { outcome, timeMs, losses, stamps } = r;
  if (outcome !== 'won' && outcome !== 'lost') return { ok: false, error: 'bad_outcome' };
  if (!int(timeMs) || !int(losses) || !int(stamps)) return { ok: false, error: 'bad_numbers' };
  if (outcome === 'won') {
    if (stamps !== STAMPS || losses < 0 || losses > MAX_WIN_LOSSES) return { ok: false, error: 'bad_score' };
    if (timeMs < MIN_WIN_MS || timeMs > MAX_RUN_MS) return { ok: false, error: 'implausible_time' };
  } else {
    if (stamps < 0 || stamps >= STAMPS || losses < 0 || losses > MAX_LOST_LOSSES) return { ok: false, error: 'bad_score' };
    if (timeMs < MIN_LOSS_MS || timeMs > MAX_RUN_MS) return { ok: false, error: 'implausible_time' };
  }
  return { ok: true, run: { outcome, timeMs, losses, stamps } };
}

// ── Nicknames ───────────────────────────────────────────────────────────────────────────────
/** Letters (any script), digits, spaces and . _ - only. */
const NICK_CHARS = /^[\p{L}\p{N} ._-]+$/u;

/** Trims and collapses runs of spaces. */
export const tidyNickname = (s: string) => s.normalize('NFC').trim().replace(/\s+/g, ' ');

export type NicknameError = 'length' | 'chars' | 'rude';

export function nicknameError(raw: string): NicknameError | null {
  const s = tidyNickname(raw);
  const len = Array.from(s).length;
  if (len < NICK_MIN || len > NICK_MAX) return 'length';
  if (!NICK_CHARS.test(s) || !/[\p{L}\p{N}]/u.test(s)) return 'chars';
  if (isRude(s)) return 'rude';
  return null;
}

// A basic profanity filter (English and Spanish), not a moderation system. Matching runs on a
// folded form (lower case, no accents, common leetspeak undone, separators dropped) so "F.u_c-k"
// and "sh1t" are caught. Short words that hide inside innocent ones are matched as whole words.
const RUDE_ANYWHERE = [
  'fuck', 'shit', 'cunt', 'bitch', 'nigg', 'fagg', 'whore', 'slut', 'nazi', 'hitler', 'pussy',
  'penis', 'vagina', 'porn', 'asshole', 'bastard', 'retard', 'wank', 'pendej', 'verga', 'chinga',
  'cabron', 'mierda', 'culero', 'maricon', 'ojete', 'panocha', 'pinche', 'zorra', 'gilipollas',
];
// Whole words only: as substrings they hide in innocent words (computadora, vehículo, grape).
const RUDE_WORDS = [
  'ass', 'fag', 'cum', 'tit', 'tits', 'sex', 'kkk', 'dick', 'cock', 'rape', 'puta', 'puto', 'putas',
  'putos', 'culo', 'joto', 'mamon', 'cono', 'polla', 'perra', 'mamada', 'naco',
];

const LEET: Record<string, string> = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', $: 's', '!': 'i' };
const fold = (s: string) =>
  s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[013457@$!]/g, (c) => LEET[c] ?? c);

const ANYWHERE = RUDE_ANYWHERE.map(fold);

export function isRude(s: string): boolean {
  const folded = fold(s);
  const squashed = folded.replace(/[^a-z]/g, '');
  if (ANYWHERE.some((w) => squashed.includes(w))) return true;
  return folded.split(/[^a-z]+/).some((w) => RUDE_WORDS.includes(w));
}

// ── Countries ───────────────────────────────────────────────────────────────────────────────
/** ISO 3166-1 alpha-2, every officially assigned code. Names come from Intl.DisplayNames. */
export const COUNTRY_CODES = (
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ ' +
  'CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR ' +
  'GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP ' +
  'KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT ' +
  'MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW ' +
  'SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG ' +
  'UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'
).split(' ');
const COUNTRY_SET = new Set(COUNTRY_CODES);

export const isCountry = (v: unknown): v is string => typeof v === 'string' && COUNTRY_SET.has(v);

/** Flag emoji from regional indicator symbols. */
export const flagOf = (code: string) =>
  String.fromCodePoint(...Array.from(code.toUpperCase()).map((c) => 0x1f1e6 + c.charCodeAt(0) - 65));

// ── Time ────────────────────────────────────────────────────────────────────────────────────
/** 7:04.3 · 1:02:09 */
export function formatTime(ms: number): string {
  const t = Math.max(0, Math.round(ms / 100));
  const tenths = t % 10;
  const secs = Math.floor(t / 10);
  const h = Math.floor(secs / 3600);
  const m = Math.floor((secs % 3600) / 60);
  const s = secs % 60;
  const ss = String(s).padStart(2, '0');
  return h > 0 ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}.${tenths}`;
}

/** Axis ticks: 7m · 1h 05m */
export function formatMinutes(ms: number): string {
  const total = Math.round(ms / 60_000);
  const h = Math.floor(total / 60);
  const m = total % 60;
  return h > 0 ? `${h}h ${String(m).padStart(2, '0')}m` : `${m}m`;
}
