
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // Quan trọng: Sử dụng đường dẫn tương đối để chạy được trên GitHub Pages (sub-directory)
  base: './', 
  build: {
    outDir: 'dist',
  }
})
