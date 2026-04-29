# JoJo Zoo 票價最優解試算器 (Ticket BestPrice Calculator)


## 📸 系統成果截圖

![系統介面成果](./result.png)

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Tech Stack](https://img.shields.io/badge/Stack-React%20%7C%20Vite%20%7C%20Lucide%20React-blue)

這是一個專為 JoJo Zoo 園區設計的票價試算工具。由於園區票價組合多元（包含年齡、身分、壽星優惠、地區限定優惠以及季節性活動），現場人員與客人在計算「最划算組合」時往往需要耗費大量時間。本工具透過嚴謹的邏輯演算，一鍵產出最佳購票方案。

## 🌟 核心價值 (Core Value)

*   **複雜折扣演算**：自動處理「當日/當月壽星」及其「陪同者」的折扣連動。
*   **地區限定優惠**：動態整合「南投縣民」、「草屯鎮民」及「台中通 APP」等地區性促銷。
*   **節慶自動導航**：內建兒童節連假等特定日期的特殊票價規則，不需人工翻查表單。
*   **決策效率化**：為購票者提供清晰的費用拆解 (Breakdown)，並具備「出示售票員」功能，縮短窗口溝通時間。

## ✨ 核心功能 (Core Features)

- **智慧組合推薦**：系統會自動嘗試所有排列組合，確保產出總金額最低的購票方案。
- **動態日期感應**：依據選擇的遊園日期（平日、假日、特定節慶），自動啟用或關閉對應的優惠選項。
- **視覺化拆解**：清晰顯示每張票種選用的優惠類型與原始票價對比。
- **響應式 UI**：採用毛玻璃質感 (Glassmorphism) 設計，適合行動裝置於入園現場即時使用。

## 🛠️ 技術亮點 (Technical Highlights)

*   **React 18**: 使用現代 React 鉤子 (`useMemo`, `useState`) 實現高效能的實時試算引擎。
*   **演算法優化**: 實作貪婪演算法 (Greedy Algorithm) 概念，優先分配高面額折扣與壽星陪同額度，確保總額最優。
*   **設計美學**: 結合 Lucide React 圖標與動態 CSS 動畫，提供精品級的使用體驗。

---
*Developed for efficient ticketing operations at JoJo Zoo (2026)*
