import { LENGTH } from './track'
import { useTile, WOOD_TILE } from './tiles'

// The desk the map lies on: a plank floor far wider and longer than the map,
// its grain running along the journey, fading into the fog at the edges

const WIDTH = 80
const SPAN = LENGTH + 80
// Units of desk covered by one tile
const TILE = 4

const Desk = ({ color, textured }) => {
  const wood = useTile(WOOD_TILE, WIDTH / TILE, SPAN / TILE)
  const map = textured ? wood : null
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, -0.03, -LENGTH / 2]} receiveShadow>
      <planeGeometry args={[WIDTH, SPAN]} />
      {/* A new material once the tile is there: a map added later needs a recompile */}
      <meshStandardMaterial key={map ? 'wood' : 'plain'} color={color} map={map} roughness={0.85} />
    </mesh>
  )
}

export default Desk
