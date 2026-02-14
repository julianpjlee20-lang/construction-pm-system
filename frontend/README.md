# 工程專案管理系統 - 前端

React + TailwindCSS 工程專案管理系統前端原型

## 🚀 快速開始

### 安裝依賴

```bash
npm install
```

### 啟動開發伺服器

```bash
npm run dev
```

專案將運行於 <http://localhost:3000>

## 📋 功能特色

### 1. Kanban 任務看板
- ✅ 三欄式看板：待辦 / 進行中 / 已完成
- ✅ 拖拉卡片切換狀態（使用 DnD Kit）
- ✅ 卡片顯示：任務名稱、負責人、進度百分比
- ✅ 點擊卡片開啟詳情頁

### 2. 任務詳情頁
- ✅ Modal 彈窗設計
- ✅ 完整表單欄位：
  - 任務名稱、描述
  - 負責人、狀態
  - 預計開始/結束日期
  - 實際開始/結束日期
  - 進度滑桿（0-100%）
- ✅ 施工照片管理（整合於詳情頁）

### 3. 甘特圖
- ✅ 使用 Frappe Gantt 套件
- ✅ 雙軌進度顯示：
  - 預計進度（灰色底線）
  - 實際進度（彩色進度條）
- ✅ 落後警示顏色：
  - 🟢 綠色：已完成
  - 🔵 藍色：正常進行
  - 🟡 黃色：落後 < 20%
  - 🔴 紅色：落後 ≥ 20%
- ✅ 依賴關係線條
- ✅ 點擊任務開啟詳情頁

### 4. 施工照片管理
- ✅ React Dropzone 拖拉上傳
- ✅ 上傳進度顯示（檔案名稱 + 百分比）
- ✅ 時間軸顯示已上傳照片
- ✅ 點擊照片開啟 Google Drive 原圖

### 5. 資料同步
- ✅ Zustand 全域狀態管理
- ✅ Kanban 狀態改變 → 同步甘特圖
- ✅ 任務詳情更新 → 即時反映到看板和甘特圖
- ✅ Mock 資料（後端 API ready 後替換）

## 🏗️ 技術棧

- **框架**: React 18 + Vite
- **樣式**: TailwindCSS 3
- **狀態管理**: Zustand
- **拖拉功能**: @dnd-kit
- **甘特圖**: Frappe Gantt
- **照片上傳**: React Dropzone
- **HTTP 請求**: Axios（預留）

## 📁 專案結構

```
src/
├── components/
│   ├── Kanban.jsx          # 任務看板
│   ├── TaskCard.jsx        # 任務卡片
│   ├── TaskDetail.jsx      # 任務詳情 Modal
│   ├── GanttChart.jsx      # 甘特圖
│   └── PhotoUpload.jsx     # 照片上傳
├── store/
│   └── useTaskStore.js     # Zustand 狀態管理
├── App.jsx                 # 主應用
├── main.jsx                # 進入點
└── index.css               # TailwindCSS 樣式
```

## 🎯 元件說明

### Kanban.jsx
- **Props**: `onTaskClick(taskId)` - 卡片點擊回調
- **功能**: 
  - 使用 DnD Kit 實現拖拉排序
  - 三欄式布局自適應
  - 拖拉卡片自動更新狀態

### TaskCard.jsx
- **Props**: 
  - `task` - 任務物件
  - `onClick` - 點擊回調
- **功能**:
  - 顯示任務名稱、負責人
  - 進度條視覺化（顏色依進度變化）
  - 可拖拉（整合 useSortable）

### TaskDetail.jsx
- **Props**:
  - `task` - 當前任務
  - `onClose` - 關閉 Modal
  - `onSave(taskId, updatedData)` - 儲存回調
- **功能**:
  - 完整表單編輯
  - 進度滑桿即時更新
  - 整合照片上傳元件

### GanttChart.jsx
- **Props**: `onTaskClick(taskId)` - 任務點擊回調
- **功能**:
  - Frappe Gantt 視覺化
  - 自動計算落後程度
  - 顏色警示系統
  - 依賴關係箭頭

### PhotoUpload.jsx
- **Props**:
  - `taskId` - 任務 ID
  - `photos` - 已上傳照片陣列
- **功能**:
  - 拖拉上傳多張照片
  - 上傳進度條
  - 時間軸顯示
  - 點擊開啟 Google Drive

### useTaskStore.js
**狀態**:
- `tasks` - 所有任務陣列
- `selectedTask` - 當前選中任務

**方法**:
- `updateTaskStatus(taskId, newStatus)` - 更新任務狀態
- `updateTask(taskId, updatedData)` - 更新任務詳情
- `selectTask(taskId)` - 選擇任務
- `closeTaskDetail()` - 關閉詳情頁
- `uploadPhoto(taskId, file)` - 上傳照片
- `getTasksByStatus(status)` - 依狀態篩選任務
- `getGanttData()` - 取得甘特圖資料

## 📊 Mock 資料

目前使用三個範例任務：
1. **鋼筋綁紮** - 進行中（60%）
2. **模板組立** - 待辦（0%）
3. **基礎開挖** - 已完成（100%）

後端 API ready 後，修改 `useTaskStore.js` 的資料來源即可切換。

## 🔌 後端 API 整合（預留）

修改 `useTaskStore.js`，將 mock 資料替換為 Axios 請求：

```javascript
import axios from 'axios';

const API_BASE = 'http://your-backend-url/api';

// 範例：取得任務
const fetchTasks = async () => {
  const response = await axios.get(`${API_BASE}/tasks`);
  return response.data;
};
```

## 🐛 已知問題

無

## 📝 驗收檢查清單

- ✅ 啟動前端（單一指令）
- ✅ 拖拉任務卡片（狀態更新）
- ✅ 點擊卡片編輯（進度滑桿）
- ✅ 在甘特圖看到雙軌進度（預計 vs 實際）
- ✅ 上傳照片（UI 能用，mock 上傳成功）

## 🎨 自訂樣式

TailwindCSS 配置位於 `tailwind.config.js`，可自訂顏色、間距等。

## 📄 授權

內部專案，僅供向上建設使用。
