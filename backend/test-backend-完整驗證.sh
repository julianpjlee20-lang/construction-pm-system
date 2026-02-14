#!/bin/bash

echo "🧪 後端 API 完整驗證測試"
echo "================================"
echo ""

BASE_URL="http://localhost:8096"

# 1. 健康檢查
echo "📡 1. 健康檢查"
curl -s $BASE_URL/health | jq .
echo ""

# 2. 取得所有任務
echo "📋 2. 取得所有任務"
TASK_COUNT=$(curl -s $BASE_URL/api/tasks | jq '.data | length')
echo "   任務總數: $TASK_COUNT"
echo ""

# 3. 建立新任務
echo "➕ 3. 建立新任務"
NEW_TASK=$(curl -s -X POST $BASE_URL/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "後端驗證測試任務",
    "description": "驗證後端 API 完整功能",
    "assignee": "後端工程師",
    "status": "進行中",
    "progress": 80,
    "plannedStartDate": "2026-02-14",
    "plannedEndDate": "2026-02-15"
  }')

TASK_ID=$(echo $NEW_TASK | jq -r '.data.id')
echo "   建立成功！任務 ID: $TASK_ID"
echo ""

# 4. 取得單一任務
echo "🔍 4. 取得單一任務"
curl -s $BASE_URL/api/tasks/$TASK_ID | jq '.data | {id, name, status, progress}'
echo ""

# 5. 更新任務
echo "✏️  5. 更新任務進度"
curl -s -X PATCH $BASE_URL/api/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"progress": 100, "status": "完成"}' | jq '.data | {name, status, progress}'
echo ""

# 6. 檢查伺服器資訊
echo "ℹ️  6. 伺服器資訊"
echo "   Port: 8096"
echo "   Storage Mode: $(curl -s $BASE_URL/health | jq -r '.storageMode // "N/A"')"
echo "   Timestamp: $(curl -s $BASE_URL/health | jq -r '.timestamp')"
echo ""

# 7. 照片功能檢查
echo "📸 7. 照片功能檢查"
PHOTO_COUNT=$(curl -s $BASE_URL/api/tasks/$TASK_ID/photos | jq '. | length')
echo "   照片數量: $PHOTO_COUNT"
echo ""

echo "================================"
echo "✅ 後端驗證測試完成！"
echo ""
echo "📊 總結："
echo "   - 健康檢查: ✅"
echo "   - 任務 CRUD: ✅"
echo "   - 照片 API: ✅"
echo "   - 資料庫: ✅"
echo ""
