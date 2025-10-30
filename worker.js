// ----------------------------------------------------
// Cloudflare Worker 完整脚本
// ----------------------------------------------------

/**
 * 嵌入的 HTML 内容 (macOS 风格 UI)
 */
const HTML_CONTENT = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>网络信息检测器</title>
    <!-- 引入 Tailwind CSS CDN -->
    <script src="https://cdn.tailwindcss.com"></script>
    <script>
        // 配置 Tailwind 使用 Inter 字体并设置自定义颜色
        tailwind.config = { 
            theme: { 
                extend: { 
                    fontFamily: { 
                        sans: ['Inter', 'system-ui', 'Avenir', 'Helvetica', 'Arial', 'sans-serif'], 
                    },
                    colors: {
                        'mac-dark': '#1e293b',
                    }
                } 
            } 
        };
    </script>
    <style>
        /* 继承 macOS 风格背景 */
        body { 
            display: flex; 
            min-height: 100vh; 
            flex-direction: column; 
            /* 增强背景以突出毛玻璃效果：添加微妙的径向渐变 */
            background: radial-gradient(circle at top left, #3b82f640, transparent 40%), 
                        radial-gradient(circle at bottom right, #ef444440, transparent 40%),
                        #1e293b; 
            overflow: hidden;
            user-select: none;
        }
        .container-center { 
            display: flex; 
            flex-grow: 1; 
            align-items: center; 
            justify-content: center; 
            padding: 1rem; 
        }
        /* 针对结果项的美化 */
        .result-item-bg {
            background-color: rgba(40, 50, 60, 0.7); /* 自定义结果背景，深色半透明 */
            border: 1px solid rgba(255, 255, 255, 0.1);
            transition: all 0.3s ease; /* 新增：为动态效果添加过渡 */
        }
        /* 新增：悬停时的动态效果 */
        .result-item-bg:hover {
            background-color: rgba(60, 70, 80, 0.8); /* 悬停时稍微变亮 */
            border-color: rgba(147, 197, 253, 0.3); /* 蓝色边框高亮 */
            transform: translateY(-2px); /* 向上轻微移动 */
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
        }
        /* 代码块样式 */
        .result-code {
            background-color: rgba(0, 0, 0, 0.3); /* 更深的代码块背景 */
            border-radius: 6px;
        }
    </style>
</head>
<body class="bg-mac-dark">

    <div class="container-center">
        <!-- 核心卡片 - 采用毛玻璃效果和圆角，像一个浮动面板 -->
        <!-- 增加初始状态类：opacity-0 和 translate-y-4，用于JS触发加载动画 -->
        <div id="result-card" class="bg-gray-800/80 backdrop-blur-xl p-8 rounded-2xl shadow-2xl max-w-lg w-full text-white/90 transition-all duration-700 opacity-0 translate-y-4">
            
            <h1 class="text-3xl font-extrabold mb-6 border-b border-gray-600/50 pb-2">网络信息</h1>
            <p class="text-white/70 mb-6">以下信息由 Cloudflare 在边缘网络实时捕获，响应速度极快。</p>

            <div id="data-container" class="space-y-4">
                
                <div id="loading" class="text-center py-8">
                    <div class="animate-spin inline-block w-8 h-8 border-4 border-blue-400 border-t-transparent rounded-full" role="status">
                        <span class="sr-only">加载中...</span>
                    </div>
                    <p class="mt-3 text-lg text-blue-400 font-medium">正在边缘网络捕获您的信息...</p>
                </div>

                <!-- IP 地址 -->
                <div id="ip-result" class="hidden result-item-bg p-4 rounded-xl transition duration-300">
                    <p class="text-base font-semibold text-white/90">您的 IP 地址 :</p>
                    <code id="ip-value" class="block mt-1 p-2 result-code text-green-300 font-mono overflow-x-auto text-sm"></code>
                </div>

                <!-- 地理位置 -->
                <div id="location-result" class="hidden result-item-bg p-4 rounded-xl transition duration-300">
                    <p class="text-base font-semibold text-white/90">地理位置 :</p>
                    <code id="location-value" class="block mt-1 p-2 result-code text-yellow-300 font-mono overflow-x-auto text-sm"></code>
                </div>
                
                <!-- ASN 信息 -->
                <div id="asn-result" class="hidden result-item-bg p-4 rounded-xl transition duration-300">
                    <p class="text-base font-semibold text-white/90">自治系统 (ASN) 与网络提供商:</p>
                    <code id="asn-value" class="block mt-1 p-2 result-code text-purple-300 font-mono overflow-x-auto text-sm"></code>
                </div>

                <!-- User Agent -->
                <div id="ua-result" class="hidden result-item-bg p-4 rounded-xl transition duration-300">
                    <p class="text-base font-semibold text-white/90">完整的 User Agent (UA) 字符串:</p>
                    <code id="ua-value" class="block mt-1 p-2 result-code text-red-300 font-mono overflow-x-auto text-sm"></code>
                </div>
                
                <!-- 错误信息 -->
                <div id="error-message" class="hidden bg-red-800/60 p-4 rounded-xl border border-red-500 text-white/90">
                    <p class="font-bold">🚨 错误:</p>
                    <p id="error-details"></p>
                </div>
            </div>
            
            <!-- 按钮 -->
            <button id="copy-button" class="mt-8 w-full px-6 py-3 bg-blue-600 text-white font-semibold rounded-lg shadow-xl hover:bg-blue-700 transition duration-150 transform hover:scale-[1.01] focus:outline-none focus:ring-4 focus:ring-blue-500 focus:ring-opacity-50 disabled:bg-gray-600/70 disabled:text-gray-400" disabled>
                一键复制所有信息
            </button>
            <span id="copy-status" class="ml-4 text-sm text-green-400 opacity-0 transition duration-300">已复制!</span>

        </div>
    </div>
    
    <script type="module">
        // ----------------------------------------------------
        // 浏览器前端逻辑 (新增指数退避重试机制)
        // ----------------------------------------------------
        const loadingDiv = document.getElementById('loading');
        const ipResultDiv = document.getElementById('ip-result');
        const locationResultDiv = document.getElementById('location-result');
        const uaResultDiv = document.getElementById('ua-result');
        const asnResultDiv = document.getElementById('asn-result');
        const asnValueCode = document.getElementById('asn-value');
        
        const ipValueCode = document.getElementById('ip-value');
        const locationValueCode = document.getElementById('location-value');
        const uaValueCode = document.getElementById('ua-value');
        const errorMessageDiv = document.getElementById('error-message');
        const errorDetailsP = document.getElementById('error-details');
        const copyButton = document.getElementById('copy-button');
        const copyStatusSpan = document.getElementById('copy-status');
        
        /**
         * 调用 Worker API 并显示结果，包含指数退避重试机制。
         */
        async function fetchWorkerData() {
            loadingDiv.classList.remove('hidden');
            copyButton.disabled = true;

            try {
                // 在 Worker 环境中，添加一个查询参数来告诉 Worker 我们需要 JSON 数据
                const apiUrl = window.location.href.split('?')[0] + '?api=json';
                
                // 增加指数退避和重试机制
                let response;
                let data;
                const maxRetries = 3;
                
                for (let i = 0; i < maxRetries; i++) {
                    response = await fetch(apiUrl, {
                        method: 'GET',
                        headers: { 'Accept': 'application/json' }
                    });

                    if (response.ok) {
                        data = await response.json();
                        break; // 成功，退出循环
                    }

                    if (i < maxRetries - 1) {
                        // 等待并重试 (1s, 2s, 4s...)
                        const delay = Math.pow(2, i) * 1000;
                        await new Promise(resolve => setTimeout(resolve, delay));
                        // 这里我们不记录重试日志
                    } else {
                        throw new Error(\`HTTP 错误: \${response.status} \${response.statusText}\`);
                    }
                }
                
                // 填充数据
                ipValueCode.textContent = data.ip || '无法获取';
                locationValueCode.textContent = data.location || '无法获取';
                uaValueCode.textContent = data.ua || '无法获取';
                asnValueCode.textContent = \`AS\${data.asn} - \${data.asOrg || '未知组织'}\`;
                
                ipResultDiv.classList.remove('hidden');
                locationResultDiv.classList.remove('hidden');
                uaResultDiv.classList.remove('hidden');
                asnResultDiv.classList.remove('hidden');
                
                copyButton.disabled = false;

            } catch (error) {
                console.error('获取 Worker 数据失败:', error);
                errorDetailsP.textContent = \`Worker 调用失败：\${error.message}\`;
                errorMessageDiv.classList.remove('hidden');
            } finally {
                loadingDiv.classList.add('hidden');
            }
        }

        function copyAllData() {
            const ip = ipValueCode.textContent;
            const location = locationValueCode.textContent;
            const ua = uaValueCode.textContent;
            const asnInfo = asnValueCode.textContent;
            
            const textToCopy = 
\`您的网络信息概览:
----------------------------------
IP 地址: \${ip}
地理位置: \${location}
自治系统/网络: \${asnInfo}
User Agent: \${ua}
----------------------------------\`;

            // 使用 document.execCommand('copy') 兼容 iframe 环境
            const tempTextArea = document.createElement('textarea');
            tempTextArea.value = textToCopy;
            document.body.appendChild(tempTextArea);
            tempTextArea.select();
            
            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    copyStatusSpan.classList.remove('opacity-0');
                    copyStatusSpan.classList.add('opacity-100');
                    setTimeout(() => {
                        copyStatusSpan.classList.remove('opacity-100');
                        copyStatusSpan.classList.add('opacity-0');
                    }, 1500);
                } else {
                    console.error('复制命令执行失败');
                }
            } catch (err) {
                console.error('无法复制到剪贴板', err);
            }
            document.body.removeChild(tempTextArea);
        }

        window.onload = function() {
            const resultCard = document.getElementById('result-card');
            // 新增：卡片加载时的淡入动画
            // 移除初始状态类 (opacity-0, translate-y-4) 以触发 CSS 过渡到最终状态 (opacity-100, translate-y-0)
            resultCard.classList.remove('opacity-0', 'translate-y-4');
            resultCard.classList.add('opacity-100', 'translate-y-0');

            copyButton.addEventListener('click', copyAllData);
            fetchWorkerData();
        };

    </script>
</body>
</html>
`;


// 监听 fetch 事件，这是 Worker 的入口
addEventListener('fetch', event => {
    event.respondWith(handleWorkerRequest(event.request));
});

/**
 * 处理传入的请求，根据请求判断是返回 HTML 页面还是 JSON API 数据。
 * @param {Request} request 传入的 HTTP 请求对象
 */
async function handleWorkerRequest(request) {
    const url = new URL(request.url);

    // 检查是否有 'api=json' 查询参数，以此来区分是页面请求还是 API 请求
    if (url.searchParams.get('api') === 'json') {
        // --- 1. 返回 JSON API 数据 ---

        // 提取 IP 地址：cf-connecting-ip 是 Cloudflare 注入的真实客户端 IP
        const clientIP = request.headers.get('cf-connecting-ip') || 'N/A';
        
        // 提取 User Agent (UA) 属性
        const userAgent = request.headers.get('user-agent') || 'N/A';
        
        // 提取地理位置信息 (cf object)
        const country = request.cf?.country || 'N/A';
        const city = request.cf?.city || 'N/A';
        const region = request.cf?.region || 'N/A';

        // 提取 ASN 和 AS 组织信息
        const asn = request.cf?.asn || 'N/A';
        const asOrg = request.cf?.asOrganization || 'N/A';

        // 构造响应内容
        const data = {
            ip: clientIP,
            ua: userAgent,
            // 格式化地理位置
            location: `${country}${city ? ' / ' + city : ''}${region ? ' (' + region + ')' : ''}`,
            asn: asn,
            asOrg: asOrg,
            timestamp: new Date().toISOString(),
        };
        
        const jsonResponse = JSON.stringify(data, null, 2);

        // 返回 JSON 响应
        return new Response(jsonResponse, {
            headers: { 
                'Content-Type': 'application/json;charset=UTF-8',
                'Access-Control-Allow-Origin': '*', // 允许跨域
                'Cache-Control': 'no-store',
            },
        });
    } else {
        // --- 2. 返回 HTML 页面 ---

        // 返回嵌入的 HTML 字符串
        return new Response(HTML_CONTENT, {
            headers: {
                'Content-Type': 'text/html;charset=UTF-8',
                'Cache-Control': 'no-cache, no-store, must-revalidate'
            },
        });
    }
}
