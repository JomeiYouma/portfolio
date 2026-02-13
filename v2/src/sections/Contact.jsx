import { useI18n } from '../hooks/useI18n'
import GitHubActivity from '../components/GitHubActivity'

const Contact = () => {
  const { t } = useI18n()

  return (
    <section id="contact" data-section className="section contact">
      <div className="section-inner contact-layout">
        <div className="contact-left">
          <p className="eyebrow">{t('contact.eyebrow')}</p>
          <h2 className="contact-title">{t('contact.title')}</h2>
          
          <div className="contact-grid">
            <a href="mailto:raphael.madore.pro@mailo.com" className="contact-card cursor-target">
              <div className="card-content">
                <span className="card-label">{t('contact.email')}</span>
                <span className="card-value">raphael.madore.pro@mailo.com</span>
              </div>
              <span className="card-arrow">❯</span>
            </a>

            <a href="https://www.linkedin.com/in/raphaël-madoré/" target="_blank" rel="noopener noreferrer" className="contact-card cursor-target">
              <div className="card-content">
                <span className="card-label">{t('contact.linkedin')}</span>
                <span className="card-value">/in/raphaelmadore</span>
              </div>
              <span className="card-arrow">❯</span>
            </a>

            <a href="https://github.com/JomeiYouma" target="_blank" rel="noopener noreferrer" className="contact-card cursor-target">
              <div className="card-content">
                <span className="card-label">{t('contact.github')}</span>
                <span className="card-value">github.com/JomeiYouma</span>
              </div>
              <span className="card-arrow">❯</span>
            </a>

            <a href="https://open.spotify.com/playlist/36Y3M007cqXXTBsHUbCS4B" target="_blank" rel="noopener noreferrer" className="contact-card cursor-target">
              <div className="card-content">
                <span className="card-label">{t('contact.spotify')}</span>
                <span className="card-value">{t('contact.spotifyValue')}</span>
              </div>
              <span className="card-arrow">❯</span>
            </a>
          </div>
          
          <p className="footer-note">{t('contact.footer')}</p>
        </div>

        <div className="contact-right">
          <GitHubActivity />
        </div>
      </div>
    </section>
  )
}

export default Contact
