import './loader.css'

/**
 * The wait before the sequence: the dark of the room, the name, a thin line
 * that fills. `progress` is 0..1, or undefined for an endless sweep (while
 * the sequence's own code is still downloading).
 */
const IntroLoader = ({ label, progress, leaving = false }) => (
  <div className={`bar-loader ${leaving ? 'is-leaving' : ''}`} role="status" aria-live="polite">
    <p className="bar-loader__name">Raphaël Madoré</p>
    <div className={`bar-loader__track ${progress === undefined ? 'is-endless' : ''}`}>
      <span className="bar-loader__fill" style={progress === undefined ? undefined : { transform: `scaleX(${progress})` }} />
    </div>
    <p className="bar-loader__label">{label}</p>
  </div>
)

export default IntroLoader
