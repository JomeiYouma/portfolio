import { motion, LayoutGroup } from 'motion/react'
import { scrollToSection } from '../animations/scroll'
import { useI18n } from '../hooks/useI18n'
import FaviconBlocks from './FaviconBlocks'
import { asset } from '../utils/asset'

const Nav = ({ sections, activeId }) => {
  const { t } = useI18n()
  return (
    <nav className="nav" aria-label={t('accessibility.mainNav')}>
      <div className="nav-brand">
        <FaviconBlocks
          src={asset('favicon.png')}
          alt="Portfolio"
          size={28}
          grid={12}
          className="nav-brand-icon"
        />
        <span>Portfolio V2</span>
      </div>
      <LayoutGroup id="nav">
        <ul className="nav-links">
          {sections.map((section, index) => {
            const isActive = activeId === section.id
            return (
              <li key={section.id}>
                <button
                  type="button"
                  className={`nav-link ${isActive ? 'is-active' : ''}`}
                  onClick={() => scrollToSection(section.id)}
                  aria-current={isActive ? 'page' : undefined}
                >
                  {isActive && (
                    <motion.span
                      layoutId="nav-active-pill"
                      className="nav-pill"
                      aria-hidden="true"
                      transition={{ type: 'spring', stiffness: 380, damping: 32 }}
                    />
                  )}
                  <span className="nav-index" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                  <span className="nav-label">{section.label}</span>
                </button>
              </li>
            )
          })}
        </ul>
      </LayoutGroup>
    </nav>
  )
}

export default Nav
