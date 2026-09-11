// 示範影片的分類，決定它們放在 public/videos/ 底下的哪個子資料夾。
//
// 目的很單純：在檔案總管裡開資料夾時能依類型找片，而不是面對 16 個平鋪的檔名。
// 網站上的影片網址也跟著走同一套路徑，維持一份真相。
//
// 分類與首頁案例庫用的是同一套（src/App.tsx 的 category）。**改動時兩邊要一起改**，
// 不然首頁顯示的分類會和影片資料夾對不上。

/** 案例 slug → 分類資料夾名稱。 */
export const VIDEO_CATEGORY = {
  '01-summer-camp': '營運系統',
  '02-payment-system': '營運系統',
  '03-hotel-partner-system': '營運系統',
  '05-ticket-price-calculator': '營運系統',
  '09-jojozoocart': '營運系統',
  '12-webar-park-guide': '營運系統',

  '04-children-drawing-contest': '行銷活動',
  '07-kuangsan-collaboration': '行銷活動',
  '10-line-lucky-draw': '行銷活動',
  '11-mothersday-lottery': '行銷活動',
  '14-anniversary-find-four': '行銷活動',
  '15-meta-ads-warroom': '行銷活動',
  '16-seo-analytics': '行銷活動',

  '06-erp-automation-spider': '自動化與AI',
  '08-pos-autoclicker': '自動化與AI',
  '13-customer-service-automation': '自動化與AI',
}

/** 沒列到的案例一律丟進這裡，不要讓它靜悄悄消失在根目錄。 */
export const FALLBACK_CATEGORY = '未分類'

export const categoryOf = (slug) => VIDEO_CATEGORY[slug] ?? FALLBACK_CATEGORY

/** 影片在網站上的路徑；中文資料夾名要編碼過才能放進 HTML。 */
export const videoHref = (slug, ext) => `/videos/${encodeURIComponent(categoryOf(slug))}/${slug}.${ext}`

/** 影片在磁碟上的相對路徑（相對於 public/ 或 dist/）。 */
export const videoPath = (slug, ext) => `videos/${categoryOf(slug)}/${slug}.${ext}`
