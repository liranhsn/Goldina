import { defineConfig, externalizeDepsPlugin } from "electron-vite";
import react from "@vitejs/plugin-react";
import { resolve } from "node:path";

export default defineConfig({
  main: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "dist-electron/main",
      rollupOptions: {
        input: { index: resolve(__dirname, "electron/main/index.ts") },
        output: { format: "es", entryFileNames: "index.js" },
        external: ["better-sqlite3"],
      },
      commonjsOptions: { ignoreDynamicRequires: true },
    },
  },
  preload: {
    plugins: [externalizeDepsPlugin()],
    build: {
      outDir: "dist-electron/preload",
      rollupOptions: {
        input: { index: resolve(__dirname, "electron/preload/index.ts") },
        output: {
          format: "cjs", // ⬅ CommonJS
          entryFileNames: "index.js", // ⬅ force .js name
        },
      },
    },
  },
  renderer: {
    plugins: [react()],
    base: "./",
    build: {
      outDir: "dist/renderer",
      rollupOptions: {
        input: { index: resolve(__dirname, "src/renderer/index.html") },
      },
    },
  },
});
