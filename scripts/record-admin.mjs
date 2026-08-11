// 錄製遊園車後台。
//
//   PowerShell:  $env:CART_ADMIN_PASSWORD = '你的密碼'
//                node scripts/record-admin.mjs
//
// 兩件事讓這支影片不會外洩資料：
//
//   1. 登入不在錄影範圍內。先在沒有錄影的 context 登入、把 token 帶過去，
//      錄影的 context 一開始就已經是登入狀態。
//   2. 遮蔽用 addInitScript 在頁面自己的腳本之前注入，並掛 MutationObserver
//      持續處理後續渲染。資料一畫出來就被換成假值，不是等畫面完成才補遮，
//      所以不會有幾個影格露出真實內容。
//
// 錄完會掃描畫面確認沒有漏網的個資樣式，有漏就直接失敗、不留下影片。
//
// 產出 video-raw/09-jojozoocart-admin.webm

import { chromium } from 'playwright'
import { mkdir, readdir, rename, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { installWriteGuard } from './lib/write-guard.mjs'
import { redactInPage, findLeaks } from './lib/redact-in-page.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RAW_DIR = join(ROOT, 'video-raw')
const OUT = '09-jojozoocart-admin'
const URL = 'https://jojozoocart.pages.dev/'
const VIEWPORT = { width: 1280, height: 800 }

const password = process.env.CART_ADMIN_PASSWORD
if (!password) {
  console.error('請先設定 CART_ADMIN_PASSWORD 環境變數，不要把密碼寫進指令參數（會留在 shell 紀錄裡）。')
  process.exit(1)
}
const level = process.env.CART_ADMIN_LEVEL || 'admin'

const scrub = (text) => String(text ?? '').split(password).join('********')
const die = (err) => { console.error(scrub(err?.message || err)); process.exit(1) }
process.on('uncaughtException', die)
process.on('unhandledRejection', die)

async function glide(page, to, ms = 2400) {
  await page.evaluate(([target, duration]) => new Promise((done) => {
    const start = window.scrollY
    const distance = target - start
    const t0 = performance.now()
    const step = (now) => {
      const p = Math.min((now - t0) / duration, 1)
      const eased = p < 0.5 ? 2 * p * p : 1 - (-2 * p + 2) ** 2 / 2
      window.scrollTo(0, start + distance * eased)
      if (p < 1) requestAnimationFrame(step)
      else done()
    }
    requestAnimationFrame(step)
  }), [to, ms])
}

const browser = await chromium.launch()

// ── 第一階段：登入，不錄影 ────────────────────────────────
const authContext = await browser.newContext({ viewport: VIEWPORT })
const authGuard = installWriteGuard(authContext)
const authPage = await authContext.newPage()
await authPage.goto(`${URL}?staff=${level}`, { waitUntil: 'networkidle' })
await authPage.locator('#staffPasswordDialog input[type="password"]')
  .waitFor({ state: 'visible', timeout: 20000 })
await authPage.evaluate((secret) => {
  const form = document.querySelector('#staffPasswordForm')
  const input = form.querySelector('input[type="password"]')
  input.value = secret
  input.dispatchEvent(new Event('input', { bubbles: true }))
  form.requestSubmit()
}, password)
await authPage.waitForTimeout(5000)
authGuard.lockdown()

if (!(await authPage.evaluate(() => document.body.classList.contains('staff-mode')))) {
  console.error(`以 ${level} 層級登入失敗。密碼或層級不對。`)
  await browser.close()
  process.exit(1)
}
const storageState = await authContext.storageState()
await authContext.close()

// ── 第二階段：帶著 token 錄影，遮蔽先於任何渲染 ──────────────
const dir = join(RAW_DIR, OUT)
await rm(dir, { recursive: true, force: true })
await mkdir(dir, { recursive: true })

const context = await browser.newContext({
  viewport: VIEWPORT,
  storageState,
  recordVideo: { dir, size: VIEWPORT },
})
const guard = installWriteGuard(context, { allowLogin: false })
await context.addInitScript(redactInPage, 'observe')

const page = await context.newPage()
await page.goto(`${URL}?staff=${level}`, { waitUntil: 'networkidle' })
await page.waitForTimeout(3000)

if (!(await page.evaluate(() => document.body.classList.contains('staff-mode')))) {
  console.error('錄影用的 context 沒有維持登入狀態，token 可能沒被帶過去。')
  await browser.close()
  process.exit(1)
}

// 動線：租借中清單 → 車輛管理 → 核銷紀錄。
// 營運儀表板整頁都是營收，遮掉之後只剩空格子，沒有展示價值，不錄。
await page.waitForTimeout(2200)

for (const [label, scrollTo] of [['車輛管理', 1500], ['核銷紀錄', 1700]]) {
  const button = page.getByRole('button', { name: new RegExp(label) }).first()
  if (!(await button.count())) continue
  await button.click()
  await page.waitForTimeout(2000)
  await glide(page, scrollTo, 3200)
  await page.waitForTimeout(1200)
  await glide(page, 0, 2000)
  await page.waitForTimeout(1000)
}

const leaks = await page.evaluate(findLeaks)
await context.close()
await browser.close()

const [file] = await readdir(dir)
await rename(join(dir, file), join(RAW_DIR, `${OUT}.webm`))
await rm(dir, { recursive: true, force: true })

if (leaks.length) {
  console.error(`\n錄完的畫面仍偵測到 ${leaks.length} 處疑似個資／金額，影片不可使用：`)
  console.error('  ' + leaks.slice(0, 20).join('\n  '))
  console.error('\n請把上面這段貼給我修正規則，先不要用這支影片。')
  process.exit(1)
}

console.log(`video-raw/${OUT}.webm`)
console.log('畫面掃描：沒有偵測到未遮蔽的個資或金額樣式。')
if (guard.blocked.length) console.log(`攔下的寫入請求：\n  ${guard.blocked.join('\n  ')}`)
