import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist",
    sourcemap: false,
    rollupOptions: {
      input: {
        index: "index.html",
        admin: "admin.html",
        home: "home.html"
      },
      output: {
        manualChunks(id) {
          const normalizedId = id.replaceAll("\\", "/");

          if (
            normalizedId.endsWith("/src/data/menu.js") ||
            normalizedId.endsWith("/src/data/productNutrition.js") ||
            normalizedId.endsWith("/src/data/productImages.js")
          ) {
            return "catalog-data";
          }

          return undefined;
        }
      }
    }
  }
});
