export type Category = 'operations' | 'marketing' | 'automation'
export type ProjectFilter = 'all' | Category

export type Project = {
  slug: string
  title: string
  category: Category
  status: string
  proof: string
  problem: string
  solution: string
  result: string
  image?: { src: string; width: number; height: number }
  featured?: boolean
  visual?: 'ai-review' | 'qr-event'
  metrics?: { value: string; label: string }[]
}

export const categoryLabels: Record<Category, string> = {
  operations: '營運系統',
  marketing: '行銷活動',
  automation: '自動化與 AI',
}

// 分類本身看不出差別時，案例清單就只是一長串名字。每一類補一句它在解決什麼。
export const categoryNotes: Record<Category, string> = {
  operations: '報名、售票、核銷與後台——第一線每天都要用的系統。',
  marketing: '檔期活動、集點抽獎，以及投放與流量的成效判讀。',
  automation: '把每天重複的人工作業交給排程、爬蟲與模型處理。',
}

// 清單的顯示順序：從每天在用的系統，到活動，再到背後的自動化。
export const categoryOrder: Category[] = ['operations', 'marketing', 'automation']

export const filterOptions: { value: ProjectFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'operations', label: '營運系統' },
  { value: 'marketing', label: '行銷活動' },
  { value: 'automation', label: '自動化與 AI' },
]

export const projects: Project[] = [
  {
    slug: '14-anniversary-find-four',
    title: '4 周年尋4大作戰',
    category: 'marketing',
    status: '已部署',
    proof: '50 組園區 QR，完整集點與兌獎流程',
    problem: '大型園區尋寶活動需要防止 QR 重複計點、保存遊客進度，也要讓現場能安全核銷。',
    solution: '建置免登入集點、50 組唯一 QR、恢復碼、分級成就、來源問答與工作人員核銷。',
    result: '正式環境完成 50 組 QR 掃描驗證，活動來源與兌獎狀態可追蹤。',
    featured: true,
    visual: 'qr-event',
    metrics: [
      { value: '50', label: '組園區 QR' },
      { value: '6', label: '級集點成就' },
    ],
  },
  {
    slug: '15-meta-ads-warroom',
    title: 'Meta 廣告戰情室',
    category: 'marketing',
    status: '成效驗證',
    proof: '7,152 次有效進站，每次到達成本 NT$2.35',
    problem: '活動素材、受眾、預算與追蹤分散，檔期中難以快速判讀成效，且活動頁延遲易導致高跳出浪費。',
    solution: '建立素材矩陣、400ms 伺服器響應優化、自動停投日機制，以及整合 Meta、GA4 與氣象的戰情室。',
    result: '花費 1.6 萬帶進 7,152 次有效進站，到達率 81.3%，現場問卷驗證 22.7% 遊客為廣告來源。',
    metrics: [
      { value: 'NT$2.35', label: '每次到達成本' },
      { value: '81.3%', label: '進站到達率' },
      { value: '22.7%', label: '現場自陳來源' },
    ],
  },
  {
    slug: '16-seo-analytics',
    title: '官網 SEO 與 GA4 成效分析',
    category: 'marketing',
    status: '持續優化',
    proof: '22 個 sitemap URL 全數 200，無 P0–P2 缺陷',
    problem: '搜尋能見度、票價口徑與活動頁成效缺少固定稽核方式，優化容易只靠感覺。',
    solution: '建立技術 SEO 掃描與人工複核、GSC 關鍵字追蹤、GA4 活動漏斗與跨通路資訊口徑檢查。',
    result: '22 個 sitemap URL 全數正常回應且無中高風險缺陷，並找出活動優惠內容的實際觸達落差。',
  },
  {
    slug: '13-customer-service-automation',
    title: 'Google 評論 AI 客服自動化',
    category: 'automation',
    status: '運作中',
    proof: '7,157 則評論，人工保留發布權',
    problem: '大量歷史評論難以逐一撰稿，也必須避免錯誤資訊或高風險內容直接發布。',
    solution: 'AI 產生草稿，個資、星等與風險閘門獨立檢查，最終發布權保留給人工。',
    result: '完成受控測試與首筆人工核准公開回覆。',
    featured: true,
    visual: 'ai-review',
    metrics: [
      { value: '7,157', label: '則歷史評論' },
      { value: 'HITL', label: '人工保留發布權' },
    ],
  },
  {
    slug: '01-summer-camp',
    title: '夏令營一站式報名系統',
    category: 'operations',
    status: '已上線',
    proof: '23 個梯次在 1 小時內完成報名',
    problem: '熱門梯次容易超賣，報名資料與匯款確認分散。',
    solution: '把選梯次、即時名額、報名與財務對帳整合在同一流程。',
    result: '23 個梯次在 1 小時內完成報名。',
    image: { src: '/images/cases/01-summer-camp/result.webp', width: 1400, height: 788 },
    featured: true,
    metrics: [
      { value: '23', label: '個梯次' },
      { value: '1 hr', label: '完成報名' },
    ],
  },
  {
    slug: '06-erp-automation-spider',
    title: 'ERP Spider 數據整合',
    category: 'automation',
    status: '穩定運行',
    proof: '400+ 次執行，管理 20,000+ 筆資料',
    problem: '營收資料散落在不同平台，每月都要重複登入、下載與整理。',
    solution: '透過排程爬取、清洗資料並自動同步至管理報表。',
    result: '已執行 400+ 次，管理 20,000+ 筆資料。',
    image: { src: '/images/cases/06-erp-automation-spider/result.webp', width: 1400, height: 686 },
    metrics: [
      { value: '400+', label: '次執行' },
      { value: '20,000+', label: '筆資料' },
    ],
  },
  {
    slug: '09-jojozoocart',
    title: '遊園車租用與核銷系統',
    category: 'operations',
    status: '已上線',
    proof: '整合租借、計費、核銷與營收同步',
    problem: '紙本登記、人工計時與計費讓現場容易出錯，也不利於查帳。',
    solution: '整合租借、交車、歸還、程式化計費與營收同步。',
    result: '租借紀錄可追蹤、可查帳、可擴充。',
    image: { src: '/images/cases/09-jojozoocart/result.webp', width: 1176, height: 819 },
  },
  {
    slug: '03-hotel-partner-system',
    title: '飯店夥伴 QR 核銷系統',
    category: 'operations',
    status: '已上線',
    proof: '支援多人分次使用，逐筆核銷可追蹤',
    problem: '紙本核銷難辨真偽，多人分次入園與月底對帳容易產生爭議。',
    solution: '設計飯店產券、園區即時 QR 核銷、原子扣額與權限紀錄。',
    result: '支援多人分次使用，逐筆核銷可追蹤。',
    image: { src: '/images/cases/03-hotel-partner-system/result.webp', width: 1400, height: 656 },
  },
  {
    slug: '02-payment-system',
    title: '企業內部管理平台',
    category: 'operations',
    status: '上線測試',
    proof: '共用權限與稽核底層支援跨部門流程',
    problem: '款項、公文、人資與採購資料各自分散，流程難以追蹤。',
    solution: '以共用權限、稽核與模組化架構承接跨部門作業。',
    result: '15 個模組持續在測試環境驗證。',
  },
  {
    slug: '04-children-drawing-contest',
    title: '小小畫家活動平台',
    category: 'marketing',
    status: '已上線',
    proof: '線上藝廊帶動分享，文書處理降低 80%',
    problem: '紙本報名、收件與評選流程耗時，作品也缺少分享出口。',
    solution: '整合數位報名、審核與線上藝廊。',
    result: '降低 80% 文書處理時間。',
  },
  {
    slug: '08-pos-autoclicker',
    title: 'POS Autoclicker',
    category: 'automation',
    status: '現場使用',
    proof: '44 次版本迭代，降低重複操作負擔',
    problem: 'POS 現場有大量高頻、低價值的重複點擊。',
    solution: '建立不侵入既有系統的桌面自動化工具。',
    result: '歷經 44 次版本迭代持續貼合現場。',
  },
  {
    slug: '12-webar-park-guide',
    title: 'WebAR 園區導航',
    category: 'operations',
    status: '開發中',
    proof: '手繪地圖、GPS 與羅盤的免下載導覽',
    problem: '戶外園區沒有街景覆蓋，遊客也不想先下載 App。',
    solution: '以手繪地圖、GPS 與裝置方位建立掃碼即用導覽。',
    result: '地圖與場館資料可由設定檔自主維運。',
  },
  {
    slug: '10-line-lucky-draw',
    title: 'LINE 好友抽抽樂',
    category: 'marketing',
    status: '已上線',
    proof: '把活動流量沉澱為可再行銷名單',
    problem: '一次性活動流量難以留下，也容易重複領獎。',
    solution: '以 LINE 好友身分作為抽獎與防重複機制。',
    result: '線上曝光可導向現場消費與後續再行銷。',
  },
  {
    slug: '05-ticket-price-calculator',
    title: '票價最優解試算器',
    category: 'operations',
    status: '已上線',
    proof: '依日期、身分與活動規則自動產出最省組合',
    problem: '平假日、身分優惠與活動票價同時存在，現場人工試算容易耗時或套錯規則。',
    solution: '改版為手機優先的選日、填寫同行人數、確認最優解三步流程，並集中處理期間優惠與停車費。',
    result: '售票員與遊客可直接查看票種、優惠、數量與總價拆解，縮短窗口確認流程。',
  },
  {
    slug: '07-kuangsan-collaboration',
    title: '廣三 SOGO 數位領券',
    category: 'marketing',
    status: '檔期結束',
    proof: '百貨檔期換票流程數位化',
    problem: '異業領券難追蹤轉換，也需避免重複領取。',
    solution: '建立一機一券的數位領券與換票流程。',
    result: '百貨客群的導客結果可被追蹤。',
  },
  {
    slug: '11-mothersday-lottery',
    title: '母親節抽抽樂',
    category: 'marketing',
    status: '檔期結束',
    proof: '節慶檔期導客，回收可再行銷名單',
    problem: '檔期抽獎需要同時控制獎項成本與櫃位導流。',
    solution: '以加權機率分配獎項，並綁定指定櫃位核銷。',
    result: '活動人潮能導向指定消費點並量化核銷。',
  },
]

// 首頁完整案例庫上方那條產品縮圖的順序。挑的是有錄示範影片、因此有海報圖的 14 個案例
// （06 與 11 沒錄，不在此列），縮圖由 scripts/build-thumbs.mjs 從海報圖壓出來。
// 排序是刻意的：先放畫面最完整、最能代表「產品」的幾個，再帶到活動與自動化。
export const stripSlugs = [
  '01-summer-camp',
  '14-anniversary-find-four',
  '13-customer-service-automation',
  '09-jojozoocart',
  '03-hotel-partner-system',
  '02-payment-system',
  '12-webar-park-guide',
  '05-ticket-price-calculator',
  '04-children-drawing-contest',
  '10-line-lucky-draw',
  '07-kuangsan-collaboration',
  '15-meta-ads-warroom',
  '16-seo-analytics',
  '08-pos-autoclicker',
]

const bySlug = new Map(projects.map(project => [project.slug, project]))

/** 產品縮圖條要顯示的案例，依 stripSlugs 的順序。 */
export const stripProjects = stripSlugs
  .map(slug => bySlug.get(slug))
  .filter((project): project is Project => Boolean(project))

export const thumbSrc = (slug: string) => `/images/thumbs/${slug}.webp`
