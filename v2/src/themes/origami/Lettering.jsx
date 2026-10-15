import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import { useI18n } from '../../hooks/useI18n'
import { useHotspot } from './hotspot'
import { revealT } from './reveal'
import { MAP_TITLES, STATIONS, stationNumber } from './stations'
import { drawHero, drawStation, loadFonts, paint } from './textures'
import { LETTERS } from './track'

// The name of each stop, lettered on the map itself

const LIFT = 0.045
// Lettering still appears if a face fails to load
const FONT_TIMEOUT_MS = 2000

const noRaycast = () => null

/**
 * Ink on paper: a canvas drawing lying flat, fading in as the paper unrolls.
 * The name of a stop is also the way to it: it answers the pointer and
 * swells a little under it.
 */
const Decal = ({ store, x, s, width, height, draw, data, label, coarse, onHover, onClick }) => {
  const invalidate = useThree((state) => state.invalidate)
  const dataKey = JSON.stringify(data)
  const texture = useMemo(
    () => paint(width, height, (ctx) => draw(ctx, JSON.parse(dataKey)), { density: 150 }),
    [width, height, draw, dataKey],
  )
  const material = useRef()
  const group = useRef()
  const fresh = useRef(true)
  const { stateRef, handlers } = useHotspot({ store, label, coarse, onHover, onClick })

  useEffect(() => {
    fresh.current = true
    invalidate()
    return () => texture.dispose()
  }, [texture, invalidate])

  useFrame(() => {
    const hot = stateRef.current
    if (!store.moving && !hot.active && !fresh.current) return
    fresh.current = false
    const t = revealT(store.u, s - height / 2, 0, 2.5)
    material.current.opacity = t
    group.current.scale.setScalar(1 + hot.hover * 0.04)
    group.current.visible = t > 0
  })

  return (
    <group ref={group} position={[x, LIFT, -s]} {...handlers}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} renderOrder={2} raycast={noRaycast}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial ref={material} map={texture} transparent opacity={0} depthWrite={false} polygonOffset polygonOffsetFactor={-2} />
      </mesh>
      {/* Never drawn, only hit: a little larger than the ink */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <planeGeometry args={[width + 0.3, height + 0.3]} />
      </mesh>
    </group>
  )
}

const Lettering = ({ store, palette, coarse, onAction, onHover }) => {
  const { t } = useI18n()
  const [fontsReady, setFontsReady] = useState(false)
  const get = useThree((state) => state.get)

  useEffect(() => {
    // The headless checks compare where each name lands on screen with the notes and the rail
    if (!import.meta.env.DEV) return undefined
    window.__oriLetters = () => {
      const { camera, size } = get()
      const p = new THREE.Vector3()
      return LETTERS.map((l) => {
        const xs = []
        const ys = []
        for (const [dx, ds] of [[-1, -1], [1, -1], [1, 1], [-1, 1]]) {
          p.set(l.x + (dx * l.width) / 2, 0.05, -(l.s + (ds * l.height) / 2)).project(camera)
          xs.push(((p.x + 1) / 2) * size.width)
          ys.push(((1 - p.y) / 2) * size.height)
        }
        return { index: l.index, left: Math.min(...xs), right: Math.max(...xs), top: Math.min(...ys), bottom: Math.max(...ys) }
      })
    }
    return () => { delete window.__oriLetters }
  }, [get])
  // One stable click per stop
  const clicks = useMemo(() => STATIONS.map((station) => () => onAction('station', station.index)), [onAction])

  useEffect(() => {
    let alive = true
    Promise.race([loadFonts(), new Promise((resolve) => setTimeout(resolve, FONT_TIMEOUT_MS))])
      .catch(() => {})
      .then(() => { if (alive) setFontsReady(true) })
    return () => { alive = false }
  }, [])

  if (!fontsReady) return null

  return STATIONS.map((station, i) => (i === 0 ? (
    <Decal
      key={station.id}
      store={store}
      x={LETTERS[0].x}
      s={LETTERS[0].s}
      width={LETTERS[0].width}
      height={LETTERS[0].height}
      draw={drawHero}
      data={{ title: t('hero.title'), subtitle: t('hero.subtitle'), tagline: t('origami.taglines.hero'), ink: palette.ink, accent: palette.accent }}
      label={t('origami.landmarks.start')}
      coarse={coarse}
      onHover={onHover}
      onClick={clicks[1]}
    />
  ) : (
    <Decal
      key={station.id}
      store={store}
      x={LETTERS[i].x}
      s={LETTERS[i].s}
      width={LETTERS[i].width}
      height={LETTERS[i].height}
      draw={drawStation}
      data={{
        number: `${t('origami.station')} ${stationNumber(i)}`,
        title: t(MAP_TITLES[station.id]),
        tagline: t(`origami.taglines.${station.id}`),
        ink: palette.ink,
        accent: palette.accent,
      }}
      label={`${t('origami.station')} ${stationNumber(i)} : ${t(MAP_TITLES[station.id])}`}
      coarse={coarse}
      onHover={onHover}
      onClick={clicks[i]}
    />
  )))
}

export default Lettering
