# 2026 飼育員體驗營「線上報名系統」

[⬅️ 返回作品集總覽](../README.md)

🔗 **[點此造訪正式上線網站 (JOJOZOO Camp)](https://www.jojozoopark.com/camp/)**
*(註：此為企業正式營運中之商業產品。由於原始碼具版權保護，本 Repo 僅供架構分享與能力佐證，不提供完整業務邏輯程式碼)*

## 📸 系統成果截圖

![系統介面成果](./result.png)

![Project Status](https://img.shields.io/badge/Status-Completed-success)
![Tech](https://img.shields.io/badge/Tech-React%20%7C%20Vite%20%7C%20Firebase-blue)

## 🚩 營運痛點：人工作業的產能瓶頸 (Pain Points)
每年夏令營報名期間，公司面臨極大的營運壓力：
*   **報名資訊破碎**：傳統 Google 表單無法即時控管名額，導致熱門梯次嚴重超賣。
*   **對帳耗時費力**：財務需手動核對數百筆匯款，家長往往需等待 2-3 天才能確認報名成功，造成客服量爆增。
*   **候補管理混亂**：手動處理候補順序極易出錯，損害客戶對品牌的信任。

## 🎯 產品策略：建立「極簡化報名體驗」 (Strategy)
本系統不僅是報名表，更是營運與體驗的核心：
*   **一站式流暢體驗**：家長從「填寫資料」、「費用試算」到「完成匯款回報」皆可在同一個頁面順暢執行，無需跳轉或等待郵件。
*   **即時名額控管 (Inventory Control)**：透過技術手段達成毫秒級的名額扣減，徹底解決熱門梯次的超賣痛點。
*   **數據化營運**：管理後台提供各梯次報名趨勢圖，幫助行銷團隊即時調整推廣預算分配。

## 📈 商業價值與影響力 (Business Impact)
*   **節省行政成本**：每季節省超過 **100 小時** 人工對帳與客服處理時間。
*   **品牌信譽提升**：專業的報名流程與即時的反饋，大幅提升了高端客戶對夏令營品牌的滿意度。
*   **開發 ROI 極大化**：以零外部委外成本，完成市價約 **NT$200,000+** 的客製化系統。

## ✨ 核心功能 (Core Features)

### 前台報名網站
- **自動費用計算**：支援早鳥優惠、多人同行折扣與推薦碼機制。
- **即時名額顯示**：系統即時反映剩餘名額，並支援額滿自動轉入候補流程。
- **線上匯款回報**：整合付款流程，家長可直接於線上回報匯款資訊，減少人工溝通。
- **報名狀態查詢**：提供自助式查詢服務，降低客服詢問量。

### 後端管理系統
- **資料可視化儀表板**：即時監控各梯次報名狀況與收款進度。
- **候補名單管理**：自動化排序與處理流程。
- **一鍵報表導出**：支援 CSV 匯出，與內部財務系統無縫銜接。
- **系統維護模式**：具備即時封閉前台報名的緊急開關。



### 🏗️ 核心架構設計 (Architecture)

```mermaid
sequenceDiagram
    participant User as 家長 (Frontend)
    participant CF as Firebase Functions
    participant DB as Firestore
    
    User->>CF: 送出報名請求
    activate CF
    CF->>DB: 開啟 Transaction
    activate DB
    DB-->>CF: 取得目前名額 (currentCount)
    alt currentCount < maxCapacity
        CF->>DB: currentCount + 1
        CF->>DB: 建立 SUCCESS 報名紀錄
        DB-->>CF: Commit
        CF-->>User: 報名成功
    else currentCount >= maxCapacity
        CF->>DB: 不扣減名額
        CF->>DB: 建立 WAITING 候補紀錄
        DB-->>CF: Commit
        CF-->>User: 進入候補名單
    end
    deactivate DB
    deactivate CF
```

## 🛠️ 技術挑戰與解決方案 (Technical Challenges & Solutions)

### 挑戰 (Challenge): 複雜的多梯次名額競爭與對帳延時
*   **問題 (S/T)**：夏令營開放報名瞬間會有大量流量衝擊，且家長匯款後的人工對帳往往造成名額佔用與實際收款的資訊落差。
*   **行動 (A)**：
    *   **Backend Guards**：在 Firebase Functions 實作了原子性的交易檢查，確保名額扣減不發生超賣。
    *   **即時回報系統**：設計了「一鍵上傳匯款末五碼」功能，前端即時顯示待審核狀態，將對帳時差從天降至分鐘級。
*   **結果 (R)**：系統上線後，23 個梯次全部於 1 小時內順利完成報名，且 0 發生重複收費或名額糾紛。

## 🛠️ 技術棧 (Tech Stack)

*   **Frontend**: React 19, Vite, Tailwind CSS (Vite Plugin)
*   **Backend & DB**: Firebase (Firestore, Functions)
*   **Logic & UI**: React Router, Recharts, Date-fns, Lucide React
*   **Deployment**: Static hosting with standard CI/CD mindset

## 📈 成果證明 (Proof of Work)

> 「本專案展現了如何透過數位轉型，將傳統的 Google 表單作業升級為企業級的自動化流程，為公司建立了可持續使用的數位基礎設施。」

---
*Developed by 行銷企劃部 (2026)*

---
> 💡 **AI 協作筆記**：本專案之 [架構設計/邏輯優化/Bug 修復] 係透過與 AI 深度對話共同完成，展現了高效能的 AI 輔助開發模式。


👉 觀看本專案的 [核心 Prompt 策略](../PROMPTS.md#-案例一夏令營報名系統---複雜名額控管邏輯)
