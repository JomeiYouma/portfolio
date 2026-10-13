import SectionHead from '../components/SectionHead'
import skills from '../../../data/skills.json'
import { useI18n } from '../../../hooks/useI18n'
import { asset } from '../../../utils/asset'

const GROUP_LABELS = {
  Languages: 'about.languages',
  Frameworks: 'about.frameworks',
}

const About = ({ number }) => {
  const { t } = useI18n()

  return (
    <section id="about" className="rz-section" aria-labelledby="rz-about-title">
      <SectionHead number={number} eyebrow={t('about.eyebrow')} title={t('about.title')} titleId="rz-about-title" />

      <div className="rz-about rz-wrap">
        <div className="rz-about-bio" data-rz-reveal>
          <p className="rz-about-name rz-ink" data-text={t('about.subtitle')} aria-hidden="true">{t('about.subtitle')}</p>
          <p className="rz-lead">{t('about.bio')}</p>
        </div>

        <aside className="rz-stamp" data-rz-reveal>
          <p className="rz-stamp-title">{t('about.certifications.title')}</p>
          <p>{t('about.certifications.description')}</p>
          <a className="rz-link" href={asset('assets/documents/opquast_certificate_2026.pdf')} download>
            <span aria-hidden="true">↓ </span>{t('about.certifications.download')}
          </a>
        </aside>

        <div className="rz-skills">
          {skills.map((group) => (
            <section className="rz-skill-table" key={group.group} data-rz-reveal>
              <h3>{GROUP_LABELS[group.group] ? t(GROUP_LABELS[group.group]) : group.group}</h3>
              <ul>
                {group.items.map((item) => (
                  <li key={item.name}>
                    <img src={asset(item.icon)} alt="" width="20" height="20" loading="lazy" decoding="async" />
                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </div>
    </section>
  )
}

export default About
