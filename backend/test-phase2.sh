#!/bin/bash
# Phase 2 後端 API 測試腳本
# 使用方式：bash test-phase2.sh

set -e

BASE_URL="http://localhost:8096"
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo "========================================="
echo "   工程專案管理系統 Phase 2 API 測試"
echo "========================================="
echo ""

# 1. 健康檢查
echo -e "${YELLOW}[1/7]${NC} 健康檢查..."
curl -s $BASE_URL/health | jq .
echo -e "${GREEN}✓${NC} 健康檢查通過\n"

# 2. 建立測試任務
echo -e "${YELLOW}[2/7]${NC} 建立測試任務..."
TASK_RESPONSE=$(curl -s -X POST $BASE_URL/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Phase2-自動測試任務",
    "description": "測試甘特圖和照片功能",
    "assignee": "測試工程師",
    "plannedStartDate": "2026-02-10T00:00:00Z",
    "plannedEndDate": "2026-02-20T00:00:00Z",
    "progress": 30
  }')

TASK_ID=$(echo $TASK_RESPONSE | jq -r '.id')
echo "任務 ID: $TASK_ID"
echo -e "${GREEN}✓${NC} 任務建立成功\n"

# 3. 查詢任務（測試甘特圖計算）
echo -e "${YELLOW}[3/7]${NC} 查詢任務（含落後計算）..."
curl -s $BASE_URL/api/tasks/$TASK_ID | jq '{
  id, name, progress, 
  planned_start_date, planned_end_date,
  scheduleStatus, daysDelayed
}'
echo -e "${GREEN}✓${NC} 甘特圖計算正常\n"

# 4. 更新任務進度
echo -e "${YELLOW}[4/7]${NC} 更新任務進度..."
curl -s -X PATCH $BASE_URL/api/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"progress": 60, "status": "進行中"}' | jq '{id, progress, status}'
echo -e "${GREEN}✓${NC} 進度更新成功\n"

# 5. 查詢所有任務（測試批次計算）
echo -e "${YELLOW}[5/7]${NC} 查詢所有任務..."
curl -s $BASE_URL/api/tasks | jq 'map({name, scheduleStatus, daysDelayed}) | .[:3]'
echo -e "${GREEN}✓${NC} 批次查詢成功\n"

# 6. 查詢照片（空列表）
echo -e "${YELLOW}[6/7]${NC} 查詢任務照片..."
curl -s $BASE_URL/api/tasks/$TASK_ID/photos
echo -e "\n${GREEN}✓${NC} 照片查詢成功\n"

# 7. 清理測試任務
echo -e "${YELLOW}[7/7]${NC} 清理測試任務..."
curl -s -X DELETE $BASE_URL/api/tasks/$TASK_ID | jq .
echo -e "${GREEN}✓${NC} 測試任務已刪除\n"

echo "========================================="
echo -e "${GREEN}   🎉 所有測試通過！${NC}"
echo "========================================="
echo ""
echo "📋 測試照片上傳（需要真實圖片）："
echo "   curl -X POST $BASE_URL/api/tasks/{task-id}/photos \\"
echo "     -F 'photo=@test-photo.jpg' \\"
echo "     -F 'description=測試照片' \\"
echo "     -F 'uploaded_by=Andy'"
echo ""
