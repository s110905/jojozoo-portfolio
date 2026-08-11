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

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DIST = join(ROOT, 'dist')
const SITE = 'https://toyo-chang.pages.dev'
const AUTHOR = '張文豪 Toyo Chang'
const CASE_DIR = /^\d\d-/
const REPO = 'https://github.com/s110905/jojozoo-portfolio'

// 有 public/videos/<slug>.mp4 的案例會自動長出示範影片區塊。
// 說明文字要老實交代這支是怎麼錄的。
const DEMO_NOTES = {
  '01-summer-camp': '正式上線的報名頁實際畫面。錄製過程只瀏覽頁面，未填寫或送出任何報名資料。',
  '09-jojozoocart': '正式上線系統的前台租借流程與後台核銷、逐車使用分析。錄製時攔截所有寫入請求，未產生任何紀錄；顧客姓名、電話與金額在畫面渲染前即已置換。',
  '11-mothersday-lottery': '活動檔期已結束，此為活動頁面的保留畫面。',
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
  if (!existsSync(join(ROOT, 'public/videos', `${slug}.mp4`))) return ''
  const caption = DEMO_NOTES[slug] ?? '實際上線畫面錄製。'
  return `        <figure class="case-demo">
          <video controls preload="none" playsinline muted width="1280" height="720" poster="/videos/${slug}.jpg">
            <source src="/videos/${slug}.webm" type="video/webm" />
            <source src="/videos/${slug}.mp4" type="video/mp4" />
            <a href="/videos/${slug}.mp4">下載示範影片</a>
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
        <p class="case-source">
          <a target="_blank" rel="noreferrer" href="${REPO}/tree/master/${slug}">在 GitHub 上看這個案例的原始文件 ↗</a>
        </p>
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
