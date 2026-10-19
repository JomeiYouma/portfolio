/** One small line icon per theme: a tube of neon, two inks, a rotunda, a fold */
export const ThemeIcon = ({ id, size = 14 }) => {
  const common = {
    width: size,
    height: size,
    viewBox: '0 0 16 16',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.6,
    strokeLinecap: 'round',
    strokeLinejoin: 'round',
    'aria-hidden': true,
  }
  switch (id) {
    case 'neon':
      return (
        <svg {...common}>
          <path d="M9.5 1.5 4 9h4l-1.5 5.5L13 7H9l.5-5.5z" />
        </svg>
      )
    case 'riso':
      return (
        <svg {...common}>
          <circle cx="6" cy="8" r="4.3" />
          <circle cx="10" cy="8" r="4.3" />
        </svg>
      )
    case 'galerie':
      return (
        <svg {...common}>
          <path d="M2 14V8a6 6 0 0 1 12 0v6" />
          <path d="M5.5 14v-5a2.5 2.5 0 0 1 5 0v5" />
          <path d="M1.5 14h13" />
        </svg>
      )
    case 'origami':
      return (
        <svg {...common}>
          <path d="M2 13.5 8 2l6 11.5H2z" />
          <path d="M8 2v11.5" />
          <path d="M2 13.5l6-3.5 6 3.5" />
        </svg>
      )
    default:
      return (
        <svg {...common}>
          <circle cx="8" cy="8" r="5" />
        </svg>
      )
  }
}
