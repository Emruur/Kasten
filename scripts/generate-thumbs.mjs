// Generates grid-sized thumbnails for every image in public/Artworks,
// mirrored under public/Thumbs/Artworks. Grid cells render at most
// ~250 CSS px wide, so 512px covers 2x displays.
// Run with: npm run generate:thumbs
import { readdirSync, mkdirSync, statSync } from 'node:fs'
import { join, relative, extname, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const THUMB_WIDTH = 512

const root = fileURLToPath(new URL('..', import.meta.url))
const artworksDir = join(root, 'public', 'Artworks')
const thumbsDir = join(root, 'public', 'Thumbs', 'Artworks')

const BROWSER_SAFE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'])

const files = readdirSync(artworksDir, { recursive: true, withFileTypes: true }).filter(
  (entry) => entry.isFile() && BROWSER_SAFE.has(extname(entry.name).toLowerCase()),
)

let written = 0
let skipped = 0
for (const entry of files) {
  const src = join(entry.parentPath, entry.name)
  const out = join(thumbsDir, relative(artworksDir, src))
  try {
    if (statSync(out).mtimeMs >= statSync(src).mtimeMs) {
      skipped++
      continue
    }
  } catch {
    // No thumbnail yet.
  }
  mkdirSync(dirname(out), { recursive: true })
  await sharp(src).rotate().resize({ width: THUMB_WIDTH }).toFile(out)
  written++
}
console.log(`Thumbnails: ${written} written, ${skipped} up to date, in ${relative(root, thumbsDir)}`)
