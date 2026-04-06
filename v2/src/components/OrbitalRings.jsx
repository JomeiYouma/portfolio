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

        window.addEventListener('mousemove', onMove, { passive: true })

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

        rafRef.current = requestAnimationFrame(tick)

        return () => {
            window.removeEventListener('mousemove', onMove)
            cancelAnimationFrame(rafRef.current)
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