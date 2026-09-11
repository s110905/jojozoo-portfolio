// 把錄影檔壓成網站要用的格式，順便處理去敏。
//
//   node scripts/process-video.mjs <輸入檔> <案例 slug> [選項]
//
// 選項：
//   --trim 3,22          只保留第 3 秒到第 22 秒
//   --hide x,y,w,h       遮蔽一塊區域，可重複；座標以「原始影片畫素」為準
//   --hide x,y,w,h@5-12  只在第 5 到 12 秒之間遮
//   --poster 4           用第 4 秒的畫面當封面（預設 1 秒）
//   --fps 24             輸出幀率（預設 24）
//   --crf 28             畫質，數字越大檔案越小（預設 28）
//
// 遮蔽用的是先降取樣再放大回去的馬賽克，不是單純模糊，
// 還原不出原本的文字。座標可先用 --probe 產生的格線截圖對照。
//
// 產出：public/videos/<slug>.mp4 / .webm / .jpg

import { spawnSync } from 'node:child_process'
import { mkdirSync, statSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { categoryOf, videoPath } from './lib/video-categories.mjs'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const OUT_DIR = join(ROOT, 'public', 'videos')
const CANVAS = { width: 1280, height: 720 }
const BACKDROP = '0x07111f' // 與網站底色一致，直式來源留白才不突兀

const [, , input, slug, ...rest] = process.argv
if (!input || !slug) {
  console.error('用法： node scripts/process-video.mjs <輸入檔> <案例 slug> [--trim a,b] [--hide x,y,w,h[@a-b]] [--poster 秒] [--probe]')
  process.exit(1)
}

const opts = { hide: [], poster: 1, fps: 24, crf: 28, probe: false }
for (let i = 0; i < rest.length; i++) {
  const [key, value] = [rest[i], rest[i + 1]]
  if (key === '--trim') { opts.trim = value.split(',').map(Number); i++ }
  else if (key === '--hide') { opts.hide.push(value); i++ }
  else if (key === '--poster') { opts.poster = Number(value); i++ }
  else if (key === '--fps') { opts.fps = Number(value); i++ }
  else if (key === '--crf') { opts.crf = Number(value); i++ }
  else if (key === '--probe') opts.probe = true
}

function run(args, label) {
  const res = spawnSync('ffmpeg', args, { encoding: 'utf8' })
  if (res.status !== 0) {
    console.error(`${label} 失敗：\n${res.stderr?.split('\n').slice(-12).join('\n')}`)
    process.exit(1)
  }
}

function probeSize(file) {
  const res = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0',
    '-show_entries', 'stream=width,height', '-of', 'csv=p=0:s=x', file], { encoding: 'utf8' })
  const [width, height] = res.stdout.trim().split('x').map(Number)
  return { width, height }
}

const source = probeSize(input)
const portrait = source.width < source.height

/** 馬賽克遮罩：裁下區域、降到 1/16 再用最近鄰放大回去，文字不可還原。 */
function hideFilters(specs) {
  let chain = ''
  let label = '[scaled]'
  specs.forEach((spec, i) => {
    const [box, window] = spec.split('@')
    const [x, y, w, h] = box.split(',').map(Number)
    const between = window
      ? `:enable='between(t,${window.split('-')[0]},${window.split('-')[1]})'`
      : ''
    const next = i === specs.length - 1 ? '[hidden]' : `[h${i}]`
    chain +=
      `${label}split=2[keep${i}][cut${i}];` +
      `[cut${i}]crop=${w}:${h}:${x}:${y},scale=${Math.max(2, Math.round(w / 16))}:${Math.max(2, Math.round(h / 16))}:flags=neighbor,` +
      `scale=${w}:${h}:flags=neighbor,boxblur=4:1[mask${i}];` +
      `[keep${i}][mask${i}]overlay=${x}:${y}${between}${next};`
    label = next
  })
  return { chain, label }
}

// setsar=1 必要：手機錄的來源像素比不是 1:1，不重設會被拉寬幾個 px
const fit = (portrait
  ? `scale=-2:${CANVAS.height},pad=${CANVAS.width}:${CANVAS.height}:(ow-iw)/2:0:${BACKDROP}`
  : `scale=${CANVAS.width}:${CANVAS.height}:force_original_aspect_ratio=decrease,` +
    `pad=${CANVAS.width}:${CANVAS.height}:(ow-iw)/2:(oh-ih)/2:${BACKDROP}`) + ',setsar=1'

// 遮蔽座標以原始畫素為準，所以先遮再縮放
const hide = hideFilters(opts.hide)
const filter = opts.hide.length
  ? `[0:v]null[scaled];${hide.chain}${hide.label}fps=${opts.fps},${fit}[v]`
  : `[0:v]fps=${opts.fps},${fit}[v]`

const trim = opts.trim ? ['-ss', String(opts.trim[0]), '-to', String(opts.trim[1])] : []

if (opts.probe) {
  // 疊上 100px 格線，方便量出要遮的座標
  const grid = join(ROOT, 'video-raw', `${slug}-grid.jpg`)
  mkdirSync(dirname(grid), { recursive: true })
  run(['-v', 'error', '-ss', String(opts.poster), '-i', input, '-vf',
    'drawgrid=w=100:h=100:t=1:c=red@0.55,drawgrid=w=500:h=500:t=2:c=yellow@0.8',
    '-frames:v', '1', '-y', grid], '格線截圖')
  console.log(`原始尺寸 ${source.width}x${source.height}`)
  console.log(`格線截圖： video-raw/${slug}-grid.jpg`)
  console.log('紅線每 100 px、黃線每 500 px，都從左上角 (0,0) 起算，用來量 --hide 的 x,y,w,h。')
  process.exit(0)
}

// 影片依分類放進子資料夾，開檔案總管時才找得到東西（對應表在 lib/video-categories.mjs）
const outDir = join(OUT_DIR, categoryOf(slug))
mkdirSync(outDir, { recursive: true })
const base = join(outDir, slug)

run(['-v', 'error', ...trim, '-i', input, '-filter_complex', filter, '-map', '[v]', '-an',
  '-c:v', 'libx264', '-crf', String(opts.crf), '-preset', 'slow', '-profile:v', 'high', '-pix_fmt', 'yuv420p',
  '-movflags', '+faststart', '-y', `${base}.mp4`], 'MP4 編碼')

run(['-v', 'error', ...trim, '-i', input, '-filter_complex', filter, '-map', '[v]', '-an',
  '-c:v', 'libvpx-vp9', '-crf', String(opts.crf + 8), '-b:v', '0', '-row-mt', '1', '-cpu-used', '2',
  '-y', `${base}.webm`], 'WebM 編碼')

run(['-v', 'error', '-ss', String(opts.poster), '-i', `${base}.mp4`, '-frames:v', '1',
  '-q:v', '4', '-y', `${base}.jpg`], '封面')

const kb = (f) => `${Math.round(statSync(f).size / 1024)} KB`
console.log(`${slug}  來源 ${source.width}x${source.height}${portrait ? '（直式，左右補底色）' : ''}` +
  `${opts.hide.length ? `，遮蔽 ${opts.hide.length} 區` : ''}`)
for (const ext of ['mp4', 'webm', 'jpg']) {
  console.log(`  public/${videoPath(slug, ext)}`.padEnd(52) + kb(`${base}.${ext}`))
}
