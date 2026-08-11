// 在瀏覽器內判定並遮蔽個資與金額。
//
// 這個函式會被序列化後送進頁面執行（page.evaluate / context.addInitScript），
// 因此必須完全自足：不能引用模組外的任何識別字。
//
// 探測與錄影共用同一份判定規則。規則若分成兩份，總有一天只有其中一份被修好。

/**
 * @param {'tag'|'redact'|'observe'} mode
 *   tag     只標記，不改內容（探測報告用，要先看得到值才能回報結構）
 *   redact  標記並立即取代內容
 *   observe 同 redact，另外掛 MutationObserver 持續處理後續渲染（錄影用）
 */
export function redactInPage(mode = 'observe') {
  const MONEY_TEXT = /(?:NT\$|＄|\$)\s?[\d,]+|[\d,]+\s*元/
  const PHONE_TEXT = /09\d{2}[- ]?\d{3}[- ]?\d{3}/
  const NAME_TEXT = /^[一-鿿]{2,4}$/
  const HEADER_WORDS = /^(姓名|租用人|客戶|顧客|客人|電話|車輛|狀態|時間|操作|金額|備註|證件)$/

  // 依表頭判斷整欄性質。與其一直補同義詞（「客人」就漏過一次），
  // 沒對上的欄位一律視為未分類，交由報告呈現，而不是預設安全。
  const classifyColumn = (head) => {
    if (/姓名|名字|客人|客戶|顧客|旅客|乘客|租客|承租|租用人|聯絡人/.test(head)) return 'name'
    if (/電話|手機|聯絡方式|Tel|Phone/i.test(head)) return 'phone'
    if (/證件|身分|身份|末碼|護照|居留/.test(head)) return 'id'
    if (/金額|費用|價|收入|營收|實收|應收/.test(head)) return 'money'
    return null
  }
  window.__classifyColumn = classifyColumn

  // 只排除真正的表頭。曾經多加了 [class*="label"]，結果把租借卡片上的
  // 客戶姓名也一起濾掉——漏判比誤判危險。
  const isHeader = (el) => !!el.closest('thead, th, [role="columnheader"]')

  function tag() {
    // 表格用「表頭 → 欄序」判斷。資料列裡看不到表頭文字，
    // 只靠鄰近字串會整欄漏掉。
    for (const table of document.querySelectorAll('table')) {
      const heads = [...table.querySelectorAll('thead th')].map((th) => th.textContent.trim())
      if (!heads.length) continue
      for (const row of table.querySelectorAll('tbody tr')) {
        [...row.children].forEach((cell, i) => {
          const kind = classifyColumn(heads[i] || '')
          if (kind === 'money') cell.setAttribute('data-money', '')
          else if (kind) cell.setAttribute('data-pii', kind)
        })
      }
    }

    // 表格以外走 text node：金額常包在按鈕或卡片的子層，只看葉元素會漏。
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
    let node
    while ((node = walker.nextNode())) {
      const text = (node.data || '').trim()
      if (!text) continue
      const el = node.parentElement
      if (!el || el.hasAttribute('data-money') || el.hasAttribute('data-pii')) continue
      const context = el.closest('div,li,tr,section')?.textContent ?? ''

      if (MONEY_TEXT.test(text)) el.setAttribute('data-money', '')
      else if (PHONE_TEXT.test(text)) el.setAttribute('data-pii', 'phone')
      else if (/[A-Z]\d{9}/.test(text) || (/^\d{3,4}$/.test(text) && /證|身分|末碼/.test(context)))
        el.setAttribute('data-pii', 'id')
      else if (NAME_TEXT.test(text) && !HEADER_WORDS.test(text) && !isHeader(el)
        && /姓名|租用人|客戶|顧客|客人/.test(context))
        el.setAttribute('data-pii', 'name')
    }

    for (const input of document.querySelectorAll('input')) {
      if (/customerName|phone|document/i.test(input.name || '')) input.setAttribute('data-pii', 'field')
    }
  }

  // 換成假資料而不是黑塊：影片要看起來像正常運作的系統，
  // 而不是一片被塗掉的畫面。長度貼近原值，版面才不會跳動。
  const placeholder = (el) => {
    const kind = el.getAttribute('data-pii')
    if (kind === 'name') return '王○○'
    if (kind === 'phone') return '09XX-XXX-XXX'
    if (kind === 'id') return '＊＊＊＊'
    return '＊＊＊' // 金額
  }

  function redact() {
    let count = 0
    for (const el of document.querySelectorAll('[data-pii], [data-money]')) {
      if (el.dataset.redacted) continue
      const value = placeholder(el)
      if (el.tagName === 'INPUT') el.value = value
      else el.textContent = value
      el.dataset.redacted = '1'
      count++
    }
    return count
  }

  if (mode === 'tag') return tag()

  const run = () => { tag(); return redact() }

  if (mode === 'observe') {
    const start = () => {
      run()
      new MutationObserver(() => run())
        .observe(document.body, { childList: true, subtree: true, characterData: true })
    }
    if (document.body) start()
    else document.addEventListener('DOMContentLoaded', start)
    return 0
  }

  return run()
}

/** 掃描畫面上還有沒有沒被遮掉的個資，錄完用來驗證。 */
export function findLeaks() {
  const PHONE = /09\d{2}[- ]?\d{3}[- ]?\d{3}/
  const leaks = []
  const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  let node
  while ((node = walker.nextNode())) {
    const text = (node.data || '').trim()
    if (!text) continue
    const el = node.parentElement
    if (!el || el.dataset?.redacted) continue
    const r = el.getBoundingClientRect()
    if (!r.width || !r.height) continue
    if (PHONE.test(text)) leaks.push(`電話樣式：${text.replace(/\d/g, '#')} @ y=${Math.round(r.y + scrollY)}`)
    else if (/(?:NT\$|＄|\$)\s?[\d,]+|[\d,]+\s*元/.test(text))
      leaks.push(`金額樣式：${text.replace(/\d/g, '#')} @ y=${Math.round(r.y + scrollY)}`)
  }
  return leaks
}
