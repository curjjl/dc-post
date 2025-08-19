import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import { resolve } from "path";

// https://vitejs.dev/config/
export default defineConfig({
  base:
    process.env.NODE_ENV === "production"
      ? "/access-view/dc-post/"
      : "/dc-post/",
  plugins: [vue()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      "/api/ds": {
        target: "http://192.168.201.129:20831",
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ds/, ""),
      },
    },
  },
  // build: {
  //   outDir: 'dist/dc-post',
  //   sourcemap: false,
  //   rollupOptions: {
  //     output: {
  //       manualChunks: {
  //         monaco: ['monaco-editor']
  //       }
  //     }
  //   }
  // },
  build: {
    outDir: "dist/dc-post",
    chunkSizeWarningLimit: 2048,
    maxAssetSize: 1024 * 1024,
    rollupOptions: {
      output: {
        chunkFileNames: "js/[name]-[hash].js", // 引入文件名的名称
        entryFileNames: "js/[name]-[hash].js", // 包的入口文件名称
        assetFileNames: "[ext]/[name]-[hash].[ext]", // 资源文件像 字体，图片等
        manualChunks(id) {
          // 分解块，将大块分解成更小的块
          if (id.includes("node_modules")) {
            // return 'vendor';
            return id
              .toString()
              .split("node_modules/")[1]
              .split("/")[0]
              .toString();
          }
        },
      },
    },
  },
  optimizeDeps: {
    include: ["monaco-editor", "axios"],
  },
  define: {
    // 定义全局变量以支持Monaco Editor
    global: "globalThis",
    // 为了兼容性，定义 process.env（虽然推荐使用 import.meta.env）
    "process.env": {},
  },
});
