// 預渲染用的進入點。scripts/prerender.mjs 會在 vite build 之後呼叫它，
// 把首頁渲染成靜態 HTML 塞進 dist/index.html 的 #root。
//
// 為什麼需要：案例頁本來就是靜態 HTML，只有首頁是純 client-side React，
// 原本 HTML 裡只有一個空的 <div id="root">。Google 雖然會執行 JS，但要排
// 第二輪渲染才索引；Bing 與 LINE、Facebook 的預覽爬蟲則直接抓不到任何文字。
//
// 這裡不包 StrictMode：它只影響開發期的重複呼叫檢查，對輸出的 HTML 沒有意義。
import { renderToString } from 'react-dom/server'
import App from './App'

export const render = () => renderToString(<App />)
