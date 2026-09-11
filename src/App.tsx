import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Check,
  Mail,
  MapPin,
  Menu,
  QrCode,
  ShieldCheck,
  Trophy,
  UserRoundCheck,
  X,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const heroImage = '/images/hero_banner.webp'

type Category = 'operations' | 'marketing' | 'automation'
type ProjectFilter = 'all' | Category

type Project = {
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

const categoryLabels: Record<Category, string> = {
  operations: '營運系統',
  marketing: '行銷活動',
  automation: '自動化與 AI',
}

// 分類本身看不出差別時，案例清單就只是一長串名字。每一類補一句它在解決什麼。
const categoryNotes: Record<Category, string> = {
  operations: '報名、售票、核銷與後台——第一線每天都要用的系統。',
  marketing: '檔期活動、集點抽獎，以及投放與流量的成效判讀。',
  automation: '把每天重複的人工作業交給排程、爬蟲與模型處理。',
}

// 清單的顯示順序：從每天在用的系統，到活動，再到背後的自動化。
const categoryOrder: Category[] = ['operations', 'marketing', 'automation']

const filterOptions: { value: ProjectFilter; label: string }[] = [
  { value: 'all', label: '全部' },
  { value: 'operations', label: '營運系統' },
  { value: 'marketing', label: '行銷活動' },
  { value: 'automation', label: '自動化與 AI' },
]

const projects: Project[] = [
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
    status: '投放中',
    proof: '6 檔 / 8 組 / 10 則完成建立與過審',
    problem: '活動素材、受眾、預算與追蹤分散，檔期中難以快速判讀成效，也容易在上線環節漏失流量。',
    solution: '建立受眾素材矩陣、UTM 與 GTM 規範、成效戰情室，以及廣告上線前的憑證與追蹤檢查。',
    result: '周年慶 6 檔、8 組、10 則廣告完成建立與過審，開檔前 GTM、TLS 與 Pixel 驗證通過。',
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

const featuredProjects = projects.filter((project) => project.featured)

const buildSteps = [
  ['找到真正卡住人的地方', '從第一線流程、客訴與重複作業中，確認值得解決的問題。'],
  ['把模糊需求畫成流程', '定義角色、資料、例外情境與成功標準。'],
  ['與 AI 協作建置', '我負責架構與驗證，AI 加速草稿、排查與文件。'],
  ['上線後持續修正', '以真實回饋迭代，讓工具可用、有人用、能維運。'],
]

const caseUrl = (slug: string) => `/case/${slug}/`

function SystemRoute() {
  return (
    <svg className="system-route" viewBox="0 0 460 210" aria-hidden="true">
      <path d="M24 178h152c34 0 38-54 72-54h96c36 0 40-45 40-86" />
      <circle cx="24" cy="178" r="5" />
      <circle cx="384" cy="34" r="7" />
      <circle className="route-pulse" cx="248" cy="124" r="4" />
    </svg>
  )
}

function ProjectMedia({ project }: { project: Project }) {
  if (project.visual === 'qr-event') {
    return (
      <div className="hunt-system" aria-label="園區 50 組 QR 掃描、集點與兌獎流程示意">
        <div className="hunt-title">
          <span>九九峰 4 周年</span>
          <strong>尋4大作戰</strong>
          <small>掃遍園區，累積你的尋4成就</small>
        </div>
        <div className="hunt-route" aria-hidden="true">
          <span className="hunt-stop"><MapPin /><b>園區</b></span>
          <i />
          <span className="hunt-stop"><QrCode /><b>掃碼</b></span>
          <i />
          <span className="hunt-stop"><Trophy /><b>兌獎</b></span>
        </div>
        <div className="hunt-count" aria-hidden="true"><b>50</b><span>UNIQUE QR</span></div>
      </div>
    )
  }

  if (project.visual === 'ai-review') {
    return (
      <div className="review-system" aria-label="Google 評論經 AI 草稿與人工核准後發布的流程示意">
        <div className="review-source">
          <span>Google Review</span>
          <strong>★★★★★</strong>
          <p>環境很舒服，服務人員也很親切……</p>
        </div>
        <div className="review-node">
          <Bot aria-hidden="true" />
          <span>AI 草稿</span>
        </div>
        <div className="review-node approved">
          <ShieldCheck aria-hidden="true" />
          <span>風險閘門</span>
        </div>
        <div className="review-node human">
          <UserRoundCheck aria-hidden="true" />
          <span>人工核准</span>
        </div>
        <div className="review-flow" aria-hidden="true"><span /><span /><span /></div>
      </div>
    )
  }

  if (!project.image) return null

  return (
    <img
      src={project.image.src}
      alt={`${project.title}系統畫面`}
      width={project.image.width}
      height={project.image.height}
      loading="lazy"
      decoding="async"
    />
  )
}

function FeaturedProject({ project, index }: { project: Project; index: number }) {
  return (
    <article className="featured-project">
      <div className="feature-summary">
        <span className="feature-number">0{index + 1}</span>
        <p className="project-category">{categoryLabels[project.category]}</p>
        <h3>{project.title}</h3>
        <div className="feature-metrics">
          {project.metrics?.map((metric) => (
            <div key={metric.label}>
              <strong>{metric.value}</strong>
              <span>{metric.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="feature-media">
        <ProjectMedia project={project} />
      </div>

      <div className="feature-story">
        <dl>
          <div><dt>卡點</dt><dd>{project.problem}</dd></div>
          <div><dt>建置</dt><dd>{project.solution}</dd></div>
          <div><dt>結果</dt><dd>{project.result}</dd></div>
        </dl>
        <div className="feature-links">
          <a className="inline-action primary" href={caseUrl(project.slug)}>
            閱讀案例 <ArrowRight size={17} />
          </a>
        </div>
      </div>
    </article>
  )
}

function App() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState<ProjectFilter>('all')

  const visibleProjects = activeFilter === 'all'
    ? projects
    : projects.filter((project) => project.category === activeFilter)

  useEffect(() => {
    const closeMenu = () => setMenuOpen(false)
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeMenu()
    }

    window.addEventListener('hashchange', closeMenu)
    window.addEventListener('keydown', closeOnEscape)
    return () => {
      window.removeEventListener('hashchange', closeMenu)
      window.removeEventListener('keydown', closeOnEscape)
    }
  }, [])

  return (
    <div className="site-shell">
      <a className="skip-link" href="#main">跳到主要內容</a>

      <header className="site-header">
        <a className="brand" href="#top" aria-label="Toyo Chang 首頁">
          <span className="brand-mark">TC</span>
          <span className="brand-copy">
            <strong>Toyo Chang</strong>
            <small>MarTech Engineer</small>
          </span>
        </a>

        <button
          className="menu-button"
          type="button"
          aria-label={menuOpen ? '關閉選單' : '開啟選單'}
          aria-expanded={menuOpen}
          aria-controls="primary-navigation"
          onClick={() => setMenuOpen((open) => !open)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav
          id="primary-navigation"
          className={menuOpen ? 'nav-links is-open' : 'nav-links'}
          aria-label="主要導覽"
          onClick={() => setMenuOpen(false)}
        >
          <a href="#results">成果</a>
          <a href="#work">作品</a>
          <a href="#method">方法</a>
          <a href="#about">關於我</a>
          <a className="nav-cta" href="#contact">聯絡我</a>
        </nav>
      </header>

      <main id="main">
        <section className="hero site-frame" id="top">
          <div className="hero-index" aria-hidden="true">01</div>
          <div className="hero-copy">
            <h1>把卡住營運的事，<br /><span>做成會自己跑的系統。</span></h1>
            <p>
              從行銷與營運現場出發，把真實需求做成可上線、可量化、可持續維運的 MarTech 與自動化產品。
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#work">
                看精選案例 <ArrowDownRight size={19} />
              </a>
              <a className="button button-secondary" href="#contact">和我聊聊</a>
            </div>
            <div className="hero-trail" aria-hidden="true">
              <span>營運現場</span><i /><span>可用產品</span>
            </div>
          </div>

          <div className="hero-portrait">
            <div className="portrait-frame">
              <img
                src={heroImage}
                alt="Toyo Chang 個人照片"
                width={1774}
                height={887}
                fetchPriority="high"
                decoding="async"
              />
              <SystemRoute />
            </div>
            <a className="latest-project" href={caseUrl('14-anniversary-find-four')}>
              <span>最新實作</span>
              <strong>4 周年尋4大作戰</strong>
              <small>50 組園區 QR · 集點與兌獎流程</small>
              <ArrowRight aria-hidden="true" />
            </a>
          </div>
        </section>

        <section className="results-rail site-frame" id="results" aria-label="可驗證成果">
          <div><strong>16</strong><span>實務案例</span></div>
          <div><strong>7,157+</strong><span>評論流程</span></div>
          <div><strong>20,000+</strong><span>筆資料</span></div>
          <div><strong>44</strong><span>次現場迭代</span></div>
        </section>

        <section className="work-section site-frame" id="work">
          <div className="section-header">
            <span className="section-index" aria-hidden="true">02</span>
            <div>
              <h2>精選實作</h2>
              <p>每個案例都從真實營運卡點開始，再用可驗證的成果收尾。</p>
            </div>
            <p className="section-note">從第一線問題出發，做成真的有人用、也能持續維運的工具。</p>
          </div>

          <div className="featured-list">
            {featuredProjects.map((project, index) => (
              <FeaturedProject project={project} index={index} key={project.slug} />
            ))}
          </div>

          <div className="archive" aria-labelledby="archive-title">
            <div className="archive-header">
              <div>
                <h2 id="archive-title">完整案例庫</h2>
                <p>持續解決不同場景的營運問題，累積可複用的解法。</p>
              </div>
              <div className="project-filters" aria-label="案例分類">
                {filterOptions.map((option) => (
                  <button
                    type="button"
                    aria-pressed={activeFilter === option.value}
                    className={activeFilter === option.value ? 'is-active' : ''}
                    onClick={() => setActiveFilter(option.value)}
                    key={option.value}
                  >
                    {activeFilter === option.value ? <Check size={15} /> : null}
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="archive-table" aria-live="polite">
              <div className="archive-labels" aria-hidden="true">
                <span>#</span><span>專案名稱</span><span>成果 / 狀態</span><span>前往</span>
              </div>
              {categoryOrder
                .map((category) => ({ category, items: visibleProjects.filter((p) => p.category === category) }))
                .filter((group) => group.items.length > 0)
                .map(({ category, items }) => (
                  <section className="archive-group" key={category}>
                    <h3 className={`archive-group-head category-${category}`}>
                      <span className="archive-group-name">{categoryLabels[category]}</span>
                      <span className="archive-group-count">{items.length} 個案例</span>
                      <span className="archive-group-note">{categoryNotes[category]}</span>
                    </h3>
                    {items.map((project) => (
                      <a className="archive-row" href={caseUrl(project.slug)} key={project.slug}>
                        {/* 編號取自資料夾名稱，和案例頁網址對得起來；分組後跳號是正常的 */}
                        <span className="archive-number">{project.slug.slice(0, 2)}</span>
                        <strong>{project.title}</strong>
                        <span className="archive-proof"><b>{project.status}</b>{project.proof}</span>
                        <ArrowRight aria-hidden="true" />
                      </a>
                    ))}
                  </section>
                ))}
            </div>
          </div>
        </section>

        <section className="method-section site-frame" id="method">
          <div className="section-header method-heading">
            <span className="section-index" aria-hidden="true">03</span>
            <div>
              <h2>從現場到上線，<br />我這樣做。</h2>
              <p>AI 加速執行，但問題定義、架構判斷與驗證責任在我。</p>
            </div>
          </div>

          <ol className="method-steps">
            {buildSteps.map(([title, description], index) => (
              <li key={title}>
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="about-section site-frame" id="about">
          <span className="section-index" aria-hidden="true">04</span>
          <div className="about-copy">
            <h2>懂營運，<span>也能把系統做出來。</span></h2>
            <div className="about-narrative">
              <p>
                我的起點是行銷企劃。因為每天都在現場看見報名、核銷、對帳、客服與報表的摩擦，所以開始用技術逐一拆掉它們。
              </p>
              <p>
                現在，我專注在商業與技術之間，把模糊需求轉成能落地的 MarTech 與自動化產品。
              </p>
            </div>
            <div className="career-shift" aria-label="職涯轉換：從行銷企劃到 MarTech Engineer">
              <div>
                <span>起點</span>
                <strong>行銷企劃</strong>
                <small>從第一線看見流程摩擦</small>
              </div>
              <ArrowRight aria-hidden="true" />
              <div>
                <span>現在</span>
                <strong>MarTech Engineer</strong>
                <small>把需求做成可維運產品</small>
              </div>
            </div>
            <div className="skills" aria-label="技術能力">
              <span>React / TypeScript</span>
              <span>Node / Serverless</span>
              <span>Firebase / Supabase</span>
              <span>Python Automation</span>
              <span>AI Workflow</span>
            </div>
          </div>
          <div className="about-visual">
            <img src={heroImage} alt="Toyo Chang 工作側拍" width={1774} height={887} loading="lazy" decoding="async" />
          </div>
        </section>

        <section className="contact-section site-frame" id="contact">
          <span className="section-index" aria-hidden="true">05</span>
          <div>
            <h2>有一個一直卡住的流程？</h2>
            <p>不論是職涯機會、專案合作，或想聊聊怎麼把重複工作自動化，都歡迎找我。</p>
            <div className="contact-actions">
              <a className="button button-primary" href="mailto:s110905toyo@gmail.com">
                <Mail size={18} /> s110905toyo@gmail.com
              </a>
            </div>
          </div>
          <SystemRoute />
        </section>
      </main>

      <footer className="site-footer site-frame">
        <span>© {new Date().getFullYear()} Toyo Chang</span>
        <span>把真實問題做成可用產品。</span>
      </footer>
    </div>
  )
}

export default App
