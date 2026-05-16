import { readdir, stat, unlink } from 'node:fs/promises'
import { join, extname, basename } from 'node:path'
import sharp from 'sharp'

const IMAGES_DIR = new URL('../public/assets/images/', import.meta.url)
const KEEP_PNG = new Set(['og-image.png'])
const QUALITY = 80

const files = await readdir(IMAGES_DIR)
const pngs = files.filter((f) => extname(f).toLowerCase() === '.png' && !KEEP_PNG.has(f))

if (pngs.length === 0) {
  console.log('No PNGs to convert.')
  process.exit(0)
}

let totalBefore = 0
let totalAfter = 0

for (const file of pngs) {
  const src = join(IMAGES_DIR.pathname.replace(/^\//, ''), file)
  const dst = src.replace(/\.png$/i, '.webp')
  const before = (await stat(src)).size
  await sharp(src).webp({ quality: QUALITY }).toFile(dst)
  const after = (await stat(dst)).size
  await unlink(src)
  totalBefore += before
  totalAfter += after
  const saved = ((1 - after / before) * 100).toFixed(0)
  console.log(`${basename(file).padEnd(28)} ${(before / 1024).toFixed(0)}KB -> ${(after / 1024).toFixed(0)}KB  (-${saved}%)`)
}

const totalSaved = ((1 - totalAfter / totalBefore) * 100).toFixed(0)
console.log(`\nTotal: ${(totalBefore / 1024).toFixed(0)}KB -> ${(totalAfter / 1024).toFixed(0)}KB  (-${totalSaved}%)`)
