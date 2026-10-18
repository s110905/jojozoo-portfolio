import { ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { categoryLabels, filterOptions, projects, stripProjects, thumbSrc, type ProjectFilter } from './data/projects'
import './portfolio.css'

const campImage = '/images/cases/01-summer-camp/result.webp'
const huntImage = '/videos/行銷活動/14-anniversary-find-four.jpg'
const reviewImage = '/videos/自動化與AI/13-customer-service-automation.jpg'
const caseUrl = (slug: string) => `/case/${slug}/`
const contactHref = 'mailto:s110905toyo@gmail.com?subject=%E4%BD%9C%E5%93%81%E9%9B%86%E5%90%88%E4%BD%9C%E8%AB%AE%E8%A9%A2'

// GA4 的 page_view 只回答「有多少人來」，回答不了作品集真正的問題：他們看了哪個案例、
// 從哪個入口進去的。首頁有四個入口（hero 裝置圖、精選大卡、縮圖條、清單列），
// 各自標記後才知道哪一種呈現方式真的有效。
//
// 送出後頁面就要跳走，靠 gtag 預設的 sendBeacon 傳輸；ga.js 沒載入（本機開發、
// 被擋掉）時 window.gtag 是 undefined，optional call 直接跳過。
type EntryPoint = 'hero_mockup' | 'featured_card' | 'thumb_strip' | 'index_list'
type ContactEntryPoint = 'hero_cta' | 'contact_section'
type AnalyticsEvent = 'case_click' | 'contact_click' | 'filter_used'

const trackEvent = (eventName: AnalyticsEvent, params: Record<string, string | number>) => {
  window.gtag?.('event', eventName, params)
}

const trackCaseClick = (slug: string, entry: EntryPoint) => {
  trackEvent('case_click', { case_slug: slug, entry_point: entry })
}

const trackContactClick = (entryPoint: ContactEntryPoint) => {
  trackEvent('contact_click', { entry_point: entryPoint, transport_type: 'beacon' })
}

const steps = [
  ['看見問題', '從現場觀察真實需求。'],
  ['整理流程', '梳理角色、資料與例外情境。'],
  ['協作建置', '與 AI 一起動手實作。'],
  ['持續驗證', '根據回饋持續優化。'],
]

function Header() {
  const [open, setOpen] = useState(false)
  const trigger = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && open) {
        setOpen(false)
        trigger.current?.focus()
      }
    }
    const close = () => setOpen(false)
    const desktop = window.matchMedia('(min-width: 701px)')
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('hashchange', close)
    desktop.addEventListener('change', close)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('hashchange', close)
      desktop.removeEventListener('change', close)
    }
  }, [open])
  return (
    <header className="portfolio-header page-width">
      <a className="wordmark" href="#top" aria-label="Toyo Chang 首頁">Toyo Chang</a>
      <button ref={trigger} className="portfolio-menu" type="button" aria-expanded={open} aria-controls="portfolio-nav" aria-label={open ? '關閉選單' : '開啟選單'} onClick={() => setOpen(!open)}>
        {open ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
      </button>
      <nav id="portfolio-nav" className={open ? 'portfolio-nav is-open' : 'portfolio-nav'} aria-label="主要導覽" onClick={() => setOpen(false)}>
        <a href="#work">作品</a><a href="#about">關於</a><a href="#contact">聯絡 <ArrowUpRight size={17} aria-hidden="true" /></a>
      </nav>
    </header>
  )
}

// 完整案例庫上方那條產品縮圖，接在三張精選大卡之後、分類篩選列之前，
// 當作從「精選」轉到「全部」的視覺銜接。原本 hero 頂端的 211px 字標已移除。
function ProductStrip() {
  return (
    <div className="product-strip">
      <ul aria-label="案例作品縮圖">
        {stripProjects.map(project => (
          <li key={project.slug}>
            <a href={caseUrl(project.slug)} onClick={() => trackCaseClick(project.slug, 'thumb_strip')}>
              <img src={thumbSrc(project.slug)} alt="" width="480" height="270" loading="lazy" decoding="async" />
              <span>{project.title}</span>
            </a>
          </li>
        ))}
      </ul>
    </div>
  )
}

function Hero() {
  return (
    <section className="portfolio-hero page-width" id="top" aria-labelledby="intro-title">
      <div className="hero-stage">
        <div className="intro-copy">
          <h1 id="intro-title">把想法，<br />做成真的能用的產品。</h1>
          <p>從行銷現場出發，用技術與 AI 解決營運問題。</p>
          <div className="hero-actions">
            <a className="portfolio-button" href="#work">探索我的作品 <ArrowRight size={19} aria-hidden="true" /></a>
            <a className="portfolio-button portfolio-button-secondary" href={contactHref} onClick={() => trackContactClick('hero_cta')}>聊聊你的需求 <ArrowUpRight size={19} aria-hidden="true" /></a>
          </div>
        </div>
        <div className="project-composition" aria-label="夏令營報名與園區集點系統實際畫面">
          <a className="desktop-mockup" href={caseUrl('01-summer-camp')} onClick={() => trackCaseClick('01-summer-camp', 'hero_mockup')} aria-label="查看夏令營報名系統案例">
            <div className="device-toolbar" aria-hidden="true"><i /><i /><i /><span>jojozoo summer camp</span></div>
            <img src={campImage} alt="九九峰夏令營報名網站" width="1400" height="788" fetchPriority="high" />
          </a>
          <a className="phone-mockup" href={caseUrl('14-anniversary-find-four')} onClick={() => trackCaseClick('14-anniversary-find-four', 'hero_mockup')} aria-label="查看周年慶集點系統案例">
            <img src={huntImage} alt="尋4大作戰掃碼與集點進度" width="1280" height="720" fetchPriority="high" />
          </a>
        </div>
      </div>
      <div className="expertise-strip">
        <div><h2>行銷科技</h2><p>用技術放大行銷影響力。</p></div>
        <div><h2>營運系統</h2><p>讓日常營運更有效率。</p></div>
        <div><h2>自動化與 AI</h2><p>把重複的事交給技術，專注更有價值的事。</p></div>
      </div>
    </section>
  )
}

function SelectedWork() {
  return (
    <div className="selected-exhibits">
      <a className="exhibit exhibit-main" href={caseUrl('01-summer-camp')} onClick={() => trackCaseClick('01-summer-camp', 'featured_card')}>
        <div className="exhibit-image camp-exhibit"><img src={campImage} alt="夏令營報名系統首頁" width="1400" height="788" loading="lazy" /></div>
        <div className="exhibit-copy"><h3>夏令營一站式報名系統</h3><p>23 個梯次，1 小時內完成報名</p><ArrowUpRight aria-hidden="true" /></div>
      </a>
      <a className="exhibit exhibit-side" href={caseUrl('14-anniversary-find-four')} onClick={() => trackCaseClick('14-anniversary-find-four', 'featured_card')}>
        <div className="exhibit-image hunt-exhibit"><div className="exhibit-phone"><img src={huntImage} alt="園區尋4集點系統" width="1280" height="720" loading="lazy" /></div></div>
        <div className="exhibit-copy"><h3>4 周年尋4大作戰</h3><p>4,190 次領獎，2,416 份體驗問卷</p><ArrowUpRight aria-hidden="true" /></div>
      </a>
      <a className="exhibit exhibit-side" href={caseUrl('13-customer-service-automation')} onClick={() => trackCaseClick('13-customer-service-automation', 'featured_card')}>
        <div className="exhibit-image review-exhibit"><img src={reviewImage} alt="AI 客服調度台示範畫面" width="1280" height="720" loading="lazy" /></div>
        <div className="exhibit-copy"><h3>Google 評論 AI 客服</h3><p>100 則評論驗收，人工保留發布權</p><ArrowUpRight aria-hidden="true" /></div>
      </a>
    </div>
  )
}

function AdvertisingCase() {
  return (
    <section className="advertising-case" aria-labelledby="advertising-case-title">
      <div className="advertising-copy">
        <p className="advertising-eyebrow">廣告投放實績 · 2026 年 9 月</p>
        <h3 id="advertising-case-title">Meta 廣告代操</h3>
        <p className="advertising-description">為休閒園區規劃 Facebook／Instagram 活動廣告，從文案與素材整理、受眾與預算配置，到網站追蹤與成效判讀。</p>
        <p className="advertising-description"><a className="advertising-contact" href="/reports/meta-ads-2026-09/#services">廣告代操｜月費合作・短期活動檔期 <ArrowRight size={18} aria-hidden="true" /></a></p>
        <div className="advertising-actions">
          <a className="portfolio-button" href="/reports/meta-ads-2026-09/" onClick={() => trackCaseClick('15-meta-ads-warroom', 'featured_card')}>查看 9 月完整案例 <ArrowUpRight size={18} aria-hidden="true" /></a>
          <a className="advertising-contact" href="mailto:s110905toyo@gmail.com?subject=Meta%20%E5%BB%A3%E5%91%8A%E5%90%88%E4%BD%9C%E8%AB%AE%E8%A9%A2">洽談廣告合作 <ArrowRight size={18} aria-hidden="true" /></a>
        </div>
      </div>
      <div className="advertising-results">
        <p className="advertising-period">整月成果｜2026/09/01–09/30</p>
        <dl className="advertising-metrics">
          <div><dt>廣告花費</dt><dd><span>NT$</span> 18,788</dd></div>
          <div><dt>到站次數</dt><dd>7,451 <span>次</span></dd></div>
          <div><dt>平均每次到站成本</dt><dd><span>約 NT$</span> 2.52</dd></div>
        </dl>
        <p className="advertising-note">到站為 Meta 記錄的連結頁面瀏覽次數，非不重複人數。本案例未含訂單與營收資料。</p>
      </div>
    </section>
  )
}

function ProjectIndex() {
  const [filter, setFilter] = useState<ProjectFilter>('all')
  const visibleProjects = filter === 'all' ? projects : projects.filter(project => project.category === filter)
  const changeFilter = (nextFilter: ProjectFilter) => {
    if (nextFilter !== filter) {
      const resultsCount = nextFilter === 'all' ? projects.length : projects.filter(project => project.category === nextFilter).length
      trackEvent('filter_used', { filter_value: nextFilter, results_count: resultsCount })
    }
    setFilter(nextFilter)
  }
  return (
    <div className="project-index" aria-label="完整案例庫">
      <div className="index-toolbar">
        <div className="index-filters" role="group" aria-label="案例分類">
          {filterOptions.map(option => <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => changeFilter(option.value)}>
            {option.label}<span aria-hidden="true">{option.value === 'all' ? projects.length : projects.filter(project => project.category === option.value).length}</span>
          </button>)}
        </div>
        <p className="index-status" role="status">顯示 {visibleProjects.length} 個案例</p>
      </div>
      <div className="index-list">
        {visibleProjects.map(project => <a className="index-row" key={project.slug} href={caseUrl(project.slug)} onClick={() => trackCaseClick(project.slug, 'index_list')}>
          <h3>{project.title}</h3><span className="index-category">{categoryLabels[project.category]}</span><span className="index-proof">{project.proof}</span><ArrowUpRight size={20} aria-hidden="true" />
        </a>)}
      </div>
    </div>
  )
}

function About() {
  return (
    <section className="portfolio-about" id="about">
      <div className="page-width">
        <div className="about-layout">
          <h2>懂現場，<br />也動手做。</h2>
          <div className="about-text">
            <p>我的起點是行銷企劃。每天在現場看見報名、核銷、對帳、客服與報表的摩擦，於是開始用技術逐一解決。</p>
            <p>現在，我專注在商業與技術之間，把模糊需求轉成能落地的 MarTech 與自動化產品。AI 加速執行，問題定義、架構判斷與驗證責任在我。</p>
          </div>
        </div>
        <ol className="portfolio-process" aria-label="我的工作方法" id="method">
          {steps.map(([title, description], index) => <li key={title}><span aria-hidden="true">{index + 1}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}
        </ol>
      </div>
    </section>
  )
}

export default function App() {
  return (
    <div className="portfolio-root">
      <a className="portfolio-skip" href="#main">跳到主要內容</a>
      <Header />
      <main id="main">
        <Hero />
        <section className="portfolio-work page-width" id="work" aria-labelledby="work-title">
          <h2 id="work-title">做過的事，<br className="mobile-break" />比頭銜更有說服力。</h2>
          <AdvertisingCase />
          <SelectedWork />
          <ProductStrip />
          <ProjectIndex />
        </section>
        <About />
        <section className="portfolio-contact" id="contact">
          <div className="page-width"><h2>一起，把下一個想法做出來。</h2><a href={contactHref} onClick={() => trackContactClick('contact_section')}>s110905toyo@gmail.com <ArrowUpRight aria-hidden="true" /></a></div>
        </section>
      </main>
      <footer className="portfolio-footer page-width"><a className="wordmark" href="#top">Toyo Chang</a><span>© {new Date().getFullYear()} Toyo Chang</span></footer>
    </div>
  )
}
