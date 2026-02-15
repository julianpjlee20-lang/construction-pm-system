#!/bin/bash

# 工程專案管理系統 - 完整 API 測試腳本
# 用途：驗收測試所有 API endpoints

set -e

BASE_URL="http://localhost:8096"
BOLD="\033[1m"
GREEN="\033[0;32m"
YELLOW="\033[1;33m"
RED="\033[0;31m"
NC="\033[0m"  # No Color

echo ""
echo -e "${BOLD}=========================================${NC}"
echo -e "${BOLD}  工程專案管理系統 - API 完整測試${NC}"
echo -e "${BOLD}=========================================${NC}"
echo ""

# 計數器
PASS=0
FAIL=0

# 測試函數
test_api() {
  local name=$1
  local command=$2
  local expected=$3
  
  echo -e "${BOLD}測試：${name}${NC}"
  
  result=$(eval $command)
  
  if [[ "$result" == *"$expected"* ]]; then
    echo -e "  ${GREEN}✓ 通過${NC}"
    ((PASS++))
  else
    echo -e "  ${RED}✗ 失敗${NC}"
    echo "  預期包含：$expected"
    echo "  實際結果：$result"
    ((FAIL++))
  fi
  echo ""
}

# ==================== 基礎測試 ====================

echo -e "${YELLOW}━━━ 基礎功能 ━━━${NC}"
echo ""

test_api "1. 伺服器健康檢查" \
  "curl -s $BASE_URL/health" \
  '"status"'

test_api "2. 列出所有任務" \
  "curl -s $BASE_URL/api/tasks | jq -r '.success'" \
  "true"

# ==================== Task CRUD ====================

echo -e "${YELLOW}━━━ Task CRUD 操作 ━━━${NC}"
echo ""

# 建立測試任務
echo -e "${BOLD}3. 建立新任務${NC}"
CREATE_RESPONSE=$(curl -s -X POST $BASE_URL/api/tasks \
  -H "Content-Type: application/json" \
  -d '{
    "name": "API測試任務-'$(date +%s)'",
    "description": "自動化測試",
    "assignee": "測試工程師",
    "status": "todo",
    "plannedStartDate": "2026-02-15",
    "plannedEndDate": "2026-02-20",
    "progress": 0
  }')

TASK_ID=$(echo $CREATE_RESPONSE | jq -r '.data.id')

if [[ "$TASK_ID" != "null" && "$TASK_ID" != "" ]]; then
  echo -e "  ${GREEN}✓ 通過${NC} - 任務 ID: $TASK_ID"
  ((PASS++))
else
  echo -e "  ${RED}✗ 失敗${NC} - 無法取得任務 ID"
  echo "  回應：$CREATE_RESPONSE"
  ((FAIL++))
fi
echo ""

# 取得單一任務
test_api "4. 取得單一任務 (GET /api/tasks/:id)" \
  "curl -s $BASE_URL/api/tasks/$TASK_ID | jq -r '.data.id'" \
  "$TASK_ID"

# 更新任務
echo -e "${BOLD}5. 更新任務 (PATCH /api/tasks/:id)${NC}"
UPDATE_RESPONSE=$(curl -s -X PATCH $BASE_URL/api/tasks/$TASK_ID \
  -H "Content-Type: application/json" \
  -d '{"progress": 50, "status": "in-progress"}')

UPDATED_PROGRESS=$(echo $UPDATE_RESPONSE | jq -r '.data.progress')

if [[ "$UPDATED_PROGRESS" == "50" ]]; then
  echo -e "  ${GREEN}✓ 通過${NC} - 進度已更新為 50%"
  ((PASS++))
else
  echo -e "  ${RED}✗ 失敗${NC} - 進度更新失敗"
  echo "  回應：$UPDATE_RESPONSE"
  ((FAIL++))
fi
echo ""

# ==================== Photo Upload ====================

echo -e "${YELLOW}━━━ 照片上傳功能 ━━━${NC}"
echo ""

# 建立測試圖片（1x1 PNG）
TEST_IMAGE="/tmp/test-api-photo.jpg"
echo "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==" | base64 -d > $TEST_IMAGE

echo -e "${BOLD}6. 上傳照片 (POST /api/tasks/:id/photos)${NC}"
PHOTO_RESPONSE=$(curl -s -X POST $BASE_URL/api/tasks/$TASK_ID/photos \
  -F "photo=@$TEST_IMAGE" \
  -F "description=API測試照片" \
  -F "uploaded_by=測試系統")

PHOTO_ID=$(echo $PHOTO_RESPONSE | jq -r '.data.photoId')

if [[ "$PHOTO_ID" != "null" && "$PHOTO_ID" != "" ]]; then
  echo -e "  ${GREEN}✓ 通過${NC} - 照片 ID: $PHOTO_ID"
  ((PASS++))
else
  echo -e "  ${RED}✗ 失敗${NC} - 照片上傳失敗"
  echo "  回應：$PHOTO_RESPONSE"
  ((FAIL++))
fi
echo ""

# 取得照片列表
test_api "7. 取得照片列表 (GET /api/tasks/:id/photos)" \
  "curl -s $BASE_URL/api/tasks/$TASK_ID/photos | jq -r '.success'" \
  "true"

# ==================== 清理測試資料 ====================

echo -e "${YELLOW}━━━ 清理測試資料 ━━━${NC}"
echo ""

echo -e "${BOLD}8. 刪除測試任務 (DELETE /api/tasks/:id)${NC}"
DELETE_RESPONSE=$(curl -s -X DELETE $BASE_URL/api/tasks/$TASK_ID)

if [[ "$DELETE_RESPONSE" == *"success"* ]]; then
  echo -e "  ${GREEN}✓ 通過${NC} - 任務已刪除"
  ((PASS++))
else
  echo -e "  ${RED}✗ 失敗${NC} - 刪除失敗"
  echo "  回應：$DELETE_RESPONSE"
  ((FAIL++))
fi
echo ""

# 清理測試檔案
rm -f $TEST_IMAGE

# ==================== 測試總結 ====================

echo ""
echo -e "${BOLD}=========================================${NC}"
echo -e "${BOLD}  測試總結${NC}"
echo -e "${BOLD}=========================================${NC}"
echo ""

TOTAL=$((PASS + FAIL))
echo -e "總測試數：${BOLD}$TOTAL${NC}"
echo -e "通過：${GREEN}${BOLD}$PASS${NC}"
echo -e "失敗：${RED}${BOLD}$FAIL${NC}"
echo ""

if [[ $FAIL -eq 0 ]]; then
  echo -e "${GREEN}${BOLD}🎉 所有測試通過！${NC}"
  echo ""
  echo "✅ 後端 API 功能正常"
  echo "✅ Task CRUD 操作正常"
  echo "✅ 照片上傳功能正常"
  echo ""
  exit 0
else
  echo -e "${RED}${BOLD}⚠️  有測試失敗，請檢查錯誤訊息${NC}"
  echo ""
  exit 1
fi
