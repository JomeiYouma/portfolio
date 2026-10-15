import AccessibilityControls from '../../components/AccessibilityControls'
import { useI18n } from '../../hooks/useI18n'
import { asset } from '../../utils/asset'
import { deckle, stripPoints } from './paper'
import { stationNumber } from './stations'

// The left rail: one strip of torn kraft paper down the edge, carrying the
// brand, the journey as a folded map that unrolls with the scroll (seven
// pinned stops), the view toggle and the shared controls, pressed into the
// paper. `horizontal` lays the same thing across the top on narrow windows.

const STRIP = { vertical: stripPoints(false), horizontal: stripPoints(true) }
const TORN = deckle(99, 40, 4)
// The portrait, glued on a scrap of paper torn around it
const SCRAP = deckle(41, 9, 3)

const icon = { viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.7, strokeLinecap: 'round', strokeLinejoin: 'round', 'aria-hidden': true, focusable: 'false' }

// To the page: a sheet with lines of text
const PageIcon = () => (
  <svg {...icon}>
    <path d="M6 3h8.5L19 7.5V21H6z" />
    <path d="M14.5 3v4.5H19M9 11.5h7M9 14.5h7M9 17.5h4.5" />
  </svg>
)

// Back to the map: a map folded in three
const MapIcon = () => (
  <svg {...icon}>
    <path d="M3 6.5 9 4l6 2.5L21 4v13.5L15 20l-6-2.5L3 20z" />
    <path d="M9 4v13.5M15 6.5V20" />
  </svg>
)

const Rail = ({ stations, active, goTo, immersive, hasWebgl, onToggleView, controlsProps, horizontal }) => {
  const { t } = useI18n()
  const last = stations.length - 1
  const stopName = (station) =>
    station.index ? `${t('origami.station')} ${stationNumber(station.index)}` : t('origami.departure')

  return (
    <header className={`ori-rail ${horizontal ? 'is-row' : ''}`} style={{ '--ori-deckle': TORN }}>
      <a className="ori-brand" href="#hero" onClick={(e) => { e.preventDefault(); goTo(0) }}>
        <span className="ori-avatar" style={{ '--ori-scrap': SCRAP }} aria-hidden="true">
          <img src={asset('assets/images/avatar.webp')} alt="" width="128" height="128" decoding="async" />
        </span>
        <span className="ori-brand-name">Raphaël Madoré</span>
      </a>

      <nav className="ori-nav" aria-label={t('origami.rail.title')}>
        {/* Stretched to the nav box; only the short axis carries detail, so the stretch is harmless */}
        <svg
          className="ori-strip"
          viewBox={horizontal ? '0 0 100 36' : '0 0 36 100'}
          preserveAspectRatio="none"
          aria-hidden="true"
          focusable="false"
        >
          <polygon className="ori-strip-back" points={horizontal ? STRIP.horizontal : STRIP.vertical} />
          <rect
            className="ori-strip-front"
            x={horizontal ? 0 : 5}
            y={horizontal ? 5 : 0}
            width={horizontal ? 100 : 26}
            height={horizontal ? 26 : 100}
          />
          <line
            className="ori-strip-road"
            pathLength="100"
            {...(horizontal ? { x1: 0, y1: 18, x2: 100, y2: 18 } : { x1: 18, y1: 0, x2: 18, y2: 100 })}
          />
        </svg>
        <span className="ori-roll" aria-hidden="true" />
        <ol className="ori-pins">
          {stations.map((station) => (
            <li key={station.id} style={{ '--i': last ? station.index / last : 0 }}>
              <a
                href={`#${station.id}`}
                aria-current={station.index === active ? 'location' : undefined}
                aria-label={`${stopName(station)} : ${station.label}`}
                onClick={(e) => { e.preventDefault(); goTo(station.index) }}
              >
                <span className="ori-pin" aria-hidden="true" />
                <span className="ori-pin-name" aria-hidden="true">
                  {stationNumber(station.index)} {station.label}
                </span>
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="ori-rail-tools">
        {hasWebgl && (
          <button
            type="button"
            className="ori-mode"
            onClick={onToggleView}
            aria-label={immersive ? t('origami.viewMap') : t('origami.view3d')}
          >
            <span className="control-tooltip" aria-hidden="true">
              {immersive ? t('origami.viewMap') : t('origami.view3d')}
            </span>
            {immersive ? <PageIcon /> : <MapIcon />}
          </button>
        )}
        <AccessibilityControls {...controlsProps} />
      </div>
    </header>
  )
}

export default Rail
