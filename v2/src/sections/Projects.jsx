import ProjectCard from '../components/ProjectCard'
import { useI18n } from '../hooks/useI18n'

const Projects = ({ projects }) => {
  const { lang, t } = useI18n()

  return (
    <section id="projects" data-section className="section">
      <div className="section-inner">
        <div className="section-heading">
          <p className="eyebrow">{t('projects.eyebrow')}</p>
          <h2>{t('projects.title')}</h2>
        </div>
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard key={project.id} project={project} lang={lang} />
          ))}
        </div>
      </div>
    </section>
  )
}

export default Projects
