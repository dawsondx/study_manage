## 项目现状与问题摘要
- 前端：React 18 + react-router-dom 7 + Zustand（持久化）、Vite + Tailwind；API 通过 `fetch` 封装，存在硬编码后端地址与密钥。
  - 硬编码后端：`src/lib/api.ts:1-3`，`API_BASE`/`API_KEY` 固定为公网地址与密钥；页面还直接显示后端地址 `src/pages/Backend.tsx:2,45`。
  - 前端密钥泄露：`CODE_FLYING` 以明文 header 发送 `src/lib/api.ts:29-33`；同时在 `aipexbase.config.js:3-6` 暴露 `apiKey`。
  - 认证判定分散：路由与组件多处直接读 `localStorage`，与 store 重叠（`src/App.tsx:15-18`、`src/components/Layout.tsx:27,45-49`），store 持久化又 `skipHydration`（`src/stores/authStore.ts:22-31,76-79`）。
  - 路由未设置 404/错误边界；`sonner` Toaster 已挂载但未统一使用（`src/App.tsx:2,35`）。
- 后端：Spring Boot（`aipexbase/backend`）已实现登录、OAuth2、版本等；MCP（工具/Prompt）已集成，可用于自动化建表与扩展服务。
  - 已有接口：`/login/passwd`、`/login/register`、`/getUserInfo`（`aipexbase/backend/.../LoginController.java:64,76,127`）。
  - 期望接口（前端调用）：`/resources`、`/progress`、`/payments` 尚未显式实现，建议基于动态数据服务补齐。

## 优化目标
- 安全：移除前端硬编码密钥与后端地址，统一使用环境变量与服务端保密；只在服务端校验密钥。
- 一致性：统一使用 `aipexbase-js` 作为前端 API 客户端，减少重复封装与错误处理分散。
- 交互体验：集中认证状态管理、完善路由保护与错误显示、增加 404 与懒加载。
- 后端能力：通过 MCP 工具快速设计并创建业务表结构，补齐资源/进度/支付接口。

## 前端改造
1. API 客户端统一
   - 使用 `aipexbase-js` 替换 `src/lib/api.ts` 的 `fetch` 封装；`baseUrl` 从 `VITE_AIPEX_API` 读取（`.env.development:2-3`）。
   - 删除明文 `API_KEY` 与 `CODE_FLYING` 头（改由后端校验）；保留 `Authorization: Bearer <token>` 与 `APP_ID`。
2. 认证与路由
   - `Protected` 与 `Layout` 统一依赖 `useAuthStore` 的 `token/user`，移除多处 `localStorage` 直读；加入首屏“鉴权加载中”占位，或启用持久化自动 hydration。
   - 新增 404 路由与错误边界；主要页面使用 `React.lazy + Suspense` 代码分割。
3. 错误处理与提示
   - 在 store 与页面的 API 失败路径统一触发 `toast`（sonner），保留细化文案（网络异常、未授权、业务失败）。
4. 后端地址与状态
   - `Backend` 页面读取 `VITE_AIPEX_API`，不显示硬编码地址；展示连接状态与版本信息（`/admin/version` 已有）。

## 后端改造（MCP aipexbase）
1. 业务表设计（初版）
   - `resources`：`id`、`title`、`type`、`url`、`tags`、`created_by`、`created_at`、`updated_at`。
   - `progress_records`：`id`、`user_id`、`resource_id`、`session_start`、`session_end`、`duration_sec`、`status`。
   - `payments`：`id`、`user_id`、`amount`、`currency`、`method`、`status`、`order_id`、`created_at`。
   - 通过 MCP 工具 `execute_sql` 创建上述表（JSON DDL 格式），并用 `list_tables` 校验。
2. 接口补齐（与前端对齐）
   - `GET /resources`、`POST /resources`、`PUT /resources/{id}`、`DELETE /resources/{id}`。
   - `GET /progress`、`POST /progress/session/start|pause|resume|end`（或统一 `POST /progress` 带 `action`）。
   - `GET /payments`、`POST /payments`；联动资源的新增/更新以生成/调整支付记录。
   - 实现建议：复用动态数据服务（`UnifiedDataController` 或自建 `*Controller`），并使用 `GlobalAppIdFilter` 读取 `APP_ID` 作为多租户隔离键。
3. 安全与校验
   - 在服务端校验密钥与权限（如需要 `CODE_FLYING`）并从前端移除；统一返回 `BaseResponse<T>`。
   - 保持现有 `401` 流程（`src/lib/api.ts:36-41` 的客户端处理将由新客户端接管）。

## 数据一致性与迁移
- 在 `authStore.login` 成功后批量拉取资源/进度/支付（现有逻辑已实现，`src/stores/authStore.ts:33-41`），对接新端点即可。
- `APP_ID`：从 `localStorage` 或环境变量读取（`src/lib/api.ts:10-12`）；建议在“设置”页允许配置写入。

## 验证与测试
- 开发环境：`VITE_USE_MOCK_API=false` 下联通真实后端；登录、资源 CRUD、进度会话、支付记录完整走查。
- 自动化：为 API 层增加最小单元测试（登录成功/401、CRUD 成功/失败），并在 UI 级添加“登录后首次渲染”与“错误提示”快照测试。

## 交付项
- 前端：统一 API 客户端、认证与路由改造、错误处理提升、移除硬编码密钥与地址。
- 后端：通过 MCP 创建表结构、补齐资源/进度/支付接口、服务端密钥校验与多租户隔离。

## 下一步（获得确认后执行）
1. 使用 MCP `list_tables` 检视现有结构，若缺失则调用 `execute_sql` 创建上面三张表。
2. 在后端新增对应 Controller 方法并接入动态服务。
3. 前端替换为 `aipexbase-js` 客户端、启用环境变量地址、统一认证与错误提示。
4. 验证全链路并提交变更说明与测试结果。