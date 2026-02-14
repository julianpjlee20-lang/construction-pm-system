# 工程專案管理系統 - 後端 API

Node.js + Express + SQLite + Google Drive API

## 🚀 快速開始

### 1. 安裝依賴

```bash
npm install
```

### 2. 設定環境變數

複製 `.env.example` 為 `.env`：

```bash
cp .env.example .env
```

編輯 `.env`，填入 Google 服務帳號資訊（詳見下方「Google Drive 設定」）。

### 3. 初始化資料庫

```bash
npm run init-db
```

### 4. 啟動伺服器

```bash
npm start
```

伺服器將在 `http://localhost:8096` 啟動。

---

## 📚 API 文件

### Base URL

```
http://localhost:8096
```

### 通用回應格式

**成功**：
```json
{
  "id": "task-001",
  "name": "任務名稱",
  ...
}
```

**錯誤**：
```json
{
  "error": "錯誤訊息",
  "message": "詳細說明"
}
```

---

## 🔹 任務 API

### 1. 取得所有任務

```
GET /api/tasks
```

**回應範例**：
```json
[
  {
    "id": "task-001",
    "name": "鋼筋綁紮",
    "description": "一樓鋼筋綁紮",
    "assignee": "張師傅",
    "status": "進行中",
    "plannedStartDate": "2026-02-10",
    "plannedEndDate": "2026-02-20",
    "actualStartDate": "2026-02-11",
    "actualEndDate": null,
    "progress": 60,
    "dependencies": ["task-000"],
    "createdAt": "2026-02-15T03:30:00.000Z",
    "updatedAt": "2026-02-15T04:15:00.000Z"
  }
]
```

---

### 2. 取得單一任務

```
GET /api/tasks/:id
```

**參數**：
- `id`: 任務 ID

**回應範例**：與「取得所有任務」相同，但回傳單一物件。

**錯誤**：
- `404`: 任務不存在

---

### 3. 建立任務

```
POST /api/tasks
```

**請求 Body**：
```json
{
  "name": "鋼筋綁紮",
  "description": "一樓鋼筋綁紮",
  "assignee": "張師傅",
  "status": "待辦",
  "plannedStartDate": "2026-02-10",
  "plannedEndDate": "2026-02-20",
  "progress": 0,
  "dependencies": []
}
```

**必填欄位**：
- `name`: 任務名稱

**選填欄位**：
- `description`: 描述
- `assignee`: 負責人
- `status`: 狀態（`待辦`、`進行中`、`已完成`，預設：`待辦`）
- `plannedStartDate`: 預計開始日期（ISO 8601 格式）
- `plannedEndDate`: 預計結束日期
- `actualStartDate`: 實際開始日期
- `actualEndDate`: 實際結束日期
- `progress`: 進度（0-100，預設：0）
- `dependencies`: 依賴任務 ID 陣列

**回應範例**：
```json
{
  "id": "task-a3f7b2c1",
  "name": "鋼筋綁紮",
  "description": "一樓鋼筋綁紮",
  "assignee": "張師傅",
  "status": "待辦",
  "plannedStartDate": "2026-02-10",
  "plannedEndDate": "2026-02-20",
  "actualStartDate": null,
  "actualEndDate": null,
  "progress": 0,
  "dependencies": [],
  "createdAt": "2026-02-15T03:30:00.000Z",
  "updatedAt": "2026-02-15T03:30:00.000Z"
}
```

**錯誤**：
- `400`: 必填欄位缺失或數值無效

---

### 4. 更新任務

```
PUT /api/tasks/:id
```

**參數**：
- `id`: 任務 ID

**請求 Body**（所有欄位皆選填）：
```json
{
  "name": "鋼筋綁紮（已修改）",
  "status": "進行中",
  "progress": 60,
  "actualStartDate": "2026-02-11"
}
```

**回應範例**：更新後的完整任務物件。

**錯誤**：
- `404`: 任務不存在
- `400`: 數值無效（如 progress 不在 0-100）

---

### 5. 刪除任務

```
DELETE /api/tasks/:id
```

**參數**：
- `id`: 任務 ID

**回應範例**：
```json
{
  "message": "任務已刪除",
  "id": "task-001"
}
```

**注意**：刪除任務會自動刪除關聯的所有照片記錄（CASCADE）。

**錯誤**：
- `404`: 任務不存在

---

## 📷 照片 API

### 6. 取得任務照片清單

```
GET /api/tasks/:taskId/photos
```

**參數**：
- `taskId`: 任務 ID

**回應範例**：
```json
[
  {
    "id": "photo-001",
    "taskId": "task-001",
    "timestamp": "2026-02-15T03:45:00.000Z",
    "gdriveUrl": "https://drive.google.com/file/d/1a2b3c4d5e6f7/view",
    "gdriveFileId": "1a2b3c4d5e6f7",
    "thumbnailUrl": "https://drive.google.com/thumbnail?id=1a2b3c4d5e6f7",
    "description": "鋼筋綁紮完成",
    "uploadedBy": "張師傅",
    "fileSize": 1024000,
    "createdAt": "2026-02-15T03:45:00.000Z"
  }
]
```

**錯誤**：
- `404`: 任務不存在

---

### 7. 上傳照片（單張）

```
POST /api/tasks/:taskId/photos
```

**參數**：
- `taskId`: 任務 ID

**Content-Type**：`multipart/form-data`

**Form Fields**：
- `photo`: 照片檔案（必填，最大 10MB）
- `description`: 照片描述（選填）
- `uploadedBy`: 上傳者（選填）

**cURL 範例**：
```bash
curl -X POST \
  -F "photo=@photo.jpg" \
  -F "description=鋼筋綁紮完成" \
  -F "uploadedBy=張師傅" \
  http://localhost:8096/api/tasks/task-001/photos
```

**回應範例**：
```json
{
  "id": "photo-a3f7b2c1",
  "taskId": "task-001",
  "timestamp": "2026-02-15T03:45:30.000Z",
  "gdriveUrl": "https://drive.google.com/file/d/1a2b3c4d5e6f7/view",
  "gdriveFileId": "1a2b3c4d5e6f7",
  "thumbnailUrl": "https://drive.google.com/thumbnail?id=1a2b3c4d5e6f7",
  "description": "鋼筋綁紮完成",
  "uploadedBy": "張師傅",
  "fileSize": 856432,
  "createdAt": "2026-02-15T03:45:30.000Z"
}
```

**處理流程**：
1. 接收照片檔案
2. 壓縮照片（最大 1920x1080，品質 85%，目標 <2MB）
3. 上傳到 Google Drive（`工程專案管理/{taskId}/` 資料夾）
4. 設定為公開可讀
5. 儲存記錄到資料庫
6. 回傳 Google Drive 連結

**錯誤**：
- `404`: 任務不存在
- `400`: 未上傳照片或檔案格式錯誤
- `500`: Google Drive 上傳失敗（檢查 .env 設定）

---

### 8. 批次上傳照片

```
POST /api/tasks/:taskId/photos/batch
```

**參數**：
- `taskId`: 任務 ID

**Content-Type**：`multipart/form-data`

**Form Fields**：
- `photos`: 照片檔案陣列（最多 10 張）
- `uploadedBy`: 上傳者（選填）

**cURL 範例**：
```bash
curl -X POST \
  -F "photos=@photo1.jpg" \
  -F "photos=@photo2.jpg" \
  -F "photos=@photo3.jpg" \
  -F "uploadedBy=張師傅" \
  http://localhost:8096/api/tasks/task-001/photos/batch
```

**回應範例**：
```json
{
  "success": 3,
  "failed": 0,
  "results": [
    {
      "id": "photo-001",
      "fileName": "photo1.jpg",
      "gdriveUrl": "https://drive.google.com/file/d/...",
      "success": true
    },
    {
      "id": "photo-002",
      "fileName": "photo2.jpg",
      "gdriveUrl": "https://drive.google.com/file/d/...",
      "success": true
    }
  ],
  "errors": []
}
```

**注意**：部分失敗不會中斷整個流程，會回傳成功和失敗的清單。

---

## ☁️ Google Drive 設定

### 方案 A：服務帳號（推薦）

#### 1. 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com)
2. 建立新專案：**工程專案管理系統**

#### 2. 啟用 Google Drive API

1. 搜尋「**Google Drive API**」
2. 點擊「**啟用**」

#### 3. 建立服務帳號

1. 左側選單 → **IAM 與管理** → **服務帳號**
2. 點擊「**建立服務帳號**」
3. 服務帳號名稱：`construction-project-manager`
4. 角色：**不需要**（我們用資料夾權限控制）
5. 點擊「**完成**」

#### 4. 下載 JSON 金鑰

1. 點擊剛建立的服務帳號
2. 切換到「**金鑰**」頁籤
3. 新增金鑰 → **JSON**
4. 下載 JSON 檔案（請妥善保管！）

#### 5. 設定 Google Drive 權限

**方案 A：分享特定資料夾（推薦）**

1. 在 Andy 的 Google Drive（julianpjlee20@gmail.com）建立資料夾：`工程專案管理`
2. 右鍵資料夾 → **共用**
3. 貼上服務帳號 email（從 JSON 檔案取得 `client_email`）
   - 格式：`xxxxx@xxxxx.iam.gserviceaccount.com`
4. 權限：**編輯者**
5. 點擊「**傳送**」
6. 複製資料夾 ID：
   - 開啟資料夾，URL 格式：`https://drive.google.com/drive/folders/{FOLDER_ID}`
   - 複製最後一段 `{FOLDER_ID}`

**方案 B：使用服務帳號的 Drive（不推薦）**

- 留空 `GOOGLE_DRIVE_FOLDER_ID`
- 照片會上傳到服務帳號的 Google Drive
- ⚠️ **缺點**：需要用服務帳號登入 Google Drive 才能看到檔案

#### 6. 填入環境變數

編輯 `.env`：

```env
GOOGLE_SERVICE_ACCOUNT_EMAIL=xxxxx@xxxxx.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_KEY_HERE\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=1a2b3c4d5e6f7
```

**注意**：
- `GOOGLE_PRIVATE_KEY` 要用雙引號包住
- 保留 `\n`（不要用真的換行）

#### 7. 測試連線

```bash
npm start
```

啟動時會自動檢查 Google Drive 連線：

```
✅ 資料庫初始化完成
☁️  檢查 Google Drive 連線...
✅ Google Drive 連線正常
✅ 伺服器啟動成功！
```

---

### 方案 B：OAuth 2.0（備用）

如果服務帳號有問題，可使用 OAuth 2.0（需要瀏覽器授權）。

詳細步驟請參考 [Google Drive API 官方文件](https://developers.google.com/drive/api/quickstart/nodejs)。

---

## 🧪 測試 API

### 使用 cURL

```bash
# 1. 健康檢查
curl http://localhost:8096/health

# 2. 建立任務
curl -X POST http://localhost:8096/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "鋼筋綁紮",
    "description": "一樓鋼筋綁紮",
    "assignee": "張師傅",
    "status": "待辦",
    "plannedStartDate": "2026-02-10",
    "plannedEndDate": "2026-02-20",
    "progress": 0
  }'

# 3. 取得所有任務
curl http://localhost:8096/api/tasks

# 4. 更新任務進度
curl -X PUT http://localhost:8096/api/tasks/task-001 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "進行中",
    "progress": 60,
    "actualStartDate": "2026-02-11"
  }'

# 5. 上傳照片
curl -X POST http://localhost:8096/api/tasks/task-001/photos \
  -F "photo=@photo.jpg" \
  -F "description=鋼筋綁紮完成" \
  -F "uploadedBy=張師傅"

# 6. 取得任務照片
curl http://localhost:8096/api/tasks/task-001/photos
```

### 使用 Postman

匯入以下請求集合：

1. **Environment**：
   - `base_url`: `http://localhost:8096`

2. **請求清單**：
   - GET `{{base_url}}/api/tasks`
   - POST `{{base_url}}/api/tasks`
   - PUT `{{base_url}}/api/tasks/:id`
   - DELETE `{{base_url}}/api/tasks/:id`
   - POST `{{base_url}}/api/tasks/:taskId/photos`（Form-data，上傳檔案）

---

## 🗄️ 資料庫結構

### tasks 表

| 欄位 | 類型 | 說明 | 約束 |
|------|------|------|------|
| id | TEXT | 任務 ID | PRIMARY KEY |
| name | TEXT | 任務名稱 | NOT NULL |
| description | TEXT | 描述 | - |
| assignee | TEXT | 負責人 | - |
| status | TEXT | 狀態 | CHECK (待辦/進行中/已完成) |
| planned_start_date | TEXT | 預計開始日期 | - |
| planned_end_date | TEXT | 預計結束日期 | - |
| actual_start_date | TEXT | 實際開始日期 | - |
| actual_end_date | TEXT | 實際結束日期 | - |
| progress | INTEGER | 進度 (0-100) | CHECK (0-100) |
| dependencies | TEXT | 依賴任務 (JSON) | - |
| created_at | TEXT | 建立時間 | DEFAULT CURRENT_TIMESTAMP |
| updated_at | TEXT | 更新時間 | DEFAULT CURRENT_TIMESTAMP |

### photos 表

| 欄位 | 類型 | 說明 | 約束 |
|------|------|------|------|
| id | TEXT | 照片 ID | PRIMARY KEY |
| task_id | TEXT | 任務 ID | NOT NULL, FOREIGN KEY |
| timestamp | TEXT | 時間戳記 | NOT NULL |
| gdrive_url | TEXT | Google Drive 檢視連結 | NOT NULL |
| gdrive_file_id | TEXT | Google Drive 檔案 ID | NOT NULL |
| thumbnail_url | TEXT | 縮圖連結 | - |
| description | TEXT | 描述 | - |
| uploaded_by | TEXT | 上傳者 | - |
| file_size | INTEGER | 檔案大小 (bytes) | - |
| created_at | TEXT | 建立時間 | DEFAULT CURRENT_TIMESTAMP |

**關聯**：`photos.task_id` → `tasks.id` (ON DELETE CASCADE)

---

## 📂 專案結構

```
backend/
├── src/
│   ├── routes/
│   │   ├── tasks.js          # 任務 CRUD API
│   │   └── photos.js         # 照片上傳 API
│   ├── services/
│   │   ├── database.js       # SQLite 資料庫服務
│   │   ├── googleDrive.js    # Google Drive 整合
│   │   └── photoCompression.js  # 照片壓縮
│   ├── app.js                # Express 應用主體
│   └── server.js             # 伺服器啟動
├── database.sqlite           # SQLite 資料庫檔案（自動建立）
├── .env                      # 環境變數（需手動建立）
├── .env.example              # 環境變數範例
├── .gitignore                # Git 忽略清單
├── package.json              # 專案設定
└── README.md                 # API 文件（本檔案）
```

---

## ⚠️ 注意事項

### Google Drive API 配額

- **免費版**：每天 1,000 次請求
- **寫入配額**：每 100 秒最多 1,000 次請求
- **足夠測試使用**，生產環境建議監控配額

### 照片限制

- **上傳限制**：10MB（Multer 設定）
- **壓縮目標**：<2MB
- **尺寸限制**：最大 1920x1080
- **格式**：自動轉為 JPEG

### 安全性

- **不要提交 .env 到 Git**（已加入 .gitignore）
- **服務帳號金鑰請妥善保管**
- **生產環境建議啟用 HTTPS**
- **考慮加入身份驗證（JWT）**

### 已知限制

- **照片不可刪除**：只能新增，不能刪除（符合 PM 需求）
- **無身份驗證**：目前為開放 API，建議加入 JWT
- **單伺服器**：無負載平衡和高可用性
- **SQLite**：不適合高並發，生產環境建議改用 PostgreSQL

---

## 🚨 故障排除

### 1. Google Drive 上傳失敗

**錯誤訊息**：`Google Drive API 認證失敗`

**解決方法**：
1. 檢查 `.env` 檔案是否正確設定
2. 確認 `GOOGLE_PRIVATE_KEY` 有用雙引號包住
3. 確認服務帳號有編輯資料夾的權限
4. 檢查 Google Cloud Console 是否啟用 Google Drive API

### 2. 資料庫初始化失敗

**錯誤訊息**：`database.sqlite` 權限錯誤

**解決方法**：
```bash
chmod 644 database.sqlite
```

### 3. 照片壓縮失敗

**錯誤訊息**：`Sharp 錯誤`

**解決方法**：
1. 確認上傳的是有效圖片檔案
2. 重新安裝 Sharp：`npm install --force sharp`

### 4. Port 8096 已被佔用

**解決方法**：
```bash
# 修改 .env
PORT=8097
```

---

## 📝 開發紀錄

### 已完成功能

- ✅ SQLite 資料庫設計（tasks、photos 表）
- ✅ CRUD API（任務管理）
- ✅ Google Drive 整合（照片上傳）
- ✅ 照片壓縮（Sharp，最大 2MB）
- ✅ 批次上傳（最多 10 張）
- ✅ 自動建立資料夾結構（`工程專案管理/{taskId}/`）
- ✅ 錯誤處理（詳細錯誤訊息）
- ✅ API 文件（本檔案）

### 待加強功能

- ⏳ 身份驗證（JWT）
- ⏳ 單元測試
- ⏳ 照片標註（畫箭頭、加文字）
- ⏳ PDF 報告匯出
- ⏳ WebSocket（即時更新）

---

## 👨‍💻 開發者

**後端工程師**：Claude (OpenClaw Agent)  
**PM**：Julian-bot  
**專案**：向上建設 - 工程專案管理系統  
**開發時間**：2026-02-15（約 2.5h）

---

## 📄 授權

MIT License
