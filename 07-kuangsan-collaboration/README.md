# 廣三 SOGO X 九九峰動物園：過年活動領券系統

[⬅️ 返回作品集總覽](../README.md)

🔗 **[點此造訪正式上線網站 (Kuangsan Ticket)](https://www.jojozoopark.com/kuangsan-ticket/)**
*(註：此為企業行銷活動之線上產品。由於原始碼具版權保護，本 Repo 僅供架構分享與能力佐證，不提供完整業務邏輯程式碼)*

## 📸 系統成果截圖

![系統介面成果](./result.png)

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20Apps%20Script-blue)
![Marketing](https://img.shields.io/badge/Focus-B2C%20Promotion-orange)

## 🚩 異業結盟的數位挑戰 (Pain Points)
在跨界行銷活動（百貨公司 X 樂園）中，常面臨以下痛點：
*   **導流成效難以追蹤**：百貨公司發放實體券後，無法精確知道有多少人真正到樂園核銷。
*   **領取門檻高/不便**：紙本券易遺失，且無法實現「領取即追蹤」。
*   **行銷成本浪費**：無法防止重複領取，導致資源被同一批使用者佔用。

## 🎯 行銷策略：建立「高效 O2O 轉換漏斗」 (Strategy)
本系統作為異業結盟的數位橋樑，核心策略為：
*   **數位化導流 (Digital Bridge)**：透過 QR Code 直接將百貨客群導向數位領券頁，實現秒級領取。
*   **精準身分驗證**：利用手機門號實作「一機一券」，確保行銷資源分配的公平性與精確性。
*   **全鏈路數據追蹤**：整合 GA4 監控「點擊 -> 填號 -> 領券 -> 核銷」的每一個步驟，計算精確的轉換成本 (CPA)。

## 📈 商業價值與影響力 (Business Impact)
*   **高轉化效率**：簡化流程後，預期將實體領券的流失率降低 **40%**。
*   **精準名單收集**：成功收集數千筆潛在客群資料，作為後續節慶行銷的精準推播基礎。
*   **量化活動 ROI**：讓行銷團隊能以具體的數據報表，向合作雙方證明活動的實際營收貢獻。

## 🌟 核心功能 (Core Features)

*   **極簡領券流程**：專為行動裝置優化，強調「一鍵領取」的直覺式操作。
*   **身分唯一性驗證**：
    *   後端整合 Google Apps Script 作為輕量化資料庫。
    *   前端結合 `localStorage` 與手機號碼檢核，實現「一機一號一券」的領取規則，防止惡意重複領取。
*   **即時動態 QR Code**：產出專屬加密 Token 與 QR Code，便於園區現場工作人員快速核銷。
*   **流量分析整合**：完整串接 Google Analytics (GA4) 事件追蹤，精確分析從點擊、輸入到領券成功的轉換漏斗。

## 🛠️ 技術亮點 (Technical Highlights)

*   **輕量化全棧方案**: 採用 React + Vite 作為前端，並利用 Google Apps Script 作為 Serverless API 服務，實現低成本、高併發的穩定運行。
*   **用戶體驗優化**: 實作「裝置狀態記憶」功能，使用者重新開啟頁面時會自動找回已領取的票券，減少重複輸入的需求。
*   **高可靠性**: 內建手機號碼正規表達式 (Regex) 驗證與後端防重機制，確保活動數據的真實性。

## 🏗️ 專案結構

```text
├── src
│   ├── App.jsx      # 核心業務邏輯與介面
│   ├── components   # 票券頁、佈局組件
│   └── styles       # 響應式視覺樣式
├── public           # 活動主視覺圖片與靜態資源
└── backend          # Google Apps Script 處理邏輯 (JS 格式)
```

## 🚀 成果價值 (Business Value)

本系統作為異業結盟的數位橋樑，成功在春節期間吸引大量百貨客群至樂園遊玩。透過數位化的發券與追蹤，主辦方能精確掌握活動的 ROI（投資報酬率），是 B2C 數位行銷活動的標準化技術實踐。

---
*Created for the 2025 Lunar New Year Promotion Initiative*

---
> 💡 **AI 協作筆記**：本專案之 [架構設計/邏輯優化/Bug 修復] 係透過與 AI 深度對話共同完成，展現了高效能的 AI 輔助開發模式。

