-- 修复 profiles 表的 RLS 策略，添加 WITH CHECK 子句

-- 删除旧的 UPDATE 策略
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

-- 重新创建 UPDATE 策略，同时指定 USING 和 WITH CHECK
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
