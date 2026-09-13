// 把首頁預渲染成靜態 HTML，寫回 dist/index.html。
//
// 在 `vite build` 與 `vite build --ssr` 之後執行：讀 dist-ssr 裡的 SSR bundle，
// 呼叫它的 render()，把結果塞進 dist/index.html 那個空的 <div id="root"></div>。
//
// 用 react-dom/server 而不是無頭瀏覽器，是因為建置要能在 Cloudflare Pages 上跑——
// 那邊沒有 Chromium 可以裝。純 Node 的 SSR 到哪都跑得起來。
//
// 前端行為不變：main.tsx 仍然用 createRoot().render() 接手，React 會直接
// 覆蓋掉預渲染的內容（不是 hydrate，所以不會有 hydration mismatch 警告）。
import { readFile, writeFile } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const INDEX = join(ROOT, 'dist', 'index.html')
const SSR_ENTRY = join(ROOT, 'dist-ssr', 'entry-server.js')

const EMPTY_ROOT = '<div id="root"></div>'

const { render } = await import(pathToFileURL(SSR_ENTRY).href)
const html = render()

const template = await readFile(INDEX, 'utf8')
if (!template.includes(EMPTY_ROOT)) {
  // index.html 的 #root 寫法一旦改掉，這裡會安靜地失效，所以直接讓建置失敗。
  throw new Error(`dist/index.html 找不到 ${EMPTY_ROOT}，預渲染沒有可注入的位置`)
}

await writeFile(INDEX, template.replace(EMPTY_ROOT, `<div id="root">${html}</div>`))
console.log(`首頁預渲染完成：${(html.length / 1024).toFixed(0)} KB 靜態 HTML`)
