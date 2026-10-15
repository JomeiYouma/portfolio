import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { revealT } from './reveal'
import { onLettering, ROAD_X, STATION_S } from './track'

// The dotted road from stop to stop, one instanced dash at a time, drawn as
// the paper unrolls under it

const SPACING = 0.7
const LIFT = 0.04
const DASH = new THREE.PlaneGeometry(0.4, 0.17)
DASH.rotateX(-Math.PI / 2)

const trace = () => {
  // Starts beyond the title of the map and ends at the mailbox
  const points = STATION_S.map((s, i) => new THREE.Vector3(ROAD_X[i], 0, -(i === 0 ? s + 2.4 : s)))
  points.push(new THREE.Vector3(2.2, 0, -(STATION_S[STATION_S.length - 1] + 1.1)))
  const curve = new THREE.CatmullRomCurve3(points, false, 'centripetal', 0.5)
  const n = Math.round(curve.getLength() / SPACING)
  // As on a printed map, the road breaks off where a name is lettered across it
  return curve.getSpacedPoints(n)
    .map((point, i) => {
      const tangent = curve.getTangentAt(i / n)
      return { x: point.x, s: -point.z, yaw: Math.atan2(-tangent.z, tangent.x) }
    })
    .filter((dash) => !onLettering(dash.x, dash.s, 0.3))
}

const Road = ({ store, ink }) => {
  const dashes = useMemo(() => trace(), [])
  const ref = useRef()
  const fresh = useRef(true)
  const tmp = useMemo(() => ({ m: new THREE.Matrix4(), p: new THREE.Vector3(), q: new THREE.Quaternion(), e: new THREE.Euler(), sc: new THREE.Vector3() }), [])

  useFrame(() => {
    if (!store.moving && !fresh.current) return
    fresh.current = false
    dashes.forEach((dash, i) => {
      const t = revealT(store.u, dash.s, 0, 1.2)
      tmp.e.set(0, dash.yaw, 0)
      tmp.q.setFromEuler(tmp.e)
      tmp.p.set(dash.x, LIFT, -dash.s)
      tmp.sc.setScalar(Math.max(1e-4, t))
      tmp.m.compose(tmp.p, tmp.q, tmp.sc)
      ref.current.setMatrixAt(i, tmp.m)
    })
    ref.current.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh ref={ref} args={[DASH, undefined, dashes.length]} frustumCulled={false} renderOrder={1}>
      <meshBasicMaterial color={ink} polygonOffset polygonOffsetFactor={-1} />
    </instancedMesh>
  )
}

export default Road
