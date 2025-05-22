import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import { viteStaticCopy } from "vite-plugin-static-copy";
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
          dest: "", // copy as 404.html
          rename: "404.html",
        },
      ],
    }),
  ],
});
