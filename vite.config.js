import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true,
    proxy: {
      '/api/ai': {
        target: 'https://api.anthropic.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api\/ai/, '/v1/messages'),
        headers: {
          'x-api-key': 'YOUR_ANTHROPIC_API_KEY',
          'anthropic-version': '2023-06-01',
        },
      },
    },
  },
})