-- =====================================================
-- 检查和修复 Storage 的 RLS 策略
-- =====================================================

-- 1. 检查 storage.buckets 表
SELECT * FROM storage.buckets WHERE name = 'post-images';

-- 2. 检查 post-images bucket 的 RLS 策略
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd, 
  qual, 
  with_check
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
ORDER BY policyname;

-- 3. 如果 post-images bucket 不存在，创建它
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'post-images',
  'post-images',
  false,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
)
ON CONFLICT (id) DO NOTHING;

-- 4. 删除 objects 表上的旧策略
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete access" ON storage.objects;

-- 5. 创建新的 Storage RLS 策略
-- 允许所有人读取图片
CREATE POLICY "Public read access"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'post-images');

-- 允许认证用户上传图片
CREATE POLICY "Authenticated upload access"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许用户更新自己的图片
CREATE POLICY "Authenticated update access"
  ON storage.objects FOR UPDATE
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许用户删除自己的图片
CREATE POLICY "Authenticated delete access"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'post-images'
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 6. 验证策略已创建
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

-- 7. 确认 RLS 已启用
SELECT 
  relname, 
  relrowsecurity
FROM pg_class
WHERE relname = 'objects'
  AND relnamespace = 'storage'::regnamespace;
