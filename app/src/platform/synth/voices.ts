import type { SpriteType } from '../../core/model';

/**
 * Tiny Web Audio "voices": every creature and object answers with its own synthesized sound
 * when it is found — a meow, a croak, the gecko's "chắc chắc", a porcelain ting…
 */

type Voice = (ctx: AudioContext, out: AudioNode, t: number) => void;

interface ToneOpts {
  type?: OscillatorType;
  f0: number;
  f1?: number; // Glide target (exponential)
  dur: number;
  peak?: number;
  attack?: number;
  lowpass?: number;
  bandpass?: number;
  q?: number;
}

function tone(ctx: AudioContext, out: AudioNode, t: number, o: ToneOpts) {
  const osc = ctx.createOscillator();
  osc.type = o.type ?? 'sine';
  osc.frequency.setValueAtTime(o.f0, t);
  if (o.f1) osc.frequency.exponentialRampToValueAtTime(o.f1, t + o.dur);

  const attack = o.attack ?? 0.008;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(o.peak ?? 0.15, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + o.dur);

  let node: AudioNode = osc;
  if (o.lowpass || o.bandpass) {
    const filter = ctx.createBiquadFilter();
    filter.type = o.lowpass ? 'lowpass' : 'bandpass';
    filter.frequency.setValueAtTime(o.lowpass ?? o.bandpass!, t);
    filter.Q.value = o.q ?? 1;
    node.connect(filter);
    node = filter;
  }
  node.connect(gain);
  gain.connect(out);
  osc.start(t);
  osc.stop(t + attack + o.dur + 0.05);
  return osc;
}

let noiseBuffer: AudioBuffer | null = null;

interface NoiseOpts {
  dur: number;
  peak?: number;
  filter?: BiquadFilterType;
  freq: number;
  freq1?: number; // Filter sweep target
  q?: number;
  attack?: number;
}

function noise(ctx: AudioContext, out: AudioNode, t: number, o: NoiseOpts) {
  if (!noiseBuffer || noiseBuffer.sampleRate !== ctx.sampleRate) {
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  }
  const src = ctx.createBufferSource();
  src.buffer = noiseBuffer;

  const filter = ctx.createBiquadFilter();
  filter.type = o.filter ?? 'bandpass';
  filter.frequency.setValueAtTime(o.freq, t);
  if (o.freq1) filter.frequency.exponentialRampToValueAtTime(o.freq1, t + o.dur);
  filter.Q.value = o.q ?? 1.5;

  const attack = o.attack ?? 0.004;
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(o.peak ?? 0.2, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + attack + o.dur);

  src.connect(filter);
  filter.connect(gain);
  gain.connect(out);
  src.start(t, Math.random() * 0.5);
  src.stop(t + attack + o.dur + 0.05);
}

const VOICES: Record<string, Voice> = {
  meow: (ctx, out, t) => {
    const osc = tone(ctx, out, t, { type: 'sawtooth', f0: 480, dur: 0.5, peak: 0.1, attack: 0.05, lowpass: 1500 });
    osc.frequency.linearRampToValueAtTime(760, t + 0.18);
    osc.frequency.linearRampToValueAtTime(430, t + 0.5);
  },
  woof: (ctx, out, t) => {
    [0, 0.2].forEach((d) => {
      tone(ctx, out, t + d, { type: 'sawtooth', f0: 280, f1: 140, dur: 0.12, peak: 0.16, lowpass: 900 });
      noise(ctx, out, t + d, { dur: 0.08, peak: 0.08, freq: 700 });
    });
  },
  hoot: (ctx, out, t) => {
    tone(ctx, out, t, { f0: 370, f1: 340, dur: 0.26, peak: 0.18, attack: 0.06 });
    tone(ctx, out, t + 0.4, { f0: 350, f1: 300, dur: 0.42, peak: 0.16, attack: 0.08 });
  },
  coo: (ctx, out, t) => {
    tone(ctx, out, t, { f0: 290, f1: 340, dur: 0.22, peak: 0.13, attack: 0.05 });
    tone(ctx, out, t + 0.26, { f0: 330, f1: 280, dur: 0.34, peak: 0.12, attack: 0.05 });
  },
  chirp: (ctx, out, t) => {
    [0, 0.1, 0.2].forEach((d, i) => tone(ctx, out, t + d, { f0: 2600 + i * 200, f1: 3900, dur: 0.06, peak: 0.08 }));
  },
  fraank: (ctx, out, t) => {
    tone(ctx, out, t, { type: 'sawtooth', f0: 420, f1: 250, dur: 0.34, peak: 0.12, bandpass: 900, q: 3 });
  },
  kek: (ctx, out, t) => {
    [0, 0.13, 0.26].forEach((d) =>
      tone(ctx, out, t + d, { type: 'sawtooth', f0: 760, f1: 520, dur: 0.08, peak: 0.12, bandpass: 1300, q: 2 })
    );
  },
  croak: (ctx, out, t) => {
    [0, 0.34].forEach((start) => {
      for (let i = 0; i < 6; i++) {
        tone(ctx, out, t + start + i * 0.045, { type: 'square', f0: 120, f1: 92, dur: 0.035, peak: 0.1, lowpass: 750 });
      }
    });
  },
  click: (ctx, out, t) => {
    for (let i = 0; i < 5; i++) noise(ctx, out, t + i * 0.1, { dur: 0.02, peak: 0.35, freq: 2800, q: 6 });
  },
  clack: (ctx, out, t) => {
    [0, 0.09, 0.2].forEach((d) => noise(ctx, out, t + d, { dur: 0.018, peak: 0.3, freq: 3600, q: 5 }));
  },
  squeak: (ctx, out, t) => {
    [0, 0.14].forEach((d) => tone(ctx, out, t + d, { f0: 2400, f1: 3300, dur: 0.1, peak: 0.07 }));
  },
  squeakLow: (ctx, out, t) => {
    [0, 0.12, 0.24].forEach((d) => tone(ctx, out, t + d, { f0: 1300, f1: 2000, dur: 0.08, peak: 0.08 }));
  },
  squeakHigh: (ctx, out, t) => {
    [0, 0.07, 0.14, 0.21].forEach((d) => tone(ctx, out, t + d, { f0: 4600, f1: 5600, dur: 0.035, peak: 0.05 }));
  },
  splash: (ctx, out, t) => {
    noise(ctx, out, t, { dur: 0.32, peak: 0.16, filter: 'lowpass', freq: 1400, freq1: 300 });
    [0.08, 0.16, 0.25].forEach((d, i) => tone(ctx, out, t + d, { f0: 480 + i * 120, f1: 1100 + i * 200, dur: 0.05, peak: 0.07 }));
  },
  buzz: (ctx, out, t) => {
    for (let i = 0; i < 9; i++) {
      tone(ctx, out, t + i * 0.035, { type: 'sawtooth', f0: 170, dur: 0.028, peak: 0.045, lowpass: 700 });
    }
  },
  twinkle: (ctx, out, t) => {
    [1568, 2093, 2637, 3136].forEach((f, i) => tone(ctx, out, t + i * 0.06, { type: 'triangle', f0: f, dur: 0.22, peak: 0.07 }));
  },
  ook: (ctx, out, t) => {
    [0, 0.16, 0.32].forEach((d, i) =>
      tone(ctx, out, t + d, { type: 'sawtooth', f0: 300 + i * 40, f1: 470 + i * 40, dur: 0.11, peak: 0.1, bandpass: 800, q: 2 })
    );
  },
  sniff: (ctx, out, t) => {
    [0, 0.1, 0.2].forEach((d) => noise(ctx, out, t + d, { dur: 0.05, peak: 0.14, freq: 1800, q: 2 }));
  },
  chitter: (ctx, out, t) => {
    for (let i = 0; i < 6; i++) tone(ctx, out, t + i * 0.05, { f0: 3000, f1: 3600, dur: 0.03, peak: 0.06 });
  },
  bloop: (ctx, out, t) => {
    tone(ctx, out, t, { f0: 420, f1: 170, dur: 0.36, peak: 0.12, attack: 0.02 });
  },
  pluck: (ctx, out, t) => {
    [0, 0.12].forEach((d, i) => tone(ctx, out, t + d, { type: 'triangle', f0: 1800 + i * 400, dur: 0.12, peak: 0.08 }));
  },
  hiss: (ctx, out, t) => {
    noise(ctx, out, t, { dur: 0.4, peak: 0.08, filter: 'highpass', freq: 2500, attack: 0.05 });
  },
  whoosh: (ctx, out, t) => {
    noise(ctx, out, t, { dur: 0.32, peak: 0.12, freq: 500, freq1: 2600, q: 1.2, attack: 0.08 });
  },
  jingle: (ctx, out, t) => {
    [2800, 3700, 4200, 5100].forEach((f, i) => tone(ctx, out, t + i * 0.035, { type: 'triangle', f0: f, dur: 0.25, peak: 0.05 }));
  },
  tick: (ctx, out, t) => {
    for (let i = 0; i < 4; i++) noise(ctx, out, t + i * 0.13, { dur: 0.015, peak: 0.3, freq: i % 2 ? 1500 : 2200, q: 8 });
  },
  sand: (ctx, out, t) => {
    noise(ctx, out, t, { dur: 0.6, peak: 0.06, filter: 'highpass', freq: 3200, attack: 0.1 });
  },
  paper: (ctx, out, t) => {
    noise(ctx, out, t, { dur: 0.12, peak: 0.14, freq: 1500, freq1: 3000, q: 0.8 });
    noise(ctx, out, t + 0.13, { dur: 0.14, peak: 0.1, freq: 2200, freq1: 1200, q: 0.8 });
  },
  porcelain: (ctx, out, t) => {
    [2600, 3950, 5200].forEach((f, i) => tone(ctx, out, t, { f0: f, dur: 0.6 - i * 0.12, peak: 0.07 - i * 0.015 }));
  },
  shutter: (ctx, out, t) => {
    noise(ctx, out, t, { dur: 0.012, peak: 0.35, filter: 'highpass', freq: 4000 });
    noise(ctx, out, t + 0.08, { dur: 0.03, peak: 0.25, freq: 1200, q: 3 });
  },
  bell: (ctx, out, t) => {
    [1760, 2640, 3520].forEach((f, i) => tone(ctx, out, t, { f0: f, dur: 0.9 - i * 0.2, peak: 0.08 - i * 0.02 }));
  },
  sizzle: (ctx, out, t) => {
    for (let i = 0; i < 10; i++) noise(ctx, out, t + i * 0.045, { dur: 0.02, peak: 0.08 + Math.random() * 0.08, filter: 'highpass', freq: 5000 });
  },
  thud: (ctx, out, t) => {
    tone(ctx, out, t, { f0: 150, f1: 55, dur: 0.25, peak: 0.25 });
    noise(ctx, out, t, { dur: 0.08, peak: 0.12, filter: 'lowpass', freq: 400 });
  },
};

const VOICE_OF: Partial<Record<SpriteType, keyof typeof VOICES>> = {
  cat: 'meow',
  dog: 'woof',
  owl: 'hoot',
  dove: 'coo',
  butterfly: 'twinkle',
  squirrel: 'chitter',
  turtle: 'splash',
  gecko: 'click',
  chameleon: 'twinkle',
  frog: 'croak',
  snail: 'bloop',
  ladybug: 'buzz',
  mouse: 'squeak',
  koi: 'splash',
  crab: 'clack',
  otter: 'squeakLow',
  kingfisher: 'chirp',
  bat: 'squeakHigh',
  monkey: 'ook',
  moth: 'buzz',
  dragonfly: 'buzz',
  spider: 'pluck',
  heron: 'fraank',
  hornbill: 'kek',
  pangolin: 'sniff',
  'monitor-lizard': 'hiss',
  jellyfish: 'splash',
  seahorse: 'splash',
  mantis: 'clack',
  firefly: 'twinkle',
  civet: 'sniff',
  sunbird: 'chirp',
  'slow-loris': 'squeak',
  colugo: 'whoosh',
  'stick-insect': 'clack',
  key: 'jingle',
  compass: 'tick',
  letter: 'paper',
  'pocket-watch': 'tick',
  quill: 'whoosh',
  teacup: 'porcelain',
  'coin-pouch': 'jingle',
  spyglass: 'whoosh',
  vase: 'porcelain',
  scroll: 'paper',
  'magnifying-glass': 'whoosh',
  'paper-crane': 'paper',
  'paper-boat': 'paper',
  durian: 'thud',
  'fortune-cat': 'bell',
  'red-envelope': 'paper',
  tiffin: 'porcelain',
  satay: 'sizzle',
  kite: 'paper',
  'vintage-camera': 'shutter',
  hourglass: 'sand',
  deerstalker: 'whoosh',
  saola: 'sniff',
  'water-buffalo': 'thud',
  'conical-hat': 'paper',
  lantern: 'twinkle',
  cyclo: 'tick',
};

export function playCreatureVoice(ctx: AudioContext, out: AudioNode, type: SpriteType | undefined, when: number) {
  const voice = type ? VOICE_OF[type] : undefined;
  if (voice) VOICES[voice](ctx, out, when);
}
