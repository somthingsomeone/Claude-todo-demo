import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: { alias: { "@": path.resolve(import.meta.dirname, "src") } },
  // Each test starts its own in-memory database, which takes a few seconds.
  test: { include: ["tests/**/*.test.ts"], testTimeout: 30_000 },
});
