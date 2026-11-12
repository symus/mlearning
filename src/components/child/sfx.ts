/**
 * Gentle, age-appropriate sound effects synthesised with Web Audio (no files, works offline).
 * Short and soft by design: no harsh buzzers for wrong answers.
 */
type Cue = "tap" | "correct" | "tryAgain" | "levelUp" | "celebrate" | "reward" | "unlock";

let ctx: AudioContext | null = null;
function audio(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctx) return null;
  ctx ??= new Ctx();
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

const hz = (midi: number) => 440 * Math.pow(2, (midi - 69) / 12);

function tone(c: AudioContext, midi: number, at: number, dur: number, type: OscillatorType = "sine", vol = 0.18) {
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = hz(midi);
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(vol, at + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(c.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
}

const CUES: Record<Cue, [number, number, number][]> = {
  // [midi note, start offset (s), duration (s)]
  tap: [[84, 0, 0.06]],
  correct: [[76, 0, 0.18], [83, 0.09, 0.3]],
  tryAgain: [[64, 0, 0.18], [62, 0.12, 0.25]],
  levelUp: [[72, 0, 0.12], [76, 0.08, 0.12], [79, 0.16, 0.25]],
  unlock: [[79, 0, 0.12], [84, 0.1, 0.35]],
  reward: [[84, 0, 0.1], [88, 0.07, 0.1], [91, 0.14, 0.1], [96, 0.21, 0.4]],
  celebrate: [[72, 0, 0.15], [76, 0.12, 0.15], [79, 0.24, 0.15], [84, 0.36, 0.5], [79, 0.36, 0.5], [76, 0.36, 0.5]],
};

export function playSfx(cue: Cue, enabled = true) {
  if (!enabled) return;
  const c = audio();
  if (!c) return;
  const now = c.currentTime + 0.01;
  for (const [m, off, dur] of CUES[cue]) tone(c, m, now + off, dur, cue === "tap" ? "triangle" : "sine");
}
