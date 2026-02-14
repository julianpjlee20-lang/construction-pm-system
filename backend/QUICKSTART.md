# 🚀 快速啟動指南

Andy 起床後 5 分鐘內啟動系統！

---

## 步驟 1️⃣：安裝依賴（首次執行）

```bash
cd notes/向上建設/工程專案管理系統/src/backend
npm install
```

**預計時間**：1 分鐘

---

## 步驟 2️⃣：設定 Google Drive（可選）

### 如果**只測試 CRUD API**（不上傳照片）

**跳過此步驟**，直接到步驟 3。

### 如果**要測試照片上傳**

#### 方案 A：使用我預設的服務帳號（快速測試）

```bash
cp .env.example .env
# 然後編輯 .env，填入服務帳號資訊（PM 會另外提供）
```

#### 方案 B：建立自己的服務帳號（完整權限）

詳見 [README.md - Google Drive 設定](./README.md#%EF%B8%8F-google-drive-%E8%A8%AD%E5%AE%9A)

**預計時間**：5 分鐘（方案 A）或 15 分鐘（方案 B）

---

## 步驟 3️⃣：啟動伺服器

```bash
npm start
```

**成功畫面**：

```
🚀 正在啟動工程專案管理系統後端...
📊 初始化資料庫...
✅ 資料庫初始化完成
☁️  檢查 Google Drive 連線...
✅ Google Drive 連線正常

✅ 伺服器啟動成功！
📍 位址: http://localhost:8096
📚 API 文件: http://localhost:8096/
🏥 健康檢查: http://localhost:8096/health
```

**預計時間**：10 秒

---

## 步驟 4️⃣：測試 API

### 方案 A：自動化測試腳本

```bash
# 新開一個終端機
cd notes/向上建設/工程專案管理系統/src/backend
chmod +x test-api.sh
./test-api.sh
```

會自動執行：
1. 建立任務
2. 更新進度
3. 查詢任務

### 方案 B：手動測試（cURL）

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
    "plannedStartDate": "2026-02-10",
    "plannedEndDate": "2026-02-20"
  }'

# 3. 取得所有任務
curl http://localhost:8096/api/tasks
```

### 方案 C：Postman / Thunder Client

匯入以下 URL：`http://localhost:8096`

**預計時間**：2 分鐘

---

## 步驟 5️⃣：測試照片上傳（需 Google Drive）

### 準備測試照片

```bash
# 下載測試照片（或使用自己的）
curl -o test-photo.jpg https://picsum.photos/1920/1080
```

### 上傳照片

```bash
# 先建立一個任務並記下 ID（例如：task-a3f7b2c1）
TASK_ID="task-a3f7b2c1"

# 上傳照片
curl -X POST http://localhost:8096/api/tasks/$TASK_ID/photos \
  -F "photo=@test-photo.jpg" \
  -F "description=測試照片" \
  -F "uploadedBy=Andy"
```

### 驗證結果

1. **檢查回應**：會回傳 Google Drive 連結
2. **開啟連結**：點擊 `gdriveUrl` 應該能看到照片
3. **查看資料夾**：前往 Google Drive `工程專案管理/{TASK_ID}/` 資料夾

**預計時間**：1 分鐘

---

## 🎯 驗收清單

- [ ] 伺服器啟動成功（http://localhost:8096）
- [ ] GET `/api/tasks` 可取得任務清單
- [ ] POST `/api/tasks` 可建立任務
- [ ] PUT `/api/tasks/:id` 可更新任務
- [ ] DELETE `/api/tasks/:id` 可刪除任務
- [ ] POST `/api/tasks/:id/photos` 可上傳照片（需 Google Drive）
- [ ] GET `/api/tasks/:id/photos` 可取得照片清單
- [ ] Google Drive 能看到上傳的照片

---

## 🚨 常見問題

### Q1: 伺服器啟動失敗

**錯誤**：`Port 8096 already in use`

**解決**：
```bash
# 修改 .env
PORT=8097
```

### Q2: Google Drive 上傳失敗

**錯誤**：`Google Drive API 認證失敗`

**解決**：
1. 檢查 `.env` 是否正確設定
2. 確認 `GOOGLE_PRIVATE_KEY` 有用雙引號包住
3. 確認服務帳號有資料夾編輯權限

### Q3: 照片壓縮失敗

**錯誤**：`Sharp 錯誤`

**解決**：
```bash
npm install --force sharp
```

### Q4: 資料庫初始化失敗

**解決**：
```bash
npm run init-db
```

---

## 📚 進階使用

### 查看資料庫

```bash
sqlite3 database.sqlite
```

```sql
-- 查看所有任務
SELECT * FROM tasks;

-- 查看所有照片
SELECT * FROM photos;

-- 退出
.quit
```

### 清空資料庫

```bash
rm database.sqlite
npm run init-db
```

### 開發模式（自動重啟）

```bash
npm run dev
```

---

## 📝 下一步

1. **整合前端**：前端工程師會連接此 API
2. **測試照片上傳**：確認 Google Drive 整合正常
3. **準備演示資料**：建立幾個範例任務
4. **閱讀完整文件**：[README.md](./README.md)

---

## 💡 提示

- **API 文件**：開啟瀏覽器訪問 `http://localhost:8096/` 查看完整 API 列表
- **健康檢查**：隨時用 `curl http://localhost:8096/health` 確認伺服器狀態
- **日誌輸出**：伺服器會輸出詳細日誌，方便除錯

---

**開發完成時間**：2026-02-15 (約 2.5h)  
**後端工程師**：Claude (OpenClaw Agent)  
**PM**：Julian-bot

🎉 **祝使用愉快！**
