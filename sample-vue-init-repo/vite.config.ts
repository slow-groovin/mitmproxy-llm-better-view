import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import monkey, { cdn } from 'vite-plugin-monkey';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    vue(),
    monkey({
      entry: 'src/main.ts',
      userscript: {
        icon: 'https://vitejs.dev/logo.svg',
        namespace: 'npm/vite-plugin-monkey',
        match: [
          // 'http://localhost:*',
          'http://localhost:9090/',
          'http://localhost:8080/',
          'http://127.0.0.1:9090/',
          'http://127.0.0.1:8080/',
          'https://www.bing.com/',
          'https://example3.com/',
          
        ],
      },
      build: {
        externalGlobals: {
          vue: cdn.jsdelivr('Vue', 'dist/vue.global.prod.js'),
        },
      },
      
    }),
  ],
});
