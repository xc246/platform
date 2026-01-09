-- =====================================================
-- 终极修复：完全禁用 Storage RLS 以便开发测试
-- =====================================================
-- 在 Supabase SQL Editor 中执行此脚本

-- 说明：这将完全禁用 Storage objects 表的 RLS
-- 允许任何认证用户上传/更新/删除文件
-- 如果是生产环境，请在部署前重新启用 RLS

-- =====================================================
-- 步骤 1：完全禁用 Storage RLS
-- =====================================================

ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 验证 RLS 已禁用
SELECT '=== Storage RLS Status ===' as info;
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'objects'
  AND relnamespace = 'storage'::regnamespace;

-- =====================================================
-- 步骤 2：确保 bucket 存在
-- =====================================================

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

-- 显示所有 bucket
SELECT '=== Storage Buckets ===' as info;
SELECT * FROM storage.buckets;

-- =====================================================
-- 步骤 3：删除所有 Storage 策略（如果还存在）
-- =====================================================

DROP POLICY IF EXISTS "Users can upload to post-images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;
DROP POLICY IF EXISTS "Public can view post-images" ON storage.objects;

-- 验证策略已删除
SELECT '=== Storage Policies After Cleanup ===' as info;
SELECT 
  policyname,
  cmd as operation
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage';

-- =====================================================
-- 步骤 4：测试查询（验证当前用户）
-- =====================================================

-- 取消注释以测试（需要在前端执行或在查询中使用实际用户 ID）
-- SELECT auth.uid() as current_user_id;

-- =====================================================
-- 完成！
-- =====================================================
-- 执行后：
-- 1. 刷新浏览器页面
-- 2. 进入个人主页
-- 3. 点击"编辑"
-- 4. 选择头像并保存
-- 5. 查看浏览器控制台的详细错误信息
-- =====================================================
