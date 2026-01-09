-- =====================================================
-- 修复头像上传：简化 Storage RLS 策略
-- =====================================================
-- 问题：当前的上传策略条件过于严格，导致无法上传头像
-- 解决：删除现有上传策略，创建更宽松的策略

-- 1. 删除现有的 "Authenticated Users Can Upload" 策略
-- 注意：这个策略名称可能需要根据实际情况调整
DROP POLICY IF EXISTS "Authenticated Users Can Upload" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to post-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow upload to post-images" ON storage.objects;

-- 2. 创建简化的上传策略
-- 新策略：只检查 bucket 和用户是否已认证
CREATE POLICY "Authenticated Users Can Upload"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'post-images'
    AND auth.role() = 'authenticated'
  );

-- 3. 验证策略已创建
SELECT 
  policyname as policy_name,
  cmd as operation,
  qual as using_clause,
  with_check as check_clause
FROM pg_policies
WHERE tablename = 'objects'
  AND schemaname = 'storage'
  AND cmd = 'INSERT';

-- =====================================================
-- 执行说明：
-- 1. 在 Supabase 控制台的 SQL Editor 中运行此脚本
-- 2. 运行后刷新页面
-- 3. 尝试上传头像
-- =====================================================
