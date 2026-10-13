import { useCallback, useSyncExternalStore } from 'react'

export const useMediaQuery = (query) => {
  const subscribe = useCallback((onChange) => {
    const mq = window.matchMedia(query)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [query])
  return useSyncExternalStore(subscribe, () => window.matchMedia(query).matches)
}

const subscribeResize = (onChange) => {
  window.addEventListener('resize', onChange)
  return () => window.removeEventListener('resize', onChange)
}

export const useViewportWidth = () => useSyncExternalStore(subscribeResize, () => window.innerWidth)
