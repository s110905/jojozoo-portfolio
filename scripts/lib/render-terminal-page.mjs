// 把真實的執行紀錄做成一段可錄影的終端機播放畫面。
//
// 用途是 06-erp-automation-spider 這種案例：它是排程跑的爬蟲，沒有圖形介面，
// 而且**不能為了錄影而真的執行**——真跑會登入正式 ERP 並寫進正式試算表。
// 所以拿它自己留下的 log 原文來播；內容是真的，只有呈現方式是重現的。
//
// 逐行浮現用純 CSS 動畫，頁面裡沒有任何 JS，錄影時播放節奏固定、可預期。

const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

/** 依行首特徵給顏色，讓成功、偵錯與階段標題在畫面上分得出來。 */
function classify(line) {
  if (/^\s*✅|: ✅/.test(line)) return 'ok'
  if (/^\s*❌|: ❌/.test(line)) return 'bad'
  if (/^🚀|^---|^\s*$/.test(line)) return 'head'
  if (/\[Debug\]|\[偵錯\]/.test(line)) return 'dim'
  if (/^\[.*\]/.test(line)) return 'tag'
  return ''
}

export function renderTerminalPage({ title, subtitle, command, lines, lineDelay = 0.25 }) {
  const rows = lines.map((line, i) => {
    const cls = classify(line)
    const delay = (0.6 + i * lineDelay).toFixed(2)
    return `<div class="ln${cls ? ` ${cls}` : ''}" style="animation-delay:${delay}s">${esc(line) || '&nbsp;'}</div>`
  }).join('\n')

  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  :root {
    --bg: #07111f; --chrome: #0d1a2b; --line: #1d3047;
    --ink: #d7e4f4; --dim: #6d84a1; --ok: #5eead4; --bad: #fb7185; --tag: #7dd3fc;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--ink); padding: 34px 44px 60px;
    font-family: "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif;
  }
  header { margin-bottom: 20px; }
  .eyebrow {
    font-size: 12px; letter-spacing: .18em; text-transform: uppercase;
    color: var(--ok); margin: 0 0 8px;
  }
  h1 { font-size: 25px; margin: 0 0 6px; letter-spacing: -.01em; }
  .sub { font-size: 13px; color: var(--dim); margin: 0; }
  .term {
    border: 1px solid var(--line); border-radius: 12px; overflow: hidden;
    background: #050d18; box-shadow: 0 18px 50px rgba(0, 0, 0, .45);
  }
  .bar {
    display: flex; align-items: center; gap: 8px;
    padding: 10px 14px; background: var(--chrome); border-bottom: 1px solid var(--line);
  }
  .dot { width: 11px; height: 11px; border-radius: 50%; background: #33455c; }
  .dot:first-child { background: #fb7185; }
  .dot:nth-child(2) { background: #fbbf24; }
  .dot:nth-child(3) { background: #34d399; }
  .bar span {
    margin-left: 8px; font-size: 12px; color: var(--dim);
    font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
  }
  .body {
    padding: 16px 20px 22px;
    font-family: ui-monospace, "Cascadia Code", Consolas, monospace;
    font-size: 13.5px; line-height: 1.55; white-space: pre-wrap; word-break: break-word;
  }
  .cmd { color: var(--ok); margin-bottom: 6px; }
  .cmd::before { content: "$ "; color: var(--dim); }
  .ln { opacity: 0; animation: reveal .28s ease forwards; }
  .ln.ok { color: var(--ok); }
  .ln.bad { color: var(--bad); }
  .ln.tag { color: var(--tag); }
  .ln.dim { color: var(--dim); }
  .ln.head { color: #fff; font-weight: 600; }
  @keyframes reveal { from { opacity: 0; transform: translateY(3px); } to { opacity: 1; transform: none; } }
</style>
</head>
<body>
  <header>
    <p class="eyebrow">JOJOZOO / ERP AUTOMATION</p>
    <h1>${esc(title)}</h1>
    <p class="sub">${esc(subtitle)}</p>
  </header>
  <div class="term">
    <div class="bar">
      <i class="dot"></i><i class="dot"></i><i class="dot"></i>
      <span>${esc(command)}</span>
    </div>
    <div class="body">
      <div class="cmd">${esc(command)}</div>
${rows}
    </div>
  </div>
</body>
</html>
`
}
