/**
 * Tiny in-browser music engine (Web Audio API). No audio files: every song gets an original
 * tune generated from a pentatonic scale, so any notes played together sound pleasant.
 *
 *   melody  - one note per word, following a contour pattern per line, ending on the home note
 *   bass    - a I-IV-V-I progression, one note per bar
 *   beat    - a soft kick on beat 1 and light ticks on the other beats
 */

export type Instrument = "xylophone" | "piano" | "marimba";

export interface TuneOptions {
  bpm: number;
  instrument: Instrument;
}

export interface NoteEvent {
  /** Seconds from the start of the line. */
  at: number;
  word: number;
  freq: number;
  beats: number;
}

const midiToFreq = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

// C major pentatonic across two octaves (C4 D4 E4 G4 A4 C5 D5 E5).
const SCALE = [60, 62, 64, 67, 69, 72, 74, 76];
// Melodic shapes (scale-degree indexes). Different lines use different shapes; all end near home.
const CONTOURS = [
  [0, 2, 4, 2, 3, 4, 5, 4, 2, 1],
  [4, 4, 3, 2, 3, 4, 2, 1, 2, 0],
  [2, 3, 4, 5, 4, 3, 2, 4, 3, 1],
  [5, 4, 2, 4, 3, 2, 1, 2, 1, 0],
];
// Bass roots for bars: C, F, G, C (one bar = 4 beats).
const BASS = [48, 53, 55, 48];

/** Words in a lyric line (punctuation stays attached to its word). */
export const splitWords = (text: string) => text.split(/\s+/).filter(Boolean);

/** Compose the notes for one line. The last word is held for 2 beats, then a 1-beat rest. */
export function composeLine(text: string, lineIndex: number, bpm: number): { notes: NoteEvent[]; beats: number; seconds: number } {
  const words = splitWords(text);
  const beat = 60 / bpm;
  const contour = CONTOURS[lineIndex % CONTOURS.length];
  const notes: NoteEvent[] = words.map((_, w) => {
    const isLast = w === words.length - 1;
    // End odd lines on E (a "question"), even lines on C (an "answer").
    const degree = isLast ? (lineIndex % 2 === 0 ? 2 : 0) : contour[w % contour.length];
    return { at: w * beat, word: w, freq: midiToFreq(SCALE[degree]), beats: isLast ? 2 : 1 };
  });
  const beats = words.length + 2; // held last note (+1) and a rest (+1)
  return { notes, beats, seconds: beats * beat };
}

export class MusicEngine {
  private ctx: AudioContext;
  private master: GainNode;
  private sources = new Set<AudioScheduledSourceNode>();

  constructor() {
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    this.ctx = new Ctx();
    this.master = this.ctx.createGain();
    this.master.gain.value = 0.55;
    this.master.connect(this.ctx.destination);
  }

  get now() {
    return this.ctx.currentTime;
  }

  async resume() {
    if (this.ctx.state !== "running") await this.ctx.resume();
  }

  /** Stop everything already scheduled. */
  stopAll() {
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
    this.sources.clear();
  }

  close() {
    this.stopAll();
    void this.ctx.close();
  }

  private track(node: AudioScheduledSourceNode) {
    this.sources.add(node);
    node.onended = () => this.sources.delete(node);
  }

  /** A pitched note with an instrument-like envelope. */
  note(freq: number, when: number, seconds: number, instrument: Instrument, volume = 0.35) {
    const ctx = this.ctx;
    const out = ctx.createGain();
    out.connect(this.master);
    const decay = instrument === "piano" ? Math.min(1.4, seconds + 0.6) : instrument === "marimba" ? 0.6 : 0.45;
    out.gain.setValueAtTime(0.0001, when);
    out.gain.exponentialRampToValueAtTime(volume, when + 0.01);
    out.gain.exponentialRampToValueAtTime(0.0001, when + decay);

    const partials: [number, OscillatorType, number][] =
      instrument === "xylophone"
        ? [[1, "sine", 1], [3.9, "sine", 0.25], [9.2, "sine", 0.08]]
        : instrument === "marimba"
          ? [[1, "sine", 1], [4, "sine", 0.35]]
          : [[1, "triangle", 1], [2, "sine", 0.3], [3, "sine", 0.1]];
    for (const [mult, type, level] of partials) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.type = type;
      osc.frequency.value = freq * mult;
      g.gain.value = level;
      osc.connect(g).connect(out);
      osc.start(when);
      osc.stop(when + decay + 0.05);
      this.track(osc);
    }
  }

  /** Soft bass note. */
  bass(midi: number, when: number, seconds: number) {
    const ctx = this.ctx;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = "triangle";
    osc.frequency.value = midiToFreq(midi);
    g.gain.setValueAtTime(0.0001, when);
    g.gain.exponentialRampToValueAtTime(0.18, when + 0.03);
    g.gain.exponentialRampToValueAtTime(0.0001, when + seconds * 0.95);
    osc.connect(g).connect(this.master);
    osc.start(when);
    osc.stop(when + seconds);
    this.track(osc);
  }

  /** Kick (strong beat) or tick (other beats). */
  drum(when: number, strong: boolean) {
    const ctx = this.ctx;
    if (strong) {
      const osc = ctx.createOscillator();
      const g = ctx.createGain();
      osc.frequency.setValueAtTime(140, when);
      osc.frequency.exponentialRampToValueAtTime(45, when + 0.12);
      g.gain.setValueAtTime(0.35, when);
      g.gain.exponentialRampToValueAtTime(0.0001, when + 0.18);
      osc.connect(g).connect(this.master);
      osc.start(when);
      osc.stop(when + 0.2);
      this.track(osc);
      return;
    }
    const len = Math.floor(ctx.sampleRate * 0.03);
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    const filter = ctx.createBiquadFilter();
    const g = ctx.createGain();
    src.buffer = buf;
    filter.type = "highpass";
    filter.frequency.value = 6000;
    g.gain.value = 0.08;
    src.connect(filter).connect(g).connect(this.master);
    src.start(when);
    this.track(src);
  }

  /** Schedule one composed line (melody + bass + beat) starting at `when`. */
  playLine(line: ReturnType<typeof composeLine>, when: number, bpm: number, instrument: Instrument, lineIndex: number) {
    const beat = 60 / bpm;
    for (const n of line.notes) this.note(n.freq, when + n.at, n.beats * beat, instrument);
    for (let b = 0; b < line.beats; b++) this.drum(when + b * beat, b % 4 === 0);
    for (let bar = 0; bar * 4 < line.beats; bar++) {
      const beatsInBar = Math.min(4, line.beats - bar * 4);
      this.bass(BASS[(lineIndex + bar) % BASS.length], when + bar * 4 * beat, beatsInBar * beat);
    }
  }

  /** A short rising "ta-da" at the end of a song. */
  fanfare(when: number, instrument: Instrument) {
    [72, 76, 79, 84].forEach((m, i) => this.note(midiToFreq(m), when + i * 0.12, 0.4, instrument, 0.3));
  }
}
