import { useEffect, useMemo, useRef } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { aimAngles, aimPoint, createAimState, hitTest, stepAim, writeAim } from './aim'
import { buildBottle, createMissFx, createShatter } from './bottle'
import { buildCartridge } from './cartridges'
import {
  createDust, createGapFlash, createMultiples, createMuzzleFlash, createSmear, createSmoke, createSpawnFx, createTrails,
} from './fx'
import { loadHand } from './hand'
import { bezier, noise1, projectOnScreen, smoothstep, writeExtent } from './motion'
import { Post } from './post'
import { CYL_REAR, MUZZLE, buildRevolver } from './revolver'
import { PITCH_RADIUS, POSES, STEP } from './rig'
import { backdrop, disposeTextures } from './textures'
import { asset } from '../../utils/asset'

const FOV = 50
const FOV_PORTRAIT = 64
// How far the pointer turns the head, radians
const LOOK = 0.03

/** Reflections for the steel and the glass: a lit room, without any file to fetch */
const Environment = () => {
  const get = useThree((state) => state.get)
  useEffect(() => {
    const { gl, scene } = get()
    const pmrem = new THREE.PMREMGenerator(gl)
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
    scene.environment = env
    scene.environmentIntensity = 0.45
    pmrem.dispose()
    return () => {
      scene.environment = null
      env.dispose()
    }
  }, [get])
  return null
}

/** Per-frame scratch space, allocated once */
const scratch = () => ({
  cylPos: new THREE.Vector3(),
  sp: new THREE.Vector3(),
  ctrl: new THREE.Vector3(),
  end: new THREE.Vector3(),
  chamber: new THREE.Vector3(),
  axis: new THREE.Vector3(),
  v: new THREE.Vector3(),
  bottleCam: new THREE.Vector3(),
  bottleWorld: new THREE.Vector3(),
  aimPt: new THREE.Vector3(),
  pivot: new THREE.Vector3(),
  edge: new THREE.Object3D(),
  corner: { x: 0, y: 0, depth: 0 },
  qHover: new THREE.Quaternion(),
  qTarget: new THREE.Quaternion(),
  qCam: new THREE.Quaternion(),
  euler: new THREE.Euler(),
  prevSpin: null,
  ratchet: 0,
  prevRoll: 0,
  prevCrane: 0,
  bottlePointer: { x: 0, y: 0 },
})

/** Where round k floats before it is picked: an arc left of the open cylinder, or above it on a phone */
const spawnPoint = (out, k, count, cylPos, portrait) => {
  if (portrait) {
    const spread = 0.04
    out.set(cylPos.x - ((count - 1) / 2) * spread + k * spread, cylPos.y + 0.13 - Math.abs(k - (count - 1) / 2) * 0.008, cylPos.z + 0.02)
    return out
  }
  const a = -0.6 + (k / Math.max(1, count - 1)) * 1.2
  out.set(cylPos.x - Math.cos(a) * 0.105, cylPos.y + Math.sin(a) * 0.08 + 0.035, cylPos.z + 0.03)
  return out
}

/**
 * The hand, the revolver, the rounds and the bottle. The gun hangs from the
 * camera, as a first-person view model does; the room, the bottle, the dust
 * and the motion effects live in the scene. The rig is read every frame;
 * nothing here is React state.
 */
const World = ({ rig, themes, lowPerf, portrait, coarse, pointer, emit }) => {
  const camera = useThree((state) => state.camera)
  const keyTarget = useMemo(() => new THREE.Object3D(), [])
  const kicker = useRef()
  // The scene graph is built once for the JSX below; every frame then works
  // on it through these refs, the way the rest of the app drives three
  const worldRef = useRef(null)
  const tmpRef = useRef(null)

  const world = useMemo(() => {
    const revolver = buildRevolver({ lowPerf })
    const carts = themes.map((theme) => buildCartridge(theme.id, { lowPerf }))
    const muzzle = new THREE.Object3D()
    muzzle.name = 'fx-muzzle'
    muzzle.position.copy(MUZZLE)
    revolver.body.add(muzzle)
    const sweep = new THREE.PointLight('#dfe9ff', 0, 0.35, 2)
    sweep.name = 'fx-sweep'
    sweep.position.set(0.05, 0.08, 0.1)
    revolver.body.add(sweep)

    const flash = createMuzzleFlash(muzzle, lowPerf)
    const gap = createGapFlash(revolver.body)
    const smoke = createSmoke(muzzle)
    const dust = createDust(lowPerf ? 120 : 260)
    const cylGhosts = createMultiples(revolver.cylinder, { color: '#9fb3c8', count: 4, threshold: 5, opacity: 0.12 })
    const gunGhosts = createMultiples(revolver.body, { color: '#9fb3c8', count: 3, threshold: 5.5, opacity: 0.1 })
    const cartFx = carts.map((c) => ({
      smear: createSmear(c.group, { color: c.look.accent }),
      trails: createTrails(c.group, { color: c.look.accent }),
      ghosts: createMultiples(c.group, { color: c.look.accent, count: 4, threshold: 14, opacity: 0.25 }),
      spawn: createSpawnFx(c.group, c.look),
    }))
    const bottle = buildBottle({ lowPerf, portrait })
    const shatter = createShatter(bottle)
    const missFx = createMissFx()
    const aim = createAimState()

    const root = new THREE.Group()
    root.name = 'fx-root'
    root.add(smoke.object, dust.object, cylGhosts.object, gunGhosts.object, shatter.object, missFx.object)
    cartFx.forEach((f) => root.add(f.smear.object, f.trails.object, f.ghosts.object))
    const cartRoot = new THREE.Group()
    cartRoot.name = 'cartridges'
    carts.forEach((c) => cartRoot.add(c.group))
    const room = new THREE.Mesh(new THREE.PlaneGeometry(9, 9), new THREE.MeshBasicMaterial({ map: backdrop() }))
    room.name = 'room'
    room.position.set(0, 0.6, -3.6)

    return {
      revolver, carts, muzzle, sweep, flash, gap, smoke, dust, cylGhosts, gunGhosts, cartFx, root, cartRoot, room,
      bottle, shatter, missFx, aim, hand: null,
    }
  }, [themes, lowPerf, portrait])

  useEffect(() => {
    worldRef.current = world
    // The hand arrives when its model has loaded; the gun does not wait for it
    let alive = true
    loadHand(asset('assets/models/hand-right.glb'), { lowPerf })
      .then((hand) => {
        const w = worldRef.current
        if (!alive || !w) {
          hand.dispose()
          return
        }
        w.hand = hand
        w.revolver.body.add(hand.root)
      })
      .catch(() => {
        // No hand: the gun is held by nobody, which the sequence survives
      })
    return () => {
      alive = false
      const w = worldRef.current
      worldRef.current = null
      if (!w) return
      w.hand?.dispose()
      w.revolver.dispose()
      w.carts.forEach((c) => c.dispose())
      ;[w.flash, w.gap, w.smoke, w.dust, w.cylGhosts, w.gunGhosts, w.bottle, w.shatter, w.missFx].forEach((f) => f.dispose())
      w.cartFx.forEach((f) => Object.values(f).forEach((x) => x.dispose()))
      w.room.geometry.dispose()
      w.room.material.dispose()
      disposeTextures()
    }
  }, [world, lowPerf])

  useFrame((state, delta) => {
    const w = worldRef.current
    if (!w) return
    if (!tmpRef.current) tmpRef.current = scratch()
    const tmp = tmpRef.current
    const camera = state.camera
    // Capped for the physics; the effects judge speed on the real elapsed time
    const dt = Math.min(delta, 1 / 20)
    const real = Math.max(delta, 1e-4)
    const t = state.clock.elapsedTime
    const { revolver, carts, cartFx, bottle } = w
    const r = rig

    // The bottle, seen from the eye: where it is, and how the camera would turn to frame it
    bottle.proxy.getWorldPosition(tmp.bottleWorld)
    const lookYaw = -Math.atan2(tmp.bottleWorld.x, -tmp.bottleWorld.z)
    const lookPitch = Math.atan2(tmp.bottleWorld.y, Math.hypot(tmp.bottleWorld.x, tmp.bottleWorld.z))

    // The head: field of view, breathing, a tremor, the pointer, the shot's kick, the push-ins
    const fov = (portrait ? FOV_PORTRAIT : FOV) / r.cam.zoom
    if (Math.abs(camera.fov - fov) > 1e-3) {
      camera.fov = fov
      camera.updateProjectionMatrix()
    }
    const breathe = Math.sin(t * Math.PI * 2 * 0.2) * r.breath
    camera.position.set(0, 0, -r.cam.dolly)
    camera.rotation.set(
      -pointer.y * LOOK * r.look + r.cam.pitch + lookPitch * r.cam.look + r.kick * 0.045 + breathe * 0.003,
      -pointer.x * LOOK * r.look + r.cam.yaw + lookYaw * r.cam.look,
      r.cam.roll + r.kick * 0.022 + noise1(t * 1.3, 2) * 0.0015 * r.breath,
    )

    // The hand: pose, offsets, breathing, tremor, recoil, and the rise into frame
    const g = revolver.gun
    const below = 1 - r.rise
    // A phone is narrow: the same poses, a little further and more to the left
    const far = portrait ? 1.3 : 1
    g.position.set(
      (r.gun.x + r.off.x) * (portrait ? 0.6 : 1) + noise1(t * 2.1, 1) * 0.0005 * r.breath,
      r.gun.y * far + r.off.y - below * 0.3 + breathe * 0.0035 + noise1(t * 1.7, 3) * 0.0005 * r.breath,
      (r.gun.z + r.off.z) * far + r.recoil * 0.03,
    )

    // Aiming from the hip: the barrel follows the pointer on a spring
    if (r.aimBlend > 0.001) {
      camera.updateMatrixWorld(true)
      tmp.bottleCam.copy(tmp.bottleWorld)
      camera.worldToLocal(tmp.bottleCam)
      // A touch screen cannot aim: the barrel goes to the bottle by itself
      const src = coarse ? tmp.bottlePointer : pointer
      aimPoint(camera, src, tmp.bottleCam, coarse ? 1 : r.aimForce, tmp.aimPt)
      tmp.pivot.set(g.position.x, g.position.y + PITCH_RADIUS, g.position.z)
      const want = aimAngles(tmp.pivot, tmp.aimPt)
      stepAim(w.aim, want.yaw - POSES.hip.yaw, want.pitch - POSES.hip.pitch, dt)
      writeAim(r, w.aim.yaw.x, w.aim.pitch.x)
      hitTest(w.aim, r, camera, src, [bottle.proxy, w.room, bottle.floor])
    }
    g.rotation.set(
      r.gun.pitch + r.off.pitch + r.aim.pitch * r.aimBlend + r.recoil * 0.1 + below * 0.4,
      r.gun.yaw + r.aim.yaw * r.aimBlend,
      r.gun.roll + r.off.roll,
      'YXZ',
    )

    // Articulations
    revolver.crane.rotation.z = r.crane
    const spin = r.cyl + r.spinTravel * r.spinT + Math.sin(r.detent * Math.PI) * -0.035
    revolver.cyl.rotation.z = spin
    revolver.latch.position.z = 0.034 + r.latch * 0.0022
    revolver.hammer.rotation.x = r.hammer * 0.55
    revolver.trigger.rotation.x = r.trigger * 0.35
    // One ratchet click per chamber crossed while the cylinder spins
    if (tmp.prevSpin !== null && r.spinT > 0 && r.spinT < 0.995) {
      tmp.ratchet += Math.abs(spin - tmp.prevSpin)
      while (tmp.ratchet >= STEP) {
        tmp.ratchet -= STEP
        emit('sfx', 'ratchet', Math.abs(spin - tmp.prevSpin) / real)
      }
    }
    tmp.prevSpin = spin
    // Light sweep along the frame after the cylinder snaps shut
    w.sweep.position.z = 0.1 - (r.sweep + 1) * 0.1
    w.sweep.intensity = 0.8 * smoothstep(-1, -0.6, r.sweep) * (1 - smoothstep(1.5, 2, r.sweep))
    // The hand follows the gun's gestures
    if (w.hand) w.hand.update(r, dt)

    // Everything below reads world matrices of this frame
    camera.updateMatrixWorld(true)
    revolver.cyl.getWorldPosition(tmp.cylPos)
    camera.worldToLocal(tmp.cylPos)
    camera.getWorldQuaternion(tmp.qCam).invert()

    // The rounds: floating, flying along an arc to their chamber, pushed home
    let kick = null
    carts.forEach((c, k) => {
      const s = r.carts[k]
      const obj = c.group
      if (s.spawn <= 0.001) {
        obj.visible = false
        return
      }
      obj.visible = true
      const seated = s.flight >= 1 && s.seat >= 1
      if (seated) {
        if (obj.parent !== revolver.cyl) {
          revolver.cyl.add(obj)
          const phi = r.chamberOf[k] * STEP
          obj.position.set(Math.sin(phi) * PITCH_RADIUS, Math.cos(phi) * PITCH_RADIUS, CYL_REAR)
          obj.quaternion.identity()
          obj.scale.setScalar(1)
        }
      } else {
        if (obj.parent !== w.cartRoot) w.cartRoot.add(obj)
        spawnPoint(tmp.sp, k, carts.length, tmp.cylPos, portrait)
        tmp.sp.y += Math.sin(t * Math.PI * 2 * 0.6 + k * 1.3) * 0.006 * s.hover
        tmp.euler.set(0.45 + Math.sin(t * 0.7 + k) * 0.1, t * 0.8 + k * 1.1, 0.25)
        tmp.qHover.setFromEuler(tmp.euler)
        if (s.flight <= 0) {
          obj.position.copy(tmp.sp)
          obj.quaternion.copy(tmp.qHover)
        } else {
          const phi = r.chamberOf[k] * STEP
          tmp.chamber.set(Math.sin(phi) * PITCH_RADIUS, Math.cos(phi) * PITCH_RADIUS, CYL_REAR)
          revolver.cyl.localToWorld(tmp.chamber)
          camera.worldToLocal(tmp.chamber)
          revolver.cyl.getWorldQuaternion(tmp.qTarget)
          tmp.qTarget.premultiply(tmp.qCam)
          tmp.axis.set(0, 0, 1).applyQuaternion(tmp.qTarget)
          tmp.end.copy(tmp.chamber).addScaledVector(tmp.axis, 0.016)
          tmp.ctrl.lerpVectors(tmp.sp, tmp.end, 0.5)
          tmp.ctrl.y += 0.06
          tmp.ctrl.x += 0.02
          bezier(obj.position, tmp.sp, tmp.ctrl, tmp.end, s.flight)
          obj.quaternion.slerpQuaternions(tmp.qHover, tmp.qTarget, smoothstep(0, 0.9, s.flight))
          obj.position.addScaledVector(tmp.axis, -0.016 * Math.min(s.seat, 1) - 0.004 * Math.max(0, s.seat - 1))
          if (s.flight > 0 && s.flight < 1) kick = { pos: obj.position, color: c.look.accent }
        }
        obj.scale.setScalar(s.spawn)
      }
      cartFx[k].spawn.update(s)
    })
    camera.updateMatrixWorld(true)

    // A kicker light the colour of the round in the hand
    if (kicker.current) {
      const light = kicker.current
      if (kick) {
        light.intensity = 0.08
        light.color.set(kick.color)
        light.position.copy(kick.pos).add(tmp.v.set(-0.04, 0.05, 0.04))
        camera.localToWorld(light.position)
      } else light.intensity = Math.max(0, light.intensity - dt * 6)
    }

    // The bottle's lights
    bottle.spot.intensity = 4 * r.bottleLight
    bottle.flash.intensity = 40 * r.bottleFlash

    // Where things are on screen, for the HUD and the shockwave
    carts.forEach((c, k) => projectOnScreen(c.group, camera, tmp.v, r.screen.carts[k]))
    projectOnScreen(revolver.cyl, camera, tmp.v, r.screen.cyl)
    projectOnScreen(w.muzzle, camera, tmp.v, r.screen.muzzle)
    projectOnScreen(bottle.proxy, camera, tmp.v, r.screen.bottle)
    tmp.edge.position.copy(tmp.bottleWorld).add(tmp.v.set(0.07, 0.17, 0))
    tmp.edge.updateMatrixWorld()
    writeExtent(r.screen.bottle, projectOnScreen(tmp.edge, camera, tmp.v, tmp.corner))
    tmp.edge.position.set(r.shot.point.x, r.shot.point.y, r.shot.point.z)
    tmp.edge.updateMatrixWorld()
    projectOnScreen(tmp.edge, camera, tmp.v, r.screen.impact)

    // Motion effects and the shot
    w.flash.update(r)
    w.gap.update(r)
    w.smoke.update(dt, r)
    w.dust.update(dt)
    w.shatter.update(dt, r, camera)
    w.missFx.update(dt, r)
    // The cylinder leaves multiples when it spins or swings. A flat copy of
    // the whole gun read as a glitch rather than a motion, so the wrist flick
    // keeps only its smear of the cylinder.
    const craneRate = Math.abs(r.crane - tmp.prevCrane) / real
    tmp.prevCrane = r.crane
    w.cylGhosts.update(real, t, (r.spinT > 0 && r.spinT < 0.995) || craneRate > 2.5)
    w.gunGhosts.update(real, t, false)
    // Smears and streaks belong to the flight; once seated, a round only rides the cylinder
    cartFx.forEach((f, k) => {
      const flying = r.carts[k].flight > 0 && r.carts[k].seat < 1
      f.smear.update(real, flying)
      f.trails.update(real, t, camera, flying)
      f.ghosts.update(real, t)
    })
    if (r.chosen >= 0) w.flash.setAccent(carts[r.chosen].look.accent)
  })

  return (
    <>
      <primitive object={camera}>
        <primitive object={world.revolver.gun} />
        <primitive object={world.cartRoot} />
      </primitive>
      <spotLight
        color="#ffd9a6"
        intensity={lowPerf ? 2 : 2.2}
        position={[-0.6, 0.65, 0.3]}
        angle={0.75}
        penumbra={0.6}
        decay={2}
        distance={3}
        castShadow={!lowPerf}
        shadow-mapSize={[1024, 1024]}
        shadow-bias={-0.0003}
        shadow-normalBias={0.002}
        shadow-camera-near={0.05}
        shadow-camera-far={2}
        target={keyTarget}
      />
      <primitive object={keyTarget} position={[0, -0.1, -0.35]} />
      <directionalLight color="#9fc5ff" intensity={0.9} position={[0.7, 0.3, -0.5]} />
      <pointLight ref={kicker} intensity={0} distance={0.28} decay={2} />
      <primitive object={world.room} />
      <primitive object={world.bottle.group} />
      <primitive object={world.root} />
    </>
  )
}

const Scene = ({ rig, themes, lowPerf, portrait, coarse, pointer, emit }) => (
  <Canvas
    className="bar-canvas"
    aria-hidden="true"
    frameloop="always"
    dpr={lowPerf ? 1 : [1, 1.5]}
    shadows={lowPerf ? false : 'soft'}
    gl={{ antialias: false, powerPreference: 'high-performance', stencil: false }}
    camera={{ fov: FOV, near: 0.02, far: 14, position: [0, 0, 0] }}
  >
    <color attach="background" args={['#07090c']} />
    <fog attach="fog" args={['#07090c', 2.6, 7.5]} />
    <Environment />
    <World rig={rig} themes={themes} lowPerf={lowPerf} portrait={portrait} coarse={coarse} pointer={pointer} emit={emit} />
    <Post rig={rig} lowPerf={lowPerf} />
  </Canvas>
)

export default Scene
