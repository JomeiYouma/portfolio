import { useState, useMemo, useCallback, useRef, useEffect } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import CircularGallery from '../components/CircularGallery'
import GlowCard from '../components/GlowCard'
import MagneticButton from '../components/MagneticButton'
import ProjectDetailModal from '../components/ProjectDetailModal'
import { useI18n } from '../hooks/useI18n'
import { asset } from '../utils/asset'

const fadeSwap = {
  initial: { opacity: 0, y: 14 },
  animate: { opacity: 1, y: 0 },
  exit:    { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] },
}

const Projects = ({ projects }) => {
  const { lang, t } = useI18n()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [detailOpen, setDetailOpen] = useState(false)
  const galleryRef = useRef(null)

  const handleNext = () => galleryRef.current?.next()
  const handlePrev = () => galleryRef.current?.prev()

  const galleryItems = useMemo(() =>
    projects.map((project) => ({
      image: asset(`assets/images/${project.image}`),
      text: project.title[lang] || project.title.en,
    })), [projects, lang])

  const selectedProject = projects[selectedIndex]

  const handleSelect = useCallback((index) => {
    setSelectedIndex(index)
  }, [])

  // Close modal on Escape (in addition to the close button)
  useEffect(() => {
    if (!detailOpen) return
    const onKey = (e) => { if (e.key === 'Escape') setDetailOpen(false) }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [detailOpen])

  return (
    <section
      id="projects"
      data-section
      className="section projects-section"
      aria-labelledby="projects-heading"
    >
      <div className="section-inner projects-inner">
        <header className="projects-header">
          <p className="eyebrow">{t('projects.eyebrow')}</p>
          <h2 id="projects-heading" className="projects-section-title">
            {t('projects.title')}
          </h2>
          <p className="lead projects-lead">{t('projects.sectionLead')}</p>
        </header>

        <div className="projects-body">
          <div className="projects-gallery-wrap">
            <div className="projects-gallery">
              <CircularGallery
                ref={galleryRef}
                items={galleryItems}
                bend={2}
                textColor="#24FBC5"
                borderRadius={0.02}
                font="bold 18px Tektur"
                scrollSpeed={1.5}
                scrollEase={0.08}
                onSelect={handleSelect}
              />
            </div>
            <p className="projects-drag-hint" aria-live="polite">
              <span className="drag-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M8 12h8" />
                  <path d="M5 12l3-3" />
                  <path d="M5 12l3 3" />
                  <path d="M19 12l-3-3" />
                  <path d="M19 12l-3 3" />
                </svg>
              </span>
              {t('projects.dragHint')}
            </p>
          </div>

          <GlowCard className="project-details" intensity={0.14} size={420}>
            <AnimatePresence mode="wait">
              <motion.div
                key={selectedIndex}
                className="project-details-anim"
                {...fadeSwap}
              >
                <div className="project-details-header">
                  <h3 className="project-title">{selectedProject.title[lang] || selectedProject.title.en}</h3>
                  <span className="project-type">{selectedProject.type[lang] || selectedProject.type.en}</span>
                </div>

                <p className="project-description">
                  {selectedProject.description[lang] || selectedProject.description.en}
                </p>

                <div className="project-meta">
                  <div className="project-tech">
                    <span className="meta-label">{t('projects.tech')}</span>
                    <span className="meta-value">{selectedProject.tech}</span>
                  </div>
                  <div className="project-context">
                    <span className="meta-label">{t('projects.context')}</span>
                    <span className="meta-value">{selectedProject.context}</span>
                  </div>
                </div>

                <div className="project-actions">
                  {selectedProject.link && (
                    <MagneticButton
                      as="a"
                      href={selectedProject.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn primary cursor-target"
                      aria-label={`${t('projects.viewProject')} — ${selectedProject.title[lang] || selectedProject.title.en} (${lang === 'fr' ? 'nouvel onglet' : 'opens in new tab'})`}
                    >
                      {t('projects.viewProject')}
                    </MagneticButton>
                  )}
                  <MagneticButton
                    type="button"
                    className="btn ghost cursor-target"
                    onClick={() => setDetailOpen(true)}
                    aria-haspopup="dialog"
                    aria-expanded={detailOpen}
                  >
                    {t('projects.viewMore')}
                  </MagneticButton>
                </div>
              </motion.div>
            </AnimatePresence>

            <div className="project-navigation">
              <MagneticButton
                className="nav-arrow cursor-target"
                onClick={handlePrev}
                aria-label={lang === 'fr' ? 'Projet précédent' : 'Previous project'}
                strength={10}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                  <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </MagneticButton>
              <MagneticButton
                className="nav-arrow cursor-target"
                onClick={handleNext}
                aria-label={lang === 'fr' ? 'Projet suivant' : 'Next project'}
                strength={10}
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true" focusable="false">
                  <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </MagneticButton>
            </div>
          </GlowCard>
        </div>
      </div>

      <ProjectDetailModal
        open={detailOpen}
        onClose={() => setDetailOpen(false)}
        project={selectedProject}
        lang={lang}
        t={t}
      />
    </section>
  )
}

export default Projects
