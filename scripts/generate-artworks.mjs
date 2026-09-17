// Scans public/Artworks for browser-compatible images and writes
// src/data/artworks.json with their public URLs.
// Run with: npm run generate:artworks
import { readdirSync, writeFileSync } from 'node:fs'
import { join, relative, extname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const artworksDir = join(root, 'public', 'Artworks')
const outFile = join(root, 'src', 'data', 'artworks.json')

const BROWSER_SAFE = new Set(['.jpg', '.jpeg', '.png', '.webp', '.avif', '.gif'])

const urls = readdirSync(artworksDir, { recursive: true, withFileTypes: true })
  .filter((entry) => entry.isFile() && BROWSER_SAFE.has(extname(entry.name).toLowerCase()))
  .map((entry) => {
    const path = relative(join(root, 'public'), join(entry.parentPath, entry.name))
    return encodeURI('/' + path.split('\\').join('/'))
  })
  .sort()

writeFileSync(outFile, JSON.stringify(urls, null, 2) + '\n')
console.log(`Wrote ${urls.length} artwork URLs to ${relative(root, outFile)}`)
