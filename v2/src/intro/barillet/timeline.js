import gsap from 'gsap'
import { EasePack } from 'gsap/EasePack'
import { POSES, STEP } from './rig'
import { spinEase } from './motion'

gsap.registerPlugin(EasePack)

// The master timeline of the sequence, up to the moment the gun is aimed.
// Every beat is placed at an absolute time so the whole thing can be seeked;
// the two gates (the first gesture and the trigger) are pauses the intro
// releases. The shots themselves live in shots.js, since there can be
// several. The timeline only tweens plain numbers on the rig; `emit` tells
// the intro about sounds, phases and HUD moments.

const TAU = Math.PI * 2
const SWING = 1.48 // 85°

export const buildTimeline = (rig, { count, emit }) => {
  const tl = gsap.timeline({ paused: true, defaults: { overwrite: 'auto' } })
  const state = { gate: null }
  const pose = (name, duration, ease, at, keys) => {
    const target = keys ? Object.fromEntries(keys.map((k) => [k, POSES[name][k]])) : { ...POSES[name] }
    return tl.to(rig.gun, { ...target, duration, ease }, at)
  }
  const call = (fn, at) => tl.call(fn, null, at)
  const phase = (name, at) =>
    call(() => {
      rig.phase = name
      emit('phase', name)
    }, at)

  let t = 0

  // 0. The gun rises into the frame and waits for the visitor
  tl.addLabel('ready', t)
  tl.to(rig, { rise: 1, duration: 0.6, ease: 'power3.out' }, t)
  t += 0.6
  phase('ready', t - 0.01)
  tl.addPause(t, () => {
    state.gate = 'start'
  })

  // 1. Open, the way a wrist does it: a long wind-up, a held breath, then the
  // flick that throws the cylinder out. Calls sitting exactly on a pause
  // would fire with it: a hair later.
  {
    const s = t
    tl.addLabel('open', s)
    phase('open', s + 0.001)
    // Wind-up: the gun comes to the eye and tilts the wrong way, the thumb finds the latch
    pose('wind', 1.0, 'power2.inOut', s)
    tl.to(rig.cam, { zoom: 1.18, yaw: 0.04, duration: 1.0, ease: 'power2.inOut' }, s)
    tl.to(rig, { breath: 0.2, duration: 0.6 }, s + 0.3)
    tl.to(rig.hand, { latch: 1, duration: 0.15 }, s + 0.6)
    tl.to(rig, { latch: 1, duration: 0.12, ease: 'power2.in' }, s + 0.68)
    call(() => emit('sfx', 'latch'), s + 0.76)
    // The held beat: the wrist loads a little further, only a shiver of the cylinder, freed by the latch
    tl.to(rig.gun, { roll: POSES.wind.roll - 0.12, duration: 0.22, ease: 'sine.inOut' }, s + 1.0)
    tl.to(rig, { crane: 0.025, duration: 0.08, ease: 'sine.out' }, s + 1.02)
    tl.to(rig, { crane: 0.01, duration: 0.1, ease: 'sine.inOut' }, s + 1.1)
    // The flick: the whole gun snaps sideways, the cylinder follows by inertia
    const flick = s + 1.24
    pose('present', 0.26, 'power3.out', flick, ['x', 'y', 'z', 'pitch', 'yaw'])
    tl.to(rig.gun, { roll: POSES.present.roll + 0.3, duration: 0.09, ease: 'power4.in' }, flick)
    tl.to(rig.gun, { roll: POSES.present.roll, duration: 0.45, ease: 'elastic.out(1, 0.35)' }, flick + 0.09)
    tl.to(rig, { crane: SWING + 0.06, duration: 0.1, ease: 'expo.out' }, flick + 0.02)
    tl.to(rig, { crane: SWING + 0.14, duration: 0.11, ease: 'sine.out' }, flick + 0.12)
    tl.to(rig, { crane: SWING, duration: 0.38, ease: 'elastic.out(1, 0.3)' }, flick + 0.23)
    call(() => emit('sfx', 'swing'), flick + 0.02)
    call(() => emit('sfx', 'knock'), flick + 0.13)
    tl.fromTo(rig, { impact: 0 }, { impact: 0.7, duration: 0.02 }, flick + 0.13)
    tl.to(rig, { impact: 0, duration: 0.04 }, flick + 0.15)
    tl.fromTo(rig, { aberr: 0 }, { aberr: 0.6, duration: 0.02 }, flick + 0.13)
    tl.to(rig, { aberr: 0, duration: 0.25 }, flick + 0.15)
    tl.to(rig.off, { y: -0.005, duration: 0.03 }, flick + 0.13)
    tl.to(rig.off, { y: 0, duration: 0.3, ease: 'elastic.out(1, 0.4)' }, flick + 0.16)
    tl.to(rig, { latch: 0, duration: 0.2 }, flick + 0.13)
    tl.to(rig.hand, { latch: 0, duration: 0.2 }, flick + 0.13)
    tl.to(rig, { breath: 1, duration: 0.4 }, flick + 0.18)
    // Rolls back so the rear of the cylinder faces the eye, ready for the rounds
    pose('presentOpen', 0.5, 'power2.inOut', flick + 0.5)
    tl.to(rig.cam, { zoom: 1.08, yaw: 0.02, duration: 0.5, ease: 'power2.inOut' }, flick + 0.5)
    t = flick + 1.0
  }

  // 2. The rounds appear, left of the open cylinder
  tl.addLabel('spawn', t)
  phase('spawn', t)
  for (let k = 0; k < count; k++) {
    tl.to(rig.carts[k], { spawn: 1, duration: 0.45, ease: 'back.out(2)' }, t + k * 0.12)
    call(() => emit('sfx', 'chime', k), t + k * 0.12)
    call(() => emit('card', k), t + k * 0.12)
  }
  t += 0.8

  // 3. Loading, one round at a time: anticipation, flight, push, dip, index
  for (let k = 0; k < count; k++) {
    const last = k === count - 1
    const f = last ? 0.85 : 1
    const s = t
    tl.addLabel(`load-${k + 1}`, s)
    call(() => emit('load', k), s)
    tl.to(rig.off, { x: 0.01, duration: 0.09, ease: 'power1.out' }, s)
    tl.to(rig.off, { x: 0, duration: 0.2, ease: 'power2.out' }, s + 0.09)
    tl.to(rig.carts[k], { hover: 0, duration: 0.1 }, s)
    tl.to(rig.carts[k], { flight: 1, duration: 0.28 * f, ease: 'power2.inOut' }, s + 0.08)
    const push = s + 0.08 + 0.28 * f
    tl.to(rig.carts[k], { seat: 1.06, duration: 0.12, ease: 'power3.in' }, push)
    tl.to(rig.carts[k], { seat: 1, duration: 0.1, ease: 'power2.out' }, push + 0.12)
    call(() => {
      emit('sfx', 'insert')
      emit('seated', k)
    }, push + 0.11)
    tl.to(rig.off, { y: -0.01, duration: 0.06, ease: 'power2.out' }, push + 0.11)
    tl.to(rig.off, { y: 0, duration: 0.35, ease: 'elastic.out(1, 0.45)' }, push + 0.17)
    tl.to(rig, { cyl: `-=${STEP}`, duration: 0.18, ease: 'power3.out' }, push + 0.26)
    call(() => emit('sfx', 'ratchet', 8), push + 0.26)
    t = s + (last ? 0.72 : 0.85)
  }

  // 4. Closed with the same grammar: the wrist winds the other way, holds, whips
  {
    const s = t
    tl.addLabel('closed', s)
    tl.to(rig.off, { pitch: -0.08, y: 0.01, duration: 0.8, ease: 'sine.inOut' }, s)
    tl.to(rig.gun, { roll: POSES.presentOpen.roll - 0.4, duration: 0.8, ease: 'sine.inOut' }, s)
    tl.to(rig, { crane: SWING + 0.08, duration: 0.8, ease: 'sine.inOut' }, s)
    tl.to(rig.cam, { zoom: 1.12, duration: 0.85, ease: 'sine.inOut' }, s)
    // The held beat, then a last load of the wrist
    tl.to(rig.gun, { roll: POSES.presentOpen.roll - 0.5, duration: 0.18, ease: 'sine.inOut' }, s + 0.85)
    // The whip: the gun rolls hard, the cylinder slams home a moment later
    const whip = s + 1.05
    tl.to(rig.gun, { roll: 1.5, duration: 0.16, ease: 'power3.in' }, whip)
    tl.to(rig, { crane: 0, duration: 0.13, ease: 'power4.in' }, whip + 0.07)
    const snap = whip + 0.2
    call(() => {
      rig.phase = 'closed'
      emit('phase', 'closed')
      emit('sfx', 'close')
    }, snap)
    tl.fromTo(rig, { impact: 0 }, { impact: 1, duration: 0.03 }, snap)
    tl.to(rig, { impact: 0, duration: 0.05 }, snap + 0.03)
    tl.to(rig.off, { x: 0.004, y: -0.006, duration: 0.03 }, snap)
    tl.to(rig.off, { x: 0, y: 0, pitch: 0, duration: 0.35, ease: 'elastic.out(1, 0.4)' }, snap + 0.03)
    tl.to(rig.gun, { roll: POSES.hold.roll, duration: 0.6, ease: 'elastic.out(1, 0.35)' }, snap)
    pose('hold', 0.45, 'power2.inOut', snap, ['x', 'y', 'z', 'pitch', 'yaw'])
    tl.to(rig.cam, { zoom: 1, duration: 0.4, ease: 'power2.out' }, snap)
    tl.fromTo(rig, { sweep: -1 }, { sweep: 2, duration: 0.5, ease: 'power2.inOut' }, snap + 0.05)
    t = snap + 0.3
  }

  // 5. Spin, in close-up: the thumb throws the cylinder, friction brings it to the chosen chamber
  {
    const s = t
    tl.addLabel('spin', s)
    pose('spinClose', 0.45, 'power3.inOut', s)
    tl.to(rig.cam, { zoom: 1.3, yaw: -0.03, duration: 0.45, ease: 'power3.inOut' }, s)
    tl.to(rig.hand, { flick: 1, duration: 0.2, ease: 'power2.in' }, s + 0.25)
    tl.to(rig.hand, { flick: 0, duration: 0.3, ease: 'power2.out' }, s + 0.45)
    call(() => {
      const m = rig.marked >= 0 && rig.marked < count ? rig.marked : Math.floor(Math.random() * count)
      rig.chosen = m
      const chamber = rig.chamberOf[m]
      const from = rig.cyl
      const want = -chamber * STEP
      const delta = (((want - from) % TAU) + TAU) % TAU
      // Keep turning the way the loading went, two and a half turns or so
      rig.spinTravel = delta - 3 * TAU
      rig.phase = 'spin'
      emit('phase', 'spin')
      emit('chosen', m)
      emit('sfx', 'throw')
    }, s + 0.42)
    tl.fromTo(rig, { spinT: 0 }, { spinT: 1, duration: 1.6, ease: spinEase(1.6 / 0.45) }, s + 0.43)
    tl.fromTo(rig, { spinning: 0 }, { spinning: 1, duration: 0.1 }, s + 0.43)
    tl.to(rig, { spinning: 0, duration: 0.5 }, s + 1.5)
    tl.fromTo(rig, { detent: 0 }, { detent: 1, duration: 0.14, ease: 'power2.out' }, s + 1.95)
    call(() => emit('sfx', 'detent'), s + 1.97)
    tl.to(rig.cam, { zoom: 1, yaw: 0, duration: 0.4, ease: 'power2.inOut' }, s + 1.85)
    t = s + 2.25
  }

  // 6. Aim from the hip: the gun drops to the right, the thumb cocks the
  // hammer, the barrel is handed to the pointer. The gate stays shut until
  // the visitor fires; shots.js takes over from here.
  {
    const s = t
    tl.addLabel('aim', s)
    pose('hip', 0.5, 'power3.inOut', s)
    tl.to(rig, { look: 0.55, breath: 0.25, duration: 0.4 }, s)
    tl.to(rig, { aimBlend: 1, duration: 0.5, ease: 'power2.inOut' }, s)
    tl.to(rig.cam, { dolly: 0, duration: 0.5 }, s)
    tl.to(rig, { bottleLight: 1, duration: 0.5 }, s)
    tl.to(rig.hand, { cock: 1, duration: 0.2, ease: 'power2.inOut' }, s + 0.15)
    tl.to(rig, { hammer: 0.55, duration: 0.12, ease: 'power2.in' }, s + 0.22)
    call(() => emit('sfx', 'cock'), s + 0.24)
    tl.to(rig, { hammer: 1, duration: 0.1, ease: 'power2.in' }, s + 0.36)
    call(() => emit('sfx', 'cock'), s + 0.4)
    tl.to(rig.hand, { cock: 0, duration: 0.25, ease: 'power2.inOut' }, s + 0.48)
    phase('aim', s + 0.6)
    tl.addLabel('aim-end', s + 0.75)
    tl.addPause(s + 0.75, () => {
      state.gate = 'fire'
    })
  }

  const release = (gate) => {
    if (state.gate !== gate) return false
    state.gate = null
    tl.play()
    return true
  }

  return {
    tl,
    gate: () => state.gate,
    start: () => release('start'),
    /** The trigger gate is consumed without resuming the master: the shot runs on its own */
    consumeFire: () => {
      if (state.gate !== 'fire') return false
      state.gate = null
      return true
    },
    rearm: () => {
      state.gate = 'fire'
    },
    /** DEV: jump to a label, let it run a few frames so the motion effects show */
    seek: (label, run = 0.12) => {
      state.gate = null
      tl.pause()
      tl.seek(label, false)
      tl.play()
      setTimeout(() => {
        tl.pause()
        // Parked at the trigger gate: the shots can be fired from here
        if (tl.time() >= tl.labels['aim-end'] - 0.001) state.gate = 'fire'
      }, run * 1000)
    },
    dispose: () => tl.kill(),
  }
}
