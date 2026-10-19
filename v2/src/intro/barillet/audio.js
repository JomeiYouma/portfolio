// Every sound of the sequence is synthesised: no file to fetch, and the
// ratchet can follow the cylinder's speed. The context only starts after the
// visitor's first gesture, as browsers require.

const MUTE_KEY = 'portfolio-intro-muted'

const readMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

export const createAudio = () => {
  let ctx = null
  let bus = null
  let master = null
  let noiseBuffer = null
  let muted = readMuted()

  const ensure = () => {
    if (ctx) return ctx
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    ctx = new Ctx()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.55
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -18
    comp.ratio.value = 6
    master.connect(comp)
    comp.connect(ctx.destination)
    bus = ctx.createGain()
    bus.connect(master)
    // A short room: decaying noise as the impulse response
    const seconds = 1.1
    const impulse = ctx.createBuffer(2, ctx.sampleRate * seconds, ctx.sampleRate)
    for (let c = 0; c < 2; c++) {
      const data = impulse.getChannelData(c)
      for (let i = 0; i < data.length; i++) {
        const t = i / ctx.sampleRate
        data[i] = (Math.random() * 2 - 1) * Math.exp(-t * 7) * 0.5
      }
    }
    const verb = ctx.createConvolver()
    verb.buffer = impulse
    const verbGain = ctx.createGain()
    verbGain.gain.value = 0.28
    bus.connect(verb)
    verb.connect(verbGain)
    verbGain.connect(master)
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const n = noiseBuffer.getChannelData(0)
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1
    return ctx
  }

  const unlock = () => {
    if (!ensure()) return
    if (ctx.state === 'suspended') ctx.resume().catch(() => {})
  }

  const env = (node, { gain = 0.5, attack = 0.002, decay = 0.1, at = 0 }) => {
    const g = ctx.createGain()
    const t0 = ctx.currentTime + at
    g.gain.setValueAtTime(0.0001, t0)
    g.gain.exponentialRampToValueAtTime(gain, t0 + attack)
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + attack + decay)
    node.connect(g)
    g.connect(bus)
    return t0
  }

  const noise = ({ type = 'bandpass', freq = 2000, endFreq, q = 1, duration = 0.1, ...rest }) => {
    const src = ctx.createBufferSource()
    src.buffer = noiseBuffer
    const filter = ctx.createBiquadFilter()
    filter.type = type
    filter.Q.value = q
    src.connect(filter)
    const t0 = env(filter, { decay: duration, ...rest })
    filter.frequency.setValueAtTime(freq, t0)
    if (endFreq) filter.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration)
    src.start(t0)
    src.stop(t0 + duration + 0.05)
  }

  const tone = ({ type = 'sine', freq = 440, endFreq, duration = 0.1, ...rest }) => {
    const osc = ctx.createOscillator()
    osc.type = type
    const t0 = env(osc, { decay: duration, ...rest })
    osc.frequency.setValueAtTime(freq, t0)
    if (endFreq) osc.frequency.exponentialRampToValueAtTime(endFreq, t0 + duration)
    osc.start(t0)
    osc.stop(t0 + duration + 0.05)
  }

  const click = (freq, gain, at = 0) => {
    noise({ freq, q: 7, duration: 0.025, gain, at })
    tone({ freq: freq * 1.3, endFreq: freq * 0.7, duration: 0.03, gain: gain * 0.5, at })
  }

  const SOUNDS = {
    latch: () => click(2600, 0.35),
    swing: () => noise({ type: 'lowpass', freq: 1400, endFreq: 300, q: 0.7, duration: 0.3, gain: 0.22, attack: 0.03 }),
    chime: (k = 0) => {
      const base = 740 * Math.pow(1.19, k)
      tone({ freq: base, duration: 0.22, gain: 0.08 })
      tone({ freq: base * 1.5, duration: 0.3, gain: 0.06, at: 0.05 })
    },
    insert: () => {
      noise({ freq: 3800, q: 5, duration: 0.03, gain: 0.3 })
      tone({ freq: 1900, endFreq: 1200, duration: 0.05, gain: 0.18 })
      tone({ type: 'triangle', freq: 420, endFreq: 300, duration: 0.07, gain: 0.12, at: 0.01 })
    },
    ratchet: () => click(3200 + Math.random() * 600, 0.09),
    close: () => {
      noise({ freq: 1700, q: 1.5, duration: 0.09, gain: 0.6 })
      tone({ type: 'triangle', freq: 240, endFreq: 70, duration: 0.14, gain: 0.5 })
      click(4200, 0.2, 0.012)
    },
    throw: () => noise({ type: 'highpass', freq: 2500, duration: 0.12, gain: 0.12, attack: 0.02 }),
    detent: () => click(2200, 0.3),
    cock: () => click(2900, 0.3),
    shot: () => {
      noise({ type: 'lowpass', freq: 5000, endFreq: 180, q: 0.5, duration: 0.42, gain: 1.0, attack: 0.001 })
      noise({ type: 'highpass', freq: 2500, duration: 0.05, gain: 0.7 })
      tone({ type: 'triangle', freq: 150, endFreq: 32, duration: 0.45, gain: 0.9 })
      tone({ type: 'sine', freq: 60, endFreq: 28, duration: 0.6, gain: 0.6 })
    },
  }

  const play = (name, arg) => {
    if (!ctx || muted || ctx.state !== 'running') return
    SOUNDS[name]?.(arg)
  }

  const setMuted = (value) => {
    muted = value
    try {
      localStorage.setItem(MUTE_KEY, value ? '1' : '0')
    } catch {
      // Storage blocked: the choice still holds for this visit
    }
    if (master) master.gain.setTargetAtTime(value ? 0 : 0.55, ctx.currentTime, 0.03)
  }

  return {
    unlock,
    play,
    setMuted,
    isMuted: () => muted,
    dispose: () => {
      ctx?.close().catch(() => {})
      ctx = null
    },
  }
}
