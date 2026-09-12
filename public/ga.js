// GA4 埋碼。首頁（Vite SPA）與 scripts/build-cases.mjs 產生的案例靜態頁共用這一支，
// ID 只寫在這裡一處，換 GA4 資源時只要改下面這行。
// CSP 是 script-src 'self'，所以不能用 Google 官方那段 inline snippet，必須走這個外部檔。
// GA4 資源「Toyo Chang Portfolio」(94064420 / 553889304)，串流 15764484246
var GA_ID = 'G-TQ3RS0NCNE'

// 本機 dev / preview 不送資料，避免自己開發的瀏覽把流量灌進正式報表。
var IS_LOCAL = /^(localhost|127\.0\.0\.1|\[::1\])$/.test(location.hostname)

if (!IS_LOCAL && GA_ID.indexOf('G-X') !== 0) {
  var loader = document.createElement('script')
  loader.async = true
  loader.src = 'https://www.googletagmanager.com/gtag/js?id=' + GA_ID
  document.head.appendChild(loader)

  window.dataLayer = window.dataLayer || []
  window.gtag = function () {
    window.dataLayer.push(arguments)
  }
  window.gtag('js', new Date())
  window.gtag('config', GA_ID)
}
