# PM 驗收指南 - 後端系統

**系統狀態**：✅ **運行中**  
**Port**：8096  
**驗收時間**：< 5 分鐘

---

## ⚡ 快速驗收（3 步驟）

### 步驟 1：檢查伺服器狀態

```bash
curl http://localhost:8096/health
```

**預期結果**：
```json
{
  "status": "OK",
  "timestamp": "2026-02-14T...",
  "storageMode": "local"
}
```

✅ 如果看到 `"status": "OK"`，代表伺服器正常運行。

---

### 步驟 2：查看任務列表

```bash
curl http://localhost:8096/api/tasks
```

**預期結果**：
```json
[
  {
    "id": "...",
    "name": "任務名稱",
    "assignee": "負責人",
    "status": "進行中",
    "progress": 50,
    ...
  }
]
```

✅ 如果看到任務陣列，代表資料庫正常運作。

---

### 步驟 3：測試建立任務

```bash
curl -X POST http://localhost:8096/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "PM驗收測試",
    "assignee": "PM",
    "status": "進行中",
    "progress": 100
  }'
```

**預期結果**：
```json
{
  "id": "...",
  "name": "PM驗收測試",
  "assignee": "PM",
  "status": "進行中",
  "progress": 100,
  ...
}
```

✅ 如果看到任務資料回傳，代表 API CRUD 功能正常。

---

## 📋 完整驗收清單

### ✅ 核心功能

- [ ] **伺服器啟動**
  ```bash
  curl http://localhost:8096/health
  ```
  → 看到 `"status": "OK"`

- [ ] **取得任務列表**
  ```bash
  curl http://localhost:8096/api/tasks
  ```
  → 返回任務陣列

- [ ] **建立任務**
  ```bash
  curl -X POST http://localhost:8096/api/tasks \
    -H "Content-Type: application/json" \
    -d '{"name":"測試任務","assignee":"PM"}'
  ```
  → 返回新任務資料（含 `id`）

- [ ] **更新任務**
  ```bash
  # 先取得任務 ID（從上一步結果）
  TASK_ID="複製上一步的 id"
  
  curl -X PATCH http://localhost:8096/api/tasks/$TASK_ID \
    -H "Content-Type: application/json" \
    -d '{"progress": 100}'
  ```
  → 返回更新後的任務資料

- [ ] **刪除任務**
  ```bash
  curl -X DELETE http://localhost:8096/api/tasks/$TASK_ID
  ```
  → 返回 `{"message": "任務已刪除", ...}`

### ✅ 照片功能

- [ ] **準備測試圖片**
  ```bash
  # 建立一個測試圖片（或使用現有圖片）
  # 假設有 test.jpg
  ```

- [ ] **上傳照片**
  ```bash
  # 使用任一任務 ID
  curl -X POST http://localhost:8096/api/tasks/TASK_ID/photos \
    -F "photo=@test.jpg" \
    -F "description=PM驗收測試照片" \
    -F "uploaded_by=PM"
  ```
  → 返回照片資料（含 `url`）

- [ ] **查看照片列表**
  ```bash
  curl http://localhost:8096/api/tasks/TASK_ID/photos
  ```
  → 返回照片陣列

### ✅ 文件檢查

- [ ] **README.md** - API 文件齊全
- [ ] **.env.example** - 環境變數範例
- [ ] **GDRIVE-SETUP.md** - Google Drive 設定指南
- [ ] **後端完成報告-subagent.md** - 詳細報告
- [ ] **交付總結.md** - 交付總結

### ✅ 程式碼檢查

- [ ] **server.js** - Express 伺服器
- [ ] **db.js** - 資料庫操作
- [ ] **gdrive.js** - Google Drive 整合
- [ ] **seed.js** - 測試資料產生器
- [ ] **package.json** - 依賴管理

---

## 🎯 一鍵測試腳本

為了方便驗收，已建立測試腳本：

```bash
cd /home/ubuntu/.openclaw/workspace/notes/向上建設/工程專案管理系統/src/backend
chmod +x 快速測試.sh
./快速測試.sh
```

**預期結果**：
```
🧪 後端 API 快速測試
================================

✅ 健康檢查:
{
  "status": "OK",
  ...
}

✅ 任務列表:
   共 X 個任務
{
  "id": "...",
  "name": "...",
  ...
}

✅ 建立新任務:
   任務 ID: ...

✅ 更新任務:
{
  "name": "...",
  "progress": 100
}

================================
✅ 測試完成！伺服器運作正常。
```

---

## 📊 驗收標準

| 項目 | 驗收標準 | 測試方法 |
|------|----------|----------|
| API CRUD | 所有端點正常 | 執行 `快速測試.sh` |
| 照片上傳 | 支援圖片上傳與壓縮 | POST /api/tasks/:id/photos |
| CORS | 前端能跨域呼叫 | 前端測試（或 curl -H "Origin: ..."） |
| Port 8096 | 伺服器監聽 8096 | `curl http://localhost:8096/health` |
| 文件 | 齊全且清晰 | 檢查 README.md 等文件 |
| 測試資料 | 至少 3-5 個任務 | `npm run seed` 產生 10 個任務 |

---

## 🚨 常見問題

### Q1: Port 8096 無法訪問？

```bash
# 檢查伺服器是否運行
netstat -tuln | grep 8096

# 如果沒有，啟動伺服器
cd /home/ubuntu/.openclaw/workspace/notes/向上建設/工程專案管理系統/src/backend
npm start
```

### Q2: API 返回 404？

確認 URL 格式正確：
- ✅ `http://localhost:8096/api/tasks`
- ❌ `http://localhost:8096/tasks`（缺少 `/api`）

### Q3: 照片上傳失敗？

1. 檢查檔案格式（只支援 JPEG, PNG, WebP）
2. 檢查檔案大小（< 10MB）
3. 確認 `uploads/` 資料夾存在且有寫入權限

### Q4: 如何重建測試資料？

```bash
npm run seed
```

會建立 10 個測試任務 + 4 張範例照片。

---

## 📞 需要支援？

### 查看詳細報告

```bash
cat 後端完成報告-subagent.md
```

### 查看 API 文件

```bash
cat README.md
```

### 查看 Google Drive 設定

```bash
cat GDRIVE-SETUP.md
```

---

## ✅ 驗收簽核

### 必須項目

- [ ] REST API CRUD - 正常運作
- [ ] 照片上傳功能 - 正常運作
- [ ] CORS 設定 - 前端能呼叫
- [ ] Port 8096 - 正常監聽
- [ ] 文件齊全 - README + 設定指南
- [ ] 測試資料 - 已建立

### 加分項目

- [ ] Google Drive 整合 - 已實作（可選開啟）
- [ ] SQLite 資料庫 - 已使用（比 JSON 更穩定）
- [ ] 詳細報告 - 已撰寫

### 驗收結論

- [ ] ✅ 通過驗收
- [ ] 🔧 需要修改：________________
- [ ] ❌ 不通過：________________

---

**PM 簽核**：________________  
**日期**：________________  
**備註**：________________

---

## 🎉 驗收後下一步

1. **前端整合**
   - 前端使用 `http://localhost:8096` 作為 API base URL
   - CORS 已設定，可直接呼叫

2. **Google Drive 設定（可選）**
   - 參考 `GDRIVE-SETUP.md`
   - 填入 `.env` 後重啟伺服器

3. **部署準備**
   - 環境變數設定
   - 資料庫備份
   - 照片儲存規劃

---

**快速驗收**：執行 `./快速測試.sh`，看到全部 ✅ 即可通過！
