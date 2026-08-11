// 錄製公開上線作品的操作畫面。
//
// 這些是正式營運系統，因此腳本有兩道保護：
//   1. 動線只做瀏覽與切換分頁，不觸發送出。
//   2. page.route 攔截所有非 GET 請求並中止，寫入在瀏覽器層就出不去。
//      真的有人改動線導致寫入嘗試，主控台會印出來。
//
// 產出 raw/<slug>.webm，後續交給 scripts/process-video.mjs 壓縮與去敏。
//
// 用法： node scripts/record-demos.mjs [slug]

import { chromium } from 'playwright'
import { mkdir, readdir, rename, rm } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RAW_DIR = join(ROOT, 'video-raw')

const DESKTOP = { width: 1280, height: 720 }
const PHONE = { width: 390, height: 844 }

/** 平滑捲動，逐格移動才不會在影片裡變成瞬移。 */
async function glide(page, to, ms = 2200) {
  await page.evaluate(
    ([target, duration]) => new Promise((done) => {
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
    }),
    [to, ms],
  )
}

const DEMOS = {
  '09-jojozoocart': {
    url: 'https://jojozoocart.pages.dev/',
    viewport: PHONE,
    wait: 'networkidle',
    async tour(page) {
      await page.waitForTimeout(2500)
      await glide(page, 700, 2600)
      await page.waitForTimeout(1400)
      await glide(page, 1400, 2600)
      await page.waitForTimeout(1400)
      await glide(page, 0, 2000)
      await page.waitForTimeout(1500)
    },
  },
  '01-summer-camp': {
    url: 'https://www.jojozoopark.com/camp/',
    viewport: DESKTOP,
    wait: 'domcontentloaded',
    // 導覽列按鈕會隨捲動改變位置，點擊不穩定；改成整頁巡覽。
    //
    // 刻意跳過 y=720~2416 的「營隊生活與活動剪影」相簿：那裡有可辨識的
    // 遊客與兒童臉孔。照片放在園區官網有其脈絡，搬到個人作品集沒有，
    // 所以直接不錄。頁面改版導致區塊位移時，這些座標要重新量。
    async tour(page) {
      await page.waitForTimeout(5000)
      await page.waitForTimeout(1800)
      await page.evaluate(() => window.scrollTo(0, 2416))
      await page.waitForTimeout(1600)
      for (const y of [3400, 5300, 6800, 8300, 9400]) {
        await glide(page, y, 2400)
        await page.waitForTimeout(1300)
      }
    },
  },
  '11-mothersday-lottery': {
    url: 'https://jojomondaylottery.web.app',
    viewport: PHONE,
    wait: 'networkidle',
    async tour(page) {
      await page.waitForTimeout(2500)
      await glide(page, 400, 2200)
      await page.waitForTimeout(1600)
      await glide(page, 0, 1800)
      await page.waitForTimeout(1200)
    },
  },
}

async function record(slug, demo) {
  const dir = join(RAW_DIR, slug)
  await rm(dir, { recursive: true, force: true })
  await mkdir(dir, { recursive: true })

  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: demo.viewport,
    deviceScaleFactor: 2,
    isMobile: demo.viewport === PHONE,
    hasTouch: demo.viewport === PHONE,
    recordVideo: { dir, size: demo.viewport },
  })

  const blocked = []
  await context.route('**/*', (route) => {
    const request = route.request()
    if (request.method() === 'GET') return route.continue()
    blocked.push(`${request.method()} ${request.url()}`)
    return route.abort()
  })

  const page = await context.newPage()
  await page.goto(demo.url, { waitUntil: demo.wait, timeout: 60000 })
  await demo.tour(page)
  await context.close()
  await browser.close()

  const [file] = await readdir(dir)
  await rename(join(dir, file), join(RAW_DIR, `${slug}.webm`))
  await rm(dir, { recursive: true, force: true })

  if (blocked.length) console.log(`  ! 攔下 ${blocked.length} 個寫入請求：\n    ${blocked.join('\n    ')}`)
  console.log(`  video-raw/${slug}.webm`)
}

const only = process.argv[2]
for (const [slug, demo] of Object.entries(DEMOS)) {
  if (only && slug !== only) continue
  console.log(`錄製 ${slug} …`)
  await record(slug, demo)
}
