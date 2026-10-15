import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import Desk from './Desk'
import Landmarks from './Landmarks'
import Lettering from './Lettering'
import Parchment from './Parchment'
import Prints from './Prints'
import Props from './Props'
import Road from './Road'
import { geometryOf } from './builders'
import { clearanceReport } from './clearance'
import { EYE, FOV, FOV_PORTRAIT, legAt, smoother } from './track'

// How far the pointer turns the head: a hint of depth, no more
const LOOK = 0.015
// Until the page has measured its notes: a cartouche covers about 44 % of a
// wide window on one side, the map slides to the other
const SHIFT_X = 0.22
// On a narrow window the cartouche sits under the scene: the map rises into the free band
const SHIFT_Y = 0.2

/**
 * Eases the scene toward the page's scroll position, before anything else
 * reads it (priority -1). Everything downstream reads `store.s` (the focus),
 * `store.u` (the roll front) and `store.moving`, and only requests a frame
 * while something still moves.
 */
const Driver = ({ store, reduceMotion }) => {
  const invalidate = useThree((state) => state.invalidate)

  useEffect(() => {
    store.attach(invalidate)
    return () => store.detach()
  }, [store, invalidate])

  useFrame((state, delta) => {
    if (store.step(delta, state.clock.elapsedTime, reduceMotion)) state.invalidate()
  }, -1)

  return null
}

/**
 * The visitor floats above the map, a little behind the focus, looking down
 * the road. The map moves sideways to the half of the window the note leaves
 * free, during the journey from one stop to the next and only then: once at
 * a stop, nothing moves but what the pointer asks for.
 */
const Rig = ({ store, reduceMotion, coarse, narrow, sides }) => {
  const pointer = useRef({ x: 0, y: 0 })
  const look = useRef({ x: 0, y: 0 })
  const target = useMemo(() => new THREE.Vector3(), [])

  useEffect(() => {
    if (coarse || reduceMotion) return undefined
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
      store.touch()
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [store, coarse, reduceMotion])

  useFrame((state) => {
    const camera = state.camera
    const { width, height } = state.size
    const fov = width < height ? FOV_PORTRAIT : FOV
    if (camera.fov !== fov) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }

    const l = look.current
    const ease = 1 - Math.exp(-store.delta * 6)
    l.x += (pointer.current.x - l.x) * ease
    l.y += (pointer.current.y - l.y) * ease
    if (Math.abs(pointer.current.x - l.x) + Math.abs(pointer.current.y - l.y) > 1e-3) state.invalidate()

    camera.position.set(l.x * 0.25, EYE.height, -(store.s - EYE.back))
    target.set(l.x * (0.25 + LOOK * 40), 0.4 - l.y * 0.4, -(store.s + EYE.ahead))
    camera.lookAt(target)

    const { i, f } = legAt(store.current)
    const side = (k) => store.shifts?.[k] ?? (sides[k] === 'right' ? SHIFT_X : -SHIFT_X)
    const along = smoother(Math.min(1, Math.max(0, f)))
    const shiftX = narrow ? 0 : side(i) + (side(i + 1) - side(i)) * along
    const shiftY = narrow ? SHIFT_Y : 0
    camera.setViewOffset(width, height, shiftX * width, shiftY * height, width, height)
  })

  return null
}

/**
 * The lights travel with the visitor: a desk lamp pooling warm light on the
 * map ahead, and a sun for crisp shadows, whose shadow map stays where it is
 * needed.
 */
const Lamp = ({ store, lowPerf }) => {
  const group = useRef()
  const lamp = useMemo(() => {
    const light = new THREE.SpotLight('#ffe2b4', lowPerf ? 700 : 850, 44, 0.5, 0.85, 2)
    light.position.set(-6, 12, 2)
    light.target.position.set(0, 0, -4)
    return light
  }, [lowPerf])
  const sun = useMemo(() => {
    const light = new THREE.DirectionalLight('#fff4e0', 1.05)
    light.position.set(6, 12, 5)
    light.target.position.set(0, 0, -5)
    light.castShadow = !lowPerf
    light.shadow.mapSize.set(1024, 1024)
    light.shadow.camera.left = -16
    light.shadow.camera.right = 16
    light.shadow.camera.top = 18
    light.shadow.camera.bottom = -14
    light.shadow.camera.near = 1
    light.shadow.camera.far = 40
    light.shadow.bias = -0.0015
    light.shadow.normalBias = 0.02
    return light
  }, [lowPerf])

  useFrame(() => {
    group.current.position.z = -store.s
  })

  return (
    <group ref={group}>
      <primitive object={lamp} />
      <primitive object={lamp.target} />
      <primitive object={sun} />
      <primitive object={sun.target} />
    </group>
  )
}

// Extent of a prop for the clearance check: { h, y0, r } at scale 1
const sizeOf = (type, seed) => {
  const geometry = geometryOf(type, seed)
  if (!geometry.boundingBox) geometry.computeBoundingBox()
  const box = geometry.boundingBox
  return { h: box.max.y, y0: box.min.y, r: Math.max(-box.min.x, box.max.x, -box.min.z, box.max.z) }
}

/** Development only: says which props hide a name lettered on the map. */
const ClearanceCheck = () => {
  useEffect(() => {
    const conflicts = clearanceReport(sizeOf)
    if (conflicts.length) console.warn(`[origami] lettering hidden:\n${conflicts.join('\n')}`)
  }, [])
  return null
}

/**
 * The paper map. Purely visual: every piece of content also exists as HTML in
 * the theme's cartouches, and the canvas is hidden from assistive technology.
 */
const Scene = ({ store, lang, lowPerf, narrow, reduceMotion, coarse, palette, textured, sides, onAction, onHover }) => (
  <Canvas
    className="ori-canvas"
    aria-hidden="true"
    frameloop="demand"
    flat
    shadows={lowPerf ? false : 'soft'}
    dpr={lowPerf ? 1 : [1, 2]}
    camera={{ fov: FOV, near: 0.5, far: 90, position: [0, EYE.height, EYE.back] }}
  >
    <color attach="background" args={[palette.desk]} />
    <fog attach="fog" args={[palette.desk, lowPerf ? 16 : 22, lowPerf ? 38 : 52]} />
    <hemisphereLight args={['#fff8ec', palette.kraft, 0.55]} />
    {import.meta.env.DEV && <ClearanceCheck />}
    <Driver store={store} reduceMotion={reduceMotion} />
    <Rig store={store} reduceMotion={reduceMotion} coarse={coarse} narrow={narrow} sides={sides} />
    <Lamp store={store} lowPerf={lowPerf} />
    <Desk color={palette.deskLit} textured={textured} />
    <Parchment store={store} palette={palette} lowPerf={lowPerf} textured={textured} />
    <Road store={store} ink={palette.ink} />
    <Lettering store={store} lang={lang} palette={palette} coarse={coarse} onAction={onAction} onHover={onHover} />
    <Props store={store} lowPerf={lowPerf} reduceMotion={reduceMotion} />
    <Landmarks store={store} lang={lang} coarse={coarse} reduceMotion={reduceMotion} onAction={onAction} onHover={onHover} />
    <Prints store={store} lang={lang} coarse={coarse} reduceMotion={reduceMotion} lowPerf={lowPerf} onAction={onAction} onHover={onHover} />
  </Canvas>
)

export default Scene
