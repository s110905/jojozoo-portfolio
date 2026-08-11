// 探測遊園車後台的畫面結構，用來決定錄影前要遮哪些欄位。
//
// 密碼從環境變數讀，不寫進程式也不進版控：
//
//   PowerShell:  $env:CART_ADMIN_PASSWORD = '你的密碼'
//   Git Bash:    export CART_ADMIN_PASSWORD='你的密碼'
//   然後：       node scripts/probe-admin.mjs
//
// 後台層級預設 super，需要別的層級時再設 CART_ADMIN_LEVEL=onsite|admin|super。
// 密碼絕不會被印出來：不使用會回顯參數的 Playwright API，且所有錯誤輸出都先過濾。
//
// 產出 video-raw/admin-structure.txt：只有選擇器與「欄位長什麼樣」，
// 所有數字換成 #、中文字串換成 ○，真實姓名與電話不會被寫出來。
// 截圖同樣做過遮蔽，可以安全拿來對座標。

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
const level = process.env.CART_ADMIN_LEVEL || 'super'

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
  console.error('  $env:CART_ADMIN_LEVEL = "admin"   # 或 onsite / super')
  await browser.close()
  process.exit(1)
}

// 在任何截圖之前先把可能的個資蓋掉
await page.addStyleTag({
  content: `
    [data-pii], .customer-name, .customer-phone, [href^="tel:"],
    input[name="customerName"], input[name="phone"], input[name="documentIdSuffix"] {
      filter: blur(7px) !important;
    }
  `,
})

// 營收比照個資處理（2026-08-11 決定）：金額字樣一律先模糊再截圖
await page.evaluate(() => {
  const money = /NT\$|＄|\$\s?[\d,]|[\d,]+\s?元|營收|營業額|總計|小計|金額/
  for (const el of document.querySelectorAll('*')) {
    if (el.children.length === 0 && money.test(el.textContent || '')) {
      el.setAttribute('data-money', '')
      el.style.filter = 'blur(7px)'
    }
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

  lines.push(`\n看起來像個資的元素（值已遮蔽，附選擇器與座標）：`)
  const suspects = []
  for (const el of document.querySelectorAll('*')) {
    if (el.children.length || !visible(el)) continue
    const text = el.textContent.trim()
    if (!text || text.length > 30) continue
    const looksPhone = /09\d{2}[- ]?\d{3}[- ]?\d{3}/.test(text)
    const looksName = /^[一-鿿]{2,4}$/.test(text)
    const looksId = /[A-Z]\d{9}|\d{4}$/.test(text) && /證|身分|末碼/.test(el.parentElement?.textContent ?? '')
    if (looksPhone || looksId || (looksName && /姓名|租用人|客戶|顧客/.test(el.parentElement?.textContent ?? ''))) {
      const r = el.getBoundingClientRect()
      const sel = el.className ? `.${String(el.className).split(' ')[0]}` : el.tagName.toLowerCase()
      suspects.push(`  ${sel} @ x=${Math.round(r.x)} y=${Math.round(r.y + scrollY)} w=${Math.round(r.width)} h=${Math.round(r.height)}  值=${maskText(text)}  ${looksPhone ? '[電話]' : looksId ? '[證件]' : '[姓名]'}`)
    }
  }
  lines.push(suspects.length ? suspects.slice(0, 40).join('\n') : '  （目前畫面沒有偵測到）')

  lines.push(`\n金額與營收元素（一律要遮，值已遮蔽）：`)
  const money = []
  for (const el of document.querySelectorAll('[data-money]')) {
    if (!visible(el)) continue
    const r = el.getBoundingClientRect()
    const sel = el.className ? `.${String(el.className).split(' ')[0]}` : el.tagName.toLowerCase()
    money.push(`  ${sel} @ x=${Math.round(r.x)} y=${Math.round(r.y + scrollY)} w=${Math.round(r.width)} h=${Math.round(r.height)}  值=${maskText(el.textContent).slice(0, 16)}`)
  }
  lines.push(money.length ? money.slice(0, 40).join('\n') : '  （目前畫面沒有偵測到）')
  lines.push(`\n頁高：${document.body.scrollHeight}`)
  return lines.join('\n')
})

writeFileSync(join(OUT_DIR, 'admin-structure.txt'), report, 'utf8')
await page.screenshot({ path: join(OUT_DIR, 'admin-blurred.png'), fullPage: true })
await browser.close()

console.log(report)
console.log(`\n報告： video-raw/admin-structure.txt`)
console.log(`截圖： video-raw/admin-blurred.png（個資欄位已模糊）`)
if (attempted.length) console.log(`\n登入後攔下的寫入請求：\n  ${attempted.join('\n  ')}`)
