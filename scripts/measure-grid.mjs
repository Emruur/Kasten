import { chromium } from 'playwright'

const sizes = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'tablet', width: 1024, height: 768 },
  { name: 'mobile', width: 390, height: 844 },
]

const browser = await chromium.launch({ channel: 'chrome' })
for (const { name, width, height } of sizes) {
  const page = await browser.newPage({ viewport: { width, height } })
  await page.goto('http://localhost:5173', { waitUntil: 'networkidle' })
  await page.waitForSelector('.grid > *')
  const m = await page.evaluate(() => {
    const grid = document.querySelector('.grid')
    const logo = document.querySelector('.logo-card')
    const g = grid.getBoundingClientRect()
    const l = logo.getBoundingClientRect()
    const style = getComputedStyle(grid)
    return {
      cols: style.gridTemplateColumns.split(' ').length,
      cardW: parseFloat(style.gridTemplateColumns.split(' ')[0]),
      cards: grid.children.length,
      bleed: {
        left: -g.left,
        right: g.right - innerWidth,
        top: -g.top,
        bottom: g.bottom - innerHeight,
      },
      logoFullyVisible: l.left >= 0 && l.top >= 0 && l.right <= innerWidth && l.bottom <= innerHeight,
      logoRect: { left: Math.round(l.left), top: Math.round(l.top), right: Math.round(l.right), bottom: Math.round(l.bottom) },
    }
  })
  console.log(name, JSON.stringify(m, null, 1))
  await page.close()
}
await browser.close()
