# Google Drive 整合 - 5 分鐘快速設定

**目標帳號**：julianpjlee20@gmail.com  
**估計時間**：5-10 分鐘  

---

## 📋 設定步驟

### 步驟 1: 前往 Google Cloud Console

🔗 **連結**：https://console.cloud.google.com/

1. 登入帳號：**julianpjlee20@gmail.com**
2. 點擊左上角「選擇專案」→「新增專案」
3. 專案名稱：`工程專案管理系統`
4. 點擊「建立」（等待約 30 秒）

---

### 步驟 2: 啟用 Google Drive API

1. 在專案中，點擊左側選單「API 和服務」→「資料庫」
2. 搜尋：`Google Drive API`
3. 點擊「啟用」

**✅ 確認**：畫面顯示「Google Drive API 已啟用」

---

### 步驟 3: 建立 Service Account

1. 點擊左側選單「API 和服務」→「憑證」
2. 點擊上方「+ 建立憑證」→「服務帳戶」
3. 填寫資料：
   ```
   服務帳戶名稱：construction-pm-backend
   服務帳戶 ID：(自動產生)
   描述：工程專案管理系統照片上傳服務
   ```
4. 點擊「建立並繼續」
5. **角色選擇**（重要）：
   - 選擇「基本」→「編輯者」
   - 或「Project」→「Editor」
6. 點擊「完成」

**✅ 確認**：服務帳戶列表出現新的帳戶，Email 類似：
```
construction-pm-backend@xxx.iam.gserviceaccount.com
```

---

### 步驟 4: 下載憑證 JSON

1. 在「憑證」頁面，找到剛建立的服務帳戶
2. 點擊服務帳戶的 Email（藍色連結）
3. 切換到「金鑰」分頁
4. 點擊「新增金鑰」→「建立新的金鑰」
5. **金鑰類型**：選擇「JSON」
6. 點擊「建立」

**結果**：瀏覽器自動下載一個 JSON 檔案，檔名類似：
```
工程專案管理系統-abc123def456.json
```

---

### 步驟 5: 放置憑證檔案

**⚠️ 重要**：將下載的 JSON 檔案重新命名並放置到正確位置

#### 方法 A: 使用終端機（推薦）

```bash
# 假設檔案在 ~/Downloads/
mv ~/Downloads/工程專案管理系統-*.json \
   /home/ubuntu/.openclaw/workspace/notes/向上建設/工程專案管理系統/src/backend/google-credentials.json

# 檢查檔案是否存在
ls -lh /home/ubuntu/.openclaw/workspace/notes/向上建設/工程專案管理系統/src/backend/google-credentials.json
```

#### 方法 B: 手動複製

1. 找到下載的 JSON 檔案
2. 重新命名為：`google-credentials.json`
3. 複製到路徑：
   ```
   /home/ubuntu/.openclaw/workspace/notes/向上建設/工程專案管理系統/src/backend/
   ```

**✅ 確認**：檔案大小約 2-3 KB

---

### 步驟 6: 重啟後端伺服器

```bash
cd /home/ubuntu/.openclaw/workspace/notes/向上建設/工程專案管理系統/src/backend

# 停止現有伺服器
pkill -f "node server.js"

# 啟動（Google Drive 模式）
export STORAGE_MODE=gdrive
npm start
```

**✅ 預期訊息**：
```
✅ Database initialized
✅ Google Drive API initialized  ← 看到這行表示成功！
🚀 工程專案管理系統後端 API - Phase 2
📡 Server running on http://localhost:8096
📦 Storage mode: gdrive
```

**❌ 如果看到警告**：
```
⚠️  Google credentials 檔案不存在
```
→ 表示檔案路徑錯誤，請重新檢查步驟 5

---

### 步驟 7: 測試上傳功能

```bash
# 建立測試圖片
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > /tmp/test.jpg

# 測試上傳（使用現有任務 task-001）
curl -X POST http://localhost:8096/api/tasks/task-001/photos \
  -F "photo=@/tmp/test.jpg" \
  -F "description=Google Drive 測試" \
  -F "uploaded_by=PM" \
  -s | jq .
```

**✅ 成功回應範例**：
```json
{
  "success": true,
  "data": {
    "photoId": "photo-xxx",
    "url": "https://drive.google.com/file/d/xxx/view",  ← Google Drive URL
    "timestamp": "2026-02-15T..."
  }
}
```

---

### 步驟 8: 檢查 Google Drive

1. 前往 https://drive.google.com/
2. 登入：julianpjlee20@gmail.com
3. 應該看到新資料夾：**「工程專案管理」**
4. 點進去 → **「鋼筋綁紮」**（或其他任務名稱）
5. 看到剛上傳的測試照片 ✅

**資料夾結構**：
```
Google Drive
└── 工程專案管理/
    └── 鋼筋綁紮/
        └── 2026-02-15_01-XX-XX_test.jpg
```

---

## ✅ 完成檢查清單

- [ ] 建立 Google Cloud 專案
- [ ] 啟用 Google Drive API
- [ ] 建立 Service Account
- [ ] 下載 JSON 憑證
- [ ] 放置 `google-credentials.json` 到正確路徑
- [ ] 重啟伺服器（看到「✅ Google Drive API initialized」）
- [ ] 測試上傳照片（收到 Google Drive URL）
- [ ] 到 Google Drive 確認照片存在

---

## ⚠️ 常見問題

### Q1: 伺服器啟動時顯示「Google credentials 檔案不存在」

**A**: 檢查檔案路徑和名稱：
```bash
ls -lh /home/ubuntu/.openclaw/workspace/notes/向上建設/工程專案管理系統/src/backend/google-credentials.json
```
應該看到檔案大小約 2-3 KB

---

### Q2: 上傳照片失敗，錯誤「Google Drive 未初始化」

**A**: 
1. 檢查伺服器啟動訊息是否有「✅ Google Drive API initialized」
2. 如果沒有，檢查 JSON 憑證格式是否正確
3. 重新下載憑證並重啟伺服器

---

### Q3: 照片上傳成功，但 Google Drive 沒有檔案

**A**:
1. 檢查 Service Account 的權限（應該有「編輯者」或「Drive File 管理員」）
2. 確認專案已啟用 Google Drive API
3. 檢查 API 配額是否超限（unlikely for first use）

---

### Q4: 想改成本地儲存模式（不用 Google Drive）

**A**: 
```bash
# 停止伺服器
pkill -f "node server.js"

# 啟動（本地模式）
unset STORAGE_MODE  # 或 export STORAGE_MODE=local
npm start
```

照片會儲存於 `src/backend/uploads/` 資料夾

---

## 🔐 安全提醒

**⚠️ google-credentials.json 包含敏感資訊！**

- ✅ 已在 `.gitignore` 排除（不會上傳到 Git）
- ❌ **絕對不要**分享此檔案給他人
- ❌ **絕對不要**上傳到公開 GitHub/GitLab
- ✅ 如果不小心洩漏，立即到 Google Cloud Console 刪除並重新建立

---

## 📞 需要協助？

如果按照步驟仍無法成功，請提供：

1. 伺服器啟動時的完整 log
2. 上傳照片時的錯誤訊息
3. `ls -lh google-credentials.json` 的結果

---

**設定完成後，恭喜！🎉**  
您的系統現在可以自動備份所有工地照片到 Google Drive！
