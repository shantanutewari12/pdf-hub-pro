// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig({
  cloudflare: false,
  tanstackStart: {
    prerender: {
      enabled: true,
      routes: [
        "/",
        "/contact",
        "/dashboard",
        "/pricing",
        "/privacy",
        "/tools",
        "/auth/login",
        "/auth/register",
      ],
    },
    server: {
      preset: "static",
    },
  },
  vite: {
    plugins: [
      VitePWA({
        registerType: "autoUpdate",
        strategies: "generateSW",
        manifest: {
          name: "PDF Master Pro",
          short_name: "PDFMaster",
          description:
            "The premium PDF toolkit — Convert, edit, merge, split, compress, sign and protect PDFs.",
          theme_color: "#10b981",
          background_color: "#0f172a",
          display: "standalone",
          start_url: "/",
          icons: [
            {
              src: "/icon-192.png",
              sizes: "192x192",
              type: "image/png",
            },
            {
              src: "/icon-512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
        },
        workbox: {
          globPatterns: ["**/*.{js,css,html,png,svg,woff2}"],
          navigateFallback: "/offline.html",
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/.*\/tools\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "tools-cache",
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 30, // 30 Days
                },
                cacheableResponse: {
                  statuses: [0, 200],
                },
              },
            },
          ],
        },
      }),
    ],
  },
});
