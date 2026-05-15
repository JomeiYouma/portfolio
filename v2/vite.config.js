import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
// Base path matches the GitHub Pages project URL: jomeiyouma.github.io/portfolio/
export default defineConfig({
  base: '/portfolio/',
  plugins: [react()],
})
