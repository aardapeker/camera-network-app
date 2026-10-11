import { defineConfig, type ProxyOptions } from "vite"
import tailwindcss from "@tailwindcss/vite"
import { reactRouter } from "@react-router/dev/vite"
import babel from "vite-plugin-babel"
import tsconfigPaths from "vite-tsconfig-paths"
import { VitePWA } from "vite-plugin-pwa"

const ReactCompilerConfig = {
  /* ... */
}

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8080"

const BACKEND_PATHS = ["/auth", "/users", "/notes", "/analytics", "/files", "/api"]

const backendProxy: ProxyOptions = {
  target: BACKEND_URL,
  changeOrigin: true,
  // The dev server is reached under several hostnames: localhost, the service
  // form portal at servisform.localhost, or a LAN IP when testing on a phone.
  // Browsers attach an Origin header to POST/PUT/DELETE even when the request
  // is same-origin, and changeOrigin only rewrites Host - so Spring's CORS
  // filter would see an origin it doesn't know and answer 403. Hand the backend
  // its own origin instead; production is same-origin through nginx and Caddy.
  configure: (proxy) => {
    proxy.on("proxyReq", (proxyReq) => {
      if (proxyReq.getHeader("origin")) {
        proxyReq.setHeader("origin", BACKEND_URL)
      }
    })
  },
}

export default defineConfig({
  plugins: [
    tailwindcss(),
    reactRouter(),
    VitePWA({
      registerType: "prompt",
      includeAssets: ["favicon.ico", "apple-touch-icon.png", "pwa-192x192.png", "pwa-512x512.png"],
      manifest: {
        name: "FieldDesk",
        short_name: "FieldDesk",
        description: "Antrepo ve serbest depo topoloji harita yönetim sistemi",
        theme_color: "#ffffff",
        background_color: "#ffffff",
        display: "standalone",
        orientation: "any",
        scope: "/",
        start_url: "/",
        icons: [
          {
            src: "pwa-192x192.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
          },
          {
            src: "pwa-512x512.png",
            sizes: "512x512",
            type: "image/png",
            purpose: "maskable",
          },
        ],
      },
      workbox: {
        // Cache the app shell and routes
        globPatterns: ["**/*.{js,css,html,ico,png,svg,woff2}"],
        // Don't cache API calls — always go to network
        navigateFallback: "/",
        navigateFallbackDenylist: [/^\/api\//, /^\/auth\//, /^\/files\//],
        runtimeCaching: [
          {
            urlPattern: /^\/api\/.*/,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^\/auth\/.*/,
            handler: "NetworkOnly",
          },
          {
            urlPattern: /^\/files\/.*/,
            handler: "NetworkOnly",
          },
        ],
      },
    }),
    babel({
      filter: /\.[jt]sx?$/,
      babelConfig: {
        presets: ["@babel/preset-typescript"],
        plugins: [["babel-plugin-react-compiler", ReactCompilerConfig]],
      },
    }),
    tsconfigPaths(),
  ],
  server: {
    // For Docker development - allow connections from any host
    host: true,
    // Proxy API requests to backend
    proxy: Object.fromEntries(
      BACKEND_PATHS.map((path) => [path, backendProxy]),
    ),
  },
})
