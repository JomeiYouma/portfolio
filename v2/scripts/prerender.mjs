import http from 'node:http'
import { readFile, stat, writeFile, access } from 'node:fs/promises'
import { join, extname, resolve } from 'node:path'
import puppeteer from 'puppeteer-core'

const DIST = resolve('dist')
const BASE = '/portfolio/'
const PORT = 4178

const CANDIDATE_CHROMES = [
  process.env.CHROME_PATH,
  process.env.PUPPETEER_EXECUTABLE_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  '/usr/bin/google-chrome',
  '/usr/bin/google-chrome-stable',
  '/usr/bin/chromium-browser',
  '/usr/bin/chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
].filter(Boolean)

const resolveChrome = async () => {
  for (const path of CANDIDATE_CHROMES) {
    try {
      await access(path)
      return path
    } catch {}
  }
  throw new Error(`No Chrome/Chromium binary found. Set CHROME_PATH env var.`)
}

const CHROME = await resolveChrome()
console.log(`Using browser: ${CHROME}`)

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.js':   'application/javascript; charset=utf-8',
  '.mjs':  'application/javascript; charset=utf-8',
  '.css':  'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg':  'image/svg+xml',
  '.png':  'image/png',
  '.webp': 'image/webp',
  '.ico':  'image/x-icon',
  '.woff2':'font/woff2',
  '.woff': 'font/woff',
  '.ttf':  'font/ttf',
  '.pdf':  'application/pdf',
}

const server = http.createServer(async (req, res) => {
  try {
    let urlPath = decodeURIComponent((req.url || '/').split('?')[0])
    if (urlPath.startsWith(BASE)) urlPath = urlPath.slice(BASE.length - 1)
    if (urlPath === '/' || urlPath === '') urlPath = '/index.html'
    const filePath = join(DIST, urlPath)
    const s = await stat(filePath)
    const final = s.isDirectory() ? join(filePath, 'index.html') : filePath
    const data = await readFile(final)
    res.setHeader('Content-Type', MIME[extname(final).toLowerCase()] || 'application/octet-stream')
    res.end(data)
  } catch {
    res.statusCode = 404
    res.end('Not found')
  }
})

await new Promise((r) => server.listen(PORT, r))
console.log(`Static server on http://localhost:${PORT}${BASE}`)

const browser = await puppeteer.launch({
  executablePath: CHROME,
  headless: 'new',
  args: ['--no-sandbox', '--disable-setuid-sandbox'],
})

try {
  const page = await browser.newPage()
  await page.setViewport({ width: 1440, height: 900 })
  page.on('console', (msg) => {
    if (msg.type() === 'error') console.error('[browser]', msg.text())
  })

  const url = `http://localhost:${PORT}${BASE}`
  console.log(`Loading ${url}`)
  await page.goto(url, { waitUntil: 'networkidle0', timeout: 30000 })

  await page.waitForSelector('main#main-content h1.sr-only', { timeout: 10000 })
  await page.evaluate(() => new Promise((r) => setTimeout(r, 250)))

  const html = await page.content()
  await writeFile(join(DIST, 'index.html'), html, 'utf8')
  console.log(`Wrote prerendered HTML to dist/index.html (${(html.length / 1024).toFixed(1)} KB)`)
} finally {
  await browser.close()
  server.close()
}
