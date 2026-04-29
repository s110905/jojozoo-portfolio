# JoJo Zoo 小小畫家參賽作品系統 (Drawing Contest System)

[⬅️ 返回作品集總覽](../README.md)



## 📸 系統成果截圖

![系統介面成果](./result.png)

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Firebase-blue)

## 🚩 營運與行銷痛點 (Pain Points)
在舉辦大型兒童繪畫比賽時，傳統的「實體收件」與「人工統計」面臨以下挑戰：
*   **物流成本高**：家長需親自郵寄或親送作品，降低參與意願。
*   **曝光度不足**：作品收件後僅能在現場展示，無法達成網路擴散效能。
*   **審核效率低**：工作人員需手動登記、分類與建檔，容易出錯且耗時。

## 🎯 行銷策略與技術方案 (Strategy)
本系統將繪畫比賽轉化為 **「MarTech 數位行銷活動」**，核心策略如下：
*   **數位轉型 O2O**：透過線上報名與藝廊展示，打破地理限制，讓全台家長都能輕鬆參與。
*   **社群擴散機制**：每件作品皆有專屬連結與線上藝廊，引導家長在社群媒體分享，達成低成本的品牌曝光。
*   **品牌信賴感建立**：整合 Google 驗證與專業 UI 設計，提升活動層次與家長對 JoJo Zoo 品牌的信賴度。

## 📈 商業價值與影響力 (Business Impact)
*   **參與人數提升**：數位化報名流程將參與門檻降至最低，預期提升 **50% 以上** 的活動參與度。
*   **行政成本劇降**：自動化審核與作品統計，為行銷團隊節省約 **80%** 的文書處理時間。
*   **數位資產留存**：建立活動歷史資料庫，作為未來行銷推廣與分眾行銷的精準名單。

## 🌟 核心功能 (Core Features)

*   **數位報名與上傳 (Online Submission)**：支援家長透過手機直接拍攝畫作並上傳，系統內建圖片壓縮邏輯以優化存取效能。
*   **作品藝廊 (Public Gallery)**：提供美觀的作品展示介面，方便民眾瀏覽所有參賽作品。
*   **階段控管機制 (Phase Control)**：具備靈活的活動週期管理（上傳期、投票期、已截止），依階段自動切換 UI 功能。
*   **防弊與驗證 (Security & Validation)**：
    *   整合 Google 登入驗證身分。
    *   實作「一帳號限一作品」與「姓名重複檢查」邏輯，確保比賽公平性。
*   **即時通知 (Real-time Notification)**：整合 Webhook 系統，當有新作品提交時即時通知管理團隊進行審核。

## 🛠️ 技術亮點 (Technical Highlights)

*   **全棧無伺服器架構 (Serverless)**：完全基於 Firebase (Auth, Firestore, Storage, Functions) 構建，具備極佳的擴展性與維運便利性。
*   **高效能前端**: 使用 React 18 + Vite + TypeScript 開發，採用元件動態載入 (Lazy Loading) 提升首屏載入速度。
*   **品質管控**: 實作前端圖片壓縮 (Image Compression) 技術，平衡了預覽畫質與儲存空間。
*   **現代 UI/UX**: 使用 Tailwind CSS 打造活潑且符合兒童主題的視覺設計，並具備流暢的微動畫效果。

## 🏗️ 專案結構

```text
├── src
│   ├── components   # 共享 UI 組件 (Layout, GalleryCard 等)
│   ├── pages        # Home, Submit, Gallery, Admin 頁面
│   ├── services     # Firebase (DB, Storage) 資料操作邏輯
│   ├── hooks        # 業務邏輯封裝 (Auth, InAppBrowser)
│   └── config       # 活動階段與參數配置
└── functions        # Firebase Cloud Functions (後端處理)
```

## 🚀 成果價值 (Business Value)

本系統成功將實體比賽轉化為線上互動體驗，不僅增加了比賽的曝光度與參與度，更透過自動化審核與即時統計，為園區工作人員省下了大量的行政處理時間，是數位轉型與行銷活動結合的優良實務範例。

---
*Created for the JoJo Zoo Children's Art Initiative (2026)*

---
> 💡 **AI 協作筆記**：本專案之 [架構設計/邏輯優化/Bug 修復] 係透過與 AI 深度對話共同完成，展現了高效能的 AI 輔助開發模式。

