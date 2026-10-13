// Ordered-dither textures, generated once on a canvas and handed to CSS as
// mask images. A mask keeps them ink-agnostic: the element's background colour
// is the ink, the mask is the screen.

// 8×8 Bayer threshold matrix
const BAYER8 = [
  0, 32, 8, 40, 2, 34, 10, 42,
  48, 16, 56, 24, 50, 18, 58, 26,
  12, 44, 4, 36, 14, 46, 6, 38,
  60, 28, 52, 20, 62, 30, 54, 22,
  3, 35, 11, 43, 1, 33, 9, 41,
  51, 19, 59, 27, 49, 17, 57, 25,
  15, 47, 7, 39, 13, 45, 5, 37,
  63, 31, 55, 23, 61, 29, 53, 21,
]

// One dither cell is drawn as CELL×CELL canvas pixels, so the textures are used
// at 1:1 and never resampled into blur.
export const CELL = 3

const draw = (cols, rows, coverageAt) => {
  const canvas = document.createElement('canvas')
  canvas.width = cols * CELL
  canvas.height = rows * CELL
  const ctx = canvas.getContext('2d')
  ctx.fillStyle = '#000'
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const threshold = (BAYER8[(y % 8) * 8 + (x % 8)] + 0.5) / 64
      if (coverageAt(x, y) > threshold) ctx.fillRect(x * CELL, y * CELL, CELL, CELL)
    }
  }
  return `url(${canvas.toDataURL('image/png')})`
}

// Uniform screen at a given ink coverage (0–1)
const tile = (coverage) => draw(8, 8, () => coverage)

// Screen that runs from solid ink (top) to bare paper (bottom) over `length` cells
const ramp = (length) => draw(8, length, (_, y) => 1 - y / (length - 1))

export const RAMP_CELLS = 40

export const applyDitherVars = (el) => {
  if (!el) return
  const vars = {
    '--rz-d25': tile(0.25),
    '--rz-d50': tile(0.5),
    '--rz-ramp-down': ramp(RAMP_CELLS),
    '--rz-tile': `${8 * CELL}px`,
    '--rz-ramp-len': `${RAMP_CELLS * CELL}px`,
  }
  Object.entries(vars).forEach(([name, value]) => el.style.setProperty(name, value))
}
