import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [
    react(),
    mode === "development" && componentTagger(),
    VitePWA({
      registerType: "autoUpdate",
      includeAssets: ["favicon.ico", "icons/*.svg"],
      manifest: {
        name: "VitrinePro - Gerenciar Loja",
        short_name: "VitrinePro",
        description: "Gerencie sua loja online de qualquer lugar",
        theme_color: "#f97316",
        background_color: "#ffffff",
        display: "standalone",
        start_url: "/dashboard",
        scope: "/dashboard",
        icons: [
          {
            src: "/pwa-192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "/pwa-512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "any maskable",
          },
        ],
      },
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg,jpeg,jpg,webp,woff2}"],
        runtimeCaching: [
          {
            // Cache de imagens do Supabase Storage
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*$/i,
            handler: "CacheFirst",
            options: {
              cacheName: "supabase-images",
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
          {
            // Cache de dados da API Supabase (REST)
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*$/i,
            handler: "NetworkFirst",
            options: {
              cacheName: "supabase-api",
              expiration: { maxEntries: 50, maxAgeSeconds: 60 * 5 },
            },
          },
        ],
      },
    }),
  ].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
}));
