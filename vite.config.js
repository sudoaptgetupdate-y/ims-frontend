import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from "path" // เพิ่มบรรทัดนี้

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // เพิ่มส่วนนี้เข้าไป
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})