import { resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import laravel from "laravel-vite-plugin";
import { defineConfig } from "vite";

function stripUseClientDirective(): import("vite").Plugin {
  return {
    name: "strip-use-client-directive",
    enforce: "pre" as const,
    transform(code, id) {
      if (
        (id.endsWith(".js") ||
          id.endsWith(".ts") ||
          id.endsWith(".tsx") ||
          id.endsWith(".mjs")) &&
        (code.includes('"use client"') || code.includes("'use client'"))
      ) {
        return code.replace(/['"]use client['"];?\s*/g, "");
      }
    },
  };
}

export default defineConfig({
  base: "./",
  plugins: [
    laravel({
      input: [
        "resources/css/app.css",
        "resources/css/dark-mode.css",
        "resources/js/app.tsx",
      ],
      ssr: "resources/js/ssr.tsx",
      refresh: true,
    }),
    react(),
    stripUseClientDirective(),
    tailwindcss(),
  ],
  server: {
    host: "unitec-phamacy.test",
    port: 5175,
    strictPort: true,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,POST,PUT,DELETE,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    },
    watch: {
      ignored: ["**/vendor/**", "**/node_modules/**"],
    },
    fs: {
      allow: ["..", "packages"],
    },
  },

  esbuild: {
    jsx: "automatic",
    jsxImportSource: "react",
  },
  resolve: {
    alias: {
      "ziggy-js": resolve(import.meta.dirname, "vendor/tightenco/ziggy"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ["react", "react-dom"],
          ui: ["@radix-ui/react-dialog", "@radix-ui/react-dropdown-menu"],
          utils: ["date-fns", "clsx"],
        },
      },
    },
    assetsDir: "assets",
  },
});
