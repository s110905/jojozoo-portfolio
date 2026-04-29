# ERP Spider: 自動化營收數據整合系統

[⬅️ 返回作品集總覽](../README.md)



![Project Status](https://img.shields.io/badge/Status-Production-success)
![Tech Stack](https://img.shields.io/badge/Tech-Python%20%7C%20Selenium%20%7C%20Google%20Sheets%20API-green)
![Automation](https://img.shields.io/badge/Automation-Scheduled%20Tasks-orange)

## 🚩 數據收集的成本黑洞 (Pain Points)
在營運決策中，數據的「時效性」至關重要，但以往面臨：
*   **跨平台數據孤島**：每日需由人工登入 3-5 個不同的第三方票務平台，手動下載、複製、貼上數據。
*   **時效性極低**：人工彙整往往有 24 小時以上的延遲，導致決策者看到的永遠是「昨天的數據」。
*   **高誤植風險**：大量的人工數據搬運，極易產生數字填錯，導致財務報表失真。

## 🎯 解決方案：建立「企業級數據自動導航」 (Strategy)
本系統將數據收集流程完全自動化：
*   **零時差同步 (Zero-Lag Sync)**：透過模擬真人爬蟲技術，24 小時定時抓取數據，實現營收數據的「準即時」更新。
*   **數據清洗與標準化**：自動處理不同平台間的格式差異，產出標準化的 BI 格式供決策使用。
*   **營運預警機制**：結合自動截圖監控，當抓取異常或數據異常時即時通報，確保數據鏈條不中斷。

## 📈 商業價值與影響力 (Business Impact)
*   **營運成本歸零**：將每日耗時 60 分鐘的數據搬運工作縮短至 0，年度節省約 **200+ 小時** 的高薪人力。
*   **決策效率提升**：管理者能在每日上午 9:00 前看到完整的營收分析圖表，大幅縮短了決策反應週期。
*   **財務精確度**：透過自動化對帳機制，確保了營收數據的 100% 準確，為公司建立了信賴度極高的數據基礎設施。

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

