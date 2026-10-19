import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useReducedMotion } from 'motion/react'
import '@fontsource-variable/schibsted-grotesk/wght.css'
import '@fontsource-variable/anybody/wdth-italic.css'
import './barillet.css'
import { useI18n } from '../../hooks/useI18n'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { IS_LOW_PERF } from '../../utils/perf'
import { createAudio } from './audio'
import { lookOf } from './cartridges'
import Hud from './Hud'
import Picker from './Picker'
import { createRig } from './rig'
import { buildTimeline } from './timeline'

// three.js only loads with the scene
const Scene = lazy(() => import('./Scene'))

const HAS_WEBGL = (() => {
  try {
    return Boolean(document.createElement('canvas').getContext('webgl2'))
  } catch {
    return false
  }
})()

const ONOMA_SIZE = { open: 's', load: 's', close: 'm', spin: 'm', cock: 's', shot: 'l' }
let onomaId = 0

/** Jagged lines radiating from a point, in viewBox units (0..100) */
const makeCracks = (cx, cy) => {
  const paths = []
  const n = 9 + Math.floor(Math.random() * 4)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4
    const len = 8 + Math.random() * 26
    let d = `M${cx} ${cy}`
    let x = cx
    let y = cy
    const steps = 3 + Math.floor(Math.random() * 3)
    for (let s = 1; s <= steps; s++) {
      const r = (len * s) / steps
      const wobble = (Math.random() - 0.5) * 0.5
      x = cx + Math.cos(a + wobble) * r
      y = cy + Math.sin(a + wobble) * r * 1.6
      d += ` L${x.toFixed(1)} ${y.toFixed(1)}`
    }
    paths.push(d)
  }
  return paths
}

/**
 * The opening sequence: a revolver in the visitor's hand, one round per
 * theme, a spin, a shot that opens the chosen theme. Without WebGL or with
 * reduced motion, the same choice as a row of rounds to pick from.
 */
const BarilletIntro = ({ themes, onArm, onFire, onDone, onSkip }) => {
  const { t } = useI18n()
  const reduceMotion = useReducedMotion()
  const portrait = useMediaQuery('(orientation: portrait)')
  const coarse = useMediaQuery('(pointer: coarse)')
  const immersive = HAS_WEBGL && !reduceMotion && !IS_LOW_PERF
  const lowPerf = IS_LOW_PERF || portrait

  const rootRef = useRef(null)
  const [rig] = useState(() => createRig(themes.length))
  const audio = useMemo(() => createAudio(), [])
  const pointer = useMemo(() => ({ x: 0, y: 0 }), [])
  const seqRef = useRef(null)
  const firedRef = useRef(false)

  const [phase, setPhase] = useState('ready')
  const [cards, setCards] = useState(() => themes.map(() => null))
  const [loaded, setLoaded] = useState(0)
  const [chosen, setChosen] = useState(-1)
  const [marked, setMarked] = useState(-1)
  const [onoma, setOnoma] = useState([])
  const [cracks, setCracks] = useState(null)
  const [muted, setMuted] = useState(() => audio.isMuted())
  const [flash, setFlash] = useState(false)

  // The timeline is built once; what it calls back into may change with
  // every render (the translator, the parent's handlers), so it goes through refs
  const callbacks = useRef({ onArm, onFire, onDone, t })
  useEffect(() => {
    callbacks.current = { onArm, onFire, onDone, t }
  }, [onArm, onFire, onDone, t])

  // What the timeline tells us, turned into sound and HUD
  const emit = useCallback(
    (type, a, b) => {
      switch (type) {
        case 'sfx':
          audio.play(a, b)
          break
        case 'phase':
          setPhase(a)
          if (a === 'spawn') themes.forEach((theme) => theme.preload?.())
          if (a === 'aim') callbacks.current.onArm(themes[rig.chosen]?.id)
          if (a === 'shot' && !firedRef.current) {
            firedRef.current = true
            callbacks.current.onFire(themes[rig.chosen]?.id)
            setCracks(makeCracks(rig.screen.muzzle.x * 100, rig.screen.muzzle.y * 100))
          }
          break
        case 'card':
          setCards((c) => c.map((s, i) => (i === a ? 'in' : s)))
          break
        case 'seated':
          setCards((c) => c.map((s, i) => (i === a ? 'seated' : s)))
          setLoaded((n) => n + 1)
          break
        case 'chosen':
          setChosen(a)
          break
        case 'onoma': {
          const id = ++onomaId
          const big = a === 'shot'
          const at = big ? rig.screen.muzzle : rig.screen.cyl
          const accent = big ? lookOf(themes[rig.chosen]?.id).accent : '#f2efe6'
          const entry = {
            id,
            text: callbacks.current.t(`intro.onoma.${a}`),
            size: ONOMA_SIZE[a] ?? 'm',
            accent,
            x: Math.min(0.9, Math.max(0.1, at.x + (big ? 0 : (Math.random() - 0.5) * 0.12 - 0.04))),
            y: Math.min(0.85, Math.max(0.12, at.y - (big ? 0.12 : 0.14 + Math.random() * 0.06))),
          }
          setOnoma((list) => [...list, entry])
          setTimeout(() => setOnoma((list) => list.filter((o) => o.id !== id)), 750)
          break
        }
        case 'done':
          callbacks.current.onDone()
          break
        default:
          break
      }
    },
    [audio, rig, themes],
  )

  // The timeline: built once the scene can run, played up to the first gate
  useEffect(() => {
    if (!immersive) return undefined
    const seq = buildTimeline(rig, { count: themes.length, emit })
    seqRef.current = seq
    seq.tl.play()
    if (import.meta.env.DEV) {
      window.__barillet = {
        rig,
        seek: seq.seek,
        start: seq.start,
        fire: seq.fire,
        mark: (id) => {
          const k = themes.findIndex((theme) => theme.id === id)
          rig.marked = k
          rig.carts.forEach((c, i) => (c.mark = i === k ? 1 : 0))
          setMarked(k)
        },
      }
    }
    return () => {
      seq.dispose()
      seqRef.current = null
      if (import.meta.env.DEV) delete window.__barillet
    }
  }, [immersive, rig, themes, emit])

  useEffect(() => () => audio.dispose(), [audio])

  // Nothing moves while the tab is hidden
  useEffect(() => {
    const onVisibility = () => {
      const seq = seqRef.current
      if (!seq || seq.gate()) return
      if (document.hidden) seq.tl.pause()
      else seq.tl.play()
    }
    document.addEventListener('visibilitychange', onVisibility)
    return () => document.removeEventListener('visibilitychange', onVisibility)
  }, [])

  const mark = useCallback(
    (k) => {
      if (rig.phase !== 'spawn' && rig.phase !== 'open') return
      rig.marked = k
      rig.carts.forEach((c, i) => (c.mark = i === k ? 1 : 0))
      setMarked(k)
    },
    [rig],
  )

  // The first gesture loads the gun; the next one, once aimed, fires
  const gesture = useCallback(() => {
    audio.unlock()
    const seq = seqRef.current
    if (!seq) return
    if (!seq.start()) seq.fire()
  }, [audio])

  useEffect(() => {
    if (!immersive) return undefined
    const onPointerDown = (e) => {
      if (e.target.closest('button')) return
      gesture()
    }
    const onKeyDown = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onSkip()
        return
      }
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const dir = e.key === 'ArrowLeft' ? -1 : 1
        mark((((marked < 0 ? 0 : marked + dir) % themes.length) + themes.length) % themes.length)
        return
      }
      if (e.key === 'Tab' || e.altKey || e.metaKey || e.ctrlKey) return
      if (e.target.closest('button') && (e.key === 'Enter' || e.key === ' ')) return
      e.preventDefault()
      gesture()
    }
    const onPointerMove = (e) => {
      if (coarse) return
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1
    }
    window.addEventListener('pointerdown', onPointerDown)
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointermove', onPointerMove)
    return () => {
      window.removeEventListener('pointerdown', onPointerDown)
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointermove', onPointerMove)
    }
  }, [immersive, gesture, onSkip, mark, marked, themes.length, coarse, pointer])

  // Aimed and left alone: the gun fires by itself
  useEffect(() => {
    if (phase !== 'aim') return undefined
    const id = setTimeout(() => seqRef.current?.fire(), 3000)
    return () => clearTimeout(id)
  }, [phase])

  const toggleMute = useCallback(() => {
    const next = !audio.isMuted()
    audio.setMuted(next)
    setMuted(next)
  }, [audio])

  const pick = useCallback(
    (id) => {
      setFlash(true)
      onFire(id)
      setTimeout(onDone, 380)
    },
    [onFire, onDone],
  )

  const chosenName = chosen >= 0 ? t(`themes.${themes[chosen].id}`) : ''
  const announcement = immersive ? t(`intro.phase.${phase === 'closed' ? 'closed' : phase}`).replace('{name}', chosenName) : t('intro.pick')

  return (
    <div ref={rootRef} className={`bar-root ${phase === 'reveal' ? 'is-revealing' : ''}`}>
      {immersive ? (
        <>
          <Suspense fallback={null}>
            <Scene rig={rig} themes={themes} lowPerf={lowPerf} portrait={portrait} pointer={pointer} emit={emit} />
          </Suspense>
          <Hud
            rig={rig}
            themes={themes}
            cards={cards}
            phase={phase}
            loaded={loaded}
            chosen={chosen}
            marked={marked}
            onoma={onoma}
            cracks={cracks}
            portrait={portrait}
            rootRef={rootRef}
            onMark={mark}
            t={t}
          />
          <button type="button" className="bar-mute" aria-pressed={muted} onClick={toggleMute}>
            {muted ? t('intro.unmute') : t('intro.mute')}
          </button>
        </>
      ) : (
        <>
          <Picker themes={themes} onPick={pick} t={t} />
          <div className={`bar-flash ${flash ? 'is-on' : ''}`} />
        </>
      )}
      <button type="button" className="bar-skip" onClick={onSkip}>
        {t('intro.skip')}
      </button>
      <p className="bar-sr" role="status" aria-live="polite">
        {announcement}
      </p>
    </div>
  )
}

export default BarilletIntro
