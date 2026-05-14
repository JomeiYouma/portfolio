import { motion, useReducedMotion } from 'motion/react'
import { scrollToSection } from '../animations/scroll'
import { useI18n } from '../hooks/useI18n'
import OrbitalRings from '../components/OrbitalRings'
import GlowCard from '../components/GlowCard'
import MagneticButton from '../components/MagneticButton'
import SplitReveal from '../components/SplitReveal'
import Spotlight from '../components/Spotlight'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] } },
}

const Hero = () => {
  const { t } = useI18n()
  const reduce = useReducedMotion()

  return (
    <section id="hero" data-section className="section hero">
      <Spotlight size={680} intensity={0.09} />
      <div className="section-inner hero-grid">
        <motion.div
          className="hero-content"
          initial="hidden"
          animate="show"
          variants={{ show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } } }}
        >
          <h1 className="main-title">
            <SplitReveal text={t('hero.title')} delay={0.15} stagger={0.045} />
          </h1>

          <motion.h2 className="sub-title" variants={fadeUp}>
            {t('hero.subtitle')}
          </motion.h2>

          <motion.p className="hero-description" variants={fadeUp}>
            {t('hero.description')}
          </motion.p>

          <motion.div className="cta-row" variants={fadeUp}>
            <MagneticButton
              type="button"
              className="btn primary cursor-target"
              onClick={() => scrollToSection('projects')}
            >
              {t('hero.cta')}
            </MagneticButton>
            <MagneticButton
              as="a"
              className="btn ghost cursor-target"
              href="mailto:raphael.madore.pro@mailo.com"
            >
              {t('contact.title')}
            </MagneticButton>
          </motion.div>

          <motion.div className="social-links" variants={fadeUp}>
            <a
              href="https://www.linkedin.com/in/raphaël-madoré/"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link cursor-target"
              aria-label={`LinkedIn — ${t('accessibility.opensNewTab')}`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z" /></svg>
              <span aria-hidden="true">IN</span>
            </a>
            <a
              href="https://github.com/JomeiYouma"
              target="_blank"
              rel="noopener noreferrer"
              className="social-link cursor-target"
              aria-label={`GitHub — ${t('accessibility.opensNewTab')}`}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" /></svg>
              <span aria-hidden="true">GH</span>
            </a>
          </motion.div>
        </motion.div>

        {/* Right column: orbital rings as background layer, hero card on top */}
        <motion.div
          className="hero-right-col"
          initial={reduce ? false : { opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.9, delay: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <span className="hero-beam" aria-hidden="true" />
          <OrbitalRings className="hero-orbital-rings" />
          <GlowCard className="hero-card" intensity={0.16} size={320}>
            <p className="hero-card-title">{t('hero.status')}</p>
            <div className="hero-card-grid">
              <div>
                <p className="hero-card-label">{t('contact.eyebrow')}</p>
                <p>raphael.madore.pro@mailo.com</p>
              </div>
              <div>
                <p className="hero-card-label">Location</p>
                <p>{t('hero.location')}</p>
              </div>
            </div>
          </GlowCard>
        </motion.div>
      </div>
    </section>
  )
}

export default Hero
