import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Bot,
  Boxes,
  Braces,
  CheckCircle2,
  Code2,
  Mail,
  Menu,
  Sparkles,
  X,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'

// 圖片放在 public/images，由 scripts/optimize_images.py 從各案例的原始 PNG 產生。
// 走固定路徑而非 import，首屏那張才能在 index.html 先 preload。
const heroImage = '/images/hero_banner.webp'

type Project = {
  title: string
  label: string
  problem: string
  solution: string
  result: string
  image?: { src: string; width: number; height: number }
  live?: string
  casePath: string
  tags: string[]
  featured?: boolean
  visual?: 'ai-review'
}

const projects: Project[] = [
  {
    title: 'Google 評論 AI 客服自動化',
    label: 'AI × Human-in-the-loop',
    problem: '7,157 則歷史評論難以逐一撰稿，也必須避免錯誤資訊或高風險內容直接發布。',
    solution: 'AI 產生草稿，個資、星等與風險閘門獨立檢查，最終發布權保留給人工。',
    result: '完成受控測試與首筆人工核准公開回覆',
    visual: 'ai-review',
    casePath: '13-customer-service-automation',
    tags: ['OpenAI API', 'HITL', 'Safety Gate'],
    featured: true,
  },
  {
    title: '夏令營一站式報名系統',
    label: '報名與對帳',
    problem: '熱門梯次容易超賣，報名資料與匯款確認分散。',
    solution: '把選梯次、即時名額、報名與財務對帳整合在同一流程。',
    result: '23 個梯次在 1 小時內完成報名',
    image: { src: '/images/cases/01-summer-camp/result.webp', width: 1400, height: 788 },
    live: 'https://www.jojozoopark.com/camp/',
    casePath: '01-summer-camp',
    tags: ['React', 'Firebase', '流程設計'],
    featured: true,
  },
  {
    title: 'ERP Spider 數據整合',
    label: '資料自動化',
    problem: '營收資料散落在不同平台，每月都要重複登入、下載與整理。',
    solution: '透過排程爬取、清洗資料並自動同步至管理報表。',
    result: '已執行 400+ 次，管理 20,000+ 筆資料',
    image: { src: '/images/cases/06-erp-automation-spider/result.webp', width: 1400, height: 686 },
    casePath: '06-erp-automation-spider',
    tags: ['Python', 'Selenium', 'Google Sheets'],
    featured: true,
  },
  {
    title: '遊園車租用與核銷系統',
    label: '現場營運',
    problem: '紙本登記、人工計時與計費讓現場容易出錯，也不利於查帳。',
    solution: '整合租借、交車、歸還、程式化計費與營收同步。',
    result: '租借紀錄可追蹤、可查帳、可擴充',
    image: { src: '/images/cases/09-jojozoocart/result.webp', width: 1176, height: 819 },
    live: 'https://jojozoocart.pages.dev/',
    casePath: '09-jojozoocart',
    tags: ['Cloudflare', 'Supabase', '計費演算法'],
    featured: true,
  },
  {
    title: '飯店夥伴 QR 核銷系統',
    label: 'B2B O2O',
    problem: '紙本核銷難辨真偽，多人分次入園與月底對帳容易產生爭議。',
    solution: '設計飯店產券、園區即時 QR 核銷、原子扣額與權限紀錄。',
    result: '支援多人分次使用，逐筆核銷可追蹤',
    image: { src: '/images/cases/03-hotel-partner-system/result.webp', width: 1400, height: 656 },
    live: 'https://www.jojozoopark.com/hpes/',
    casePath: '03-hotel-partner-system',
    tags: ['Supabase', 'RLS', 'QR Code'],
    featured: true,
  },
]

const moreWork: [string, string, string, string][] = [
  ['企業內部管理平台', '以共用權限與稽核底層承接跨部門流程', '上線測試', '02-payment-system'],
  ['小小畫家活動平台', '線上藝廊帶動分享，文書處理降低 80%', '已上線', '04-children-drawing-contest'],
  ['POS Autoclicker', '44 版現場迭代，降低重複操作負擔', '現場使用', '08-pos-autoclicker'],
  ['WebAR 園區導航', '手繪地圖、GPS 與羅盤的免下載導覽', '開發中', '12-webar-park-guide'],
  ['LINE 好友抽抽樂', '將活動流量沉澱為可再行銷名單', '已上線', '10-line-lucky-draw'],
  ['購票最優解', '演算法找出最省票價組合，降低窗口溝通', '已上線', '05-ticket-price-calculator'],
  ['廣三 SOGO 數位領券', '百貨檔期換票流程數位化，導客進園區', '檔期結束', '07-kuangsan-collaboration'],
  ['母親節抽抽樂', '節慶檔期導客，回收可再行銷名單', '檔期結束', '11-mothersday-lottery'],
]

const buildSteps = [
  ['DISCOVER', '找到真正卡住人的地方', '從第一線流程、客訴與重複作業中，確認值得解決的問題。'],
  ['DESIGN', '把模糊需求畫成可執行流程', '定義角色、資料、例外情境與成功標準，再選擇合適技術。'],
  ['BUILD', '與 AI 協作，把方案做出來', '我負責架構、判斷與驗證，AI 加速草稿、排查與文件工作。'],
  ['SHIP', '上線後持續量測與修正', '以真實使用者回饋迭代，讓工具能用、有人用，也能長期維運。'],
]

const caseUrl = (slug: string) => `/case/${slug}/`

function App() {
  const [menuOpen, setMenuOpen] = useState(false)

  useEffect(() => {
    const close = () => setMenuOpen(false)
    window.addEventListener('hashchange', close)
    return () => window.removeEventListener('hashchange', close)
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
          onClick={() => setMenuOpen((value) => !value)}
        >
          {menuOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <nav className={menuOpen ? 'nav-links is-open' : 'nav-links'} aria-label="主要導覽">
          <a href="#results">成果</a>
          <a href="#work">作品</a>
          <a href="#method">方法</a>
          <a href="#about">關於我</a>
          <a className="nav-cta" href="mailto:s110905toyo@gmail.com">聯絡我</a>
        </nav>
      </header>

      <main id="main">
        <section className="hero section" id="top">
          <div className="hero-copy">
            <p className="eyebrow"><Sparkles size={15} /> FROM OPERATIONS TO PRODUCTS</p>
            <h1>我把卡住營運的事，<span>做成會自己跑的系統。</span></h1>
            <p className="hero-lead">
              我是張文豪 Toyo。從行銷與營運現場出發，獨立把真實需求做成可上線、可量化、可持續維運的 MarTech 與自動化產品。
            </p>
            <div className="hero-actions">
              <a className="button button-primary" href="#work">
                看我解過的問題 <ArrowDownRight size={18} />
              </a>
              <a className="button button-ghost" href="mailto:s110905toyo@gmail.com">
                <Mail size={17} /> 寄信給我
              </a>
            </div>
            <div className="hero-proof" aria-label="核心能力">
              <span><CheckCircle2 size={15} /> 需求到上線</span>
              <span><CheckCircle2 size={15} /> 商業與技術轉譯</span>
              <span><CheckCircle2 size={15} /> AI 協作開發</span>
            </div>
          </div>

          <div className="hero-visual" aria-label="Toyo Chang 個人照片與建置紀錄">
            <div className="portrait-crop">
              <img
                src={heroImage}
                alt="Toyo Chang 個人照片"
                width={1774}
                height={887}
                fetchPriority="high"
                decoding="async"
              />
            </div>
            <div className="status-chip"><span></span> AVAILABLE FOR NEW CHALLENGES</div>
            <div className="floating-log">
              <small>BUILD LOG / LATEST</small>
              <strong>Google 評論 AI 客服</strong>
              <span>7,000+ 則評論 · 人工保留發布權</span>
            </div>
          </div>
        </section>

        <section className="results-strip" id="results" aria-label="量化成果">
          <div className="result-item">
            <strong>13</strong><span>個實務案例<br />跨行銷、營運與自動化</span>
          </div>
          <div className="result-item">
            <strong>7+</strong><span>套公開上線<br />不是練習作品</span>
          </div>
          <div className="result-item">
            <strong>209<small> hr</small></strong><span>年度可驗證節省<br />採保守流程估算</span>
          </div>
          <div className="result-item">
            <strong>44</strong><span>次版本迭代<br />承受真實現場回饋</span>
          </div>
        </section>

        <section className="section work-section" id="work">
          <div className="section-heading">
            <div>
              <p className="eyebrow"><Boxes size={15} /> SELECTED BUILDS</p>
              <h2>我不從技術開始，<br />我從問題開始。</h2>
            </div>
            <p>每個案例都來自實際營運情境。先把問題說清楚，再決定要不要寫程式、該用什麼技術。</p>
          </div>

          <div className="projects-grid">
            {projects.map((project, index) => (
              <article className={`project-card project-${index + 1}`} key={project.title}>
                <div className={`project-image${project.visual ? ' ai-review-visual' : ''}`}>
                  {project.image && (
                    <img
                      src={project.image.src}
                      alt={`${project.title}系統畫面`}
                      width={project.image.width}
                      height={project.image.height}
                      loading="lazy"
                      decoding="async"
                    />
                  )}
                  {project.visual === 'ai-review' && (
                    <div className="review-pipeline" aria-hidden="true">
                      <div className="review-message"><span>★★★★★</span><p>環境很舒服，服務人員很親切...</p></div>
                      <div className="review-arrow">→</div>
                      <div className="review-agent"><Bot size={28} /><span>AI 草稿</span></div>
                      <div className="review-arrow">→</div>
                      <div className="review-gate"><CheckCircle2 size={28} /><span>人工核准</span></div>
                    </div>
                  )}
                  <span className="project-label">{project.label}</span>
                </div>
                <div className="project-content">
                  <div className="project-title-row">
                    <h3>{project.title}</h3>
                    <span className="project-index">0{index + 1}</span>
                  </div>
                  <dl className="project-story">
                    <div><dt>卡點</dt><dd>{project.problem}</dd></div>
                    <div><dt>建置</dt><dd>{project.solution}</dd></div>
                  </dl>
                  <p className="project-result"><Zap size={16} /> {project.result}</p>
                  <div className="project-footer">
                    <div className="tag-list">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
                    <div className="project-links">
                      <a href={caseUrl(project.casePath)}>案例 <ArrowRight size={15} /></a>
                      {project.live && <a href={project.live} target="_blank" rel="noreferrer">展示 <ArrowUpRight size={15} /></a>}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section className="section method-section" id="method">
          <div className="method-intro">
            <p className="eyebrow"><Braces size={15} /> HOW I BUILD</p>
            <h2>AI 是加速器，<br />判斷與責任在我。</h2>
            <p>我的價值不是請 AI 產生程式碼，而是知道該解什麼問題、如何設計架構，以及怎麼證明它在真實環境中可以運作。</p>
          </div>

          <div className="build-console" role="list" aria-label="開發流程">
            <div className="console-top"><span></span><span></span><span></span><small>toyo.build / production</small></div>
            {buildSteps.map(([code, title, description], index) => (
              <article className="build-step" role="listitem" key={code}>
                <div className="step-line"><span>{index + 1}</span></div>
                <div>
                  <small>{code}</small>
                  <h3>{title}</h3>
                  <p>{description}</p>
                </div>
                <span className="step-status">DONE</span>
              </article>
            ))}
          </div>
        </section>

        <section className="section more-work-section" aria-labelledby="more-work-title">
          <div className="section-heading compact">
            <div>
              <p className="eyebrow"><Bot size={15} /> MORE FIELD WORK</p>
              <h2 id="more-work-title">更多現場實作</h2>
            </div>
            <a className="text-link" href="https://github.com/s110905/jojozoo-portfolio" target="_blank" rel="noreferrer">
              GitHub 完整作品集 <ArrowUpRight size={16} />
            </a>
          </div>
          <div className="more-work-grid">
            {moreWork.map(([title, description, status, slug]) => (
              <a className="more-work-card" href={caseUrl(slug)} key={title}>
                <span>{status}</span>
                <h3>{title}</h3>
                <p>{description}</p>
                <em>看案例 <ArrowRight size={14} /></em>
              </a>
            ))}
          </div>
        </section>

        <section className="section about-section" id="about">
          <div className="about-card">
            <div className="about-kicker">THE PERSON BEHIND THE SYSTEMS</div>
            <h2>我在意的不是「做一套系統」，而是讓事情真的變簡單。</h2>
            <div className="about-columns">
              <p>
                我的起點是行銷企劃。因為每天都在現場看見報名、核銷、對帳、客服與報表的摩擦，所以我開始用技術逐一拆掉它們。
              </p>
              <p>
                這讓我同時理解使用者、營運限制與開發取捨。現在，我把自己定位為能跨越商業與技術的 MarTech Engineer。
              </p>
            </div>
            <div className="skill-ribbon" aria-label="技術能力">
              <span>React / TypeScript</span><span>Node / Serverless</span><span>Firebase / Supabase</span>
              <span>Python Automation</span><span>AI Workflow</span><span>Cloud Deployment</span>
            </div>
          </div>
        </section>

        <section className="section contact-section" id="contact">
          <div>
            <p className="eyebrow"><Sparkles size={15} /> LET'S BUILD SOMETHING USEFUL</p>
            <h2>你有一個一直卡住的流程嗎？</h2>
            <p>不論是職涯機會、專案合作，或只是想聊聊怎麼把重複工作自動化，都歡迎找我。</p>
          </div>
          <div className="contact-actions">
            <a className="button button-light" href="mailto:s110905toyo@gmail.com"><Mail size={18} /> s110905toyo@gmail.com</a>
            <a className="button button-outline-light" href="https://github.com/s110905" target="_blank" rel="noreferrer"><Code2 size={18} /> GitHub</a>
          </div>
        </section>
      </main>

      <footer className="site-footer">
        <span>© {new Date().getFullYear()} Toyo Chang</span>
        <span>Designed around real work, built for the web.</span>
      </footer>
    </div>
  )
}

export default App
