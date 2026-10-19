import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { useReducedMotion } from 'motion/react'
import '@fontsource-variable/schibsted-grotesk/wght.css'
import './barillet.css'
import { useI18n } from '../../hooks/useI18n'
import { useMediaQuery } from '../../hooks/useMediaQuery'
import { IS_LOW_PERF } from '../../utils/perf'
import { commitShot } from './aim'
import { createAudio } from './audio'
import Hud from './Hud'
import Picker from './Picker'
import { createRig, landShot, listenSnapshot, markRound, nextRound, recordShot, setAimForce, setPhaseOf, stepsToNext } from './rig'
import { requestSnapshot } from './shatter'
import ShatterLayer from './ShatterLayer'
import { buildShot } from './shots'
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

/** Jagged lines radiating from a point, in viewBox units (0..100), for the fallback reveal */
const makeCracks = (cx, cy) => {
  const paths = []
  const n = 9 + Math.floor(Math.random() * 4)
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2 + Math.random() * 0.4
    const len = 8 + Math.random() * 26
    let d = `M${cx} ${cy}`
    const steps = 3 + Math.floor(Math.random() * 3)
    for (let s = 1; s <= steps; s++) {
      const r = (len * s) / steps
      const wobble = (Math.random() - 0.5) * 0.5
      d += ` L${(cx + Math.cos(a + wobble) * r).toFixed(1)} ${(cy + Math.sin(a + wobble) * r * 1.6).toFixed(1)}`
    }
    paths.push(d)
  }
  return paths
}

/**
 * The opening sequence: a revolver in the visitor's hand, one round per
 * theme, a spin, then a bottle to shoot; the round that breaks it opens its
 * theme through the shattered screen. Without WebGL or with reduced motion,
 * the same choice as a row of rounds to pick from.
 */
const BarilletIntro = ({ themes, lang, onToggleLang, onArm, onFire, onDone, onSkip }) => {
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
  const shotRef = useRef(null)
  const pointerMoved = useRef(false)
  const revealed = useRef(false)

  const [phase, setPhase] = useState('ready')
  const [cards, setCards] = useState(() => themes.map(() => null))
  const [loaded, setLoaded] = useState(0)
  const [chosen, setChosen] = useState(-1)
  const [marked, setMarked] = useState(-1)
  const [cracks, setCracks] = useState(null)
  const [muted, setMuted] = useState(() => audio.isMuted())
  const [flash, setFlash] = useState(false)
  const [shots, setShots] = useState(0)
  const [fired, setFired] = useState([])
  const [fireKey, setFireKey] = useState(0)
  const [missKey, setMissKey] = useState(0)
  const [snapshot, setSnapshot] = useState(null)
  // The radial mask is the fallback only; while the snapshot is on its way the intro stays opaque
  const [maskReveal, setMaskReveal] = useState(false)
  const [impact, setImpact] = useState({ x: 0.5, y: 0.5 })

  // The timeline is built once; what it calls back into may change with
  // every render (the translator, the parent's handlers), so it goes through refs
  const callbacks = useRef({ onArm, onFire, onDone, t })
  useEffect(() => {
    callbacks.current = { onArm, onFire, onDone, t }
  }, [onArm, onFire, onDone, t])

  const finish = useCallback(() => callbacks.current.onDone(), [])

  /** The fallback reveal: cracks and a growing hole, when no snapshot is possible */
  const revealByMask = useCallback(() => {
    setCracks(makeCracks(rig.screen.impact.x * 100, rig.screen.impact.y * 100))
    setMaskReveal(true)
    setTimeout(finish, 1300)
  }, [rig, finish])

  // What the timeline and the shots tell us, turned into sound and HUD
  const emit = useCallback(
    (type, a, b) => {
      switch (type) {
        case 'sfx':
          audio.play(a, b)
          break
        case 'phase':
          setPhase(a)
          if (a === 'spawn') themes.forEach((theme) => theme.preload?.())
          if (a === 'aim' && rig.chosen >= 0) callbacks.current.onArm(themes[rig.chosen]?.id)
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
        case 'fired':
          setFireKey((k) => k + 1)
          break
        case 'reveal': {
          if (revealed.current) break
          revealed.current = true
          setPhaseOf(rig, 'reveal')
          setPhase('reveal')
          callbacks.current.onFire(themes[rig.chosen]?.id)
          setImpact({ x: rig.screen.impact.x, y: rig.screen.impact.y })
          if (lowPerf) revealByMask()
          else requestSnapshot(rig)
          break
        }
        case 'done':
          finish()
          break
        default:
          break
      }
    },
    [audio, rig, themes, lowPerf, revealByMask, finish],
  )

  // The screen-level shatter needs the frame the post pass captured
  useEffect(() => {
    listenSnapshot(rig, (shot) => {
      if (shot) setSnapshot(shot)
      else revealByMask()
    })
    return () => listenSnapshot(rig, null)
  }, [rig, revealByMask])

  // Sounds load from the first frame; they only play after a gesture
  useEffect(() => {
    audio.prefetch()
    return () => audio.dispose()
  }, [audio])

  /** One pull of the trigger: decides the outcome, runs the shot, re-arms on a miss */
  const fire = useCallback(
    (force) => {
      const seq = seqRef.current
      if (!seq || shotRef.current || !seq.consumeFire()) return false
      const count = themes.length
      const last = rig.shots >= count - 1
      // Without a pointer to aim with, or on the last round, the hand does the aiming
      const assisted = force === 'hit' || coarse || !pointerMoved.current || last
      const outcome = force === 'miss' ? 'miss' : assisted || rig.aim.onBottle ? 'hit' : 'miss'
      shotRef.current = { pending: true }
      const start = () => {
        const steps = stepsToNext(rig, count)
        recordShot(rig)
        commitShot(rig, outcome)
        setShots(rig.shots)
        const firedIndex = rig.chosen
        const shot = buildShot(rig, {
          outcome,
          steps,
          slow: !lowPerf,
          emit,
          onImpact: (o) => {
            landShot(rig, o)
            audio.play(o === 'hit' ? 'shatter' : 'miss')
          },
          onSettled: (o) => {
            shotRef.current = null
            if (o !== 'miss') return
            setFired((f) => [...f, firedIndex])
            const next = nextRound(rig, count)
            setChosen(next)
            setMissKey((k) => k + 1)
            setAimForce(rig, 0)
            seq.rearm()
            setTimeout(() => callbacks.current.onArm(themes[next].id), 120)
          },
        })
        shotRef.current = shot
        shot.play()
      }
      if (assisted && !coarse) {
        // Give the barrel a beat to swing onto the bottle
        setAimForce(rig, 1)
        setTimeout(start, 170)
      } else start()
      return true
    },
    [rig, themes, coarse, lowPerf, emit, audio],
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
        audio,
        seek: seq.seek,
        start: seq.start,
        fire: (force) => fire(force),
        hit: () => fire('hit'),
        miss: () => fire('miss'),
        aimAt: (x, y) => {
          pointer.x = x * 2 - 1
          pointer.y = y * 2 - 1
          pointerMoved.current = true
        },
        mark: (id) => {
          const k = themes.findIndex((theme) => theme.id === id)
          markRound(rig, k)
          setMarked(k)
        },
      }
    }
    return () => {
      seq.dispose()
      shotRef.current?.kill?.()
      shotRef.current = null
      seqRef.current = null
      if (import.meta.env.DEV) delete window.__barillet
    }
  }, [immersive, rig, themes, emit, fire, audio, pointer])

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
      markRound(rig, k)
      setMarked(k)
    },
    [rig],
  )

  // The first gesture loads the gun; the next ones, once aimed, fire
  const gesture = useCallback(() => {
    audio.unlock()
    const seq = seqRef.current
    if (!seq) return
    if (!seq.start()) fire()
  }, [audio, fire])

  useEffect(() => {
    if (!immersive) return undefined
    const onPointerDown = (e) => {
      if (e.target.closest('button, a')) return
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
      pointerMoved.current = true
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
  const announcement = immersive ? t(`intro.phase.${phase}`).replace('{name}', chosenName) : t('intro.pick')
  const aiming = immersive && !coarse && (phase === 'aim' || phase === 'shot')
  const rootClass = [
    'bar-root',
    aiming ? 'is-aiming' : '',
    snapshot ? 'is-shattering' : '',
    maskReveal && !snapshot ? 'is-revealing' : '',
  ].join(' ')

  // Portaled to <body>: the themes' own portals (the Neon cursor) would otherwise paint over it
  return createPortal(
    <div ref={rootRef} className={rootClass}>
      {immersive ? (
        <>
          <Suspense fallback={null}>
            <Scene rig={rig} themes={themes} lowPerf={lowPerf} portrait={portrait} coarse={coarse} pointer={pointer} emit={emit} />
          </Suspense>
          <Hud
            rig={rig}
            themes={themes}
            cards={cards}
            phase={phase}
            loaded={loaded}
            chosen={chosen}
            marked={marked}
            cracks={cracks}
            portrait={portrait}
            coarse={coarse}
            rootRef={rootRef}
            pointer={pointer}
            fireKey={fireKey}
            missKey={missKey}
            shots={shots}
            fired={fired}
            onMark={mark}
            t={t}
          />
          {snapshot && <ShatterLayer shot={snapshot} impact={impact} lowPerf={lowPerf} onDone={finish} />}
          <button type="button" className="bar-lang" lang={lang === 'en' ? 'fr' : 'en'} onClick={onToggleLang}>
            {lang === 'en' ? 'FR' : 'ENG'}
          </button>
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
    </div>,
    document.body,
  )
}

export default BarilletIntro
