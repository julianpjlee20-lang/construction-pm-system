# Google Drive API 設定指南

## 📋 目標
設定 Google Drive API，讓系統能夠上傳照片到 `julianpjlee20@gmail.com` 的 Google Drive。

---

## 🔧 方案 A：Service Account（推薦）

### 步驟 1：建立 Google Cloud 專案
1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊左上角專案選單 → **新增專案**
3. 專案名稱：`工程專案管理系統`（或任意名稱）
4. 點擊「建立」

### 步驟 2：啟用 Google Drive API
1. 在專案中，前往左側選單 → **API 和服務** → **程式庫**
2. 搜尋「**Google Drive API**」
3. 點擊進入，點擊「**啟用**」按鈕

### 步驟 3：建立 Service Account
1. 前往左側選單 → **IAM 與管理** → **服務帳戶**
2. 點擊「**+ 建立服務帳戶**」
3. 填寫資訊：
   - **服務帳戶名稱**：`construction-project-api`
   - **服務帳戶 ID**：自動產生（例：`construction-project-api@xxx.iam.gserviceaccount.com`）
   - **描述**：工程專案管理系統 API
4. 點擊「**建立並繼續**」
5. **授予服務帳戶存取權**：可跳過（不選角色）
6. 點擊「**完成**」

### 步驟 4：下載 Service Account 金鑰
1. 在服務帳戶列表中，點擊剛建立的服務帳戶
2. 前往「**金鑰**」分頁
3. 點擊「**新增金鑰**」→「**建立新金鑰**」
4. 金鑰類型選擇「**JSON**」
5. 點擊「**建立**」→ 金鑰檔案會自動下載
6. 將下載的檔案重新命名為：`service-account-key.json`
7. 放置於：`/home/ubuntu/.openclaw/workspace/notes/向上建設/工程專案管理系統/src/backend/credentials/service-account-key.json`

### 步驟 5：共用 Google Drive 資料夾
1. **開啟金鑰檔案**（用文字編輯器），找到 `client_email` 欄位，複製 email（例：`construction-project-api@xxx.iam.gserviceaccount.com`）
2. 使用 **`julianpjlee20@gmail.com`** 帳號登入 [Google Drive](https://drive.google.com/)
3. 在 Google Drive 中建立資料夾「**工程專案管理**」（如果已存在則跳過）
4. 對資料夾按右鍵 → 選擇「**共用**」
5. 在「新增使用者或群組」欄位中，貼上步驟 1 複製的 Service Account email
6. 權限設定為「**編輯者**」
7. **取消勾選**「通知使用者」（因為 Service Account 沒有真人收信）
8. 點擊「**傳送**」

### 步驟 6：驗證設定
執行以下命令測試 Google Drive API：

```bash
cd /home/ubuntu/.openclaw/workspace/notes/向上建設/工程專案管理系統/src/backend
node -e "
const { initializeDrive } = require('./services/googleDrive');
initializeDrive();
console.log('✅ Google Drive API 初始化成功！');
"
```

如果看到「✅ Google Drive API 初始化成功！」表示設定正確。

---

## 📸 測試照片上傳

### 使用 curl 測試
```bash
# 準備一張測試照片（例：test.jpg）
curl -X POST http://localhost:8096/api/tasks/task-001/photos \
  -F "file=@test.jpg" \
  -F "description=測試照片" \
  -F "uploadedBy=測試人員" \
  -F "projectName=測試專案"
```

### 預期回應
```json
{
  "id": "photo-xxx",
  "taskId": "task-001",
  "gdriveUrl": "https://drive.google.com/file/d/xxx/view",
  "gdriveFileId": "xxx",
  "thumbnailUrl": "https://...",
  "description": "測試照片",
  "uploadedBy": "測試人員",
  "timestamp": "2026-02-14T20:00:00Z"
}
```

### 驗證照片
1. 使用 `julianpjlee20@gmail.com` 登入 Google Drive
2. 前往「工程專案管理」→「測試專案」→「task-001」資料夾
3. 應該可以看到剛上傳的照片

---

## ⚠️ 常見問題

### 問題 1：上傳失敗，錯誤訊息「未設定 GOOGLE_SERVICE_ACCOUNT_KEY」
**解決方法**：
1. 確認 `.env` 檔案中有設定 `GOOGLE_SERVICE_ACCOUNT_KEY=./credentials/service-account-key.json`
2. 確認金鑰檔案存在於指定路徑

### 問題 2：上傳失敗，錯誤訊息「找不到 Service Account 金鑰檔案」
**解決方法**：
1. 確認金鑰檔案路徑正確
2. 可使用絕對路徑（例：`/home/ubuntu/.openclaw/workspace/notes/向上建設/工程專案管理系統/src/backend/credentials/service-account-key.json`）

### 問題 3：上傳成功但在 Google Drive 看不到檔案
**解決方法**：
1. 確認已將 Service Account email 加入「工程專案管理」資料夾的共用
2. 確認權限設為「編輯者」
3. 檢查是否共用正確的資料夾（注意大小寫）

### 問題 4：Google Drive API 配額已滿
**解決方法**：
1. 前往 [Google Cloud Console](https://console.cloud.google.com/) → API 和服務 → 配額
2. 查看 Google Drive API 配額使用情況
3. 如需提高配額，可申請提高限制

---

## 🔐 安全性注意事項

1. **不要將金鑰檔案納入版本控制**：`.gitignore` 已包含 `credentials/*.json`
2. **不要公開金鑰檔案**：金鑰檔案等同於帳號密碼
3. **定期輪換金鑰**：建議每 90 天更換一次金鑰
4. **最小權限原則**：Service Account 只需要 Google Drive API 權限

---

## 📚 參考資料

- [Google Drive API 文件](https://developers.google.com/drive/api/v3/about-sdk)
- [Service Account 文件](https://cloud.google.com/iam/docs/service-accounts)
- [Node.js Google APIs Client](https://github.com/googleapis/google-api-nodejs-client)

---

**最後更新**：2026-02-14  
**版本**：1.0.0
