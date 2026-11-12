import { defineConfig, type Plugin } from "vite";
import react from "@vitejs/plugin-react";
import { viteSingleFile } from "vite-plugin-singlefile";
import path from "node:path";

// The story engine (server/engine) is shared with the Node tests. In the browser build its
// database and AI modules are swapped for the in-page versions in src/local/.
const swap: Record<string, string> = {
  [path.resolve("server/db.ts")]: path.resolve("src/local/db.ts"),
  [path.resolve("server/llm/provider.ts")]: path.resolve("src/local/provider.ts"),
};
function browserEngine(): Plugin {
  return {
    name: "storyloom-browser-engine",
    enforce: "pre",
    resolveId(source, importer) {
      if (!importer || !importer.includes(`${path.sep}server${path.sep}`)) return null;
      const target = swap[path.resolve(path.dirname(importer), source)];
      return target ?? null;
    },
  };
}

export default defineConfig({
  plugins: [browserEngine(), react(), viteSingleFile()],
  build: { assetsInlineLimit: 100_000_000, chunkSizeWarningLimit: 5000 },
});
