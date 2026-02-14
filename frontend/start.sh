#!/bin/bash

# 工程專案管理系統 - 快速啟動腳本

echo "🚀 啟動工程專案管理系統前端..."
echo ""

# 檢查 node_modules 是否存在
if [ ! -d "node_modules" ]; then
    echo "📦 首次執行，正在安裝依賴..."
    npm install
    echo ""
fi

echo "✅ 啟動開發伺服器（port 3000）..."
echo "📖 瀏覽器開啟：http://localhost:3000"
echo ""
echo "💡 提示："
echo "   - Kanban 看板：拖拉卡片切換狀態"
echo "   - 甘特圖：點擊任務查看詳情"
echo "   - 任務詳情：上傳施工照片"
echo ""
echo "按 Ctrl+C 停止伺服器"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

npm run dev
