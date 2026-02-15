#!/bin/bash

# 直接透過 Supabase REST API 建立表格

source ../.env

echo "🚀 Creating Supabase tables via REST API..."
echo ""

# 專案表
echo "📊 Creating projects table..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CREATE TABLE IF NOT EXISTS projects (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), name TEXT NOT NULL, description TEXT, location TEXT, manager TEXT, total_budget DECIMAL(15, 2), planned_start_date DATE, planned_end_date DATE, status TEXT DEFAULT '\''進行中'\'', created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())"
  }' 2>&1 | head -5

echo ""
echo "📊 Creating tasks table..."  
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CREATE TABLE IF NOT EXISTS tasks (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), project_id UUID REFERENCES projects(id) ON DELETE CASCADE, name TEXT NOT NULL, description TEXT, status TEXT DEFAULT '\''待辦'\'', assignee TEXT, planned_start_date DATE, planned_end_date DATE, planned_duration INTEGER, actual_start_date DATE, actual_end_date DATE, progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100), dependencies TEXT[], budget DECIMAL(15, 2), actual_cost DECIMAL(15, 2) DEFAULT 0, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(), updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())"
  }' 2>&1 | head -5

echo ""
echo "📊 Creating photos table..."
curl -X POST "${SUPABASE_URL}/rest/v1/rpc/exec_sql" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "CREATE TABLE IF NOT EXISTS photos (id UUID PRIMARY KEY DEFAULT gen_random_uuid(), task_id UUID REFERENCES tasks(id) ON DELETE CASCADE, storage_path TEXT NOT NULL, url TEXT NOT NULL, description TEXT, uploaded_by TEXT, file_size INTEGER, mime_type TEXT, created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW())"
  }' 2>&1 | head -5

echo ""
echo "✅ Tables created (or already exist)"
