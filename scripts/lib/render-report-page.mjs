// 把專案裡實際產出的 markdown 報告渲染成一頁可錄影的畫面。
//
// 用途是 16-seo-analytics 這類「沒有圖形介面、產出就是一份報告」的案例：
// 與其重建一個假的儀表板，不如直接呈現他真正寫出來的那份分析。
// 內容一個字都沒有改，只是換上看得清楚的排版。
//
// 低於 70% 的比率會被標成警示色——那正是這份報告要指出的觸達缺口，
// 讓它在影片裡一眼看得到。

import { marked } from 'marked'

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

export function renderReportPage({ title, eyebrow, source, markdown }) {
  const body = marked
    .parse(markdown.replace(/^#\s+.*\n/, '')) // 標題由頁首負責，正文不重複
    .replace(/(\d+(?:\.\d+)?)%/g, (m, n) => (Number(n) < 70 ? `<span class="low">${m}</span>` : m))
    .replace(/<table>/g, '<div class="table-wrap"><table>')
    .replace(/<\/table>/g, '</table></div>')

  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  :root {
    --bg: #07111f; --panel: #0d1a2b; --line: #1d3047;
    --ink: #e8f0fb; --muted: #8ea4c0; --accent: #5eead4; --warn: #fb7185;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--ink);
    font-family: "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif;
    font-size: 15px; line-height: 1.75;
  }
  .sheet { max-width: 1000px; margin: 0 auto; padding: 52px 56px 80px; }
  header { border-bottom: 1px solid var(--line); padding-bottom: 26px; margin-bottom: 34px; }
  .eyebrow {
    font-size: 12px; letter-spacing: .18em; text-transform: uppercase;
    color: var(--accent); margin: 0 0 10px;
  }
  h1 { font-size: 31px; line-height: 1.3; margin: 0 0 12px; letter-spacing: -.01em; }
  .source { font-size: 13px; color: var(--muted); margin: 0; font-family: ui-monospace, "Cascadia Code", monospace; }
  h2 {
    font-size: 20px; margin: 44px 0 14px; padding-left: 13px;
    border-left: 3px solid var(--accent);
  }
  h3 { font-size: 16px; margin: 28px 0 10px; color: var(--muted); }
  p, li { color: #cfdcee; }
  ul, ol { padding-left: 22px; }
  li { margin: 7px 0; }
  code {
    font-family: ui-monospace, "Cascadia Code", monospace; font-size: .88em;
    background: #13243a; color: var(--accent); padding: 2px 6px; border-radius: 4px;
  }
  .table-wrap {
    overflow-x: auto; border: 1px solid var(--line); border-radius: 12px;
    background: var(--panel); margin: 18px 0;
  }
  table { width: 100%; border-collapse: collapse; font-size: 14px; }
  th, td { padding: 12px 16px; text-align: left; border-bottom: 1px solid var(--line); white-space: nowrap; }
  th { background: #102034; font-size: 12px; letter-spacing: .06em; color: var(--muted); font-weight: 600; }
  td:not(:first-child), th:not(:first-child) { text-align: right; font-variant-numeric: tabular-nums; }
  tr:last-child td { border-bottom: 0; }
  .low { color: var(--warn); font-weight: 700; }
  input[type="checkbox"] { accent-color: var(--accent); margin-right: 6px; }
  li:has(input) { list-style: none; margin-left: -18px; }
</style>
</head>
<body>
  <div class="sheet">
    <header>
      <p class="eyebrow">${esc(eyebrow)}</p>
      <h1>${esc(title)}</h1>
      <p class="source">${esc(source)}</p>
    </header>
${body}
  </div>
</body>
</html>
`
}
