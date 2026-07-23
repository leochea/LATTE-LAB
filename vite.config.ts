import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // 👇 添加这一行，注意大小写必须与仓库名 LATTE-LAB 完全一致
  base: '/LATTE-LAB/',
})
