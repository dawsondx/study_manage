## 目标
- 无管理员模式：用户自助注册/登录完整闭环，`APP_ID` 固化后即可使用
- GitHub OAuth 登录与账号绑定：支持使用 GitHub 账号登录并签发本地 JWT
- 资源同步：同步 GitHub 仓库/组织/用户信息，提供定时与手动同步接口与前端展示
- 交付与上线：前后端打包与配置，完整验证与文档

## 当前状态
- 已初始化默认工作空间 `APP_ID=test` 与库 `test` 的 `users/login` 表
- 前端已接入登录与注册表单，后端注册同步写入 `login` 表；`APP_ID` 与 `Authorization` 自动附带

## 待完成任务
### 后端
1. 动态元数据初始化（便于 `/getUserInfo` 返回完整用户数据）
- 在系统元数据中为 `test` 工作空间创建 `users` 表列描述，保证 `LoginBusinessService.getCurrentUser()` 能返回完整记录

2. GitHub OAuth 登录
- 在 `OAuth2LoginController` 增加 `github` provider（`/oauth2/authorize/github`、`/oauth2/callback/github`）
- 读取 `client_id/client_secret` 与回调地址，交换 `access_token`
- 拉取 GitHub `/user` 信息，查找或创建本地用户（`login` 记录+认证表记录），签发 JWT
- 允许从无管理员模式下自动绑定（无需管理员域）

3. 资源同步服务
- 数据表：`github_accounts`（绑定与令牌）、`github_user`、`github_org`、`github_repo`、`sync_log`
- 服务：`GithubSyncService`（用户、组织、仓库）支持增量位点（`ETag`/`updated_at`）
- 调度：Spring Schedule（每日 2 点）与手动触发接口，如 `POST /sync/github/start`、`GET /sync/github/status`

4. 安全与配置
- 最小权限原则：`read:user`, `read:org`；需要私库时用 `repo` Scope
- 敏感配置通过环境变量注入：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`GITHUB_CALLBACK_URL`

### 前端
1. GitHub 登录入口与回调页
- 登录按钮与授权跳转，回调处理保存 token 并拉取用户信息

2. 同步面板与展示页
- 展示仓库列表、组织、上次同步时间；提供“手动同步”按钮，查看同步日志

3. 配置
- `.env` 固化：`VITE_AIPEX_API`、`VITE_APP_ID`、（可选）`VITE_GITHUB_CLIENT_ID` 用于前端授权跳转

### 部署与交付
1. Docker Compose 更新
- 后端：继续使用 `backend-src` 源码容器或构建镜像
- 前端：生产构建并由 Nginx 或静态服务器提供；若镜像源不可用，改用本地构建产物挂载

2. 验证清单
- 用户自助注册/登录：手机号+密码登录成功，`/getUserInfo` 返回完整记录
- GitHub 登录：授权→回调→JWT→用户信息展示
- 同步：手动发起同步成功，仓库/组织列表可见；定时任务正常运行

## 实施步骤（阶段）
### Phase 1：完善无管理员模式（1 天）
- 初始化 `users` 动态元数据（系统表列定义），验证 `/getUserInfo` 返回完整数据
- 固化前端 `.env` 的 `VITE_APP_ID=test`

### Phase 2：GitHub OAuth 登录（2–3 天）
- 后端：`OAuth2LoginController` 接入 GitHub，配置环境变量，签发 JWT 与绑定用户
- 前端：新增 GitHub 登录按钮与回调页，成功后跳转仪表板

### Phase 3：资源同步（3–4 天）
- 数据库表设计与迁移脚本
- 实现 `GithubSyncService` 与接口、定时任务
- 前端同步面板与列表视图

### Phase 4：部署与验证（1 天）
- 生产打包前后端与 Docker Compose
- 回归测试：登录、同步、查询、权限

## 关键接口与代码位置
- 登录（用户）：`/login/passwd`（aipexbase/backend/src/main/java/com/kuafuai/login/controller/LoginController.java:59）
- 用户注册：`/login/register`（aipexbase/backend/src/main/java/com/kuafuai/login/controller/LoginController.java:71）
- 用户信息：`/getUserInfo`（aipexbase/backend/src/main/java/com/kuafuai/login/controller/LoginController.java:94）
- 管理应用（可选）：`/admin/application`（aipexbase/backend/src/main/java/com/kuafuai/manage/controller/ApplicationController.java:52）

## 配置变量
- 后端：`GITHUB_CLIENT_ID`、`GITHUB_CLIENT_SECRET`、`GITHUB_CALLBACK_URL`、`PORT`、`DB_*`
- 前端：`VITE_AIPEX_API`、`VITE_APP_ID`、（可选）`VITE_GITHUB_CLIENT_ID`

## 交付物
- 更新的安装脚本（SQL）与后端代码（OAuth + 同步）
- 前端登录/回调/同步页面
- 部署脚本与 `.env` 示例

请确认以上计划，我将立即开始按阶段实施并交付验证结果。