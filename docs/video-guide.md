# 作品示範影片：錄製與去敏流程

案例頁只要在 `public/videos/<分類>/` 找到 `<slug>.mp4`，就會自動在標題下方長出示範影片區塊，
所以流程只有兩步：**產出影片 → 放進 `public/videos/` → 重新 build**。

影片依分類放在子資料夾，開檔案總管時才好找：

```
public/videos/
├── 營運系統/      01、02、03、05、09、12
├── 行銷活動/      04、07、10、11、14、15、16
└── 自動化與AI/    06、08、13
```

分類對應表在 `scripts/lib/video-categories.mjs`，`process-video.mjs` 輸出與
`build-cases.mjs` 產生的網址都走同一份。**新增案例要記得加進去**，沒列到的會掉進 `未分類/`。
分類與首頁案例庫用的是同一套（`src/App.tsx` 的 `category`），改動時兩邊要一起改。

## 一、目前已完成

錄製腳本有兩支，差別只在「網站從哪裡來」：

| 腳本 | 錄什麼 |
|---|---|
| `scripts/record-demos.mjs` | 已公開上線、直接連正式網址的站 |
| `scripts/record-local-demos.mjs` | 需要在本機把 dev server 叫起來的專案（原始碼在 `D:\我的專案` 底下） |

**16 個案例中有 14 支影片。** `11-mothersday-lottery` 與 `06-erp-automation-spider`
依使用者判斷不放，檔案留在 `video-raw/removed/`。

| 案例 | 腳本 | 說明 |
|---|---|---|
| `01-summer-camp` | record-demos | 正式報名頁巡覽，含報名表單、日曆、匯款流程、進度查詢 |
| `02-payment-system` | record-local-demos | 請款審核 → 切換身分只剩唯讀 → 權限矩陣先擋後放 |
| `03-hotel-partner-system` | record-local-demos | 建券 → 現場掃碼 → 分次扣額（Supabase 全程 mock） |
| `04-children-drawing-contest` | record-local-demos | 活動頁 → 作品藝廊 → 票數排行；畫作與姓名全為替身 |
| `05-ticket-price-calculator` | record-local-demos | 選日期 → 填人數與身分優惠 → 自動算出最省組合 |
| ~~`06-erp-automation-spider`~~ | record-local-demos | 執行 log 原文逐行播放——**已下架**，做法仍可參考 |
| `07-kuangsan-collaboration` | record-local-demos | 領券 → QR 體驗券 → 現場掃碼核銷（後端全程 mock） |
| `08-pos-autoclicker` | record-local-demos | 依實際 config 繪製的點擊動線圖 |
| `09-jojozoocart` | record-demos | 正式站即時車輛狀態、選車與租借表單流程（手機版面） |
| `10-line-lucky-draw` | record-local-demos | 轉盤 → 中獎券 → 核銷 → 後台統計（LIFF 與 Firestore 皆替身） |
| ~~`11-mothersday-lottery`~~ | record-demos | 活動頁保留畫面——**已下架** |
| `12-webar-park-guide` | record-local-demos | 園區地圖、定位、景點資訊與即時距離 |
| `13-customer-service-automation` | record-local-demos | AI 草稿 → 人工編輯 → 送出前收件人確認 |
| `14-anniversary-find-four` | record-local-demos | 來源問卷 → 掃碼集點 → 升等 → 核銷解鎖 |
| `15-meta-ads-warroom` | record-local-demos | 戰情室的判讀方法與上線檢查；帳戶結構、受眾與絕對值整塊移除 |
| `16-seo-analytics` | record-local-demos | 實際產出的 GA4 分析報告原文 |

重跑指令：

```bash
node scripts/record-demos.mjs                          # 全部線上站
node scripts/record-demos.mjs 09-jojozoocart           # 單一

node scripts/record-local-demos.mjs                    # 全部本機站
node scripts/record-local-demos.mjs 05-ticket-price-calculator
node scripts/record-local-demos.mjs 04-children-drawing-contest --probe   # 只看畫面結構
```

`--probe` 會啟動 dev server、打開頁面，把標題、可點元素、輸入欄位與整頁截圖寫到
`video-raw/probe-<slug>.txt` / `.png`。**寫動線之前先跑它**，可以省掉大半的選擇器猜測——
按鈕上看到的文字常常不是它的 accessible name（票價日曆顯示「20」，實際是
`aria-label="2026 年 9 月 20 日，有優惠活動"`）。

### 錄正式站的兩道保護

改動線時不要拆掉：

1. 動線只瀏覽、不送出，避免在正式系統產生真實紀錄。
2. `lib/write-guard.mjs` 攔截並中止所有非 GET 請求；真的攔到會印在主控台。

**write-guard 只認 HTTP 方法，擋不住「用 GET 做寫入」的後端。** `07-kuangsan-collaboration`
的 Apps Script 就是 `GET ?action=issue` 建票、`?action=redeem` 核銷，交給 write-guard 等於沒防護。
這類後端一律改成整個端點 mock（見下一節）。碰到新案例先確認它的寫入長什麼樣，不要預設非 GET 就是全部。

另外 `01-summer-camp` 的動線**刻意跳過 y=720~2416 的活動剪影相簿**，那裡有可辨識的
遊客與兒童臉孔。頁面改版導致區塊位移時，這段座標要重新量。

### 錄本機站的三種手段

`record-local-demos.mjs` 的每個案例可以宣告這些欄位，用意都是「讓機敏資料根本不要進到瀏覽器」：

| 欄位 | 用途 | 實例 |
|---|---|---|
| `beforeGoto(context)` | 在開頁之前掛 route 攔截或 `addInitScript` | 07 攔 Apps Script、04 攔 Firebase Storage |
| `geolocation` | 授權定位並指定座標 | 12 用園區內的公開座標，距離才算得出來 |
| `wait` / `probeWait` | 換掉預設的 `networkidle` | 04 走 Firestore 長連線，永遠不會 idle，要用 `domcontentloaded` |

`04-children-drawing-contest` 是這套手段的完整示範：藝廊裡是真實兒童的畫作與姓名，
錄影時圖片請求全數攔下換成 `lib/fake-artwork.mjs` 產生的示意畫，姓名在渲染當下就換成
「小畫家 A/B/C…」。**畫面上的票數是真的，人和畫都是替身。**

### 沒有圖形介面的案例怎麼辦

有三個案例根本沒有畫面可錄：ERP 爬蟲是排程跑的、POS 助手是橫幅式桌面工具、
SEO 分析的產出是報告。這些**不重建假的系統畫面**，一律拿專案裡真實存在的產出來呈現：

| 案例 | 素材（真實） | 呈現（重現） |
|---|---|---|
| `06-erp-automation-spider` | `logs/run_*.log` 的執行紀錄原文 | `lib/render-terminal-page.mjs` 逐行播放 |
| `08-pos-autoclicker` | `dist/config_*.json` 的座標序列 | `lib/render-clickmap-page.mjs` 動線圖 |
| `16-seo-analytics` | GA4 唯讀分析報告的 markdown 原文 | `lib/render-report-page.mjs` 報告排版 |

原則是：**內容不得杜撰，排版可以重做。** 金額照樣遮（06 的「總收入」已遮），
筆數、天數、觸達率這些規模指標保留。`DEMO_NOTES` 必須老實寫出「這是 log 原文／
這是依實際設定檔繪製」，不能讓人以為那是系統的即時畫面。

`15-meta-ads-warroom` 不走這條路：`jojofbAds\廣告戰情室.html` 本來就是做好的報表頁，
直接 `file://` 開來錄。但**只遮金額並不夠**——那頁還有廣告帳戶命名體系、受眾地理半徑、
曝光與觸及絕對值，以及頁尾的 Meta 廣告帳戶 ID。這些是投放 know-how，比金額更值錢。

處理方式是**整塊移除而不是打碼**：打碼之後剩一堆星號，既不好看也沒有閱讀價值。
移除清單在 `record-local-demos.mjs` 的 `DROP_SECTIONS` / `DROP_BLOCKS`，留下來的是
判讀順序、預算實驗設計、官網健康檢查與資料口徑聲明——也就是這個案例真正的賣點：
**不只把廣告投出去，還能驗證它有沒有在正常運作。**

碰到這類「內部儀表板」的素材，先問一句：**這頁最值錢的是數字，還是產生數字的方法？**
通常是後者，而後者不需要前者也能講清楚。

## 二、只有實機才錄得到的

只剩一段需要人拿著手機到現場：

| 案例 | 缺什麼 | 錄之前先處理 |
|---|---|---|
| `12-webar-park-guide` 的 AR 段 | 桌面瀏覽器沒有相機與羅盤，AR 頁在自動化環境下版面是壞的 | 遮入鏡路人臉孔；目前站上那支只有地圖沒有 AR |

其餘案例都已經用 mock、替身資料或真實產出處理掉了，不需要人工錄製。
**兩個系統本來就內建 mock 模式**（`02-payment-system` 與 `13-customer-service-automation`
的 `.env.local` 有 `NEXT_PUBLIC_USE_MOCK=true`），資料是專案作者準備的預覽資料，
比自己造假資料更貼近真實行為——之後碰到新案例，先看它有沒有這種開關。

## 三、錄影設定

- **解析度**：桌機錄 1280×720；手機錄直接用手機原生尺寸即可，處理腳本會置中並補上網站底色。
- **長度**：15～25 秒。超過 30 秒沒人看完。
- **聲音**：不需要，輸出一律去除音軌。
- **畫面整潔**：關掉通知、書籤列、其他分頁；瀏覽器分頁標題與網址列會入鏡，注意裡面有沒有帳號資訊。
- **游標動線**：慢一點、停頓明確，快速亂晃在壓縮後會變成一團模糊。

## 四、去敏原則

採用的標準是**個資全遮、營收也遮、其餘營運數字保留**：

- 一律遮：顧客與員工姓名、電話、Email、身分證字號、地址、帳號、金鑰、可辨識的臉孔。
- 一律遮：**營收與金額**——營運儀表板的日／月營收、核銷紀錄的金額欄、任何 `NT$`／`元` 的數字。
  這是公司的商業資訊，不是個人作品的展示素材（2026-08-11 決定）。
- 保留：數量、梯次、使用時間、筆數、執行次數這類規模指標——這些是作品的說服力來源，
  而且不透露營收。例如「已執行 400+ 次」「管理 20,000+ 筆資料」可以留。

界線判準：**看得出系統規模的可以留，看得出公司賺多少的要遮。**

依這條判準，**對外公告的牌價不算營收**，可以留：`05-ticket-price-calculator` 的票價表與
單筆試算結果（成人票 $399、這趟共 $1,857）是任何人走到售票口都看得到的公開價目，
遮掉它等於把整支影片的內容抽掉。會透露營運規模的是「一天賣了多少」「這個月收了多少」，
那才是要遮的東西。`04-children-drawing-contest` 獎項區的「總價值約 6,500 元」照舊遮掉——
它跟系統功能無關，留著沒有好處（2026-09-11 補充）。

**最有效的去敏是錄之前就沒有機敏資料**：用測試帳號、測試分頁、假資料。事後遮蔽是補救，不是首選。

## 五、後製指令

```bash
# 1. 先看座標：產生一張疊了格線的截圖（紅線每 100 px、黃線每 500 px，從左上角起算）
node scripts/process-video.mjs 錄好的檔案.mp4 03-hotel-partner-system --probe --poster 5

# 2. 正式輸出：裁切時間、遮掉指定區域
node scripts/process-video.mjs 錄好的檔案.mp4 03-hotel-partner-system \
  --trim 4,26 \
  --hide 300,150,420,60 \
  --hide 880,400,300,80@6-14 \
  --poster 3
```

參數：

| 參數 | 用途 |
|---|---|
| `--trim a,b` | 只保留第 a 到第 b 秒 |
| `--hide x,y,w,h` | 遮蔽一塊區域，可重複使用 |
| `--hide x,y,w,h@a-b` | 只在第 a 到 b 秒之間遮（欄位捲動時用） |
| `--poster 秒` | 指定封面取自第幾秒（預設 1） |
| `--trim` 之外的畫質 | `--fps`（預設 24）、`--crf`（預設 28，數字越大檔越小） |

遮蔽用的是先降取樣再放大回去的馬賽克，不是單純模糊，還原不出原本的文字。
座標以**原始影片畫素**為準，不是輸出後的 1280×720。

輸出會產生三個檔：`.mp4`（H.264）、`.webm`（VP9）、`.jpg`（封面）。

## 六、把多段接成一支

一個案例只放一支影片。前台與後台要一起呈現時，先各自處理好，再接起來：

```bash
# 1. 兩段各自去敏、裁切、正規化
node scripts/process-video.mjs video-raw/cart-front.webm cart-front-tmp --trim 2,22
node scripts/process-video.mjs video-raw/cart-admin.webm cart-admin-tmp --hide 420,180,300,40

# 2. 接起來，段落之間會插入標題卡
node scripts/join-videos.mjs 09-jojozoocart \
  public/videos/未分類/cart-front-tmp.mp4 "前台 · 現場掃碼租借" \
  public/videos/未分類/cart-admin-tmp.mp4 "後台 · 核銷與營運管理"

# 3. 刪掉中繼檔
rm -r public/videos/未分類
```

中繼檔的名稱不在分類對應表裡，所以會落在 `未分類/`；接完記得整個刪掉。

標題卡是網站底色加一行置中白字與藍色底線，1.6 秒。封面會自動避開標題卡，取第一段的實際畫面。

**遮蔽一定要在第 1 步做完**：`join-videos.mjs` 只負責接，不會再遮任何東西。

## 七、放上網站

1. 確認 `public/videos/<分類>/<slug>.mp4` 已存在（分類由 `lib/video-categories.mjs` 決定，
   新案例要先加進對應表，否則會掉進 `未分類/`，案例頁就找不到影片）。
2. 到 `scripts/build-cases.mjs` 的 `DEMO_NOTES` 加一行說明，老實交代這支是怎麼錄的
   （測試資料？正式系統？只瀏覽沒送出？）。沒設定的話會用預設字串。
3. `pnpm build`。

影片是 `preload="none"` + 點擊才播，不會影響案例頁的載入速度；封面圖是唯一會先下載的東西。

`video-raw/` 是原始錄影檔，已經在 `.gitignore` 裡，不會進版控——**原始檔通常還沒去敏，不要提交**。
