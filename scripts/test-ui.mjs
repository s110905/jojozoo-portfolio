import assert from 'node:assert/strict'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'
import { preview } from 'vite'

const root = fileURLToPath(new URL('..', import.meta.url))
const server = await preview({
  root,
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
})
const browser = await chromium.launch({ headless: true })

try {
  const page = await browser.newPage({ viewport: { width: 375, height: 812 } })
  await page.addInitScript(() => {
    window.__gaCalls = []
    window.gtag = (...args) => window.__gaCalls.push(args)
  })

  await page.goto('http://127.0.0.1:4173/', { waitUntil: 'networkidle' })
  await page.evaluate(() => {
    document.addEventListener('click', event => {
      if (event.target instanceof Element && event.target.closest('a[href^="mailto:"]')) event.preventDefault()
    }, true)
  })

  const heroContact = page.getByRole('link', { name: '聊聊你的需求' })
  assert.equal(await heroContact.isVisible(), true, '行動版首屏應顯示聯絡 CTA')
  assert.ok((await heroContact.evaluate(element => element.getBoundingClientRect().height)) >= 44, '首頁 CTA 高度至少 44px')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, '375px 不得水平溢位')

  await heroContact.click()
  const contactCalls = await page.evaluate(() => window.__gaCalls.filter(call => call[0] === 'event' && call[1] === 'contact_click'))
  assert.equal(contactCalls.length, 1, '首頁 CTA 單次點擊只能送出一筆 contact_click')
  assert.deepEqual(contactCalls[0][2], { entry_point: 'hero_cta', transport_type: 'beacon' })

  await page.getByRole('button', { name: /行銷活動/ }).click()
  const visibleCases = await page.locator('.index-row').count()
  const filterCalls = await page.evaluate(() => window.__gaCalls.filter(call => call[0] === 'event' && call[1] === 'filter_used'))
  assert.equal(filterCalls.length, 1, '分類實際變更時應送出一筆 filter_used')
  assert.deepEqual(filterCalls[0][2], { filter_value: 'marketing', results_count: visibleCases })

  await page.goto('http://127.0.0.1:4173/case/01-summer-camp/', { waitUntil: 'networkidle' })
  const caseContact = page.getByRole('link', { name: '寄信聊聊' })
  assert.equal(await caseContact.isVisible(), true, '案例頁應顯示聯絡 CTA')
  assert.ok((await caseContact.evaluate(element => element.getBoundingClientRect().height)) >= 44, '案例 CTA 高度至少 44px')
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, '案例頁 375px 不得水平溢位')

  await page.setViewportSize({ width: 812, height: 375 })
  await page.reload({ waitUntil: 'networkidle' })
  assert.equal(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth), true, '橫向手機不得水平溢位')

  console.log('responsive CTA flow: PASS')
} finally {
  await browser.close()
  await server.close()
}
