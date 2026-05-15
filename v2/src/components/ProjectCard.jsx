import { asset } from '../utils/asset'

const ProjectCard = ({ project, lang = 'en' }) => {
  const title = project.title?.[lang] || project.title || 'Untitled'
  const type = project.type?.[lang] || project.type || ''
  const description =
    project.description?.[lang] || project.description || 'No description'
  const tech = project.tech || ''
  const context = project.context || ''
  const image = project.image || null
  const link = project.link || project.links?.demo || null

  return (
    <article className="project-card">
      <div className="project-media">
        {image ? (
          <img
            src={asset(`assets/images/${image}`)}
            alt={title}
            loading="lazy"
          />
        ) : (
          <div className="media-fallback">Preview</div>
        )}
        <div className="project-skills">
          <p>{lang === 'en' ? 'Tech Stack' : 'Stack technique'}</p>
          <div className="tag-row">
            {tech.split('-').map((t, i) => (
              <span key={i} className="tag">
                {t.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>
      <div className="project-body">
        <div className="project-header">
          <div>
            <p className="project-subtitle">{type}</p>
            <h3>{title}</h3>
          </div>
        </div>
        <p className="project-description">{description}</p>
        <div className="project-footer">
          <span className="project-status">{context}</span>
          {link && (
            <div className="project-links">
              <a href={link} target="_blank" rel="noreferrer">
                {lang === 'en' ? 'View' : 'Voir'}
              </a>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}

export default ProjectCard
