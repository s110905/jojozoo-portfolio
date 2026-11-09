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

- `META-20261018-01` Vite dev 的報告目錄網址會回傳首頁，明確 index.html 可正確讀取；built preview 目錄網址正常。dev 目錄解析另題處理。
- ~~`META-20261018-01` 圖片只讀稽核：報告 Meta 完整底圖右下紫色腳印、GA4 完整底圖左上藍色「所」圖示用途未確認，兩者均在 SVG 裁切顯示區外。保留原圖，由使用者決定；圖片清單見本次對話紀錄。~~
  - 2026-11-09 結案：放大判讀為 Meta 廣告管理員右下浮動按鈕與 GA4「所有使用者」比較區段標籤，皆為平台介面元素、非識別資訊；使用者同意保留原圖，不處理。
- `META-20261018-01` 既有 `test:ui` 固定 4173，該埠被 PID 27428 占用，原命令 exit1；不終止原程序，臨時副本改用 4191 補驗。是否讓測試支援指定埠另題處理。

- `lib/write-guard.mjs` 只擋非 GET。用 GET 做寫入的後端它擋不住，目前靠各案例自己 mock。
  若之後再出現同類後端，考慮讓 guard 支援「依 query 參數判定寫入」。
- `04-children-drawing-contest` 的燈箱在自動化點擊下開不起來，動線目前繞過它，原因未查。
- `08-pos-autoclicker` 的 tkinter GUI 在非互動 session 下起不來（試過 `ImageGrab` 與
  PowerShell 兩種截圖方式都沒產出）。若哪天要拍真實視窗，得在互動桌面 session 手動執行。
- `jojozoo-control` 的 pnpm 會想清掉整個 `node_modules` 重裝，無 TTY 直接中止；
  目前繞過方式是在 `apps/web` 直接跑 `npx next dev`。


## META-20261018-01：既有 Meta 廣告案例接案優化

- 狀態：DONE（RUNNING → VERIFYING → REVIEWING → DONE）
- 目標：在原報告補齊合作方案、投放判斷及洽詢流程，首頁連至方案，圖片只讀檢查。
- 範圍：src/App.tsx、public/reports/meta-ads-2026-09/index.html／styles.css、ISSUES.md、本次 docs/conversations 紀錄；不新增重複頁，不改指標／同意公開聲明。
- 基準：master@65f9753f9abca46918c094fa07768eb840a4c9c6；原有 docs/conversations 未追蹤保留。
- 驗收：npm run build、npm run test:analytics、npm run test:ui、git diff --check 均 exit0；dev server桌機1440與手機390檢查文案、連結與排版。原始圖片位元組保持一致。
- 重試：0；完成 commit：不提交（使用者限制）。
- 證據：build、analytics、diff check exit0；原始 test:ui 因4173占用exit1，僅替換埠4191與臨時副本root路徑補驗PASS（exit0）。dev 1440/390以明確index.html檢查；built preview 1440/390首頁#services跳轉皆PASS。七處圖片引用與HEAD一致，獨立diff審查無阻擋。證據位於.vite/meta-service-20261018/。圖片兩處圖示待決、回覆時間待填，均依需求保留；新發現列入Parking Lot。


## META-20261018-02：改以代操為主要服務

- 狀態：DONE
- 需求：依使用者修訂，移除陪跑教學，廣告代操為主推、帳戶健檢為次要選項。
- 範圍：原 App.tsx、報告 index.html／styles.css、本議題與對話紀錄；保留前題未提交變更。
- 基準：master@65f9753；不commit/push/部署。
- 驗收：build、analytics、既有UI測試替代埠及diff check通過；桌機兩欄／手機單欄，代操排序第一且無陪跑教學。
- 重試：產品0次；證據：build、analytics、diff check通過。UI替代埠測試首次與build同時執行，遇建置中檔案而斷言失敗；建置完成後相同腳本重跑PASS。dev桌機1440兩欄、手機390單欄、代操第一與無陪跑教學皆PASS，主代理目視確認；證據.vite/meta-service-20261018/revision-*。


## META-20261018-03：僅保留廣告代操並調整呈現

- 狀態：DONE
- 需求：依使用者要求移除健檢，將多方案比較改為單一代操服務說明與合作流程。
- 範圍：App.tsx、原報告index.html／styles.css、議題與紀錄；保留前題差異。
- 基準：master@65f9753；不commit/push/部署。
- 驗收：build、analytics、UI替代埠、diff check；dev1440／390單一代操內容、流程、無健檢／教學、無溢出。
- 重試：產品0次；證據：build、analytics、4191替代埠UI、diff check exit0。dev1440／390單一服務、三步流程、無健檢／教學、錨點與無溢出PASS；主代理目視確認。腳本初次沿用舊CTA文字導致逾時，改依#inquiry語意定位重跑PASS。證據.vite/meta-service-20261018/single-service-*。

### 接續發布授權（2026-10-18）

- 使用者定稿後另明確要求部署；以上不commit／push／部署為前階段邊界，本次授權發布既有單一廣告代操版本。
- 沿用 s110905/jojozoo-portfolio 的 master 與既有 Cloudflare Pages toyo-chang Git 整合，不變更帳號、secret 或部署設定。
- 本批四檔經獨立唯讀審查無阻擋，built preview 桌機1440／手機390入口至服務與洽詢區皆PASS。圖片副本與對話紀錄不提交。正式 commit、deployment 與驗收結果記於本機同 session 對話紀錄。
