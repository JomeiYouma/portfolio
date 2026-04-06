import { useI18n } from '../hooks/useI18n'
import LogoLoop from '../components/LogoLoop'
import skills from '../data/skills.json'

// ─── CSS Easter Egg ───────────────────────────────────────────────────────────
const CHAOS_DURATION = 2200
let chaosTimer = null
let chaosRafId = null
let chaosElements = []

const CHAOS_TRANSFORMS = [
  'rotate(-8deg) translateX(-20px)',
  'rotate(6deg) translateX(30px) translateY(-15px)',
  'rotate(-4deg) translateX(15px) translateY(20px)',
  'rotate(12deg) translateX(-35px) scale(1.04)',
  'rotate(-10deg) translateX(25px) scale(0.96)',
  'rotate(3deg) translateX(-10px) translateY(-30px)',
  'rotate(-6deg) translateX(40px) translateY(10px)',
  'rotate(9deg) translateX(-25px) scale(1.06)',
]

const applyChaosToElements = () => {
  // Grab a fresh set of targets each time — all visible block-ish elements
  const targets = Array.from(
    document.querySelectorAll(
      '.section-inner > *, .about-content > *, .hero-content > *,' +
      '.skills-loop-group, .project-details, .testimonial-card,' +
      '.contact-card, .repo-card, .kpi-card, .hero-card'
    )
  )

  // Assign a random transform + slight z-index chaos to a random subset
  chaosElements = targets
    .filter(() => Math.random() > 0.45)
    .map((el) => {
      const orig = el.style.transform || ''
      const origZ = el.style.zIndex || ''
      const t = CHAOS_TRANSFORMS[Math.floor(Math.random() * CHAOS_TRANSFORMS.length)]
      el.style.transition = 'transform 0.08s ease'
      el.style.transform = t
      el.style.zIndex = Math.random() > 0.5 ? '999' : '-1'
      return { el, orig, origZ }
    })
}

const resetChaosElements = () => {
  chaosElements.forEach(({ el, orig, origZ }) => {
    el.style.transition = 'transform 0.3s ease'
    el.style.transform = orig
    el.style.zIndex = origZ
  })
  chaosElements = []
}

const triggerCssEaster = () => {
  if (document.body.classList.contains('css-chaos')) return
  document.body.classList.add('css-chaos')
  clearTimeout(chaosTimer)
  cancelAnimationFrame(chaosRafId)

  // Shake elements in bursts every ~300ms
  let elapsed = 0
  const burst = () => {
    if (!document.body.classList.contains('css-chaos')) return
    resetChaosElements()
    applyChaosToElements()
    elapsed += 300
    if (elapsed < CHAOS_DURATION) {
      chaosTimer = setTimeout(burst, 280 + Math.random() * 80)
    }
  }
  burst()

  chaosTimer = setTimeout(() => {
    document.body.classList.remove('css-chaos')
    resetChaosElements()
  }, CHAOS_DURATION)
}

const clearCssEaster = () => {
  clearTimeout(chaosTimer)
  cancelAnimationFrame(chaosRafId)
  document.body.classList.remove('css-chaos')
  resetChaosElements()
}

// ─── Build logo items ─────────────────────────────────────────────────────────
const buildLogoItems = (items) =>
  items.map((item) => {
    const isCss = item.easter === 'css'
    return {
      node: (
        <span
          className={`skill-logo-item${isCss ? ' skill-easter-css' : ''}`}
          onMouseEnter={isCss ? triggerCssEaster : undefined}
          onMouseLeave={isCss ? clearCssEaster : undefined}
          title={item.name}
        >
          <img
            src={item.icon}
            alt={item.name}
            className="skill-logo-icon"
            loading="lazy"
            draggable={false}
          />
          <span className="skill-logo-label">{item.name}</span>
        </span>
      ),
      ariaLabel: item.name,
    }
  })

const About = () => {
  const { t } = useI18n()

  const languageGroup = skills.find((g) => g.group === 'Languages')
  const frameworkGroup = skills.find((g) => g.group === 'Frameworks')
  const toolingGroup = skills.find((g) => g.group === 'Tooling')

  const languageLogos = buildLogoItems(languageGroup?.items ?? [])
  const frameworkLogos = buildLogoItems(frameworkGroup?.items ?? [])
  const toolingLogos = buildLogoItems(toolingGroup?.items ?? [])

  return (
    <section id="about" data-section className="section">
      <div className="section-inner about-two-col">

        {/* ── LEFT column ── */}
        <div className="about-left">
          <div className="section-heading">
            <p className="eyebrow">{t('about.eyebrow')}</p>
            <h2 className="about-title">{t('about.title')}</h2>
            <h3 className="about-name">{t('about.subtitle')}</h3>
          </div>

          <p className="about-bio">{t('about.bio')}</p>

          <div className="skills-loop-group">
            <h4>{t('about.languages')}</h4>
            <LogoLoop
              logos={languageLogos}
              speed={55}
              direction="left"
              logoHeight={44}
              gap={16}
              pauseOnHover
              scaleOnHover
              ariaLabel="Mastered Languages"
            />
          </div>

          <div className="skills-loop-group">
            <h4>{t('about.frameworks')}</h4>
            <LogoLoop
              logos={frameworkLogos}
              speed={40}
              direction="right"
              logoHeight={44}
              gap={16}
              pauseOnHover
              scaleOnHover
              ariaLabel="Known Frameworks"
            />
          </div>

          <div className="skills-loop-group">
            <h4>{t('about.tooling') || 'Tooling :'}</h4>
            <LogoLoop
              logos={toolingLogos}
              speed={50}
              direction="left"
              logoHeight={44}
              gap={16}
              pauseOnHover
              scaleOnHover
              ariaLabel="Tooling"
            />
          </div>
        </div>

        {/* ── RIGHT column ── */}
        <div className="about-right">
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