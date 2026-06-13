import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// base must match the repo name so assets resolve on GitHub Pages
export default defineConfig({
  plugins: [react()],
  base: "/brassbook-finance-tracker/",
});
