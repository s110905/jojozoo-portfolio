# JoJo Zoo 小小畫家參賽作品系統 (Drawing Contest System)


## 📸 系統成果截圖

![系統介面成果](./result.png)

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20TypeScript%20%7C%20Firebase-blue)

這是一個為 JoJo Zoo 園區舉辦的兒童繪畫比賽開發的數位報名系統。系統整合了作品上傳、線上藝廊展示、後台審核與階段性活動控管功能，大幅優化了過去實體收件與人工統計的繁瑣過程。

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

