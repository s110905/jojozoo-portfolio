# 廣三 SOGO X 九九峰：數位領券系統 (Kuangsan Collaboration)
### 🚀 數位轉型行銷實戰：從線下流量到線上數據追蹤的行銷閉環

[⬅️ 返回作品集總覽](../README.md)

🔗 **[點此造訪正式上線網站 (Kuangsan Ticket)](https://www.jojozoopark.com/kuangsan-ticket/)**
*(註：此為企業行銷活動之線上產品。由於原始碼具版權保護，本 Repo 僅供架構分享與能力佐證，不提供完整業務邏輯程式碼)*

![系統成果截圖](./result.png)

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20GAS-blue)
![Marketing](https://img.shields.io/badge/Focus-B2C%20MarTech-orange)

## 📖 專案概述 (Project Overview)
本專案是為「廣三 SOGO 百貨」與「九九峰動物樂園」跨界合作開發的高可靠數位領券方案。在過年期間的高流量環境中，系統透過極簡的數位領券體驗，消除了傳統紙本券的發放與遺失成本，建立了一條高效的客群轉換通道。

## 💎 核心商業價值 (Business Value)

| 評比項目 | 傳統紙本領券 | **本數位領券系統** | 商業價值 |
| :--- | :--- | :--- | :--- |
| **數據精確度** | 難應追蹤領取者與核銷率 | **即時記錄、100% 準確** | 數據驅動決策 |
| **發券成本** | 印刷費、人工發放費 | **系統自動發放 (成本為 0)** | 顯著提升 ROI |
| **重複領取風險** | 人工判定困難，易有洗券疑慮 | **手機號碼 + 裝置 ID 雙重防護** | 確保活動公平性 |
| **用戶便利性** | 易遺失、需妥善保存 | **隨身手機攜帶、隨時找回** | 提升客群參與意圖 |

## 🚀 核心行銷價值亮點

### 📈 數據中樞 (Marketing Intelligence)
系統不只是發券，更是數據採集器。透過 GA4 整合，行銷團隊能即時掌握：
- 哪種活動素材點擊率最高？
- 領券過程中的流失點在哪裡？
- 多少使用者是二次回訪查看票券？

### 🎯 精準客群鎖定
透過手機號碼領取，建立了初步的 CRM 數據雛形，為後續的異業結盟與二次行銷提供了寶貴的數位足跡。

### 🛠️ 技術實作特色
*   **輕量化 Serverless 架構**：採用 React + Vite 構建前端，搭配 Google Apps Script (GAS) 作為後端。
*   **數位身分驗證**：整合前端 `LocalStorage` 裝置記憶與後端手機號碼校驗，實作「一機一號一券」防重領機制。
*   **響應式視覺優化**：專為行動裝置設計的極簡 UI，結合活動主視覺與流暢動態。

## 🏗️ 專案結構
```text
├── src
│   ├── App.jsx      # 核心業務邏輯與介面
│   ├── components   # 票券呈現、狀態顯示組件
│   └── styles       # 現代化響應式樣式
├── public           # 靜態資源與主視覺
└── backend          # GAS 處理邏輯 (Serverless API)
```

## 🌈 未來展望
本系統架構具備高度可擴展性，未來可輕鬆接入更多合作品牌，或進一步與會員系統對接，成為企業 O2O 數位轉型的核心技術入口。

---
*Created for the 2025 Lunar New Year Promotion Initiative*

---
> 💡 **AI 協作筆記**：本專案之 [架構設計/邏輯優化/匯報撰寫] 係透過與 AI 深度對話共同完成，展現了高效能的 AI 輔助開發模式。
