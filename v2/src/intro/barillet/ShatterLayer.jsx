import { useEffect, useMemo, useRef } from 'react'
import gsap from 'gsap'
import { makeShardPolygons } from './shatter'

/**
 * The last frame of the scene, cut into glass and let go. Pieces near the
 * impact leave first; the theme behind shows through the gaps.
 */
const ShatterLayer = ({ shot, impact, lowPerf, onReady, onDone }) => {
  const ref = useRef(null)
  const cx = impact.x * shot.vw
  const cy = impact.y * shot.vh
  const cells = useMemo(
    () =>
      makeShardPolygons(cx, cy, shot.vw, shot.vh, {
        sectors: lowPerf ? 8 : 12,
        rings: lowPerf ? 2 : 3,
        seed: Math.floor(cx * 7 + cy * 13),
      }),
    [cx, cy, shot, lowPerf],
  )

  // Tell the intro once the shards have really been painted, two frames on:
  // only then may the canvas underneath be hidden
  useEffect(() => {
    let a
    let b
    a = requestAnimationFrame(() => {
      b = requestAnimationFrame(() => onReady?.())
    })
    return () => {
      cancelAnimationFrame(a)
      cancelAnimationFrame(b)
    }
  }, [onReady])

  useEffect(() => {
    const root = ref.current
    if (!root) return undefined
    const pieces = Array.from(root.querySelectorAll('.bar-shard'))
    const dMax = Math.max(1, ...cells.map((c) => c.dist))
    const tl = gsap.timeline({ onComplete: onDone })
    tl.to(root.querySelector('.bar-crackweb'), { opacity: 0, duration: 0.4, ease: 'power2.in' }, 0.2)
    pieces.forEach((el, i) => {
      const c = cells[i]
      const dx = c.centroid[0] - cx
      const dy = c.centroid[1] - cy
      const d = Math.hypot(dx, dy) || 1
      const delay = 0.14 + (c.dist / dMax) * 0.35 + c.ring * 0.03 + Math.random() * 0.05
      tl.to(
        el,
        {
          x: (dx / d) * (60 + Math.random() * 140),
          y: (dy / d) * (60 + Math.random() * 140) + 380,
          z: 200 + Math.random() * 300,
          rotationX: (Math.random() - 0.5) * 140,
          rotationY: (Math.random() - 0.5) * 140,
          rotationZ: (Math.random() - 0.5) * 80,
          opacity: 0,
          duration: 0.85 + Math.random() * 0.3,
          ease: 'power2.in',
        },
        delay,
      )
    })
    return () => tl.kill()
  }, [cells, cx, cy, onDone])

  return (
    <div ref={ref} className="bar-shatter" aria-hidden="true">
      <svg className="bar-crackweb" viewBox={`0 0 ${shot.vw} ${shot.vh}`} preserveAspectRatio="none">
        {cells.map((c, i) => (
          <path key={i} d={`M${c.points.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L')}Z`} />
        ))}
      </svg>
      {cells.map((c, i) => (
        <div
          key={i}
          className="bar-shard"
          style={{
            left: c.bbox.x,
            top: c.bbox.y,
            width: c.bbox.w,
            height: c.bbox.h,
            clipPath: `polygon(${c.points.map(([x, y]) => `${(x - c.bbox.x).toFixed(1)}px ${(y - c.bbox.y).toFixed(1)}px`).join(',')})`,
            backgroundImage: `url(${shot.url})`,
            backgroundPosition: `${-c.bbox.x}px ${-c.bbox.y}px`,
            backgroundSize: `${shot.vw}px ${shot.vh}px`,
            transformOrigin: `${(cx - c.bbox.x).toFixed(1)}px ${(cy - c.bbox.y).toFixed(1)}px`,
          }}
        />
      ))}
    </div>
  )
}

export default ShatterLayer
