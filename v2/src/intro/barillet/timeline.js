import gsap from 'gsap'
import { POSES, STEP } from './rig'
import { spinEase } from './motion'

// The master timeline of the sequence. Every beat is placed at an absolute
// time so the whole thing can be seeked; the two gates (the first gesture and
// the trigger) are pauses the intro releases. The timeline only tweens plain
// numbers on the rig; `emit` tells the intro about sounds, phases and HUD
// moments.

const TAU = Math.PI * 2
const SWING = 1.48 // 85°

export const buildTimeline = (rig, { count, emit }) => {
  const tl = gsap.timeline({ paused: true, defaults: { overwrite: 'auto' } })
  const state = { gate: null }
  const pose = (name, duration, ease, at) => tl.to(rig.gun, { ...POSES[name], duration, ease }, at)
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

  // 1. Open: latch, swing-out, the gun rolls to present the cylinder.
  // Calls sitting exactly on a pause would fire with it: a hair later.
  tl.addLabel('open', t)
  phase('open', t + 0.001)
  pose('present', 0.55, 'power2.inOut', t)
  tl.to(rig, { focus: 0.3, duration: 0.5 }, t)
  tl.to(rig.cam, { dolly: 0.04, duration: 0.6, ease: 'power2.inOut' }, t)
  tl.to(rig, { latch: 1, duration: 0.12, ease: 'power2.in' }, t + 0.35)
  call(() => emit('sfx', 'latch'), t + 0.45)
  call(() => emit('onoma', 'open'), t + 0.45)
  tl.to(rig, { crane: SWING, duration: 0.34, ease: 'back.out(1.3)' }, t + 0.5)
  call(() => emit('sfx', 'swing'), t + 0.5)
  tl.to(rig.off, { roll: -0.17, duration: 0.3, ease: 'power2.out' }, t + 0.55)
  tl.to(rig, { latch: 0, duration: 0.25, ease: 'power2.out' }, t + 0.7)
  t += 1.1

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
      emit('onoma', 'load')
      emit('seated', k)
    }, push + 0.11)
    tl.to(rig.off, { y: -0.01, duration: 0.06, ease: 'power2.out' }, push + 0.11)
    tl.to(rig.off, { y: 0, duration: 0.35, ease: 'elastic.out(1, 0.45)' }, push + 0.17)
    tl.to(rig, { cyl: `-=${STEP}`, duration: 0.18, ease: 'power3.out' }, push + 0.26)
    call(() => emit('sfx', 'ratchet'), push + 0.26)
    t = s + (last ? 0.72 : 0.85)
  }

  // 4. Closed with a flick of the wrist; the cylinder follows by inertia
  {
    const s = t
    tl.addLabel('closed', s)
    tl.to(rig.off, { roll: -0.7, duration: 0.16, ease: 'power2.in' }, s)
    tl.to(rig, { crane: 0, duration: 0.14, ease: 'power3.in' }, s + 0.06)
    call(() => {
      rig.phase = 'closed'
      emit('phase', 'closed')
      emit('sfx', 'close')
      emit('onoma', 'close')
    }, s + 0.2)
    tl.fromTo(rig, { impact: 0 }, { impact: 1, duration: 0.03 }, s + 0.2)
    tl.to(rig, { impact: 0, duration: 0.05 }, s + 0.23)
    tl.to(rig.off, { roll: 0, duration: 0.42, ease: 'elastic.out(1, 0.35)' }, s + 0.2)
    tl.to(rig.off, { y: -0.006, duration: 0.04 }, s + 0.2)
    tl.to(rig.off, { y: 0, duration: 0.3, ease: 'elastic.out(1, 0.4)' }, s + 0.24)
    tl.fromTo(rig, { sweep: -1 }, { sweep: 2, duration: 0.5, ease: 'power2.inOut' }, s + 0.25)
    pose('hold', 0.45, 'power2.inOut', s + 0.2)
    t = s + 0.6
  }

  // 5. Spin: the thumb throws the cylinder, friction brings it to the chosen chamber
  {
    const s = t
    tl.addLabel('spin', s)
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
      emit('onoma', 'spin')
    }, s)
    tl.fromTo(rig, { spinT: 0 }, { spinT: 1, duration: 1.5, ease: spinEase(1.5 / 0.45) }, s + 0.01)
    tl.fromTo(rig, { detent: 0 }, { detent: 1, duration: 0.14, ease: 'power2.out' }, s + 1.42)
    call(() => emit('sfx', 'detent'), s + 1.44)
    t = s + 1.5
  }

  // 6. Aim: up to the eye, hammer back, breath held
  {
    const s = t
    tl.addLabel('aim', s)
    pose('aim', 0.5, 'power3.inOut', s)
    tl.to(rig, { focus: 0.19, duration: 0.5 }, s)
    tl.to(rig, { breath: 0.15, duration: 0.6 }, s)
    tl.to(rig.cam, { dolly: 0, duration: 0.5 }, s)
    tl.to(rig, { hammer: 0.55, duration: 0.12, ease: 'power2.in' }, s + 0.25)
    call(() => emit('sfx', 'cock'), s + 0.3)
    tl.to(rig, { hammer: 1, duration: 0.1, ease: 'power2.in' }, s + 0.4)
    call(() => {
      emit('sfx', 'cock')
      emit('onoma', 'cock')
    }, s + 0.45)
    phase('aim', s + 0.55)
    tl.addPause(s + 0.6, () => {
      state.gate = 'fire'
    })
    t = s + 0.6
  }

  // 7. The shot
  {
    const s = t
    tl.addLabel('shot', s)
    call(() => {
      rig.phase = 'shot'
      rig.burst = true
      emit('phase', 'shot')
      emit('sfx', 'shot')
      emit('onoma', 'shot')
    }, s + 0.001)
    tl.to(rig, { trigger: 1, duration: 0.04 }, s)
    tl.to(rig, { hammer: 0, duration: 0.03, ease: 'power4.in' }, s)
    tl.fromTo(rig, { flash: 0 }, { flash: 1, duration: 0.03, ease: 'power4.out' }, s + 0.03)
    tl.to(rig, { flash: 0, duration: 0.14, ease: 'power2.in' }, s + 0.08)
    tl.fromTo(rig, { tracer: 0 }, { tracer: 1, duration: 0.16, ease: 'power2.out' }, s + 0.03)
    tl.fromTo(rig, { gap: 0 }, { gap: 1, duration: 0.03 }, s + 0.03)
    tl.to(rig, { gap: 0, duration: 0.06 }, s + 0.06)
    tl.fromTo(rig, { white: 0 }, { white: 0.75, duration: 0.02 }, s + 0.03)
    tl.to(rig, { white: 0, duration: 0.09 }, s + 0.05)
    tl.fromTo(rig, { impact: 0 }, { impact: 1, duration: 0.02 }, s + 0.06)
    tl.to(rig, { impact: 0, duration: 0.05 }, s + 0.1)
    tl.fromTo(rig, { aberr: 0 }, { aberr: 1, duration: 0.03 }, s + 0.03)
    tl.to(rig, { aberr: 0, duration: 0.25, ease: 'power2.out' }, s + 0.06)
    tl.fromTo(rig, { bloom: 0 }, { bloom: 1, duration: 0.03 }, s + 0.03)
    tl.to(rig, { bloom: 0, duration: 0.2 }, s + 0.06)
    tl.fromTo(rig, { shock: 0 }, { shock: 1, duration: 0.32, ease: 'power2.out' }, s + 0.04)
    tl.fromTo(rig, { recoil: 0 }, { recoil: 1, duration: 0.07, ease: 'power3.out' }, s + 0.03)
    tl.to(rig, { recoil: 0, duration: 0.45, ease: 'elastic.out(1, 0.4)' }, s + 0.1)
    tl.fromTo(rig, { kick: 0 }, { kick: 1, duration: 0.06, ease: 'power3.out' }, s + 0.03)
    tl.to(rig, { kick: 0, duration: 0.5, ease: 'elastic.out(1, 0.35)' }, s + 0.09)
    tl.fromTo(rig, { smoke: 0 }, { smoke: 1, duration: 0.15 }, s + 0.04)
    tl.to(rig, { smoke: 0, duration: 1.4, ease: 'power1.in' }, s + 0.4)
    tl.to(rig, { trigger: 0, duration: 0.3 }, s + 0.2)
    t = s + 0.45
  }

  // 8. The hole opens on the theme; the gun drops out of frame
  {
    const s = t
    tl.addLabel('reveal', s)
    call(() => {
      rig.phase = 'reveal'
      emit('phase', 'reveal')
    }, s)
    // A hole first, held a beat, then the whole screen gives way
    tl.fromTo(rig, { reveal: 0 }, { reveal: 0.1, duration: 0.18, ease: 'power3.out' }, s)
    tl.to(rig, { reveal: 1, duration: 0.7, ease: 'power3.in' }, s + 0.32)
    tl.to(rig.gun, { y: POSES.aim.y - 0.4, pitch: -0.7, duration: 0.6, ease: 'power2.in' }, s + 0.4)
    call(() => emit('done'), s + 1.05)
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
    fire: () => release('fire'),
    /** DEV: jump to a label, let it run a few frames so the motion effects show */
    seek: (label, run = 0.12) => {
      state.gate = null
      tl.pause()
      tl.seek(label, false)
      tl.play()
      setTimeout(() => tl.pause(), run * 1000)
    },
    dispose: () => tl.kill(),
  }
}
