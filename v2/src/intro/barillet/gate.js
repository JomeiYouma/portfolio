// Whether the opening sequence plays on this visit. It never plays for the
// prerender (Puppeteer sets navigator.webdriver), for a deep link to a
// section, or twice in a session; `?intro=1` forces it, `?intro=0` skips it.

export const INTRO_KEY = 'portfolio-intro'

const flag = () => {
  if (typeof window === 'undefined') return null
  return new URLSearchParams(window.location.search).get('intro')
}

export const introForced = () => flag() === '1'

export const shouldPlayIntro = () => {
  if (typeof window === 'undefined') return false
  const f = flag()
  if (f === '1') return true
  if (f === '0') return false
  if (navigator.webdriver) return false
  if (window.location.hash) return false
  try {
    if (sessionStorage.getItem(INTRO_KEY)) return false
  } catch {
    // Storage blocked: play it, there is no way to know
  }
  return true
}

export const markIntroDone = () => {
  try {
    sessionStorage.setItem(INTRO_KEY, '1')
  } catch {
    // Storage blocked: the sequence may play again next time, which is fine
  }
}
