import { LEAD, sAt } from './track'

// Scroll progress shared between the page and the scene, outside React: the
// page writes a target on every scroll event, the scene eases toward it in its
// own frame loop and everything in the scene reads the result from here.
// Three-free: OrigamiTheme imports it eagerly.

// Ambient animations (windmill, boat, flames) keep running this long after the last gesture
const LIVE_MS = 1500
// Frame-rate-independent ease toward the target, per second: unhurried, the
// map catches up with the page in about a second
const EASE = 3.2

export const createScrollStore = () => {
  const store = {
    // Where the page is: 0 at the first stop, 1 at the last
    target: 0,
    // Where the scene is. It starts behind the first stop, so the opening is
    // the same ease as any scroll: the map unrolls into view.
    current: -0.2,
    // Read by the scene each frame: the focus `s` along the map, the roll front
    // `u`, whether anything moved since the last frame, the clock
    s: 0,
    u: 0,
    moving: true,
    ready: false,
    time: 0,
    delta: 0,
    live: false,
    liveUntil: 0,
    // Per stop, how far the map slides across the window (a fraction of its
    // width) to sit in the middle of the room the note leaves free; measured
    // by the page, null until then
    shifts: null,
    wake: () => {},

    setTarget(progress) {
      store.target = Math.min(1, Math.max(0, progress))
      store.touch()
    },
    setShifts(shifts) {
      store.shifts = shifts
      store.touch()
    },
    // Any gesture keeps the map alive a moment longer
    touch() {
      store.liveUntil = performance.now() + LIVE_MS
      store.wake()
    },
    // The scene installs its frame request here
    attach(wake) {
      store.wake = wake
      store.ready = false
      wake()
    },
    detach() {
      store.wake = () => {}
    },
    /** One frame of easing. Returns whether another frame is needed. */
    step(delta, time, instant) {
      const before = store.current
      const gap = store.target - store.current
      // After an idle spell the first delta is the whole pause: cap it, or the move would snap
      const dt = Math.min(delta, 1 / 30)
      if (instant || Math.abs(gap) < 2e-5) store.current = store.target
      else store.current += gap * (1 - Math.exp(-dt * EASE))
      store.moving = store.current !== before || !store.ready
      store.ready = true
      store.s = sAt(store.current)
      store.u = store.s + LEAD
      store.time = time
      store.delta = dt
      store.live = !instant && performance.now() < store.liveUntil
      return store.current !== store.target || store.live
    },
  }
  return store
}
