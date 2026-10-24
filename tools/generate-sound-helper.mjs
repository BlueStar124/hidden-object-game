import fs from 'node:fs';

// Phone speakers are much quieter than laptop ones: lift every sound by the same +6 dB
// (the mix between sounds is unchanged; the loudest peak stays well below clipping).
export const PHONE_GAIN = 2;

export async function bundleSynth(esbuild, repoRoot, audioSrc, voicesSrc) {
  const exposeVoices = {
    name: 'expose-voices',
    setup(build) {
      // VOICE_OF is exposed for the asset generator if not already exported
      build.onLoad({ filter: /synth[\\/]voices\.ts$/ }, (args) => {
        const text = fs.readFileSync(args.path, 'utf8');
        const contents = /export\s*\{\s*VOICE_OF\s*\}/.test(text) ? text : `${text}\nexport { VOICE_OF };\n`;
        return { contents, loader: 'ts' };
      });
    },
  };
  const out = await esbuild.build({
    stdin: {
      contents: `export { synth } from ${JSON.stringify(audioSrc.replace(/\\/g, '/'))};\nexport { VOICE_OF } from ${JSON.stringify(voicesSrc.replace(/\\/g, '/'))};\n`,
      resolveDir: repoRoot,
      loader: 'ts',
    },
    bundle: true,
    write: false,
    format: 'iife',
    globalName: 'Synth',
    platform: 'browser',
    plugins: [exposeVoices],
  });
  return out.outputFiles[0].text;
}

/** Runs in Chromium: renders one synth call into PCM samples with an OfflineAudioContext. */
export async function renderInBrowser({ call, arg, seconds, sampleRate, gain }) {
  const { synth } = window.Synth;
  const ctx = new OfflineAudioContext(1, Math.ceil(sampleRate * seconds), sampleRate);
  // The synth builds its context lazily with `new AudioContext()`: hand it the offline one
  window.AudioContext = function () {
    return ctx;
  };
  ctx.resume = () => Promise.resolve();
  synth.ctx = null;
  synth.masterGain = null;
  synth.setSoundEnabled(true);
  synth[call](arg);
  const buffer = await ctx.startRendering();
  const data = buffer.getChannelData(0);
  // Trim the silent tail (keep any intentional lead-in, e.g. the voice waits for the chime)
  let end = data.length;
  while (end > 0 && Math.abs(data[end - 1]) < 1e-4) end--;
  end = Math.min(data.length, end + Math.round(sampleRate * 0.02));
  return Array.from(data.subarray(0, end), (v) => Math.round(Math.max(-1, Math.min(1, v * gain)) * 32767));
}

export function wav(samples, sampleRate) {
  const bytes = samples.length * 2;
  const buf = Buffer.alloc(44 + bytes);
  buf.write('RIFF', 0);
  buf.writeUInt32LE(36 + bytes, 4);
  buf.write('WAVE', 8);
  buf.write('fmt ', 12);
  buf.writeUInt32LE(16, 16);
  buf.writeUInt16LE(1, 20); // PCM
  buf.writeUInt16LE(1, 22); // mono
  buf.writeUInt32LE(sampleRate, 24);
  buf.writeUInt32LE(sampleRate * 2, 28);
  buf.writeUInt16LE(2, 32);
  buf.writeUInt16LE(16, 34);
  buf.write('data', 36);
  buf.writeUInt32LE(bytes, 40);
  samples.forEach((s, i) => buf.writeInt16LE(s, 44 + i * 2));
  return buf;
}

