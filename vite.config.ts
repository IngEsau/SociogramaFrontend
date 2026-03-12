import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    allowedHosts: [''],
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Librerías base de React
          if (id.includes('node_modules/react/') || id.includes('node_modules/react-dom/')) {
            return 'vendor-react';
          }
          // Router
          if (id.includes('node_modules/react-router') || id.includes('node_modules/@remix-run')) {
            return 'vendor-router';
          }
          // Zustand
          if (id.includes('node_modules/zustand')) {
            return 'vendor-zustand';
          }
          // Axios
          if (id.includes('node_modules/axios')) {
            return 'vendor-axios';
          }
          // Lucide icons (puede ser pesado)
          if (id.includes('node_modules/lucide-react')) {
            return 'vendor-lucide';
          }
          // Resto de node_modules
          if (id.includes('node_modules')) {
            return 'vendor-misc';
          }
          // Chunks por feature
          if (id.includes('/features/admin/')) return 'feature-admin';
          if (id.includes('/features/tutor/')) return 'feature-tutor';
          if (id.includes('/features/student/')) return 'feature-student';
          if (id.includes('/features/committee/')) return 'feature-committee';
          if (id.includes('/features/sociogram/') || id.includes('/features/sociogram_shared/')) {
            return 'feature-sociogram';
          }
          if (id.includes('/features/auth/')) return 'feature-auth';
          if (id.includes('/features/settings/')) return 'feature-settings';
        },
      },
    },
  },
})