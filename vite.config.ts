/// <reference types="vitest/config" />
import { fileURLToPath, URL } from 'node:url';
import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';
import { envSecretGuard } from './build/env-guard.ts';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), 'VITE_');
  const proxyTarget = env.VITE_DEV_API_PROXY_TARGET || 'http://localhost:5206';

  return {
    plugins: [envSecretGuard(), react(), tailwindcss()],
    resolve: {
      alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
      port: 5173,
      // Same-origin /api in dev so the refresh cookie (scoped to /api/v1/auth) works — see 02-security §1.
      proxy: { '/api': { target: proxyTarget, changeOrigin: true } },
    },
    preview: {
      proxy: { '/api': { target: proxyTarget, changeOrigin: true } },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['./src/test/setup.ts'],
      include: ['src/**/*.test.{ts,tsx}', 'build/**/*.test.ts'],
      css: false,
      // The first test per file pays for transforming lazy route chunks (Zod, RHF) while other workers do the same.
      testTimeout: 15_000,
    },
  };
});
