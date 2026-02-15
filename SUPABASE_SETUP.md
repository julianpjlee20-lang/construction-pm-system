# Supabase 設定指南

## 步驟 1：建立 Supabase 專案

1. 前往 https://supabase.com
2. 用 Google/GitHub 登入
3. 點擊 **New Project**
4. 填寫資訊：
   - **Name**: `construction-pm` 或 `工程專案管理`
   - **Database Password**: 設定一個強密碼（記下來）
   - **Region**: 選擇 `Singapore (ap-southeast-1)` （離台灣最近）
   - **Pricing Plan**: Free
5. 點擊 **Create new project**（需等待 1-2 分鐘）

---

## 步驟 2：執行資料庫 Migration

專案建立完成後：

1. 前往專案的 **SQL Editor** 頁面
2. 點擊 **New query**
3. 複製 `supabase/migrations/20260215_initial_schema.sql` 的內容
4. 貼上並點擊 **Run**
5. 確認顯示 "Success. No rows returned"

---

## 步驟 3：取得 API Keys

1. 前往 **Project Settings** → **API**
2. 複製以下資訊：
   - **Project URL**: `https://xxx.supabase.co`
   - **anon/public key**: `eyJhb...`
   - **service_role key**: `eyJhb...`（⚠️ 私密金鑰，不要外洩）

---

## 步驟 4：設定環境變數

在後端資料夾建立 `.env` 檔案：

```bash
cd backend
cp .env.supabase.example .env
nano .env
```

填入你的資訊：

```env
SUPABASE_URL=https://your-project-id.supabase.co
SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_KEY=your-service-role-key-here
SUPABASE_STORAGE_BUCKET=construction-photos
PORT=8096
NODE_ENV=development
```

---

## 步驟 5：安裝依賴並啟動

```bash
# 在 backend 資料夾
npm install

# 啟動後端（會自動建立 Storage bucket）
npm start
```

你應該看到：

```
✅ Supabase connection successful!
✅ Storage bucket already exists: construction-photos
✅ Server is running!
📍 URL: http://localhost:8096
```

---

## 步驟 6：更新前端配置

在 `frontend/.env` 設定：

```env
VITE_API_URL=http://localhost:8096/api
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

---

## 步驟 7：測試

1. **測試 API**：
   ```bash
   curl http://localhost:8096/health
   # 應該回傳: {"status":"ok",...}
   
   curl http://localhost:8096/api/tasks
   # 應該回傳 3 筆測試任務
   ```

2. **測試照片上傳**：
   - 啟動前端：`cd frontend && npm run dev`
   - 開啟 http://localhost:5173
   - 建立任務並上傳照片

---

## 驗證 Supabase Dashboard

前往 Supabase Dashboard：

1. **Table Editor** → 檢查 `tasks`, `photos` 表格
2. **Storage** → 檢查 `construction-photos` bucket
3. **Authentication** → （暫時未啟用，Phase 2 再加）

---

## 下一步：部署到 Vercel

當本地測試成功後，可以部署後端：

```bash
# 在專案根目錄
git add .
git commit -m "升級到 Supabase"
git push

# 部署到 Vercel
vercel --prod
```

在 Vercel Dashboard 設定環境變數（與 `.env` 相同）。

---

## 常見問題

### Q: "Failed to connect to Supabase"
A: 檢查 `.env` 的 `SUPABASE_URL` 和 `SUPABASE_SERVICE_KEY` 是否正確

### Q: "Permission denied for storage bucket"
A: 在 Supabase Dashboard → Storage → 設定 bucket 為 `public`

### Q: 照片上傳失敗
A: 檢查 Storage bucket 的 `allowedMimeTypes` 設定

---

需要協助？檢查：
- Supabase Dashboard 的 Logs
- 後端 console 輸出
- 瀏覽器開發者工具的 Network tab
