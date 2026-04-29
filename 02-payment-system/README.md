# 企業級內部款項申請與審核系統 (Enterprise Payment System)

![Tech Stack](https://img.shields.io/badge/Stack-Next.js%20%7C%20NestJS%20%7C%20Prisma%20%7C%20Tailwind-blue)
![Architecture](https://img.shields.io/badge/Architecture-Monorepo-orange)
![Security](https://img.shields.io/badge/Auth-JWT%20%2B%20RBAC-red)

本專案是一個高品質、企業級的款項申請與審核管理系統。採用強健的 Monorepo 架構開發，專注於資料完整性、複雜的狀態工作流處理以及極致的用戶體驗。

## 🌟 技術核心亮點 (Technical Highlights)

*   **現代化 Monorepo 架構**：使用 `pnpm` workspaces 管理，實現 Next.js 前端與 NestJS 後端之間完美的型別共享與邏輯複用。
*   **複雜工作流管理 (Workflow)**：針對申請單設計了嚴謹的狀態機邏輯：`草稿 (DRAFT)` -> `已送出 (SUBMITTED)` -> `審核中 (UNDER_REVIEW)` -> `核准/退回/拒絕` -> `已撥款 (PAID)`。
*   **完善的角色權限控管 (RBAC)**：基於 JWT 的安全認證基礎，並針對組織內不同角色（申請人、主管、財務）實施細粒度的權限守衛。
*   **高品質 UI/UX 組件庫**：
    - 基於 Tailwind CSS 設計的專屬 Design System Tokens。
    - 專業的骨架屏 (Skeleton Screens) 處理加載狀態。
    - 全域 Toast 通知系統。
    - 垂直式審核時間軸 (Audit Timeline)，完整追蹤單據異動紀錄。
*   **高度資料安全性與完整性**：透過 **Zod** 與 **Prisma** 進行嚴格的 Schema 驗證，確保 API 交互與資料庫存取的一致性。
*   **附件管理系統**：整合 Multipart 檔案上傳，支援發票與收據的即時上傳與預覽。

## 🏗️ 專案結構 (Project Structure)

```text
├── apps
│   ├── web          # Next.js 14 前端 (App Router, React Query)
│   └── api          # NestJS 後端 (REST API, Prisma ORM)
├── packages
│   └── shared       # 共享的 TypeScript 型別與工具函式
└── tools            # 內部開發輔助工具
```

## 🚀 技術特徵

- **前端 (Frontend)**：CSR-first 策略、伺服器端過濾 (Server-side filtering)、React Hook Form + Zod 表單驗證、TanStack Query 資料同步。
- **後端 (Backend)**：冪等性資料初始化 (Idempotent seeding)、全域 ValidationPipe 驗證、完整狀態日誌系統。
- **資料庫 (Database)**：PostgreSQL (Prisma)，精確處理申請單、項目明細與附件間的關聯結構。

## 🛠️ 如何啟動

1.  **安裝依賴**：
    ```bash
    pnpm install
    ```
2.  **啟動開發環境**：
    ```bash
    # 同時啟動前端與後端
    npm run dev:web
    npm run dev:api
    ```

---
*專為企業內部營運效率而設計的擴展性架構基石 (2026)*
