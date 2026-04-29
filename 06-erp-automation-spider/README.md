# ERP Spider: 自動化營收數據整合系統

[⬅️ 返回作品集總覽](../README.md)



![Project Status](https://img.shields.io/badge/Status-Production-success)
![Tech Stack](https://img.shields.io/badge/Tech-Python%20%7C%20Selenium%20%7C%20Google%20Sheets%20API-green)
![Automation](https://img.shields.io/badge/Automation-Scheduled%20Tasks-orange)

ERP Spider 是一個功能強大的 Python 自動化爬蟲系統，旨在自動化提取第三方票務平台 (Fonticket) 的營收數據，並與內部 ERP/Google Sheets 系統進行無縫整合。此系統解決了過去需要每日人工登入、手動下載報表並彙整資料的重複性勞動。

## 🌟 核心功能 (Core Features)

*   **全自動化排程 (Unattended Automation)**：
    *   每日自動登入 Fonticket 平台，模擬真人行為進行報表選取與下載。
    *   支援 Windows (Bat) 與 Linux (Shell) 多平台排程運行。
*   **數據回填與同步 (Data Backfilling)**：
    *   內建強大的 Backfill 機制，可指定日期區間補足歷史漏失數據。
    *   自動將提取的明細轉化為 ERP 格式並寫入 Google Sheets 指定分頁。
*   **智慧監控與除錯 (Monitoring & Debugging)**：
    *   執行過程中自動擷取各步驟畫面 (Debug Screenshots)，當發生異常時可立即追蹤問題點。
    *   內建驗證腳本，確保雲端試算表數據與來源端 100% 吻合。
*   **驗證碼處理 (Captcha Handling)**：支援 OCR 輔助處理登入驗證碼，維持高成功率的自動化運行。

## 🛠️ 技術亮點 (Technical Highlights)

*   **Selenium 深度應用**: 處理複雜的動態網頁導航、iframe 切換及檔案下載攔截。
*   **API 整合**: 深度整合 Google Sheets API，實現非同步、高效能的雲端資料寫入。
*   **穩定性工程**: 實作了完整的 Retry 邏輯與異常捕獲機制，確保系統在弱網環境下仍能穩定運作。
*   **資料清洗**: Python 高效率處理 CSV/JSON 資料，自動修正日期格式、處理重複項並計算結算總額。

## 🏗️ 專案結構

```text
├── full_automation.py    # 核心自動化主邏輯
├── schedule_runner.py    # 排程控管與執行器
├── backfill_*.py         # 各類數據回填工具
├── tests/                # 模組化功能測試腳本
├── debug_files/          # 運行過程中的快照與 HTML 紀錄
└── credentials.json      # Google API 認證資訊
```

## 🚀 成果價值 (Business Value)

本系統將每日原本需耗費 30-60 分鐘的人工數據搬運工作縮短至 0，且大幅提升了數據的即時性與準確性。它是企業實現「營運數據自動化」的核心數位基石。

---
*Built for Corporate Revenue Intelligence & Automation (2026)*

---
> 💡 **AI 協作筆記**：本專案之 [架構設計/邏輯優化/Bug 修復] 係透過與 AI 深度對話共同完成，展現了高效能的 AI 輔助開發模式。

