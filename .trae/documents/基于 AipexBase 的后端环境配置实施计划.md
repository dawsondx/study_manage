## 目标
- 在本地 Windows 环境完成 AipexBase 后端服务搭建与可用性验证
- 启动管理后台前端，联通后端接口
- 保持与官方许可一致（不做多租户，保留前端 LOGO 与版权）

## 前置条件
- 安装 `Java 1.8+`、`Node.js 18+`、`MySQL 8.0+`、`Git`、`Maven`
- 可选：安装 `Docker Desktop` 与 `Docker Compose`
- 预留端口：后端 `8080`，前端 `5173/5174`

## 安装方式 A：源码安装
1. 克隆项目
   - `git clone https://gitee.com/kuafuai/aipexbase.git`
   - `cd aipexbase`
2. 初始化数据库
   - 创建数据库：`aipexbase`
   - 导入项目内 SQL 脚本（位于项目提供的安装脚本目录），确保基础表与数据就绪
3. 配置后端数据库连接
   - 进入：`backend/src/main/resources`
   - 编辑：`application-mysql.yml`
   - 参考配置：
     ```yaml
     server:
       port: 8080
     spring:
       datasource:
         url: jdbc:mysql://localhost:3306/aipexbase?useSSL=false&serverTimezone=Asia/Shanghai&characterEncoding=utf8
         username: root
         password: <你的密码>
         driver-class-name: com.mysql.cj.jdbc.Driver
     ```
4. 启动后端服务
   - 在 `backend` 目录执行：`mvn spring-boot:run`
   - 成功后服务地址：`http://localhost:8080`
5. 验证后端
   - 访问接口健康检查（如提供）：`http://localhost:8080/actuator/health`
   - 确认数据库连接正常、日志无报错
6. 启动管理后台前端（可选）
   - `cd frontend`
   - `npm install`
   - `npm run dev`
   - 访问：`http://localhost:5173`

## 安装方式 B：Docker Compose（推荐）
1. 准备 Docker 环境
   - 确保已安装并启动 Docker Desktop
2. 使用项目内的 Compose 编排文件
   - 在项目根目录执行：`docker compose up -d`
   - 若需自定义数据库账号与端口，在 Compose 文件或 `.env` 中设置：`DB_HOST`、`DB_NAME`、`DB_USER`、`DB_PASS`
3. 验证服务
   - 后端：`http://localhost:8080`
   - 前端：`http://localhost:5173`（如提供 Web 镜像则按镜像端口）

## 后端关键配置清单
- `application-mysql.yml`
  - `spring.datasource.url`
  - `spring.datasource.username`
  - `spring.datasource.password`
  - `server.port`
- 日志与时区
  - 建议统一 `Asia/Shanghai` 时区，避免时间戳不一致
- CORS（如前端跨域访问）
  - 允许前端本地开发源（如 `http://localhost:5173`）

## 前端联通后端
- 管理后台前端默认指向本地后端，若跨端口访问需在前端开发配置中设置 API 基地址
- 验证入口：在管理后台登录页完成注册/登录，确认调用后端接口成功

## 验证与自检
- 数据库：检查 `aipexbase` 数据库中基础表是否存在并有初始数据
- 接口：健康检查与简单业务接口可访问
- 前端：管理后台可登录并看到基础功能面板

## 许可与合规
- 不以该源码运行“多租户”环境（一个工作空间对应一个租户）
- 如使用其前端，保留 LOGO 和版权信息，避免违反许可条款

## 常见问题与处理
- 数据库连接失败：检查 `application-mysql.yml` 的 `url/username/password` 与 MySQL 监听端口（默认 3306）
- 端口冲突：修改 `server.port` 或关闭占用端口的程序
- SQL 导入报错：确认 MySQL 版本为 8.0+，字符集为 `utf8mb4`

## 下一步（可选增强）
- 集成 GitHub OAuth 登录与账号绑定
- 增加 GitHub 资源同步任务（仓库、组织、权限）
- 按需调整 CORS 与鉴权策略，联通你的现有前端应用
