// 產生「萬聖登記戰情室」的打碼截圖，給第 20 案內文與首頁精選卡使用。
//
// 來源是另一個專案在本機產生的戰情室頁面，裡面是真實的營運數字，所以這支只在
// 本機手動跑，不掛在 npm run build 上：
//
//   node scripts/capture-warroom-masked.mjs <戰情室活動頁.html>
//
// 打碼方式：
//   - 純數字的欄位先把每個數字換成亂數，再加模糊。圖裡因此不存在原始數字，
//     不是「蓋住」而已，放大或反模糊都還原不回來。
//   - 句子裡夾帶的數字（預算、張數、組數）換成＊。
//   - 日期、時間與素材版本號不是營運數字，保留。
// 跑完會印出打碼數量與「仍含數字的欄位」，後者應該只剩日期。
import { chromium } from 'playwright'
import { mkdir } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const SLUG = '20-campaign-measurement'
const src = process.argv[2]
if (!src) {
  console.error('用法： node scripts/capture-warroom-masked.mjs <戰情室活動頁.html>')
  process.exit(1)
}

const mask = () => {
  const sec = document.querySelector('#halloween-overview')
  const first = sec.querySelector('details')
  if (first) first.open = true
  // 只保留前後沒有黏著其他數字的日期、時間與版本號；「12/40 組」這種分數不算日期。
  const keep = /(?<!\d)\d{4}[-/]\d{1,2}[-/]\d{1,2}(?!\d)|(?<![\d:])\d{1,2}:\d{2}(?![\d:])|(?<![\d/])\d{1,2}\/\d{1,2}(?![\d/])(?!\s*[組張人份次筆])|\bV\d{1,3}\b/g
  const pureNumber = /^(NT\$\s*)?[\d,.\s%]+$/
  let blurred = 0
  let starred = 0
  const walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT)
  const nodes = []
  while (walker.nextNode()) nodes.push(walker.currentNode)
  for (const node of nodes) {
    const text = node.nodeValue
    if (!/\d/.test(text)) continue
    const trimmed = text.trim()
    if (pureNumber.test(trimmed) && !/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
      const span = document.createElement('span')
      span.dataset.masked = '1'
      span.textContent = text.replace(/\d/g, () => String(Math.floor(Math.random() * 10)))
      span.style.cssText = 'filter: blur(7px); display: inline-block;'
      node.replaceWith(span)
      blurred++
      continue
    }
    let masked = ''
    let last = 0
    const maskPart = s => s.replace(/(NT\$\s*)?\d[\d,.]*/g, m => (m.startsWith('NT$') ? 'NT$ ＊＊＊' : '＊＊'))
    for (const m of text.matchAll(keep)) {
      masked += maskPart(text.slice(last, m.index)) + m[0]
      last = m.index + m[0].length
    }
    masked += maskPart(text.slice(last))
    if (masked !== text) starred++
    node.nodeValue = masked
  }
  sec.querySelectorAll('a, button').forEach(e => { e.style.display = 'none' })
  const digitsLeft = [...sec.querySelectorAll('*')]
    .filter(e => e.children.length === 0 && !e.dataset.masked && /\d/.test(e.textContent))
    .map(e => e.textContent.trim())
    .filter(t => t.replace(keep, '').match(/\d/))
  return { blurred, starred, digitsLeft }
}

const outDir = join(ROOT, SLUG)
const webpDir = join(ROOT, 'public', 'images', 'cases', SLUG)
await mkdir(webpDir, { recursive: true })

const browser = await chromium.launch()
const shots = [
  // 內文用：數字卡與參加日期表
  { name: 'result', width: 1280, from: 'SECTION', to: 'h3:參加日期', pad: 0 },
  // 內文用：平台 × 來源表
  { name: 'sources', width: 1280, from: 'h3:平台', to: 'h3:平台', pad: 12 },
  // 首頁精選卡用：窄版的平台 × 來源表，字比較大
  { name: 'card', width: 760, from: 'h3:平台', to: 'h3:平台', pad: 12 },
]
for (const shot of shots) {
  const page = await browser.newPage({ viewport: { width: shot.width, height: 900 }, deviceScaleFactor: 2 })
  await page.goto(pathToFileURL(src).href, { waitUntil: 'networkidle' })
  await page.waitForTimeout(600)
  const report = await page.evaluate(mask)
  if (report.digitsLeft.length) {
    console.error(`${shot.name}：仍有未打碼的數字，中止`, report.digitsLeft.slice(0, 10))
    await browser.close()
    process.exit(1)
  }
  // 打碼之後頁面若又重新渲染，新插入的文字不會被遮到；截圖前再確認一次。
  await page.waitForTimeout(400)
  const rerendered = await page.evaluate(() => {
    const sec = document.querySelector('#halloween-overview')
    const walker = document.createTreeWalker(sec, NodeFilter.SHOW_TEXT)
    let unmasked = 0
    while (walker.nextNode()) {
      const n = walker.currentNode
      if (n.parentElement.dataset.masked) continue
      const rest = n.nodeValue.replace(/\d{4}[-/]\d{1,2}[-/]\d{1,2}|\d{1,2}:\d{2}|\d{1,2}\/\d{1,2}|V\d{1,3}/g, '')
      if (/\d/.test(rest)) unmasked++
    }
    return { unmasked, masked: sec.querySelectorAll('[data-masked]').length }
  })
  if (rerendered.unmasked || rerendered.masked !== report.blurred) {
    console.error(`${shot.name}：打碼後頁面內容有變動，中止`, rerendered)
    await browser.close()
    process.exit(1)
  }
  const clip = await page.evaluate(([f, t, p]) => {
    const sec = document.querySelector('#halloween-overview')
    const byHeading = text => [...sec.querySelectorAll('h3')].find(h => h.textContent.includes(text))
    const from = f.startsWith('h3:') ? byHeading(f.slice(3)) : sec
    const to = t.startsWith('h3:') ? byHeading(t.slice(3)).nextElementSibling : sec
    const a = from.getBoundingClientRect()
    const b = to.getBoundingClientRect()
    const s = sec.getBoundingClientRect()
    return { x: Math.max(0, s.x - p), y: Math.max(0, a.y + scrollY - p), width: s.width + p * 2, height: b.bottom - a.y + p + (p ? 2 : 0) }
  }, [shot.from, shot.to, shot.pad])
  const png = join(outDir, `${shot.name}.png`)
  await page.screenshot({ path: png, clip, fullPage: true })
  await run('ffmpeg', ['-y', '-loglevel', 'error', '-i', png, '-c:v', 'libwebp', '-quality', '82', join(webpDir, `${shot.name}.webp`)])
  console.log(`${shot.name}：模糊 ${report.blurred} 欄、＊號 ${report.starred} 處，${Math.round(clip.width)}×${Math.round(clip.height)}`)
  await page.close()
}
await browser.close()
