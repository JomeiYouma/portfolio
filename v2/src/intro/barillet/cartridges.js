import * as THREE from 'three'
import { headstamp, origamiCase, risoCase } from './textures'

// One .357 Magnum round per theme: same brass shape, four finishes. The HUD,
// the smears and the ink trails all borrow `accent`.

export const LOOKS = {
  neon: {
    accent: '#24fbc5',
    ink: '#dffcf4',
    metal: '#2a3038',
    primer: '#0d1116',
    bullet: '#0a0f14',
    band: '#24fbc5',
    segments: 36,
  },
  riso: {
    accent: '#e63f1a',
    ink: '#16246b',
    metal: '#f3eee2',
    primer: '#2743c4',
    bullet: '#16246b',
    segments: 36,
  },
  galerie: {
    accent: '#ffd400',
    ink: '#141311',
    metal: '#d9b25f',
    primer: '#ff4a26',
    bullet: '#b87333',
    segments: 36,
  },
  origami: {
    accent: '#b8381f',
    ink: '#2a2118',
    metal: '#d8bd93',
    primer: '#b8381f',
    bullet: '#efe4cc',
    segments: 9,
  },
}
const FALLBACK = { accent: '#9fb3c8', ink: '#e8eaf0', metal: '#c9c9c9', primer: '#333', bullet: '#555', segments: 36 }

export const lookOf = (id) => LOOKS[id] ?? FALLBACK

const lathe = (points, segments) => {
  const geometry = new THREE.LatheGeometry(
    points.map(([r, l]) => new THREE.Vector2(r, l)),
    segments,
  )
  // Revolved around +Y; the round lies along -Z, rim at the origin, nose forward
  geometry.rotateX(-Math.PI / 2)
  return geometry
}

const CASE = [
  [0, 0], [0.0052, 0], [0.0055, 0.0005], [0.0055, 0.0013], [0.0042, 0.0015], [0.0042, 0.0026],
  [0.0048, 0.0032], [0.0048, 0.0300], [0.0046, 0.0332], [0.0040, 0.0334],
]
const BULLET = [
  [0.0038, 0.0328], [0.0045, 0.0340], [0.0045, 0.0362], [0.0041, 0.0386], [0.0030, 0.0404], [0.0012, 0.0414], [0, 0.0416],
]

const materialsFor = (id, look) => {
  switch (id) {
    case 'neon':
      return {
        shell: new THREE.MeshPhysicalMaterial({ color: look.metal, metalness: 1, roughness: 0.16, clearcoat: 0.8, clearcoatRoughness: 0.15 }),
        bullet: new THREE.MeshPhysicalMaterial({ color: '#0a0f14', metalness: 1, roughness: 0.28 }),
      }
    case 'riso':
      return {
        shell: new THREE.MeshStandardMaterial({ map: risoCase({ paper: look.metal, blue: look.primer, red: look.accent }), roughness: 0.85, metalness: 0 }),
        bullet: new THREE.MeshStandardMaterial({ color: look.ink, roughness: 0.7, metalness: 0 }),
      }
    case 'origami':
      return {
        shell: new THREE.MeshStandardMaterial({ map: origamiCase({ kraft: look.metal, ink: look.ink }), roughness: 0.92, metalness: 0, flatShading: true }),
        bullet: new THREE.MeshStandardMaterial({ color: '#efe4cc', roughness: 0.9, metalness: 0, flatShading: true }),
      }
    case 'galerie':
    default:
      return {
        shell: new THREE.MeshPhysicalMaterial({ color: look.metal, metalness: 1, roughness: 0.14, clearcoat: 0.35 }),
        bullet: new THREE.MeshPhysicalMaterial({ color: '#b87333', metalness: 1, roughness: 0.3 }),
      }
  }
}

/** Builds one round. The group's origin is the rim; the nose points down -Z. */
export const buildCartridge = (id, { lowPerf }) => {
  const look = lookOf(id)
  const { shell, bullet } = materialsFor(id, look)
  const group = new THREE.Group()
  group.name = `cartridge-${id}`
  const shellMesh = new THREE.Mesh(lathe(CASE, look.segments), shell)
  const bulletMesh = new THREE.Mesh(lathe(BULLET, look.segments), bullet)
  shellMesh.castShadow = bulletMesh.castShadow = !lowPerf
  group.add(shellMesh, bulletMesh)

  const stampMaterial = new THREE.MeshStandardMaterial({
    map: headstamp(id, look),
    metalness: id === 'riso' || id === 'origami' ? 0 : 0.85,
    roughness: id === 'riso' || id === 'origami' ? 0.85 : 0.35,
  })
  const stamp = new THREE.Mesh(new THREE.CircleGeometry(0.0054, 40), stampMaterial)
  stamp.position.z = 0.00025
  group.add(stamp)

  const materials = [shell, bullet, stampMaterial]
  if (look.band) {
    // The tracer ring: unlit, so the bloom picks it up
    // A thin painted ring, lit on its own but under the bloom threshold, so it reads as paint and not as a cut
    const bandMaterial = new THREE.MeshStandardMaterial({ color: look.band, emissive: look.band, emissiveIntensity: 0.7, roughness: 0.4, metalness: 0 })
    const bandGeo = new THREE.CylinderGeometry(0.00485, 0.00485, 0.0014, look.segments, 1, true)
    bandGeo.rotateX(Math.PI / 2)
    const band = new THREE.Mesh(bandGeo, bandMaterial)
    band.position.z = -0.0312
    group.add(band)
    materials.push(bandMaterial)
  }

  return {
    group,
    look,
    meshes: [shellMesh, bulletMesh],
    dispose: () => {
      group.traverse((o) => o.geometry?.dispose())
      materials.forEach((m) => m.dispose())
    },
  }
}
