-- 检查并创建缺失的 profile 记录
-- 如果用户登录后无法更新 profile，可能是因为 profiles 表中缺少记录

-- 1. 检查是否有用户没有对应的 profile
SELECT 
  au.id as user_id,
  au.email as user_email,
  p.id as profile_id,
  p.student_id,
  p.nickname
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE au.email IS NOT NULL
  AND (p.id IS NULL OR p.id = '');

-- 2. 如果发现缺失的 profile，运行以下脚本创建
-- 替换 'your-email@example.com' 为你的实际邮箱

-- 为缺失的用户创建 profile（如果上面的查询显示有缺失的记录）
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

-- 3. 验证所有用户都有对应的 profile
SELECT 
  au.id as user_id,
  au.email as user_email,
  p.id as profile_id,
  CASE WHEN p.id IS NULL THEN 'MISSING' ELSE 'OK' END as status
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
ORDER BY status DESC;
