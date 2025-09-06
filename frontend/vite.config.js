import { fileURLToPath, URL } from 'node:url';
import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  if (!env.VITE_API_URL) {
    console.warn('[Vite] VITE_API_URL не задан, используется значение по умолчанию http://localhost:5001');
  }
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
    proxy: {
    '/api': {
      target: env.VITE_API_URL || 'http://localhost:5001',
      changeOrigin: true,
      secure: false,
      rewrite: (path) => path.startsWith('/api') ? path : `/api${path}`,
    },
    },
    },
    define: {
      'import.meta.env.VITE_YANDEX_MAPS_API_KEY': JSON.stringify(env.VITE_YANDEX_MAPS_API_KEY || ''),
      'import.meta.env.VITE_API_URL': JSON.stringify(env.VITE_API_URL || 'http://localhost:5001'),
    },
  };
});