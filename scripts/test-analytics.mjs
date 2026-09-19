import assert from 'node:assert/strict'
import { readFile, readdir } from 'node:fs/promises'
import { join } from 'node:path'
import vm from 'node:vm'

const root = join(import.meta.dirname, '..')
const gaSource = await readFile(join(root, 'public', 'ga.js'), 'utf8')

function loadGa(hostname) {
  let clickListener
  const dataLayer = []
  const window = { dataLayer }
  const document = {
    createElement: () => ({}),
    head: { appendChild: () => {} },
    addEventListener: (type, listener) => {
      if (type === 'click') clickListener = listener
    },
  }

  vm.runInNewContext(gaSource, { Date, document, location: { hostname }, window })
  return { clickListener, dataLayer, window }
}

const local = loadGa('localhost')
assert.equal(local.window.gtag, undefined, 'localhost 不應建立 gtag')
assert.equal(local.clickListener, undefined, 'localhost 不應安裝 GA click listener')

const production = loadGa('toyo-chang.pages.dev')
assert.equal(typeof production.window.gtag, 'function', '正式網域應建立 gtag')
assert.equal(typeof production.clickListener, 'function', '正式網域應安裝 click listener')

const attributes = new Map([
  ['data-ga-event', 'contact_click'],
  ['data-ga-entry-point', 'case_cta'],
  ['data-ga-case-slug', '01-summer-camp'],
])
const trackedLink = { getAttribute: (name) => attributes.get(name) ?? null }
production.clickListener({ target: { closest: () => trackedLink } })

const eventCalls = production.dataLayer.map(entry => Array.from(entry)).filter(entry => entry[0] === 'event')
assert.equal(eventCalls.length, 1, '單次 CTA 點擊只能送出一筆事件')
assert.equal(eventCalls[0][1], 'contact_click')
assert.deepEqual(JSON.parse(JSON.stringify(eventCalls[0][2])), {
  case_slug: '01-summer-camp',
  entry_point: 'case_cta',
  transport_type: 'beacon',
})

production.clickListener({ target: {} })
assert.equal(
  production.dataLayer.map(entry => Array.from(entry)).filter(entry => entry[0] === 'event').length,
  1,
  '非追蹤元素不得送出事件',
)

const invalidAttributes = new Map([
  ['data-ga-event', 'unapproved_event'],
  ['data-ga-entry-point', 'case_cta'],
  ['data-ga-case-slug', '01-summer-camp'],
])
production.clickListener({ target: { closest: () => ({ getAttribute: name => invalidAttributes.get(name) ?? null }) } })
assert.equal(
  production.dataLayer.map(entry => Array.from(entry)).filter(entry => entry[0] === 'event').length,
  1,
  '未列入白名單的事件不得送出',
)

const invalidEntryPointAttributes = new Map([
  ['data-ga-event', 'contact_click'],
  ['data-ga-entry-point', 'unexpected_cta'],
  ['data-ga-case-slug', '01-summer-camp'],
])
production.clickListener({ target: { closest: () => ({ getAttribute: name => invalidEntryPointAttributes.get(name) ?? null }) } })
assert.equal(
  production.dataLayer.map(entry => Array.from(entry)).filter(entry => entry[0] === 'event').length,
  1,
  '非 case_cta 入口不得送出事件',
)

for (const invalidSlug of [null, 'summer camp', '../summer-camp']) {
  const invalidSlugAttributes = new Map([
    ['data-ga-event', 'contact_click'],
    ['data-ga-entry-point', 'case_cta'],
    ['data-ga-case-slug', invalidSlug],
  ])
  production.clickListener({ target: { closest: () => ({ getAttribute: name => invalidSlugAttributes.get(name) ?? null }) } })
}
assert.equal(
  production.dataLayer.map(entry => Array.from(entry)).filter(entry => entry[0] === 'event').length,
  1,
  '缺少或格式錯誤的案例 slug 不得送出事件',
)

const caseRoot = join(root, 'dist', 'case')
const caseDirectories = (await readdir(caseRoot, { withFileTypes: true })).filter(entry => entry.isDirectory())
assert.equal(caseDirectories.length, 16, '應產生 16 個主案例目錄')

for (const directory of caseDirectories) {
  const html = await readFile(join(caseRoot, directory.name, 'index.html'), 'utf8')
  assert.equal((html.match(/data-ga-event="contact_click"/g) ?? []).length, 1, `${directory.name} 應有且只有一個聯絡 CTA`)
  assert.match(html, /data-ga-entry-point="case_cta"/)
  assert.doesNotMatch(html, /\sonclick=/i, `${directory.name} 不得產生 inline onclick`)
}

console.log('analytics contract: PASS')
