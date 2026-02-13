import { useI18n } from '../hooks/useI18n'
import LogoLoop from '../components/LogoLoop'

const LANGUAGES = ['HTML', 'CSS', 'JS', 'PHP', 'Lua', 'Python']
const FRAMEWORKS = ['React JS', 'Laravel', 'Bootstrap', 'Next JS', 'Tailwind CSS', 'Three JS']

const About = () => {
  const { t } = useI18n()

  const languageLogos = LANGUAGES.map((lang) => ({
    node: <span className="skill-tag">{lang}</span>,
    ariaLabel: lang,
  }))

  const frameworkLogos = FRAMEWORKS.map((fw) => ({
    node: <span className="skill-tag">{fw}</span>,
    ariaLabel: fw,
  }))

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
          
          <div className="skills-loop-group">
            <h4>{t('about.languages')}</h4>
            <LogoLoop 
              logos={languageLogos} 
              speed={60} 
              direction="left" 
              logoHeight={24} 
              gap={24}
              pauseOnHover
              scaleOnHover
              ariaLabel="Mastered Languages"
            />
          </div>
          
          <div className="skills-loop-group">
            <h4>{t('about.frameworks')}</h4>
            <LogoLoop 
              logos={frameworkLogos} 
              speed={45} 
              direction="right" 
              logoHeight={24} 
              gap={24}
              pauseOnHover
              scaleOnHover
              ariaLabel="Known Frameworks"
            />
          </div>
          
          <div className="skills-group certification">
            <h4>{t('about.certifications.title')}</h4>
            <p>{t('about.certifications.description')}</p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default About
