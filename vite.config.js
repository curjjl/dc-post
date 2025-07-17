import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
  server: {
    port: 3000,
    open: true,
    proxy: {
      '/api/ds': {
        target: 'http://192.168.201.129:20831',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ds/, ''),
      }
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        manualChunks: {
          monaco: ['monaco-editor']
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      'monaco-editor',
      'axios'
    ]
  },
  define: {
    // 定义全局变量以支持Monaco Editor
    global: 'globalThis',
    // 为了兼容性，定义 process.env（虽然推荐使用 import.meta.env）
    'process.env': {}
  }
})
