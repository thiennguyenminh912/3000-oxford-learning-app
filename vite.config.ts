import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { viteStaticCopy } from "vite-plugin-static-copy";
import { VitePWA } from "vite-plugin-pwa";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  base: "/3000-oxford-learning-app/",
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: path.resolve(__dirname, "dist/index.html"),
          dest: "",
          rename: "404.html",
        },
      ],
    }),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: "auto",
      includeAssets: ["favicon.ico", "logo.jpg", "icons/*.png"],
      manifest: {
        name: "Oxford 5000",
        short_name: "Oxford 5000",
        description: "Oxford 5000 words learning application",
        theme_color: "#000000",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "logo.jpg",
            sizes: "72x72",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "logo.jpg",
            sizes: "96x96",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "logo.jpg",
            sizes: "128x128",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "logo.jpg",
            sizes: "144x144",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "logo.jpg",
            sizes: "152x152",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "logo.jpg",
            sizes: "192x192",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "logo.jpg",
            sizes: "384x384",
            type: "image/jpeg",
            purpose: "any",
          },
          {
            src: "logo.jpg",
            sizes: "512x512",
            type: "image/jpeg",
            purpose: "any",
          },
        ],
      },
    }),
  ],
});
