import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import { fileURLToPath, URL } from "node:url";

function velitePlugin(): Plugin {
  let started = false;
  return {
    name: "velite",
    async configResolved(config) {
      if (started) return;
      started = true;
      const { build } = await import("velite");
      await build({
        watch: config.command === "serve",
        clean: true,
      });
    },
  };
}

export default defineConfig({
  // GitHub Pages serves at https://<owner>.github.io/dasg-diagram/.
  base: "/dasg-diagram/",
  plugins: [
    velitePlugin(),
    tailwindcss(),
    tanstackRouter({ target: "react", autoCodeSplitting: true }),
    react(),
  ],
  resolve: {
    alias: {
      "@": fileURLToPath(new URL("./src", import.meta.url)),
      "#site/content": fileURLToPath(new URL("./.velite", import.meta.url)),
    },
  },
  build: {
    outDir: "dist",
  },
});
