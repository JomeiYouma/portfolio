import * as THREE from 'three'
import { spring } from './motion'

// Aiming from the hip: the pointer picks a point at the bottle's depth, the
// gun swings toward it on a spring, and a ray through the pointer says
// whether the shot lands on the bottle. All of this writes into the rig, so
// the HUD and the shot timeline can read it.

const _ndc = new THREE.Vector2()
const _hit = new THREE.Vector3()

export const createAimState = () => ({
  yaw: { x: 0, v: 0 },
  pitch: { x: 0, v: 0 },
  raycaster: new THREE.Raycaster(),
  pivot: new THREE.Vector3(),
  target: new THREE.Vector3(),
})

/**
 * Where the pointer aims, in camera space, at the bottle's depth. `pointer`
 * is -1..1 with y down (the DOM way); `force` pulls the point onto the bottle.
 */
export const aimPoint = (camera, pointer, bottleCam, force, out) => {
  const depth = -bottleCam.z
  const tanV = Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2)
  const x = pointer.x * depth * tanV * camera.aspect
  const y = -pointer.y * depth * tanV
  out.set(x + (bottleCam.x - x) * force, y + (bottleCam.y - y) * force, -depth)
  return out
}

/** Yaw and pitch that point the barrel from `pivot` at `target`, both in camera space */
export const aimAngles = (pivot, target) => {
  const dx = target.x - pivot.x
  const dy = target.y - pivot.y
  const dz = target.z - pivot.z
  return { yaw: Math.atan2(-dx, -dz), pitch: Math.atan2(dy, Math.hypot(dx, dz)) }
}

/** Eases the gun's aim toward the wanted angles: the weight of the arm */
export const stepAim = (state, yaw, pitch, dt) => {
  spring(state.yaw, yaw, 90, 13, dt)
  spring(state.pitch, pitch, 90, 13, dt)
}

/**
 * Casts a ray through the pointer. Writes whether it meets the bottle's
 * proxy and where it lands (on the bottle, else on the room) into the rig.
 */
export const hitTest = (state, rig, camera, pointer, targets) => {
  _ndc.set(pointer.x, -pointer.y)
  state.raycaster.setFromCamera(_ndc, camera)
  state.raycaster.layers.enableAll()
  const hits = state.raycaster.intersectObjects(targets, false)
  const first = hits[0]
  rig.aim.onBottle = Boolean(first && first.object.name === 'bottle-proxy')
  if (first) _hit.copy(first.point)
  else _hit.set(0, 0, -3)
  rig.aim.point.x = _hit.x
  rig.aim.point.y = _hit.y
  rig.aim.point.z = _hit.z
}

export const writeAim = (rig, yaw, pitch) => {
  rig.aim.yaw = yaw
  rig.aim.pitch = pitch
}

/** Freezes the aim into the shot about to fire */
export const commitShot = (rig, outcome) => {
  rig.shot.outcome = outcome
  rig.shot.point.x = rig.aim.point.x
  rig.shot.point.y = rig.aim.point.y
  rig.shot.point.z = rig.aim.point.z
  rig.shots += 1
}
