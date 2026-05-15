// Prefix runtime asset paths with the Vite base.
// At build time BASE_URL becomes '/portfolio/'; in dev it's '/'.
// External URLs (http(s), data:, blob:, protocol-relative) pass through untouched.
export const asset = (path = '') => {
  const s = String(path)
  if (/^(?:[a-z]+:)?\/\//i.test(s) || s.startsWith('data:') || s.startsWith('blob:')) return s
  return `${import.meta.env.BASE_URL}${s.replace(/^\/+/, '')}`
}
