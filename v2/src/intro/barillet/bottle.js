import * as THREE from 'three'
import { bottleLabel, bulletHole, dotSprite, walnut } from './textures'

// The target: a glass bottle on a wooden post, two and a half metres out,
// standing on a floor so the room has a depth. The same surface is cut into
// shards that only appear when the bullet lands; a miss leaves a hole in the
// wall and a puff of dust.

export const BOTTLE_BASE = new THREE.Vector3(0.3, -0.32, -2.4)
export const BOTTLE_CENTRE = new THREE.Vector3(0.3, -0.16, -2.4)
const POST_HEIGHT = 0.9

// Radius and height of the bottle's silhouette (metres)
const PROFILE = [
  [0, 0], [0.034, 0], [0.039, 0.006], [0.04, 0.03], [0.04, 0.18], [0.034, 0.215], [0.02, 0.24],
  [0.014, 0.255], [0.014, 0.29], [0.017, 0.296], [0.017, 0.302], [0.013, 0.302],
]
// Which runs of the profile become a band of shards
const BANDS = [[1, 3], [3, 4], [4, 5], [5, 7], [7, 9], [9, 11]]
const SECTORS = 8

const glassMaterial = (lowPerf) =>
  lowPerf
    ? new THREE.MeshPhysicalMaterial({
        color: '#5c8a3a',
        transparent: true,
        opacity: 0.5,
        roughness: 0.06,
        metalness: 0,
        clearcoat: 1,
        envMapIntensity: 1.8,
        side: THREE.DoubleSide,
      })
    : new THREE.MeshPhysicalMaterial({
        color: '#6f9a46',
        transmission: 1,
        thickness: 0.012,
        ior: 1.5,
        roughness: 0.06,
        metalness: 0,
        attenuationColor: new THREE.Color('#3e6a25'),
        attenuationDistance: 0.15,
        envMapIntensity: 1.4,
        side: THREE.DoubleSide,
      })

export const buildBottle = ({ lowPerf, portrait }) => {
  const group = new THREE.Group()
  group.name = 'bottle'
  group.position.copy(BOTTLE_BASE)
  // A phone's narrow, wide-angle view would make the bottle a sliver: bring it closer
  if (portrait) group.position.z = -1.7
  const glass = glassMaterial(lowPerf)

  const body = new THREE.Mesh(new THREE.LatheGeometry(PROFILE.map(([r, h]) => new THREE.Vector2(r, h)), 48), glass)
  body.name = 'bottle-glass'
  body.castShadow = !lowPerf
  group.add(body)

  const labelMaterial = new THREE.MeshStandardMaterial({ map: bottleLabel(), roughness: 0.9, metalness: 0 })
  const label = new THREE.Mesh(new THREE.CylinderGeometry(0.0408, 0.0408, 0.08, 48, 1, true), labelMaterial)
  label.position.y = 0.1
  // The texture's seam sits on the camera side of a cylinder: turn the label round
  label.rotation.y = Math.PI
  group.add(label)

  // What the aim ray tests, a little larger than the glass, on a layer the camera never draws
  const proxy = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.34, 12), new THREE.MeshBasicMaterial())
  proxy.name = 'bottle-proxy'
  proxy.position.y = 0.16
  proxy.layers.set(1)
  group.add(proxy)

  const woodMaterial = new THREE.MeshStandardMaterial({ map: walnut(), roughness: 0.85, metalness: 0 })
  const post = new THREE.Mesh(new THREE.BoxGeometry(0.11, POST_HEIGHT, 0.11), woodMaterial)
  post.name = 'post'
  post.position.y = -POST_HEIGHT / 2
  post.castShadow = post.receiveShadow = !lowPerf
  group.add(post)

  const floorMaterial = new THREE.MeshStandardMaterial({ color: '#0a0c0f', roughness: 1, metalness: 0 })
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(14, 14), floorMaterial)
  floor.name = 'floor'
  floor.rotation.x = -Math.PI / 2
  floor.position.y = -POST_HEIGHT
  floor.receiveShadow = !lowPerf
  group.add(floor)

  // A warm pool of light on the bottle, a cool rim through the glass, a flash when it breaks
  const spot = new THREE.SpotLight('#ffe2b0', 4, 2.4, 0.5, 0.5, 2)
  spot.position.set(0.25, 0.95, 0.4)
  spot.target.position.set(0, 0.15, 0)
  group.add(spot, spot.target)
  const rim = new THREE.PointLight('#9fc5ff', 1.0, 1.2, 2)
  rim.position.set(-0.35, 0.3, -0.5)
  group.add(rim)
  const flash = new THREE.PointLight('#fff2d0', 0, 1.6, 2)
  flash.position.y = 0.15
  group.add(flash)

  // The shards: the lathe surface cut into bands and sectors, each centred on itself
  const shards = new THREE.Group()
  shards.name = 'bottle-shards'
  shards.visible = false
  const centre = new THREE.Vector3()
  BANDS.forEach(([j0, j1]) => {
    const pts = PROFILE.slice(j0, j1 + 1).map(([r, h]) => new THREE.Vector2(r, h))
    for (let i = 0; i < SECTORS; i++) {
      const geometry = new THREE.LatheGeometry(pts, 3, (i / SECTORS) * Math.PI * 2, (Math.PI * 2) / SECTORS)
      geometry.computeBoundingBox()
      geometry.boundingBox.getCenter(centre)
      geometry.translate(-centre.x, -centre.y, -centre.z)
      const shard = new THREE.Mesh(geometry, glass)
      shard.position.copy(centre)
      shard.userData.home = centre.clone()
      shards.add(shard)
    }
  })
  group.add(shards)

  return {
    group,
    body,
    label,
    proxy,
    post,
    floor,
    spot,
    rim,
    flash,
    shards,
    glass,
    dispose: () => {
      group.traverse((o) => o.geometry?.dispose())
      ;[glass, labelMaterial, woodMaterial, floorMaterial, proxy.material].forEach((m) => m.dispose())
    },
  }
}

/** The bottle breaking: shards thrown from the impact, glass dust, slow motion aware */
export const createShatter = (bottle) => {
  const pieces = bottle.shards.children
  const velocity = pieces.map(() => new THREE.Vector3())
  const spin = pieces.map(() => new THREE.Vector3())
  let age = -1

  const N = 90
  const positions = new Float32Array(N * 3).fill(-100)
  const velocities = new Float32Array(N * 3)
  const dustGeo = new THREE.BufferGeometry()
  dustGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const dustMat = new THREE.PointsMaterial({
    map: dotSprite(),
    color: '#dffcf4',
    size: 0.02,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  const dust = new THREE.Points(dustGeo, dustMat)
  dust.name = 'fx-glass-dust'
  dust.frustumCulled = false
  dust.visible = false

  const impact = new THREE.Vector3()
  const toEye = new THREE.Vector3()
  const dir = new THREE.Vector3()
  const world = new THREE.Vector3()

  const update = (dt, rig, camera) => {
    if (rig.shatter) {
      rig.shatter = false
      age = 0
      bottle.body.visible = false
      bottle.label.visible = false
      bottle.shards.visible = true
      impact.set(rig.shot.point.x, rig.shot.point.y, rig.shot.point.z)
      bottle.group.worldToLocal(impact)
      camera.getWorldPosition(toEye)
      bottle.group.worldToLocal(toEye)
      pieces.forEach((p, i) => {
        p.position.copy(p.userData.home)
        p.rotation.set(0, 0, 0)
        p.scale.setScalar(1)
        p.visible = true
        dir.subVectors(p.position, impact)
        const d = Math.max(0.01, dir.length())
        dir.normalize()
        velocity[i]
          .copy(dir)
          .multiplyScalar(1.4 + Math.random() * 2.6 + 1.5 * Math.max(0, 1 - d / 0.3))
        world.subVectors(toEye, p.position).normalize()
        velocity[i].addScaledVector(world, 0.9 + Math.random() * 0.8)
        velocity[i].y += Math.random() * 0.8
        spin[i].set(Math.random() - 0.5, Math.random() - 0.5, Math.random() - 0.5).multiplyScalar(24 + Math.random() * 20)
      })
      dust.visible = true
      bottle.group.localToWorld(world.copy(impact))
      for (let i = 0; i < N; i++) {
        const k = i * 3
        positions[k] = world.x
        positions[k + 1] = world.y
        positions[k + 2] = world.z
        velocities[k] = (Math.random() - 0.5) * 3
        velocities[k + 1] = Math.random() * 2.5
        velocities[k + 2] = (Math.random() - 0.5) * 3 + 1.5
      }
    }
    if (age < 0) return
    const s = dt * rig.slow
    age += s
    const fade = 1 - Math.min(1, Math.max(0, (age - 1.1) / 0.5))
    pieces.forEach((p, i) => {
      if (!p.visible) return
      const v = velocity[i]
      v.y -= 9.81 * s
      p.position.addScaledVector(v, s)
      // The post's top is the floor of this little world
      if (p.position.y < 0.005) {
        p.position.y = 0.005
        v.y = Math.abs(v.y) * 0.3
        v.x *= 0.8
        v.z *= 0.8
      }
      p.rotation.x += spin[i].x * s
      p.rotation.y += spin[i].y * s
      p.rotation.z += spin[i].z * s
      p.scale.setScalar(fade)
      if (age > 1.7) p.visible = false
    })
    const drag = Math.exp(-1.8 * s)
    for (let i = 0; i < N; i++) {
      const k = i * 3
      positions[k] += velocities[k] * s
      positions[k + 1] += velocities[k + 1] * s
      positions[k + 2] += velocities[k + 2] * s
      velocities[k] *= drag
      velocities[k + 1] = velocities[k + 1] * drag - 6 * s
      velocities[k + 2] *= drag
    }
    dustGeo.attributes.position.needsUpdate = true
    dustMat.opacity = 0.9 * (1 - Math.min(1, age / 1.0))
    if (age > 1.8) {
      dust.visible = false
      bottle.shards.visible = false
      age = -1
    }
  }

  return {
    object: dust,
    update,
    dispose: () => {
      dustGeo.dispose()
      dustMat.dispose()
    },
  }
}

/** A miss: dust kicked off the wall where the bullet lands, and the hole it leaves */
export const createMissFx = () => {
  const root = new THREE.Group()
  root.name = 'fx-miss'
  const N = 30
  const positions = new Float32Array(N * 3).fill(-100)
  const velocities = new Float32Array(N * 3)
  const geo = new THREE.BufferGeometry()
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  const mat = new THREE.PointsMaterial({
    map: dotSprite(),
    color: '#b8a58a',
    size: 0.05,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  })
  const puff = new THREE.Points(geo, mat)
  puff.frustumCulled = false
  root.add(puff)
  const holeMaterial = new THREE.SpriteMaterial({ map: bulletHole(), transparent: true, depthWrite: false })
  const holes = []
  let age = -1

  const update = (dt, rig) => {
    if (rig.miss) {
      rig.miss = false
      age = 0
      const p = rig.shot.point
      for (let i = 0; i < N; i++) {
        const k = i * 3
        positions[k] = p.x
        positions[k + 1] = p.y
        positions[k + 2] = p.z
        velocities[k] = (Math.random() - 0.5) * 1.6
        velocities[k + 1] = Math.random() * 1.4
        velocities[k + 2] = 0.4 + Math.random() * 1.2
      }
      const hole = new THREE.Sprite(holeMaterial)
      hole.scale.setScalar(0.07)
      hole.position.set(p.x, p.y, p.z + 0.01)
      holes.push(hole)
      root.add(hole)
    }
    if (age < 0) return
    age += dt
    const drag = Math.exp(-2.2 * dt)
    for (let i = 0; i < N; i++) {
      const k = i * 3
      positions[k] += velocities[k] * dt
      positions[k + 1] += velocities[k + 1] * dt
      positions[k + 2] += velocities[k + 2] * dt
      velocities[k] *= drag
      velocities[k + 1] = velocities[k + 1] * drag - 3 * dt
      velocities[k + 2] *= drag
    }
    geo.attributes.position.needsUpdate = true
    mat.opacity = 0.7 * (1 - Math.min(1, age / 0.7))
    if (age > 0.8) age = -1
  }

  return {
    object: root,
    update,
    dispose: () => {
      geo.dispose()
      mat.dispose()
      holeMaterial.dispose()
    },
  }
}
