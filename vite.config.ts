import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { TanStackRouterVite } from "@tanstack/router-plugin/vite";
import path from "node:path";

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
  plugins: [
    velitePlugin(),
    TanStackRouterVite({ target: "react", autoCodeSplitting: true }),
    react(),
    tailwindcss(),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      "#site/content": path.resolve(__dirname, ".velite"),
    },
  },
});
