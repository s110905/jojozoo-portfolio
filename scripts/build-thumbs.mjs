// 把示範影片的海報圖壓成首頁產品條要用的小縮圖（public/images/thumbs/<slug>.webp）。
//
// 首頁產品條在首屏最上方，一次出現 14 張圖。直接用 1280×720 的海報原圖會多載近
// 800KB，把 hero 的 LCP 拖慢，所以另外壓一份 480px 寬的 webp。
//
// **這支不掛在 npm run build 上**：Cloudflare Pages 的建置環境沒有 ffmpeg，跑了會失敗。
// 產物直接進版控，只有在重錄示範影片、換掉海報圖時才需要手動重跑：
//
//   node scripts/build-thumbs.mjs
import { execFile } from 'node:child_process'
import { mkdir, access } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'
import { VIDEO_CATEGORY } from './lib/video-categories.mjs'

const run = promisify(execFile)
const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const PUBLIC = join(ROOT, 'public')
const OUT = join(PUBLIC, 'images', 'thumbs')

const WIDTH = 480 // 顯示寬度約 240px，留 2x 給高密度螢幕

await mkdir(OUT, { recursive: true })

let made = 0
let skipped = 0
for (const [slug, category] of Object.entries(VIDEO_CATEGORY)) {
  const poster = join(PUBLIC, 'videos', category, `${slug}.jpg`)
  try {
    await access(poster)
  } catch {
    // 沒錄示範影片的案例不會有海報圖，跳過就好，不是錯誤。
    skipped += 1
    continue
  }
  const out = join(OUT, `${slug}.webp`)
  await run('ffmpeg', [
    '-y',
    '-loglevel', 'error',
    '-i', poster,
    '-vf', `scale=${WIDTH}:-2`,
    '-c:v', 'libwebp',
    '-quality', '72',
    out,
  ])
  made += 1
}

console.log(`縮圖完成：${made} 張，略過 ${skipped} 個沒有海報圖的案例`)
