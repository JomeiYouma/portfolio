import { useEffect, useRef, useState } from 'react'
import SectionHead from '../components/SectionHead'
import ProjectDetailModal from '../../../components/ProjectDetailModal'
import projects from '../../../data/projects.json'
import { useI18n } from '../../../hooks/useI18n'
import { asset } from '../../../utils/asset'

// Shown before "see all": the lead card (2×2 cells) plus five more fill two
// full rows of the three-column grid.
const INITIAL_COUNT = 6

const Projects = ({ number, lang }) => {
  const { t } = useI18n()
  const [expanded, setExpanded] = useState(false)
  const [openIndex, setOpenIndex] = useState(null)
  // Kept after closing, so the dialog still has content during its exit animation
  const [lastIndex, setLastIndex] = useState(0)
  const sectionRef = useRef(null)

  const pick = (value) => value[lang] || value.en
  const visible = expanded ? projects : projects.slice(0, INITIAL_COUNT)

  const open = (index) => {
    setLastIndex(index)
    setOpenIndex(index)
  }

  // Close the detail dialog on Escape (the dialog itself only has its button)
  useEffect(() => {
    if (openIndex === null) return undefined
    const onKey = (e) => { if (e.key === 'Escape') setOpenIndex(null) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [openIndex])

  const toggleAll = () => {
    // Folding the list back removes most of what is on screen: return to its top
    if (expanded) sectionRef.current?.scrollIntoView({ block: 'start' })
    setExpanded((v) => !v)
  }

  return (
    <section id="projects" className="rz-section" aria-labelledby="rz-projects-title" ref={sectionRef}>
      <SectionHead number={number} eyebrow={t('projects.eyebrow')} title={t('projects.title')} titleId="rz-projects-title" />

      <div className="rz-wrap">
        <p className="rz-lead rz-section-lead" data-rz-reveal>{t('projects.sectionLead')}</p>

        <ul className="rz-project-grid" id="rz-project-grid" data-rz-reveal>
          {visible.map((project, index) => {
            const lead = index === 0
            return (
              <li key={project.id} className={lead ? 'is-lead' : undefined}>
                <button
                  type="button"
                  className="rz-project rz-card"
                  onClick={() => open(index)}
                  aria-haspopup="dialog"
                >
                  <span className="rz-shot">
                    <img
                      src={asset(`assets/images/${project.image}`)}
                      alt=""
                      loading={lead ? 'eager' : 'lazy'}
                      decoding="async"
                    />
                  </span>
                  <span className="rz-project-body">
                    <span className="rz-project-meta">
                      <span className="rz-num" aria-hidden="true">{String(index + 1).padStart(2, '0')}</span>
                      <span className="rz-eyebrow">{pick(project.type)}</span>
                      <span className="rz-project-year">{project.year}</span>
                    </span>
                    <span className="rz-project-name">{pick(project.title)}</span>
                    {lead && <span className="rz-project-excerpt">{pick(project.description)}</span>}
                    <span className="rz-project-more">{t('projects.viewMore')} <span aria-hidden="true">→</span></span>
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {projects.length > INITIAL_COUNT && (
          <div className="rz-project-all">
            <button
              type="button"
              className="rz-btn"
              aria-expanded={expanded}
              aria-controls="rz-project-grid"
              onClick={toggleAll}
            >
              {expanded
                ? t('riso.showFewerProjects')
                : t('riso.showAllProjects').replace('{count}', projects.length)}
            </button>
          </div>
        )}
      </div>

      <ProjectDetailModal
        open={openIndex !== null}
        onClose={() => setOpenIndex(null)}
        project={projects[openIndex ?? lastIndex]}
        lang={lang}
        t={t}
      />
    </section>
  )
}

export default Projects
