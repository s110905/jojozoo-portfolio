// 探測遊園車後台各分頁的畫面結構，用來決定錄影前要遮哪些欄位。
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
// 每個分頁產出一份結構報告與一張截圖，個資與金額都已被方塊字元取代（不是模糊，
// 模糊還原得回來）。報告裡的值另外用 # 與 ○ 遮過，真實內容不會落到檔案裡。

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
//   1. 不用 fill()，改在頁面內直接設值。
//   2. 任何要輸出的錯誤都先過濾掉密碼字串。
const scrub = (text) => String(text ?? '').split(password).join('********')

function die(err) {
  console.error(scrub(err?.message || err))
  process.exit(1)
}
process.on('uncaughtException', die)
process.on('unhandledRejection', die)

// 後台分頁。null 代表登入後的預設畫面。
const VIEWS = [
  { slug: 'rentals', name: '租借中清單', open: null },
  { slug: 'vehicles', name: '車輛管理', open: /車輛管理/ },
  { slug: 'redemptions', name: '核銷紀錄', open: /核銷紀錄/ },
  { slug: 'dashboard', name: '營運儀表板', open: /營運儀表板/ },
]

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

// 不經過 locator.fill()：那個 API 會把值寫進 Playwright 的 call log。
await page.evaluate((secret) => {
  const form = document.querySelector('#staffPasswordForm')
  const input = form.querySelector('input[type="password"]')
  input.value = secret
  input.dispatchEvent(new Event('input', { bubbles: true }))
  form.requestSubmit()
}, password)

await page.waitForTimeout(5000)
allowWrites = false

if (!(await page.evaluate(() => document.body.classList.contains('staff-mode')))) {
  console.error(`以 ${level} 層級登入失敗。請確認密碼正確，或改用其他層級：`)
  console.error('  $env:CART_ADMIN_LEVEL = "onsite"   # 或 super')
  await browser.close()
  process.exit(1)
}

/**
 * 標記個資與金額。
 *
 * 走 text node 而不是元素：金額常常被包在按鈕或卡片的子層裡，
 * 只看葉元素會整個漏掉（「核銷紀錄 08/11 13,650 元」就是這樣漏的）。
 */
const TAG_IN_PAGE = () => {
  const MONEY = /(?:NT\$|＄|\$)\s?[\d,]+|[\d,]+\s*元/
  const PHONE = /09\d{2}[- ]?\d{3}[- ]?\d{3}/
  const NAME = /^[一-鿿]{2,4}$/
  const HEADER_WORDS = /^(姓名|租用人|客戶|顧客|電話|車輛|狀態|時間|操作|金額|備註|證件)$/

  const isHeader = (el) =>
    !!el.closest('thead, th, [role="columnheader"], [class*="head" i], [class*="label" i]')

  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let node
  while ((node = walker.nextNode())) {
    const text = (node.data || '').trim()
    if (!text) continue
    const el = node.parentElement
    if (!el || el.hasAttribute('data-money') || el.hasAttribute('data-pii')) continue
    const context = el.closest('div,li,tr,section')?.textContent ?? ''

    if (MONEY.test(text)) el.setAttribute('data-money', '')
    else if (PHONE.test(text)) el.setAttribute('data-pii', 'phone')
    else if (/[A-Z]\d{9}/.test(text) || (/^\d{3,4}$/.test(text) && /證|身分|末碼/.test(context)))
      el.setAttribute('data-pii', 'id')
    // 表頭本身就叫「租用人」，不能因為附近有這些字就把欄位名當成姓名
    else if (NAME.test(text) && !HEADER_WORDS.test(text) && !isHeader(el)
      && /姓名|租用人|客戶|顧客/.test(context))
      el.setAttribute('data-pii', 'name')
  }
  for (const input of document.querySelectorAll('input')) {
    if (/customerName|phone|document/i.test(input.name || '')) input.setAttribute('data-pii', 'field')
  }
}

const REPORT_IN_PAGE = (viewName) => {
  const mask = (s) => (s || '').replace(/\d/g, '#').replace(/[一-鿿]/g, '○').replace(/[A-Za-z]{2,}/g, 'Aa').trim()
  const visible = (el) => {
    const st = getComputedStyle(el)
    const r = el.getBoundingClientRect()
    return st.display !== 'none' && st.visibility !== 'hidden' && r.width > 0 && r.height > 0
  }
  const describe = (el) => {
    const r = el.getBoundingClientRect()
    const sel = el.className ? `.${String(el.className).split(' ')[0]}` : el.tagName.toLowerCase()
    return `  ${sel} @ x=${Math.round(r.x)} y=${Math.round(r.y + scrollY)} w=${Math.round(r.width)} h=${Math.round(r.height)}`
  }

  const lines = [`### ${viewName}`, `標題：${document.title}`, `頁高：${document.body.scrollHeight}`, '', '可見按鈕：']
  for (const b of document.querySelectorAll('button')) {
    if (visible(b)) lines.push(`  - ${mask(b.textContent.replace(/\s+/g, ' ').trim()).slice(0, 34)}`)
  }

  for (const [title, selector] of [['個資元素', '[data-pii]'], ['金額與營收元素', '[data-money]']]) {
    lines.push('', `${title}：`)
    const found = []
    for (const el of document.querySelectorAll(selector)) {
      if (!visible(el)) continue
      const kind = el.getAttribute('data-pii')
      found.push(`${describe(el)}  值=${mask(el.textContent).slice(0, 16)}${kind ? `  [${kind}]` : ''}`)
    }
    lines.push(found.length ? found.slice(0, 40).join('\n') : '  （這個分頁沒有偵測到）')
  }
  return lines.join('\n')
}

const REDACT_IN_PAGE = () => {
  let count = 0
  for (const el of document.querySelectorAll('[data-pii], [data-money]')) {
    if (el.tagName === 'INPUT') el.value = '████'
    else el.textContent = '█'.repeat(Math.min(8, Math.max(2, el.textContent.trim().length)))
    count++
  }
  return count
}

const reports = []
for (const view of VIEWS) {
  if (view.open) {
    const button = page.getByRole('button', { name: view.open }).first()
    if (!(await button.count())) {
      reports.push(`### ${view.name}\n  （這個層級看不到這個分頁）`)
      continue
    }
    await button.click()
    await page.waitForTimeout(2500)
  }

  await page.evaluate(TAG_IN_PAGE)
  const report = await page.evaluate(REPORT_IN_PAGE, view.name)
  const hidden = await page.evaluate(REDACT_IN_PAGE)
  await page.screenshot({ path: join(OUT_DIR, `admin-${view.slug}.png`), fullPage: true })
  reports.push(`${report}\n\n（截圖前已取代 ${hidden} 個元素 → admin-${view.slug}.png）`)

  // 遮蔽會破壞畫面，換分頁前重新載入。token 存在 localStorage，不必再輸入密碼。
  await page.reload({ waitUntil: 'networkidle' })
  await page.waitForTimeout(2500)
}

await browser.close()

const out = reports.join('\n\n' + '='.repeat(70) + '\n\n')
writeFileSync(join(OUT_DIR, 'admin-structure.txt'), out, 'utf8')
console.log(out)
console.log(`\n報告： video-raw/admin-structure.txt`)
console.log(`截圖： video-raw/admin-*.png（個資與金額已被方塊取代）`)
if (attempted.length) console.log(`\n登入後攔下的寫入請求：\n  ${attempted.join('\n  ')}`)
