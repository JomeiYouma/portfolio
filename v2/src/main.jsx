import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './utils/perf'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// The inline boot screen of index.html has done its job once React has painted
requestAnimationFrame(() => requestAnimationFrame(() => document.getElementById('boot')?.remove()))
