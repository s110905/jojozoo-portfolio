// 把每個案例資料夾的 markdown 產生成站內靜態頁（dist/case/<slug>/），
// 並輸出涵蓋首頁與所有案例頁的 sitemap.xml。
//
// 在 `vite build` 之後執行，因為要沿用它產出的 hashed CSS 檔名。
// 案例頁不含任何 JS，樣式全部走外部檔案，符合站上的 CSP。

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { marked } from 'marked'
import { videoHref, videoPath } from './lib/video-categories.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const SITE = 'https://toyo-chang.pages.dev'
const AUTHOR = '張文豪 Toyo Chang'
const CASE_DIR = /^\d\d-/

// 有 public/videos/<slug>.mp4 的案例會自動長出示範影片區塊。
// 說明文字要老實交代這支是怎麼錄的。
const DEMO_NOTES = {
  '01-summer-camp': '正式上線的報名頁實際畫面。錄製過程只瀏覽頁面，未填寫或送出任何報名資料。',
  '02-payment-system': '請款單審核動線與角色權限控制：同一張單、同一個權限頁，管理員與普通員工看到的可執行動作完全不同。畫面資料為系統內建的預覽用測試資料，員工姓名、廠商與金額皆為虛構。',
  '03-hotel-partner-system': '飯店端建立入場憑證、現場掃碼、依實際人數分次扣額的完整流程。飯店名稱為虛構示範對象，後端回應全程以測試資料模擬，正式資料未被讀取或寫入。',
  '04-children-drawing-contest': '活動頁與作品藝廊的實際操作。所有畫作縮圖與小畫家姓名在畫面渲染前即已置換為示意內容，真實投稿作品未出現在影片中；票數為系統實際數值。',
  '05-ticket-price-calculator': '完整試算流程：選日期、填同行人數與身分優惠，系統自動挑出最省的票種組合。畫面上的票價為對外公告牌價。',
  '07-kuangsan-collaboration': '聯名活動的完整動線：領券、產生 QR 體驗券、現場掃碼核銷。後端回應全程以測試資料模擬，正式票券資料未被寫入或讀取。',
  '08-pos-autoclicker': '依實際錄製的點擊腳本（config_*.json）繪製的動線圖，座標與延遲未經調整。工具本身是貼在螢幕頂端的橫幅式視窗，不適合錄成影片，因此改以動線呈現它每天重放的內容。',
  '09-jojozoocart': '正式上線系統的前台租借流程與後台核銷、逐車使用分析。錄製時攔截所有寫入請求，未產生任何紀錄；顧客姓名、電話與金額在畫面渲染前即已置換。',
  '10-line-lucky-draw': '抽獎、中獎券、工作人員核銷到後台統計的完整動線。LINE 登入與資料庫皆以測試替身運作，正式活動資料未被讀取或寫入；後台的參加與兌換數字為示範資料。',
  // 11-mothersday-lottery 與 06-erp-automation-spider 的影片已依使用者要求下架
  // （2026-09-11），檔案移到 video-raw/removed/。要放回來的話把檔案搬回
  // public/videos/<分類>/ 並在這裡補回說明即可。
  '13-customer-service-automation': '客服調度台：AI 依核准知識庫產生草稿、人工確認、送出前再一道收件人檢查。系統以本機 Mock 模式運行，畫面上的顧客與案件皆為預覽資料，未連線正式客服系統，也沒有任何訊息真的送出。',
  '14-anniversary-find-four': '遊客端完整動線：來源問卷、掃碼集點、等級升級到核銷解鎖。所有後端回應皆為測試資料，正式活動的參加紀錄未被讀取或寫入。',
  '16-seo-analytics': '專案實際產出的 GA4 唯讀分析報告原文，只換上便於閱讀的排版。三種優惠的觸達率差距與資料限制、後續驗收條件都完整保留；數字為流量與人數，不含金額。',
  '15-meta-ads-warroom': '專案實際產出的廣告戰情室，聚焦在判讀方法與上線檢查：固定總額的預算重配實驗設計、判讀順序、來園訊號更新狀態、官網即時健康與 TLS 憑證鏈，以及「這張表能回答什麼、不能回答什麼」的口徑聲明。廣告帳戶結構、受眾設定與所有花費、流量絕對值皆未收錄。',
  '12-webar-park-guide': '正式上線的園區地圖：定位、景點資訊與即時距離計算。定位座標為園區內的公開地點。AR 實景導航需要手機相機與羅盤，未涵蓋在這支影片裡。',
}

const BADGE_COLORS = {
  brightgreen: 'mint', green: 'mint', success: 'mint',
  blue: 'blue', orange: 'amber', yellow: 'amber',
  red: 'violet', purple: 'violet', lightgrey: 'muted', grey: 'muted',
}

const esc = (s) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

/** shields.io 的 badge 網址拆成 { label, value, tone }，避免向外站要圖（CSP 也會擋）。 */
function parseBadge(url) {
  const raw = url.split('/badge/')[1]
  if (!raw) return null
  const parts = raw.replace(/\.svg$/, '').split(/(?<!-)-(?!-)/)
  if (parts.length < 3) return null
  const [label, value, color] = parts.map((p) =>
    decodeURIComponent(p.replace(/--/g, '-')).replace(/_/g, ' '))
  return { label, value, tone: BADGE_COLORS[color.toLowerCase()] ?? 'muted' }
}

/** 從 markdown 抽出頁首要用的欄位，並回傳剩下的正文。 */
function extractFrontMatter(md) {
  const badges = []
  let title = ''
  let lead = ''
  let note = ''

  const body = md
    .split(/\r?\n/)
    .filter((line) => {
      // 徽章列：整行都是 shields.io 圖片
      if (/^!\[[^\]]*\]\(https:\/\/img\.shields\.io\//.test(line.trim())) {
        for (const m of line.matchAll(/\((https:\/\/img\.shields\.io\/[^)]+)\)/g)) {
          const badge = parseBadge(m[1])
          if (badge) badges.push(badge)
        }
        return false
      }
      // 回作品集的導覽列由頁面模板自己提供
      if (/^\[.*\]\(\.\.\/README\.md\)$/.test(line.trim())) return false
      if (!title && line.startsWith('# ')) {
        title = line.slice(2).trim()
        return false
      }
      if (title && !lead && line.startsWith('### ')) {
        lead = line.slice(4).trim()
        return false
      }
      if (title && !note && line.startsWith('> ')) {
        note = line.slice(2).trim()
        return false
      }
      return true
    })
    .join('\n')
    .trim()

  return { title, lead, note, badges, body }
}

/** 把 README 裡的相對連結改成站內路徑，外部連結補上 target。 */
function rewriteLinks(html, slug) {
  return html
    .replace(/src="\.?\/?([^"]+?)\.png"/g, (_m, name) => `src="/images/cases/${slug}/${name}.webp"`)
    .replace(/<img /g, '<img loading="lazy" decoding="async" ')
    .replace(/href="\.\.\/README\.md"/g, 'href="/#work"')
    .replace(/href="\.\.\/(\d\d-[^"/]+)\/?(?:README\.md)?"/g, (_m, s) => `href="/case/${s}/"`)
    .replace(/href="\.\/([^"]+)\.md"/g, (_m, name) => `href="/case/${slug}/${kebab(name)}/"`)
    .replace(/<a href="(https?:[^"]+)"/g, '<a target="_blank" rel="noreferrer" href="$1"')
    // 表格在手機上要能自己橫向捲，不能把整頁撐寬
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, '</table></div>')
}

const kebab = (name) => name.toLowerCase().replace(/[_\s]+/g, '-')

/** 用 h2 產生目錄；長文件靠它才好讀。 */
function withToc(html) {
  const items = []
  const withIds = html.replace(/<h2>(.*?)<\/h2>/g, (_m, text) => {
    const id = `sec-${items.length + 1}`
    items.push({ id, text })
    return `<h2 id="${id}">${text}</h2>`
  })
  if (items.length < 3) return { html: withIds, toc: '' }
  const links = items.map((i) => `<li><a href="#${i.id}">${i.text}</a></li>`).join('')
  return { html: withIds, toc: `<nav class="case-toc" aria-label="本頁章節"><p>本頁章節</p><ol>${links}</ol></nav>` }
}

function page({ title, description, canonical, ogImage, body }) {
  const jsonLd = JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    name: title,
    description,
    url: canonical,
    image: ogImage,
    author: { '@type': 'Person', name: AUTHOR, url: `${SITE}/` },
    inLanguage: 'zh-Hant',
  })

  return `<!doctype html>
<html lang="zh-Hant">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <meta name="theme-color" content="#07111f" />
    <title>${esc(title)}｜Toyo Chang</title>
    <meta name="description" content="${esc(description)}" />
    <meta name="author" content="${AUTHOR}" />
    <link rel="canonical" href="${canonical}" />

    <meta property="og:type" content="article" />
    <meta property="og:site_name" content="Toyo Chang｜MarTech Engineer" />
    <meta property="og:locale" content="zh_TW" />
    <meta property="og:url" content="${canonical}" />
    <meta property="og:title" content="${esc(title)}" />
    <meta property="og:description" content="${esc(description)}" />
    <meta property="og:image" content="${ogImage}" />
    <meta property="og:image:width" content="1200" />
    <meta property="og:image:height" content="630" />

    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${esc(title)}" />
    <meta name="twitter:description" content="${esc(description)}" />
    <meta name="twitter:image" content="${ogImage}" />

    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>⚙</text></svg>" />
    <link rel="stylesheet" href="${CSS_HREF}" />
    <link rel="stylesheet" href="/case.css" />

    <script type="application/ld+json">${jsonLd}</script>
  </head>
  <body>
    <div class="site-shell">
      <a class="skip-link" href="#main">跳到主要內容</a>
      <header class="case-header">
        <a class="brand" href="/" aria-label="Toyo Chang 首頁">
          <span class="brand-mark">TC</span>
          <span class="brand-copy"><strong>Toyo Chang</strong><small>MarTech Engineer</small></span>
        </a>
        <a class="case-back" href="/#work">← 回作品集</a>
      </header>
${body}
      <footer class="site-footer">
        <span>© ${new Date().getFullYear()} Toyo Chang</span>
        <span>Designed around real work, built for the web.</span>
      </footer>
    </div>
  </body>
</html>
`
}

function demoBlock(slug) {
  // 影片依分類放在 public/videos/<分類>/ 底下，網址也走同一套路徑（見 lib/video-categories.mjs）
  if (!existsSync(join(ROOT, 'public', videoPath(slug, 'mp4')))) return ''
  const caption = DEMO_NOTES[slug] ?? '實際上線畫面錄製。'
  const src = (ext) => videoHref(slug, ext)
  return `        <figure class="case-demo">
          <video controls preload="none" playsinline muted width="1280" height="720" poster="${src('jpg')}">
            <source src="${src('webm')}" type="video/webm" />
            <source src="${src('mp4')}" type="video/mp4" />
            <a href="${src('mp4')}">下載示範影片</a>
          </video>
          <figcaption>示範影片（無聲）·&nbsp;${esc(caption)}</figcaption>
        </figure>
`
}

function caseBody({ index, total, title, lead, note, badges, toc, content, slug, prev, next }) {
  const chips = badges.length
    ? `<div class="case-chips">${badges
        .map((b) => `<span class="chip chip-${b.tone}"><small>${esc(b.label)}</small>${esc(b.value)}</span>`)
        .join('')}</div>`
    : ''
  const nav = [
    prev ? `<a class="case-nav-link" href="/case/${prev.slug}/"><small>上一個案例</small>${esc(prev.title)}</a>` : '<span></span>',
    next ? `<a class="case-nav-link case-nav-next" href="/case/${next.slug}/"><small>下一個案例</small>${esc(next.title)}</a>` : '<span></span>',
  ].join('')

  return `      <main id="main" class="case-page section">
        <p class="eyebrow">CASE ${String(index).padStart(2, '0')} / ${String(total).padStart(2, '0')}</p>
        <h1>${esc(title)}</h1>
        ${lead ? `<p class="case-lead">${esc(lead)}</p>` : ''}
        ${chips}
        ${note ? `<p class="case-note">${marked.parseInline(note)}</p>` : ''}
${demoBlock(slug)}        ${toc}
        <article class="prose">
${content}
        </article>
        <nav class="case-nav" aria-label="案例導覽">${nav}</nav>
        <p class="case-home"><a href="/#work">← 回作品集總覽</a></p>
      </main>
`
}

let CSS_HREF = '/assets/index.css'

async function main() {
  const assets = await readdir(join(DIST, 'assets'))
  CSS_HREF = `/assets/${assets.find((f) => f.endsWith('.css'))}`

  const slugs = (await readdir(ROOT, { withFileTypes: true }))
    .filter((e) => e.isDirectory() && CASE_DIR.test(e.name))
    .map((e) => e.name)
    .sort()

  // 先讀一輪標題，前後導覽才有名字可用
  const cases = []
  for (const slug of slugs) {
    const md = await readFile(join(ROOT, slug, 'README.md'), 'utf8')
    cases.push({ slug, md, ...extractFrontMatter(md) })
  }

  const urls = [{ loc: `${SITE}/`, priority: '1.0' }]

  for (const [i, item] of cases.entries()) {
    const { slug, title, lead, note, badges, body } = item
    const parsed = rewriteLinks(marked.parse(body), slug)
    const { html: content, toc } = withToc(parsed)
    const ogImage = existsSync(join(ROOT, 'public/images/cases', slug, 'og.jpg'))
      ? `${SITE}/images/cases/${slug}/og.jpg`
      : `${SITE}/images/og-cover.jpg`
    const canonical = `${SITE}/case/${slug}/`

    const html = page({
      title,
      description: lead || note || title,
      canonical,
      ogImage,
      body: caseBody({
        index: i + 1,
        total: cases.length,
        title, lead, note, badges, toc, content, slug,
        prev: cases[i - 1],
        next: cases[i + 1],
      }),
    })

    await mkdir(join(DIST, 'case', slug), { recursive: true })
    await writeFile(join(DIST, 'case', slug, 'index.html'), html)
    urls.push({ loc: canonical, priority: '0.8' })
    console.log(`case/${slug}/`.padEnd(40), `${(html.length / 1024).toFixed(0)} KB`)

    // 案例資料夾裡的補充文件（例如成效報告）也一起產頁
    const extras = (await readdir(join(ROOT, slug))).filter((f) => f.endsWith('.md') && f !== 'README.md')
    for (const file of extras) {
      const sub = kebab(file.replace(/\.md$/, ''))
      const raw = await readFile(join(ROOT, slug, file), 'utf8')
      const front = extractFrontMatter(raw)
      const subParsed = rewriteLinks(marked.parse(front.body), slug)
      const subToc = withToc(subParsed)
      const subCanonical = `${SITE}/case/${slug}/${sub}/`
      const subHtml = page({
        title: front.title,
        description: front.lead || front.note || front.title,
        canonical: subCanonical,
        ogImage,
        body: `      <main id="main" class="case-page section">
        <p class="eyebrow"><a href="/case/${slug}/">${esc(title)}</a> / 補充文件</p>
        <h1>${esc(front.title)}</h1>
        ${front.lead ? `<p class="case-lead">${esc(front.lead)}</p>` : ''}
        ${subToc.toc}
        <article class="prose">
${subToc.html}
        </article>
        <p class="case-home"><a href="/case/${slug}/">← 回 ${esc(title)}</a></p>
      </main>
`,
      })
      await mkdir(join(DIST, 'case', slug, sub), { recursive: true })
      await writeFile(join(DIST, 'case', slug, sub, 'index.html'), subHtml)
      urls.push({ loc: subCanonical, priority: '0.5' })
      console.log(`case/${slug}/${sub}/`.padEnd(40), `${(subHtml.length / 1024).toFixed(0)} KB`)
    }
  }

  const today = new Date().toISOString().slice(0, 10)
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <priority>${u.priority}</priority>
  </url>`).join('\n')}
</urlset>
`
  await writeFile(join(DIST, 'sitemap.xml'), sitemap)
  console.log(`\n${cases.length} 個案例頁，sitemap 收錄 ${urls.length} 個網址`)
}

main()
