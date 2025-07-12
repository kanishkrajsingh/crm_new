import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Allow connections from any device on the network
    port: 5173,      // 👈 Optional, defaults to 5173
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/generate-bill-pdf': {  // Add this proxy setting
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
      '/generate-order-receipt': {  // Add proxy for order receipts
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
      },
    },
  },
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
});