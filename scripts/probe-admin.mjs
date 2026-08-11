// 探測遊園車後台的畫面結構，用來決定錄影前要遮哪些欄位。
//
// 密碼從環境變數讀，不寫進程式也不進版控：
//
//   PowerShell:  $env:CART_ADMIN_PASSWORD = '你的密碼'
//   Git Bash:    export CART_ADMIN_PASSWORD='你的密碼'
//   然後：       node scripts/probe-admin.mjs
//
// 後台層級預設 admin，需要別的層級時再設 CART_ADMIN_LEVEL=onsite|admin|super。
// 密碼絕不會被印出來：不使用會回顯參數的 Playwright API，且所有錯誤輸出都先過濾。
//
// 產出 video-raw/admin-structure.txt：只有選擇器與「欄位長什麼樣」，
// 所有數字換成 #、中文字串換成 ○，真實姓名與電話不會被寫出來。
// 截圖 admin-redacted.png 的個資與金額是直接被方塊字元取代，不是模糊。

import { chromium } from 'playwright'
import { mkdirSync, writeFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'video-raw')
const URL = 'https://jojozoocart.pages.dev/'

const password = process.env.CART_ADMIN_PASSWORD
if (!password) {
  console.error('請先設定 CART_ADMIN_PASSWORD 環境變數，不要把密碼寫進指令參數（會留在 shell 紀錄裡）。')
  process.exit(1)
}

// 後台入口是網址參數：onsite（現場）／admin（管理）／super（最高權限）
const level = process.env.CART_ADMIN_LEVEL || 'admin'

// Playwright 會把 API 參數寫進錯誤訊息的 call log，locator.fill(密碼) 曾因此
// 讓密碼出現在終端機輸出裡。以下兩道措施確保密碼不會被印出來：
//   1. 不用 fill()，改在頁面內直接設值（見下方 setPasswordAndSubmit）。
//   2. 任何要輸出的錯誤都先過濾掉密碼字串。
const scrub = (text) =>
  String(text ?? '').split(password).join('********')

function die(err) {
  console.error(scrub(err?.message || err))
  process.exit(1)
}
process.on('uncaughtException', die)
process.on('unhandledRejection', die)

mkdirSync(OUT_DIR, { recursive: true })

const browser = await chromium.launch()
const context = await browser.newContext({ viewport: { width: 1280, height: 900 } })

// 登入需要送出請求，因此先放行；登入完成後立刻改為只允許 GET，
// 之後不管點到什麼都不會寫進正式資料庫。
let allowWrites = true
const attempted = []
await context.route('**/*', (route) => {
  const req = route.request()
  if (req.method() === 'GET' || allowWrites) return route.continue()
  attempted.push(`${req.method()} ${req.url().split('?')[0]}`)
  return route.abort()
})

const page = await context.newPage()
await page.goto(`${URL}?staff=${level}`, { waitUntil: 'networkidle' })

// 密碼欄在 <dialog id="staffPasswordDialog"> 裡，帶了 ?staff= 參數才會開啟
await page.locator('#staffPasswordDialog input[type="password"]')
  .waitFor({ state: 'visible', timeout: 20000 })

// 不經過 locator.fill()：那個 API 會把值寫進 Playwright 的 call log，
// 一旦這裡逾時或失敗，密碼就會出現在終端機輸出裡。
await page.evaluate((secret) => {
  const form = document.querySelector('#staffPasswordForm')
  const input = form.querySelector('input[type="password"]')
  input.value = secret
  input.dispatchEvent(new Event('input', { bubbles: true }))
  form.requestSubmit()
}, password)

await page.waitForTimeout(5000)
allowWrites = false

// 確認真的登入了，否則後面抓到的都是空畫面
const loggedIn = await page.evaluate(() =>
  document.body.classList.contains('staff-mode'))
if (!loggedIn) {
  console.error(`以 ${level} 層級登入失敗。請確認密碼正確，或改用其他層級：`)
  console.error('  $env:CART_ADMIN_LEVEL = "onsite"   # 或 admin / super')
  await browser.close()
  process.exit(1)
}

// 標記所有個資與金額元素。
//
// 原本是注入 CSS 做模糊，但遊園車站自己的 CSP 有 style-src 'self'，注入會被擋。
// 改成直接改寫文字內容：不依賴任何樣式，而且比模糊更徹底——模糊還原得回來，
// 刪掉的字還原不了。
await page.evaluate(() => {
  const MONEY = /NT\$|＄|\$\s?[\d,]|[\d,]+\s?元|營收|營業額|總計|小計|金額/
  const PHONE = /09\d{2}[- ]?\d{3}[- ]?\d{3}/
  const NAME = /^[一-鿿]{2,4}$/

  for (const el of document.querySelectorAll('*')) {
    if (el.children.length) continue
    const text = (el.textContent || '').trim()
    if (!text) continue
    const context = el.parentElement?.textContent ?? ''

    if (MONEY.test(text)) el.setAttribute('data-money', '')
    else if (PHONE.test(text)) el.setAttribute('data-pii', 'phone')
    else if (/[A-Z]\d{9}/.test(text) || (/\d{4}$/.test(text) && /證|身分|末碼/.test(context)))
      el.setAttribute('data-pii', 'id')
    else if (NAME.test(text) && /姓名|租用人|客戶|顧客/.test(context))
      el.setAttribute('data-pii', 'name')
  }
  for (const input of document.querySelectorAll('input')) {
    if (/customerName|phone|document/i.test(input.name || '')) input.setAttribute('data-pii', 'field')
  }
})

const report = await page.evaluate(() => {
  const maskText = (s) =>
    (s || '').replace(/\d/g, '#').replace(/[一-鿿]/g, '○').replace(/[A-Za-z]{2,}/g, 'Aa').trim()

  const visible = (el) => {
    const st = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return st.display !== 'none' && st.visibility !== 'hidden' && r.width > 0 && r.height > 0
  }

  const lines = []
  lines.push(`頁面標題：${document.title}`)
  lines.push(`可見按鈕：`)
  for (const b of document.querySelectorAll('button')) {
    if (visible(b)) lines.push(`  - ${b.textContent.replace(/\s+/g, ' ').trim().slice(0, 30)}`)
  }

  lines.push(`\n表格與清單結構（值已遮蔽）：`)
  for (const t of document.querySelectorAll('table')) {
    if (!visible(t)) continue
    const head = [...t.querySelectorAll('th')].map((th) => th.textContent.trim()).join(' | ')
    const row = [...(t.querySelector('tbody tr')?.querySelectorAll('td') ?? [])]
      .map((td) => maskText(td.textContent).slice(0, 12)).join(' | ')
    const rect = t.getBoundingClientRect()
    lines.push(`  table @ x=${Math.round(rect.x)} y=${Math.round(rect.y + scrollY)} w=${Math.round(rect.width)} h=${Math.round(rect.height)}`)
    lines.push(`    欄位：${head}`)
    lines.push(`    首列：${row}`)
  }

  const describe = (el) => {
    const r = el.getBoundingClientRect()
    const sel = el.className ? `.${String(el.className).split(' ')[0]}` : el.tagName.toLowerCase()
    return `  ${sel} @ x=${Math.round(r.x)} y=${Math.round(r.y + scrollY)} w=${Math.round(r.width)} h=${Math.round(r.height)}`
  }

  lines.push(`\n個資元素（值已遮蔽，附選擇器與座標）：`)
  const suspects = []
  for (const el of document.querySelectorAll('[data-pii]')) {
    if (!visible(el)) continue
    suspects.push(`${describe(el)}  值=${maskText(el.textContent).slice(0, 14)}  [${el.getAttribute('data-pii')}]`)
  }
  lines.push(suspects.length ? suspects.slice(0, 40).join('\n') : '  （目前畫面沒有偵測到）')

  lines.push(`\n金額與營收元素（一律要遮，值已遮蔽）：`)
  const money = []
  for (const el of document.querySelectorAll('[data-money]')) {
    if (!visible(el)) continue
    money.push(`${describe(el)}  值=${maskText(el.textContent).slice(0, 16)}`)
  }
  lines.push(money.length ? money.slice(0, 40).join('\n') : '  （目前畫面沒有偵測到）')
  lines.push(`\n頁高：${document.body.scrollHeight}`)
  return lines.join('\n')
})

writeFileSync(join(OUT_DIR, 'admin-structure.txt'), report, 'utf8')

// 截圖前把標記過的內容整個換掉。報告已經產生完畢，這裡可以直接破壞畫面。
const redacted = await page.evaluate(() => {
  let count = 0
  for (const el of document.querySelectorAll('[data-pii], [data-money]')) {
    if (el.tagName === 'INPUT') el.value = '████'
    else el.textContent = '█'.repeat(Math.min(8, Math.max(2, el.textContent.trim().length)))
    count++
  }
  return count
})
await page.screenshot({ path: join(OUT_DIR, 'admin-redacted.png'), fullPage: true })
await browser.close()

console.log(report)
console.log(`\n報告： video-raw/admin-structure.txt`)
console.log(`截圖： video-raw/admin-redacted.png（${redacted} 個個資／金額元素已被方塊取代）`)
if (attempted.length) console.log(`\n登入後攔下的寫入請求：\n  ${attempted.join('\n  ')}`)
