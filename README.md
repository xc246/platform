# 校园寻物招领平台

基于 Next.js 16 + React 19 + TypeScript + Tailwind CSS + shadcn/ui + Supabase 构建的大学生寻物招领平台。

## 技术栈

- **前端框架**: Next.js 16.1.1 (App Router)
- **UI 组件**: React 19.2.3 + shadcn/ui
- **样式**: Tailwind CSS v4
- **语言**: TypeScript 5
- **图标**: Lucide React
- **后端服务**: Supabase (PostgreSQL + Auth + Storage + Realtime)

## 功能特性

### 核心功能
- ✅ 邮箱注册/登录
- ✅ 失物/招领发布（支持图片上传）
- ✅ 多维度搜索筛选（关键词、类别、地点）
- ✅ Tab 切换（全部/失物/招领）
- ✅ 帖子详情页
- ✅ 匿名评论功能
- ✅ 实时消息提醒（Supabase Realtime）
- ✅ 消息中心（未读红点提示）

### 安全特性
- ✅ Supabase Auth 身份认证
- ✅ Row Level Security (RLS) 数据隔离
- ✅ 匿名评论保护隐私

## 项目结构

```
campus-lost-found/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # 认证相关页面
│   │   ├── login/                 # 登录页
│   │   └── register/              # 注册页
│   ├── post/                      # 帖子相关页面
│   │   └── [id]/                 # 帖子详情页
│   ├── publish/                   # 发布页
│   ├── messages/                  # 消息中心
│   ├── layout.tsx                 # 根布局
│   ├── page.tsx                   # 首页
│   └── globals.css                # 全局样式
├── components/                   # React 组件
│   ├── ui/                       # shadcn/ui 基础组件
│   └── Navbar.tsx                # 导航栏组件
├── hooks/                       # 自定义 Hooks
│   ├── useAuth.ts                # 认证 Hook
│   ├── usePosts.ts               # 帖子 Hook
│   ├── useComments.ts            # 评论 Hook
│   └── useMessages.ts           # 消息 Hook
├── lib/                         # 工具库
│   ├── supabase.ts              # Supabase 客户端
│   ├── utils.ts                 # 工具函数
│   └── constants.ts             # 常量定义
├── types/                       # TypeScript 类型
│   └── index.ts                 # 数据库类型定义
├── supabase/                    # Supabase 配置
│   └── migrations/              # 数据库迁移文件
├── .env.local                   # 环境变量（本地）
├── .env.example                # 环境变量示例
└── package.json                # 项目配置
```

## 环境变量配置

在项目根目录创建 `.env.local` 文件：

```env
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

获取 Supabase 凭证：
1. 访问 [https://supabase.com](https://supabase.com)
2. 创建新项目
3. 进入 Project Settings > API
4. 复制 Project URL 和 anon public key

## 数据库配置

### 自动执行

项目已经通过 Supabase API 执行了数据库迁移，包含：
- ✅ profiles 表（用户资料）
- ✅ posts 表（帖子）
- ✅ comments 表（评论）
- ✅ notifications 表（消息通知）
- ✅ RLS 策略（行级安全）
- ✅ 触发器（自动通知）
- ✅ Storage bucket（图片存储）

### 手动执行（可选）

如需手动配置，运行以下 SQL：

```sql
-- 创建表、RLS 策略、触发器等
-- 见 supabase/migrations/001_initial_schema.sql

-- 创建 Storage bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('post-images', 'post-images', true, 5242880,
        ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']);
```

## 本地开发

### 安装依赖

```bash
npm install
```

### 启动开发服务器

```bash
npm run dev
```

访问 [http://localhost:3000](http://localhost:3000)

### 构建生产版本

```bash
npm run build
npm start
```

## 功能使用指南

### 1. 用户注册
1. 访问 `/register`
2. 填写邮箱、密码
3. 选择学院、输入昵称
4. 提交注册

### 2. 发布信息
1. 登录后点击「发布」按钮
2. 选择「失物登记」或「招领登记」
3. 填写物品信息（名称、类别、地点、日期）
4. 可选上传图片（最多5张，每张不超过5MB）
5. 提交发布

### 3. 搜索筛选
1. 在首页搜索框输入关键词
2. 选择物品类别、地点进行筛选
3. Tab 切换查看失物/招领
4. 点击卡片查看详情

### 4. 评论互动
1. 进入帖子详情页
2. 登录后可发表评论
3. 选择「匿名评论」保护隐私
4. 发帖者会收到实时通知

### 5. 消息中心
1. 点击导航栏铃铛图标
2. 查看未读消息
3. 点击「全部已读」标记所有消息
4. 点击消息跳转到对应帖子

## 技术亮点

### 1. 实时通信
- 使用 Supabase Realtime 实现实时消息推送
- 评论发布后立即通知帖子作者
- 未读消息红点实时更新

### 2. 数据安全
- Row Level Security 确保用户只能访问自己的数据
- 匿名评论功能保护用户隐私

### 3. 图片存储
- Supabase Storage 存储用户上传的图片
- 公开访问配置，无需额外鉴权
- 文件大小限制（5MB）防止滥用

### 4. 响应式设计
- Tailwind CSS 实现移动端优先设计
- shadcn/ui 提供美观的组件库
- 渐变色和卡片式布局提升视觉体验

## 常见问题

### Q: 为什么启动失败？
A: 确保：
1. 已运行 `npm install`
2. `.env.local` 文件已正确配置
3. Supabase 项目已创建并启用所需功能

### Q: 如何添加更多物品类别？
A: 在 `lib/constants.ts` 中的 `ITEM_CATEGORIES` 数组添加新类别。

### Q: 如何部署到生产环境？
A: 推荐 Vercel：
1. 将项目推送到 GitHub
2. 在 Vercel 导入仓库
3. 配置环境变量
4. 自动部署

## 许可证

MIT License

## 联系方式

如有问题或建议，欢迎提交 Issue。
