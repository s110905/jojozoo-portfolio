// 把每個頁面內容來源的「最後修改日期」從 git 抓出來，存成 scripts/lastmod.json。
//
// 為什麼不在建置時直接查 git：Cloudflare Pages 用淺層 clone，`git log -1 -- <path>`
// 在那邊對所有路徑都回同一個日期（實測線上 sitemap 因此只剩一個日期）。查詢要在
// 有完整歷史的本機做，結果進版控，建置時只是讀檔。
//
// 跟 build-thumbs.mjs、build-og-cover.mjs 一樣是本機手動跑的產生器。改動案例內容
// 後重跑，日期才會跟著更新：
//
//   node scripts/build-lastmod.mjs
import { readdir, writeFile } from 'node:fs/promises'
import { execFile } from 'node:child_process'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = join(ROOT, 'scripts', 'lastmod.json')
const CASE_DIR = /^\d\d-/

const gitDate = async (path) => {
  const { stdout } = await run('git', ['log', '-1', '--format=%cs', '--', path], { cwd: ROOT })
  const date = stdout.trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(date) ? date : null
}

const paths = ['src', 'index.html']
const slugs = (await readdir(ROOT, { withFileTypes: true }))
  .filter((e) => e.isDirectory() && CASE_DIR.test(e.name))
  .map((e) => e.name)
  .sort()

for (const slug of slugs) {
  paths.push(slug)
  const extras = (await readdir(join(ROOT, slug))).filter(
    (f) => f.endsWith('.md') && f !== 'README.md',
  )
  for (const file of extras) paths.push(`${slug}/${file}`)
}

const map = {}
for (const path of paths) {
  const date = await gitDate(path)
  if (date) map[path] = date
}

await writeFile(OUT, `${JSON.stringify(map, null, 2)}\n`)

const dates = [...new Set(Object.values(map))].sort()
console.log(`lastmod.json 完成：${Object.keys(map).length} 個路徑，${dates.length} 個日期（${dates[0]} ~ ${dates[dates.length - 1]}）`)
