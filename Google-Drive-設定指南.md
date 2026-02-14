# Google Drive API 設定指南

**目的**：讓系統自動上傳施工照片到 Google Drive  
**帳號**：julianpjlee20@gmail.com

---

## 🔐 方法一：Service Account（推薦）

### 步驟 1：建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊「建立專案」
3. 專案名稱：`工程專案管理系統`
4. 點擊「建立」

### 步驟 2：啟用 Google Drive API

1. 在專案中，前往「API 和服務」→「程式庫」
2. 搜尋「Google Drive API」
3. 點擊「啟用」

### 步驟 3：建立 Service Account

1. 前往「API 和服務」→「憑證」
2. 點擊「建立憑證」→「服務帳戶」
3. 服務帳戶名稱：`工程專案管理-上傳服務`
4. 點擊「建立並繼續」
5. 角色：選擇「編輯者」
6. 點擊「完成」

### 步驟 4：下載金鑰

1. 點擊剛建立的服務帳戶
2. 前往「金鑰」分頁
3. 點擊「新增金鑰」→「JSON」
4. 下載 JSON 檔案
5. 重新命名為 `credentials.json`
6. 放到 `backend/credentials.json`

### 步驟 5：分享 Google Drive 資料夾

1. 登入 julianpjlee20@gmail.com 的 Google Drive
2. 建立資料夾「工程專案管理」
3. 右鍵 → 共用
4. 輸入 Service Account email（在 credentials.json 中的 `client_email`）
5. 權限：編輯者
6. 點擊「共用」

---

## 🔑 方法二：OAuth2（備案）

如果 Service Account 有問題，可用 OAuth2：

### 步驟 1-2：同上

### 步驟 3：建立 OAuth 2.0 用戶端 ID

1. 前往「API 和服務」→「憑證」
2. 點擊「建立憑證」→「OAuth 用戶端 ID」
3. 應用程式類型：網頁應用程式
4. 名稱：`工程專案管理系統`
5. 已授權的重新導向 URI：`http://localhost:8096/oauth/callback`
6. 點擊「建立」
7. 下載 JSON 檔案，放到 `backend/oauth-credentials.json`

### 步驟 4：首次授權

1. 執行後端 `npm run auth`（需後端工程師實作）
2. 瀏覽器會開啟授權頁面
3. 使用 julianpjlee20@gmail.com 登入
4. 同意授權
5. 系統會產生 `token.json`（不要提交到 Git）

---

## 🧪 測試上傳

### 使用 curl 測試

```bash
curl -X POST http://localhost:8096/api/photos \
  -F "taskId=task-001" \
  -F "description=測試照片" \
  -F "file=@test-image.jpg"
```

**預期回應**：
```json
{
  "photoId": "photo-001",
  "gdriveUrl": "https://drive.google.com/file/d/...",
  "gdriveFileId": "1a2b3c4d5e...",
  "timestamp": "2026-02-15T03:30:00+08:00"
}
```

### 驗證照片

1. 登入 Google Drive
2. 前往「工程專案管理」資料夾
3. 應該看到資料夾結構：
   ```
   工程專案管理/
   └── task-001/
       └── photo-001-2026-02-15T03-30-00.jpg
   ```

---

## ⚠️ 注意事項

1. **不要提交 credentials.json 到 Git**（加入 `.gitignore`）
2. **Service Account email** 類似：`xxx@xxx.iam.gserviceaccount.com`
3. **配額限制**：免費版 15GB 儲存空間
4. **照片壓縮**：系統會自動壓縮至 2MB 以下
5. **照片不可刪除**：API 只開放上傳權限

---

## 🚨 故障排除

### 錯誤：403 Forbidden
→ Service Account 沒有存取資料夾的權限  
→ 重新檢查步驟 5（分享資料夾）

### 錯誤：401 Unauthorized
→ credentials.json 錯誤或過期  
→ 重新下載金鑰

### 錯誤：找不到資料夾
→ 資料夾名稱錯誤或沒分享給 Service Account  
→ 檢查資料夾名稱是否為「工程專案管理」

---

## 📚 參考資料

- [Google Drive API 文件](https://developers.google.com/drive/api/v3/about-sdk)
- [Service Account 說明](https://cloud.google.com/iam/docs/service-accounts)
- [Node.js 範例](https://developers.google.com/drive/api/v3/quickstart/nodejs)

---

**最後更新**：2026-02-15
