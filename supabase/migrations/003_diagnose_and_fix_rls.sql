-- =====================================================
-- 诊断并修复 Profiles 表的 RLS 问题
-- =====================================================

-- 1. 首先查看当前的所有 RLS 策略
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;

-- 2. 检查 RLS 是否启用
SELECT relname, relrowsecurity
FROM pg_class
WHERE relname = 'profiles';

-- 3. 删除 profiles 表上的所有策略
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 4. 重新创建所有策略，确保使用正确的语法
-- 公开读取策略
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- 插入策略（使用 auth.uid() 和 id）
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 更新策略（同时定义 USING 和 WITH CHECK）
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 5. 确认策略已正确创建
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'profiles'
ORDER BY policyname;
