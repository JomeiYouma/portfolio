import './SkipLink.css'

/**
 * Visually hidden until focused. Required by Opquast / WCAG so keyboard users
 * can bypass the navigation and land directly on the main content.
 */
const SkipLink = ({ targetId = 'main-content', label }) => (
  <a className="skip-link" href={`#${targetId}`}>
    {label}
  </a>
)

export default SkipLink
