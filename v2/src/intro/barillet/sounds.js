// The sample files of the sequence (public/assets/sounds, all CC0, see
// LICENSES.md there) and what each event is made of. A recording that holds
// several events (a reload, a run of ratchet clicks, a burst of shots) is cut
// at its onsets when it loads, so every slice can be picked on its own.

export const FILES = {
  shot: ['shot-357-tail.mp3', 'shot-357.mp3'],
  cock: ['cock.mp3'],
  ratchet: ['ratchet.mp3'],
  handling: ['reload.mp3'],
  insert: ['insert.wav'],
  glass: ['glass-bottle.mp3', 'glass-break.wav'],
  debris: ['impactGlass_heavy_000.ogg', 'impactGlass_heavy_001.ogg', 'impactGlass_heavy_002.ogg'],
  ricochet: ['ricochet-1.mp3', 'ricochet-2.mp3'],
  whizz: ['whizz.mp3'],
}

// Files that may hold several events: the shortest gap between two onsets
// (seconds), how loud an onset must be relative to the loudest, and the
// shortest slice worth keeping
export const SPLIT = {
  ratchet: { gap: 0.06, level: 0.25, min: 0.02 },
  handling: { gap: 0.12, level: 0.3, min: 0.04 },
  cock: { gap: 0.08, level: 0.3, min: 0.03 },
  ricochet: { gap: 0.3, level: 0.4, min: 0.1 },
}

const jitter = (cents) => (Math.random() * 2 - 1) * cents

/**
 * Each event as layers. `sample` names a slice set in FILES; `synth` names a
 * fallback or an added synthesised layer. Offsets in seconds from the call.
 */
export const EVENTS = {
  // A pre-mech click, one body with its own tail, a sub under it, and the room's echo
  shot: () => [
    { synth: 'click', at: 0, gain: 0.25, arg: 2900 },
    { sample: 'shot', at: 0.02, gain: 0.95, detune: jitter(20), verb: 0.6, synth: 'shot' },
    { synth: 'sub', at: 0.02, gain: 0.5 },
  ],
  shatter: () => [
    { sample: 'glass', at: 0.03, gain: 0.85, detune: jitter(30), synth: 'glass' },
    { sample: 'debris', at: 0.11, gain: 0.3, detune: jitter(60) },
    { sample: 'debris', at: 0.22, gain: 0.22, detune: jitter(60) },
  ],
  miss: () => [
    { sample: 'whizz', at: 0.03, gain: 0.35 },
    { sample: 'ricochet', at: 0.045, gain: 0.45, highpass: 600, detune: jitter(50), synth: 'ricochet' },
  ],
  dry: () => [{ sample: 'cock', at: 0, gain: 0.35, detune: 120, maxDuration: 0.1, synth: 'click', arg: 2200 }],
  cock: () => [{ sample: 'cock', at: 0, gain: 0.6, detune: jitter(30), maxDuration: 0.25, synth: 'click', arg: 2900 }],
  latch: () => [{ sample: 'handling', at: 0, gain: 0.5, maxDuration: 0.12, detune: jitter(40), synth: 'click', arg: 2600 }],
  swing: () => [
    { synth: 'swing', at: 0, gain: 1 },
    { sample: 'handling', at: 0.05, gain: 0.3, maxDuration: 0.2, detune: -80 },
  ],
  knock: () => [{ sample: 'handling', at: 0, gain: 0.6, maxDuration: 0.15, detune: -200, synth: 'click', arg: 1200 }],
  insert: () => [{ sample: 'insert', at: 0, gain: 0.6, detune: jitter(80), synth: 'insert' }],
  close: () => [
    { sample: 'handling', at: 0, gain: 0.85, maxDuration: 0.2, detune: -120, synth: 'close' },
    { synth: 'thud', at: 0.005, gain: 0.6 },
  ],
  ratchet: (omega = 10) => [
    { sample: 'ratchet', at: 0, gain: 0.3 + 0.5 * Math.min(1, omega / 20), maxDuration: 0.08, detune: jitter(60), synth: 'ratchet' },
  ],
  detent: () => [{ sample: 'ratchet', at: 0, gain: 0.5, maxDuration: 0.1, detune: -150, synth: 'click', arg: 2200 }],
  throw: () => [{ synth: 'throw', at: 0, gain: 1 }],
  chime: (k = 0) => [{ synth: 'chime', at: 0, gain: 1, arg: k }],
}
