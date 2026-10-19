import gsap from 'gsap'
import { STEP } from './rig'

// One pull of the trigger. Built fresh for every shot, since a shot can
// happen up to four times: double-action pull through any empty chamber,
// hammer fall, flash, recoil, then either the bottle breaking in slow motion
// or a miss that re-arms the gun on the next live round.

/** Ramps the shot's time scale in real time, so the slow motion does not slow itself down */
const slowMo = (tl, rig, to, seconds) => {
  const proxy = { v: tl.timeScale() }
  gsap.to(proxy, {
    v: to,
    duration: seconds,
    ease: 'power2.out',
    onUpdate: () => {
      tl.timeScale(proxy.v)
      rig.slow = proxy.v
    },
  })
}

export const buildShot = (rig, { outcome, steps = 0, slow = true, emit, onImpact, onSettled }) => {
  const tl = gsap.timeline({ paused: true })
  const call = (fn, at) => tl.call(fn, null, at)

  // Double action: the trigger pulls the hammer back and turns the cylinder;
  // every empty chamber crossed on the way is a dry click
  let F = 0.02
  if (steps > 0) {
    for (let i = 0; i < steps; i++) {
      const at = i * 0.14
      const last = i === steps - 1
      tl.to(rig, { hammer: 1, duration: 0.08, ease: 'power2.in' }, at)
      tl.to(rig, { cyl: `-=${STEP}`, duration: 0.1, ease: 'power3.out' }, at + 0.02)
      call(() => emit('sfx', 'ratchet', 14), at + 0.03)
      if (!last) {
        tl.to(rig, { hammer: 0, duration: 0.04, ease: 'power4.in' }, at + 0.09)
        call(() => emit('sfx', 'dry'), at + 0.1)
      }
    }
    F = steps * 0.14 + 0.02
  }

  tl.to(rig, { trigger: 1, duration: 0.04 }, F - 0.02)
  tl.to(rig.hand, { trigger: 1, duration: 0.05 }, F - 0.02)
  call(() => emit('sfx', 'shot'), F - 0.02)
  tl.to(rig, { hammer: 0, duration: 0.03, ease: 'power4.in' }, F)
  call(() => {
    rig.burst = true
    emit('fired')
  }, F + 0.02)
  tl.fromTo(rig, { flash: 0 }, { flash: 1, duration: 0.03, ease: 'power4.out' }, F + 0.03)
  tl.to(rig, { flash: 0, duration: 0.14, ease: 'power2.in' }, F + 0.08)
  tl.fromTo(rig, { tracer: 0 }, { tracer: 1, duration: 0.16, ease: 'power2.out' }, F + 0.03)
  tl.fromTo(rig, { gap: 0 }, { gap: 1, duration: 0.03 }, F + 0.03)
  tl.to(rig, { gap: 0, duration: 0.06 }, F + 0.06)
  tl.fromTo(rig, { aberr: 0 }, { aberr: 1, duration: 0.03 }, F + 0.03)
  tl.to(rig, { aberr: 0, duration: 0.25, ease: 'power2.out' }, F + 0.06)
  tl.fromTo(rig, { bloom: 0 }, { bloom: 1, duration: 0.03 }, F + 0.03)
  tl.to(rig, { bloom: 0, duration: 0.2 }, F + 0.06)
  tl.fromTo(rig, { shock: 0 }, { shock: 1, duration: 0.32, ease: 'power2.out' }, F + 0.04)
  tl.fromTo(rig, { recoil: 0 }, { recoil: 1, duration: 0.07, ease: 'power3.out' }, F + 0.03)
  tl.to(rig, { recoil: 0, duration: 0.45, ease: 'elastic.out(1, 0.4)' }, F + 0.1)
  tl.fromTo(rig, { kick: 0 }, { kick: 1, duration: 0.06, ease: 'power3.out' }, F + 0.03)
  tl.to(rig, { kick: 0, duration: 0.5, ease: 'elastic.out(1, 0.35)' }, F + 0.09)
  tl.fromTo(rig, { smoke: 0 }, { smoke: 1, duration: 0.15 }, F + 0.04)
  tl.to(rig, { smoke: 0, duration: 1.4, ease: 'power1.in' }, F + 0.4)

  // The bullet lands: 2.4 m of flight is a few milliseconds
  call(() => onImpact(outcome), F + 0.045)

  if (outcome === 'hit') {
    tl.fromTo(rig, { bottleFlash: 0 }, { bottleFlash: 1, duration: 0.02 }, F + 0.045)
    tl.to(rig, { bottleFlash: 0, duration: 0.3 }, F + 0.065)
    // The eye goes to the breaking glass, time stretches, then lets go
    tl.to(rig.cam, { zoom: 1.45, look: 1, duration: 0.45, ease: 'power2.out' }, F + 0.06)
    if (slow) {
      call(() => slowMo(tl, rig, 0.22, 0.08), F + 0.085)
      call(() => slowMo(tl, rig, 1, 0.25), F + 0.32)
    }
    call(() => emit('reveal'), F + 0.3)
    tl.to(rig.gun, { y: '-=0.35', pitch: -0.6, duration: 0.6, ease: 'power2.in' }, F + 0.36)
    tl.fromTo(rig, { reveal: 0 }, { reveal: 1, duration: 0.6, ease: 'power3.in' }, F + 0.36)
    call(() => onSettled('hit'), F + 1.05)
  } else {
    tl.to(rig, { trigger: 0, duration: 0.25 }, F + 0.25)
    tl.to(rig.hand, { trigger: 0, duration: 0.25 }, F + 0.25)
    call(() => onSettled('miss'), F + 0.6)
  }

  return tl
}
