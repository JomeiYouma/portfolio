import { asset } from '../../utils/asset'
import { EVENTS, FILES, SPLIT } from './sounds'

// The sound of the sequence: recorded samples layered per event (see
// sounds.js), with a small synthesiser behind them for the layers no file
// covers and for anything that failed to load. The files are fetched and
// decoded as soon as the intro mounts; the context only starts producing
// sound after the visitor's first gesture, as browsers require.

const MUTE_KEY = 'portfolio-intro-muted'

const readMuted = () => {
  try {
    return localStorage.getItem(MUTE_KEY) === '1'
  } catch {
    return false
  }
}

/** Finds the starts of the events in a recording: peaks of the envelope, a gap apart */
const sliceOnsets = (buffer, split) => {
  if (!split) return [{ offset: 0, duration: buffer.duration }]
  const { gap: minGap, level, min } = split
  const data = buffer.getChannelData(0)
  const win = Math.max(1, Math.floor(buffer.sampleRate * 0.005))
  const env = []
  for (let i = 0; i < data.length; i += win) {
    let sum = 0
    for (let j = i; j < Math.min(i + win, data.length); j++) sum += data[j] * data[j]
    env.push(Math.sqrt(sum / win))
  }
  const peak = Math.max(...env)
  const threshold = peak * level
  const onsets = []
  let last = -Infinity
  const gapWin = Math.ceil((minGap * buffer.sampleRate) / win)
  for (let i = 1; i < env.length; i++) {
    const rising = env[i] > threshold && env[i] > env[i - 1] * 1.8
    if (rising && i - last > gapWin) {
      onsets.push(i)
      last = i
    }
  }
  if (!onsets.length) return [{ offset: 0, duration: buffer.duration }]
  return onsets
    .map((o, k) => {
      const offset = Math.max(0, (o * win) / buffer.sampleRate - 0.004)
      const next = k + 1 < onsets.length ? (onsets[k + 1] * win) / buffer.sampleRate : buffer.duration
      return { offset, duration: Math.min(next - offset, 2.5) }
    })
    .filter((s) => s.duration >= min)
}

export const createAudio = () => {
  let ctx = null
  let bus = null
  let verbIn = null
  let master = null
  let noiseBuffer = null
  let muted = readMuted()
  // name -> [{ buffer, offset, duration }], and which slice played last
  const slices = {}
  const lastPick = {}
  const failed = []
  let prefetched = false
  // Fetches still in flight when the engine is disposed must not land in the next one
  let generation = 0

  const ensure = () => {
    if (ctx) return ctx
    const Ctx = window.AudioContext || window.webkitAudioContext
    if (!Ctx) return null
    ctx = new Ctx()
    master = ctx.createGain()
    master.gain.value = muted ? 0 : 0.6
    const comp = ctx.createDynamicsCompressor()
    comp.threshold.value = -16
    comp.ratio.value = 5
    comp.attack.value = 0.002
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
    verbGain.gain.value = 0.24
    bus.connect(verb)
    verb.connect(verbGain)
    verbGain.connect(master)
    // A layer can ask for more of the room than the bus gives
    verbIn = verb
    noiseBuffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate)
    const n = noiseBuffer.getChannelData(0)
    for (let i = 0; i < n.length; i++) n[i] = Math.random() * 2 - 1
    return ctx
  }

  /** Fetches and decodes every file; a context can decode while still suspended */
  const prefetch = () => {
    if (prefetched || !ensure()) return
    prefetched = true
    const mine = generation
    Object.entries(FILES).forEach(([name, files]) => {
      slices[name] = []
      files.forEach((file) => {
        fetch(asset(`assets/sounds/${file}`))
          .then((res) => (res.ok ? res.arrayBuffer() : Promise.reject(new Error(res.status))))
          .then((bytes) => (ctx && mine === generation ? ctx.decodeAudioData(bytes) : null))
          .then((buffer) => {
            if (!buffer || mine !== generation) return
            sliceOnsets(buffer, SPLIT[name]).forEach((s) => slices[name].push({ buffer, ...s }))
          })
          .catch(() => {
            if (mine === generation) failed.push(file)
          })
      })
    })
  }

  const unlock = () => {
    if (!ensure()) return
    prefetch()
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

  // The synthesised layers, and the stand-ins when a file is missing
  const SYNTH = {
    click: (gain, at, freq = 2600) => click(freq, 0.35 * gain, at),
    swing: (gain, at) => noise({ type: 'lowpass', freq: 1400, endFreq: 300, q: 0.7, duration: 0.3, gain: 0.22 * gain, attack: 0.03, at }),
    chime: (gain, at, k = 0) => {
      const base = 740 * Math.pow(1.19, k)
      tone({ freq: base, duration: 0.22, gain: 0.08 * gain, at })
      tone({ freq: base * 1.5, duration: 0.3, gain: 0.06 * gain, at: at + 0.05 })
    },
    insert: (gain, at) => {
      noise({ freq: 3800, q: 5, duration: 0.03, gain: 0.3 * gain, at })
      tone({ freq: 1900, endFreq: 1200, duration: 0.05, gain: 0.18 * gain, at })
    },
    ratchet: (gain, at) => click(3200 + Math.random() * 600, 0.12 * gain, at),
    close: (gain, at) => {
      noise({ freq: 1700, q: 1.5, duration: 0.09, gain: 0.6 * gain, at })
      click(4200, 0.2 * gain, at + 0.012)
    },
    thud: (gain, at) => tone({ type: 'triangle', freq: 240, endFreq: 70, duration: 0.14, gain: 0.5 * gain, at }),
    throw: (gain, at) => noise({ type: 'highpass', freq: 2500, duration: 0.12, gain: 0.12 * gain, attack: 0.02, at }),
    sub: (gain, at) => {
      tone({ type: 'triangle', freq: 150, endFreq: 32, duration: 0.45, gain: 0.9 * gain, at })
      tone({ type: 'sine', freq: 60, endFreq: 28, duration: 0.6, gain: 0.6 * gain, at })
    },
    shot: (gain, at) => {
      noise({ type: 'lowpass', freq: 5000, endFreq: 180, q: 0.5, duration: 0.42, gain: 1.0 * gain, attack: 0.001, at })
      noise({ type: 'highpass', freq: 2500, duration: 0.05, gain: 0.7 * gain, at })
    },
    glass: (gain, at) => {
      noise({ type: 'highpass', freq: 3500, duration: 0.25, gain: 0.6 * gain, at })
      for (let i = 0; i < 6; i++) tone({ freq: 2500 + Math.random() * 4000, duration: 0.08 + Math.random() * 0.2, gain: 0.08 * gain, at: at + Math.random() * 0.2 })
    },
    ricochet: (gain, at) => tone({ type: 'sine', freq: 3200, endFreq: 900, duration: 0.25, gain: 0.3 * gain, at }),
  }

  const pick = (name) => {
    const list = slices[name]
    if (!list || !list.length) return null
    let i = Math.floor(Math.random() * list.length)
    if (list.length > 1 && i === lastPick[name]) i = (i + 1) % list.length
    lastPick[name] = i
    return list[i]
  }

  const sample = (slice, { at = 0, gain = 1, detune = 0, lowpass, highpass, maxDuration, verb = 0 }) => {
    const src = ctx.createBufferSource()
    src.buffer = slice.buffer
    src.detune.value = detune
    let node = src
    if (lowpass) {
      const f = ctx.createBiquadFilter()
      f.type = 'lowpass'
      f.frequency.value = lowpass
      node.connect(f)
      node = f
    }
    if (highpass) {
      const f = ctx.createBiquadFilter()
      f.type = 'highpass'
      f.frequency.value = highpass
      node.connect(f)
      node = f
    }
    const duration = Math.min(slice.duration, maxDuration ?? slice.duration)
    const g = ctx.createGain()
    const t0 = ctx.currentTime + at
    g.gain.setValueAtTime(gain, t0)
    g.gain.setValueAtTime(gain, t0 + Math.max(0.005, duration - 0.03))
    g.gain.linearRampToValueAtTime(0.0001, t0 + duration)
    node.connect(g)
    g.connect(bus)
    if (verb && verbIn) {
      const send = ctx.createGain()
      send.gain.value = verb
      g.connect(send)
      send.connect(verbIn)
    }
    src.start(t0, slice.offset, duration)
  }

  const play = (name, arg) => {
    if (!ctx || muted || ctx.state !== 'running') return
    const layers = EVENTS[name]?.(arg)
    if (!layers) return
    layers.forEach((layer) => {
      const slice = layer.sample ? pick(layer.sample) : null
      if (slice) sample(slice, layer)
      else if (layer.synth) SYNTH[layer.synth]?.(layer.gain ?? 1, layer.at ?? 0, layer.arg)
    })
  }

  const setMuted = (value) => {
    muted = value
    try {
      localStorage.setItem(MUTE_KEY, value ? '1' : '0')
    } catch {
      // Storage blocked: the choice still holds for this visit
    }
    if (master) master.gain.setTargetAtTime(value ? 0 : 0.6, ctx.currentTime, 0.03)
  }

  return {
    prefetch,
    unlock,
    play,
    setMuted,
    isMuted: () => muted,
    status: () => ({
      loaded: Object.fromEntries(Object.entries(slices).map(([k, v]) => [k, v.length])),
      shots: (slices.shot || []).map((s) => [+s.offset.toFixed(2), +s.duration.toFixed(2)]),
      failed: [...failed],
    }),
    dispose: () => {
      // React mounts twice in development: a disposed engine can be prefetched again
      ctx?.close().catch(() => {})
      ctx = null
      generation += 1
      prefetched = false
      failed.length = 0
      Object.keys(slices).forEach((k) => delete slices[k])
    },
  }
}
