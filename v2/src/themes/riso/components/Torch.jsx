import { useEffect, useRef } from 'react'
import { holeTexture } from '../dither'

// Light kept around the element, then the width of the dithered edge (px)
const MARGIN = 56
const EDGE = 150

/**
 * Torch: hovering or focusing a [data-rz-torch] element puts the rest of the
 * page in the dark, through a hole whose edge thins out into dither.
 */
const Torch = ({ rootRef }) => {
  const layerRef = useRef(null)

  useEffect(() => {
    const root = rootRef.current
    const layer = layerRef.current
    const stillMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
    let target = null

    const place = () => {
      const rect = target.getBoundingClientRect()
      const { image, size } = holeTexture(Math.hypot(rect.width, rect.height) / 2 + MARGIN, EDGE)
      layer.style.setProperty('--rz-torch-hole', image)
      layer.style.setProperty('--rz-torch-size', `${size}px`)
      layer.style.setProperty('--rz-torch-x', `${Math.round(rect.left + rect.width / 2)}px`)
      layer.style.setProperty('--rz-torch-y', `${Math.round(rect.top + rect.height / 2)}px`)
    }

    const light = (el) => {
      // A page going dark is neither reduced motion nor high contrast
      if (stillMotion.matches || document.body.classList.contains('aaa-contrast')) return
      target = el
      place()
      layer.classList.add('is-on')
    }
    const dim = () => {
      target = null
      layer.classList.remove('is-on')
    }

    const onOver = (e) => {
      if (e.pointerType === 'touch') return
      const el = e.target.closest('[data-rz-torch]')
      if (el && el !== target) light(el)
    }
    const onOut = (e) => {
      if (target && !target.contains(e.relatedTarget)) dim()
    }
    const onFocus = (e) => {
      const el = e.target.closest('[data-rz-torch]')
      if (el?.matches(':focus-visible')) light(el)
    }
    const follow = () => { if (target) place() }

    root.addEventListener('pointerover', onOver)
    root.addEventListener('pointerout', onOut)
    root.addEventListener('focusin', onFocus)
    root.addEventListener('focusout', dim)
    window.addEventListener('scroll', follow, { passive: true })
    window.addEventListener('resize', follow)
    window.addEventListener('blur', dim)
    return () => {
      root.removeEventListener('pointerover', onOver)
      root.removeEventListener('pointerout', onOut)
      root.removeEventListener('focusin', onFocus)
      root.removeEventListener('focusout', dim)
      window.removeEventListener('scroll', follow)
      window.removeEventListener('resize', follow)
      window.removeEventListener('blur', dim)
    }
  }, [rootRef])

  return <div ref={layerRef} className="rz-torch" aria-hidden="true" />
}

export default Torch
