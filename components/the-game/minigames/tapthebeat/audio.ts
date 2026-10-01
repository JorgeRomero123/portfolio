// Tiny Web Audio groove for "Tap the beat": an original, calm ~96 BPM loop synthesized live
// (kick/snare/hats from oscillators + noise, a triangle bassline and a soft maj7 pad).
// Everything is scheduled up front on the AudioContext clock, so timing never drifts.

export function createAudio(): AudioContext | null {
  try {
    const Ctx =
      window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    void ctx.resume().catch(() => {});
    return ctx;
  } catch {
    return null;
  }
}

/** Seconds between the context clock and what the ear hears (capped; Safari reports none). */
export function outputLatency(ctx: AudioContext): number {
  const l = (ctx.outputLatency || 0) + (ctx.baseLatency || 0);
  return Math.min(0.25, Math.max(0, l));
}

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12);

// Dmaj7 → Bm7 → Gmaj7 → A7sus4, one chord per bar.
const CHORDS = [
  [62, 66, 69, 73],
  [59, 62, 66, 69],
  [55, 59, 62, 66],
  [57, 62, 64, 67],
];
const ROOTS = [38, 47, 43, 45];

interface SongOpts {
  /** Context time of beat 0 (first count-in click). */
  t0: number;
  spb: number;
  countIn: number;
  bars: number;
  /** Kick beats, counted from the end of the count-in. */
  kicks: number[];
  /** Bars played in double time: snare on every off-beat, sixteenth hats, a driving eighth-note bass. */
  doubleBars?: number[];
}

export function scheduleSong(ctx: AudioContext, { t0, spb, countIn, bars, kicks, doubleBars = [] }: SongOpts) {
  const master = ctx.createGain();
  master.gain.value = 0.55;
  const comp = ctx.createDynamicsCompressor();
  master.connect(comp).connect(ctx.destination);

  const len = Math.floor(ctx.sampleRate * 0.4);
  const noise = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = noise.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;

  const env = (g: GainNode, t: number, peak: number, attack: number, decay: number) => {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + attack);
    g.gain.exponentialRampToValueAtTime(0.0001, t + attack + decay);
  };

  const kick = (t: number) => {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.frequency.setValueAtTime(160, t);
    o.frequency.exponentialRampToValueAtTime(48, t + 0.12);
    env(g, t, 0.9, 0.004, 0.32);
    o.connect(g).connect(master);
    o.start(t);
    o.stop(t + 0.4);
  };

  const noiseHit = (t: number, freq: number, peak: number, decay: number) => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    const f = ctx.createBiquadFilter();
    f.type = 'highpass';
    f.frequency.value = freq;
    const g = ctx.createGain();
    env(g, t, peak, 0.002, decay);
    s.connect(f).connect(g).connect(master);
    s.start(t);
    s.stop(t + decay + 0.02);
  };

  const tone = (t: number, freq: number, type: OscillatorType, peak: number, decay: number, dest: AudioNode = master) => {
    const o = ctx.createOscillator();
    o.type = type;
    o.frequency.value = freq;
    const g = ctx.createGain();
    env(g, t, peak, 0.006, decay);
    o.connect(g).connect(dest);
    o.start(t);
    o.stop(t + decay + 0.02);
  };

  const snare = (t: number) => {
    noiseHit(t, 1600, 0.2, 0.14);
    tone(t, 200, 'triangle', 0.12, 0.08);
  };

  const bassLp = ctx.createBiquadFilter();
  bassLp.type = 'lowpass';
  bassLp.frequency.value = 520;
  bassLp.connect(master);
  const bass = (t: number, note: number, dur: number) => tone(t, midi(note), 'triangle', 0.32, dur, bassLp);

  const padLp = ctx.createBiquadFilter();
  padLp.type = 'lowpass';
  padLp.frequency.value = 1300;
  padLp.connect(master);
  const pad = (t: number, notes: number[], dur: number) => {
    for (const n of notes) {
      for (const detune of [-5, 5]) {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = midi(n);
        o.detune.value = detune;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.0001, t);
        g.gain.linearRampToValueAtTime(0.022, t + 0.25);
        g.gain.setValueAtTime(0.022, t + dur - 0.2);
        g.gain.linearRampToValueAtTime(0.0001, t + dur + 0.15);
        o.connect(g).connect(padLp);
        o.start(t);
        o.stop(t + dur + 0.2);
      }
    }
  };

  const at = (beat: number) => t0 + beat * spb;

  // Count-in: four stick clicks, the first one higher.
  for (let b = 0; b < countIn; b++) tone(at(b), b === 0 ? 1760 : 1320, 'triangle', 0.12, 0.05);

  for (const k of kicks) kick(at(countIn + k));

  for (let bar = 0; bar < bars; bar++) {
    const b0 = countIn + bar * 4;
    const c = bar % 4;
    pad(at(b0), CHORDS[c], spb * 4);
    if (doubleBars.includes(bar)) {
      for (let e = 0; e < 8; e++) bass(at(b0 + e / 2), ROOTS[c] + (e % 4 === 3 ? 12 : 0), spb * 0.35);
      for (let b = 0; b < 4; b++) snare(at(b0 + b + 0.5));
      for (let e = 0; e < 16; e++) noiseHit(at(b0 + e / 4), 7500, e % 2 ? 0.03 : 0.055, 0.03);
      continue;
    }
    bass(at(b0), ROOTS[c], spb * 0.9);
    bass(at(b0 + 1.5), ROOTS[c], spb * 0.4);
    bass(at(b0 + 2.5), ROOTS[c] + 12, spb * 0.4);
    bass(at(b0 + 3), ROOTS[c] + 7, spb * 0.8);
    snare(at(b0 + 1));
    snare(at(b0 + 3));
    for (let e = 0; e < 8; e++) noiseHit(at(b0 + e / 2), 7500, e % 2 ? 0.035 : 0.06, 0.035);
  }
  // Resolve on the tonic after the last bar.
  const end = countIn + bars * 4;
  pad(at(end), CHORDS[0], spb * 3);
  bass(at(end), ROOTS[0], spb * 2.5);
}
