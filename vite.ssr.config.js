import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: "dist-ssr",
    emptyOutDir: true,
    ssr: "src/home-ssr.jsx",
    rollupOptions: {
      output: {
        entryFileNames: "home-ssr.js"
      }
    }
  }
});
