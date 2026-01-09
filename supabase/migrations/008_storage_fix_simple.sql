-- =====================================================
-- 简化版本：修复 Storage bucket 和权限
-- =====================================================

-- 步骤 1: 禁用 Storage RLS（临时，方便调试）
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 步骤 2: 确保存儲桶存在
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES (
  'post-images',
  'post-images',
  false,
  5242880
)
ON CONFLICT (id) DO UPDATE SET
  public = false,
  file_size_limit = 5242880;

-- 步骤 3: 删除旧策略
DROP POLICY IF EXISTS "Public read access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated upload access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated update access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated delete access" ON storage.objects;

-- 步骤 4: 重新启用 RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 步骤 5: 创建简化的策略（允许认证用户所有操作）
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

-- 步骤 6: 验证
SELECT '=== Storage RLS Policies ===' as info;
SELECT policyname, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'objects' AND schemaname = 'storage';

SELECT '=== Storage Buckets ===' as info;
SELECT * FROM storage.buckets WHERE name = 'post-images';
