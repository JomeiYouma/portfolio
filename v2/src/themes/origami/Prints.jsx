import { useCallback, useEffect, useRef, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import * as THREE from 'three'
import projects from '../../data/projects.json'
import { useI18n } from '../../hooks/useI18n'
import { asset } from '../../utils/asset'
import { ALBUM, PRINT } from './album'
import { CARD, geometryOf } from './builders'
import { useHotspot } from './hotspot'
import { revealT, rise } from './reveal'

// Every project's capture, printed on card and pinned to the map around the
// Works stop. The photos load once the visitor has left the first stop, a
// few at a time, downscaled to cap GPU memory; a print shows blank card
// until its photo lands, then fades it in.

const LIFT = 0.05
const LOAD_FROM_S = 16
const CONCURRENCY = 4
const FADE_S = 0.3
const BLANK = '#e9e2d4'
const noRaycast = () => null
const PHOTO = new THREE.PlaneGeometry(PRINT.width, PRINT.height)
PHOTO.rotateX(-Math.PI / 2)
const HIT = new THREE.BoxGeometry(1, 1, 1)

// Textures live for the session: the renderer uploads them again after a view toggle
const cache = new Map()
const queue = []
let running = 0
const pump = () => {
  while (running < CONCURRENCY && queue.length) {
    const job = queue.shift()
    running++
    job().finally(() => {
      running--
      pump()
    })
  }
}

/** The capture, covered onto a `width` × `height` canvas, as a texture. */
const loadPrint = (src, width, height) => {
  const key = `${src}@${width}`
  if (!cache.has(key)) {
    cache.set(key, new Promise((resolve, reject) => {
      queue.push(() => new Promise((done) => {
        const img = new Image()
        img.onload = () => {
          const canvas = document.createElement('canvas')
          canvas.width = width
          canvas.height = height
          const ctx = canvas.getContext('2d')
          const scale = Math.max(width / img.width, height / img.height)
          const w = img.width * scale
          const h = img.height * scale
          ctx.drawImage(img, (width - w) / 2, (height - h) / 2, w, h)
          const texture = new THREE.CanvasTexture(canvas)
          texture.colorSpace = THREE.SRGBColorSpace
          texture.anisotropy = 4
          resolve(texture)
          done()
        }
        img.onerror = () => {
          reject(new Error(src))
          done()
        }
        img.src = src
      }))
      pump()
    }))
  }
  return cache.get(key)
}

const Print = ({ entry, label, store, coarse, reduceMotion, lowPerf, wanted, onAction, onHover }) => {
  const invalidate = useThree((state) => state.invalidate)
  const outer = useRef()
  const photo = useRef()
  const fresh = useRef(true)
  // When the photo arrived, for the fade
  const since = useRef(null)
  const [texture, setTexture] = useState(null)

  const click = useCallback(() => onAction('project', entry.index), [onAction, entry.index])
  const { stateRef: hot, handlers } = useHotspot({ store, label, coarse, onHover, onClick: click })

  useEffect(() => {
    if (!wanted) return undefined
    let alive = true
    loadPrint(asset(`assets/images/${entry.image}`), lowPerf ? 256 : 512, lowPerf ? 160 : 320)
      .then((tex) => {
        if (!alive) return
        since.current = null
        setTexture(tex)
        invalidate()
      })
      .catch(() => {})
    return () => { alive = false }
  }, [wanted, entry.image, lowPerf, invalidate])

  useFrame(() => {
    const fading = texture && photo.current && photo.current.opacity < 1
    if (!store.moving && !hot.current.active && !fresh.current && !fading) return
    fresh.current = false
    const t = revealT(store.u, entry.s, 0, reduceMotion ? 1 : 2.5)
    const k = reduceMotion ? t : rise(t)
    const o = outer.current
    o.visible = t > 0
    o.scale.setScalar(Math.max(1e-4, k * (1 + hot.current.hover * 0.05)))
    o.position.y = LIFT + hot.current.hover * 0.1
    if (fading) {
      if (since.current === null) since.current = store.time
      photo.current.opacity = reduceMotion ? 1 : Math.min(1, (store.time - since.current) / FADE_S)
      invalidate()
    }
  })

  return (
    <group ref={outer} position={[entry.x, LIFT, -entry.s]} rotation={[0, entry.yaw, 0]} {...handlers}>
      <mesh geometry={geometryOf('mount')} material={CARD} castShadow receiveShadow raycast={noRaycast} />
      <mesh geometry={PHOTO} position={[0, 0.022, 0]} raycast={noRaycast}>
        {/* A new material once the photo is there: a map added later needs a recompile */}
        <meshStandardMaterial
          key={texture ? 'photo' : 'blank'}
          ref={photo}
          map={texture}
          color={texture ? '#ffffff' : BLANK}
          transparent={Boolean(texture)}
          opacity={texture ? 0 : 1}
          roughness={0.7}
        />
      </mesh>
      <mesh
        geometry={geometryOf('pin')}
        material={CARD}
        position={[entry.pin * (PRINT.width / 2 - 0.02), 0.02, -(PRINT.height / 2 - 0.02)]}
        castShadow
        raycast={noRaycast}
      />
      {/* Never drawn, only hit */}
      <mesh geometry={HIT} visible={false} scale={[PRINT.width + 0.2, 0.3, PRINT.height + 0.2]} position={[0, 0.15, 0]} />
    </group>
  )
}

const Prints = ({ store, lang, coarse, reduceMotion, lowPerf, onAction, onHover }) => {
  const { t } = useI18n()
  const [wanted, setWanted] = useState(false)

  // The photos are asked for once the visitor leaves the first stop
  useFrame(() => {
    if (!wanted && store.s > LOAD_FROM_S) setWanted(true)
  })

  return ALBUM.map((entry) => {
    const project = projects[entry.index]
    return (
      <Print
        key={entry.id}
        entry={entry}
        label={`${t('origami.landmarks.project')} : ${project.title[lang] || project.title.en}`}
        store={store}
        coarse={coarse}
        reduceMotion={reduceMotion}
        lowPerf={lowPerf}
        wanted={wanted}
        onAction={onAction}
        onHover={onHover}
      />
    )
  })
}

export default Prints
