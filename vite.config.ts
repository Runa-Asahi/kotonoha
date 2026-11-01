import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { VitePWA } from "vite-plugin-pwa";

// Relative base + hash routing: works on GitHub Pages (/kotonoha/), any sub-path,
// custom domains and file hosts, and deep links never hit the server's 404.
export default defineConfig({
  base: "./",
  define: { __APP_VERSION__: JSON.stringify(process.env.npm_package_version ?? "2.1.0") },
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.svg", "icons/*.png"],
      manifest: {
        name: "言叶 · 新托福单词",
        short_name: "言叶",
        description: "新托福词汇 · FSRS 智能复习 · 离线可用",
        lang: "zh-CN",
        start_url: "./",
        scope: "./",
        display: "standalone",
        background_color: "#f8fafc",
        theme_color: "#0f766e",
        icons: [
          { src: "icons/icon-192.png", sizes: "192x192", type: "image/png" },
          { src: "icons/icon-512.png", sizes: "512x512", type: "image/png", purpose: "any maskable" },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,json}"],
        maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      },
    }),
  ],
  test: { environment: "jsdom" },
});
