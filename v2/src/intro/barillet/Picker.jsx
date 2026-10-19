import { lookOf } from './cartridges'

/** The same choice without the gun: four rounds on a dark table, pick one */
const Round = ({ look }) => (
  <svg className="bar-picker__round" viewBox="0 0 60 170" aria-hidden="true">
    <path d="M18 2 C18 12 10 26 10 40 L10 48 L50 48 L50 40 C50 26 42 12 42 2 Z" fill={look.bullet} />
    <rect x="11" y="48" width="38" height="4" fill={look.band ?? look.metal} />
    <rect x="12" y="52" width="36" height="96" fill={look.metal} stroke="rgba(0,0,0,.35)" />
    <rect x="12" y="150" width="36" height="6" fill="rgba(0,0,0,.3)" />
    <rect x="6" y="156" width="48" height="10" rx="2" fill={look.metal} stroke="rgba(0,0,0,.35)" />
    <circle cx="30" cy="100" r="7" fill={look.primer} />
  </svg>
)

const Picker = ({ themes, onPick, t }) => (
  <div className="bar-picker">
    <p className="bar-picker__title">{t('intro.pick')}</p>
    <ul className="bar-picker__list">
      {themes.map((theme, k) => {
        const look = lookOf(theme.id)
        return (
          <li key={theme.id}>
            <button type="button" className="bar-picker__item" style={{ '--bar-accent': look.accent }} onClick={() => onPick(theme.id)}>
              <Round look={look} />
              <span className="bar-card__index">{String(k + 1).padStart(2, '0')}</span>
              <span className="bar-card__name">{t(`themes.${theme.id}`)}</span>
              <span className="bar-card__tag">{t(`intro.taglines.${theme.id}`)}</span>
            </button>
          </li>
        )
      })}
    </ul>
  </div>
)

export default Picker
