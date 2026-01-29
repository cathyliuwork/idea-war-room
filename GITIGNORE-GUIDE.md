# .gitignore 配置说明

## ✅ 已完成配置

已为 Next.js 项目完善了 `.gitignore` 文件，确保敏感信息和临时文件不会被提交到 Git 仓库。

---

## 📋 被 Git 忽略的文件/目录（不会提交）

### 1. 📦 依赖包
```
node_modules/          # npm/pnpm 依赖
.pnpm-store/          # pnpm 本地缓存
.yarn/                # yarn 相关文件
```

### 2. 🔨 Next.js 构建产物
```
.next/                # Next.js 开发/生产构建
/out/                 # 静态导出目录
/dist/                # 分发目录
/build/               # 生产构建
next-env.d.ts         # Next.js TypeScript 声明
```

### 3. 🧪 测试相关
```
/coverage             # 测试覆盖率报告
/test-results/        # Playwright 测试结果
/playwright-report/   # Playwright HTML 报告
.vitest               # Vitest 缓存
*.lcov                # 覆盖率数据文件
```

### 4. 🔒 **环境变量（重要！）**
```
.env                  # 所有环境变量文件
.env.local            # 本地环境变量（包含 API keys）
.env*.local           # 所有本地环境变量
```

**✅ 保留**: `.env.local.example` (示例文件，会提交到 Git)

### 5. 🗄️ 数据库相关
```
supabase/.temp/       # Supabase 临时文件
supabase/.branches/   # Supabase 分支
*.sql.gz              # 数据库备份
*.dump                # 数据库转储
```

### 6. 🔑 安全敏感文件
```
*.pem                 # SSL 证书
*.key                 # 密钥文件
*.cert                # 证书文件
.npmrc                # npm 配置（可能包含 token）
```

### 7. 💻 操作系统文件
```
.DS_Store             # macOS 目录元数据
Thumbs.db             # Windows 缩略图缓存
*~                    # Linux 备份文件
```

### 8. 🛠️ IDE/编辑器配置
```
.idea/                # JetBrains IDEs
*.iml
.vscode/*             # VSCode（保留推荐配置）
*.code-workspace
*.sublime-workspace   # Sublime Text
```

### 9. 📝 日志文件
```
*.log                 # 所有日志文件
npm-debug.log*
pnpm-debug.log*
yarn-error.log*
```

### 10. ☁️ 部署相关
```
.vercel               # Vercel 部署配置
.vercel.json
```

---

## 📝 会被提交到 Git 的文件（源代码）

### ✅ 应该提交的文件：

```
✓ app/                        # Next.js 页面和 API 路由
✓ src/                        # 源代码（组件、工具库等）
✓ tests/                      # 测试文件
✓ supabase/migrations/        # 数据库迁移 SQL
✓ package.json                # 依赖配置
✓ pnpm-lock.yaml              # 锁定依赖版本
✓ tsconfig.json               # TypeScript 配置
✓ tailwind.config.js          # Tailwind 配置
✓ next.config.js              # Next.js 配置
✓ vitest.config.ts            # Vitest 配置
✓ playwright.config.ts        # Playwright 配置
✓ .eslintrc.json              # ESLint 规则
✓ .prettierrc                 # Prettier 格式化规则
✓ .env.local.example          # 环境变量示例
✓ README.md                   # 项目文档
✓ SETUP.md                    # 设置指南
✓ .gitignore                  # Git 忽略规则
```

### ❌ 不应该提交的文件：

```
✗ .env.local                  # 包含真实 API keys（已忽略）
✗ node_modules/               # 依赖包（已忽略）
✗ .next/                      # 构建产物（已忽略）
✗ *.log                       # 日志文件（已忽略）
```

---

## 🚨 重要提醒

### 永远不要提交这些文件：

1. **`.env.local`** - 包含 Supabase keys 和 AI Builders API key
2. **`node_modules/`** - 巨大的依赖目录（通过 `pnpm install` 安装）
3. **`.next/`** - 构建产物（每次构建会重新生成）
4. **任何包含敏感信息的文件**（密钥、证书、token）

### 如何检查是否配置正确：

```bash
# 查看当前 Git 状态
git status

# 应该看不到这些文件：
# - node_modules/
# - .env.local
# - .next/
# - coverage/
```

---

## 📊 当前 Git 状态

运行 `git status` 后，你应该看到：

**会被提交的新文件**（未跟踪）:
```
app/                  ✓ 源代码
src/                  ✓ 源代码
tests/                ✓ 测试
supabase/migrations/  ✓ 数据库 schema
package.json          ✓ 配置
*.config.{js,ts}      ✓ 配置文件
SETUP.md              ✓ 文档
```

**不会显示**（已被忽略）:
```
node_modules/         ✓ 正确忽略
.env.local            ✓ 正确忽略
.next/                ✓ 正确忽略
```

---

## 🎯 下一步操作

### 提交代码到 Git

```bash
# 1. 查看将要提交的文件
git status

# 2. 添加所有文件
git add .

# 3. 创建初始提交
git commit -m "feat: Complete Phase 0 - Project setup and configuration

- Initialize Next.js 16 with TypeScript and Tailwind CSS 4
- Configure Supabase database schema (6 tables with RLS)
- Set up testing infrastructure (Vitest, Playwright)
- Create complete directory structure
- Configure environment variables (template)
- Add comprehensive .gitignore for Next.js project

Phase 0 complete and ready for F-01 implementation"

# 4. （可选）推送到远程仓库
git push origin main
```

---

## 💡 最佳实践

### 1. 环境变量管理
- ✅ 提交 `.env.local.example`（示例）
- ❌ 不要提交 `.env.local`（真实值）
- 📝 在 README 中说明如何配置环境变量

### 2. 团队协作
- 新成员克隆代码后，需要：
  1. 复制 `.env.local.example` → `.env.local`
  2. 填入自己的 API keys
  3. 运行 `pnpm install`

### 3. 定期清理
```bash
# 清理构建产物
rm -rf .next out

# 清理测试报告
rm -rf coverage test-results playwright-report
```

---

## ✅ 验证清单

- [x] `.gitignore` 文件已更新
- [x] `node_modules/` 被忽略
- [x] `.env.local` 被忽略
- [x] `.next/` 和 `/out/` 被忽略
- [x] 测试相关文件被忽略
- [x] IDE 配置被适当忽略
- [x] `.env.local.example` 会被提交
- [x] 源代码文件会被提交
- [x] 配置文件会被提交

**状态**: ✅ 全部配置正确！

---

## 📚 参考资料

- [Next.js .gitignore 推荐](https://nextjs.org/docs/getting-started/installation)
- [GitHub .gitignore 模板](https://github.com/github/gitignore/blob/main/Node.gitignore)
- [环境变量最佳实践](https://nextjs.org/docs/app/building-your-application/configuring/environment-variables)
