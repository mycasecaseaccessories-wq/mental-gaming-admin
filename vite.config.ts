import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: path.resolve(projectRoot, "client"),
  publicDir: path.resolve(projectRoot, "client/public"),
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: {
      "@": path.resolve(projectRoot, "client/src"),
    },
  },
  build: {
    outDir: path.resolve(projectRoot, "public"),
    emptyOutDir: true,
  },
});
