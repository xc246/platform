# 部署指南

本文档提供校园寻物招领平台的详细部署指南。

## 部署前准备

### 1. 环境变量配置

确保你已经准备好以下环境变量：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

获取方式：
1. 访问 [https://supabase.com](https://supabase.com)
2. 进入你的项目
3. 前往 Settings > API
4. 复制 Project URL 和 anon public key

### 2. 数据库配置

确保 Supabase 数据库已配置：
- ✅ profiles 表（用户资料）
- ✅ posts 表（帖子）
- ✅ comments 表（评论）
- ✅ notifications 表（消息通知）
- ✅ Storage bucket（post-images）
- ✅ RLS 策略已启用
- ✅ Realtime 已启用

## 部署方式

### 方式 1: Vercel（推荐）

Vercel 是 Next.js 的官方部署平台，提供最佳性能。

#### 步骤：

1. **将代码推送到 GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/your-username/campus-lost-found.git
   git push -u origin main
   ```

2. **在 Vercel 导入项目**
   - 访问 [https://vercel.com](https://vercel.com)
   - 点击 "Add New Project"
   - 导入你的 GitHub 仓库
   - 框架会自动检测为 Next.js

3. **配置环境变量**
   在 Vercel 项目设置中添加：
   - `NEXT_PUBLIC_SUPABASE_URL`: 你的 Supabase 项目 URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: 你的 Supabase anon key

4. **部署**
   - 点击 "Deploy"
   - 等待部署完成（通常 2-3 分钟）
   - 获得部署 URL

5. **配置自定义域名（可选）**
   - 在 Vercel 项目设置中添加自定义域名
   - 按照提示配置 DNS

### 方式 2: Netlify

#### 步骤：

1. **将代码推送到 GitHub**

2. **在 Netlify 导入项目**
   - 访问 [https://netlify.com](https://netlify.com)
   - 点击 "Add new site" > "Import an existing project"
   - 连接 GitHub 仓库

3. **配置构建设置**
   - Build command: `npm run build`
   - Publish directory: `.next`

4. **配置环境变量**
   - 在 Site settings > Environment variables 中添加：
     - `NEXT_PUBLIC_SUPABASE_URL`
     - `NEXT_PUBLIC_SUPABASE_ANON_KEY`

5. **部署**

### 方式 3: 服务器部署

如果你想在自己的服务器上部署：

#### 前置要求
- Node.js 18.x 或更高版本
- npm 或 yarn
- PM2（进程管理器）

#### 步骤：

1. **克隆代码到服务器**
   ```bash
   git clone https://github.com/your-username/campus-lost-found.git
   cd campus-lost-found
   ```

2. **安装依赖**
   ```bash
   npm install
   ```

3. **配置环境变量**
   ```bash
   cp .env.production.example .env.production
   nano .env.production
   ```
   填入你的环境变量

4. **构建项目**
   ```bash
   npm run build
   ```

5. **使用 PM2 运行**
   ```bash
   npm install -g pm2
   pm2 start npm --name "campus-lost-found" -- start
   pm2 save
   pm2 startup
   ```

6. **配置 Nginx（反向代理）**
   ```nginx
   server {
       listen 80;
       server_name your-domain.com;

       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

7. **配置 SSL（使用 Let's Encrypt）**
   ```bash
   sudo apt-get install certbot python3-certbot-nginx
   sudo certbot --nginx -d your-domain.com
   ```

### 方式 4: Docker 部署

#### 步骤：

1. **创建 Dockerfile**
   ```dockerfile
   FROM node:18-alpine AS base

   # Install dependencies only when needed
   FROM base AS deps
   RUN apk add --no-cache libc6-compat
   WORKDIR /app

   COPY package.json package-lock.json* ./
   RUN npm ci

   # Rebuild the source code only when needed
   FROM base AS builder
   WORKDIR /app
   COPY --from=deps /app/node_modules ./node_modules
   COPY . .

   RUN npm run build

   # Production image, copy all the files and run next
   FROM base AS runner
   WORKDIR /app

   ENV NODE_ENV production

   RUN addgroup --system --gid 1001 nodejs
   RUN adduser --system --uid 1001 nextjs

   COPY --from=builder /app/public ./public
   COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
   COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

   USER nextjs

   EXPOSE 3000

   ENV PORT 3000

   CMD ["node", "server.js"]
   ```

2. **构建 Docker 镜像**
   ```bash
   docker build -t campus-lost-found .
   ```

3. **运行容器**
   ```bash
   docker run -p 3000:3000 \
     -e NEXT_PUBLIC_SUPABASE_URL=your-url \
     -e NEXT_PUBLIC_SUPABASE_ANON_KEY=your-key \
     campus-lost-found
   ```

4. **使用 Docker Compose（推荐）**
   ```yaml
   version: '3.8'
   services:
     app:
       build: .
       ports:
         - "3000:3000"
       environment:
         - NEXT_PUBLIC_SUPABASE_URL=${NEXT_PUBLIC_SUPABASE_URL}
         - NEXT_PUBLIC_SUPABASE_ANON_KEY=${NEXT_PUBLIC_SUPABASE_ANON_KEY}
       restart: unless-stopped
   ```

## 部署后检查

部署完成后，检查以下内容：

### 1. 功能测试
- ✅ 注册/登录功能
- ✅ 发布帖子功能
- ✅ 上传图片功能
- ✅ 评论功能
- ✅ 搜索筛选功能
- ✅ 消息通知功能

### 2. 性能测试
- 使用 [Lighthouse](https://developers.google.com/web/tools/lighthouse) 测试性能
- 目标分数：Performance > 90, Accessibility > 90

### 3. 安全检查
- ✅ HTTPS 已启用
- ✅ 环境变量安全
- ✅ RLS 策略正确配置
- ✅ 无敏感信息泄露

### 4. 监控和日志

#### Vercel Analytics
- 在 Vercel 项目设置中启用 Analytics
- 查看用户访问数据和性能指标

#### Supabase Logs
- 在 Supabase Dashboard 中查看数据库日志
- 监控 API 调用和错误

## 常见问题

### Q: 部署后图片无法显示？
A: 检查 `next.config.ts` 中的 `remotePatterns` 是否正确配置了 Supabase 域名。

### Q: 如何更新部署？
A: 推送代码到 GitHub 后，Vercel 会自动触发重新部署。

### Q: 如何配置自定义域名？
A: 在部署平台的域名设置中添加自定义域名，并按照提示配置 DNS。

### Q: 部署后如何设置环境变量？
A: 在部署平台的设置中添加环境变量，然后重新部署。

### Q: 如何回滚到之前的版本？
A: Vercel 支持一键回滚，在 Deployments 页面选择之前的版本即可。

## 性能优化建议

1. **启用 CDN**
   - Vercel 自动提供 CDN
   - 其他平台可使用 Cloudflare

2. **图片优化**
   - 已在 `next.config.ts` 中配置图片优化
   - 使用 WebP 格式

3. **代码分割**
   - Next.js 自动进行代码分割
   - 动态导入大型组件

4. **缓存策略**
   - 静态资源缓存
   - API 响应缓存

5. **数据库优化**
   - 添加必要的索引
   - 优化查询语句

## 安全建议

1. **定期更新依赖**
   ```bash
   npm update
   npm audit
   npm audit fix
   ```

2. **启用 CORS**
   - 在 Supabase 中配置允许的域名

3. **限制文件上传**
   - 已限制图片大小（5MB）
   - 验证文件类型

4. **监控异常**
   - 使用 Sentry 或类似工具监控错误
   - 设置告警

## 维护和备份

1. **数据库备份**
   - Supabase 自动备份（保留 7 天）
   - 可配置手动备份

2. **定期检查**
   - 每周检查日志
   - 监控性能指标

3. **用户反馈**
   - 收集用户反馈
   - 及时修复问题

## 联系支持

如遇到部署问题，可以：
- 查看 [Vercel 文档](https://vercel.com/docs)
- 查看 [Supabase 文档](https://supabase.com/docs)
- 提交 Issue 到项目仓库
