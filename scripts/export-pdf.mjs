// Render the built site to a US Letter PDF with the print stylesheet.
// Usage: npm run build && npm run pdf   (output: exports/flow-of-water.pdf)
import { mkdir } from 'node:fs/promises'
import { resolve } from 'node:path'
import { preview } from 'vite'
import { chromium } from 'playwright-core'

const out = resolve(process.argv[2] ?? 'exports/flow-of-water.pdf')
const port = 4317

const server = await preview({ preview: { port, host: '127.0.0.1', strictPort: true }, logLevel: 'warn' })
let browser
try {
  // Prefer the locally installed Google Chrome; fall back to a Playwright-managed Chromium.
  browser = await chromium.launch({ channel: 'chrome' }).catch(() => chromium.launch())
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } })
  await page.emulateMedia({ reducedMotion: 'reduce' })
  await page.goto(`http://127.0.0.1:${port}/flow-of-water/`, { waitUntil: 'networkidle' })

  // Make sure no lazy image is left unloaded and every webfont is ready.
  await page.evaluate(async () => {
    for (const img of document.images) img.loading = 'eager'
    await Promise.all(
      [...document.images].map((img) =>
        img.complete && img.naturalWidth
          ? null
          : new Promise((r) => {
              img.addEventListener('load', r, { once: true })
              img.addEventListener('error', r, { once: true })
            }),
      ),
    )
    await document.fonts.ready
  })
  const missing = await page.evaluate(() => [...document.images].filter((i) => !i.naturalWidth).map((i) => i.src))
  if (missing.length) console.warn('Images that failed to load:', missing)

  await mkdir(resolve(out, '..'), { recursive: true })
  await page.pdf({ path: out, format: 'Letter', printBackground: true, preferCSSPageSize: true })
  console.log(`PDF written to ${out}`)
} finally {
  await browser?.close()
  server.httpServer.close()
}
