// 直接測試 Supabase 連接
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://igwafmmxfkaorzfimyum.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2FmbW14Zmthb3J6ZmlteXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTg2MzIsImV4cCI6MjA4NjY5NDYzMn0.p0R2kO5I9kEL7QBS-rQwgMeG_w-2IqlqcbJnB0vgoW4'
);

console.log('🧪 Testing Supabase Connection...\n');

async function test() {
  // Test 1: Fetch all tasks
  console.log('📋 Test 1: Fetching tasks...');
  const { data: tasks, error: tasksError } = await supabase
    .from('tasks')
    .select('*')
    .order('id');

  if (tasksError) {
    console.log('❌ Error:', tasksError.message);
    console.log('Details:', JSON.stringify(tasksError, null, 2));
    return;
  }

  console.log(`✅ Found ${tasks.length} tasks:`);
  tasks.forEach(t => {
    console.log(`   - ${t.name} (${t.status}, ${t.progress}%)`);
  });
  console.log('');

  // Test 2: Update a task
  if (tasks.length > 0) {
    console.log('📝 Test 2: Updating task progress...');
    const { data, error } = await supabase
      .from('tasks')
      .update({ progress: 65 })
      .eq('id', tasks[0].id)
      .select()
      .single();

    if (error) {
      console.log('❌ Error:', error.message);
    } else {
      console.log('✅ Updated:', data.name, '->', data.progress + '%');
    }
  }
  console.log('');

  // Test 3: Check schema
  console.log('🔍 Test 3: Checking available columns...');
  const { data: sample } = await supabase
    .from('tasks')
    .select('*')
    .limit(1)
    .single();

  if (sample) {
    console.log('Available columns:', Object.keys(sample).join(', '));
  }
}

test().catch(err => {
  console.error('💥 Test failed:', err);
});
