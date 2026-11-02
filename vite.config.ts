import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Relative base + hash routing: works on GitHub Pages (/kotonoha/), any sub-path,
// custom domains and file hosts, and deep links never hit the server's 404.
export default defineConfig({
  base: "./",
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "2.2.0") },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        name: "言叶 · ことのは",
        short_name: "言叶",
        description: "英语 · 日语单词与五十音 · FSRS 智能复习 · 离线可用",
        lang: "zh-CN",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#101214",
        theme_color: "#101214",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
          { src: "icons/maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,json,mp3,woff2}"],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/dict\.youdao\.com\/dictvoice/,
            handler: "CacheFirst",
            options: { cacheName: "word-audio", expiration: { maxEntries: 3000, maxAgeSeconds: 60 * 60 * 24 * 180 }, cacheableResponse: { statuses: [0, 200] } },
          },
        ],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  test: { environment: "jsdom" },
});
