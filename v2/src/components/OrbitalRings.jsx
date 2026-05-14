import { useEffect, useRef } from 'react'
import './OrbitalRings.css'

/**
 * OrbitalRings — animated 3D concentric ring system.
 * Tracks mouse → tilts via CSS custom properties --rx / --ry.
 * Pass `className` to override position & size from outside.
 */
const OrbitalRings = ({ className = '' }) => {
    const containerRef = useRef(null)
    const targetRef = useRef({ x: 0, y: 0 })
    const currentRef = useRef({ x: 0, y: 0 })
    const rafRef = useRef(null)

    useEffect(() => {
        const onMove = (e) => {
            const cx = window.innerWidth / 2
            const cy = window.innerHeight / 2
            targetRef.current.x = ((e.clientX - cx) / cx) * 16
            targetRef.current.y = ((e.clientY - cy) / cy) * -16
        }

        const lerp = (a, b, t) => a + (b - a) * t

        const tick = () => {
            currentRef.current.x = lerp(currentRef.current.x, targetRef.current.x, 0.06)
            currentRef.current.y = lerp(currentRef.current.y, targetRef.current.y, 0.06)

            if (containerRef.current) {
                containerRef.current.style.setProperty('--rx', `${currentRef.current.y.toFixed(2)}deg`)
                containerRef.current.style.setProperty('--ry', `${currentRef.current.x.toFixed(2)}deg`)
            }

            rafRef.current = requestAnimationFrame(tick)
        }

        // Only run while the rings are on-screen. Without this the RAF tick +
        // mousemove handler keep burning CPU forever even when the Hero is not
        // visible (horizontal-scroll layout keeps every section mounted).
        const el = containerRef.current
        let isVisible = false
        const start = () => {
            if (rafRef.current || !isVisible) return
            window.addEventListener('mousemove', onMove, { passive: true })
            rafRef.current = requestAnimationFrame(tick)
        }
        const stop = () => {
            window.removeEventListener('mousemove', onMove)
            if (rafRef.current) {
                cancelAnimationFrame(rafRef.current)
                rafRef.current = null
            }
        }

        let io = null
        if (el && typeof IntersectionObserver !== 'undefined') {
            io = new IntersectionObserver(
                (entries) => entries.forEach((e) => {
                    const next = e.isIntersecting
                    if (next === isVisible) return
                    isVisible = next
                    if (isVisible) start()
                    else stop()
                }),
                { root: null, threshold: 0 }
            )
            io.observe(el)
        } else {
            isVisible = true
            start()
        }

        return () => {
            io?.disconnect()
            stop()
        }
    }, [])

    return (
        <div
            className={`orbital-rings${className ? ` ${className}` : ''}`}
            ref={containerRef}
            aria-hidden="true"
        >
            <div className="or-scene">
                <div className="or-ring or-ring--1" />
                <div className="or-ring or-ring--2" />
                <div className="or-ring or-ring--3" />
                <div className="or-ring or-ring--4" />
                <div className="or-ring or-ring--5" />

                <div className="or-particle or-particle--1" />
                <div className="or-particle or-particle--2" />
                <div className="or-particle or-particle--3" />

                <div className="or-tri or-tri--1" />
                <div className="or-tri or-tri--2" />

                <div className="or-core">
                    <div className="or-core-inner" />
                </div>
            </div>
        </div>
    )
}

export default OrbitalRings