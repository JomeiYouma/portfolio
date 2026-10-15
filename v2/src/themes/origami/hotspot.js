import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'

// Hand cursor over what can be clicked in the scene (styled in origami.css)
export const setPointing = (pointing) => document.documentElement.classList.toggle('ori-pointing', pointing)

/**
 * What every clickable thing in the scene shares: the hand cursor and the
 * label under the pointer, a hover value eased 0 → 1 that the owner animates
 * with (`stateRef.current.hover`, `.active` while it still moves), letting go
 * when the page scrolls under a still pointer, and the click. Returns the R3F
 * handlers to spread on the group that carries the hit box.
 */
export const useHotspot = ({ store, label, coarse, onHover, onClick }) => {
  const invalidate = useThree((state) => state.invalidate)
  const stateRef = useRef({ hovered: false, hover: 0, active: false, target: null })

  useEffect(() => {
    const state = stateRef.current
    return () => { if (state.hovered) setPointing(false) }
  }, [])

  useFrame(() => {
    const state = stateRef.current
    // Nothing tells the scene the pointer left when the page moved under it
    if (state.hovered && state.target !== null && state.target !== store.target) {
      state.hovered = false
      setPointing(false)
      onHover(null)
    }
    state.target = store.target
    const goal = state.hovered ? 1 : 0
    state.active = Math.abs(goal - state.hover) > 1e-3
    if (state.active) {
      state.hover += (goal - state.hover) * (1 - Math.exp(-store.delta * 10))
      invalidate()
    }
  })

  const handlers = useMemo(() => {
    const hover = (on) => (e) => {
      if (coarse) return
      e.stopPropagation()
      stateRef.current.hovered = on
      setPointing(on)
      onHover(on ? label : null, e.clientX, e.clientY)
      store.touch()
    }
    return {
      onPointerOver: hover(true),
      onPointerOut: hover(false),
      onPointerMove: (e) => {
        if (!coarse && stateRef.current.hovered) onHover(label, e.clientX, e.clientY)
      },
      onClick: (e) => {
        e.stopPropagation()
        onClick()
      },
    }
  }, [store, label, coarse, onHover, onClick])

  return { stateRef, handlers }
}
