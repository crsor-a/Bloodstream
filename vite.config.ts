import { defineConfig } from 'vitest/config';
import preact from '@preact/preset-vite';
import { VitePWA } from 'vite-plugin-pwa';

// Relative base so the build works at crsor-a.github.io/Bloodstream/ or any other path.
export default defineConfig({
  base: './',
  plugins: [
    preact(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'script-defer',
      includeAssets: ['icons/drop-64.png', 'icons/drop-180.png'],
      manifest: {
        name: 'Bloodstream',
        short_name: 'Bloodstream',
        description: 'Track where your Adderall dose is in your bloodstream right now.',
        start_url: './',
        scope: './',
        display: 'standalone',
        orientation: 'portrait',
        background_color: '#000000',
        theme_color: '#000000',
        icons: [
          { src: 'icons/drop-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/drop-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/drop-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' }
        ]
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,webmanifest}'], cleanupOutdatedCaches: true }
    })
  ],
  build: { target: 'es2020', cssMinify: true },
  test: { environment: 'node', include: ['tests/**/*.test.ts'] }
});
