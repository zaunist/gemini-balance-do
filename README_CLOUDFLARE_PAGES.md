# 部署与维护指南 (Cloudflare Pages 版本)

本文档旨在记录本项目相对于上游项目的特殊改造，并为未来的部署和维护提供指导。

## 核心架构差异

本项目为了适配 Cloudflare Pages 的部署模型，采用了与上游项目不同的混合架构。

1.  **部署模型**:
    *   **本项目**: 使用 **Cloudflare Pages** 进行部署。这包括静态前端资源和一个在 `functions/[[path]].ts` 中定义的边缘函数 (`_worker.js`) 作为请求入口。
    *   **上游项目**: 设计为**独立的 Cloudflare Worker** 进行部署。

2.  **Durable Object (DO) 托管**:
    *   **本项目**: Durable Object (`LoadBalancer`) 运行在一个**独立的、专门的 Cloudflare Worker** (`gemini-balance-do-worker`) 中。Pages 项目通过 `wrangler.jsonc` 中的 `script_name` 配置将请求转发给这个独立的 Worker。
    *   **上游项目**: Durable Object 与主逻辑在同一个 Worker 中。

## 关键配置文件修改

以下文件包含了适配 Cloudflare Pages 的核心修改。在未来合并上游更新时，这些文件最有可能产生冲突，需要特别注意。

### `wrangler.jsonc`

*   `"pages_build_output_dir": "public"`: 这是将项目声明为 Cloudflare Pages 项目的关键。**必须保留**。
*   `durable_objects.bindings`: 其中的 `"script_name": "gemini-balance-do-worker"` 指明了 DO 运行在哪个独立的 Worker 上。**必须保留**。
*   **注意**: 此文件**不支持**独立的 Worker 所特有的配置项，如 `"main"`, `"migrations"`, `"keep_vars"` 等。在合并上游更新时，需要将这些不兼容的配置项移除。

### `package.json`

*   `scripts`:
    *   `"build"`: 使用 `esbuild` 将 `src/index.ts` 打包成 Pages Function (`public/_worker.js`)。**必须保留**。
    *   `"pages:deploy"`: 定义了部署到 Cloudflare Pages 的完整命令。**必须保留**。
    *   `"dev"`: 使用 `wrangler pages dev public` 以 Pages 模式进行本地开发。**必须保留**。
*   `devDependencies`:
    *   `"esbuild"`: 项目构建依赖，**必须保留**。

## 部署流程

部署分为两步，**顺序至关重要**：

1.  **第一步：部署 Durable Object Worker**
    此步骤更新后端的 DO 核心逻辑。
    ```bash
    pnpm run worker:deploy
    ```

2.  **第二步：部署 Cloudflare Pages 项目**
    此步骤更新前端和请求入口。
    ```bash
    # (根据你的操作系统选择)
    # Windows CMD:
    set CLOUDFLARE_API_TOKEN=YOUR_API_TOKEN&&pnpm run pages:deploy
    
    # PowerShell:
    $env:CLOUDFLARE_API_TOKEN="YOUR_API_TOKEN"; pnpm run pages:deploy

    # Linux/macOS/WSL:
    CLOUDFLARE_API_TOKEN=YOUR_API_TOKEN pnpm run pages:deploy
    ```
    注：YOUR_API_TOKEN的获取方式，进入https://dash.cloudflare.com/profile/api-tokens ，点击**创建令牌**,选择**编辑 Cloudflare Workers**行的**使用模板**，一步步创建。

## 未来合并上游更新指南

1.  **拉取上游更新**:
    ```bash
    git fetch upstream
    git merge upstream/main
    ```
2.  **解决冲突**:
    *   冲突将主要集中在 `wrangler.jsonc` 和 `package.json`。
    *   **解决原则**: 严格遵循本指南【关键配置文件修改】部分列出的规则，即**保留你为 Pages 适配所做的修改**，同时接受上游的其他功能性更新。
    *   对于 `pnpm-lock.yaml` 的冲突，推荐先接受任意一方的版本，然后运行 `pnpm install` 重新生成。
3.  **安装依赖**:
    ```bash
    pnpm install
    ```
4.  **测试与部署**:
    *   本地测试: `pnpm dev`
    *   按照【部署流程】中的顺序，先部署 Worker，再部署 Pages。
