
import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react()],
    define: {
      // 確保 API_KEY 直接注入，解決手機端失靈問題
      'process.env.API_KEY': JSON.stringify(env.API_KEY || process.env.API_KEY || ""),
      'process.env': {
        API_KEY: JSON.stringify(env.API_KEY || process.env.API_KEY || "")
      }
    }
  }
})
