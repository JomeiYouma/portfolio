import { useI18n } from '../hooks/useI18n'

const Skills = ({ groups }) => {
  const { t } = useI18n()

  return (
    <section id="skills" data-section className="section">
      <div className="section-inner">
        <div className="section-heading">
          <p className="eyebrow">{t('skills.eyebrow')}</p>
          <h2>{t('skills.title')}</h2>
        </div>
        <div className="skills-grid">
          {groups.map((group) => (
            <div key={group.group} className="skills-card">
              <h3>{group.group}</h3>
              <div className="tag-row">
                {group.items.map((item) => (
                  <span key={item} className="tag">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Skills
