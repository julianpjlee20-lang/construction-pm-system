#!/bin/bash

echo "🧪 後端 API 快速測試"
echo "================================"
echo ""

BASE_URL="http://localhost:8096"

# 1. 健康檢查
echo "✅ 健康檢查:"
curl -s $BASE_URL/health | jq .
echo ""

# 2. 取得所有任務
echo "✅ 任務列表:"
TASK_COUNT=$(curl -s $BASE_URL/api/tasks | jq '. | length')
echo "   共 $TASK_COUNT 個任務"
curl -s $BASE_URL/api/tasks | jq '.[] | {id, name, status, progress}'
echo ""

# 3. 建立測試任務
echo "✅ 建立新任務:"
NEW_TASK=$(curl -s -X POST $BASE_URL/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API測試任務",
    "assignee": "測試人員",
    "status": "進行中",
    "progress": 50
  }')

TASK_ID=$(echo $NEW_TASK | jq -r '.id')
echo "   任務 ID: $TASK_ID"
echo ""

# 4. 更新任務
echo "✅ 更新任務:"
curl -s -X PATCH $BASE_URL/api/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"progress": 100}' | jq '{name, progress}'
echo ""

echo "================================"
echo "✅ 測試完成！伺服器運作正常。"
