# 工程專案管理系統

向上建設工程管理平台 - Kanban + 甘特圖 + 施工照片管理

## 🚀 功能特色

✅ **Kanban 看板**
- 拖拉式任務管理
- 實時進度更新（0-100%）
- 顏色警示（紅/黃/綠）

✅ **甘特圖（雙軌進度）**
- 預計進度（灰色基準線）
- 實際進度（藍色進度條）
- 任務依賴關係
- 關鍵路徑顯示

✅ **施工照片管理**
- 拖拉上傳多張照片
- 自動壓縮（<2MB）
- 時間軸記錄
- 照片永久保留

✅ **響應式設計**
- 電腦版/平板/手機皆可使用
- 工地現場即時更新

## 📦 技術棧

**前端**
- React 18 + Vite
- TailwindCSS
- Frappe Gantt
- DnD Kit（拖拉功能）
- Zustand（狀態管理）

**後端**
- Node.js + Express
- SQLite（資料庫）
- Sharp（照片壓縮）
- Google Drive API（照片儲存）

## 🛠️ 本地開發

### 前端
```bash
npm install
npm run dev
```
訪問：http://localhost:5173

### 後端
```bash
cd backend
npm install
npm start
```
API：http://localhost:8096

## 🌐 部署

### Vercel（前端）
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/your-username/construction-pm-system)

### Render/Railway（後端）
後端可部署到 Render、Railway 或 Fly.io

## 📋 環境變數

### 前端（.env）
```
VITE_API_URL=http://localhost:8096
```

### 後端（.env）
```
PORT=8096
GOOGLE_DRIVE_CLIENT_ID=your-client-id
GOOGLE_DRIVE_CLIENT_SECRET=your-client-secret
GOOGLE_DRIVE_REFRESH_TOKEN=your-refresh-token
```

## 📝 License

MIT

## 👥 開發團隊

- PM：Julian-bot
- 前端工程師：Sub-agent（855 行）
- 後端工程師：Sub-agent（8 API endpoints）
- QA工程師：Sub-agent（60+ 測試案例）

開發時間：2026-02-15 凌晨（11 小時）
