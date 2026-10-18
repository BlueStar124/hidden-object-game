export function synthFound(ctx: AudioContext, masterGain: GainNode, combo: number = 1): void {
  const now = ctx.currentTime;
  const baseFreq = 880 * Math.pow(1.15, Math.min(combo - 1, 4));

  // Primary bell tone
  const osc1 = ctx.createOscillator();
  const gain1 = ctx.createGain();
  osc1.type = 'sine';
  osc1.frequency.setValueAtTime(baseFreq, now);
  osc1.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, now + 0.1);

  gain1.gain.setValueAtTime(0.4, now);
  gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

  osc1.connect(gain1);
  gain1.connect(masterGain);
  osc1.start(now);
  osc1.stop(now + 0.6);

  // Harmonic sparkle
  const osc2 = ctx.createOscillator();
  const gain2 = ctx.createGain();
  osc2.type = 'triangle';
  osc2.frequency.setValueAtTime(baseFreq * 2, now + 0.05);

  gain2.gain.setValueAtTime(0.2, now + 0.05);
  gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

  osc2.connect(gain2);
  gain2.connect(masterGain);
  osc2.start(now + 0.05);
  osc2.stop(now + 0.8);
}

export function synthWrong(ctx: AudioContext, masterGain: GainNode): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sawtooth';
  osc.frequency.setValueAtTime(140, now);
  osc.frequency.exponentialRampToValueAtTime(80, now + 0.25);

  gain.gain.setValueAtTime(0.2, now);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.25);
}

export function synthHint(ctx: AudioContext, masterGain: GainNode): void {
  const now = ctx.currentTime;
  const notes = [523.25, 659.25, 783.99, 1046.5];
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + idx * 0.08;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.25, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.4);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.4);
  });
}

export function synthPageTurn(ctx: AudioContext, masterGain: GainNode): void {
  const now = ctx.currentTime;
  const bufferSize = ctx.sampleRate * 0.45;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'bandpass';
  filter.frequency.setValueAtTime(800, now);
  filter.frequency.exponentialRampToValueAtTime(300, now + 0.45);
  filter.Q.value = 2.0;

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.01, now);
  gain.gain.linearRampToValueAtTime(0.35, now + 0.1);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  noise.start(now);
  noise.stop(now + 0.45);
}

export function synthFog(ctx: AudioContext, masterGain: GainNode): void {
  const now = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, now);
  osc.frequency.exponentialRampToValueAtTime(180, now + 0.6);
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.exponentialRampToValueAtTime(0.14, now + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);
  osc.connect(gain);
  gain.connect(masterGain);
  osc.start(now);
  osc.stop(now + 0.65);
}

export function synthCreature(ctx: AudioContext, masterGain: GainNode): void {
  const now = ctx.currentTime;
  [0, 0.11].forEach((delay, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + 0.12 + delay;
    const base = idx === 0 ? 1760 : 2093;

    osc.type = 'sine';
    osc.frequency.setValueAtTime(base, t);
    osc.frequency.exponentialRampToValueAtTime(base * 1.35, t + 0.06);

    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.18, t + 0.015);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.1);
  });
}

export function synthRustle(ctx: AudioContext, masterGain: GainNode): void {
  const now = ctx.currentTime;
  const bufferSize = Math.floor(ctx.sampleRate * 0.28);
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < bufferSize; i++) {
    data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.7 ? 1 : 0.35);
  }

  const noise = ctx.createBufferSource();
  noise.buffer = buffer;

  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.setValueAtTime(2200, now);

  const gain = ctx.createGain();
  gain.gain.setValueAtTime(0.001, now);
  gain.gain.linearRampToValueAtTime(0.16, now + 0.04);
  gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

  noise.connect(filter);
  filter.connect(gain);
  gain.connect(masterGain);

  noise.start(now);
  noise.stop(now + 0.28);
}

export function synthVictory(ctx: AudioContext, masterGain: GainNode): void {
  const now = ctx.currentTime;
  const chords = [523.25, 659.25, 783.99, 1046.5, 1318.51];
  chords.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    const t = now + idx * 0.1;

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    gain.gain.setValueAtTime(0.3, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.9);

    osc.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.9);
  });
}

