import * as THREE from 'three'
import { BARREL_LENGTH, CHAMBERS, CHAMBER_RADIUS, CYL_LENGTH, CYL_RADIUS, PITCH_RADIUS } from './rig'
import { brushedNormal, walnut, wearRoughness } from './textures'

// A Colt Python, built from profiles: the cylinder is a fluted disc with six
// real chambers (the cartridges go into them), the frame and grip are
// extruded side views, the barrel a lathe. Gun space: the muzzle points down
// -Z, +Y is up, +X is the shooter's right. The cylinder's centre is the
// origin, so the swing-out, the spin and the loading all happen around it.

export const STEEL = '#0b1420'
// Where the cylinder swings: a hinge parallel to the barrel, low on the left
export const CRANE_PIVOT = new THREE.Vector3(-0.011, -0.017, 0)
// Rear face of the cylinder, where a cartridge's rim sits once loaded
export const CYL_REAR = CYL_LENGTH / 2
export const MUZZLE = new THREE.Vector3(0, PITCH_RADIUS, -0.027 - BARREL_LENGTH)
export const GAP = new THREE.Vector3(0, PITCH_RADIUS, -CYL_LENGTH / 2 - 0.002)
export const HAMMER_PIVOT = new THREE.Vector3(0, 0.002, 0.042)

const scaleUv = (geometry, s) => {
  const uv = geometry.attributes.uv
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * s, uv.getY(i) * s)
  return geometry
}

/** A closed outline from [z, y] points, optionally with a rounded corner radius */
const profile = (points) => {
  const shape = new THREE.Shape()
  points.forEach(([z, y], i) => (i ? shape.lineTo(z, y) : shape.moveTo(z, y)))
  shape.closePath()
  return shape
}

// Side views are drawn in (z, y); extruding along the shape's normal then
// rotating by -90° about Y turns the shape's x into the gun's z
const sideExtrude = (shape, width, bevel = 0.0008, holes = []) => {
  holes.forEach((h) => shape.holes.push(h))
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: width,
    bevelEnabled: bevel > 0,
    bevelThickness: bevel,
    bevelSize: bevel,
    bevelSegments: 2,
    curveSegments: 12,
  })
  geometry.translate(0, 0, -width / 2)
  // Rotating by -90° about Y sends the shape's x onto the gun's +z
  geometry.rotateY(-Math.PI / 2)
  return scaleUv(geometry, 12)
}

/** The fluted cylinder with its six chambers bored through */
const cylinderGeometry = () => {
  const shape = new THREE.Shape()
  const n = 240
  for (let i = 0; i <= n; i++) {
    const phi = (i / n) * Math.PI * 2
    const flute = Math.pow(Math.max(0, -Math.cos(CHAMBERS * phi)), 1.6)
    const r = CYL_RADIUS - 0.0028 * flute
    const x = Math.sin(phi) * r
    const y = Math.cos(phi) * r
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  for (let k = 0; k < CHAMBERS; k++) {
    const phi = (k / CHAMBERS) * Math.PI * 2
    const hole = new THREE.Path()
    hole.absarc(Math.sin(phi) * PITCH_RADIUS, Math.cos(phi) * PITCH_RADIUS, CHAMBER_RADIUS, 0, Math.PI * 2, true)
    shape.holes.push(hole)
  }
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: CYL_LENGTH - 0.0024,
    bevelEnabled: true,
    bevelThickness: 0.0012,
    bevelSize: 0.001,
    bevelSegments: 2,
    curveSegments: 20,
  })
  geometry.translate(0, 0, -(CYL_LENGTH - 0.0024) / 2)
  return scaleUv(geometry, 25)
}

export const buildRevolver = ({ lowPerf }) => {
  const steel = new THREE.MeshPhysicalMaterial({
    color: STEEL,
    metalness: 1,
    roughness: 0.36,
    clearcoat: 0.3,
    clearcoatRoughness: 0.4,
    normalMap: brushedNormal(),
    normalScale: new THREE.Vector2(0.4, 0.4),
    roughnessMap: wearRoughness(),
    envMapIntensity: 1.1,
  })
  if (!lowPerf) {
    steel.anisotropy = 0.5
    steel.anisotropyRotation = Math.PI / 2
  }
  const steelDark = new THREE.MeshStandardMaterial({ color: '#05080c', metalness: 0.9, roughness: 0.6 })
  // Sights and the rib are matte on a real Python, and polished they would draw a white line
  const steelMatte = new THREE.MeshStandardMaterial({
    color: '#0a1018',
    metalness: 0.85,
    roughness: 0.62,
    normalMap: brushedNormal(),
    normalScale: new THREE.Vector2(0.3, 0.3),
  })
  const bore = new THREE.MeshBasicMaterial({ color: '#000000', side: THREE.BackSide })
  const woodMap = walnut()
  woodMap.wrapS = woodMap.wrapT = THREE.RepeatWrapping
  const wood = new THREE.MeshStandardMaterial({ map: woodMap, roughness: 0.5, metalness: 0 })

  const gun = new THREE.Group()
  gun.name = 'gun'
  const body = new THREE.Group()
  body.name = 'body'
  gun.add(body)

  const mesh = (geometry, material, name) => {
    const m = new THREE.Mesh(geometry, material)
    m.name = name
    m.castShadow = !lowPerf
    m.receiveShadow = !lowPerf
    return m
  }

  // Frame: top strap over the cylinder, recoil shield, grip strap
  const frameShape = profile([
    [-0.027, -0.012], [-0.027, 0.0305], [0.034, 0.0305], [0.044, 0.026], [0.047, 0.012], [0.052, 0.004],
    [0.084, -0.086], [0.080, -0.100], [0.056, -0.104], [0.040, -0.062], [0.028, -0.034],
    [0.012, -0.034], [-0.006, -0.030], [-0.027, -0.030],
  ])
  const windowPath = new THREE.Path()
  windowPath.moveTo(-0.0235, -0.0225)
  windowPath.lineTo(0.0235, -0.0225)
  windowPath.lineTo(0.0235, 0.021)
  windowPath.lineTo(-0.0235, 0.021)
  windowPath.closePath()
  body.add(mesh(sideExtrude(frameShape, 0.028, 0.0012, [windowPath]), steel, 'frame'))

  // Barrel, on the axis of the top chamber
  const barrelPts = [
    [0, 0], [0.0092, 0], [0.0092, 0.012], [0.0084, 0.03], [0.0078, 0.14], [0.0082, 0.148], [0.0082, BARREL_LENGTH],
    [0.0058, BARREL_LENGTH], [0.0046, BARREL_LENGTH - 0.0012],
  ].map(([r, l]) => new THREE.Vector2(r, l))
  const barrelGeo = new THREE.LatheGeometry(barrelPts, 36)
  barrelGeo.rotateX(-Math.PI / 2)
  const barrel = mesh(barrelGeo, steel, 'barrel')
  barrel.position.set(0, PITCH_RADIUS, -0.027)
  body.add(barrel)
  const boreGeo = new THREE.CylinderGeometry(0.0046, 0.0046, 0.05, 20, 1, true)
  boreGeo.rotateX(Math.PI / 2)
  const boreMesh = new THREE.Mesh(boreGeo, bore)
  boreMesh.position.set(0, PITCH_RADIUS, MUZZLE.z + 0.025)
  body.add(boreMesh)

  // Vent rib and its slots, front and rear sights
  const rib = mesh(new THREE.BoxGeometry(0.007, 0.004, BARREL_LENGTH - 0.004), steelMatte, 'rib')
  rib.position.set(0, PITCH_RADIUS + 0.0092 + 0.002, -0.027 - BARREL_LENGTH / 2 + 0.002)
  body.add(rib)
  for (let i = 0; i < 6; i++) {
    const vent = new THREE.Mesh(new THREE.BoxGeometry(0.009, 0.0022, 0.009), steelDark)
    vent.position.set(0, PITCH_RADIUS + 0.0092 - 0.0004, -0.045 - i * 0.02)
    body.add(vent)
  }
  const frontSight = mesh(new THREE.BoxGeometry(0.0022, 0.008, 0.009), steelDark, 'frontSight')
  frontSight.position.set(0, PITCH_RADIUS + 0.0092 + 0.006, MUZZLE.z + 0.007)
  body.add(frontSight)
  const rearSight = mesh(new THREE.BoxGeometry(0.011, 0.0035, 0.008), steelMatte, 'rearSight')
  rearSight.position.set(0, 0.032, 0.036)
  body.add(rearSight)

  // Full underlug, housing the ejector rod when the cylinder is closed
  const lugShape = profile([
    [-0.027, -0.012], [-0.027, 0.006], [-0.166, 0.006], [-0.173, 0.0], [-0.173, -0.006], [-0.150, -0.011],
  ])
  body.add(mesh(sideExtrude(lugShape, 0.013, 0.0012), steel, 'underlug'))

  // Trigger guard and trigger
  const guard = mesh(new THREE.TorusGeometry(0.0135, 0.0026, 10, 32), steel, 'guard')
  guard.rotation.y = Math.PI / 2
  guard.position.set(0, -0.041, 0.016)
  body.add(guard)
  const triggerPivot = new THREE.Group()
  triggerPivot.name = 'trigger'
  triggerPivot.position.set(0, -0.031, 0.011)
  const trigger = mesh(new THREE.BoxGeometry(0.0045, 0.018, 0.0045), steelDark, 'triggerBlade')
  trigger.position.set(0, -0.009, 0.001)
  trigger.rotation.x = 0.25
  triggerPivot.add(trigger)
  body.add(triggerPivot)

  // Grip panels, walnut, slightly wider than the frame
  const gripShape = profile([
    [0.033, -0.040], [0.050, -0.005], [0.056, -0.008], [0.081, -0.087], [0.077, -0.098], [0.059, -0.1], [0.041, -0.064],
  ])
  const gripGeo = new THREE.ExtrudeGeometry(gripShape, {
    depth: 0.030,
    bevelEnabled: true,
    bevelThickness: 0.0045,
    bevelSize: 0.0035,
    bevelSegments: 4,
    curveSegments: 8,
  })
  gripGeo.translate(0, 0, -0.015)
  gripGeo.rotateY(-Math.PI / 2)
  body.add(mesh(scaleUv(gripGeo, 9), wood, 'grip'))

  // Hammer, pivoting in the rear of the frame
  const hammerPivot = new THREE.Group()
  hammerPivot.name = 'hammer'
  hammerPivot.position.copy(HAMMER_PIVOT)
  const hammerShape = profile([
    [-0.004, -0.004], [0.006, -0.004], [0.009, 0.008], [0.016, 0.018], [0.025, 0.025], [0.027, 0.030],
    [0.021, 0.031], [0.010, 0.025], [0.004, 0.016], [-0.004, 0.010],
  ])
  hammerPivot.add(mesh(sideExtrude(hammerShape, 0.0065, 0.0008), steel, 'hammerBlade'))
  body.add(hammerPivot)

  // Cylinder release latch, on the left of the frame, pulled back by the thumb
  const latch = mesh(new THREE.BoxGeometry(0.0035, 0.009, 0.015), steel, 'latch')
  latch.position.set(-0.0155, 0.004, 0.034)
  body.add(latch)

  // The crane: the hinge, and the cylinder riding on it
  const crane = new THREE.Group()
  crane.name = 'crane'
  crane.position.copy(CRANE_PIVOT)
  const hingeGeo = new THREE.CylinderGeometry(0.0038, 0.0038, 0.05, 14)
  hingeGeo.rotateX(Math.PI / 2)
  const hinge = mesh(hingeGeo, steel, 'hinge')
  hinge.position.set(0, 0, -0.03)
  crane.add(hinge)
  const arm = mesh(new THREE.BoxGeometry(0.006, CRANE_PIVOT.length(), 0.012), steel, 'craneArm')
  arm.position.set(-CRANE_PIVOT.x / 2, -CRANE_PIVOT.y / 2, -0.024)
  arm.rotation.z = -Math.atan2(-CRANE_PIVOT.x, -CRANE_PIVOT.y)
  crane.add(arm)

  const cyl = new THREE.Group()
  cyl.name = 'cyl'
  cyl.position.set(-CRANE_PIVOT.x, -CRANE_PIVOT.y, 0)
  crane.add(cyl)
  const cylinder = mesh(cylinderGeometry(), steel, 'cylinder')
  cyl.add(cylinder)
  // Ratchet star on the rear face, ejector rod and its knob at the front
  const ratchetGeo = new THREE.CylinderGeometry(0.0045, 0.0045, 0.003, CHAMBERS)
  ratchetGeo.rotateX(Math.PI / 2)
  const ratchet = mesh(ratchetGeo, steelDark, 'ratchet')
  ratchet.position.set(0, 0, CYL_REAR + 0.0015)
  cyl.add(ratchet)
  const rodGeo = new THREE.CylinderGeometry(0.0026, 0.0026, 0.056, 12)
  rodGeo.rotateX(Math.PI / 2)
  const rod = mesh(rodGeo, steel, 'rod')
  rod.position.set(0, 0, -CYL_REAR - 0.028)
  cyl.add(rod)
  const knobGeo = new THREE.CylinderGeometry(0.004, 0.0036, 0.009, 12)
  knobGeo.rotateX(Math.PI / 2)
  const knob = mesh(knobGeo, steel, 'knob')
  knob.position.set(0, 0, -CYL_REAR - 0.058)
  cyl.add(knob)
  body.add(crane)

  return {
    gun,
    body,
    crane,
    cyl,
    cylinder,
    hammer: hammerPivot,
    trigger: triggerPivot,
    latch,
    materials: [steel, steelDark, steelMatte, bore, wood],
    dispose: () => {
      gun.traverse((o) => o.geometry?.dispose())
      ;[steel, steelDark, steelMatte, bore, wood].forEach((m) => m.dispose())
    },
  }
}
