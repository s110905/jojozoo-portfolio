// 阻擋對正式系統的寫入。
//
// 錄影與探測都在跑正式營運系統，這是唯一擋住資料被改動的東西，
// 所以只放這一份，兩邊共用，不要各自複製一份規則。
//
// 政策是預設拒絕：GET 一律放行，其餘方法只放行明確列在允許清單裡的端點。
// 遊園車的 API 用 POST 做讀取，所以不能單純以「非 GET 就是寫入」判斷。

/** 用 POST 但其實是讀取或登入的端點，放行。 */
const READ_ONLY_POSTS = [
  '/api/staff-rentals', // 取得租借清單
  '/api/staff-login',   // 換 token
]

/** 會改動資料的端點，永遠擋掉。列出來是為了讓意圖明確，預設拒絕已經涵蓋它們。 */
const KNOWN_WRITES = [
  '/api/rental-draft',   // 建立租借草稿
  '/api/public-rentals', // 建立租借
  '/api/staff-action',   // 換車／作廢／核銷
]

/**
 * @param {import('playwright').BrowserContext} context
 * @param {{ allowLogin?: boolean }} options 登入階段結束後呼叫 lockdown() 連登入也擋掉
 * @returns {{ blocked: string[], lockdown: () => void }}
 */
export function installWriteGuard(context, { allowLogin = true } = {}) {
  const blocked = []
  let loginAllowed = allowLogin

  context.route('**/*', (route) => {
    const request = route.request()
    if (request.method() === 'GET') return route.continue()

    const path = new URL(request.url()).pathname
    const isLogin = path === '/api/staff-login'
    const allowed = READ_ONLY_POSTS.includes(path) && (!isLogin || loginAllowed)

    if (allowed) return route.continue()
    blocked.push(`${request.method()} ${path}`)
    return route.abort()
  })

  return {
    blocked,
    lockdown: () => { loginAllowed = false },
    KNOWN_WRITES,
  }
}
