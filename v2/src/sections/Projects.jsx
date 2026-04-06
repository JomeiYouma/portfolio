import { useState, useMemo, useCallback, useRef } from 'react'
import CircularGallery from '../components/CircularGallery'
import { useI18n } from '../hooks/useI18n'

const Projects = ({ projects }) => {
  const { lang, t } = useI18n()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const galleryRef = useRef(null)
  
  const handleNext = () => galleryRef.current?.next()
  const handlePrev = () => galleryRef.current?.prev()
  
  const galleryItems = useMemo(() => 
    projects.map((project) => ({
      image: `/assets/images/${project.image}`,
      text: project.title[lang] || project.title.en,
    })), [projects, lang])

  const selectedProject = projects[selectedIndex]
  
  const handleSelect = useCallback((index) => {
    setSelectedIndex(index)
  }, [])

  return (
    <section id="projects" data-section className="section projects-section">
      <div className="section-inner projects-inner">
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
        
        <div className="project-details">
          <div className="project-details-header">
            <p className="eyebrow">{t('projects.eyebrow')}</p>
            <h2 className="project-title">{selectedProject.title[lang] || selectedProject.title.en}</h2>
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
          
          {selectedProject.link && (
            <a 
              href={selectedProject.link} 
              target="_blank" 
              rel="noopener noreferrer"
              className="btn primary cursor-target"
            >
              {t('projects.viewProject')}
            </a>
          )}
          
          <div className="project-navigation">
            <button className="nav-arrow" onClick={handlePrev} aria-label="Previous project">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <button className="nav-arrow" onClick={handleNext} aria-label="Next project">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Projects
