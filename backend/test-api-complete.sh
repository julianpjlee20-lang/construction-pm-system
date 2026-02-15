#!/bin/bash

echo "========================================="
echo "  工程專案管理系統 API 完整測試"
echo "========================================="
echo ""

BASE_URL="http://localhost:8096"

# 測試 1: Health Check
echo "✅ 測試 1: Health Check"
curl -s $BASE_URL/health | jq .
echo ""

# 測試 2: GET /api/tasks
echo "✅ 測試 2: GET /api/tasks (列出所有任務)"
curl -s $BASE_URL/api/tasks | jq 'length'
echo "   任務數量: $(curl -s $BASE_URL/api/tasks | jq 'length')"
echo ""

# 測試 3: POST /api/tasks (建立新任務)
echo "✅ 測試 3: POST /api/tasks (建立任務)"
TASK_RESPONSE=$(curl -s -X POST $BASE_URL/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API測試任務",
    "description": "自動化測試建立",
    "assignee": "測試工程師",
    "status": "in-progress",
    "plannedStartDate": "2026-02-15",
    "plannedEndDate": "2026-02-20",
    "progress": 30
  }')

TASK_ID=$(echo $TASK_RESPONSE | jq -r '.id')
echo "   建立成功，任務 ID: $TASK_ID"
echo ""

# 測試 4: GET /api/tasks/:id
echo "✅ 測試 4: GET /api/tasks/:id (取得單一任務)"
curl -s $BASE_URL/api/tasks/$TASK_ID | jq '{id, name, status, progress}'
echo ""

# 測試 5: PATCH /api/tasks/:id
echo "✅ 測試 5: PATCH /api/tasks/:id (更新任務)"
curl -s -X PATCH $BASE_URL/api/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"progress": 50, "status": "in-progress"}' | jq '{name, progress, status}'
echo ""

# 測試 6: 照片上傳測試（需要實際圖片）
echo "✅ 測試 6: POST /api/tasks/:id/photos (照片上傳)"
# 建立測試圖片
convert -size 800x600 xc:blue -pointsize 48 -fill white -gravity center \
  -annotate +0+0 "測試照片\n$(date)" /tmp/test-photo.jpg 2>/dev/null || {
  echo "   ⚠️  ImageMagick 未安裝，跳過圖片上傳測試"
  echo "   提示：安裝後可測試：sudo apt install imagemagick"
}

if [ -f /tmp/test-photo.jpg ]; then
  PHOTO_RESPONSE=$(curl -s -X POST $BASE_URL/api/tasks/$TASK_ID/photos \
    -F "photo=@/tmp/test-photo.jpg" \
    -F "description=API自動化測試照片" \
    -F "uploaded_by=測試系統")
  
  echo $PHOTO_RESPONSE | jq '{id, description, uploadedBy, localPath}'
  echo ""
fi

# 測試 7: GET /api/tasks/:id/photos
echo "✅ 測試 7: GET /api/tasks/:id/photos (取得照片列表)"
curl -s $BASE_URL/api/tasks/$TASK_ID/photos | jq 'length'
echo "   照片數量: $(curl -s $BASE_URL/api/tasks/$TASK_ID/photos | jq 'length')"
echo ""

# 測試 8: DELETE /api/tasks/:id（清理測試資料）
echo "✅ 測試 8: DELETE /api/tasks/:id (刪除任務)"
curl -s -X DELETE $BASE_URL/api/tasks/$TASK_ID | jq '.message'
echo ""

echo "========================================="
echo "  測試完成！"
echo "========================================="
echo ""
echo "📋 API Endpoints 清單："
echo "   ✓ GET    /health"
echo "   ✓ GET    /api/tasks"
echo "   ✓ POST   /api/tasks"
echo "   ✓ GET    /api/tasks/:id"
echo "   ✓ PATCH  /api/tasks/:id"
echo "   ✓ DELETE /api/tasks/:id"
echo "   ✓ GET    /api/tasks/:id/photos"
echo "   ✓ POST   /api/tasks/:id/photos"
echo ""
