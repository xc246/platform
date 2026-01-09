-- =====================================================
-- 诊断：检查用户认证和 Profile 匹配情况
-- =====================================================

-- 1. 查看当前登录用户（测试用，实际应该在前端查看）
-- SELECT auth.uid();

-- 2. 查看所有用户及其对应的 profile
SELECT 
  au.id as user_id,
  au.email as user_email,
  au.created_at as user_created,
  p.id as profile_id,
  p.student_id,
  p.nickname,
  p.avatar_url,
  CASE 
    WHEN p.id IS NULL THEN 'NO PROFILE'
    ELSE 'OK'
  END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 10;

-- 3. 查看最近的 profile 更新记录
SELECT * FROM public.profiles ORDER BY updated_at DESC NULLS LAST LIMIT 5;

-- 4. 检查 profiles 表的 RLS 状态
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'profiles';

-- 5. 查看 profiles 表的所有 RLS 策略
SELECT 
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check as check_clause
FROM pg_policies
WHERE tablename = 'profiles';
