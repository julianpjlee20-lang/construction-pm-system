#!/bin/bash

# 工程專案管理系統 API 測試腳本
# 使用方法：./test-api.sh

BASE_URL="http://localhost:8096"

echo "========================================="
echo "工程專案管理系統 API 測試"
echo "========================================="
echo ""

# 檢查伺服器是否啟動
echo "1️⃣  檢查伺服器健康狀態..."
curl -s "$BASE_URL/health" | jq '.'
echo ""

# 建立測試任務
echo "2️⃣  建立測試任務..."
TASK_ID=$(curl -s -X POST "$BASE_URL/api/tasks" \
  -H "Content-Type: application/json" \
  -d '{
    "name": "鋼筋綁紮",
    "description": "一樓鋼筋綁紮",
    "assignee": "張師傅",
    "status": "待辦",
    "plannedStartDate": "2026-02-10",
    "plannedEndDate": "2026-02-20",
    "progress": 0
  }' | jq -r '.id')

echo "✅ 任務已建立：$TASK_ID"
echo ""

# 取得所有任務
echo "3️⃣  取得所有任務..."
curl -s "$BASE_URL/api/tasks" | jq '.'
echo ""

# 更新任務進度
echo "4️⃣  更新任務進度..."
curl -s -X PUT "$BASE_URL/api/tasks/$TASK_ID" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "進行中",
    "progress": 60,
    "actualStartDate": "2026-02-11"
  }' | jq '.'
echo ""

# 取得單一任務
echo "5️⃣  取得單一任務..."
curl -s "$BASE_URL/api/tasks/$TASK_ID" | jq '.'
echo ""

# 取得任務照片清單（應該是空的）
echo "6️⃣  取得任務照片清單..."
curl -s "$BASE_URL/api/tasks/$TASK_ID/photos" | jq '.'
echo ""

echo "========================================="
echo "✅ 基本 API 測試完成！"
echo ""
echo "📝 任務 ID: $TASK_ID"
echo ""
echo "🧪 如要測試照片上傳，請執行："
echo "curl -X POST -F \"photo=@photo.jpg\" -F \"description=測試照片\" -F \"uploadedBy=測試\" $BASE_URL/api/tasks/$TASK_ID/photos"
echo ""
echo "⚠️  照片上傳需要先設定 Google Drive（詳見 README.md）"
echo "========================================="
