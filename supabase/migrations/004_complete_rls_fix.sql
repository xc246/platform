-- 完整修复 Profiles 表 RLS 策略
-- 请在 Supabase Dashboard 的 SQL Editor 中执行此文件

-- 步骤 1: 禁用 profiles 表的 RLS（临时）
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;

-- 步骤 2: 删除所有现有策略
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 步骤 3: 重新启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 步骤 4: 重新创建所有策略（使用完全正确的语法）
-- 允许所有人读取 profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON profiles FOR SELECT
  USING (true);

-- 允许用户插入自己的 profile（通过触发器自动创建）
CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 允许用户更新自己的 profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- 步骤 5: 验证策略
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

-- 步骤 6: 测试查询（应该返回当前用户的 profile）
SELECT * FROM profiles WHERE id = auth.uid();
