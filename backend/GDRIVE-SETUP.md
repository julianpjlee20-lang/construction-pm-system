# Google Drive 整合設定指南

本系統支援將照片上傳到 Google Drive，以下是完整設定步驟。

---

## 📋 前置準備

- Google 帳號：**julianpjlee20@gmail.com**
- Google Cloud Platform (GCP) 存取權限

---

## 🚀 設定步驟

### 步驟 1: 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 登入帳號：julianpjlee20@gmail.com
3. 點擊左上角「選擇專案」→「新增專案」
4. 專案名稱：`工程專案管理系統` (或自訂)
5. 點擊「建立」

### 步驟 2: 啟用 Google Drive API

1. 在專案中，前往「API 和服務」→「已啟用的 API 和服務」
2. 點擊「+ 啟用 API 和服務」
3. 搜尋「Google Drive API」
4. 點擊「啟用」

### 步驟 3: 建立 Service Account

**Service Account** 是推薦的方式（不需要 OAuth2 授權流程）

1. 前往「API 和服務」→「憑證」
2. 點擊「建立憑證」→「服務帳戶」
3. 填寫：
   - 服務帳戶名稱：`construction-pm-backend`
   - 服務帳戶 ID：(自動產生)
   - 描述：`工程專案管理系統後端上傳服務`
4. 點擊「建立並繼續」
5. 角色選擇：
   - 選擇「基本」→「擁有者」（或）
   - 選擇「Google Drive」→「Drive File 管理員」
6. 點擊「完成」

### 步驟 4: 下載憑證 JSON

1. 在「憑證」頁面，找到剛建立的服務帳戶
2. 點擊服務帳戶 Email
3. 切換到「金鑰」分頁
4. 點擊「新增金鑰」→「建立新的金鑰」
5. 金鑰類型選擇「JSON」
6. 點擊「建立」
7. JSON 檔案會自動下載

### 步驟 5: 放置憑證檔案

將下載的 JSON 檔案重新命名為 `google-credentials.json`，並放置在：

```
src/backend/google-credentials.json
```

**⚠️ 安全提醒**：
- 此檔案包含敏感資訊，請勿上傳到 Git
- 已在 `.gitignore` 中排除

### 步驟 6: 測試 Google Drive 整合

1. 啟動伺服器（Google Drive 模式）：
   ```bash
   cd src/backend
   export STORAGE_MODE=gdrive
   npm start
   ```

2. 檢查啟動訊息：
   ```
   ✅ Google Drive API initialized
   🚀 工程專案管理系統後端 API
   📡 Server running on http://localhost:8096
   📦 Storage mode: gdrive
   ```

3. 測試上傳照片：
   ```bash
   curl -X POST http://localhost:8096/api/tasks/task-001/photos \
     -F 'photo=@test-photo.jpg' \
     -F 'description=測試照片' \
     -F 'uploaded_by=Andy'
   ```

4. 檢查 Google Drive：
   - 前往 [Google Drive](https://drive.google.com/)
   - 登入 julianpjlee20@gmail.com
   - 應該會看到「工程專案管理」資料夾
   - 內含「任務名稱」子資料夾和上傳的照片

---

## 🔄 替代方案：OAuth2 (可選)

如果不想使用 Service Account，可以使用 OAuth2：

### 步驟 A: 建立 OAuth2 憑證

1. 前往「API 和服務」→「憑證」
2. 點擊「建立憑證」→「OAuth 用戶端 ID」
3. 應用程式類型：「電腦應用程式」
4. 名稱：`construction-pm-oauth`
5. 點擊「建立」
6. 下載 JSON 憑證

### 步驟 B: 修改程式碼

需要修改 `gdrive.js`，加入 OAuth2 授權流程：

```javascript
const { google } = require('googleapis');
const readline = require('readline');

const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
const TOKEN_PATH = path.join(__dirname, 'token.json');

// ... 實作 OAuth2 授權流程
```

**缺點**：
- 需要手動授權（第一次）
- 需要儲存 refresh token
- 較複雜

**建議**：優先使用 Service Account

---

## 📂 資料夾結構

上傳後的 Google Drive 結構：

```
Google Drive (julianpjlee20@gmail.com)
└── 工程專案管理/                  (自動建立)
    ├── 基地整地/                  (任務名稱)
    │   ├── 2026-02-14_103045_整地完成.jpg
    │   └── 2026-02-15_140230_驗收照片.jpg
    ├── 基礎開挖/
    │   └── 2026-02-20_091520_開挖進度.jpg
    └── ...
```

---

## 🔐 權限設定

預設設定：**公開讀取** (anyone with link)

如果要改為限制存取，修改 `gdrive.js`：

```javascript
// 移除或註解掉這段
await drive.permissions.create({
  fileId: file.data.id,
  requestBody: {
    role: 'reader',
    type: 'anyone'  // ← 改為 'user' 並指定 emailAddress
  }
});
```

改為特定使用者：

```javascript
await drive.permissions.create({
  fileId: file.data.id,
  requestBody: {
    role: 'writer',
    type: 'user',
    emailAddress: 'user@example.com'
  }
});
```

---

## 🐛 疑難排解

### 錯誤 1: "Google Drive 未初始化"

**原因**：憑證檔案不存在或格式錯誤

**解決**：
1. 確認 `google-credentials.json` 存在
2. 檢查 JSON 格式是否正確
3. 確認服務帳戶已啟用 Drive API

### 錯誤 2: "權限不足"

**原因**：服務帳戶沒有 Drive 權限

**解決**：
1. 前往 GCP Console
2. 檢查服務帳戶角色
3. 新增「Drive File 管理員」角色

### 錯誤 3: "配額超過"

**原因**：Google Drive API 有每日請求限制

**解決**：
1. 前往「API 和服務」→「配額」
2. 查看 Drive API 用量
3. 如需提高配額，申請增加

### 錯誤 4: "檔案上傳失敗"

**可能原因**：
- 網路問題
- 檔案過大
- API 回應逾時

**除錯步驟**：
1. 檢查伺服器 log
2. 確認網路連線
3. 測試小檔案上傳
4. 增加 timeout 設定

---

## 💡 最佳實踐

### 1. 使用環境變數

```bash
# .env 檔案
STORAGE_MODE=gdrive
GOOGLE_CREDENTIALS_PATH=/path/to/credentials.json
```

### 2. 設定錯誤通知

當上傳失敗時，發送通知給管理員

### 3. 定期備份

雖然 Google Drive 很可靠，仍建議定期備份重要照片到其他位置

### 4. 監控配額

定期檢查 API 用量，避免突然達到配額上限

---

## 📊 成本估算

**Google Drive API** 免費配額：
- 每天 1,000,000,000 queries
- 儲存空間：依 Google Drive 帳戶容量

對於一般工程專案，免費配額應該足夠。

如果需要更大容量：
- Google One 100GB: NT$65/月
- Google One 200GB: NT$90/月

---

## 📝 參考資源

- [Google Drive API 文件](https://developers.google.com/drive/api/guides/about-sdk)
- [Service Account 認證](https://cloud.google.com/iam/docs/service-accounts)
- [googleapis npm 套件](https://www.npmjs.com/package/googleapis)

---

## ✅ 檢查清單

完成以下步驟確保設定正確：

- [ ] 建立 Google Cloud 專案
- [ ] 啟用 Google Drive API
- [ ] 建立 Service Account
- [ ] 下載並放置 `google-credentials.json`
- [ ] 測試上傳功能
- [ ] 確認 Google Drive 有收到檔案
- [ ] 檢查權限設定是否符合需求

---

**如有問題，請聯繫技術團隊**

最後更新：2026-02-14
