// Prefix runtime asset paths with the Vite base.
// At build time BASE_URL becomes '/portfolio/'; in dev it's '/'.
// Use this for any path that is concatenated/fetched at runtime (fetch(), <img src>, <a href>),
// since Vite only rewrites paths it sees statically in HTML/CSS/import statements.
export const asset = (path = '') => `${import.meta.env.BASE_URL}${String(path).replace(/^\/+/, '')}`
