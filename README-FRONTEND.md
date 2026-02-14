# 🏗️ 工程專案管理系統 - 前端文件

## 📋 專案概述

這是向上建設工程專案管理系統的前端應用程式，提供以下核心功能：

1. **Kanban 看板** - 拖拉式任務管理（待辦 → 進行中 → 已完成）
2. **甘特圖** - 雙軌進度顯示（預計進度 vs 實際進度）
3. **照片上傳** - 工程進度照片管理與時間軸

---

## 🛠️ 技術棧

- **React 18** - 前端框架
- **TailwindCSS 3** - 樣式框架
- **DnD Kit** - Kanban 拖拉功能
- **Frappe Gantt** - 甘特圖視覺化
- **React Dropzone** - 照片拖拉上傳
- **Zustand** - 狀態管理
- **Vite** - 建置工具

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
cd /home/ubuntu/.openclaw/workspace/notes/向上建設/工程專案管理系統/src/frontend
npm install
```

### 2. 啟動開發伺服器

```bash
npm run dev
```

應用程式會在 `http://localhost:3000` 啟動。

### 3. 建置生產版本

```bash
npm run build
```

---

## 📂 專案結構

```
frontend/
├── components/
│   ├── Kanban/
│   │   ├── KanbanBoard.jsx      # 看板主元件
│   │   ├── TaskCard.jsx         # 任務卡片
│   │   └── TaskDetail.jsx       # 任務詳情頁
│   ├── Gantt/
│   │   ├── GanttChart.jsx       # 甘特圖元件
│   │   └── gantt-custom.css     # 甘特圖自訂樣式
│   └── Photos/
│       ├── PhotoUpload.jsx      # 照片上傳
│       └── PhotoTimeline.jsx    # 照片時間軸
├── store/
│   └── taskStore.js             # Zustand 狀態管理
├── App.jsx                      # 主應用程式
├── index.jsx                    # 入口檔案
├── index.html                   # HTML 模板
├── styles.css                   # 全域樣式
├── package.json                 # 依賴設定
└── vite.config.js              # Vite 設定
```

---

## ✅ 已完成功能

### 1. ✅ Kanban 看板
- [x] DnD Kit 拖拉功能
- [x] 三個狀態欄位（待辦、進行中、已完成）
- [x] 卡片顯示：任務名稱、進度條、負責人、日期
- [x] 點擊卡片進入詳情頁
- [x] 延遲狀態視覺化（綠/黃/紅邊框）
- [x] 響應式設計（手機版支援）

### 2. ✅ 甘特圖
- [x] Frappe Gantt 整合
- [x] 雙軌進度顯示（灰色底線 + 彩色進度條）
- [x] 落後警示（綠/黃/紅色）
- [x] 依賴關係連線
- [x] 懸停提示視窗（顯示詳細資訊）
- [x] 視圖切換（日/週/月）
- [x] Kanban ↔ 甘特圖即時同步

### 3. ✅ 照片上傳
- [x] React Dropzone 拖拉上傳
- [x] 多張照片同時上傳
- [x] 照片壓縮（最大 2MB）
- [x] 預覽功能（上傳前）
- [x] 時間軸顯示
- [x] 點擊放大（燈箱效果）
- [x] 響應式設計

### 4. ✅ 任務詳情頁
- [x] 顯示完整任務資訊
- [x] 進度條調整（0-100%）
- [x] 照片上傳介面
- [x] 照片時間軸
- [x] Modal 視窗設計

---

## 🔌 API 整合

目前使用 **Mock API**（假資料），位於 `store/taskStore.js`。

### Mock API 函式

```javascript
mockApi.getTasks()           // 取得所有任務
mockApi.updateTask(id, data) // 更新任務
mockApi.uploadPhoto(...)     // 上傳照片
```

### 後端整合步驟

當後端 API 完成後，替換以下檔案的 mock 函式：

1. 開啟 `store/taskStore.js`
2. 將 `mockApi` 物件替換為真實 API 呼叫：

```javascript
// 替換前（Mock）
const mockApi = {
  getTasks: async () => { ... }
};

// 替換後（真實 API）
const api = {
  getTasks: async () => {
    const response = await fetch('/api/tasks');
    return response.json();
  },
  updateTask: async (id, updates) => {
    const response = await fetch(`/api/tasks/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    return response.json();
  },
  uploadPhoto: async (taskId, photoFile, description, uploadedBy) => {
    const formData = new FormData();
    formData.append('photo', photoFile);
    formData.append('description', description);
    formData.append('uploadedBy', uploadedBy);
    
    const response = await fetch(`/api/tasks/${taskId}/photos`, {
      method: 'POST',
      body: formData
    });
    return response.json();
  }
};
```

---

## 📊 Mock 資料範例

```javascript
{
  id: "task-001",
  name: "鋼筋綁紮",
  description: "1F 鋼筋綁紮作業",
  assignee: "張師傅",
  status: "進行中",
  plannedStartDate: "2026-02-10",
  plannedEndDate: "2026-02-15",
  plannedDuration: 5,
  actualStartDate: "2026-02-10",
  actualEndDate: null,
  progress: 60,
  dependencies: [],
  photos: [
    {
      id: "photo-001",
      timestamp: "2026-02-14T15:30:00Z",
      gdriveUrl: "https://drive.google.com/...",
      thumbnailUrl: "https://...",
      description: "鋼筋綁紮完成 60%",
      uploadedBy: "張師傅"
    }
  ]
}
```

---

## 🎨 樣式說明

### 延遲狀態顏色

- 🟢 **綠色** - 進度正常或超前
- 🟡 **黃色** - 輕微延遲（1-3 天）
- 🔴 **紅色** - 嚴重延遲（>3 天）

### 甘特圖顏色

- **灰色底線** - 預計進度（plannedStartDate → plannedEndDate）
- **彩色進度條** - 實際進度（根據 progress%）
  - 綠色 = 正常
  - 黃色 = 輕微延遲
  - 紅色 = 嚴重延遲

---

## 📱 響應式設計

- **桌面版**（>768px）：三欄 Kanban、完整甘特圖
- **平板版**（768px）：兩欄 Kanban、橫向滾動甘特圖
- **手機版**（<768px）：單欄 Kanban、縮小甘特圖

---

## 🐛 已知問題與未來改進

### 目前限制
1. 使用 Mock API（需整合後端）
2. 照片儲存在本地（需整合 Google Drive API）
3. 無使用者驗證（需整合登入系統）
4. 無即時通知（可加入 WebSocket）

### 未來功能
- [ ] 任務建立/編輯/刪除功能
- [ ] 多專案切換
- [ ] 匯出 PDF 報告
- [ ] 即時協作（多人編輯）
- [ ] 手機 App（React Native）

---

## 🤝 與後端協調

### API Endpoints（建議規格）

```
GET    /api/tasks              # 取得所有任務
POST   /api/tasks              # 建立任務
PATCH  /api/tasks/:id          # 更新任務（狀態、進度）
DELETE /api/tasks/:id          # 刪除任務
POST   /api/tasks/:id/photos   # 上傳照片
GET    /api/tasks/:id/photos   # 取得照片列表
DELETE /api/photos/:id         # 刪除照片
```

### 照片上傳流程

1. 前端：使用 `browser-image-compression` 壓縮照片（最大 2MB）
2. 前端：透過 `FormData` 上傳到後端
3. 後端：接收照片 → 上傳到 Google Drive → 返回 URL
4. 前端：更新 UI 顯示新照片

---

## 📞 聯絡資訊

- **開發者**：OpenClaw Frontend Engineer
- **專案**：向上建設工程專案管理系統
- **日期**：2026-02-14

---

## 🎉 完成度

✅ **Kanban 看板** - 100%  
✅ **甘特圖（雙軌進度）** - 100%  
✅ **照片上傳** - 100%  
✅ **響應式設計** - 90%（手機版可用，部分優化待完成）

**總體完成度：98%** 🚀
