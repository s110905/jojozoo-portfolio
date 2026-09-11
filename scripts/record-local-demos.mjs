// 錄製「需要在本機跑起來」的案例示範影片。
//
// 與 record-demos.mjs 的差別只有一個：那支錄正式站，這支自己把專案的 dev server
// 叫起來再錄。原始碼都在 D:\我的專案 底下的各自資料夾，錄完 dev server 會關掉。
//
// 為什麼不錄正式站：這幾個案例的正式畫面裡有真實投稿、真實聯絡方式，或根本沒有
// 公開網址。在本機用假資料錄，比錄完再打馬賽克乾淨得多——這也是 docs/video-guide.md
// 第四節的原則：最有效的去敏是錄之前就沒有機敏資料。
//
// 用法：
//   node scripts/record-local-demos.mjs                       # 全部
//   node scripts/record-local-demos.mjs 05-ticket-price-calculator
//   node scripts/record-local-demos.mjs 05-... --probe        # 只探測畫面結構，不錄影

import { chromium } from 'playwright'
import { spawn, spawnSync } from 'node:child_process'
import { mkdir, readdir, readFile, rename, rm, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { fakeArtworkSvg } from './lib/fake-artwork.mjs'
import { renderReportPage } from './lib/render-report-page.mjs'
import { renderTerminalPage } from './lib/render-terminal-page.mjs'
import { renderClickmapPage } from './lib/render-clickmap-page.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const RAW_DIR = join(ROOT, 'video-raw')
const PROJECTS = 'D:/我的專案'

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

/** 慢慢打字，影片裡看得出是在輸入而不是貼上。 */
async function type(page, locator, value) {
  await locator.click()
  await locator.pressSequentially(value, { delay: 110 })
  await page.waitForTimeout(400)
}

const DEMOS = {
  // 藝廊裡是真實兒童的畫作與姓名，兩樣都不該出現在個人作品集裡。處理方式是
  // 「不要讓它們進到瀏覽器」而不是事後打馬賽克：
  //   1. 圖片請求全數攔截，換成 lib/fake-artwork.mjs 產生的示意畫。
  //   2. 姓名在渲染當下就換成「小畫家 A/B/C…」，含 img 的 alt。
  // 影片示範的是這套系統的行為（排序、排行、燈箱、票數），資料全是替身。
  //
  // Firestore 走長連線，networkidle 永遠不會發生，所以等 domcontentloaded 就好。
  '04-children-drawing-contest': {
    dev: { cwd: `${PROJECTS}/jojozoochildrenplan`, cmd: 'npm run dev' },
    viewport: DESKTOP,
    wait: 'domcontentloaded',
    probeWait: 6000,
    beforeGoto: async (context) => {
      await context.route('**firebasestorage.googleapis.com/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'image/svg+xml',
          body: fakeArtworkSvg(route.request().url()),
        }))

      await context.addInitScript(() => {
        const alias = new Map()
        const LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'
        const nameOf = (real) => {
          if (!alias.has(real)) alias.set(real, `小畫家 ${LETTERS[alias.size % 26]}`)
          return alias.get(real)
        }

        const run = () => {
          // 姓名的可靠來源是 img 的 alt（「陳○○ 的畫作」），先從這裡建立對照表
          for (const img of document.querySelectorAll('img[alt]')) {
            const m = img.alt.match(/^(.+?)\s*的畫作$/)
            if (!m || m[1].startsWith('小畫家')) continue
            img.alt = `${nameOf(m[1])} 的畫作`
          }
          if (!alias.size) return

          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
          let node
          while ((node = walker.nextNode())) {
            const text = (node.data || '').trim()
            if (!text) continue
            if (alias.has(text)) { node.data = alias.get(text); continue }
            // 獎項區的「總價值約 6,500 元」：金額照 docs/video-guide.md 的規則一律遮
            if (/[\d,]+\s*元/.test(text)) node.data = text.replace(/[\d,]+\s*元/g, '＊＊＊ 元')
          }
        }

        const start = () => {
          run()
          new MutationObserver(run).observe(document.body, { childList: true, subtree: true, characterData: true })
        }
        if (document.body) start()
        else document.addEventListener('DOMContentLoaded', start)
      })
    },
    tour: async (page) => {
      await page.waitForTimeout(2000)
      await glide(page, 900, 2400)
      await page.waitForTimeout(1600)
      await glide(page, 0, 1600)
      await page.waitForTimeout(600)

      await page.getByRole('link', { name: /看畫作/ }).first().click()
      await page.waitForTimeout(4500)
      await page.getByText('票數排行').click()
      await page.waitForTimeout(2600)
      await glide(page, 620, 2200)
      await page.waitForTimeout(2200)
      // 燈箱不入鏡：那顆放大按鈕在自動化點擊下開不起來，與其硬湊，不如把時間留給
      // 三種排序的切換——那才是這個藝廊真正在做的事。
      await page.getByText('最新上傳').click()
      await page.waitForTimeout(2800)
      await glide(page, 0, 1800)
      await page.waitForTimeout(1500)
    },
  },
  // POS 自動點擊助手。它的 GUI 是貼在螢幕頂端的全螢幕寬橫幅，錄成 16:9 只會是一條細線，
  // 而且在非互動 session 下 tkinter 起不來。真正說明系統在做什麼的是它錄下來的點擊腳本，
  // 所以改成把 config_*.json 的座標序列畫成動線圖播放；座標與延遲都是原值。
  '08-pos-autoclicker': {
    url: pathToFileURL(join(RAW_DIR, 'clickmap-08-pos.html')).href,
    path: '',
    viewport: DESKTOP,
    wait: 'domcontentloaded',
    beforeGoto: async () => {
      const dir = join(PROJECTS, 'autopos', 'dist')
      const names = ['停車發票', '清潔發票', '飼料發票']
      const configs = []
      for (const name of names) {
        const json = JSON.parse(await readFile(join(dir, `config_${name}.json`), 'utf8'))
        configs.push({ name, json })
      }

      const primary = configs[0]
      await mkdir(RAW_DIR, { recursive: true })
      await writeFile(join(RAW_DIR, 'clickmap-08-pos.html'), renderClickmapPage({
        title: '錄一次，之後每天自動重放：POS 開立發票的點擊腳本',
        subtitle: '三份日常作業各自錄成一組座標序列，由 Windows 工作排程器定時執行',
        primary: { name: primary.name, file: primary.name, steps: primary.json.steps },
        profiles: configs.map((c) => ({
          name: c.name,
          steps: c.json.steps.length,
          delay: c.json.steps[0]?.delay ?? 0.5,
          interrupts: c.json.interrupts.length,
        })),
      }))
    },
    tour: async (page) => {
      // 動線圖是無限循環的 CSS 動畫，停著看完兩輪就夠，不需要捲動
      await page.waitForTimeout(11000)
      await glide(page, 160, 1600)
      await page.waitForTimeout(7000)
    },
  },

  // ERP 多平台自動化報表。這支**不能為了錄影而真的執行**：真跑會登入正式 ERP、
  // 下載報表並寫進正式 Google Sheet。所以錄的是它自己留下的執行 log 原文，
  // 用終端機樣式逐行播放——內容是真的，只有呈現方式是重現的。
  //
  // 唯一遮掉的是「總收入」金額，那是營收；筆數、天數、分頁總筆數這類規模指標保留。
  '06-erp-automation-spider': {
    url: pathToFileURL(join(RAW_DIR, 'terminal-06-erp.html')).href,
    path: '',
    viewport: DESKTOP,
    wait: 'domcontentloaded',
    beforeGoto: async () => {
      const dir = join(PROJECTS, 'erpspider', 'logs')
      const latest = (await readdir(dir)).filter((f) => f.endsWith('.log')).sort().at(-1)
      const raw = await readFile(join(dir, latest), 'utf8')

      const kept = raw.split(/\r?\n/)
        // 逐檔的解析嘗試與下載輪詢是雜訊，播出來只會讓人看不到主線
        .filter((l) => !/\[Debug\]|\[偵錯\]/.test(l))
        .filter((l) => !/本次更新日期範圍/.test(l))
        // 營收是公司的商業資訊，不是作品素材（docs/video-guide.md 第四節）
        .map((l) => l.replace(/(總收入|收入)\s*[\d,]+/g, '$1 ＊＊＊'))
        // 原始 log 有大量空行，全留著會把畫面撐成三倍長
        .filter((l, i, arr) => l.trim() !== '' || (arr[i - 1] ?? '').trim() !== '')

      const lines = kept.length > 52
        ? [...kept.slice(0, 26), '    … 中略：其餘平台任務同樣流程 …', ...kept.slice(-25)]
        : kept

      await mkdir(RAW_DIR, { recursive: true })
      await writeFile(join(RAW_DIR, 'terminal-06-erp.html'), renderTerminalPage({
        title: 'ERP 多平台自動化報表：一次排程跑完的實際紀錄',
        subtitle: `執行紀錄原文 logs/${latest} · 金額已遮蔽，筆數與天數為實際數值`,
        command: 'python full_automation.py --headless',
        lines,
        lineDelay: 0.22,
      }))
    },
    tour: async (page) => {
      // 捲動要跟著逐行浮現的節奏走：太快會捲到還沒出現的空白區
      await page.waitForTimeout(3400)
      for (const [y, hold] of [[430, 2400], [920, 2400], [1400, 2400], [1850, 2600]]) {
        await glide(page, y, 1700)
        await page.waitForTimeout(hold)
      }
    },
  },

  // 官網 SEO 與 GA4 分析。這個案例沒有圖形介面，產出就是一份份分析報告，
  // 所以錄的是專案裡那份 GA4 唯讀分析的**原文**——內容一個字都沒改，只是換上
  // 看得清楚的排版。數字全是流量與人數這類規模指標，沒有金額，不需要遮。
  '16-seo-analytics': {
    url: pathToFileURL(join(RAW_DIR, 'report-16-seo-analytics.html')).href,
    path: '',
    viewport: DESKTOP,
    wait: 'domcontentloaded',
    beforeGoto: async () => {
      const md = await readFile(join(PROJECTS, '99cutezoo-seo', 'GA4周年活動_offer_type_唯讀分析_20260904.md'), 'utf8')
      await mkdir(RAW_DIR, { recursive: true })
      await writeFile(join(RAW_DIR, 'report-16-seo-analytics.html'), renderReportPage({
        eyebrow: 'JOJOZOO / SEO & ANALYTICS',
        title: 'GA4 周年活動 offer_type 唯讀分析',
        source: '分析期間 2026-08-28 ~ 2026-09-03 · 未修改正式站、GTM、GA4 設定或既有探索',
        markdown: md,
      }))
    },
    tour: async (page) => {
      await page.waitForTimeout(2400)
      // 頁面總高約 2400px；停留點對準兩張數據表與診斷段落
      for (const [y, hold] of [[560, 1300], [1000, 2000], [1350, 2000], [1750, 1800], [2100, 1600]]) {
        await glide(page, y, 1900)
        await page.waitForTimeout(hold)
      }
    },
  },

  // 廣告戰情室。這支不是重建的示意畫面，就是專案裡實際產出的那份報表
  // （D:\我的專案\jojofbAds\廣告戰情室.html），資料內嵌在檔案裡，直接用 file:// 開。
  //
  // 頁面上有真實的每日廣告花費，照 docs/video-guide.md 第四節一律遮掉；
  // CTR、到達網頁數、Frequency、預算進度百分比這些規模與效率指標保留——
  // 它們是這個案例的說服力來源，而且不透露公司賺多少。
  '15-meta-ads-warroom': {
    url: pathToFileURL(join(PROJECTS, 'jojofbAds', '廣告戰情室.html')).href,
    path: '',
    viewport: DESKTOP,
    wait: 'domcontentloaded',
    beforeGoto: async (context) => {
      await context.addInitScript(() => {
        // 整塊移除，不是打碼：這幾區的內容是廣告帳戶結構、受眾設定與流量絕對值，
        // 打碼之後剩下一堆星號也沒有閱讀價值，不如不要出現。
        const DROP_SECTIONS = ['最近成效', '從活動一路看到素材', '專家成效洞察與行動指南', '投放綜合評價']
        const DROP_BLOCKS = ['GA4 網站行為', '粉專自然觸及']

        const MONEY = /(?:NT\$|＄|\$)\s?[\d,]+(?:\.\d+)?/g
        const ADSET_CODE = /\((?:JJF|BROAD|IMG|LAL|CAMP)[^)]*\)/g
        const GEO_AUDIENCE = /草屯\s*\d+\s*公里[內外]/g
        // 頁尾躺著 Meta 廣告帳戶 ID（15 位數字），頁首則有帳戶前綴 JJF_
        const ACCOUNT_ID = /\b\d{12,}\b/g
        const ACCOUNT_PREFIX = /JJF[_\w-]*/g

        const prune = () => {
          for (const section of document.querySelectorAll('section, article')) {
            const head = section.querySelector('h1, h2, h3, h4')
            const title = (head?.textContent ?? '').replace(/\s+/g, ' ')
            const lead = section.textContent.replace(/\s+/g, ' ').slice(0, 60)
            if (DROP_SECTIONS.some((t) => title.includes(t) || lead.includes(t))) section.remove()
            else if (DROP_BLOCKS.some((t) => lead.includes(t))) section.remove()
          }
        }

        // 留下來的區塊仍可能夾帶金額、廣告代號或受眾半徑，再過一次
        const redact = () => {
          const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
          let node
          while ((node = walker.nextNode())) {
            const text = node.data || ''
            if (!text.trim()) continue
            const next = text
              .replace(MONEY, 'NT$＊＊＊')
              .replace(ADSET_CODE, '(＊＊＊)')
              .replace(GEO_AUDIENCE, '服務範圍')
              .replace(ACCOUNT_ID, '＊＊＊')
              .replace(ACCOUNT_PREFIX, '＊＊＊')
            if (next !== text) node.data = next
          }
        }

        const run = () => { prune(); redact() }
        const start = () => {
          run()
          new MutationObserver(run).observe(document.body, { childList: true, subtree: true, characterData: true })
        }
        if (document.body) start()
        else document.addEventListener('DOMContentLoaded', start)
      })
    },
    tour: async (page) => {
      await page.waitForTimeout(2400)
      for (const y of [640, 1250, 1850, 2400]) {
        await glide(page, y, 2000)
        await page.waitForTimeout(1400)
      }
      await page.waitForTimeout(1200)
    },
  },

  // 客服自動化的審核台。專案的 .env.local 同樣設了 NEXT_PUBLIC_USE_MOCK=true，
  // 前端走內建預覽資料；另外把整個對外網域攔掉，確保不會連到正式 Chatwoot
  // （那支的 API token 就放在 .env.local，絕對不能真的打過去）。
  '13-customer-service-automation': {
    dev: { cwd: `${PROJECTS}/jojozoo-support`, cmd: 'npx next dev --port 3007', port: 3007 },
    viewport: DESKTOP,
    wait: 'domcontentloaded',
    probeWait: 8000,
    beforeGoto: async (context) => {
      await context.route('**://**', (route) => {
        const url = new URL(route.request().url())
        if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return route.continue()
        console.log(`  外部請求已攔下 → ${url.hostname}${url.pathname}`)
        return route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      })
    },
    tour: async (page) => {
      await page.getByRole('button', { name: /產生 AI 建議/ }).waitFor({ timeout: 90000 })
      await page.waitForTimeout(2600)

      await page.getByRole('button', { name: /產生 AI 建議/ }).click()
      await page.waitForTimeout(2600)
      // 建議展開在對話串裡，中欄要自己捲；整頁 scroll 對這個三欄版面沒有作用
      await page.mouse.move(640, 320)
      await page.mouse.wheel(0, 320)
      await page.waitForTimeout(3000)

      // 送出前一定要有人改過：這支的設計就是 AI 出草稿、人工確認後才送
      await type(page, page.locator('textarea').first(), '您好，四歲兒童適用免費入園（未滿 3 歲或 100cm 以下免費，3~12 歲適用博愛票）。')
      await page.waitForTimeout(1200)
      await page.getByRole('button', { name: /檢查後送出/ }).click()
      await page.waitForTimeout(3000)

      // 送出前還有一道人工確認：要先勾「我已確認收件人與完整內容」才解鎖送出鍵。
      // 這道防呆本身就是這個案例的賣點之一，值得留在畫面上多停一會。
      await page.locator('input[type="checkbox"]').first().check()
      await page.waitForTimeout(1800)
      await page.getByRole('button', { name: /確認並送出/ }).click()
      await page.waitForTimeout(4000)
    },
  },

  // 企業內部管理系統（款項審核／權限矩陣）。前端是 Next.js，後端 NestJS 跑在 3001，
  // 兩者之間全走 REST，所以只跑前端、把 3001 整個攔掉就好——資料庫從頭到尾不需要存在。
  //
  // 這支模組很多，端點是逐輪補的：沒被明確處理的路徑一律回空陣列，並在主控台印出來，
  // 下一輪再決定哪些要餵資料。畫面上的員工姓名、廠商與金額全是虛構的。
  '02-payment-system': {
    // 不用 `pnpm --filter web dev`：那會先跑 install，而這個 workspace 的 pnpm 想清掉
    // 整個 node_modules 重裝，在無 TTY 下直接中止。相依本來就裝好了，直接叫 next。
    dev: { cwd: `${PROJECTS}/jojozoo-control/apps/web`, cmd: 'npx next dev --port 3006', port: 3006 },
    viewport: DESKTOP,
    wait: 'domcontentloaded',
    probeWait: 6000,
    beforeGoto: async (context) => {
      const seen = new Set()
      await context.route('**localhost:3001/**', (route) => {
        const { pathname } = new URL(route.request().url())
        const key = `${route.request().method()} ${pathname}`
        if (!seen.has(key)) { seen.add(key); console.log(`  api → ${key}`) }
        route.fulfill({ status: 200, contentType: 'application/json', body: '[]' })
      })
    },
    tour: async (page) => {
      const setRole = async (label) => {
        await page.locator('select').first().selectOption({ label })
        await page.waitForTimeout(2600)
      }

      // Next.js 冷啟動時第一頁要現編譯，固定秒數不夠；等側邊選單真的出現再開始
      await page.getByRole('link', { name: '我的請款' }).waitFor({ timeout: 90000 })
      await page.waitForTimeout(1800)
      await glide(page, 420, 1600)
      await page.waitForTimeout(1400)
      await glide(page, 0, 1200)

      await page.getByRole('link', { name: '我的請款' }).click()
      await page.waitForTimeout(2800)
      // 動作欄可能是 a 也可能是 button；狀態欄的「待經理審核」也含「審核」兩字，要用完整比對
      await page.locator('a, button').filter({ hasText: /^審核$/ }).first().click()
      await page.waitForTimeout(3200)

      // 這支案例的重點是 RBAC，所以整段動線就是同一個畫面換身分看：
      // 管理員有可執行動作，普通員工同一張單只剩唯讀。
      await setRole('普通員工')
      await page.waitForTimeout(1000)

      // 權限矩陣頁對普通員工直接擋下，切回管理員才長出來——先擋後放，比只看到矩陣有說服力
      await page.goto(new URL('/admin/permissions', page.url()).toString(), { waitUntil: 'domcontentloaded' })
      await page.waitForTimeout(2600)
      await setRole('系統管理員')
      await glide(page, 480, 2000)
      await page.waitForTimeout(2600)
    },
  },

  // LINE 抽獎小遊戲。這支沒有自己的後端，兩個外部依賴都得換掉：
  //   1. LINE 的 LIFF SDK——桌面瀏覽器不可能有 LINE 登入態，整包換成假的，
  //      同時攔掉 sdk.js 本體，不然它載入後會蓋掉我們注入的假物件。
  //   2. Firebase Firestore——直接攔掉 CDN 上的模組，回傳一份同介面的假實作。
  //      正式專案的 Firestore 因此完全沒有被連線，抽獎與核銷都只動到記憶體。
  //
  // 畫面上的 LINE 顯示名稱與頭像用假的，中獎券號是即時產生的流水號，都不是真實資料。
  '10-line-lucky-draw': {
    dev: { cwd: `${PROJECTS}/lineluckydraw`, cmd: 'npx vite --port 5182', port: 5182 },
    viewport: PHONE,
    beforeGoto: async (context) => {
      // 後台統計表要對得上獎項名稱才有數字，名稱直接從專案的 config.js 取
      const config = await readFile(join(PROJECTS, 'lineluckydraw', 'config.js'), 'utf8')
      const names = [...config.matchAll(/name:\s*"([^"]+)"/g)].map((m) => m[1])

      const firestoreModule = `
const PRIZE_NAMES = ${JSON.stringify(names)};
const store = new Map();
store.set('counters/daily', { count: 128 });
// 一批示範參加者，讓後台統計不是空的
for (let i = 1; i <= 146; i++) {
  const prize = PRIZE_NAMES[i % PRIZE_NAMES.length];
  store.set('players/demo-' + i, {
    prize, used: true, redeemed: i % 3 === 0,
    wonDate: '2026-05-12', code: 'JJ-20260512-' + String(i).padStart(4, '0'),
  });
}
const snapOf = (path) => ({ exists: () => store.has(path), data: () => store.get(path) });
export function initializeApp() { return {}; }
export function getFirestore() { return {}; }
export function doc(_db, col, id) { return { path: col + '/' + id }; }
export function collection(_db, col) { return { path: col }; }
export function serverTimestamp() { return new Date().toISOString(); }
export async function getDoc(ref) { return snapOf(ref.path); }
export async function updateDoc(ref, patch) { store.set(ref.path, { ...store.get(ref.path), ...patch }); }
export async function getDocs(colRef) {
  const docs = [...store.keys()]
    .filter((k) => k.startsWith(colRef.path + '/'))
    .map((k) => ({ id: k, data: () => store.get(k) }));
  return { docs, size: docs.length, forEach: (fn) => docs.forEach(fn) };
}
export async function runTransaction(_db, fn) {
  return fn({
    get: async (ref) => snapOf(ref.path),
    set: (ref, value, opts) => store.set(ref.path, opts && opts.merge ? { ...store.get(ref.path), ...value } : value),
  });
}
`
      await context.route('**gstatic.com/firebasejs/**', (route) =>
        route.fulfill({
          status: 200,
          contentType: 'application/javascript',
          body: route.request().url().includes('firebase-app')
            ? 'export function initializeApp() { return {}; }'
            : firestoreModule,
        }))

      await context.route('**line-scdn.net/**', (route) =>
        route.fulfill({ status: 200, contentType: 'application/javascript', body: '/* LIFF SDK 已停用 */' }))

      await context.addInitScript(() => {
        window.liff = {
          init: async () => {},
          isLoggedIn: () => true,
          login: () => {},
          getProfile: async () => ({ userId: 'demo-player-0001', displayName: '示範用戶', pictureUrl: '' }),
          getFriendship: async () => ({ friendFlag: true }),
        }
      })
    },
    tour: async (page) => {
      await page.waitForTimeout(2400)
      await glide(page, 420, 1800)
      await page.waitForTimeout(1600)
      await glide(page, 0, 1400)
      await page.waitForTimeout(600)

      await page.getByRole('button', { name: '轉動轉盤' }).click()
      await page.waitForTimeout(6500)

      await page.getByRole('button', { name: /核銷/ }).click()
      await page.waitForTimeout(1600)
      await page.getByRole('button', { name: '確認核銷' }).click()
      await page.waitForTimeout(2800)

      // 同一支頁面用 ?admin=1 進工作人員後台，看得到累計參加與兌換狀況
      await page.goto(new URL('?admin=1', page.url()).toString(), { waitUntil: 'networkidle' })
      await page.waitForTimeout(2600)
      await glide(page, 600, 2200)
      await page.waitForTimeout(2600)
    },
  },

  // 飯店夥伴入場券系統。登入、建券、核銷、後台統計全部走 Supabase Edge Function 與 RPC，
  // 所以整個 supabase 網域攔掉就夠。雙重保險：dev server 的 VITE_SUPABASE_URL 被換成假網址，
  // 就算攔截規則有漏，請求也打不到正式專案。
  //
  // 畫面上的飯店名稱全是虛構的，不用真實合作夥伴。
  '03-hotel-partner-system': {
    dev: {
      cwd: `${PROJECTS}/hotel-partner-entry-system/web`,
      // 專案的 dev script 寫死 --port 5179 --strictPort，那個埠常常已經被佔著。
      // 直接叫 vite 並換埠，不動專案的 package.json。
      cmd: 'npx vite --host localhost --port 5181', port: 5181,
      env: { VITE_SUPABASE_URL: 'https://demo-hpes.supabase.co', VITE_SUPABASE_ANON_KEY: 'demo-anon-key' },
    },
    viewport: DESKTOP,
    beforeGoto: async (context) => {
      const PARTNER = { id: 'partner-demo-01', name: '日光溫泉飯店', account: 'sunlight', status: 'active' }
      const iso = (d) => new Date(d).toISOString()
      const qrs = [
        {
          // 刻意留下餘額：核銷 2 人之後還剩 2，畫面才停在「部分使用」而不是「已用完」的錯誤訊息，
          // 這張券可以分次使用也才看得出來。
          id: 'qr-001', code: 'HPES-日光溫泉飯店-1757500000000', partner_id: PARTNER.id,
          total_quota: 6, used_quota: 2, remaining_quota: 4, download_count: 3,
          created_at: iso('2026-08-22T09:12:00Z'), expires_at: iso('2026-09-22T09:12:00Z'),
          disabled: false, partners: { name: PARTNER.name },
          qr_redemptions: [
            { id: 'r-1', redeemed_quota: 2, redeemed_at: iso('2026-08-24T11:30:00Z') },
          ],
        },
      ]

      await context.route('**supabase.co/**', async (route) => {
        const url = route.request().url()
        let body = {}
        try { body = JSON.parse(route.request().postData() || '{}') } catch { /* RPC 可能沒有 body */ }
        const json = (payload) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(payload) })

        if (url.includes('/functions/v1/login')) return json({ id: PARTNER.id, name: PARTNER.name, account: PARTNER.account })
        // 現場核銷前要先過工作人員 PIN，這道也是 edge function
        if (url.includes('/functions/v1/verify-scan-pin')) return json({ ok: true })
        if (url.includes('/rest/v1/rpc/redeem_qr')) {
          const qr = qrs.find((q) => q.id === body.p_qr_code_id) ?? qrs[0]
          const amount = Number(body.p_amount ?? 1)
          qr.used_quota += amount
          qr.remaining_quota = Math.max(qr.total_quota - qr.used_quota, 0)
          qr.qr_redemptions.push({ id: `r-${qr.qr_redemptions.length + 1}`, redeemed_quota: amount, redeemed_at: new Date().toISOString() })
          return json({ ok: true, used_quota: qr.used_quota, remaining_quota: qr.remaining_quota, redemption_id: `r-${qr.qr_redemptions.length}` })
        }
        if (url.includes('/rest/v1/rpc/increment_download')) {
          qrs[0].download_count += 1
          return json(null)
        }
        if (body.action === 'list-partners') return json([PARTNER])
        if (body.action === 'insert') {
          const created = {
            id: `qr-${qrs.length + 1}`, code: body.code, partner_id: body.partner_id,
            total_quota: body.total_quota, used_quota: 0, remaining_quota: body.total_quota,
            download_count: 0, created_at: new Date().toISOString(), expires_at: body.expires_at,
            disabled: false, partners: { name: PARTNER.name }, qr_redemptions: [],
          }
          qrs.unshift(created)
          return json(created)
        }
        if (body.action === 'list') return json(qrs)
        return json({})
      })
    },
    tour: async (page) => {
      await page.waitForTimeout(1800)
      const [account, password] = await page.locator('input').all()
      await type(page, account, 'sunlight')
      await type(page, password, '••••••••')
      await page.getByRole('button', { name: '登入系統' }).click()
      await page.waitForTimeout(3000)

      await glide(page, 480, 2000)
      await page.waitForTimeout(1500)
      await page.locator('input[type="number"]').fill('4')
      await page.waitForTimeout(1200)
      await page.getByRole('button', { name: '建立 QR 憑證' }).click()
      await page.waitForTimeout(3000)

      // 掃 QR 等同開啟 ?code=<憑證代碼>，這正是現場工作人員手機上會走的路徑。
      // 挑已經用掉 4/6 的那張，才看得出「同一張券可以分次扣額」。
      await page.goto(new URL('?code=HPES-日光溫泉飯店-1757500000000', page.url()).toString(), { waitUntil: 'networkidle' })
      await page.waitForTimeout(2200)
      await type(page, page.locator('input[type="password"]'), '••••')
      await page.getByRole('button', { name: '驗證並進入' }).click()
      await page.waitForTimeout(2600)

      await page.getByRole('button', { name: '+', exact: true }).click()
      await page.waitForTimeout(1400)
      await page.getByRole('button', { name: /確認核銷/ }).click()
      await page.waitForTimeout(3400)
    },
  },

  // 集點系統的遊客端。所有狀態都走 /api/*，所以整批 mock 就能在完全不碰 D1 的情況下
  // 演完整條動線——正式環境的參加紀錄一筆都不會動到。
  //
  // 掃碼本來要相機，但前端同時支援 deep link（?c=&t=），那也是遊客掃到 QR 後真正會走的路徑，
  // 所以動線改用導頁模擬掃描。mock 的狀態放在閉包裡，導頁不會把進度歸零。
  '14-anniversary-find-four': {
    dev: { cwd: `${PROJECTS}/anniversary2026/site`, cmd: 'pnpm dev' },
    viewport: PHONE,
    wait: 'domcontentloaded',
    probeWait: 5000,
    beforeGoto: async (context) => {
      const TIERS = [
        { count: 8, title: '尋4新手' }, { count: 16, title: '尋4偵探' },
        { count: 24, title: '尋4高手' }, { count: 32, title: '尋4大師' },
        { count: 40, title: '尋4強者' }, { count: 50, title: '尋4王者' },
      ]
      const SPOTS = [
        ['D14', '恐龍之丘'], ['P07', '鸚鵡森林天網'], ['M22', '狐獴村'],
        ['O05', '貓頭鷹美食屋'], ['B31', '大鳥窩'],
      ]
      const state = {
        publicCode: 'DEMO-4218',
        count: 7,
        sourceAnswered: false,
        redeemedAt: null,
        tier: null,
        nextTier: TIERS[0],
      }
      const sync = () => {
        state.tier = [...TIERS].reverse().find((t) => state.count >= t.count) ?? null
        state.nextTier = TIERS.find((t) => state.count < t.count) ?? null
      }
      sync()

      await context.route('**/api/**', (route) => {
        const path = new URL(route.request().url()).pathname
        const json = (body) => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(body) })

        if (path.endsWith('/api/scan')) {
          const [code, label] = SPOTS[state.count % SPOTS.length]
          state.count += 1
          sync()
          return json({ status: 'added', location: { code, label }, state })
        }
        if (path.endsWith('/api/source')) { state.sourceAnswered = true; return json({ state }) }
        if (path.endsWith('/api/redeem')) { state.redeemedAt = '2026-09-20T10:24:00Z'; return json({ state }) }
        return json({ state, recoveryCode: '4218-DEMO-7K' })
      })
    },
    tour: async (page) => {
      // 收集成功的彈窗會蓋住整頁，關掉才看得到進度環與解鎖後的核銷按鈕
      const scan = async (code) => {
        await page.goto(new URL(`?c=${code}&t=demo`, page.url()).toString(), { waitUntil: 'domcontentloaded' })
        await page.waitForTimeout(3200)
        await page.getByRole('button', { name: '知道了，繼續找4' }).click()
        await page.waitForTimeout(1200)
      }

      await page.waitForTimeout(2400)
      // radio 本體被 .source-radio 蓋住，要點的是包著它的 label
      await page.locator('label:has(input[value="fb_ad"])').click()
      await page.waitForTimeout(1400)
      // 不加 exact 會連「開啟相機開始找4」一起命中——getByRole 的 name 預設是子字串比對
      await page.getByRole('button', { name: '開始找4', exact: true }).click()
      await page.waitForTimeout(2000)
      await glide(page, 520, 2000)
      await page.waitForTimeout(1800)

      // 第 8 個會跨過第一個獎勵門檻，核銷按鈕同時解鎖——這是整條動線最值得拍的一刻
      await scan('D14')
      await glide(page, 520, 1800)
      await page.waitForTimeout(2200)
      await scan('P07')
      await glide(page, 520, 1800)
      await page.waitForTimeout(2600)
    },
  },

  // 票價全是對外公告的牌價，畫面上沒有任何個資或營收數字，不需要遮任何東西。
  '05-ticket-price-calculator': {
    dev: { cwd: `${PROJECTS}/BestPrice`, cmd: 'npm run dev' },
    viewport: DESKTOP,
    tour: async (page) => {
      await page.waitForTimeout(1800)
      // 挑週末：假日票價與平日不同，才看得出「選日期會影響結果」。
      // 日曆按鈕的 accessible name 來自 aria-label（「2026 年 9 月 20 日，…」），不是顯示的數字。
      await page.getByRole('button', { name: /月 20 日/ }).click()
      await page.waitForTimeout(1400)
      await page.getByText(/項優惠或提醒/).click()
      await page.waitForTimeout(2000)

      await glide(page, 700, 2000)
      await page.waitForTimeout(800)
      // 每個票種底下還有身分優惠的子計數器，aria-label 是「增加成人票南投縣民人數」這種前綴相同的字串，
      // 所以主計數器一定要 exact，否則會一次命中五顆。
      for (const [label, times] of [
        ['增加成人票', 3],
        ['增加博愛票', 2],
        ['增加免費入園', 1],
        ['增加停車輛數', 1],
      ]) {
        for (let i = 0; i < times; i++) {
          await page.getByRole('button', { name: label, exact: true }).click()
          await page.waitForTimeout(420)
        }
        await page.waitForTimeout(500)
      }

      // 指定其中兩位是南投縣民，讓畫面演出「同樣人數、換組合就換價」
      for (let i = 0; i < 2; i++) {
        await page.getByRole('button', { name: '增加成人票南投縣民人數' }).click()
        await page.waitForTimeout(520)
      }

      await page.waitForTimeout(800)
      await glide(page, await page.evaluate(() => document.body.scrollHeight), 2600)
      await page.waitForTimeout(3000)
    },
  },

  // 領券／核銷走的是 Apps Script，而且用 GET 帶 action 做寫入——write-guard 只擋非 GET，
  // 對這支完全沒有保護力。所以改成整個端點 mock：真正的試算表從頭到尾沒被碰過，
  // 畫面跑的是同一套前端邏輯，只有後端回應是假的。
  '07-kuangsan-collaboration': {
    dev: { cwd: `${PROJECTS}/kuangsan-ticket`, cmd: 'npm run dev' },
    viewport: PHONE,
    beforeGoto: async (context) => {
      const ticket = { token: 'DEMO-2F7A9C4B', status: 'unused', item: '', usedAt: '' }
      await context.route('**script.google.com/**', (route) => {
        const q = new URL(route.request().url()).searchParams
        const action = q.get('action')
        if (action === 'redeem') {
          ticket.status = 'used'
          ticket.item = q.get('item') || 'carousel'
          ticket.usedAt = '2026/01/20 14:32:05'
        }
        route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ success: true, ...ticket }),
        })
      })
    },
    tour: async (page) => {
      // 這顆按鈕只在 localhost 出現，正式站沒有。留著會讓影片看起來像測試環境。
      await page.evaluate(() => {
        for (const b of document.querySelectorAll('button')) {
          if (b.textContent.includes('清除測試資料')) b.remove()
        }
      })
      await page.waitForTimeout(2000)
      await glide(page, 420, 2000)
      await page.waitForTimeout(1800)
      await glide(page, 0, 1600)
      await page.waitForTimeout(800)

      await type(page, page.locator('input').first(), '0912345678')
      await page.waitForTimeout(700)
      await page.getByRole('button', { name: /立即領取專屬體驗券/ }).click()
      await page.waitForTimeout(3200)

      // 點 QR 等同現場工作人員掃碼，會跳到核銷頁
      await page.locator('.qr-wrapper').click()
      await page.waitForTimeout(2600)
      // 核銷要按兩次：第一次選項目，第二次才真的核銷，避免工作人員手滑扣掉票
      await page.getByRole('button', { name: /旋轉木馬/ }).click()
      await page.waitForTimeout(2200)
      await page.getByRole('button', { name: /再次點擊確認/ }).click()
      await page.waitForTimeout(4000)
    },
  },

  // 純靜態站，沒有寫入端點，線上版本就是最新的，不需要在本機跑。
  // 授權定位並給園區內的實際座標，「定位我的位置」才有東西可演；這是園區裡的公開地點，
  // 不是任何人的所在位置。起點刻意設在恐龍之丘、目標挑西側的鸚鵡森林天網，
  // 詳情面板上的「距離」才會是有意義的數字而不是 0 m。
  //
  // 動線刻意不進 AR 實景導航：桌面 Chromium 沒有相機也沒有羅盤，那頁只會顯示
  // 說明文字而且版面是壞的。AR 那段要真的呈現，只能拿手機在園區現場錄。
  '12-webar-park-guide': {
    url: 'https://jojozoomap.pages.dev',
    viewport: PHONE,
    geolocation: { latitude: 23.961374, longitude: 120.705885 },
    tour: async (page) => {
      await page.waitForTimeout(2600)
      await page.getByRole('button', { name: '定位我的位置' }).click()
      await page.waitForTimeout(3000)
      await page.getByText('鸚鵡森林天網').first().click()
      await page.waitForTimeout(3000)
      await page.getByRole('button', { name: '關閉' }).click()
      await page.waitForTimeout(1400)
      await page.getByText('貓頭鷹美食屋').first().click()
      await page.waitForTimeout(3000)
      await page.getByRole('button', { name: '關閉' }).click()
      await page.waitForTimeout(1200)
      await page.getByRole('button', { name: '縮小地圖' }).click()
      await page.waitForTimeout(1400)
      await page.getByRole('button', { name: '縮小地圖' }).click()
      await page.waitForTimeout(3000)
    },
  },
}

/** 啟動專案的 dev server，回傳 { url, stop }。 */
/** 清掉還佔著指定埠的行程。只對本腳本自己選的埠使用，不要拿去掃別人的服務。 */
function freePort(port) {
  if (!port || process.platform !== 'win32') return
  spawnSync('powershell', ['-NoProfile', '-Command',
    `Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue |` +
    ' ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }',
  ], { stdio: 'ignore' })
}

function startDevServer({ cwd, cmd, env, port }) {
  // 上一輪若是在動線中途爆掉，dev server 可能還活著。指定了埠的命令（next dev --port）
  // 撞到佔用會直接失敗而不是換一個埠，所以啟動前先清乾淨。
  freePort(port)
  return new Promise((resolve, reject) => {
    // Vite 會採用 shell 傳進來的 VITE_* 變數，而且 .env 檔不會覆寫已存在的值。
    // 指向假的後端網址，就算攔截規則有漏，請求也打不到正式專案。
    const child = spawn(cmd, { cwd, shell: true, stdio: ['ignore', 'pipe', 'pipe'], env: { ...process.env, ...env } })
    let settled = false
    const timer = setTimeout(() => {
      if (settled) return
      settled = true
      child.kill()
      reject(new Error(`${cwd} 的 dev server 60 秒內沒有印出網址`))
    }, 60000)

    // 殺 dev server 出乎意料地麻煩：shell → npx/pnpm → node 至少三層，taskkill /T 有時
    // 追不到最底下那個，留下的程序會一直佔著埠，下一支案例就會連到錯的網站。
    // 所以除了殺行程樹，再依實際監聽的埠補一刀。
    const stop = (port) => {
      clearTimeout(timer)
      if (process.platform !== 'win32') return child.kill('SIGTERM')
      spawn('taskkill', ['/pid', String(child.pid), '/T', '/F'], { stdio: 'ignore' })
      if (!port) return
      spawn('powershell', ['-NoProfile', '-Command',
        `Get-NetTCPConnection -State Listen -LocalPort ${port} -ErrorAction SilentlyContinue |` +
        ' ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }',
      ], { stdio: 'ignore' })
    }

    // Vite 會把色碼插在埠號中間（http://localhost:<ESC>[1m5199），不剝掉就比對不到
    const stripAnsi = (s) => String(s).replace(/\[[0-9;]*m/g, '')

    const scan = (buf) => {
      const m = stripAnsi(buf).match(/https?:\/\/(?:localhost|127\.0\.0\.1):\d+\/?\S*/)
      if (m && !settled) {
        settled = true
        clearTimeout(timer)
        const url = m[0].replace(/\/$/, '')
        const port = new URL(url).port
        resolve({ url, stop: () => stop(port) })
      }
    }
    child.stdout.on('data', scan)
    child.stderr.on('data', scan)
    child.on('error', reject)
  })
}

async function open(slug, demo) {
  const dev = demo.dev ? await startDevServer(demo.dev) : null
  const base = dev ? dev.url : demo.url
  return { base: base + (demo.path ?? '/'), stopDev: dev?.stop ?? (() => {}) }
}

/** 探測模式：印出畫面上的可點元素與標題，用來寫動線。 */
async function probe(slug, demo) {
  const { base, stopDev } = await open(slug, demo)
  const browser = await chromium.launch()
  const context = await browser.newContext({
    viewport: demo.viewport,
    isMobile: demo.viewport === PHONE,
    hasTouch: demo.viewport === PHONE,
    ...(demo.geolocation ? { geolocation: demo.geolocation, permissions: ['geolocation'] } : {}),
  })
  await demo.beforeGoto?.(context)
  const page = await context.newPage()
  try {
    await page.goto(base, { waitUntil: demo.wait ?? 'networkidle', timeout: 60000 })
    await page.waitForTimeout(demo.probeWait ?? 2500)
    // 登入後才看得到的畫面：讓案例自己宣告要先做什麼再探測
    if (demo.probeSteps) await demo.probeSteps(page)
  } catch (err) {
    await browser.close()
    stopDev()
    throw err
  }

  const report = await page.evaluate(() => {
    const text = (el) => (el.innerText || el.value || el.getAttribute('aria-label') || '').trim().replace(/\s+/g, ' ').slice(0, 60)
    const list = (sel) => [...document.querySelectorAll(sel)]
      .filter((el) => el.offsetParent !== null)
      .map((el) => `${el.tagName.toLowerCase()}${el.name ? `[name=${el.name}]` : ''} · ${text(el)}`)
    return {
      title: document.title,
      height: document.documentElement.scrollHeight,
      headings: list('h1,h2,h3'),
      buttons: list('button,a[role=button],[role=tab]'),
      inputs: list('input,select,textarea'),
    }
  })

  await mkdir(RAW_DIR, { recursive: true })
  const out = [
    `# ${slug}`,
    `網址：${base}`,
    `標題：${report.title}`,
    `頁面高度：${report.height}px（viewport ${demo.viewport.height}px）`,
    '', '## 標題', ...report.headings,
    '', '## 可點元素', ...report.buttons,
    '', '## 輸入欄位', ...report.inputs,
  ].join('\n')
  await writeFile(join(RAW_DIR, `probe-${slug}.txt`), out)
  await page.screenshot({ path: join(RAW_DIR, `probe-${slug}.png`), fullPage: report.height < 6000 })
  console.log(out)
  console.log(`\n→ video-raw/probe-${slug}.txt / .png`)

  await browser.close()
  stopDev()
}

async function record(slug, demo) {
  const { base, stopDev } = await open(slug, demo)
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
    ...(demo.geolocation ? { geolocation: demo.geolocation, permissions: ['geolocation'] } : {}),
  })
  await demo.beforeGoto?.(context)

  const page = await context.newPage()
  try {
    await page.goto(base, { waitUntil: demo.wait ?? 'networkidle', timeout: 60000 })
    await demo.tour(page)
  } finally {
    // 動線寫錯而拋例外時也要把 dev server 收掉，否則它會一直佔著埠，
    // 下一次啟動就會靜靜地連到上一輪留下的舊服務。
    await context.close()
    await browser.close()
    stopDev()
  }

  const [file] = await readdir(dir)
  await rename(join(dir, file), join(RAW_DIR, `${slug}.webm`))
  await rm(dir, { recursive: true, force: true })
  console.log(`  video-raw/${slug}.webm`)
}

const args = process.argv.slice(2)
const only = args.find((a) => !a.startsWith('--'))
const isProbe = args.includes('--probe')

for (const [slug, demo] of Object.entries(DEMOS)) {
  if (only && slug !== only) continue
  console.log(`${isProbe ? '探測' : '錄製'} ${slug} …`)
  await (isProbe ? probe(slug, demo) : record(slug, demo))
}

export { DEMOS, glide, type, DESKTOP, PHONE, PROJECTS }
