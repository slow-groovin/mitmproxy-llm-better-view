import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: "src/index.ts",
      userscript: {
        name: {
          "": 'mitmproxy-llm-better-view',
          "zh-CN": "mitmproxy 大模型请求内容预览"
        },
        icon: 'https://s3.api2o.com/mitm-better-view.svg',
        description: {
          "": 'Better view request body and response body of LLM API (openai completion) in mitmweb',
          "zh-CN": "在 mitmweb 中查看大模型请求中的信息 "
        },
        homepage: 'https://github.com/slow-groovin/mitmproxy-llm-better-view',
        updateURL: 'https://raw.githubusercontent.com/slow-groovin/mitmproxy-llm-better-view/refs/heads/main/tampermonkey-script/dist/mtimweb-llm-better-view.js',
        downloadURL: 'https://raw.githubusercontent.com/slow-groovin/mitmproxy-llm-better-view/refs/heads/main/tampermonkey-script/dist/mtimweb-llm-better-view.js',
        namespace: "npm/vite-plugin-monkey",
        include: [
          "http://localhost:8081/*",
          "http://127.0.0.1:8081/*"
        ],
      },
      build: {
        fileName: "mtimweb-llm-better-view.js",
      },
    }),
  ],
});
