## 目标

* 前端部署到 GitHub Pages，域名为 `https://study.dawsondx.top`。

* 后端调用通过 Cloudflare Workers 代理到 `http://124.71.176.202/baas-api`，由 Workers 在服务端注入 `CODE_FLYING`（API Key）与 CORS 头，前端不暴露密钥。

## DNS 与 Cloudflare 配置

* 在 Cloudflare 将 `study.dawsondx.top` 设置为 CNAME 指向 `dawsondx.github.io`（开启代理小云朵）。

* 创建 Workers 应用 `aipexbase-proxy`，添加 Secret：`API_KEY=kf_api_rTheZ02YCKAyNdXT9raOsdCHzfLVhbQm`。

* 为 Workers 添加 Route：`study.dawsondx.top/baas-api*`。

## Workers 代码

* `src/index.js`：

```js
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    const upstream = `http://124.71.176.202/baas-api${url.pathname.replace(/^\/baas-api/, '')}${url.search}`
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders() })
    }
    const init = {
      method: request.method,
      headers: new Headers(request.headers),
      body: request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined,
    }
    init.headers.set('CODE_FLYING', env.API_KEY)
    init.headers.delete('host')
    const res = await fetch(upstream, init)
    const out = new Response(res.body, res)
    corsApply(out.headers)
    return out
  }
}
function corsHeaders(){
  return {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, APP_ID',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
  }
}
function corsApply(h){
  const c = corsHeaders(); Object.entries(c).forEach(([k,v])=>h.set(k,v))
}
```

* `wrangler.toml`：

```toml
name = "aipexbase-proxy"
main = "src/index.js"
compatibility_date = "2024-11-01"
route = "study.dawsondx.top/baas-api*"
# Secrets: API_KEY 通过 wrangler secret put 设置
```

* 部署：`wrangler login` → `wrangler publish`。

## 仓库改动（study\_manage）

1. 生产环境变量：新增 `.env.production`

```
VITE_AIPEX_API=https://study.dawsondx.top/baas-api
VITE_USE_MOCK_API=false
```

1. Vite 基础路径：调整 `vite.config.ts` 设置 `base: '/'`（自定义域根部署）。
2. GitHub Pages 工作流：新增 `.github/workflows/deploy.yml`

```yaml
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
  workflow_dispatch:
permissions:
  contents: read
  pages: write
  id-token: write
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 18 }
      - run: npm ci
      - run: npm run build
        env:
          VITE_AIPEX_API: https://study.dawsondx.top/baas-api
          VITE_USE_MOCK_API: false
      - uses: actions/upload-pages-artifact@v3
        with:
          path: dist
  deploy:
    needs: build
    runs-on: ubuntu-latest
    environment:
      name: github-pages
      url: ${{ steps.deployment.outputs.page_url }}
    steps:
      - id: deployment
        uses: actions/deploy-pages@v4
```

1. Pages 自定义域：新增 `public/CNAME` 文件，内容仅为：

```
study.dawsondx.top
```

1. 404 刷新兜底：项目已存在 `public/404.html`。

## 验证

* 部署完成后访问 `https://study.dawsondx.top/`，页面加载正常。

* 打开前端功能页：登录/资源/进度/支付，能正常拉取数据。

* 网络面板显示请求发往 `https://study.dawsondx.top/baas-api/...`，返回 200；无 CORS 报错。

## 安全与注意

* API Key仅保存在 Workers Secret，不进入前端包。

* 若后端对 `Origin` 有限制，Workers 已统一加允许头；如仍受限需要后端侧放行你的域名。

## 我将
