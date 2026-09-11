// 產生「示意童畫」，用來在錄影時替換掉真實投稿作品。
//
// 04-children-drawing-contest 的藝廊裡是真實兒童的畫作與姓名。作品集要展示的是
// 這套系統做了什麼（投稿、審核、藝廊、投票、排行），不是這些孩子的畫。
// 所以錄影時把圖片請求整個攔下來換成這裡產生的圖——真實作品從頭到尾沒有進到瀏覽器，
// 不是事後打馬賽克。
//
// 每個 URL 會得到固定但不同的配色，畫面才不會整排一模一樣。

const PALETTES = [
  { sky: '#cfe9ff', ground: '#bde5a8', sun: '#ffd45e', body: '#ff9a6c', accent: '#7c5cff' },
  { sky: '#ffe9c7', ground: '#a8e0c4', sun: '#ff8b5e', body: '#6cc5ff', accent: '#ff5ea8' },
  { sky: '#e6dcff', ground: '#ffe08a', sun: '#ff6b6b', body: '#5ed6a8', accent: '#3c7cff' },
  { sky: '#d8f5f0', ground: '#c9e08a', sun: '#ffc93c', body: '#ff7ab8', accent: '#5a9cff' },
  { sky: '#ffd9e6', ground: '#b6e3ff', sun: '#ffe066', body: '#9be07a', accent: '#ff7a3c' },
]

const hash = (s) => {
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0
  return h
}

/** 回傳一張 A4 直式的示意童畫 SVG 字串。seed 相同就會得到同一張。 */
export function fakeArtworkSvg(seed = '') {
  const n = hash(String(seed))
  const p = PALETTES[n % PALETTES.length]
  const sunX = 120 + (n % 5) * 60
  const tilt = ((n >> 3) % 7) - 3
  const legs = [0, 1, 2, 3].map((i) => `<rect x="${186 + i * 34}" y="372" width="16" height="46" rx="8" fill="${p.body}"/>`).join('')
  const clouds = [0, 1].map((i) => {
    const x = 70 + ((n >> (4 + i * 3)) % 5) * 90 + i * 120
    const y = 90 + i * 46
    return `<g fill="#ffffff" opacity="0.9"><ellipse cx="${x}" cy="${y}" rx="46" ry="24"/><ellipse cx="${x + 34}" cy="${y + 6}" rx="34" ry="19"/></g>`
  }).join('')

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 420 594" width="420" height="594">
  <rect width="420" height="594" fill="#fffdf6"/>
  <rect x="10" y="10" width="400" height="574" rx="12" fill="${p.sky}"/>
  <circle cx="${sunX}" cy="96" r="44" fill="${p.sun}"/>
  ${clouds}
  <path d="M10 420 Q110 372 210 414 T410 400 V584 H10 Z" fill="${p.ground}"/>
  <g transform="rotate(${tilt} 250 370)">
    <ellipse cx="250" cy="352" rx="96" ry="56" fill="${p.body}"/>
    <circle cx="338" cy="312" r="42" fill="${p.body}"/>
    <circle cx="352" cy="302" r="7" fill="#3a2a20"/>
    <path d="M330 276 l14 -34 l18 30 Z" fill="${p.accent}"/>
    ${legs}
    <path d="M158 336 q-44 -18 -56 22" stroke="${p.body}" stroke-width="14" fill="none" stroke-linecap="round"/>
  </g>
  <g stroke="${p.accent}" stroke-width="9" stroke-linecap="round" fill="none" opacity="0.85">
    <path d="M56 500 q28 -46 58 0 t58 0"/>
    <path d="M236 522 l30 -44 l30 44"/>
  </g>
  <text x="210" y="566" font-family="sans-serif" font-size="21" font-weight="700" fill="#6b7a89" text-anchor="middle">示意作品</text>
</svg>`
}
