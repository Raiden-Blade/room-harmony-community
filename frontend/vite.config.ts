import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/uploads": "http://127.0.0.1:8000",
    },
  },
  build: {
    rollupOptions: {
      input: {
        main: "index.html",
        global: "global.html",
      },
    },
  },
  test: {
    environment: "jsdom",
    include: ["src/**/*.test.{ts,tsx}"],
    setupFiles: "./src/test/setup.ts",
    css: true,
    globals: true,
  },
});
