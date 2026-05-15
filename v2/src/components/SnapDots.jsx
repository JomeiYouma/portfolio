import { useEffect, useState } from 'react'
import { scrollToSection } from '../animations/scroll'

/**
 * Vertical snap-dot indicator on the right side.
 * Updates via the 'sectionChange' custom event dispatched from scroll.js.
 */
const SnapDots = ({ sections }) => {
    const [activeIndex, setActiveIndex] = useState(0)

    useEffect(() => {
        const handler = (e) => setActiveIndex(e.detail.index)
        window.addEventListener('sectionChange', handler)
        return () => window.removeEventListener('sectionChange', handler)
    }, [])

    // Hide on mobile
    const [isMobile, setIsMobile] = useState(false)
    useEffect(() => {
        const check = () => setIsMobile(window.innerWidth <= 768)
        check()
        window.addEventListener('resize', check)
        return () => window.removeEventListener('resize', check)
    }, [])

    if (isMobile) return null

    return (
        <nav className="snap-dots" aria-label="Section navigation">
            {sections.map((section, i) => (
                <button
                    key={section.id}
                    className={`snap-dot ${i === activeIndex ? 'active' : ''}`}
                    onClick={() => scrollToSection(section.id)}
                    aria-label={`Go to ${section.label}`}
                    title={section.label}
                    type="button"
                />
            ))}
        </nav>
    )
}

export default SnapDots