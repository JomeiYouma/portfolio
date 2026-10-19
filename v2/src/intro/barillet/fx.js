import * as THREE from 'three'
import { CART_LENGTH, CYL_LENGTH, PITCH_RADIUS } from './rig'
import { dotSprite, flashSprite, ringSprite, smokeSprite } from './textures'

// The motion effects, in the spirit of hand-drawn animation: stepped
// multiples left behind a fast object, a smear stretched along its velocity,
// ink streaks trailing it; and the shot's flash and smoke. Each factory
// returns a plain three object with an `update` the scene calls every frame.
// Objects named `fx-*` are skipped when something gets cloned into a ghost.

const ghostMaterial = (color, opacity) =>
  new THREE.MeshBasicMaterial({ color, transparent: true, opacity, depthWrite: false, toneMapped: false })

/** A flat silhouette of `target`: same geometry, one unlit material */
const flatClone = (target, material) => {
  const clone = target.clone(true)
  const doomed = []
  clone.traverse((o) => {
    if (o.name.startsWith('fx-') || o.isSprite || o.isPoints || o.isLight) doomed.push(o)
    else if (o.isMesh) {
      o.material = material
      o.castShadow = false
      o.receiveShadow = false
    }
  })
  doomed.forEach((o) => o.parent?.remove(o))
  clone.matrixAutoUpdate = false
  return clone
}

const _pos = new THREE.Vector3()
const _prev = new THREE.Vector3()
const _quat = new THREE.Quaternion()
const _scale = new THREE.Vector3()
const _dir = new THREE.Vector3()
const Z = new THREE.Vector3(0, 0, 1)
// Faster than this (metres per second) is a jump between two placements, not a motion
const TELEPORT = 3.5

/**
 * Multiples: copies of the object at earlier instants, sampled "on twos"
 * (twelve times a second) while it moves fast, fading with age
 */
export const createMultiples = (target, { color, count = 5, interval = 1 / 12, threshold = 4, opacity = 0.35 }) => {
  const holder = new THREE.Group()
  holder.name = 'fx-multiples'
  const clones = []
  for (let i = 0; i < count; i++) {
    const material = ghostMaterial(color, opacity * (1 - i / count))
    const object = flatClone(target, material)
    object.visible = false
    holder.add(object)
    clones.push({ object, material })
  }
  const ring = []
  const prevPos = new THREE.Vector3()
  const prevQuat = new THREE.Quaternion()
  let has = false
  let acc = 0
  let lastFast = -10

  const update = (dt, time, enabled = true) => {
    if (dt <= 0) return
    if (!target.visible || !enabled) {
      has = false
      ring.length = 0
      clones.forEach((c) => (c.object.visible = false))
      return
    }
    target.matrixWorld.decompose(_pos, _quat, _scale)
    let speed = 0
    if (has) {
      const linear = _pos.distanceTo(prevPos) / dt
      const angular = (2 * Math.acos(Math.min(1, Math.abs(_quat.dot(prevQuat))))) / dt
      speed = angular + linear * 20
      // A jump, not a motion: the object was placed, nothing to draw
      if (linear > TELEPORT) {
        speed = 0
        ring.length = 0
      }
    }
    prevPos.copy(_pos)
    prevQuat.copy(_quat)
    has = true
    const fast = speed > threshold
    if (fast) lastFast = time
    acc += dt
    if (acc >= interval) {
      acc = 0
      if (fast) {
        ring.unshift(target.matrixWorld.clone())
        if (ring.length > count) ring.pop()
      } else if (ring.length) ring.pop()
    }
    const show = time - lastFast < 0.25
    clones.forEach((c, i) => {
      const m = ring[i]
      const visible = show && Boolean(m)
      c.object.visible = visible
      if (visible) {
        c.object.matrix.copy(m)
        c.object.matrixWorldNeedsUpdate = true
      }
    })
  }
  return {
    object: holder,
    update,
    dispose: () => clones.forEach((c) => c.material.dispose()),
  }
}

/** Smear: the object stretched along its own velocity, trailing behind it */
export const createSmear = (target, { color, threshold = 0.45, stretch = 0.06, opacity = 0.55 }) => {
  const material = ghostMaterial(color, opacity)
  const clone = flatClone(target, material)
  clone.name = 'fx-smear'
  clone.matrixAutoUpdate = true
  clone.visible = false
  let has = false
  const update = (dt, enabled = true) => {
    if (dt <= 0) return
    if (!target.visible || !enabled) {
      has = false
      clone.visible = false
      return
    }
    target.matrixWorld.decompose(_pos, _quat, _scale)
    if (!has) {
      _prev.copy(_pos)
      has = true
      return
    }
    _dir.subVectors(_pos, _prev).divideScalar(dt)
    _prev.copy(_pos)
    const speed = _dir.length()
    if (speed < threshold || speed > TELEPORT) {
      clone.visible = false
      return
    }
    clone.visible = true
    _dir.normalize()
    const len = Math.min(0.12, speed * stretch)
    clone.position.copy(_pos)
    clone.quaternion.setFromUnitVectors(Z, _dir)
    clone.scale.set(1, 1, 1 + len / CART_LENGTH)
    material.opacity = opacity * Math.min(1, speed / 1.2)
  }
  return { object: clone, update, dispose: () => material.dispose() }
}

/** Ink streaks: a few tapering ribbons through the object's recent positions */
export const createTrails = (target, { color, lines = 3, samples = 12, width = 0.004, threshold = 0.4 }) => {
  const group = new THREE.Group()
  group.name = 'fx-trails'
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: true,
    opacity: 0.85,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  })
  const ribbons = []
  const index = []
  for (let i = 0; i < samples - 1; i++) {
    const a = i * 2
    index.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
  }
  for (let j = 0; j < lines; j++) {
    const geometry = new THREE.BufferGeometry()
    const positions = new Float32Array(samples * 2 * 3)
    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geometry.setIndex(index)
    const mesh = new THREE.Mesh(geometry, material)
    mesh.frustumCulled = false
    mesh.visible = false
    group.add(mesh)
    ribbons.push({ mesh, positions, offset: (j - (lines - 1) / 2) * width * 1.7, seed: j * 7.3 })
  }
  const history = []
  const camPos = new THREE.Vector3()
  const along = new THREE.Vector3()
  const view = new THREE.Vector3()
  const side = new THREE.Vector3()
  const a = new THREE.Vector3()
  const b = new THREE.Vector3()
  const prev = new THREE.Vector3()
  let has = false
  let lastFast = -10

  const update = (dt, time, camera, enabled = true) => {
    if (dt <= 0) return
    if (!target.visible || !enabled) {
      has = false
      history.length = 0
      ribbons.forEach((r) => (r.mesh.visible = false))
      return
    }
    target.matrixWorld.decompose(_pos, _quat, _scale)
    let speed = has ? _pos.distanceTo(prev) / dt : 0
    prev.copy(_pos)
    has = true
    if (speed > TELEPORT) {
      speed = 0
      history.length = 0
    }
    if (speed > threshold) {
      lastFast = time
      history.unshift(_pos.clone())
      if (history.length > samples) history.pop()
    } else if (history.length) {
      history.pop()
      if (time - lastFast > 0.08 && history.length) history.pop()
    }
    const n = history.length
    if (n < 2) {
      ribbons.forEach((r) => (r.mesh.visible = false))
      return
    }
    camera.getWorldPosition(camPos)
    ribbons.forEach((r) => {
      r.mesh.visible = true
      for (let i = 0; i < n; i++) {
        const p = history[i]
        along.subVectors(history[Math.max(i - 1, 0)], history[Math.min(i + 1, n - 1)]).normalize()
        view.subVectors(camPos, p).normalize()
        side.crossVectors(along, view).normalize()
        const taper = 1 - i / (n - 1)
        const w = width * taper * (0.7 + 0.3 * Math.sin(i * 1.7 + r.seed))
        const off = r.offset * (1 - taper * 0.4) + Math.sin(i * 2.1 + r.seed) * width * 0.25
        a.copy(p).addScaledVector(side, off + w / 2)
        b.copy(p).addScaledVector(side, off - w / 2)
        r.positions.set([a.x, a.y, a.z, b.x, b.y, b.z], i * 6)
      }
      r.mesh.geometry.attributes.position.needsUpdate = true
      r.mesh.geometry.setDrawRange(0, (n - 1) * 6)
    })
  }
  return {
    object: group,
    update,
    dispose: () => {
      ribbons.forEach((r) => r.mesh.geometry.dispose())
      material.dispose()
    },
  }
}

const additive = (map, color = '#ffffff') =>
  new THREE.MeshBasicMaterial({
    map,
    color,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
    side: THREE.DoubleSide,
  })

/** Muzzle flash: crossed star planes, a cone of flame, a burst of light */
export const createMuzzleFlash = (anchor, lowPerf) => {
  const group = new THREE.Group()
  group.name = 'fx-flash'
  group.visible = false
  anchor.add(group)
  const plane = new THREE.PlaneGeometry(1, 1)
  const planes = [0, 1, 2, 3].map((i) => {
    const m = new THREE.Mesh(plane, additive(flashSprite(1 + (i % 3))))
    if (i === 2) m.rotation.y = Math.PI / 2
    if (i === 3) m.rotation.x = Math.PI / 2
    m.position.z = -0.02 - i * 0.01
    group.add(m)
    return m
  })
  const coneGeo = new THREE.ConeGeometry(0.02, 0.16, 14, 1, true)
  coneGeo.rotateX(-Math.PI / 2)
  coneGeo.translate(0, 0, -0.08)
  const cone = new THREE.Mesh(coneGeo, additive(null, '#ff9a3c'))
  group.add(cone)
  const light = new THREE.PointLight('#ffb46a', 0, 1.4, 2)
  light.position.z = -0.03
  group.add(light)
  // The tracer: two crossed strips the colour of the round, racing away from the muzzle
  const tracerGeo = new THREE.PlaneGeometry(0.014, 1.6)
  tracerGeo.rotateX(Math.PI / 2)
  tracerGeo.translate(0, 0, -0.8)
  const tracerMaterial = additive(dotSprite(), '#ffffff')
  const tracers = [0, 1].map((i) => {
    const m = new THREE.Mesh(tracerGeo, tracerMaterial)
    if (i) m.rotation.z = Math.PI / 2
    group.add(m)
    return m
  })
  let prevFlash = 0
  const update = (rig) => {
    const f = rig.flash
    if (f > 0.01 && prevFlash <= 0.01) planes.forEach((p) => (p.rotation.z = Math.random() * Math.PI * 2))
    prevFlash = f
    group.visible = f > 0.005
    if (!group.visible) return
    const s = 0.2 + 0.22 * f
    planes.forEach((p, i) => {
      p.scale.setScalar(s * (1 + i * 0.12))
      p.material.opacity = Math.min(1, f * 1.5)
    })
    cone.material.opacity = f * 0.85
    cone.scale.set(0.6 + f * 0.6, 0.6 + f * 0.6, 0.5 + f)
    light.intensity = f * (lowPerf ? 20 : 34)
    tracers.forEach((m) => m.scale.set(1, 1, 0.3 + rig.tracer))
    tracerMaterial.opacity = Math.min(1, f * 1.2) * (1 - rig.tracer * 0.7)
  }
  return {
    update,
    setAccent: (color) => tracerMaterial.color.set(color),
    dispose: () => {
      plane.dispose()
      coneGeo.dispose()
      tracerGeo.dispose()
      planes.forEach((p) => p.material.dispose())
      cone.material.dispose()
      tracerMaterial.dispose()
    },
  }
}

/** The side flash at the cylinder gap, a revolver's signature */
export const createGapFlash = (body) => {
  const geo = new THREE.PlaneGeometry(1, 1)
  const material = additive(flashSprite(2), '#ffd08a')
  const sides = [-1, 1].map((sign) => {
    const m = new THREE.Mesh(geo, material)
    m.name = 'fx-gap'
    m.position.set(sign * 0.024, PITCH_RADIUS, -CYL_LENGTH / 2 - 0.002)
    m.rotation.y = (sign * Math.PI) / 2
    m.visible = false
    body.add(m)
    return m
  })
  const update = (rig) => {
    const g = rig.gap
    sides.forEach((m) => {
      m.visible = g > 0.005
      m.scale.setScalar(0.03 + g * 0.06)
    })
    material.opacity = g
  }
  return {
    update,
    dispose: () => {
      geo.dispose()
      material.dispose()
    },
  }
}

/** Smoke: a puff of points thrown from the muzzle, drifting up and fading */
export const createSmoke = (anchor) => {
  const N = 70
  const positions = new Float32Array(N * 3).fill(-100)
  const velocities = new Float32Array(N * 3)
  const ages = new Float32Array(N).fill(99)
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    map: smokeSprite(),
    color: '#aab0b8',
    size: 0.1,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  })
  const points = new THREE.Points(geometry, material)
  points.name = 'fx-smoke'
  points.frustumCulled = false
  const origin = new THREE.Vector3()
  const forward = new THREE.Vector3()
  const update = (dt, rig) => {
    if (rig.burst) {
      rig.burst = false
      anchor.getWorldPosition(origin)
      anchor.getWorldDirection(forward).negate()
      for (let i = 0; i < N; i++) {
        const k = i * 3
        positions[k] = origin.x + (Math.random() - 0.5) * 0.01
        positions[k + 1] = origin.y + (Math.random() - 0.5) * 0.01
        positions[k + 2] = origin.z + (Math.random() - 0.5) * 0.01
        const speed = 0.4 + Math.random() * 1.3
        velocities[k] = forward.x * speed + (Math.random() - 0.5) * 0.5
        velocities[k + 1] = forward.y * speed + (Math.random() - 0.5) * 0.5 + 0.15
        velocities[k + 2] = forward.z * speed + (Math.random() - 0.5) * 0.5
        ages[i] = 0
      }
    }
    const drag = Math.exp(-2.6 * dt)
    for (let i = 0; i < N; i++) {
      if (ages[i] > 3) continue
      const k = i * 3
      positions[k] += velocities[k] * dt
      positions[k + 1] += velocities[k + 1] * dt
      positions[k + 2] += velocities[k + 2] * dt
      velocities[k] *= drag
      velocities[k + 1] = velocities[k + 1] * drag + 0.2 * dt
      velocities[k + 2] *= drag
      ages[i] += dt
    }
    geometry.attributes.position.needsUpdate = true
    material.opacity = 0.42 * rig.smoke
    points.visible = rig.smoke > 0.01
  }
  return {
    object: points,
    update,
    dispose: () => {
      geometry.dispose()
      material.dispose()
    },
  }
}

/** Dust in the air between the eye and the room, for depth */
export const createDust = (count = 260) => {
  const box = { x: 0.7, y: 0.5, zNear: -0.25, zFar: -1.9 }
  const positions = new Float32Array(count * 3)
  const velocities = new Float32Array(count * 3)
  for (let i = 0; i < count; i++) {
    const k = i * 3
    positions[k] = (Math.random() * 2 - 1) * box.x
    positions[k + 1] = (Math.random() * 2 - 1) * box.y
    positions[k + 2] = box.zNear + Math.random() * (box.zFar - box.zNear)
    velocities[k] = (Math.random() - 0.5) * 0.02
    velocities[k + 1] = (Math.random() - 0.5) * 0.015
    velocities[k + 2] = (Math.random() - 0.5) * 0.01
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const material = new THREE.PointsMaterial({
    map: dotSprite(),
    color: '#d8ccb4',
    size: 0.0045,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.5,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const points = new THREE.Points(geometry, material)
  points.name = 'fx-dust'
  points.frustumCulled = false
  const update = (dt) => {
    for (let i = 0; i < count; i++) {
      const k = i * 3
      positions[k] += velocities[k] * dt
      positions[k + 1] += velocities[k + 1] * dt
      positions[k + 2] += velocities[k + 2] * dt
      if (positions[k] > box.x) positions[k] = -box.x
      if (positions[k] < -box.x) positions[k] = box.x
      if (positions[k + 1] > box.y) positions[k + 1] = -box.y
      if (positions[k + 1] < -box.y) positions[k + 1] = box.y
    }
    geometry.attributes.position.needsUpdate = true
  }
  return {
    object: points,
    update,
    dispose: () => {
      geometry.dispose()
      material.dispose()
    },
  }
}

/** The pick-up moment of a round: a ring widening, a flash, and its marked halo */
export const createSpawnFx = (cartridge, look) => {
  const sprite = (map, color, blending = THREE.AdditiveBlending) => {
    const m = new THREE.SpriteMaterial({ map, color, transparent: true, blending, depthWrite: false, toneMapped: false })
    const s = new THREE.Sprite(m)
    s.name = 'fx-spawn'
    s.visible = false
    cartridge.add(s)
    return s
  }
  const ring = sprite(ringSprite(), look.accent)
  const flash = sprite(dotSprite(), '#ffffff')
  const halo = sprite(dotSprite(), look.accent)
  halo.position.z = -0.02
  const update = (cart) => {
    const s = cart.spawn
    const mid = s > 0.001 && s < 0.999
    ring.visible = mid
    flash.visible = mid
    if (mid) {
      ring.scale.setScalar(0.02 + s * 0.11)
      ring.material.opacity = (1 - s) * 0.9
      const burst = Math.sin(Math.min(1, s * 1.3) * Math.PI)
      flash.scale.setScalar(0.03 + burst * 0.05)
      flash.material.opacity = burst
    }
    // The mark only matters while the round floats; in the cylinder it would glow through the steel
    halo.visible = cart.mark > 0.01 && cart.flight <= 0
    halo.scale.setScalar(0.05)
    halo.material.opacity = cart.mark * 0.35
  }
  return {
    update,
    dispose: () => [ring, flash, halo].forEach((s) => s.material.dispose()),
  }
}
