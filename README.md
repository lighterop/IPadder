# IPadder
基于Worker的在线的IP地址检测
# 🚀 Cloudflare Worker 网络信息检测器

这是一个基于 Cloudflare Worker 平台构建的**网络信息检测器**。它利用 Cloudflare 边缘网络的快速特性，实时捕获并展示访问者的 IP 地址、地理位置、ASN (自治系统) 信息以及完整的 User Agent 字符串。

项目的亮点在于：

1.  **极速响应：** 在 Cloudflare 的边缘节点执行，响应速度极快。
2.  **优雅 UI：** 采用 **macOS 风格**的设计（毛玻璃、暗色主题），前端使用 **Tailwind CSS**，用户体验友好。
3.  **双重功能：** 既是一个**网页应用**，同时提供了一个**JSON API 接口**供其他程序调用。

## ✨ 主要功能

* **客户端 IP 地址获取：** 准确获取真实的客户端 IP 地址（通过 `cf-connecting-ip`）。
* **地理位置信息：** 显示国家、城市和区域（通过 `request.cf` 对象）。
* **ASN/组织信息：** 展示自治系统编号（ASN）及其所属的网络组织名称。
* **User Agent (UA) 字符串：** 捕获完整的浏览器和设备信息。
* **交互式前端：** 带有加载动画和“一键复制”功能。
* **JSON API：** 通过添加查询参数即可获取纯净的 JSON 数据。

## ⚙️ 代码结构

该脚本是一个典型的 **Single File Worker** 结构，核心逻辑集中在一个文件内：

| 部分 | 文件/变量名 | 描述 |
| :--- | :--- | :--- |
| **前端页面** | `HTML_CONTENT` | 嵌入的 HTML 字符串。包含 macOS 风格 UI (`<style>`)、Tailwind CSS 配置和前端 JavaScript 逻辑。 |
| **Worker 入口** | `addEventListener('fetch', ...)` | 监听 `fetch` 事件，将请求转发给 `handleWorkerRequest` 函数。 |
| **请求处理** | `handleWorkerRequest(request)` | **核心处理函数。** 根据 URL 中的 `?api=json` 参数判断是返回 HTML 页面还是 JSON API 数据。 |
| **API 逻辑** | `if (url.searchParams.get('api') === 'json')` | 从 `request.headers` 和 `request.cf` 对象中提取所有网络信息并格式化为 JSON 响应。 |

## 🚀 部署步骤 (Cloudflare)

由于这是 Cloudflare Worker 脚本，您需要将其部署到 Cloudflare 平台。

1.  **登录 Cloudflare：** 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)。
2.  **进入 Worker 服务：** 在左侧菜单栏选择 **Workers & Pages**。
3.  **创建 Worker：**
    * 点击 **“创建应用程序”**，然后选择 **“创建 Worker”**。
    * 为您的 Worker 命名（例如：`ip-detector`）。
4.  **编辑代码：**
    * 在 Worker 界面，点击 **“快速编辑”** 或 **“部署”** 旁边的 **“编辑代码”**。
    * **将您提供的完整 Worker 脚本内容粘贴到代码编辑器中，覆盖默认的代码。**
5.  **保存并部署：** 点击 **“保存并部署”**。

您的网络信息检测器现在应该可以通过 Worker 路由或自定义域名访问了！

## 💡 使用指南

### 1. 访问网页应用 (UI)

直接访问您的 Worker 域名（例如 `https://ip-detector.yourname.workers.dev`）。

* **效果：** 页面将展示 macOS 风格的界面，并通过前端 JS 自动调用 API 获取并显示您的 IP、地理位置、ASN 和 UA 信息。

### 2. 调用 JSON API

在您的 Worker 域名后添加查询参数 `?api=json`。

* **URL 示例：** `https://ip-detector.yourname.workers.dev/?api=json`
* **用途：** 适用于需要纯净网络信息数据的脚本、命令行工具或其他应用程序。

#### 示例 JSON 响应结构：

```json
{
  "ip": "203.0.113.42",
  "ua": "Mozilla/5.0 (...)",
  "location": "CN / Beijing (BJ)",
  "asn": "4808",
  "asOrg": "CHINA TELECOM",
  "timestamp": "2025-10-30T07:20:12.345Z"
}
