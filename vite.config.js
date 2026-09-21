// vite.config.js
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { fileURLToPath, URL } from 'node:url'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url))
    }
  },
  server: {
    port: 5173,
    open: true,
    proxy: {
      // 定义一个代理规则
      '/api/sporttery': {
        target: 'https://webapi.sporttery.cn',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/sporttery/, ''),
      },
    },
  },
})