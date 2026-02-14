# 工程專案管理系統 - 後端 API 文件

## 📋 概述

基於 **Node.js + Express + SQLite** 的後端 API，提供任務管理、照片上傳、甘特圖資料等功能。

**技術棧**：
- **Runtime**: Node.js 18+
- **Framework**: Express
- **Database**: SQLite (better-sqlite3)
- **Storage**: Google Drive API v3 或 Local Storage
- **Image**: Sharp (壓縮)

---

## 🚀 快速開始

### 1. 安裝依賴

```bash
cd src/backend
npm install
```

### 2. 啟動伺服器

```bash
npm start
# 或使用 nodemon (開發模式)
npm run dev
```

伺服器將在 **http://localhost:8096** 啟動

### 3. 建立測試資料

```bash
npm run seed
```

會建立 10 個範例任務 + 4 張測試照片

---

## 📡 API Endpoints

### 🔹 健康檢查

```http
GET /health
```

**Response**:
```json
{
  "status": "OK",
  "timestamp": "2026-02-14T20:00:00.000Z",
  "storageMode": "local"
}
```

---

### 🔹 任務管理

#### 📌 列出所有任務

```http
GET /api/tasks
```

**Response**:
```json
[
  {
    "id": "task-001",
    "name": "基地整地",
    "description": "清除雜草、整平地面",
    "assignee": "張師傅",
    "status": "done",
    "planned_start_date": "2026-01-05",
    "planned_end_date": "2026-01-15",
    "planned_duration": 10,
    "actual_start_date": "2026-01-05",
    "actual_end_date": "2026-01-14",
    "progress": 100,
    "dependencies": [],
    "created_at": "2026-01-01T10:00:00.000Z",
    "updated_at": "2026-01-14T18:00:00.000Z",
    "photos": [
      {
        "id": "photo-001",
        "task_id": "task-001",
        "gdrive_url": "/uploads/基地整地/2026-01-14_整地完成.jpg",
        "description": "整地完成照片",
        "uploaded_by": "張師傅",
        "uploaded_at": "2026-01-14T18:30:00.000Z"
      }
    ]
  }
]
```

#### 📌 取得單一任務

```http
GET /api/tasks/:id
```

**Response**: 同上（單一物件）

#### 📌 建立任務

```http
POST /api/tasks
Content-Type: application/json

{
  "name": "測試任務",               // 必填
  "description": "這是測試",
  "assignee": "Andy",
  "status": "todo",                 // todo | in-progress | done
  "planned_start_date": "2026-03-01",
  "planned_end_date": "2026-03-10",
  "planned_duration": 9,
  "dependencies": ["task-001"]
}
```

**Response**: 建立的任務物件 (201 Created)

#### 📌 更新任務

```http
PATCH /api/tasks/:id
Content-Type: application/json

{
  "status": "in-progress",
  "progress": 50,
  "actual_start_date": "2026-03-02"
}
```

**Response**: 更新後的任務物件

#### 📌 刪除任務

```http
DELETE /api/tasks/:id
```

**Response**:
```json
{
  "message": "任務已刪除",
  "task": { ... }
}
```

---

### 🔹 照片管理

#### 📌 取得任務照片列表

```http
GET /api/tasks/:id/photos
```

**Response**:
```json
[
  {
    "id": "photo-001",
    "task_id": "task-001",
    "gdrive_url": "https://drive.google.com/...",
    "gdrive_file_id": "1abc...",
    "description": "工地照片",
    "uploaded_by": "Andy",
    "uploaded_at": "2026-02-14T10:00:00.000Z"
  }
]
```

#### 📌 上傳照片

```http
POST /api/tasks/:id/photos
Content-Type: multipart/form-data

photo: [檔案]                    // 必填
description: "混凝土澆置完成"     // 可選
uploaded_by: "Andy"              // 可選
```

**限制**:
- 檔案大小上限：10MB
- 允許格式：JPEG, PNG, WebP
- 自動壓縮：超過 2MB 會自動壓縮到 <2MB

**Response**:
```json
{
  "message": "照片上傳成功",
  "photo": {
    "id": "photo-abc",
    "task_id": "task-001",
    "gdrive_url": "https://drive.google.com/...",
    "gdrive_file_id": "1xyz...",
    "description": "混凝土澆置完成",
    "uploaded_by": "Andy",
    "uploaded_at": "2026-02-14T10:05:00.000Z"
  },
  "storageMode": "gdrive"
}
```

#### 📌 刪除照片

```http
DELETE /api/photos/:id
```

**Response**:
```json
{
  "message": "照片已刪除"
}
```

---

## 🗄️ 資料庫結構

### Tasks 表

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | TEXT | 主鍵 (UUID) |
| `name` | TEXT | 任務名稱 *(必填)* |
| `description` | TEXT | 任務描述 |
| `assignee` | TEXT | 負責人 |
| `status` | TEXT | 狀態 (todo/in-progress/done) |
| `planned_start_date` | TEXT | 預計開始日期 (YYYY-MM-DD) |
| `planned_end_date` | TEXT | 預計結束日期 |
| `planned_duration` | INTEGER | 預計天數 |
| `actual_start_date` | TEXT | 實際開始日期 |
| `actual_end_date` | TEXT | 實際結束日期 |
| `progress` | INTEGER | 進度百分比 (0-100) |
| `dependencies` | TEXT | 依賴任務 ID (JSON array) |
| `created_at` | TEXT | 建立時間 |
| `updated_at` | TEXT | 更新時間 |

### Photos 表

| 欄位 | 類型 | 說明 |
|------|------|------|
| `id` | TEXT | 主鍵 (UUID) |
| `task_id` | TEXT | 外鍵 → tasks.id |
| `gdrive_url` | TEXT | Google Drive URL 或本地路徑 |
| `gdrive_file_id` | TEXT | Google Drive File ID |
| `description` | TEXT | 照片描述 |
| `uploaded_by` | TEXT | 上傳者 |
| `uploaded_at` | TEXT | 上傳時間 |

---

## 📦 Storage 模式

後端支援兩種儲存模式：

### 1. **Local Storage** (預設)

照片儲存在 `src/backend/uploads/` 資料夾

**啟用方式**: 預設（不需設定）

**URL 格式**: `/uploads/任務名稱/2026-02-14_HHMMSS_檔名.jpg`

### 2. **Google Drive**

照片上傳到 Google Drive

**啟用方式**:
1. 完成 [GDRIVE-SETUP.md](./GDRIVE-SETUP.md) 的設定
2. 設定環境變數：
   ```bash
   export STORAGE_MODE=gdrive
   npm start
   ```

**資料夾結構**:
```
工程專案管理/
├── 基地整地/
│   ├── 2026-01-14_103045_整地完成.jpg
│   └── ...
├── 基礎開挖/
└── ...
```

---

## 🧪 測試

### 使用 curl 測試

```bash
# 1. 健康檢查
curl http://localhost:8096/health

# 2. 列出任務
curl http://localhost:8096/api/tasks

# 3. 建立任務
curl -X POST http://localhost:8096/api/tasks \
  -H 'Content-Type: application/json' \
  -d '{"name":"測試任務","assignee":"Andy"}'

# 4. 更新任務
curl -X PATCH http://localhost:8096/api/tasks/task-001 \
  -H 'Content-Type: application/json' \
  -d '{"status":"in-progress","progress":50}'

# 5. 上傳照片
curl -X POST http://localhost:8096/api/tasks/task-001/photos \
  -F 'photo=@/path/to/photo.jpg' \
  -F 'description=工地照片' \
  -F 'uploaded_by=Andy'
```

### 使用瀏覽器測試

1. 啟動伺服器：`npm start`
2. 開啟：http://localhost:8096/health
3. 使用 Postman 或前端介面測試 API

---

## 🔧 環境變數

| 變數 | 預設值 | 說明 |
|------|--------|------|
| `PORT` | 8096 | 伺服器 Port |
| `STORAGE_MODE` | local | 儲存模式 (local/gdrive) |

---

## 📝 開發筆記

### 圖片壓縮策略

- 檔案 ≤ 2MB：不壓縮
- 檔案 > 2MB：使用 Sharp 壓縮
  - 從 quality=85 開始
  - 每次降低 10
  - 直到檔案 <2MB 或 quality=20

### CORS 設定

允許的來源：
- `http://localhost:5173` (Vite 前端)
- `http://localhost:3000` (備用)

### 錯誤處理

- 400：請求參數錯誤
- 404：資源不存在
- 500：伺服器錯誤

---

## 🐛 常見問題

### Q: 啟動失敗？

檢查 Node.js 版本：
```bash
node --version  # 需要 18+
```

### Q: 照片上傳失敗？

1. 檢查 `uploads/` 資料夾權限
2. 確認檔案格式是 JPEG/PNG/WebP
3. 檢查檔案大小 (<10MB)

### Q: Google Drive 整合失敗？

參考 [GDRIVE-SETUP.md](./GDRIVE-SETUP.md) 完成設定

---

## 📚 相關檔案

- `server.js` - Express 主程式
- `db.js` - SQLite 資料庫操作
- `gdrive.js` - Google Drive 整合
- `seed.js` - 測試資料產生器
- `GDRIVE-SETUP.md` - Google Drive 設定指南

---

**開發者**: Backend Team  
**最後更新**: 2026-02-14  
**授權**: MIT
