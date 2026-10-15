import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { CARD, geometryOf, rng } from './builders'
import { FURNITURE } from './furniture'
import { STOPS } from './stops'
import { hinge, revealT, rise } from './reveal'
import { STATION_S } from './track'

// The scenery: one instanced mesh per prop type, every instance rising out
// of the map when the roll passes over it

// One flock per prop type and seed; the furniture on the desk joins in
const collect = (lowPerf) => {
  const byKey = {}
  const random = rng(42)
  const add = (item, s) => {
    if (lowPerf && !item.lite) return
    const key = `${item.type}:${item.seed ?? 1}`
    const list = byKey[key] ?? (byKey[key] = { type: item.type, seed: item.seed ?? 1, items: [] })
    list.items.push({
      x: item.x,
      y: item.y,
      s,
      yaw: item.yaw,
      scale: item.scale,
      always: Boolean(item.always),
      stagger: random() * 1.5,
      phase: random() * Math.PI * 2,
    })
  }
  STOPS.forEach((stop, i) => stop.deco.forEach((item) => add(item, STATION_S[i] + item.ds)))
  FURNITURE.forEach((item) => add(item, item.s))
  return byKey
}

const Flock = ({ type, seed, items, store, reduceMotion, lowPerf }) => {
  const ref = useRef()
  const fresh = useRef(true)
  const geometry = geometryOf(type, seed)
  // Clouds drift while the map is alive
  const drifts = type === 'cloud'
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), p: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler(), sc: new THREE.Vector3() }), [])

  useFrame(() => {
    const alive = drifts && store.live
    if (!store.moving && !alive && !fresh.current) return
    fresh.current = false
    items.forEach((item, i) => {
      // Things on the desk were never under the roll
      const t = item.always ? 1 : revealT(store.u, item.s, item.stagger, reduceMotion ? 1 : 3)
      const k = reduceMotion || item.always ? t : rise(t)
      tmp.e.set(reduceMotion || item.always ? 0 : hinge(t), item.yaw, 0, 'YXZ')
      tmp.q.setFromEuler(tmp.e)
      const drift = drifts ? Math.sin(store.time * 0.12 + item.phase) * 0.4 : 0
      tmp.p.set(item.x + drift, item.y, -item.s)
      tmp.sc.setScalar(Math.max(1e-4, k * item.scale))
      tmp.m.compose(tmp.p, tmp.q, tmp.sc)
      ref.current.setMatrixAt(i, tmp.m)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return <instancedMesh ref={ref} args={[geometry, CARD, items.length]} castShadow={!lowPerf && !drifts} receiveShadow frustumCulled={false} />
}

const Props = ({ store, lowPerf, reduceMotion }) => {
  const flocks = useMemo(() => collect(lowPerf), [lowPerf])
  return Object.entries(flocks).map(([key, flock]) => (
    <Flock key={key} type={flock.type} seed={flock.seed} items={flock.items} store={store} reduceMotion={reduceMotion} lowPerf={lowPerf} />
  ))
}

export default Props
