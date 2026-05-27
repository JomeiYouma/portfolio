import { useEffect, useRef } from 'react'
import { IS_LOW_PERF } from '../utils/perf'
import './Waves.css'

/**
 * Waves — animated background of flowing lines that reacts to the cursor.
 * Inspired by the React Bits "Waves" component, reimplemented as a plain
 * canvas so it fits the project's stack (no shadcn / no extra deps).
 *
 * The component fills its closest positioned ancestor.
 */
const Waves = ({
  lineColor = '#00ffb3',
  backgroundColor = 'transparent',
  waveSpeedX = 0.02,
  waveSpeedY = 0.01,
  waveAmpX = 40,
  waveAmpY = 20,
  friction = 0.9,
  tension = 0.01,
  maxCursorMove = 120,
  xGap = 12,
  yGap = 36,
  opacity = 0.55,
}) => {
  const canvasRef = useRef(null)
  const wrapRef = useRef(null)

  useEffect(() => {
    // The Waves canvas runs a per-frame physics pass over a dense point grid
    // and rebuilds smooth Bezier paths for every line. On low-perf machines
    // that's enough to keep the main thread busy whenever the Games section
    // is on screen, so we skip the whole effect and let the section's static
    // background do the talking.
    if (IS_LOW_PERF) return
    const canvas = canvasRef.current
    const wrap = wrapRef.current
    if (!canvas || !wrap) return
    const ctx = canvas.getContext('2d')

    let bounding = { width: 0, height: 0, left: 0, top: 0 }
    let lines = []
    let raf = 0
    let frame = 0
    let dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))

    const mouse = {
      x: -10, y: 0, lx: 0, ly: 0, sx: 0, sy: 0,
      v: 0, vs: 0, a: 0, set: false,
    }

    // Cheap, smooth-enough pseudo-noise (sum of sines)
    const noise = (x, y) =>
      Math.sin(x * 1.7 + y * 0.9) * 0.5 +
      Math.sin(x * 0.5 - y * 1.3) * 0.35 +
      Math.sin(x * 2.3 + y * 1.7) * 0.15

    const setSize = () => {
      const r = wrap.getBoundingClientRect()
      bounding = { width: r.width, height: r.height, left: r.left, top: r.top }
      canvas.width = Math.floor(r.width * dpr)
      canvas.height = Math.floor(r.height * dpr)
      canvas.style.width = `${r.width}px`
      canvas.style.height = `${r.height}px`
      // Reset transform before re-applying so resize() doesn't accumulate scale
      ctx.setTransform(1, 0, 0, 1, 0, 0)
      ctx.scale(dpr, dpr)
    }

    const setLines = () => {
      lines = []
      const { width, height } = bounding
      const oWidth = width + 200
      const oHeight = height + 30
      const totalLines = Math.ceil(oWidth / xGap)
      const totalPoints = Math.ceil(oHeight / yGap)
      const xStart = (width - xGap * totalLines) / 2
      const yStart = (height - yGap * totalPoints) / 2

      for (let i = 0; i <= totalLines; i++) {
        const pts = []
        for (let j = 0; j <= totalPoints; j++) {
          pts.push({
            x: xStart + xGap * i,
            y: yStart + yGap * j,
            wave: { x: 0, y: 0 },
            cursor: { x: 0, y: 0, vx: 0, vy: 0 },
          })
        }
        lines.push(pts)
      }
    }

    const movePoints = (time) => {
      lines.forEach((pts) => {
        pts.forEach((p) => {
          const n = noise(
            (p.x + time * waveSpeedX) * 0.002,
            (p.y + time * waveSpeedY) * 0.0015
          ) * 12
          p.wave.x = Math.cos(n) * waveAmpX
          p.wave.y = Math.sin(n) * waveAmpY

          const dx = mouse.sx - p.x
          const dy = mouse.sy - p.y
          const dist = Math.hypot(dx, dy)
          // Larger reach + velocity grows reach further
          const l = Math.max(220, mouse.vs * 3)
          if (dist < l) {
            const s = 1 - dist / l
            const f = s * s
            // Velocity-driven push (cursor speed) — bumped 5× from the
            // React Bits default so movement is clearly readable
            const speed = Math.max(8, mouse.vs)
            p.cursor.vx += Math.cos(mouse.a) * f * speed * 0.0035
            p.cursor.vy += Math.sin(mouse.a) * f * speed * 0.0035
            // Static repulsion away from cursor so even a slow / stopping
            // pointer still bends nearby lines outward
            if (dist > 0.001) {
              p.cursor.vx += (-dx / dist) * f * 0.6
              p.cursor.vy += (-dy / dist) * f * 0.6
            }
          }

          p.cursor.vx += (0 - p.cursor.x) * tension
          p.cursor.vy += (0 - p.cursor.y) * tension
          p.cursor.vx *= friction
          p.cursor.vy *= friction
          p.cursor.x += p.cursor.vx * 2
          p.cursor.y += p.cursor.vy * 2

          p.cursor.x = Math.min(maxCursorMove, Math.max(-maxCursorMove, p.cursor.x))
          p.cursor.y = Math.min(maxCursorMove, Math.max(-maxCursorMove, p.cursor.y))
        })
      })
    }

    const moved = (p) => ({
      x: p.x + p.wave.x + p.cursor.x,
      y: p.y + p.wave.y + p.cursor.y,
    })

    const drawLines = () => {
      ctx.clearRect(0, 0, bounding.width, bounding.height)
      if (backgroundColor && backgroundColor !== 'transparent') {
        ctx.fillStyle = backgroundColor
        ctx.fillRect(0, 0, bounding.width, bounding.height)
      }

      ctx.strokeStyle = lineColor
      ctx.lineWidth = 1
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'

      lines.forEach((pts) => {
        if (pts.length < 2) return
        ctx.beginPath()
        let p = moved(pts[0])
        ctx.moveTo(p.x, p.y)
        for (let i = 1; i < pts.length - 1; i++) {
          const cur = moved(pts[i])
          const next = moved(pts[i + 1])
          const mx = (cur.x + next.x) / 2
          const my = (cur.y + next.y) / 2
          ctx.quadraticCurveTo(cur.x, cur.y, mx, my)
        }
        const last = moved(pts[pts.length - 1])
        ctx.lineTo(last.x, last.y)
        ctx.stroke()
      })
    }

    const tick = () => {
      frame += 1
      mouse.sx += (mouse.x - mouse.sx) * 0.1
      mouse.sy += (mouse.y - mouse.sy) * 0.1
      const dx = mouse.x - mouse.lx
      const dy = mouse.y - mouse.ly
      const d = Math.hypot(dx, dy)
      mouse.v = d
      mouse.vs += (d - mouse.vs) * 0.1
      mouse.vs = Math.min(160, mouse.vs)
      mouse.lx = mouse.x
      mouse.ly = mouse.y
      if (d > 0) mouse.a = Math.atan2(dy, dx)

      movePoints(frame)
      drawLines()
      raf = requestAnimationFrame(tick)
    }

    const onMove = (e) => {
      const r = wrap.getBoundingClientRect()
      mouse.x = e.clientX - r.left
      mouse.y = e.clientY - r.top
      if (!mouse.set) {
        mouse.sx = mouse.x; mouse.sy = mouse.y
        mouse.lx = mouse.x; mouse.ly = mouse.y
        mouse.set = true
      }
    }

    const onResize = () => {
      dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1))
      setSize()
      setLines()
    }

    setSize()
    setLines()
    window.addEventListener('resize', onResize)

    // Only run the RAF loop + listen to mousemove while the wrap is in view.
    // In the horizontal-scroll layout every section stays mounted, so without
    // gating these the canvas would animate at 60fps and every page-wide mouse
    // move would call getBoundingClientRect() even when Games is off-screen.
    let isVisible = false
    const startLoop = () => {
      if (raf || !isVisible) return
      raf = requestAnimationFrame(tick)
    }
    const stopLoop = () => {
      if (!raf) return
      cancelAnimationFrame(raf)
      raf = 0
    }
    const attachMouse = () => window.addEventListener('mousemove', onMove, { passive: true })
    const detachMouse = () => window.removeEventListener('mousemove', onMove)

    let io = null
    if (typeof IntersectionObserver !== 'undefined') {
      io = new IntersectionObserver(
        (entries) => entries.forEach((e) => {
          const next = e.isIntersecting
          if (next === isVisible) return
          isVisible = next
          if (isVisible) { attachMouse(); startLoop() }
          else { detachMouse(); stopLoop() }
        }),
        { root: null, threshold: 0 }
      )
      io.observe(wrap)
    } else {
      isVisible = true
      attachMouse()
      startLoop()
    }

    return () => {
      stopLoop()
      detachMouse()
      io?.disconnect()
      window.removeEventListener('resize', onResize)
    }
  }, [
    lineColor, backgroundColor, waveSpeedX, waveSpeedY,
    waveAmpX, waveAmpY, friction, tension, maxCursorMove, xGap, yGap,
  ])

  return (
    <div ref={wrapRef} className="waves-bg" aria-hidden="true">
      <canvas ref={canvasRef} className="waves-canvas" style={{ opacity }} />
    </div>
  )
}

export default Waves
