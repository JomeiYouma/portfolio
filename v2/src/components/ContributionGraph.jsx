import { useMemo, useRef, useState } from 'react'
import { useInView } from 'motion/react'
import { getCurrentLanguage } from '../hooks/useI18n'

// viewBox units — the SVG scales to its container width
const W = 600
const H = 186
const M = { top: 12, right: 12, bottom: 24, left: 34 }
const INNER_W = W - M.left - M.right
const INNER_H = H - M.top - M.bottom
const X_LABELS = 5
// Daily counts are capped here: one outlier day would otherwise stretch the
// y-axis and flatten every other day against the baseline.
const MAX_DAILY = 16

// Round the y-axis up to a clean number (1 / 2 / 5 × 10ⁿ) so ticks stay readable
const niceMax = (value) => {
  if (value <= 4) return 4
  const pow = 10 ** Math.floor(Math.log10(value))
  return [1, 2, 5, 10].map((m) => m * pow).find((m) => m >= value)
}

const countLabel = (count, lang) => {
  const plural = lang === 'fr' ? count > 1 : count !== 1
  return `${count} contribution${plural ? 's' : ''}`
}

/**
 * Daily GitHub contributions over the last `days` days, as a line + area chart.
 * `contributions` is the full list of { date: 'YYYY-MM-DD', count }, oldest first.
 */
const ContributionGraph = ({ contributions, days, label, alt }) => {
  const [hover, setHover] = useState(null)
  // The line only draws once the chart is on screen: Contact is the last page,
  // so an animation started at load would be over before anyone sees it.
  const figureRef = useRef(null)
  const inView = useInView(figureRef, { once: true, amount: 0.5 })
  const lang = getCurrentLanguage()
  const locale = lang === 'fr' ? 'fr-FR' : 'en-GB'

  const { points, yMax, total, linePath, areaPath } = useMemo(() => {
    const slice = contributions.slice(-days)
    const capped = slice.map((d) => ({ ...d, count: Math.min(d.count, MAX_DAILY) }))
    const max = Math.min(niceMax(Math.max(...capped.map((d) => d.count), 0)), MAX_DAILY)
    const step = capped.length > 1 ? INNER_W / (capped.length - 1) : 0
    const pts = capped.map((d, i) => ({
      ...d,
      x: M.left + i * step,
      y: M.top + INNER_H - (d.count / max) * INNER_H,
    }))
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ')
    const baseline = M.top + INNER_H
    return {
      points: pts,
      yMax: max,
      total: slice.reduce((sum, d) => sum + d.count, 0),
      linePath: line,
      areaPath: pts.length ? `${line} L${pts[pts.length - 1].x.toFixed(1)} ${baseline} L${pts[0].x.toFixed(1)} ${baseline} Z` : '',
    }
  }, [contributions, days])

  const formatDate = (date, options) =>
    new Date(`${date}T00:00:00`).toLocaleDateString(locale, options)

  const active = hover !== null && hover < points.length ? points[hover] : null

  // Snap to the nearest day: the pointer only has to be closest, not on the line
  const onPointerMove = (e) => {
    const rect = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * W
    const index = Math.round(((x - M.left) / INNER_W) * (points.length - 1))
    setHover(Math.max(0, Math.min(points.length - 1, index)))
  }

  const xLabelIndexes = Array.from({ length: X_LABELS }, (_, i) =>
    Math.round((i * (points.length - 1)) / (X_LABELS - 1)))

  return (
    <figure className={`github-graph ${inView ? 'is-visible' : ''}`} ref={figureRef}>
      <figcaption className="github-graph-caption">
        <strong>{countLabel(total, lang)}</strong>
        <span>{label}</span>
      </figcaption>

      <div className="github-graph-plot">
        <svg
          viewBox={`0 0 ${W} ${H}`}
          role="img"
          aria-label={`${alt} — ${label}, ${countLabel(total, lang)}`}
          onPointerMove={onPointerMove}
          onPointerLeave={() => setHover(null)}
        >
          {[0, 0.5, 1].map((ratio) => {
            const y = M.top + INNER_H - ratio * INNER_H
            return (
              <g key={ratio}>
                <line className="github-graph-grid" x1={M.left} x2={W - M.right} y1={y} y2={y} />
                <text className="github-graph-tick" x={M.left - 8} y={y} textAnchor="end" dominantBaseline="middle">
                  {Math.round(yMax * ratio)}
                </text>
              </g>
            )
          })}

          {xLabelIndexes.map((index, i) => (
            <text
              key={points[index].date}
              className="github-graph-tick"
              x={points[index].x}
              y={H - 6}
              textAnchor={i === 0 ? 'start' : i === X_LABELS - 1 ? 'end' : 'middle'}
            >
              {formatDate(points[index].date, { day: 'numeric', month: 'short' })}
            </text>
          ))}

          {/* Keyed by period so switching it remounts the paths and replays the draw */}
          <g key={days}>
            <path className="github-graph-area" d={areaPath} />
            <path className="github-graph-line" d={linePath} pathLength="1" />
          </g>

          {active && (
            <g>
              <line className="github-graph-crosshair" x1={active.x} x2={active.x} y1={M.top} y2={M.top + INNER_H} />
              <circle className="github-graph-point" cx={active.x} cy={active.y} r="4" />
            </g>
          )}
        </svg>

        {active && (
          <div
            className={`github-graph-tooltip ${active.x > W / 2 ? 'is-left' : ''}`}
            style={{ left: `${(active.x / W) * 100}%` }}
            aria-hidden="true"
          >
            <strong>{countLabel(active.count, lang)}</strong>
            <span>{formatDate(active.date, { weekday: 'short', day: 'numeric', month: 'short' })}</span>
          </div>
        )}
      </div>
    </figure>
  )
}

export default ContributionGraph
