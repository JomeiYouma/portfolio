import { scrollToSection } from '../animations/scroll'

const Nav = ({ sections, activeId }) => (
  <nav className="nav">
    <div className="nav-brand">
      <span className="nav-dot" />
      <span>Portfolio V2</span>
    </div>
    <div className="nav-links">
      {sections.map((section, index) => (
        <button
          key={section.id}
          type="button"
          className={`nav-link ${activeId === section.id ? 'is-active' : ''}`}
          onClick={() => scrollToSection(section.id)}
          aria-current={activeId === section.id ? 'page' : undefined}
        >
          <span className="nav-index">{String(index + 1).padStart(2, '0')}</span>
          <span className="nav-label">{section.label}</span>
        </button>
      ))}
    </div>
  </nav>
)

export default Nav
