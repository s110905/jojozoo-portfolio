import { ArrowRight, ArrowUpRight, Menu, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { categoryLabels, filterOptions, projects, stripProjects, thumbSrc, type ProjectFilter } from './data/projects'
import './portfolio.css'

const campImage = '/images/cases/01-summer-camp/result.webp'
const huntImage = '/videos/行銷活動/14-anniversary-find-four.jpg'
const reviewImage = '/videos/自動化與AI/13-customer-service-automation.jpg'
const caseUrl = (slug: string) => `/case/${slug}/`
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
            <a href={caseUrl(project.slug)}>
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
          <a className="portfolio-button" href="#work">探索我的作品 <ArrowRight size={19} aria-hidden="true" /></a>
        </div>
        <div className="project-composition" aria-label="夏令營報名與園區集點系統實際畫面">
          <a className="desktop-mockup" href={caseUrl('01-summer-camp')} aria-label="查看夏令營報名系統案例">
            <div className="device-toolbar" aria-hidden="true"><i /><i /><i /><span>jojozoo summer camp</span></div>
            <img src={campImage} alt="九九峰夏令營報名網站" width="1400" height="788" fetchPriority="high" />
          </a>
          <a className="phone-mockup" href={caseUrl('14-anniversary-find-four')} aria-label="查看周年慶集點系統案例">
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
      <a className="exhibit exhibit-main" href={caseUrl('01-summer-camp')}>
        <div className="exhibit-image camp-exhibit"><img src={campImage} alt="夏令營報名系統首頁" width="1400" height="788" loading="lazy" /></div>
        <div className="exhibit-copy"><h3>夏令營一站式報名系統</h3><p>23 個梯次，1 小時內完成報名</p><ArrowUpRight aria-hidden="true" /></div>
      </a>
      <a className="exhibit exhibit-side" href={caseUrl('14-anniversary-find-four')}>
        <div className="exhibit-image hunt-exhibit"><div className="exhibit-phone"><img src={huntImage} alt="園區尋4集點系統" width="1280" height="720" loading="lazy" /></div></div>
        <div className="exhibit-copy"><h3>4 周年尋4大作戰</h3><p>50 組 QR 的園區集點體驗</p><ArrowUpRight aria-hidden="true" /></div>
      </a>
      <a className="exhibit exhibit-side" href={caseUrl('13-customer-service-automation')}>
        <div className="exhibit-image review-exhibit"><img src={reviewImage} alt="AI 客服調度台示範畫面" width="1280" height="720" loading="lazy" /></div>
        <div className="exhibit-copy"><h3>Google 評論 AI 客服</h3><p>7,157 則評論，人工保留發布權</p><ArrowUpRight aria-hidden="true" /></div>
      </a>
    </div>
  )
}

function ProjectIndex() {
  const [filter, setFilter] = useState<ProjectFilter>('all')
  const visibleProjects = filter === 'all' ? projects : projects.filter(project => project.category === filter)
  return (
    <div className="project-index" aria-label="完整案例庫">
      <div className="index-toolbar">
        <div className="index-filters" role="group" aria-label="案例分類">
          {filterOptions.map(option => <button key={option.value} type="button" aria-pressed={filter === option.value} onClick={() => setFilter(option.value)}>
            {option.label}<span aria-hidden="true">{option.value === 'all' ? projects.length : projects.filter(project => project.category === option.value).length}</span>
          </button>)}
        </div>
        <p className="index-status" role="status">顯示 {visibleProjects.length} 個案例</p>
      </div>
      <div className="index-list">
        {visibleProjects.map(project => <a className="index-row" key={project.slug} href={caseUrl(project.slug)}>
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
          <SelectedWork />
          <ProductStrip />
          <ProjectIndex />
        </section>
        <About />
        <section className="portfolio-contact" id="contact">
          <div className="page-width"><h2>一起，把下一個想法做出來。</h2><a href="mailto:s110905toyo@gmail.com">s110905toyo@gmail.com <ArrowUpRight aria-hidden="true" /></a></div>
        </section>
      </main>
      <footer className="portfolio-footer page-width"><a className="wordmark" href="#top">Toyo Chang</a><span>© {new Date().getFullYear()} Toyo Chang</span></footer>
    </div>
  )
}
