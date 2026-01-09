-- =====================================================
-- 最终统一修复脚本 - 头像上传问题
-- =====================================================
-- 执行此脚本即可修复所有 RLS 和权限问题
-- 在 Supabase SQL Editor 中完整执行

-- =====================================================
-- 第一部分：修复 Profiles 表
-- =====================================================

-- 1.1 确保所有用户都有 profile
DO $$
DECLARE
  user_record RECORD;
BEGIN
  FOR user_record IN
    SELECT au.id, au.email
    FROM auth.users au
    LEFT JOIN public.profiles p ON au.id = p.id
    WHERE p.id IS NULL
  LOOP
    INSERT INTO public.profiles (id, student_id, nickname)
    VALUES (
      user_record.id,
      'STU' || extract(year from now())::text || LPAD(extract(epoch from now())::text, 10, '0'),
      split_part(user_record.email, '@', 1)
    );
    RAISE NOTICE 'Created profile for: %', user_record.email;
  END LOOP;
END $$;

-- 1.2 重建 Profiles RLS 策略
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- =====================================================
-- 第二部分：修复 Storage
-- =====================================================

-- 2.1 确保存储桶存在并配置正确
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880;

-- 2.2 重建 Storage RLS 策略
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete access" ON storage.objects;

ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can upload to post-images"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'post-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE
  WITH CHECK (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (bucket_id = 'post-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Public can view post-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

-- =====================================================
-- 第三部分：验证修复结果
-- =====================================================

-- 3.1 显示 Profiles 策略
SELECT '=== PROFILES RLS POLICIES ===' as section;
SELECT 
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check as check_clause
FROM pg_policies
WHERE tablename = 'profiles';

-- 3.2 显示 Storage 策略
SELECT '=== STORAGE RLS POLICIES ===' as section;
SELECT 
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check as check_clause
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 3.3 检查用户和 profile 的匹配情况
SELECT '=== USERS & PROFILES MATCH ===' as section;
SELECT 
  au.id as user_id,
  au.email,
  p.id as profile_id,
  p.nickname,
  CASE WHEN p.id IS NULL THEN 'MISSING' ELSE 'OK' END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY au.created_at DESC
LIMIT 5;

-- 3.4 检查 Storage bucket
SELECT '=== STORAGE BUCKETS ===' as section;
SELECT * FROM storage.buckets;

-- =====================================================
-- 完成！
-- =====================================================
-- 执行完成后，请刷新浏览器并重试上传头像
-- 如仍有问题，请查看浏览器控制台（F12）的日志输出
