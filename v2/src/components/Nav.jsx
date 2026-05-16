import { useEffect, useState } from 'react'
import { motion, LayoutGroup } from 'motion/react'
import { scrollToSection } from '../animations/scroll'
import { useI18n } from '../hooks/useI18n'
import FaviconBlocks from './FaviconBlocks'
import { asset } from '../utils/asset'

const Nav = ({ sections, activeId }) => {
  const { t, lang } = useI18n()
  const [menuOpen, setMenuOpen] = useState(false)

  // Close the mobile menu whenever the active section changes (e.g. after a tap)
  useEffect(() => {
    setMenuOpen(false)
  }, [activeId])

  // Close on Escape and lock body scroll while open
  useEffect(() => {
    if (!menuOpen) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setMenuOpen(false) }
    window.addEventListener('keydown', onKey)
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prevOverflow
    }
  }, [menuOpen])

  const menuLabel = lang === 'fr' ? 'Menu' : 'Menu'

  return (
    <nav className={`nav ${menuOpen ? 'is-open' : ''}`} aria-label={t('accessibility.mainNav')}>
      <div className="nav-brand">
        <FaviconBlocks
          src={asset('favicon.png')}
          alt="Portfolio"
          size={28}
          grid={12}
          className="nav-brand-icon"
        />
        <span className="nav-brand-full">Portfolio Raphaël Madoré</span>
        <span className="nav-brand-short">Portfolio R. Madoré</span>
      </div>

      <button
        type="button"
        className="nav-burger"
        aria-expanded={menuOpen}
        aria-controls="primary-nav-list"
        aria-label={menuLabel}
        onClick={() => setMenuOpen((v) => !v)}
      >
        <span className="nav-burger-bar" aria-hidden="true" />
        <span className="nav-burger-bar" aria-hidden="true" />
        <span className="nav-burger-bar" aria-hidden="true" />
      </button>

      <LayoutGroup id="nav">
        <ul className="nav-links" id="primary-nav-list">
          {sections.map((section, index) => {
            const isActive = activeId === section.id
            return (
              <li key={section.id}>
                <button
                  type="button"
                  className={`nav-link ${isActive ? 'is-active' : ''}`}
                  onClick={() => {
                    scrollToSection(section.id)
                    setMenuOpen(false)
                  }}
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
