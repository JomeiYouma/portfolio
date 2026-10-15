import { useCallback, useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import gsap from 'gsap'
import { useI18n } from '../../hooks/useI18n'
import { CARD, geometryOf } from './builders'
import { useHotspot } from './hotspot'
import { STOPS } from './stops'
import { backOut, hinge, revealT, rise } from './reveal'
import { STATION_S } from './track'

// The props that answer the pointer: each rises out of the map like the
// scenery, lifts a little under the pointer, plays a short animation when
// clicked, then hands its action to the page.

const noRaycast = () => null
const HIT = new THREE.BoxGeometry(1, 1, 1)
const TAU = Math.PI * 2
const sin = Math.sin

// Per type: the box that answers the pointer (w, h, d); the moving piece and
// where it hangs; the click animation, `t` running 0 → 1 from the rest pose
// and back to it; what runs while the map is alive.
const TYPES = {
  signpost: {
    hit: [1.2, 1.9, 0.5],
    duration: 0.7,
    pose: (t, g) => { g.rotation.z = sin(t * Math.PI * 3) * 0.16 * (1 - t) },
  },
  boat: {
    hit: [1.2, 0.9, 0.7],
    duration: 1,
    pose: (t, g) => {
      g.position.y = sin(t * Math.PI) * 0.22
      g.rotation.x = sin(t * Math.PI * 3) * 0.24 * (1 - t)
    },
    idle: (time, g) => {
      g.position.y = sin(time * 1.8) * 0.03
      g.rotation.z = sin(time * 1.3) * 0.06
    },
  },
  house: {
    hit: [1.4, 1.6, 1.3],
    part: 'houseDoor',
    at: [0.05, 0, 0.45],
    duration: 1.2,
    pose: (t, g, p) => { p.rotation.y = -1.8 * sin(t * Math.PI) },
  },
  windmill: {
    hit: [1.3, 2.5, 1.3],
    part: 'blades',
    at: [0, 1.45, 0.52],
    duration: 1.8,
    pose: (t, g, p, st) => { p.rotation.z = st.spin - (1 - (1 - t) ** 3) * 2 * TAU },
    done: (st) => { st.spin -= 2 * TAU },
    idle: (time, g, p, st, delta) => {
      st.spin -= delta * 0.7
      p.rotation.z = st.spin
    },
  },
  building: {
    hit: [1, 2.6, 1],
    duration: 0.8,
    pose: (t, g) => {
      g.position.y = sin(t * Math.PI) * 0.22
      g.scale.y = 1 + sin(t * TAU) * 0.1 * (1 - t)
    },
  },
  arcade: {
    hit: [0.8, 1.6, 0.8],
    duration: 0.8,
    pose: (t, g) => {
      g.position.y = sin(t * Math.PI) * 0.25
      g.rotation.z = sin(t * TAU) * 0.08 * (1 - t)
    },
  },
  dice: {
    hit: [0.7, 0.7, 0.7],
    duration: 1,
    pose: (t, g) => {
      g.position.y = sin(t * Math.PI) * 0.9
      g.rotation.x = t * TAU
      g.rotation.z = t * TAU
    },
  },
  campfire: {
    hit: [1.3, 1, 1.3],
    part: 'flames',
    at: [0, 0.1, 0],
    duration: 1,
    pose: (t, g, p) => { p.scale.setScalar(1 + sin(t * Math.PI) * 0.9) },
    idle: (time, g, p) => {
      p.scale.set(1 + sin(time * 11) * 0.08, 1 + sin(time * 9.3) * 0.14, 1 + Math.cos(time * 10) * 0.08)
      p.rotation.y = time * 0.6
    },
  },
  figure: {
    hit: [0.7, 1.3, 0.7],
    part: 'bubble',
    at: [0.1, 1.55, 0],
    duration: 1.7,
    pose: (t, g, p) => {
      // The speech bubble pops up, stays, then shrinks away
      const pop = backOut(Math.min(1, t * 2.5)) * Math.min(1, (1 - t) / 0.18)
      p.scale.setScalar(Math.max(1e-4, pop))
      g.position.y = sin(Math.min(1, t * 2) * Math.PI) * 0.12
    },
  },
  stall: {
    hit: [1.5, 1.7, 1.2],
    part: 'awning',
    at: [0, 1.22, -0.51],
    duration: 1,
    pose: (t, g, p) => { p.rotation.x = sin(t * Math.PI * 3) * 0.3 * (1 - t) },
  },
  plane: {
    hit: [0.9, 0.7, 1.3],
    duration: 1.6,
    pose: (t, g) => {
      // A loop ahead and back to the pad
      const a = sin(t * Math.PI)
      g.position.set(sin(t * TAU) * 1.6, a * 2.8, -a * 5.5)
      g.rotation.set(sin(t * TAU) * 0.55, 0, sin(t * TAU) * 0.5)
    },
  },
  mailbox: {
    hit: [0.8, 1.5, 0.6],
    part: 'flag',
    at: [0.26, 0.98, 0],
    duration: 1.2,
    pose: (t, g, p) => { p.rotation.z = -1.35 * (1 - sin(t * Math.PI)) },
  },
  compass: {
    hit: [1.1, 0.4, 1.1],
    part: 'needle',
    at: [0, 0.17, 0],
    duration: 1.6,
    pose: (t, g, p, st) => { p.rotation.y = st.spin - (1 - (1 - t) ** 3) * TAU * 1.5 },
    done: (st) => { st.spin -= TAU * 1.5 },
    idle: (time, g, p, st) => { p.rotation.y = st.spin + sin(time * 1.3) * 0.08 },
  },
  outcrop: {
    hit: [1.6, 1.3, 1.1],
    duration: 0.7,
    pose: (t, g) => { g.position.x = sin(t * Math.PI * 6) * 0.04 * (1 - t) },
  },
  hammer: {
    hit: [1.2, 0.5, 0.6],
    duration: 0.8,
    pose: (t, g) => {
      g.rotation.z = sin(t * TAU) * 0.6 * (1 - t)
      g.position.y = sin(t * Math.PI) * 0.2
    },
  },
  geode: {
    hit: [1.0, 0.9, 0.9],
    part: 'geodeLid',
    at: [0.1, 0.5, 0],
    duration: 1.4,
    pose: (t, g, p) => { p.rotation.z = -1.5 * sin(t * Math.PI) },
  },
  laptop: {
    hit: [1.0, 0.8, 0.8],
    part: 'lid',
    at: [0, 0.04, -0.31],
    duration: 1.3,
    pose: (t, g, p) => { p.rotation.x = -1.75 * (1 - sin(t * Math.PI)) },
  },
  scroll: {
    hit: [1.0, 0.4, 1.0],
    duration: 0.9,
    pose: (t, g) => {
      g.position.y = sin(t * Math.PI) * 0.2
      g.rotation.y = sin(t * Math.PI) * 0.6
    },
  },
  bike: {
    hit: [1.6, 1.1, 0.6],
    duration: 1,
    pose: (t, g) => {
      g.position.y = sin(t * Math.PI) * 0.25
      g.rotation.z = sin(t * Math.PI) * 0.25
    },
  },
  racket: {
    hit: [1.3, 0.5, 0.8],
    part: 'shuttle',
    at: [0.45, 0.1, 0],
    duration: 1.3,
    pose: (t, g, p) => {
      p.position.y = 0.1 + sin(t * Math.PI) * 1.3
      p.rotation.x = t * TAU
      g.rotation.z = sin(t * TAU) * 0.25 * (1 - t)
    },
  },
  globe: {
    hit: [1.4, 1.7, 1.4],
    part: 'globeBall',
    at: [0, 0.98, 0],
    duration: 1.6,
    pose: (t, g, p, st) => { p.rotation.y = st.spin + (1 - (1 - t) ** 3) * TAU },
    done: (st) => { st.spin += TAU },
    idle: (time, g, p, st, delta) => {
      st.spin += delta * 0.25
      p.rotation.y = st.spin
    },
  },
  strata: {
    hit: [1.3, 1.0, 1.0],
    duration: 0.8,
    pose: (t, g) => {
      g.position.y = sin(t * Math.PI) * 0.2
      g.rotation.z = sin(t * Math.PI * 3) * 0.08 * (1 - t)
    },
  },
  qr: {
    hit: [0.9, 0.9, 0.9],
    duration: 1.1,
    pose: (t, g) => {
      g.position.y = sin(t * Math.PI) * 0.4
      g.rotation.y = (1 - (1 - t) ** 3) * TAU
    },
  },
  pixel: {
    hit: [1.1, 1.5, 0.8],
    duration: 0.7,
    pose: (t, g) => { g.rotation.z = sin(t * Math.PI * 3) * 0.12 * (1 - t) },
  },
  neon: {
    hit: [1.7, 1.9, 0.5],
    duration: 0.9,
    pose: (t, g) => { g.scale.setScalar(1 + sin(t * Math.PI) * 0.12) },
  },
  ticket: {
    hit: [1.1, 1.5, 1.0],
    duration: 0.8,
    pose: (t, g) => {
      g.position.y = sin(t * Math.PI) * 0.22
      g.rotation.z = sin(t * TAU) * 0.06 * (1 - t)
    },
  },
}

const Landmark = ({ def, s, store, coarse, reduceMotion, onAction, onHover, label }) => {
  const invalidate = useThree((state) => state.invalidate)
  const spec = TYPES[def.type]
  const outer = useRef()
  const inner = useRef()
  const part = useRef()
  const fresh = useRef(true)
  // Mutable, per landmark: the click tween and what it spins
  const animRef = useRef({ spin: 0, busy: false, t: 0 })
  const geometry = geometryOf(def.type, def.seed ?? 1)
  const partGeometry = spec.part ? geometryOf(spec.part, def.seed ?? 1) : null
  const lift = def.y ?? 0

  const click = useCallback(() => {
    const anim = animRef.current
    if (anim.busy) return
    const finish = () => {
      anim.busy = false
      spec.done?.(anim)
      if (def.action) onAction(def.action, def.payload)
    }
    if (reduceMotion) {
      finish()
      return
    }
    anim.busy = true
    anim.t = 0
    store.touch()
    gsap.to(anim, {
      t: 1,
      duration: spec.duration,
      ease: 'power2.inOut',
      onUpdate: () => {
        spec.pose(anim.t, inner.current, part.current, anim)
        invalidate()
      },
      onComplete: () => {
        spec.pose(1, inner.current, part.current, anim)
        finish()
        invalidate()
      },
    })
  }, [spec, def, store, reduceMotion, onAction, invalidate])

  const { stateRef: hot, handlers } = useHotspot({ store, label, coarse, onHover, onClick: click })

  // Rest pose, then kill whatever a click left running
  useEffect(() => {
    const anim = animRef.current
    spec.pose(0, inner.current, part.current, anim)
    invalidate()
    return () => gsap.killTweensOf(anim)
  }, [spec, invalidate])

  useFrame(() => {
    const anim = animRef.current
    const live = store.live && spec.idle && !anim.busy
    if (!store.moving && !live && !hot.current.active && !fresh.current) return
    fresh.current = false
    // Things on the desk were never under the roll
    const t = def.always ? 1 : revealT(store.u, s, 0, reduceMotion ? 1 : 2.5)
    const k = reduceMotion || def.always ? t : rise(t)
    const o = outer.current
    o.visible = t > 0
    o.scale.setScalar(Math.max(1e-4, k * (def.scale ?? 1) * (1 + hot.current.hover * 0.06)))
    o.rotation.x = reduceMotion || def.always ? 0 : hinge(t)
    o.position.y = lift + hot.current.hover * 0.08
    if (live) spec.idle(store.time, inner.current, part.current, anim, store.delta)
  })

  return (
    <group ref={outer} position={[def.x, lift, -s]} rotation={[0, def.yaw ?? 0, 0, 'YXZ']} {...handlers}>
      <group ref={inner}>
        <mesh geometry={geometry} material={CARD} castShadow receiveShadow raycast={noRaycast} />
        {partGeometry && <mesh ref={part} geometry={partGeometry} material={CARD} position={spec.at} castShadow raycast={noRaycast} />}
        {/* Never drawn, only hit: the raycaster does not care about visibility */}
        <mesh geometry={HIT} visible={false} scale={spec.hit} position={[0, spec.hit[1] / 2 - lift, 0]} />
      </group>
    </group>
  )
}

const Landmarks = ({ store, lang, coarse, reduceMotion, onAction, onHover }) => {
  const { t } = useI18n()
  const list = useMemo(
    () => STOPS.flatMap((stop, i) => stop.landmarks.map((def) => ({ def, s: STATION_S[i] + def.ds }))),
    [],
  )
  return list.map(({ def, s }) => (
    <Landmark
      key={def.id}
      def={def}
      s={s}
      store={store}
      coarse={coarse}
      reduceMotion={reduceMotion}
      onAction={onAction}
      onHover={onHover}
      label={def.label(t, lang)}
    />
  ))
}

export default Landmarks
