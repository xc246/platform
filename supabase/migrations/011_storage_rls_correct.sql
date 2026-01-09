-- =====================================================
-- 生产环境修复：Storage RLS 策略（正确版本）
-- =====================================================
-- 如果需要在生产环境中启用 RLS，使用此脚本

-- 1. 确保存在
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
  file_size_limit = 5242880,
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

-- 2. 删除所有旧策略
DROP POLICY IF EXISTS "Users can upload to post-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view post-images" ON storage.objects;

-- 3. 启用 RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. 创建正确的策略（使用 WITH CHECK）

-- 上传策略：允许认证用户上传
CREATE POLICY "Users can upload to post-images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
  );

-- 更新策略：允许用户更新自己的文件
CREATE POLICY "Users can update their own files"
  ON storage.objects FOR UPDATE
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
  );

-- 删除策略：允许用户删除自己的文件
CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
    AND auth.role() = 'authenticated'
  );

-- 读取策略：允许所有人读取
CREATE POLICY "Public can view post-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

-- 5. 验证策略
SELECT '=== Storage RLS Policies ===' as section;
SELECT 
  policyname,
  cmd as operation,
  qual as using_clause,
  with_check as check_clause
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage';

-- 6. 验证 RLS 状态
SELECT '=== RLS Status ===' as section;
SELECT 
  relname,
  relrowsecurity
FROM pg_class
WHERE relname = 'objects'
  AND relnamespace = 'storage'::regnamespace;

-- =====================================================
-- 完成
-- 执行后刷新页面并测试
-- =====================================================
