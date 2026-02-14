# 工程專案管理系統 - 後端 API 文件

## 📋 目錄
- [快速開始](#快速開始)
- [API 端點](#api-端點)
- [資料格式](#資料格式)
- [錯誤處理](#錯誤處理)
- [Google Drive 設定](#google-drive-設定)

---

## 🚀 快速開始

### 1. 安裝依賴
```bash
cd src/backend
npm install
```

### 2. 設定環境變數
複製 `.env.example` 為 `.env` 並填入設定：

```bash
cp .env.example .env
```

**必要設定**：
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Service Account 金鑰路徑
- `PORT`: API 伺服器 port（預設 8096）

### 3. 建立測試資料（可選）
```bash
node scripts/seed-data.js
```

### 4. 啟動伺服器
```bash
npm start

# 或使用 nodemon（開發模式）
npm run dev
```

伺服器將運行於 `http://localhost:8096`

---

## 📡 API 端點

### 健康檢查
```
GET /health
```

**回應範例**：
```json
{
  "status": "ok",
  "timestamp": "2026-02-14T19:50:00Z",
  "service": "工程專案管理系統 API",
  "version": "1.0.0"
}
```

---

### 任務管理

#### 取得所有任務
```
GET /api/tasks
```

**回應範例**：
```json
[
  {
    "id": "task-001",
    "name": "鋼筋綁紮",
    "description": "1F 鋼筋綁紮作業",
    "assignee": "張師傅",
    "status": "進行中",
    "plannedStartDate": "2026-02-10",
    "plannedEndDate": "2026-02-15",
    "plannedDuration": 5,
    "actualStartDate": "2026-02-10",
    "actualEndDate": null,
    "progress": 60,
    "dependencies": [],
    "createdAt": "2026-02-14T19:50:00Z",
    "updatedAt": "2026-02-14T19:50:00Z",
    "photos": []
  }
]
```

---

#### 建立任務
```
POST /api/tasks
Content-Type: application/json
```

**請求範例**：
```json
{
  "name": "鋼筋綁紮",
  "description": "1F 鋼筋綁紮作業",
  "assignee": "張師傅",
  "status": "待辦",
  "plannedStartDate": "2026-02-10",
  "plannedEndDate": "2026-02-15",
  "plannedDuration": 5,
  "dependencies": []
}
```

**必填欄位**：
- `name`: 任務名稱

**可選欄位**：
- `description`: 任務描述
- `assignee`: 負責人
- `status`: 狀態（待辦/進行中/已完成，預設：待辦）
- `plannedStartDate`: 預計開始日期
- `plannedEndDate`: 預計結束日期
- `plannedDuration`: 預計工期（天數）
- `dependencies`: 依賴任務 ID 陣列

---

#### 取得單一任務
```
GET /api/tasks/:id
```

---

#### 更新任務
```
PATCH /api/tasks/:id
Content-Type: application/json
```

**請求範例**：
```json
{
  "status": "進行中",
  "progress": 60,
  "actualStartDate": "2026-02-10"
}
```

**可更新欄位**：
- `name`, `description`, `assignee`, `status`
- `plannedStartDate`, `plannedEndDate`, `plannedDuration`
- `actualStartDate`, `actualEndDate`
- `progress`: 0-100
- `dependencies`: 依賴任務 ID 陣列

---

#### 刪除任務
```
DELETE /api/tasks/:id
```

**回應範例**：
```json
{
  "message": "任務已刪除",
  "id": "task-001"
}
```

**注意**：刪除任務會連帶刪除所有照片記錄（但 Google Drive 照片不會被刪除）

---

### 照片管理

#### 上傳照片
```
POST /api/tasks/:id/photos
Content-Type: multipart/form-data
```

**表單欄位**：
- `file`: 照片檔案（必填，最大 10MB）
- `description`: 照片描述（可選）
- `uploadedBy`: 上傳者（可選）
- `projectName`: 專案名稱（可選，預設「預設專案」）

**curl 範例**：
```bash
curl -X POST http://localhost:8096/api/tasks/task-001/photos \
  -F "file=@photo.jpg" \
  -F "description=鋼筋綁紮完成 60%" \
  -F "uploadedBy=張師傅" \
  -F "projectName=向上建設A案"
```

**回應範例**：
```json
{
  "id": "photo-001",
  "taskId": "task-001",
  "gdriveUrl": "https://drive.google.com/file/d/xxx/view",
  "gdriveFileId": "xxx",
  "thumbnailUrl": "https://...",
  "description": "鋼筋綁紮完成 60%",
  "uploadedBy": "張師傅",
  "timestamp": "2026-02-14T15:30:00Z"
}
```

**Google Drive 資料夾結構**：
```
/工程專案管理/
  └── {專案名稱}/
      └── {任務ID}/
          ├── photo1.jpg
          ├── photo2.jpg
          └── ...
```

---

#### 取得任務照片列表
```
GET /api/tasks/:id/photos
```

**回應範例**：
```json
[
  {
    "id": "photo-001",
    "taskId": "task-001",
    "gdriveUrl": "https://drive.google.com/file/d/xxx/view",
    "gdriveFileId": "xxx",
    "thumbnailUrl": "https://...",
    "description": "鋼筋綁紮完成 60%",
    "uploadedBy": "張師傅",
    "timestamp": "2026-02-14T15:30:00Z"
  }
]
```

---

## 📊 資料格式

### 任務狀態
- `待辦`: 尚未開始
- `進行中`: 正在執行
- `已完成`: 已完成

### 日期格式
- ISO 8601 格式: `YYYY-MM-DD` (例: `2026-02-14`)
- 時間戳記: `YYYY-MM-DDTHH:mm:ssZ` (例: `2026-02-14T15:30:00Z`)

### 進度
- 整數，範圍 0-100

---

## ❌ 錯誤處理

所有錯誤回應格式：
```json
{
  "error": "錯誤摘要",
  "message": "詳細錯誤訊息",
  "code": "ERROR_CODE"
}
```

### 常見錯誤碼

**任務管理**：
- `TASK_NOT_FOUND`: 任務不存在（404）
- `MISSING_REQUIRED_FIELD`: 缺少必要欄位（400）
- `NO_UPDATE_FIELDS`: 沒有提供更新欄位（400）

**照片管理**：
- `MISSING_FILE`: 缺少檔案（400）
- `INVALID_FILE_TYPE`: 檔案格式錯誤（400）
- `FILE_TOO_LARGE`: 檔案過大（413）
- `GDRIVE_API_ERROR`: Google Drive API 錯誤（500）
- `UPLOAD_FAILED`: 上傳失敗（500）

---

## 🔐 Google Drive 設定

### 方案 A：Service Account（推薦）

#### 1. 建立 Google Cloud 專案
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 建立新專案或選擇現有專案

#### 2. 啟用 Google Drive API
1. 前往「API 和服務」→「程式庫」
2. 搜尋「Google Drive API」
3. 點擊「啟用」

#### 3. 建立 Service Account
1. 前往「IAM 與管理」→「服務帳戶」
2. 點擊「建立服務帳戶」
3. 填寫名稱（例：construction-project-api）
4. 點擊「建立並繼續」
5. 角色選擇「基本」→「編輯者」（或不選）
6. 點擊「完成」

#### 4. 下載金鑰
1. 點擊剛建立的 Service Account
2. 前往「金鑰」分頁
3. 點擊「新增金鑰」→「建立新金鑰」
4. 選擇「JSON」格式
5. 下載的檔案重新命名為 `service-account-key.json`
6. 放置於 `backend/credentials/` 資料夾

#### 5. 共用 Google Drive 資料夾
1. 開啟金鑰檔案，複製 `client_email` 欄位的值（例：`xxx@xxx.iam.gserviceaccount.com`）
2. 使用 `julianpjlee20@gmail.com` 帳號登入 Google Drive
3. 建立資料夾「工程專案管理」
4. 右鍵 → 共用
5. 貼上 Service Account 的 email
6. 權限設為「編輯者」
7. 點擊「傳送」

**注意**：不需要共用整個 Drive，只需共用「工程專案管理」資料夾即可。

---

### 方案 B：OAuth 2.0（替代方案）

如需使用 OAuth 2.0，請參考 [Google Drive API 文件](https://developers.google.com/drive/api/quickstart/nodejs)。

---

## 🧪 測試

### 使用 curl 測試

**建立任務**：
```bash
curl -X POST http://localhost:8096/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "測試任務",
    "description": "這是測試",
    "assignee": "測試人員",
    "status": "待辦"
  }'
```

**取得所有任務**：
```bash
curl http://localhost:8096/api/tasks
```

**更新任務**：
```bash
curl -X PATCH http://localhost:8096/api/tasks/task-001 \
  -H "Content-Type: application/json" \
  -d '{
    "status": "進行中",
    "progress": 50
  }'
```

**上傳照片**：
```bash
curl -X POST http://localhost:8096/api/tasks/task-001/photos \
  -F "file=@/path/to/photo.jpg" \
  -F "description=測試照片" \
  -F "uploadedBy=測試人員"
```

---

## 📁 專案結構

```
backend/
├── routes/           # API 路由
│   ├── tasks.js      # 任務管理路由
│   └── photos.js     # 照片管理路由
├── services/         # 服務層
│   └── googleDrive.js # Google Drive 整合
├── db/               # 資料庫
│   ├── schema.sql    # 資料庫 schema
│   ├── database.js   # 資料庫初始化
│   └── tasks.db      # SQLite 資料庫檔案（自動生成）
├── credentials/      # Google 憑證（不納入版控）
│   └── service-account-key.json
├── scripts/          # 工具腳本
│   └── seed-data.js  # 建立測試資料
├── server.js         # 主伺服器
├── package.json      # 依賴設定
├── .env.example      # 環境變數範例
└── .gitignore        # Git 忽略清單
```

---

## 🚨 注意事項

1. **照片不可刪除**：API 不提供刪除照片功能，確保記錄永久保留
2. **檔案大小限制**：前端應壓縮到 2MB 以下，後端限制 10MB
3. **CORS 設定**：預設允許 `localhost:3000`，正式環境需調整
4. **錯誤處理**：所有錯誤都使用統一格式回應
5. **Google Drive 權限**：所有上傳的照片自動設為「任何人可檢視」

---

## 🤝 與前端協調

### API Base URL
- 開發環境: `http://localhost:8096`
- 正式環境: 待定

### CORS
前端網域需加入 `.env` 的 `CORS_ORIGIN` 設定。

### 照片壓縮
前端應在上傳前將照片壓縮至 2MB 以下，以節省頻寬和加快上傳速度。

---

## 📞 支援

如有問題，請聯絡後端工程師。

---

**最後更新**: 2026-02-14  
**版本**: 1.0.0
