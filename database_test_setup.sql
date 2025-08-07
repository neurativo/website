-- =====================================================
-- DATABASE TEST SETUP
-- Simple test to verify everything works
-- =====================================================

-- Test 1: Check if tables exist
SELECT 
  table_name,
  CASE WHEN table_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('users', 'user_profiles', 'user_game_stats', 'subscription_plans');

-- Test 2: Check if trigger exists
SELECT 
  trigger_name,
  CASE WHEN trigger_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.triggers 
WHERE trigger_schema = 'auth' 
  AND trigger_name = 'handle_new_user_trigger';

-- Test 3: Check if function exists
SELECT 
  routine_name,
  CASE WHEN routine_name IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'handle_new_user';

-- Test 4: Check subscription plans
SELECT id, name, daily_quizzes, ai_generations FROM subscription_plans;

-- Test 5: Check RLS policies
SELECT 
  schemaname,
  tablename,
  policyname,
  CASE WHEN policyname IS NOT NULL THEN '✅ EXISTS' ELSE '❌ MISSING' END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('users', 'user_profiles', 'user_game_stats');

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database test completed! Check the results above.';
END $$; 