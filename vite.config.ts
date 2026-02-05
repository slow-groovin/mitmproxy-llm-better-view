import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, { cdn } from 'vite-plugin-monkey';
import path from 'path'
// https://vitejs.dev/config/
export default defineConfig({
   resolve: {
    alias: {
      '@': path.resolve(__dirname, './src')
    }
  },
  plugins: [
    vue(),
    
    monkey({
      // entry: 'src/old/index.ts',
      entry: 'src/main.ts',
      userscript: {
        name: {
          '': 'mitmproxy-llm-better-view',
          'zh-CN': 'mitmproxy 大模型请求内容预览'
        },
        icon: 'https://s3.api2o.com/mitm-better-view.svg',
        description: {
          '': 'Better view request body and response body of LLM API (openai completion) in mitmweb',
          'zh-CN': '在 mitmweb 中查看大模型请求中的信息 '
        },
        homepage: 'https://github.com/slow-groovin/mitmproxy-llm-better-view',
        updateURL: 'https://raw.githubusercontent.com/slow-groovin/mitmproxy-llm-better-view/refs/heads/main/tampermonkey-script/dist/mtimweb-llm-better-view.js',
        downloadURL: 'https://raw.githubusercontent.com/slow-groovin/mitmproxy-llm-better-view/refs/heads/main/tampermonkey-script/dist/mtimweb-llm-better-view.js',
        namespace: 'npm/vite-plugin-monkey',
        match: [
          'http://localhost:8081/*',
          'http://127.0.0.1:8081/*',
          'http://127.0.0.1:9090/*'
        ],
      },
      build: {
        fileName: 'mtimweb-llm-better-view.js',
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
        },
      },
    }),
  ],
});
