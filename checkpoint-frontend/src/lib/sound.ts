
export type SoundName = "correct" | "wrong" | "levelup" | "done" | "chest" | "click";

type Note = { f: number; at: number; dur: number; type?: OscillatorType; gain?: number };

const PATTERNS: Record<SoundName, Note[]> = {
  correct: [
    { f: 660, at: 0, dur: 0.1 },
    { f: 880, at: 0.09, dur: 0.16 },
  ],
  wrong: [
    { f: 220, at: 0, dur: 0.14, type: "triangle" },
    { f: 165, at: 0.12, dur: 0.2, type: "triangle" },
  ],
  levelup: [
    { f: 523, at: 0, dur: 0.12 },
    { f: 659, at: 0.11, dur: 0.12 },
    { f: 784, at: 0.22, dur: 0.12 },
    { f: 1047, at: 0.33, dur: 0.28 },
  ],
  done: [
    { f: 587, at: 0, dur: 0.14 },
    { f: 784, at: 0.13, dur: 0.24 },
  ],
  chest: [
    { f: 392, at: 0, dur: 0.1, type: "square", gain: 0.5 },
    { f: 523, at: 0.1, dur: 0.1, type: "square", gain: 0.5 },
    { f: 784, at: 0.2, dur: 0.1, type: "square", gain: 0.5 },
    { f: 1047, at: 0.32, dur: 0.3 },
  ],
  click: [{ f: 520, at: 0, dur: 0.05, gain: 0.5 }],
};

let context: AudioContext | null = null;

export function soundIsOn(): boolean {
  try {
    return localStorage.getItem("checkpoint_sound") === "1";
  } catch {
    return false;
  }
}

function reducedMotion(): boolean {
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

export function playSound(name: SoundName): void {
  if (!soundIsOn() || reducedMotion()) return;
  try {
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    context = context ?? new Ctor();
    if (context.state === "suspended") void context.resume();
    const start = context.currentTime + 0.01;
    for (const note of PATTERNS[name]) {
      const osc = context.createOscillator();
      const gain = context.createGain();
      osc.type = note.type ?? "sine";
      osc.frequency.value = note.f;
      const peak = 0.12 * (note.gain ?? 1);
      gain.gain.setValueAtTime(0.0001, start + note.at);
      gain.gain.exponentialRampToValueAtTime(peak, start + note.at + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + note.at + note.dur);
      osc.connect(gain).connect(context.destination);
      osc.start(start + note.at);
      osc.stop(start + note.at + note.dur + 0.05);
    }
  } catch {
  }
}
