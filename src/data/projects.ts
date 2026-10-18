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
    status: '活動結案',
    proof: '4,190 次領獎紀錄，2,416 份體驗問卷',
    problem: '大型園區尋寶活動需要防止 QR 重複計點、保存遊客進度，也要讓現場能安全核銷。',
    solution: '建置免登入集點、50 組唯一 QR、恢復碼、分級成就、來源問答與工作人員核銷。',
    result: '9 月活動結案；87.0% 問卷填答者表示逛到更多園區，並以操作回饋整理下一檔改善項目。',
    featured: true,
    visual: 'qr-event',
    metrics: [
      { value: '4,190', label: '次領獎紀錄' },
      { value: '2,416', label: '份體驗問卷' },
    ],
  },
  {
    slug: '15-meta-ads-warroom',
    title: 'Meta 廣告戰情室',
    category: 'marketing',
    status: '成效驗證',
    proof: '7,152 次有效進站，每次到達成本 NT$2.35',
    problem: '活動素材、受眾、預算與追蹤分散，檔期中難以快速判讀成效，且活動頁延遲易導致高跳出浪費。',
    solution: '整合 Meta、GA4、氣象與 LINE 活動登記彙總，透過每小時本機排程更新，分開判讀來源與成本。',
    result: '9 月花費 1.6 萬帶進 7,152 次有效進站；10 月接入登記彙總與已標記測試券排除，未接營收，不計 ROAS。',
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
    proof: '官網與通路完成指定驗收，延伸 LINE 活動登記量測',
    problem: '搜尋能見度、票價口徑與活動頁成效缺少固定稽核方式，優化容易只靠感覺。',
    solution: '結合技術 SEO、GSC、GA4 與內容驗收；LINE 活動僅對新建成功登記嘗試送出事件，排除已知測試帳號。',
    result: '10 月完成官網與通路指定驗收，並啟用登記事件；自然成功事件入庫仍待觀察，登記總數以業務資料庫為準。',
  },
  {
    slug: '13-customer-service-automation',
    title: 'Google 評論 AI 客服自動化',
    category: 'automation',
    status: '運作中',
    proof: '100 則評論完成第二輪驗收，人工保留發布權',
    problem: '大量歷史評論難以逐一撰稿，也必須避免錯誤資訊或高風險內容直接發布。',
    solution: 'OpenAI 產生草稿並經獨立安全閘門檢查，人工核准後每小時發布；補收啟用後更新且尚未收錄的評論。',
    result: '100 則分層評論第二輪複核，高風險漏判與需大改均為 0/100；10 月補強收錄與原評論連結，既有資料未全量補填。',
    featured: true,
    visual: 'ai-review',
    metrics: [
      { value: '100', label: '則分層驗收樣本' },
      { value: 'HITL', label: '人工保留發布權' },
    ],
  },
  {
    slug: '17-linegate-ticketing',
    title: 'LineGate LINE 電子票券與核銷',
    category: 'operations',
    status: '已發布',
    proof: '年票、活動領券與核銷整合，新增入口 QR 自助報到',
    problem: '票券發放、會員查票與現場核銷分散，工作人員難以查明來源與使用狀態。',
    solution: '整合 LINE 票夾、核銷與活動來源統計，新增兩日活動登記與同券同日不重複計數的自助報到。',
    result: '10 月完成活動登記與自助報到正式發布，分開呈現自助申報與員工核實；活動日實際報到仍待驗收。',
  },
  {
    slug: '18-tourism-data-analysis',
    title: '觀光資料比較與品質分析',
    category: 'marketing',
    status: '分析交付',
    proof: '跨年度統計整理為可追溯的趨勢、CSV 與 PDF 報告',
    problem: '不同據點的名稱、統計方法與資料月份不一致，直接比較成長率容易產生誤判。',
    solution: '整理公開觀光統計，處理名稱對應、缺月與同期基期，將可比較範圍和限制呈現在報表中。',
    result: '完成互動報表、CSV 與兩種閱讀版本的 PDF 交付；作品集以匿名方法說明呈現。',
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
