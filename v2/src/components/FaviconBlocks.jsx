import { useMemo } from 'react'
import './FaviconBlocks.css'

/**
 * FaviconBlocks — decomposes an image into an N×N grid of cells. On hover,
 * each cell flips in 3D with a delay derived from its (row + col) diagonal,
 * producing a cascading wave that reveals the image. Background stays
 * transparent so the effect blends with the nav.
 */
const FaviconBlocks = ({
  src,
  alt = '',
  size = 28,
  grid = 12,
  className = '',
}) => {
  const cells = useMemo(() => {
    const arr = []
    const denom = grid - 1 || 1
    for (let r = 0; r < grid; r++) {
      for (let c = 0; c < grid; c++) {
        arr.push({
          key: `${r}-${c}`,
          // background-position aligns this cell's window onto the source image
          bx: (c / denom) * 100,
          by: (r / denom) * 100,
          // Diagonal wave delay (reads top-left → bottom-right)
          delay: (r + c) * 28,
        })
      }
    }
    return arr
  }, [grid])

  const style = {
    '--fb-size': `${size}px`,
    '--fb-grid': grid,
    '--fb-img': `url("${src}")`,
  }

  return (
    <span
      className={`favicon-blocks${className ? ` ${className}` : ''}`}
      style={style}
      role="img"
      aria-label={alt}
    >
      {cells.map(({ key, bx, by, delay }) => (
        <span
          key={key}
          className="favicon-blocks__cell"
          style={{
            backgroundPosition: `${bx}% ${by}%`,
            transitionDelay: `${delay}ms`,
          }}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

export default FaviconBlocks
