// 把 POS 自動點擊助手實際錄下來的點擊腳本畫成一張可播放的動線圖。
//
// 為什麼不錄它的 GUI：那支工具是貼在螢幕頂端、全螢幕寬 220px 高的 topmost 橫幅，
// 塞進 16:9 會變成一條細線；而且在非互動 session 下 tkinter 根本起不來。
// 真正說明這套系統在做什麼的，是它錄下來的那串座標——每天排程重放的就是這個。
//
// 座標與延遲直接取自專案裡的 config_*.json，沒有調整過。

const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')

const SCREEN = { w: 1024, h: 768 }

export function renderClickmapPage({ title, subtitle, primary, profiles }) {
  const step = 1.15          // 每一步之間的間隔（秒）
  const cycle = (primary.steps.length + 2) * step

  const path = primary.steps
    .map((s, i) => `${i === 0 ? 'M' : 'L'} ${s.x} ${s.y}`)
    .join(' ')

  const dots = primary.steps.map((s, i) => {
    // 靠近右邊界的點要把標籤翻到左邊，否則文字會被畫布裁掉
    const flip = s.x > SCREEN.w - 210
    return `
    <g class="hit" style="animation-delay:${(0.8 + i * step).toFixed(2)}s">
      <circle class="ripple" cx="${s.x}" cy="${s.y}" r="14" />
      <circle class="core" cx="${s.x}" cy="${s.y}" r="9" />
      <text class="idx" x="${s.x}" y="${s.y + 5}">${i + 1}</text>
      <text class="lbl" x="${s.x + (flip ? -18 : 18)}" y="${s.y + 5}"${flip ? ' text-anchor="end"' : ''}>${s.x}, ${s.y} · ${s.delay}s</text>
    </g>`
  }).join('')

  const cards = profiles.map((p) => `
    <li>
      <strong>${esc(p.name)}</strong>
      <span>${p.steps} 個點擊 · 間隔 ${p.delay}s · 中斷點 ${p.interrupts}</span>
    </li>`).join('')

  return `<!doctype html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8" />
<title>${esc(title)}</title>
<style>
  :root {
    --bg: #07111f; --panel: #0d1a2b; --line: #1d3047;
    --ink: #e8f0fb; --dim: #8ea4c0; --accent: #5eead4; --hot: #fbbf24;
  }
  * { box-sizing: border-box; }
  body {
    margin: 0; background: var(--bg); color: var(--ink); padding: 30px 40px;
    font-family: "Noto Sans TC", "Microsoft JhengHei", system-ui, sans-serif;
  }
  .eyebrow {
    font-size: 12px; letter-spacing: .18em; text-transform: uppercase;
    color: var(--accent); margin: 0 0 8px;
  }
  h1 { font-size: 25px; margin: 0 0 6px; letter-spacing: -.01em; }
  .sub { font-size: 13px; color: var(--dim); margin: 0 0 22px; }
  .layout { display: grid; grid-template-columns: 1fr 300px; gap: 26px; align-items: start; }
  .screen {
    border: 1px solid var(--line); border-radius: 12px; background: var(--panel);
    padding: 12px; position: relative;
  }
  .screen figcaption {
    font-size: 12px; color: var(--dim); margin-top: 8px;
    font-family: ui-monospace, Consolas, monospace;
  }
  svg { width: 100%; height: auto; display: block; background: #050d18; border-radius: 8px; }
  .grid { stroke: #12233a; stroke-width: 1; }
  .trail {
    fill: none; stroke: var(--accent); stroke-width: 2.5; opacity: .5;
    stroke-dasharray: 3000; stroke-dashoffset: 3000;
    animation: draw ${(cycle * 0.75).toFixed(2)}s linear infinite;
  }
  .hit { opacity: 0; animation: pop ${cycle.toFixed(2)}s ease-out infinite; }
  .core { fill: var(--hot); }
  .ripple { fill: none; stroke: var(--hot); stroke-width: 2.5; opacity: .8; }
  .idx { fill: #07111f; font-size: 11px; font-weight: 700; text-anchor: middle; font-family: system-ui; }
  .lbl { fill: var(--dim); font-size: 13px; font-family: ui-monospace, Consolas, monospace; }
  aside h2 { font-size: 14px; margin: 0 0 12px; color: var(--dim); letter-spacing: .04em; }
  ul { list-style: none; margin: 0 0 22px; padding: 0; }
  li {
    border: 1px solid var(--line); border-radius: 10px; background: var(--panel);
    padding: 13px 15px; margin-bottom: 10px;
  }
  li strong { display: block; font-size: 15px; margin-bottom: 4px; }
  li span { font-size: 12.5px; color: var(--dim); font-family: ui-monospace, Consolas, monospace; }
  .note {
    border-left: 3px solid var(--accent); padding: 4px 0 4px 13px;
    font-size: 13px; color: #cfdcee; line-height: 1.75;
  }
  @keyframes draw { to { stroke-dashoffset: 0; } }
  @keyframes pop {
    0%, ${(0 / cycle * 100).toFixed(1)}% { opacity: 0; }
    3% { opacity: 1; }
    ${((cycle - step) / cycle * 100).toFixed(1)}% { opacity: 1; }
    100% { opacity: .35; }
  }
</style>
</head>
<body>
  <p class="eyebrow">JOJOZOO / POS AUTOMATION</p>
  <h1>${esc(title)}</h1>
  <p class="sub">${esc(subtitle)}</p>

  <div class="layout">
    <figure class="screen" style="margin:0">
      <svg viewBox="0 0 ${SCREEN.w} ${SCREEN.h}" role="img" aria-label="點擊動線圖">
        ${Array.from({ length: 7 }, (_, i) => `<line class="grid" x1="0" y1="${(i + 1) * 96}" x2="${SCREEN.w}" y2="${(i + 1) * 96}" />`).join('')}
        ${Array.from({ length: 7 }, (_, i) => `<line class="grid" x1="${(i + 1) * 128}" y1="0" x2="${(i + 1) * 128}" y2="${SCREEN.h}" />`).join('')}
        <path class="trail" d="${path}" />
        ${dots}
      </svg>
      <figcaption>${esc(primary.name)} · 座標與延遲取自 config_${esc(primary.file)}.json，未經調整</figcaption>
    </figure>

    <aside>
      <h2>已錄製的作業</h2>
      <ul>${cards}</ul>
      <p class="note">
        每個作業各錄一次即可，之後由 Windows 工作排程器在固定時間重放。
        中斷點用來在流程中途插入人工排除，避免整段重錄。
      </p>
    </aside>
  </div>
</body>
</html>
`
}
