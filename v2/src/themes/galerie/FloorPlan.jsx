import { BAYS, STEP } from './room'

const RADIUS = 40
// Corner of the polygon between wall i-1 and wall i; wall 0 is at the top
const corner = (i) => {
  const angle = (i - 0.5) * STEP
  return [RADIUS * Math.sin(angle), -RADIUS * Math.cos(angle)]
}
const WALLS = Array.from({ length: BAYS }, (_, i) => ({ from: corner(i), to: corner(i + 1) }))

/**
 * Plan of the rotunda seen from above: which wall the visitor is facing, and a
 * shortcut to any other. A pointer convenience only (aria-hidden): the room
 * list in the top bar is the accessible navigation.
 */
const FloorPlan = ({ room, onSelect }) => (
  <svg className="ga-floorplan" viewBox="-58 -58 116 116" aria-hidden="true">
    {/* What the visitor sees: from the centre to both ends of the facing wall */}
    <polygon className="ga-floorplan-view" points={`0,0 ${WALLS[room].from.join(',')} ${WALLS[room].to.join(',')}`} />
    {WALLS.map((wall, i) => {
      const labelAngle = i * STEP
      return (
        <g key={i} className={i === room ? 'is-current' : undefined} onClick={() => onSelect(i)}>
          <line className="ga-floorplan-wall" x1={wall.from[0]} y1={wall.from[1]} x2={wall.to[0]} y2={wall.to[1]} />
          {/* Wider invisible stroke: an easier target than the wall itself */}
          <line className="ga-floorplan-hit" x1={wall.from[0]} y1={wall.from[1]} x2={wall.to[0]} y2={wall.to[1]} />
          <text x={50 * Math.sin(labelAngle)} y={-50 * Math.cos(labelAngle)} textAnchor="middle" dominantBaseline="central">
            {i}
          </text>
        </g>
      )
    })}
    <circle className="ga-floorplan-you" r="2.6" />
  </svg>
)

export default FloorPlan
