import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  envPrefix: "SUPABASE_",
  plugins: [react()],
  optimizeDeps: {
    exclude: ["@huggingface/transformers"],
  },
})
