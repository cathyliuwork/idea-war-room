# Idea War Room → 父项目最小迁移执行计划

## 1. 项目概述

### 目标

以“**最小迁移结构、最小修改、功能不动、可流畅跑通**”为原则，将 Idea War Room 迁移到父项目中运行，并在迁移完成后**移除跨域授权路径**（不再依赖跨域 JWT callback + CORS），改为**直接使用父项目同域授权/会话**。

### 范围（最小化）

- 保持业务流程与 API 行为不变：Intake → Research → MVTA → Report。
- 保持 Supabase/Postgres 为业务数据存储（不做数据库迁移）。
- 仅替换“用户身份来源/会话注入方式”，并在最后阶段移除跨域 callback 流程。

### 非目标（本阶段不做）

- 不做业务表结构重构或迁移到父项目 MySQL。
- 不做 UI/交互大改。
- 不重写 LLM/Research 逻辑。

### 关键参考（现有规格）

- 授权与会话：`F-01`（JWT 委派 + cookie session）[F-01-database-auth.md](../features/F-01-database-auth.md)
- 架构与数据流：`S-00` [S-00-architecture.md](https://file:///Users/tylerchao/Sites/idea-war-room/specs/system/S-00-architecture.md)
- 数据库表：`S-03`（user_profiles / sessions / ideas / research_snapshots / damage_reports）[S-03-database-schema.md](https://file:///Users/tylerchao/Sites/idea-war-room/specs/system/S-03-database-schema.md)
- 安全与授权：`S-XX`（service role 绕过 RLS，必须 verifySessionOwnership） [S-XX-security-authorization.md](https://file:///Users/tylerchao/Sites/idea-war-room/specs/system/S-XX-security-authorization.md)
- 当前 callback 实现（含 CORS）： [app/api/auth/callback/route.ts](https://file:///Users/tylerchao/Sites/idea-war-room/app/api/auth/callback/route.ts)

---

## 2. 环境准备

### 2.1 软件与工具

- Node.js（建议与父项目一致）
- pnpm（父项目/本项目均使用 pnpm）
- Supabase CLI（仅当需要执行迁移/本地 DB 操作）
- 父项目开发环境（已可本地启动并登录）

### 2.2 依赖安装（Idea War Room 仓库本地验证用）

```bash
cd idea-war-room
pnpm install
```

### 2.3 环境变量准备（原则）

- **不在文档中复制真实密钥**；统一由团队的密钥管理工具分发。
- 最小迁移阶段仍需要 Supabase 与 AI Builders 的配置（因为业务数据和 AI 调用不变）。

本项目已有示例文件参考：

- `.env.local.example`
- `.env.production`
- `.env.local`（本地）

### 2.4 本地验证命令（可选但推荐）

```bash
pnpm dev
pnpm test
pnpm test:e2e
```

---

## 3. 实施步骤（顺序执行）

> 每一步都包含：操作说明 → 命令/代码片段 → 验证方法 → 成功标准 → 失败处理  
> 建议在父项目中采用单独分支进行迁移：`feature/idea-war-room-minimal-migration`

---

### Step 0：前置条件确认（必须）

#### 操作说明

确认父项目具备“同域会话/授权能力”，且子模块可在父项目内稳定读取当前用户身份。

#### 预期父项目提供能力（满足其一即可）

- NextAuth（或等价）在服务端可通过类似 `getServerSession()` 读取当前用户
- 或父项目已有统一的 Auth middleware / SDK，可在 server components / route handlers 中拿到用户信息

#### 验证方法（父项目侧）

在父项目新增一个仅开发环境可用的“会话自检”页面或接口（示例伪代码，仅用于说明）：

```ts
// 伪代码示例：父项目内的 /api/whoami（仅开发环境）
export async function GET() {
  const user = await getCurrentUserFromParentSession();
  return Response.json({ user });
}
```

#### 成功标准

- 已登录父项目后，请求 `whoami` 能返回稳定的 `userId/email`（最少需要 userId）。

#### 失败处理

- 若父项目无法提供稳定 userId：不能移除 callback/CORS；必须暂时保留 JWT callback 作为登录入口（先完成结构迁移，再逐步替换授权）。

---

### Step 1：建立子模块挂载点（最小结构迁移）

#### 操作说明

将 Idea War Room 以“子模块”的方式挂载进父项目路由空间，优先选择独立前缀，避免冲突。

推荐路径前缀：

- `/idea-war-room/*`（建议）
- 或 `/tools/idea-war-room/*`

#### 相关操作（示例）

- 父项目：新增导航入口，点击进入 `/idea-war-room/dashboard`
- 父项目：配置路由/应用结构，使 Idea War Room 的 Next.js App Router 能在该前缀下运行

#### 验证方法

- 访问 `/idea-war-room/dashboard` 能渲染页面（即便未登录会重定向也可接受）
- 静态资源加载无 404（`/_next/*` 路径需正确）

#### 成功标准

- 子模块页面能在父项目环境启动并可访问，不出现明显路由冲突/白屏

#### 失败处理

- 若路由冲突：优先修改挂载前缀，不要先改子模块内部业务路由

---

### Step 2：替换“用户身份来源”（核心最小改动）

#### 操作说明

把子模块获取当前用户的来源，从“JWT callback + cookie token”切换为“父项目同域 session”。

实现原则：

- 子模块内部只允许一个入口获取用户：`getCurrentUser()`（或等价）
- 子模块所有 API 与页面统一依赖该入口

#### 代码/接口层面的最小改动策略

- 保留子模块 `/api/auth/session`（或等价）语义不变：返回 `{ user }` 或 401
- 但其内部用户来源改为父项目 session

（示意流程，不是要求立即实现）

1) 父项目 session → 得到 parentUserId/email/name  
2) 子模块把 parentUserId 作为 `external_user_id` 使用  
3) 子模块继续使用自身 cookie（可选）或完全依赖父项目 cookie（推荐）

#### 验证方法

- 登录父项目后打开子模块：
  - UI 能显示用户信息（如果原本有显示）
  - 子模块请求自身鉴权 API 能成功返回 user

#### 成功标准

- 不需要经过 `/api/auth/callback?token=...`，子模块依然能识别用户

#### 失败处理

- 如果父项目 session 在子模块 route handler 中拿不到：
  - 先退回到“保留 callback 登录 + 同步注入 session”过渡方案
  - 或在父项目层增加“向下游透传用户上下文”的能力（middleware 注入 header / server helper）

---

### Step 3：保留 `user_profiles`，但改“写入触发点”（保持数据模型不变）

#### 操作说明

仍然使用 Supabase 的 `user_profiles` 做“父用户 → 子系统 user_id（UUID）”映射，不废弃表结构。  
变化仅在“何时 upsert user_profiles”：从 callback 触发改为“首次进入子模块/首次 API 调用”触发。

表结构依据：`user_profiles.external_user_id`（来自父用户 id）  
参考：S-03 数据库结构 [S-03-database-schema.md](https://file:///Users/tylerchao/Sites/idea-war-room/specs/system/S-03-database-schema.md)

#### 验证方法

- 使用一个新父项目账号首次进入子模块后：
  - Supabase `user_profiles` 应新增记录
- 再创建 session：
  - `sessions.user_id` 关联正常，后续 report/research 可写入

#### 成功标准

- 所有写入型业务 API 在新授权方式下仍能成功（尤其是 session 创建与 report 保存）

#### 失败处理

- user_profiles 无法写入会导致后续业务数据无法关联用户：应立即阻断上线，回滚到可写入方案

---

### Step 4：移除跨域 callback + CORS（最后做）

#### 操作说明

在 Step 2/3 完整跑通后，才从主流程移除旧的跨域入口。

需要处理的点：

- 父项目菜单入口不再跳转到 `/api/auth/callback?token=...`
- 子模块不再需要 callback 中的 `Access-Control-Allow-Origin: *` 逻辑
- callback 路由可以保留为“应急 fallback”（不在 UI 暴露入口），或在确认稳定后删除

当前 callback 文件位置：[app/api/auth/callback/route.ts](https://file:///Users/tylerchao/Sites/idea-war-room/app/api/auth/callback/route.ts)

#### 验证方法

- 父项目点击入口 → 直接进入子模块 `/idea-war-room/dashboard`
- 浏览器控制台无 CORS 报错
- 网络面板无对 `/api/auth/callback` 的依赖调用

#### 成功标准

- 同域授权链路完成，callback 不再参与登录流程

#### 失败处理

- 若线上出现“无法识别用户”的问题：
  - 立即把入口切回 callback（保留 fallback 的意义）
  - 通过 feature flag 控制入口路由

---

### Step 5：安全与隔离回归（必须）

#### 操作说明

验证迁移后仍符合 “service role 绕过 RLS → 必须显式授权校验” 的安全约束。

安全规范：[S-XX-security-authorization.md](https://file:///Users/tylerchao/Sites/idea-war-room/specs/system/S-XX-security-authorization.md)

#### 最小必测用例

- 用户 A 创建 session / report
- 用户 B 访问 A 的 `sessionId` 相关 API，必须返回 404（或不暴露资源存在性）

#### 验证方法（手动 + 自动）

- 手动：双账号操作验证隔离
- 自动：补齐/复用 E2E（Playwright）授权隔离用例（若已存在）

#### 成功标准

- 任意跨用户访问被阻断
- 所有 session-scoped API 在访问数据前先做 ownership 校验

#### 失败处理

- 任何一个 API 越权都属于 P0：停止灰度、立即回滚入口或部署版本

---

### Step 6：最小业务链路回归（必须）

#### 操作说明

按固定路径跑通主流程，确保“功能不动”。

#### 回归路径

1) Intake：填写想法 → 保存
2) Research：选择类型 → 执行 → 保存
3) MVTA：执行 → 生成 report
4) Report：展示 → 导出/返回

#### 验证方法

- UI 全流程跑通
- 关键 API 返回 200
- 数据库中对应表有新增记录（sessions / ideas / research_snapshots / damage_reports）

#### 成功标准

- 从父项目入口进入到最终 report 页面全程无阻

#### 失败处理

- 优先检查：用户上下文注入、user_profiles 映射写入、session ownership 校验逻辑

---

## 4. 测试验证

### 4.1 每步完成后的最小验证（建议）

- Step 0：父项目 `whoami` 返回 user
- Step 1：子模块路由可访问
- Step 2：子模块可读 user（无需 callback）
- Step 3：新用户可写入 user_profiles 并创建 session
- Step 4：入口不再依赖 callback/CORS
- Step 5：跨用户隔离通过
- Step 6：业务全流程通过

### 4.2 建议的命令集合（本仓库侧）

```bash
pnpm test
pnpm test:e2e
```

---

## 5. 故障排除

### 5.1 子模块拿不到父项目用户（最常见）

- 现象：一直是未登录态或重定向循环
- 排查：
  - 父项目 session 是否同域可用
  - 子模块 route handler 是否处在同一运行时/同一 cookie 作用域
- 处理：
  - 先启用 callback fallback
  - 或改用父项目 middleware 注入用户上下文到子模块

### 5.2 路由冲突/静态资源 404

- 现象：页面白屏、`/_next/*` 资源 404
- 排查：挂载前缀与重写规则
- 处理：优先调整子模块挂载前缀

### 5.3 跨用户数据泄露风险

- 现象：用户 B 能读取用户 A 的 session/report
- 处理：立即回滚；逐个检查 session-scoped API 是否做 ownership 校验  
  参考：S-XX 安全授权 [S-XX-security-authorization.md](https://file:///Users/tylerchao/Sites/idea-war-room/specs/system/S-XX-security-authorization.md)

### 5.4 CORS 报错（应该在 Step 4 后消失）

- 现象：浏览器控制台出现 CORS blocked
- 处理：确认已移除 callback 依赖，并且父项目入口不再跨域跳转

---

## 6. 后续步骤（完成最小迁移后）

- **做稳定化**：把 callback 彻底移除或保留为仅内部应急开关（明确策略）
- **做统一观测**：在父项目统一接入日志/监控（授权失败率、API 错误率、耗时）
- **评估数据库统一**（可选）：若父项目要求 MySQL 集中存储，再单独立项做“数据迁移与表结构重构”，避免与授权迁移耦合
- **更新 specs**：在 specs/ 中补充“父项目同域授权模式”的系统规格或集成说明（建议在迁移稳定后再做）

## 附录 A：架构对齐（Architecture Alignment）

### A1. 路由与模块边界对齐

- 操作
  - 确认子模块挂载前缀（例如 `/idea-war-room/*`），并冻结为迁移期唯一入口。
  - 明确哪些路由属于父项目、哪些属于子模块；避免同名路由冲突（尤其是 `/dashboard`、`/api/*`）。
- 验证
  - 访问父项目路由不受影响；访问子模块前缀下路由全部可达。
- 成功标准
  - 无路由覆盖/冲突；静态资源 `/_next/*` 正常加载。

### A2. 授权模型对齐

- 操作
  - 冻结“身份来源”唯一入口：父项目 session → 子模块 getCurrentUser（或等价）。
  - 明确是否需要保留 callback 作为 fallback（建议迁移期保留但不暴露入口）。
- 验证
  - 登录父项目后进入子模块，无需 callback 即能识别用户；退出后子模块不可访问。
- 成功标准
  - 子模块所有受保护 API 都能稳定拿到 userId，且无重定向循环。

### A3. 数据边界对齐（最小迁移模式）

- 操作
  - 确认本阶段“不迁移数据库”：业务数据继续存 Supabase；父项目 MySQL 不承载子模块表。
  - 统一用户映射策略：父项目 userId → `user_profiles.external_user_id`（子模块继续维护映射）。
- 验证
  - 新用户首次进入可写入 user_profiles；创建 session/report 成功。
- 成功标准
  - 数据模型不变、功能不变；仅身份来源变化。

---

## 附录 B：依赖整合（Dependency Integration）

### B1. 技术栈版本对齐清单

- 操作
  - 对齐 Node 版本、pnpm 版本、Next.js 版本（以父项目为准）。
  - 对齐 TypeScript 版本、React 版本（避免双份 React）。
- 验证
  - `pnpm install` 无 peer dependency 灾难性冲突；构建无 “Invalid hook call” 等错误。
- 成功标准
  - 依赖安装可重复、锁文件稳定。

### B2. 包管理策略（父项目为单应用）

- 操作
  - 以父项目为“唯一应用根”：合并子模块依赖到父项目根 `package.json`。
  - 以父项目为“唯一锁文件来源”：由父项目根 `pnpm-lock.yaml` 锁定最终版本（迁移期不要同时维护两份锁文件）。
  - 明确合并顺序：先对齐 Next.js/React/TypeScript 版本，再合并其它业务依赖。
- 验证
  - `pnpm install` 不出现不可解的 peer dependency 冲突；本地与 CI 构建一致。
- 成功标准
  - 父项目单仓单应用可以“一键安装 + 一键启动”且稳定复现。

### B3. package.json 合并步骤（可执行清单）

- 操作
  - 基线对齐：以父项目的 `next` / `react` / `react-dom` / `typescript` 版本为准（避免双 React/Hook 错误）。
  - 依赖迁移：把 Idea War Room 的业务依赖（Supabase/LLM/Search/validation 等）合并进父项目 `dependencies`/`devDependencies`。
  - 脚本对齐：将子模块脚本映射到父项目脚本体系中（例如 `dev`/`build`/`lint`/`test`/`test:e2e`），避免同名但行为不同。
- 验证
  - `pnpm -v` 与 CI 版本一致；`pnpm install`、`pnpm dev`、`pnpm build` 能跑通。
- 成功标准
  - 无需进入子目录单独安装；不保留子模块独立 package.json 作为运行入口（可保留仅作参考但不参与构建）。

### B4. 锁文件与依赖冲突处理

- 操作
  - 以父项目根 `pnpm-lock.yaml` 为唯一锁文件；迁移后删除/忽略子模块锁文件（避免依赖漂移）。
  - 处理冲突优先级：运行时依赖冲突（React/Next）> 构建工具冲突（ESLint/Vitest/Playwright）> 其它库。
- 验证
  - 构建产物一致；无运行时 “Invalid hook call” 或 Next 编译期重复依赖错误。
- 成功标准
  - 依赖树可控、可复现。

---

## 附录 C：构建与配置整合（Build & Config）

### C1. 构建链路对齐

- 操作
  - 对齐 lint/test/build 命令入口（以父项目 CI 为准），为子模块增加对应脚本或 pipeline step。
  - 确认子模块运行时（Node/Edge）要求与父项目一致。
- 验证
  - CI 能执行：typecheck → lint → unit → e2e（至少关键路径）。
- 成功标准
  - CI 全绿且具备阻断策略（授权/隔离失败直接阻断）。

### C2. 环境变量与配置清单

- 操作
  - 列出子模块必需 env（仅列 key，不写 value）：
    - Supabase：NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY / SUPABASE_SERVICE_ROLE_KEY
    - AI Builders：AI_BUILDERS_API_KEY / AI_BUILDERS_API_URL（或等价）
    - App URL：NEXT_PUBLIC_APP_URL（如仍需要）
  - 对齐父项目 env 注入方式（本地、预发、生产），并明确“父项目是唯一来源”（不要再维护子模块 `.env.*` 作为部署依据）。
- 验证
  - 缺失任一 key 时能在启动时清晰报错（不要静默失败）。
- 成功标准
  - 本地/预发/生产配置一致，不依赖个人机器状态。

### C3. 关键配置文件合并/对齐清单（单应用必做）

- 操作
  - Next.js：合并/对齐 `next.config.*`（重写、headers、images、transpilePackages 等）。
  - TypeScript：合并 `tsconfig.json`（尤其是 `paths`/`baseUrl`/`moduleResolution`）。
  - 代码风格：合并 `.eslintrc.*` / `.prettierrc*`（以父项目规则为准）。
  - 样式体系：合并 `tailwind.config.*`、`postcss.config.*`、全局样式入口（避免重复注入）。
  - 测试体系：把 Vitest/Playwright 配置并入父项目（统一命令入口与 CI 产物目录）。
- 验证
  - `pnpm lint`、`pnpm test`、`pnpm test:e2e`（若父项目启用）全部可运行。
- 成功标准
  - 配置文件只有一份“最终生效版本”，CI 以父项目配置为准。

---

## 附录 D：代码文件合并与路径调整（Code Merge Plan）

### D1. 目录映射规则（最小修改，单应用合并）

- 操作
  - 选择一个稳定前缀作为子模块根（推荐：`/idea-war-room`），并把页面路由合并到父项目 `app/idea-war-room/**`。
  - 合并 API 路由到父项目 `app/api/idea-war-room/**`（与 D2 保持一致），避免覆盖父项目已有 `/api/*`。
  - 将子模块的 `src/lib/**`、`src/contexts/**`、`src/i18n/**` 按父项目既有结构合并：
    - 优先保持原相对路径（减少 import 修改），必要时在父项目增加一个明确的命名空间目录（例如 `src/idea-war-room/**`）。
  - 统一 TS path alias（例如 `@/`）在父项目内的含义：
    - 若父项目 `@/` 指向 `src/`：则将子模块代码合并到 `src/` 之下，避免双重 alias。
- 验证
  - TypeScript 能解析所有 import；运行时无 module not found。
  - 访问 `/idea-war-room/dashboard` 能渲染，且 API 请求指向 `/api/idea-war-room/...`。
- 成功标准
  - “搬文件 + 调整路径/命名空间”即可跑通；不要求业务逻辑改写。

### D2. API 路由命名空间

- 操作
  - 若父项目已有 `/api/*`，建议子模块 API 加前缀：
    - `/api/idea-war-room/...`
  - 或将子模块 API 保持原样但确保不会覆盖父项目同名 API（风险更高）。
- 验证
  - 父项目 API 不受影响；子模块 API 全部可用。
- 成功标准
  - 无 API 冲突；监控/日志可区分来源。

---

## 附录 E：回滚计划（Rollback）

### E1. 回滚策略（最小迁移推荐）

- 操作
  - 保留旧 JWT callback 作为 fallback（迁移期），入口用 feature flag 控制：
    - flag=on：直接使用父项目 session
    - flag=off：走旧 callback/JWT
  - 灰度发布：先内部用户 → 小流量 → 全量。
- 验证
  - 可在 5 分钟内完成入口切换（不需要重新部署最好）。
- 成功标准
  - 出现授权异常/隔离风险时，能快速切回旧链路止血。

### E2. 回滚触发条件（建议硬阈值）

- 授权失败率（401/重定向循环）超过阈值
- 跨用户隔离测试失败（P0，立即回滚）
- 关键路径（创建 session / 生成 report）失败率超过阈值

---

## 附录 F：测试覆盖（对应迁移工程项）

- 架构/路由：路由冲突扫描 + 关键页面可达性
- 授权：登录/退出/过期/重定向循环
- 隔离：A/B 用户互访 sessionId 必须 404
- 构建：CI 上 typecheck/lint/test 作为合并门禁

---
文档版本：v1（最小迁移执行版）
