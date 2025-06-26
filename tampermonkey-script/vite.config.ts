import { defineConfig } from "vite";
import monkey from "vite-plugin-monkey";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    monkey({
      entry: "src/index.ts",
      userscript: {
        name: 'mitmproxy-llm-better-view',
        // namespace: "npm/vite-plugin-monkey",
        match: [
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
