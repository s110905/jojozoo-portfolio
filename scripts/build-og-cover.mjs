// 產生社群分享卡 public/images/og-cover-v2.jpg（1200×630）。
//
// 舊的 og-cover.jpg 是 2026-08 上一版作品集的主視覺（深紫黑底、標語與精選作品
// 都跟現在對不上），LINE、FB 抓到的縮圖因此一直是舊的。這支重做一張對齊現在
// 白底深青綠設計的分享卡。
//
// 檔名刻意換成 v2：社群平台的 OG 快取是綁圖片網址的，沿用同一個網址換內容，
// LINE 不保證會重抓。換網址是唯一可靠的作法。
//
// 跟 build-thumbs.mjs 一樣**不掛在 npm run build 上**（Cloudflare Pages 沒有
// Chromium），改標語或換案例時手動重跑：
//
//   node scripts/build-og-cover.mjs
import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { chromium } from 'playwright'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'public', 'images', 'og-cover-v2.jpg')

// 取 src/data/projects.ts 的 stripSlugs 前五個：畫面最完整、最能代表「產品」的案例。
const THUMBS = [
  '01-summer-camp',
  '14-anniversary-find-four',
  '13-customer-service-automation',
  '09-jojozoocart',
  '03-hotel-partner-system',
]

const dataUri = async (slug) => {
  const buf = await readFile(join(ROOT, 'public', 'images', 'thumbs', `${slug}.webp`))
  return `data:image/webp;base64,${buf.toString('base64')}`
}

const thumbs = await Promise.all(THUMBS.map(dataUri))

// 色票與字級沿用 src/portfolio.css 的設計語言。
const html = `<!doctype html>
<html lang="zh-Hant"><head><meta charset="utf-8" /><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; background: #fff; color: #183832;
    font-family: 'Arial', 'Noto Sans TC', 'Microsoft JhengHei', sans-serif;
    -webkit-font-smoothing: antialiased;
    padding: 62px 64px 56px; display: flex; flex-direction: column;
  }
  .eyebrow {
    font-size: 17px; font-weight: 700; letter-spacing: .18em; color: #176b5b;
  }
  h1 {
    margin-top: 26px; font-size: 66px; font-weight: 800;
    letter-spacing: -.055em; line-height: 1.32;
  }
  .sub { margin-top: 20px; font-size: 23px; line-height: 1.7; color: #526660; }
  .thumbs { margin-top: auto; display: flex; gap: 16px; }
  .thumbs img {
    width: 196px; height: 110px; object-fit: cover;
    border-radius: 10px; border: 1px solid #d9e2dc; background: #eef3ef;
  }
  .foot {
    margin-top: 26px; padding-top: 20px; border-top: 1px solid #d9e2dc;
    display: flex; justify-content: space-between; align-items: baseline;
    font-size: 19px; color: #526660;
  }
  .foot strong { color: #176b5b; font-weight: 700; }
</style></head><body>
  <p class="eyebrow">TOYO CHANG ・ MARTECH ENGINEER</p>
  <h1>把想法，<br />做成真的能用的產品。</h1>
  <p class="sub">從行銷現場出發，用技術與 AI 解決營運問題。</p>
  <div class="thumbs">${thumbs.map((src) => `<img src="${src}" />`).join('')}</div>
  <div class="foot"><span>toyo-chang.pages.dev</span><span><strong>16</strong> 個上線案例</span></div>
</body></html>`

const browser = await chromium.launch()
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } })
await page.setContent(html, { waitUntil: 'load' })
const buf = await page.screenshot({ type: 'jpeg', quality: 88 })
await browser.close()

await writeFile(OUT, buf)
console.log(`og-cover-v2.jpg 完成：${(buf.length / 1024).toFixed(0)} KB`)
