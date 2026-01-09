-- =====================================================
-- 完整修复：Profiles 表 RLS + Storage 权限
-- =====================================================
-- 在 Supabase Dashboard 的 SQL Editor 中依次执行以下部分

-- =====================================================
-- 第一部分：修复 Profiles 表 RLS
-- =====================================================

-- 1. 确保用户 profile 存在
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
    RAISE NOTICE 'Created profile for user: %', user_record.email;
  END LOOP;
END $$;

-- 2. 重建 Profiles 表 RLS 策略
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
-- 第二部分：修复 Storage 权限
-- =====================================================

-- 3. 确保 bucket 存在
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  false,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 4. 重建 Storage RLS 策略
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete access" ON storage.objects;

CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

CREATE POLICY "Authenticated upload access"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Authenticated update access"
  ON storage.objects FOR UPDATE
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Authenticated delete access"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =====================================================
-- 第三部分：验证修复
-- =====================================================

-- 5. 验证 Profiles RLS 策略
SELECT 'PROFILES RLS POLICIES:' as section;
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual as "USING", 
  with_check as "WITH CHECK"
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 6. 验证 Storage RLS 策略
SELECT 'STORAGE RLS POLICIES:' as section;
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual as "USING", 
  with_check as "WITH CHECK"
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- 7. 测试当前用户的 profile 访问
SELECT 'CURRENT USER PROFILE:' as section;
SELECT * FROM profiles WHERE id = auth.uid();

-- 8. 测试 Storage bucket
SELECT 'STORAGE BUCKETS:' as section;
SELECT * FROM storage.buckets WHERE name = 'post-images';
