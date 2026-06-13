import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

const isElectron = process.env.BUILD_TARGET === "electron";

export default defineConfig({
  plugins: [react()],
  base: isElectron ? "./" : "/brassbook-finance-tracker/",
  build: {
    outDir: isElectron ? "dist-electron" : "dist",
    emptyOutDir: true,
  },
});
