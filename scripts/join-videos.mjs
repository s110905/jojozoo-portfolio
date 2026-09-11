// 把多段已處理好的影片接成一支，段落之間插入標題卡。
//
//   node scripts/join-videos.mjs <案例 slug> <片段1.mp4> "標籤1" <片段2.mp4> "標籤2" ...
//
// 例：
//   node scripts/join-videos.mjs 09-jojozoocart \
//     video-raw/cart-front.mp4 "前台 · 現場掃碼租借" \
//     video-raw/cart-admin.mp4 "後台 · 核銷與營運管理"
//
// 各片段請先用 process-video.mjs 處理過（去敏、裁切、正規化成 1280x720）。
// 這裡只負責接起來，不會再做遮蔽——遮蔽一定要在上一步完成。
//
// 產出：public/videos/<分類>/<slug>.mp4 / .webm / .jpg

import { spawnSync } from 'node:child_process'
import { mkdirSync, rmSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { categoryOf, videoPath } from './lib/video-categories.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'videos')
const TMP_DIR = join(ROOT, 'video-raw', '.join')
const W = 1280
const H = 720
const FPS = 24
const BACKDROP = '0x07111f'
const FONT = 'C\\:/Windows/Fonts/msjhbd.ttc'
const CARD_SECONDS = 1.6

const [, , slug, ...rest] = process.argv
if (!slug || rest.length < 2 || rest.length % 2 !== 0) {
  console.error('用法： node scripts/join-videos.mjs <slug> <片段.mp4> "標籤" [<片段.mp4> "標籤" ...]')
  process.exit(1)
}

const parts = []
for (let i = 0; i < rest.length; i += 2) parts.push({ file: rest[i], label: rest[i + 1] })

function run(args, label) {
  const res = spawnSync('ffmpeg', args, { encoding: 'utf8' })
  if (res.status !== 0) {
    console.error(`${label} 失敗：\n${res.stderr?.split('\n').slice(-12).join('\n')}`)
    process.exit(1)
  }
}

rmSync(TMP_DIR, { recursive: true, force: true })
mkdirSync(TMP_DIR, { recursive: true })
mkdirSync(join(OUT_DIR, categoryOf(slug)), { recursive: true })

// 標題卡：純色底 + 置中文字，長度固定
const escapeText = (s) => s.replace(/([:'\\])/g, '\\$1')
const cards = parts.map((part, i) => {
  const out = join(TMP_DIR, `card-${i}.mp4`)
  run([
    '-v', 'error', '-f', 'lavfi', '-i', `color=c=${BACKDROP}:s=${W}x${H}:d=${CARD_SECONDS}:r=${FPS}`,
    '-vf',
    `drawtext=fontfile='${FONT}':text='${escapeText(part.label)}':fontcolor=0xf3f7ff:fontsize=46:x=(w-text_w)/2:y=(h-text_h)/2-18,` +
    `drawbox=x=(iw-160)/2:y=ih/2+46:w=160:h=2:color=0x48a8ff@0.9:t=fill,setsar=1`,
    '-c:v', 'libx264', '-crf', '30', '-preset', 'medium', '-pix_fmt', 'yuv420p', '-y', out,
  ], `標題卡 ${i + 1}`)
  return out
})

// 把每段重新正規化，確保尺寸、幀率與像素比一致，接起來才不會跳動
const inputs = []
const filters = []
let index = 0
for (const [i, part] of parts.entries()) {
  for (const file of [cards[i], part.file]) {
    inputs.push('-i', file)
    filters.push(
      `[${index}:v]scale=${W}:${H}:force_original_aspect_ratio=decrease,` +
      `pad=${W}:${H}:(ow-iw)/2:(oh-ih)/2:${BACKDROP},fps=${FPS},setsar=1[v${index}]`,
    )
    index++
  }
}
const concat = `${filters.join(';')};${Array.from({ length: index }, (_, i) => `[v${i}]`).join('')}concat=n=${index}:v=1:a=0[out]`

const base = join(OUT_DIR, categoryOf(slug), slug)
run(['-v', 'error', ...inputs, '-filter_complex', concat, '-map', '[out]', '-an',
  '-c:v', 'libx264', '-crf', '29', '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', '-y', `${base}.mp4`], 'MP4 合併')

run(['-v', 'error', ...inputs, '-filter_complex', concat, '-map', '[out]', '-an',
  '-c:v', 'libvpx-vp9', '-crf', '37', '-b:v', '0', '-row-mt', '1', '-cpu-used', '2',
  '-y', `${base}.webm`], 'WebM 合併')

// 封面取第一段內容的畫面，不要取到標題卡
run(['-v', 'error', '-ss', String(CARD_SECONDS + 2), '-i', `${base}.mp4`, '-frames:v', '1',
  '-q:v', '4', '-y', `${base}.jpg`], '封面')

rmSync(TMP_DIR, { recursive: true, force: true })

const kb = (f) => `${Math.round(statSync(f).size / 1024)} KB`
console.log(`${slug}  合併 ${parts.length} 段：${parts.map((p) => p.label).join(' → ')}`)
for (const ext of ['mp4', 'webm', 'jpg']) {
  console.log(`  public/${videoPath(slug, ext)}`.padEnd(52) + kb(`${base}.${ext}`))
}
