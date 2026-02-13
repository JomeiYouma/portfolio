import { useI18n } from '../hooks/useI18n'

const About = () => {
  const { t } = useI18n()

  return (
    <section id="about" data-section className="section">
      <div className="section-inner">
        <div className="section-heading">
          <p className="eyebrow">{t('about.eyebrow')}</p>
          <h2 className="about-title">{t('about.title')}</h2>
          <h3 className="about-name">{t('about.subtitle')}</h3>
        </div>
        <div className="about-content">
          <p className="about-bio">{t('about.bio')}</p>
          
          <div className="skills-group">
            <h4>{t('about.languages')}</h4>
            <p className="skill-list">{t('about.languagesList')}</p>
          </div>
          
          <div className="skills-group">
            <h4>{t('about.frameworks')}</h4>
            <p className="skill-list">{t('about.frameworksList')}</p>
          </div>
          
          <div className="skills-group certification">
            <h4>{t('about.certifications.title')}</h4>
            <p>{t('about.certifications.description')}</p>
          </div>
        </div>
        <div className="about-star">✦</div>
      </div>
    </section>
  )
}

export default About
