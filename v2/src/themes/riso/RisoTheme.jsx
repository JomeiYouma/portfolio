import { useEffect, useRef, useState } from 'react'
import '@fontsource-variable/anybody/wdth.css'
import './riso.css'
import SkipLink from '../../components/SkipLink'
import Masthead from './components/Masthead'
import ScrollRail from './components/ScrollRail'
import Torch from './components/Torch'
import Hero from './sections/Hero'
import About from './sections/About'
import Projects from './sections/Projects'
import Games from './sections/Games'
import Testimonials from './sections/Testimonials'
import Services from './sections/Services'
import Contact from './sections/Contact'
import sections from '../../data/sections.json'
import { useI18n } from '../../hooks/useI18n'
import { applyDitherVars } from './dither'
import { RISO, RISO_AAA } from './palette'

const number = (id) => String(sections.findIndex((s) => s.id === id)).padStart(2, '0')

/**
 * Riso theme: two inks on paper, ordered dithering everywhere, and one long
 * page scrolled top to bottom.
 */
const RisoTheme = ({ lang, contrastActive, onOpenQuote, onOpenLegal, controlsProps }) => {
  const { t } = useI18n()
  const rootRef = useRef(null)
  const [activeId, setActiveId] = useState(sections[0].id)
  const inks = contrastActive ? RISO_AAA : RISO

  useEffect(() => {
    applyDitherVars(rootRef.current)
    // The neon theme may leave the document scrolled (its mobile layout)
    window.scrollTo(0, 0)
  }, [])

  // The section crossing the middle of the viewport is the current one
  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => { if (entry.isIntersecting) setActiveId(entry.target.id) }),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    sections.forEach((s) => {
      const el = document.getElementById(s.id)
      if (el) io.observe(el)
    })
    return () => io.disconnect()
  }, [])

  // One observer prints every [data-rz-reveal] block in as it enters the page
  useEffect(() => {
    const root = rootRef.current
    const io = new IntersectionObserver(
      (entries) => entries.forEach((entry) => {
        if (!entry.isIntersecting) return
        entry.target.classList.add('is-in')
        io.unobserve(entry.target)
      }),
      { threshold: 0.05 },
    )
    root.querySelectorAll('[data-rz-reveal]').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])

  const navSections = sections.map((s) => ({ ...s, label: lang === 'fr' ? s.labelFr : s.label }))

  return (
    <div className="rz-app" ref={rootRef}>
      <SkipLink targetId="main-content" label={t('accessibility.skipToContent')} />
      <Masthead sections={navSections} activeId={activeId} controlsProps={controlsProps} />
      <ScrollRail />
      <main id="main-content" className="rz-main" tabIndex={-1}>
        <Hero inks={inks} onOpenQuote={onOpenQuote} />
        <About number={number('about')} />
        <Projects number={number('projects')} lang={lang} />
        <Games number={number('games')} lang={lang} />
        <Testimonials number={number('testimonials')} />
        <Services number={number('services')} onOpenQuote={onOpenQuote} />
        <Contact number={number('contact')} lang={lang} onOpenLegal={onOpenLegal} />
      </main>
      <Torch rootRef={rootRef} />
    </div>
  )
}

export default RisoTheme
