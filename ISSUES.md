# 案例示範影片：進度

**16 個案例中有 14 支影片（2026-09-11）。**

下架的兩支（依使用者判斷，檔案在 `video-raw/removed/`，要放回就搬回 `public/videos/<分類>/`
並補回 `build-cases.mjs` 的 `DEMO_NOTES`）：

| 案例 | 原因 |
|---|---|
| `11-mothersday-lottery` | 使用者決定不放 |
| `06-erp-automation-spider` | 使用者決定不放 |

`15-meta-ads-warroom` 在 2026-09-11 重錄過一次。第一版把整份戰情室從頭捲到尾，
裡面有廣告帳戶命名體系（`JJF_2026Q3_...`、`BROAD-CORE_25-49_...`）、受眾地理半徑
（草屯 40 公里內）、曝光與觸及絕對值、粉專互動數，以及頁尾的 Meta 廣告帳戶 ID。
現在的版本**整塊移除**那些區段（不是打碼），只留判讀方法、預算實驗設計、官網健康檢查與資料口徑聲明。
移除清單寫在 `record-local-demos.mjs` 的 `DROP_SECTIONS` / `DROP_BLOCKS`。

錄製與去敏的規則在 `docs/video-guide.md`，不在這裡重複。本檔只留下做的過程中
踩到、之後還會再遇到的東西。

---

## 剩下的唯一缺口

`12-webar-park-guide` 的 **AR 實景導航段**只有地圖沒有 AR。桌面 Chromium 沒有相機也沒有
羅盤，那頁在自動化環境下只會顯示說明文字而且版面是壞的。要補的話只能拿手機到園區現場錄。

---

## 這輪確立的做法

### 1. 先找專案自己的 mock 開關

`02-payment-system`（`jojozoo-control`）與 `13-customer-service-automation`（`jojozoo-support`）
的 `apps/web/.env.local` 本來就有 `NEXT_PUBLIC_USE_MOCK=true`，資料是作者準備的預覽資料，
連顧客名都已經是「示範顧客 A」。**碰到新案例先看有沒有這種開關**，比自己造假資料快也更貼近真實行為。

### 2. 攔截的層級要看後端怎麼寫

| 案例 | 攔在哪 | 為什麼 |
|---|---|---|
| `07` | `**script.google.com/**` | Apps Script 用 `GET ?action=issue` 做寫入，write-guard 擋不住 |
| `03` | `**supabase.co/**` + 換掉 `VITE_SUPABASE_URL` | Edge Function 與 RPC 都在同一個網域 |
| `10` | `**gstatic.com/firebasejs/**` 回傳假模組 | Firestore 走 SDK，攔 HTTP 沒用，要換掉模組本身 |
| `13` | 所有非 localhost 的請求 | `.env.local` 裡有正式 Chatwoot token，不能讓它打出去 |
| `14` | `**/api/**` | 狀態全走自家 API，整批 mock 就不需要 D1 |

### 3. 沒有圖形介面就拿真實產出來呈現

不重建假的系統畫面。`06` 用執行 log 原文、`08` 用實際 config 的座標、`16` 用分析報告原文，
分別對應 `lib/render-terminal-page.mjs`、`lib/render-clickmap-page.mjs`、`lib/render-report-page.mjs`。
`15` 更直接：`jojofbAds\廣告戰情室.html` 本來就是做好的報表頁，開起來錄就好。

### 4. dev server 要固定埠並在啟動前清乾淨

`next dev --port` 撞到佔用會直接失敗而不是換埠；而 shell → npx → node 至少三層，
`taskkill /T` 有時追不到最底下那個。現在 `startDevServer` 會先 `freePort(port)`，
`record`/`probe` 也用 try/finally 確保動線爆掉時 dev server 還是會被收掉。

---

## Parking Lot

- `lib/write-guard.mjs` 只擋非 GET。用 GET 做寫入的後端它擋不住，目前靠各案例自己 mock。
  若之後再出現同類後端，考慮讓 guard 支援「依 query 參數判定寫入」。
- `04-children-drawing-contest` 的燈箱在自動化點擊下開不起來，動線目前繞過它，原因未查。
- `08-pos-autoclicker` 的 tkinter GUI 在非互動 session 下起不來（試過 `ImageGrab` 與
  PowerShell 兩種截圖方式都沒產出）。若哪天要拍真實視窗，得在互動桌面 session 手動執行。
- `jojozoo-control` 的 pnpm 會想清掉整個 `node_modules` 重裝，無 TTY 直接中止；
  目前繞過方式是在 `apps/web` 直接跑 `npx next dev`。
