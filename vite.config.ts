import { defineConfig } from "vite";

export default defineConfig({
  root: "./frontend",
  publicDir: "public",
  build: {
    outDir: "../dist",
    emptyOutDir: true,
  },
  server: {
    port: 1420,
    strictPort: true,
    watch: {
      ignored: ["**/src-tauri/**", "**/backend/**"],
    },
  },
  resolve: {
    alias: {
      "@": "/src",
      "@shared": "../shared",
      "@components": "/src/components",
      "@pages": "/src/pages",
      "@api": "/src/api",
      "@styles": "/src/styles",
      "@utils": "/src/utils",
      "@hooks": "/src/hooks",
      "@stores": "/src/stores",
    },
  },
  envPrefix: ["VITE_", "TAURI_"],
});
