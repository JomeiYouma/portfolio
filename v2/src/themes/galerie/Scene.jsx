import { useEffect, useMemo, useRef, useState } from 'react'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import projects from '../../data/projects.json'
import games from '../../data/games.json'
import { useI18n } from '../../hooks/useI18n'
import { asset } from '../../utils/asset'
import { APOTHEM, BAYS, BLUE, EYE, FOV, INK, PALETTE, PAPER, PINK, RED, SIDE, STEP, WALL_H, YELLOW } from './room'
import { coverTexture, drawGiant, drawLines, loadFonts, paint, softShadowTexture, stripeTexture } from './textures'

const EMAIL = 'raphael.madore.pro@mailo.com'
// How far the pointer can turn the head, in radians
const LOOK_YAW = 0.045
const LOOK_PITCH = 0.025

// Hand cursor over what can be clicked in the scene (styled in galerie.css)
const setPointing = (pointing) => document.documentElement.classList.toggle('ga-pointing', pointing)

// ─── Camera ──────────────────────────────────────────────────────────────────
const HALF_FOV_TAN = Math.tan((FOV / 2) * (Math.PI / 180))

// Once a room is entered its sheet covers part of the screen. How far the
// visitor stands from the wall (positive: toward it, negative: stepping back)
// so that the whole wall fits in what is left. `shift` is half the share of the
// screen the sheet covers.
const roomDolly = ({ width, height }, shift) => {
  const freeWidth = width * (1 - 2 * shift)
  const distance = (height * SIDE * 1.05) / (2 * HALF_FOV_TAN * freeWidth)
  return Math.min(0.8, Math.max(-6.5, APOTHEM - distance))
}

/**
 * The visitor stands in the middle of the rotunda and turns to face a bay;
 * entering a room slides the picture aside to leave room for the content
 * sheet and reframes the wall beside it. Renders on demand: a frame is only
 * requested while something is still moving.
 */
const Rig = ({ room, entered, shift, instant }) => {
  const invalidate = useThree((state) => state.invalidate)
  // `turns` counts bays without wrapping, so the camera always takes the short way round
  const heading = useRef({ turns: room, room })
  const pose = useRef({ yaw: -room * STEP, dolly: 0, shift: 0, lookX: 0, lookY: 0 })
  const pointer = useRef({ x: 0, y: 0 })

  useEffect(() => {
    const h = heading.current
    let delta = (room - h.room) % BAYS
    if (delta > BAYS / 2) delta -= BAYS
    if (delta < -BAYS / 2) delta += BAYS
    h.turns += delta
    h.room = room
    invalidate()
  }, [room, invalidate])

  useEffect(() => { invalidate() }, [entered, shift, instant, invalidate])

  useEffect(() => {
    const onMove = (e) => {
      pointer.current.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.current.y = (e.clientY / window.innerHeight) * 2 - 1
      invalidate()
    }
    window.addEventListener('pointermove', onMove)
    return () => window.removeEventListener('pointermove', onMove)
  }, [invalidate])

  useFrame((state, delta) => {
    const p = pose.current
    const free = !entered && !instant
    const goal = {
      yaw: -heading.current.turns * STEP,
      dolly: entered ? roomDolly(state.size, shift) : 0,
      shift: entered ? shift : 0,
      lookX: free ? pointer.current.x * LOOK_YAW : 0,
      lookY: free ? pointer.current.y * LOOK_PITCH : 0,
    }
    // After an idle spell the first delta is the whole pause: cap it, or the move would snap
    const ease = instant ? 1 : 1 - Math.exp(-Math.min(delta, 1 / 30) * 4.2)
    let moving = false
    Object.keys(goal).forEach((key) => {
      const gap = goal[key] - p[key]
      if (Math.abs(gap) > 1e-4) {
        p[key] += gap * ease
        moving = true
      } else {
        p[key] = goal[key]
      }
    })

    const camera = state.camera
    camera.position.set(-Math.sin(p.yaw) * p.dolly, EYE, -Math.cos(p.yaw) * p.dolly)
    camera.rotation.set(-p.lookY, p.yaw - p.lookX, 0, 'YXZ')
    const { width, height } = state.size
    if (p.shift > 1e-4) camera.setViewOffset(width, height, p.shift * width, 0, width, height)
    else if (camera.view) camera.clearViewOffset()

    if (moving) state.invalidate()
  })

  return null
}

// ─── Building blocks ─────────────────────────────────────────────────────────
// Floor (or ceiling) of one bay: the triangle between its wall and the middle
// of the room. A hair wider than the wall so neighbouring bays leave no crack.
const WEDGE = new THREE.BufferGeometry()
WEDGE.setAttribute(
  'position',
  new THREE.Float32BufferAttribute([-SIDE / 2 - 0.01, 0, 0, SIDE / 2 + 0.01, 0, 0, 0, 0, APOTHEM + 0.01], 3),
)

/**
 * One bay, painted a single colour from floor to ceiling. Flat, unlit paint:
 * the floor and ceiling are only a shade deeper than the wall.
 * Local frame: x runs along the wall, y is up, +z points into the room.
 */
const Bay = ({ index, onClick, children }) => {
  const colors = PALETTE[index]
  return (
    <group rotation={[0, -index * STEP, 0]}>
      <group position={[0, 0, -APOTHEM]}>
        <mesh geometry={WEDGE}>
          <meshBasicMaterial color={colors.floor} side={THREE.DoubleSide} />
        </mesh>
        <mesh geometry={WEDGE} position={[0, WALL_H, 0]}>
          <meshBasicMaterial color={colors.ceiling} side={THREE.DoubleSide} />
        </mesh>
        <mesh
          position={[0, WALL_H / 2, 0]}
          onClick={onClick}
          onPointerOver={onClick ? () => setPointing(true) : undefined}
          onPointerOut={onClick ? () => setPointing(false) : undefined}
        >
          <planeGeometry args={[SIDE + 0.02, WALL_H]} />
          <meshBasicMaterial color={colors.wall} />
        </mesh>
        {children}
      </group>
    </group>
  )
}

/**
 * Text or artwork drawn on a canvas (see textures.js). Hung flat on the wall by
 * default (`x` centre, `top` edge); with `floor`, painted on the ground from
 * the foot of the wall toward the room. `draw` must be a stable function.
 */
const Print = ({ x = 0, top = 0, z = 0.012, floor = false, width, height, draw, data, density, background }) => {
  const dataKey = JSON.stringify(data)
  const texture = useMemo(
    () => paint(width, height, (ctx) => draw(ctx, JSON.parse(dataKey)), { density, background }),
    [width, height, draw, dataKey, density, background],
  )
  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh
      position={floor ? [x, 0.004, height / 2] : [x, top - height / 2, z]}
      rotation={floor ? [-Math.PI / 2, 0, 0] : undefined}
    >
      <planeGeometry args={[width, height]} />
      <meshBasicMaterial map={texture} transparent={!background} depthWrite={Boolean(background)} />
    </mesh>
  )
}

const useImageTexture = (src, aspect) => {
  const invalidate = useThree((state) => state.invalidate)
  const [texture, setTexture] = useState(null)

  useEffect(() => {
    let alive = true
    const loaded = new THREE.TextureLoader().load(src, (tex) => {
      tex.colorSpace = THREE.SRGBColorSpace
      tex.anisotropy = 8
      coverTexture(tex, aspect)
      if (!alive) return
      setTexture(tex)
      invalidate()
    })
    return () => {
      alive = false
      loaded.dispose()
    }
  }, [src, aspect, invalidate])

  return texture
}

// One texture for every fake shadow in the room
let sharedShadow = null
const shadowTexture = () => {
  if (!sharedShadow) sharedShadow = softShadowTexture()
  return sharedShadow
}

/** Soft dark patch lying on a surface: behind a frame, under a sculpture. */
const Shadow = ({ width, height, opacity = 0.3, ...props }) => (
  <mesh {...props}>
    <planeGeometry args={[width, height]} />
    <meshBasicMaterial map={shadowTexture()} color="#000000" transparent opacity={opacity} depthWrite={false} />
  </mesh>
)

const FloorShadow = ({ x, z, size, opacity = 0.3 }) => (
  <Shadow width={size} height={size} opacity={opacity} position={[x, 0.008, z]} rotation={[-Math.PI / 2, 0, 0]} />
)

// A wide white mount: on a saturated wall the picture needs air around it
const FRAME_BORDER = 0.1
const FRAME_DEPTH = 0.06

/** A mounted picture. Children are hung inside the mount instead of an image when `src` is absent. */
const Frame = ({ x, y, width, height, src, onClick, children }) => {
  const invalidate = useThree((state) => state.invalidate)
  const [hovered, setHovered] = useState(false)
  const scale = hovered && onClick ? 1.03 : 1

  const hover = (value) => (e) => {
    if (!onClick) return
    e.stopPropagation()
    setHovered(value)
    setPointing(value)
    invalidate()
  }

  return (
    <group
      position={[x, y, 0]}
      scale={[scale, scale, 1]}
      onClick={onClick ? (e) => { e.stopPropagation(); onClick() } : undefined}
      onPointerOver={hover(true)}
      onPointerOut={hover(false)}
    >
      <Shadow width={width + 0.75} height={height + 0.75} opacity={0.34} position={[0, -0.08, 0.004]} />
      <mesh position={[0, 0, FRAME_DEPTH / 2]}>
        <boxGeometry args={[width + 2 * FRAME_BORDER, height + 2 * FRAME_BORDER, FRAME_DEPTH]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {src ? <Picture src={src} width={width} height={height} /> : null}
      <group position={[0, height / 2, FRAME_DEPTH]}>{children}</group>
    </group>
  )
}

const Picture = ({ src, width, height }) => {
  const texture = useImageTexture(src, width / height)
  return (
    <mesh position={[0, 0, FRAME_DEPTH + 0.002]}>
      <planeGeometry args={[width, height]} />
      {/* Unlit: the capture keeps its true colours */}
      <meshBasicMaterial map={texture} color={texture ? '#ffffff' : '#e6e2d9'} />
    </mesh>
  )
}

/** Monumental solid standing in the room. Lit, unlike the flat walls: the only volumes in a painted space. */
const Solid = ({ color, position, rotation, children }) => (
  <mesh position={position} rotation={rotation}>
    {children}
    <meshStandardMaterial color={color} roughness={0.55} />
  </mesh>
)

// ─── What is painted on the walls (stable draw functions for <Print>) ────────
const drawHeader = (ctx, { label, title, ink }) =>
  drawLines(ctx, {
    w: 560,
    ink,
    lines: [
      { text: label, sans: true, upper: true, weight: 600, size: 11, tracking: 0.2, gap: 8 },
      { text: title, weight: 700, size: 66 },
    ],
  })

const drawHero = (ctx, { label, title, subtitle, name, ink }) =>
  drawLines(ctx, {
    w: 800,
    ink,
    lines: [
      { text: label, sans: true, upper: true, weight: 600, size: 12, tracking: 0.22, gap: 2 },
      { text: title, weight: 700, size: 262, leading: 0.92, tracking: -0.01 },
      { text: subtitle, italic: true, weight: 600, size: 52, gap: 16 },
      { text: name, sans: true, upper: true, weight: 600, size: 12, tracking: 0.22 },
    ],
  })

const drawPoster = (ctx, { name, title, caption }) =>
  drawLines(ctx, {
    w: 190,
    pad: 16,
    lines: [
      { text: caption, sans: true, upper: true, weight: 600, size: 5, tracking: 0.2, gap: 92 },
      { text: name, italic: true, weight: 600, size: 62, color: RED, leading: 1.2 },
      { text: title, weight: 500, size: 14, gap: 0 },
    ],
  })

const drawCertificate = (ctx, { title, body }) =>
  drawLines(ctx, {
    w: 150,
    pad: 12,
    lines: [
      { text: 'Opquast', weight: 700, size: 30, gap: 2 },
      { text: title, sans: true, upper: true, weight: 600, size: 5.2, tracking: 0.16, color: BLUE, gap: 8 },
      { text: body, sans: true, size: 5.4, leading: 1.4, wrap: true },
    ],
  })

const drawQuote = (ctx, { quote, name, role, ink }) =>
  drawLines(ctx, {
    w: 660,
    ink,
    lines: [
      { text: quote, italic: true, weight: 600, size: 34, leading: 1.24, wrap: true, gap: 18 },
      { text: `${name} — ${role}`, sans: true, upper: true, weight: 600, size: 10, tracking: 0.2 },
    ],
  })

const drawPrice = (ctx, { title, label, price, ink }) =>
  drawLines(ctx, {
    w: 250,
    align: 'center',
    ink,
    lines: [
      { text: title, sans: true, upper: true, weight: 700, size: 10, tracking: 0.18, gap: 10 },
      { text: price, weight: 700, size: 84, leading: 0.95 },
      { text: label, sans: true, upper: true, weight: 600, size: 8, tracking: 0.2 },
    ],
  })

const drawContact = (ctx, { email, note, ink }) =>
  drawLines(ctx, {
    w: 470,
    ink,
    lines: [
      { text: email, italic: true, weight: 600, size: 38, color: BLUE, gap: 12 },
      { text: note, sans: true, upper: true, weight: 600, size: 9, tracking: 0.2 },
    ],
  })

// Arrow painted on the floor, pointing at the wall (the top of the canvas)
const drawArrow = (ctx, { color }) => {
  ctx.fillStyle = color
  ctx.beginPath()
  ctx.moveTo(45, 30)
  ctx.lineTo(90, 95)
  ctx.lineTo(61, 95)
  ctx.lineTo(61, 210)
  ctx.lineTo(29, 210)
  ctx.lineTo(29, 95)
  ctx.lineTo(0, 95)
  ctx.closePath()
  ctx.fill()
}

// ─── Supergraphics ───────────────────────────────────────────────────────────
// The giant figure of a room: 3.4 m tall, its top on the wall and the rest
// folded onto the floor, tone on tone. Centred, and short enough on the floor
// to stay inside the bay's wedge, which narrows toward the middle of the room.
const GIANT = { width: 5.4, glyph: 340, wall: 1.9, floor: 3.2 }

const Giant = ({ text, color }) => {
  const common = { text, color, w: GIANT.width * 100, glyph: GIANT.glyph }
  const x = 0
  return (
    <>
      <Print x={x} top={GIANT.wall} z={0.006} width={GIANT.width} height={GIANT.wall} density={128} draw={drawGiant} data={common} />
      <Print
        floor
        x={x}
        width={GIANT.width}
        height={GIANT.floor}
        density={128}
        draw={drawGiant}
        data={{ ...common, offset: GIANT.wall * 100, fill: GIANT.floor * 100 }}
      />
    </>
  )
}

const ARCH = (() => {
  const shape = new THREE.Shape()
  shape.moveTo(-1, 0)
  shape.lineTo(-1, 2.5)
  shape.absarc(0, 2.5, 1, Math.PI, 0, true)
  shape.lineTo(1, 0)
  shape.closePath()
  return new THREE.ShapeGeometry(shape, 48)
})()

const HEADER = { x: -SIDE / 2 + 0.5 + 2.8, top: 4.72, width: 5.6, height: 1 }

const Rotunda = ({ room, entered, lang, onEnterRoom, onPickProject }) => {
  const { t } = useI18n()
  const [fontsReady, setFontsReady] = useState(false)
  const invalidate = useThree((state) => state.invalidate)
  const stripes = useMemo(() => stripeTexture('#ffffff', INK, 9), [])

  useEffect(() => {
    let alive = true
    loadFonts().then(() => {
      if (!alive) return
      setFontsReady(true)
      invalidate()
    })
    return () => { alive = false }
  }, [invalidate])

  // Re-render when anything painted or hung changes
  useEffect(() => { invalidate() }, [lang, room, entered, invalidate])

  const ink = (index) => PALETTE[index].ink
  // Everything lettered waits for the fonts: title, and the room's giant figure
  const lettering = (index, title) => fontsReady && (
    <>
      <Giant text={String(index).padStart(2, '0')} color={PALETTE[index].tone} />
      <Print
        {...HEADER}
        draw={drawHeader}
        data={{ label: `${t('galerie.room')} ${String(index).padStart(2, '0')}`, title, ink: ink(index) }}
      />
    </>
  )
  // A wall is a door into its room until that room is entered
  const door = (index) => (entered && room === index ? undefined : () => onEnterRoom(index))
  const openProject = (index) => () => (entered && room === 2 ? onPickProject(index) : onEnterRoom(2))
  const projectImage = (index) => asset(`assets/images/${projects[index].image}`)
  const services = ['create', 'update', 'gamify']

  return (
    <>
      {/* 0 — Title wall, yellow: the name as large as the wall, a red sphere */}
      <Bay index={0}>
        {fontsReady && (
          <Print
            x={-0.2}
            top={4.75}
            width={8}
            height={4.2}
            draw={drawHero}
            data={{
              label: t('galerie.permanent'),
              title: t('hero.title'),
              subtitle: t('hero.subtitle'),
              name: 'Raphaël Madoré — 2026',
              ink: ink(0),
            }}
          />
        )}
        <FloorShadow x={3} z={1.4} size={3.3} />
        <Solid color={RED} position={[3, 1, 1.4]}>
          <sphereGeometry args={[1, 64, 48]} />
        </Solid>
      </Bay>

      {/* 1 — About, blue: two prints and a striped column */}
      <Bay index={1} onClick={door(1)}>
        {lettering(1, t('about.title'))}
        <Frame x={-2.3} y={2.05} width={1.9} height={2.5}>
          {fontsReady && (
            <Print
              z={0.003}
              width={1.9}
              height={2.5}
              background={PAPER}
              draw={drawPoster}
              data={{ name: t('about.subtitle'), title: t('about.title'), caption: t('about.eyebrow') }}
            />
          )}
        </Frame>
        <Frame x={0.6} y={2.5} width={1.5} height={1.05}>
          {fontsReady && (
            <Print
              z={0.003}
              width={1.5}
              height={1.05}
              density={512}
              background="#ffffff"
              draw={drawCertificate}
              data={{ title: t('about.certifications.title'), body: t('about.certifications.description') }}
            />
          )}
        </Frame>
        <FloorShadow x={3.45} z={0.9} size={1.9} />
        <mesh position={[3.45, 2.1, 0.9]}>
          <cylinderGeometry args={[0.42, 0.42, 4.2, 48]} />
          <meshStandardMaterial map={stripes} roughness={0.6} />
        </mesh>
      </Bay>

      {/* 2 — Projects, red: a salon hang of the first five, and a bench to sit in front of them */}
      <Bay index={2} onClick={door(2)}>
        {lettering(2, t('projects.title'))}
        <Frame x={0} y={2.15} width={2.9} height={1.8} src={projectImage(0)} onClick={openProject(0)} />
        <Frame x={-2.95} y={2.75} width={1.6} height={1} src={projectImage(1)} onClick={openProject(1)} />
        <Frame x={-2.95} y={1.45} width={1.6} height={1} src={projectImage(2)} onClick={openProject(2)} />
        <Frame x={2.95} y={2.75} width={1.6} height={1} src={projectImage(3)} onClick={openProject(3)} />
        <Frame x={2.95} y={1.45} width={1.6} height={1} src={projectImage(4)} onClick={openProject(4)} />
        <FloorShadow x={0} z={2.6} size={3.4} opacity={0.26} />
        <Solid color={INK} position={[0, 0.22, 2.6]}>
          <boxGeometry args={[2.6, 0.44, 0.55]} />
        </Solid>
      </Bay>

      {/* 3 — Games, black: three screens and a yellow cube balanced on a corner */}
      <Bay index={3} onClick={door(3)}>
        {lettering(3, t('games.title'))}
        {games.map((game, i) => (
          <Frame
            key={game.id}
            x={(i - 1) * 2.75}
            y={2.2}
            width={2.25}
            height={1.4}
            src={asset(`assets/images/${game.image}`)}
            onClick={() => onEnterRoom(3)}
          />
        ))}
        <FloorShadow x={-3.05} z={1.3} size={2.2} opacity={0.5} />
        <Solid color={YELLOW} position={[-3.05, 0.78, 1.3]} rotation={[Math.atan(Math.SQRT2), 0, Math.PI / 4]}>
          <boxGeometry args={[0.9, 0.9, 0.9]} />
        </Solid>
      </Bay>

      {/* 4 — Testimonials, pink: the quotation painted on the wall, a green cone */}
      <Bay index={4} onClick={door(4)}>
        {lettering(4, t('testimonials.eyebrow'))}
        {fontsReady && (
          <Print
            x={0.75}
            top={3.45}
            width={6.6}
            height={2.9}
            draw={drawQuote}
            data={{
              quote: `« ${t('testimonials.items.navy.quote')} »`,
              name: t('testimonials.items.navy.name'),
              role: t('testimonials.items.navy.role'),
              ink: ink(4),
            }}
          />
        )}
        <FloorShadow x={-3.4} z={1.2} size={2.4} />
        <Solid color={PALETTE[5].wall} position={[-3.4, 1.1, 1.2]}>
          <coneGeometry args={[0.75, 2.2, 64]} />
        </Solid>
      </Bay>

      {/* 5 — Services, green: three prices, three solids standing under them */}
      <Bay index={5} onClick={door(5)}>
        {lettering(5, t('services.eyebrow'))}
        {services.map((key, i) => (
          fontsReady && (
            <Print
              key={key}
              x={(i - 1) * 2.8}
              top={3.5}
              width={2.5}
              height={1.6}
              draw={drawPrice}
              data={{
                title: t(`services.items.${key}.title`),
                label: t(`services.items.${key}.priceLabel`),
                price: t(`services.items.${key}.price`).replace('€', ' €'),
                ink: ink(5),
              }}
            />
          )
        ))}
        <FloorShadow x={-2.8} z={1.5} size={2.2} />
        <Solid color="#ffffff" position={[-2.8, 0.5, 1.5]} rotation={[0, 0.5, 0]}>
          <boxGeometry args={[1, 1, 1]} />
        </Solid>
        <FloorShadow x={0} z={1.5} size={2.2} />
        <Solid color={YELLOW} position={[0, 0.6, 1.5]}>
          <sphereGeometry args={[0.6, 48, 32]} />
        </Solid>
        <FloorShadow x={2.8} z={1.5} size={2.2} />
        <Solid color={PINK} position={[2.8, 0.7, 1.5]}>
          <coneGeometry args={[0.6, 1.4, 48]} />
        </Solid>
      </Bay>

      {/* 6 — Contact, white: the way out is an arch in the yellow of the first wall */}
      <Bay index={6} onClick={door(6)}>
        {lettering(6, t('contact.title'))}
        {fontsReady && (
          <>
            <Print
              x={-1.45}
              top={2.9}
              width={4.7}
              height={1}
              draw={drawContact}
              data={{ email: EMAIL, note: t('galerie.exit'), ink: ink(6) }}
            />
            <Print floor x={2.75} width={0.9} height={2.1} density={128} draw={drawArrow} data={{ color: INK }} />
          </>
        )}
        <mesh geometry={ARCH} position={[2.75, 0, 0.012]} scale={[1.07, 1.045, 1]}>
          <meshBasicMaterial color={INK} />
        </mesh>
        <mesh geometry={ARCH} position={[2.75, 0, 0.02]}>
          <meshBasicMaterial color={YELLOW} />
        </mesh>
      </Bay>
    </>
  )
}

/**
 * The 3D rotunda. Purely visual: every piece of content also exists as HTML
 * in the theme's sheets, and the canvas is hidden from assistive technology.
 */
const Scene = ({ room, entered, shift, instant, lang, lowPerf, onEnterRoom, onPickProject }) => (
  <Canvas
    className="ga-canvas"
    aria-hidden="true"
    frameloop="demand"
    flat
    dpr={lowPerf ? 1 : [1, 2]}
    camera={{ fov: FOV, near: 0.1, far: 60, position: [0, EYE, 0] }}
  >
    <color attach="background" args={[INK]} />
    {/* Walls, floors and ceilings are unlit paint. These lights only model the
        solids standing in the room; no tone mapping (flat), so colours stay true. */}
    <hemisphereLight args={['#ffffff', '#e8e2d6', 2.9]} />
    <directionalLight position={[4, 9, 6]} intensity={1.2} />
    <Rig room={room} entered={entered} shift={shift} instant={instant} />
    <Rotunda room={room} entered={entered} lang={lang} onEnterRoom={onEnterRoom} onPickProject={onPickProject} />
  </Canvas>
)

export default Scene
