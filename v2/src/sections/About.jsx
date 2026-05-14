import { useEffect, useRef } from 'react'
import { motion } from 'motion/react'
import { useI18n } from '../hooks/useI18n'
import skills from '../data/skills.json'
import GlowCard from '../components/GlowCard'
import Reveal from '../components/Reveal'

// ─── CSS Easter Egg (module-level stable refs) ────────────────────────────────
const CHAOS_DURATION = 2200
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
let chaosTimer = null
// Each entry: { el, t, z } — t/z capture original inline styles so we can restore.
let chaosEls = []

function resetChaos() {
  chaosEls.forEach(({ el, t, z }) => {
    el.style.transition = 'transform 0.3s ease'
    el.style.transform = t
    el.style.zIndex = z
  })
  chaosEls = []
}

// Pick & cache the set of elements for the whole burst (the DOM doesn't change
// mid-burst). Avoids a fresh querySelectorAll + forced reflow every 300ms.
function buildChaosSet(anchor) {
  const anchorRow = anchor?.closest('.skills-loop-group') ?? null
  const sel = '.section-inner > *, .about-content > *, .hero-content > *, ' +
    '.skills-loop-group, .project-details, .testimonial-card, ' +
    '.contact-card, .kpi-card, .hero-card, .about-cert'
  chaosEls = Array.from(document.querySelectorAll(sel))
    .filter((el) => {
      if (anchorRow && (el === anchorRow || anchorRow.contains(el) || el.contains(anchorRow))) return false
      return Math.random() > 0.48
    })
    .map((el) => ({
      el,
      t: el.style.transform || '',
      z: el.style.zIndex || '',
    }))
}

// Re-randomize the cached set — pure style writes, no DOM query.
function burstChaos() {
  for (let i = 0; i < chaosEls.length; i++) {
    const { el } = chaosEls[i]
    el.style.transition = 'transform 0.09s ease'
    el.style.transform = CHAOS_TRANSFORMS[Math.floor(Math.random() * CHAOS_TRANSFORMS.length)]
    el.style.zIndex = Math.random() > 0.5 ? '999' : '-1'
  }
}

function triggerCssEaster(e) {
  if (document.body.classList.contains('css-chaos')) return
  const anchor = e?.currentTarget ?? null
  document.body.classList.add('css-chaos')
  clearTimeout(chaosTimer)
  buildChaosSet(anchor)
  let elapsed = 0
  const tick = () => {
    if (!document.body.classList.contains('css-chaos')) return
    // Use rAF so the style writes are batched with the next frame paint
    // instead of forcing a synchronous layout in the middle of the event loop.
    requestAnimationFrame(burstChaos)
    elapsed += 300
    if (elapsed < CHAOS_DURATION) chaosTimer = setTimeout(tick, 280 + Math.random() * 80)
  }
  tick()
  chaosTimer = setTimeout(() => {
    document.body.classList.remove('css-chaos')
    resetChaos()
  }, CHAOS_DURATION)
}

function clearCssEaster() {
  clearTimeout(chaosTimer)
  document.body.classList.remove('css-chaos')
  resetChaos()
}

// ─── Pre-build groups (module-level = stable) ─────────────────────────────────
const LANG_ITEMS = skills.find((g) => g.group === 'Languages')?.items ?? []
const FW_ITEMS = skills.find((g) => g.group === 'Frameworks')?.items ?? []
const TOOL_ITEMS = skills.find((g) => g.group === 'Tooling')?.items ?? []

// ─── Marquee strip — width measured in JS to keep the loop pixel-perfect ─────
// Why JS: the CSS `translateX(-50%)` target depends on the track's actual width,
// which can shift mid-animation when web-fonts (Orbitron) finish loading and
// labels reflow. Measuring the first set and translating by that exact pixel
// amount via a CSS variable removes the drift and the visible "reset" jump.
const IconStrip = ({ items, reverse = false }) => {
  const stripRef = useRef(null)
  const trackRef = useRef(null)
  const setRef = useRef(null)

  useEffect(() => {
    const trackEl = trackRef.current
    const setEl = setRef.current
    if (!trackEl || !setEl) return

    const update = () => {
      const w = setEl.getBoundingClientRect().width
      if (w > 0) trackEl.style.setProperty('--strip-w', `${w}px`)
    }

    update()

    // Re-measure when web-fonts finish loading (Orbitron / Tektur cause reflow)
    if (document.fonts?.ready) {
      document.fonts.ready.then(update).catch(() => {})
    }

    // Re-measure on viewport changes
    const ro = new ResizeObserver(update)
    ro.observe(setEl)
    return () => ro.disconnect()
  }, [items])

  // Pause the marquee + drop GPU compositing hints when the strip is offscreen
  // (horizontal-scroll layout keeps every section mounted, so without this the
  //  filters + animation keep burning CPU/GPU even while About isn't visible).
  useEffect(() => {
    const el = stripRef.current
    if (!el || typeof IntersectionObserver === 'undefined') {
      el?.classList.add('is-active')
      return undefined
    }
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        el.classList.toggle('is-active', e.isIntersecting)
      }),
      { root: null, threshold: 0 }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div className="icon-strip" data-reverse={reverse ? 'true' : 'false'} ref={stripRef}>
      <div className="icon-strip__track" ref={trackRef}>
        {[0, 1].map((copy) => (
          <div
            className="icon-strip__set"
            key={copy}
            ref={copy === 0 ? setRef : null}
            aria-hidden={copy === 1}
          >
            {items.map((item) => {
              const isCss = item.easter === 'css'
              return (
                <span
                  key={item.name}
                  className={`icon-strip__item${isCss ? ' easter-css' : ''}`}
                  onMouseEnter={isCss ? triggerCssEaster : undefined}
                  onMouseLeave={isCss ? clearCssEaster : undefined}
                  title={item.name}
                >
                  <img
                    src={item.icon}
                    alt=""
                    className="icon-strip__img"
                    decoding="async"
                    draggable={false}
                    width="28"
                    height="28"
                  />
                  <span className="icon-strip__label">{item.name}</span>
                </span>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

const About = () => {
  const { t } = useI18n()

  return (
    <section id="about" data-section className="section">
      <div className="section-inner">
        <Reveal as="div" stagger className="section-heading">
          <Reveal.Item as="p" className="eyebrow">{t('about.eyebrow')}</Reveal.Item>
          <Reveal.Item as="h2" className="about-title">{t('about.title')}</Reveal.Item>
          <Reveal.Item as="h3" className="about-name">{t('about.subtitle')}</Reveal.Item>
        </Reveal>

        <div className="about-body">
          <Reveal as="div" stagger className="about-content">
            <Reveal.Item as="p" className="about-bio">{t('about.bio')}</Reveal.Item>

            <Reveal.Item as="div" className="skills-loop-group">
              <h4>{t('about.languages')}</h4>
              <IconStrip items={LANG_ITEMS} />
            </Reveal.Item>

            <Reveal.Item as="div" className="skills-loop-group">
              <h4>{t('about.frameworks')}</h4>
              <IconStrip items={FW_ITEMS} reverse />
            </Reveal.Item>

            <Reveal.Item as="div" className="skills-loop-group">
              <h4>Tooling :</h4>
              <IconStrip items={TOOL_ITEMS} />
            </Reveal.Item>
          </Reveal>

          <GlowCard
            as={motion.aside}
            className="about-cert"
            intensity={0.12}
            size={280}
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-12% 0px' }}
            transition={{ duration: 0.7, delay: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <h4>{t('about.certifications.title')}</h4>
            <p>{t('about.certifications.description')}</p>
            <a
              href="/assets/documents/opquast_certificate_2026.pdf"
              download
              className="about-cert-download cursor-target"
            >
              <span className="icon" aria-hidden="true">⤓</span>
              {t('about.certifications.download')}
            </a>
          </GlowCard>
        </div>
      </div>
    </section>
  )
}

export default About
