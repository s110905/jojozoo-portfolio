# AI 協作開發實錄 (AI Collaboration & Methodology)

本作品集的所有系統皆係透過精確的 **Prompt Engineering (提示工程)** 與 AI 共同協作產出。這不只是關於技術，更關於如何將商業需求轉化為高質量的技術解決方案。

---

## 🚀 我的 AI 協作歷程與方法論 (My Journey & Methodology)

### 📈 心路歷程：從解決問題到架構設計
我自 **2025 年底** 開始將 AI 深度整合進工作流程。起初，我的目標非常明確：**解決最急迫的業務問題**。

當時，面對如夏令營名額控管、ERP 數據同步等高時效要求的開發任務，AI 成為了我的「超級加速器」。隨著專案的演進，我對 AI 的運用也經歷了三個層次的蛻變：
1. **問題解決期**：利用 AI 快速 Debug 與撰寫特定的演算法，確保專案如期上線。
2. **邏輯優化期**：開始與 AI 對話以探討更嚴謹的資料庫交易 (Transaction) 與錯誤處理機制。
3. **架構驅動期**：現在，我習慣在動手前先與 AI 進行架構對齊，探討 Monorepo 規劃、型別安全性以及系統的可擴展性。

### 🛠️ 我的 AI 協作標準流程 (The Workflow)
我認為開發者的價值在於「定義問題」與「引導工具」。我的標準作業流程如下：
1. **商業邏輯解構**：先不談程式碼，先向 AI 描述業務痛點與預期結果。
2. **結構化 Prompt 規劃**：提供精確的 Context (技術棧、約束條件、預期輸出格式)。
3. **迭代式開發與驗證**：將複雜任務拆解為多個小步驟，並親自審核每一行 AI 產出的程式碼，確保其安全性與業務一致性。
4. **效能與邊界測試**：引導 AI 思考邊界案例 (Edge Cases)，主動發現並修正潛在 Bug。

---

## 💎 關鍵協作案例 (Key Case Studies)
以下展示了我在開發過程中的幾個核心溝通案例：

## 💎 案例一：夏令營報名系統 - 複雜名額控管邏輯

**背景**：我需要實作一個「如果某梯次額滿，自動轉入候補，但又要防止兩個人同時搶到最後一個位置」的邏輯。

**我的核心 Prompt 策略**：
> "我正在使用 Firebase Firestore 與 React。請幫我寫一個 Firestore Transaction 函數，用於處理報名名額扣減。邏輯如下：
> 1. 先讀取梯次文件的 `currentCount` 與 `maxCapacity`。
> 2. 如果 `currentCount < maxCapacity`，執行 `currentCount + 1` 並建立報名紀錄，回傳 `success`。
> 3. 如果 `currentCount >= maxCapacity`，則不扣減名額，改為建立一筆狀態為 `WAITING` 的候補紀錄，回傳 `waiting`。
> 4. 請確保這是在一個 Transaction 內完成，以防止 Race Condition。"

**結果**：AI 產出了基於 `runTransaction` 的高可靠性程式碼，成功應對了開賣瞬間的高併發流量。

---

## 💎 案例二：款項申請系統 - Monorepo 架構規劃

**背景**：我希望將前端 (Next.js) 與後端 (NestJS) 的型別定義統一起來，避免重複定義造成的維護困難。

**我的核心 Prompt 策略**：
> "我正在建立一個 PNPM Workspaces 的 Monorepo。目錄結構包含 `apps/web`, `apps/api` 與 `packages/shared`。
> 請告訴我如何在 `packages/shared` 中導出 Zod 的 Schema 與 TypeScript Interface，並讓 `web` 端的 React Hook Form 與 `api` 端的 Prisma 都能共享這些定義。
> 請提供 `package.json` 的配置範例與 `tsconfig` 的路徑對應設定。"

**結果**：建立了標準的共享型別機制，大幅減少了前後端 API 串接時的對接時間。

---

## 💎 案例三：ERP Spider - 智慧錯誤恢復機制

**背景**：Selenium 爬蟲在遇到網頁加載過慢或驗證碼時常會崩潰。

**我的核心 Prompt 策略**：
> "這是一個 Python Selenium 腳本。請幫我實作一個裝飾器 (Decorator)，用於包裝所有的導航動作。
> 當發生 `TimeoutException` 或 `ElementClickInterceptedException` 時，系統應自動執行：
> 1. 擷取當前畫面存檔。
> 2. 重新整理頁面。
> 3. 最多重試 3 次，若失敗則發送 Log 並跳過該日期。
> 請確保 Log 包含詳細的 XPath 位置，方便我事後 Debug。"

**結果**：系統的自動化成功率從 70% 提升至 95% 以上，實現了真正的「無人值守」運行。

---

> 💡 **結語**：開發者的價值在於「定義問題」與「引導工具」。這份實錄證明了我具備引領 AI 解決複雜技術挑戰的深度。
