import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { gloveNormal } from './textures'

// The hand on the grip: the WebXR generic hand (MIT, Amazon), a skinned mesh
// with twenty-five joints that all sit flat under the armature. Poses are
// therefore computed here, chain by chain, from the rest pose: each joint's
// matrix relative to the previous one, times a blend of pose rotations.
// Flexion is a turn about the joint's local X; abduction about Y.

const CHAINS = [
  ['thumb-metacarpal', 'thumb-phalanx-proximal', 'thumb-phalanx-distal', 'thumb-tip'],
  ['index-finger-metacarpal', 'index-finger-phalanx-proximal', 'index-finger-phalanx-intermediate', 'index-finger-phalanx-distal', 'index-finger-tip'],
  ['middle-finger-metacarpal', 'middle-finger-phalanx-proximal', 'middle-finger-phalanx-intermediate', 'middle-finger-phalanx-distal', 'middle-finger-tip'],
  ['ring-finger-metacarpal', 'ring-finger-phalanx-proximal', 'ring-finger-phalanx-intermediate', 'ring-finger-phalanx-distal', 'ring-finger-tip'],
  ['pinky-finger-metacarpal', 'pinky-finger-phalanx-proximal', 'pinky-finger-phalanx-intermediate', 'pinky-finger-phalanx-distal', 'pinky-finger-tip'],
]

// [flex, abduct, twist] in radians, per joint. The grip is always on; the
// others are blended in by the rig's weights.
const POSES = {
  grip: {
    'index-finger-phalanx-proximal': [0.55, 0.05, 0],
    'index-finger-phalanx-intermediate': [0.75, 0, 0],
    'index-finger-phalanx-distal': [0.35, 0, 0],
    'middle-finger-phalanx-proximal': [1.3, 0, 0],
    'middle-finger-phalanx-intermediate': [1.6, 0, 0],
    'middle-finger-phalanx-distal': [0.8, 0, 0],
    'ring-finger-phalanx-proximal': [1.35, -0.05, 0],
    'ring-finger-phalanx-intermediate': [1.6, 0, 0],
    'ring-finger-phalanx-distal': [0.85, 0, 0],
    'pinky-finger-phalanx-proximal': [1.4, -0.1, 0],
    'pinky-finger-phalanx-intermediate': [1.6, 0, 0],
    'pinky-finger-phalanx-distal': [0.85, 0, 0],
    'thumb-metacarpal': [0.3, -0.45, 0],
    'thumb-phalanx-proximal': [0.35, 0, 0],
    'thumb-phalanx-distal': [0.3, 0, 0],
  },
  latch: {
    'thumb-metacarpal': [-0.35, 0.25, 0],
    'thumb-phalanx-proximal': [-0.3, 0, 0],
  },
  cock: {
    'thumb-metacarpal': [-0.6, 0.1, 0],
    'thumb-phalanx-proximal': [-0.4, 0, 0],
    'thumb-phalanx-distal': [-0.2, 0, 0],
  },
  flick: {
    'thumb-metacarpal': [-0.3, 0.6, 0],
    'thumb-phalanx-proximal': [-0.2, 0, 0],
  },
  trigger: {
    'index-finger-phalanx-proximal': [0.25, 0, 0],
    'index-finger-phalanx-intermediate': [0.2, 0, 0],
    'index-finger-phalanx-distal': [0.1, 0, 0],
  },
}

// Where the armature sits in gun space: fingers toward the front strap, the
// palm against the right panel, the thumb up along the left side
const ROOT = { position: [-0.013, -0.051, 0.086], rotation: [Math.PI / 2, 0, 0] }

const _e = new THREE.Euler()
const _rot = new THREE.Matrix4()
const _inv = new THREE.Matrix4()

export const loadHand = (url, { lowPerf } = {}) =>
  new Promise((resolve, reject) => {
    new GLTFLoader().load(
      url,
      (gltf) => {
        const root = gltf.scene
        root.name = 'fx-hand'
        let mesh = null
        root.traverse((o) => {
          if (o.isSkinnedMesh) mesh = o
        })
        if (!mesh) {
          reject(new Error('hand: no skinned mesh'))
          return
        }
        const material = new THREE.MeshStandardMaterial({
          color: '#26201c',
          roughness: 0.82,
          metalness: 0,
          normalMap: gloveNormal(),
          normalScale: new THREE.Vector2(0.35, 0.35),
        })
        mesh.material = material
        mesh.frustumCulled = false
        mesh.castShadow = !lowPerf
        mesh.receiveShadow = false
        root.position.fromArray(ROOT.position)
        root.rotation.fromArray(ROOT.rotation)

        const bones = new Map()
        mesh.skeleton.bones.forEach((b) => bones.set(b.name, b))
        const rest = new Map()
        bones.forEach((b, name) => {
          b.updateMatrix()
          rest.set(name, b.matrix.clone())
        })
        // Each joint relative to the one before it on its chain
        const local = new Map()
        const posed = new Map()
        CHAINS.forEach((chain) => {
          let parent = 'wrist'
          chain.forEach((name) => {
            if (!rest.has(name)) return
            _inv.copy(rest.get(parent)).invert()
            local.set(name, new THREE.Matrix4().multiplyMatrices(_inv, rest.get(name)))
            posed.set(name, new THREE.Matrix4())
            parent = name
          })
        })
        posed.set('wrist', new THREE.Matrix4())
        const weights = { grip: 1, latch: 0, cock: 0, flick: 0, trigger: 0 }
        const tweaks = new Map()

        const blended = (name, out) => {
          out[0] = out[1] = out[2] = 0
          for (const key in weights) {
            const w = weights[key]
            if (!w) continue
            const p = POSES[key][name]
            if (!p) continue
            out[0] += p[0] * w
            out[1] += p[1] * w
            out[2] += p[2] * w
          }
          const extra = tweaks.get(name)
          if (extra) {
            out[0] += extra[0]
            out[1] += extra[1]
            out[2] += extra[2]
          }
          return out
        }
        const angles = [0, 0, 0]

        const pose = () => {
          const wrist = bones.get('wrist')
          posed.get('wrist').copy(rest.get('wrist'))
          posed.get('wrist').decompose(wrist.position, wrist.quaternion, wrist.scale)
          CHAINS.forEach((chain) => {
            let parentM = posed.get('wrist')
            chain.forEach((name) => {
              const bone = bones.get(name)
              if (!bone || !local.has(name)) return
              blended(name, angles)
              _e.set(-angles[0], angles[1], angles[2])
              _rot.makeRotationFromEuler(_e)
              const m = posed.get(name)
              m.multiplyMatrices(parentM, local.get(name)).multiply(_rot)
              m.decompose(bone.position, bone.quaternion, bone.scale)
              parentM = m
            })
          })
        }

        const update = (rig) => {
          weights.latch = rig.hand.latch
          weights.cock = rig.hand.cock
          weights.flick = rig.hand.flick
          weights.trigger = Math.max(rig.hand.trigger, rig.trigger)
          pose()
        }
        pose()

        if (import.meta.env.DEV) {
          // Tuning from the console: __barilletHand.root(x, y, z, rx, ry, rz), .joint(name, flex, abd, twist), .dump()
          window.__barilletHand = {
            root: (x, y, z, rx, ry, rz) => {
              root.position.set(x, y, z)
              root.rotation.set(rx, ry, rz)
            },
            joint: (name, flex, abd = 0, twist = 0) => tweaks.set(name, [flex, abd, twist]),
            dump: () => ({ root: { position: root.position.toArray(), rotation: root.rotation.toArray().slice(0, 3) }, tweaks: Object.fromEntries(tweaks) }),
            bones: Array.from(bones.keys()),
          }
        }

        resolve({
          root,
          mesh,
          update,
          dispose: () => {
            material.dispose()
            mesh.geometry.dispose()
            if (import.meta.env.DEV) delete window.__barilletHand
          },
        })
      },
      undefined,
      reject,
    )
  })
