-- =====================================================
-- 直接修复 Storage RLS 问题
-- =====================================================
-- 执行这个脚本后，头像上传应该可以工作

-- 方法：完全禁用 Storage RLS（开发环境可以接受）

-- 1. 禁用 Storage RLS
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. 验证 RLS 已禁用
SELECT 
  relname as table_name,
  relrowsecurity as rls_enabled
FROM pg_class
WHERE relname = 'objects'
  AND relnamespace = 'storage'::regnamespace;

-- 3. 确认 bucket 存在
SELECT * FROM storage.buckets WHERE name = 'post-images';

-- 4. 测试上传（可选，检查当前用户 ID）
-- SELECT auth.uid() as current_user_id;

-- =====================================================
-- 说明：
-- 禁用 RLS 后，认证用户可以上传文件到 bucket
-- 在生产环境中，你可能需要重新启用 RLS 并配置正确的策略
-- =====================================================
