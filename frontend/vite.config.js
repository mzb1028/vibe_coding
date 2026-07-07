import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "path";

// `--mode single` produces a self-contained dist/index.html (used for the
// shareable artifact preview). The default build is a normal static site.
export default defineConfig(({ mode }) => ({
  base: "./", // relative asset paths so the build works on GitHub Pages, Render, or any subpath
  plugins: [react(), ...(mode === "single" ? [viteSingleFile()] : [])],
  resolve: {
    alias: { "@shared": path.resolve(__dirname, "../shared") }
  },
  server: {
    fs: { allow: [path.resolve(__dirname, "..")] }
  }
}));
