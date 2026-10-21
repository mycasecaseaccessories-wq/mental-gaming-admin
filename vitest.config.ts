import { fileURLToPath } from "node:url";
import path from "node:path";
import { defineConfig } from "vitest/config";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  root: projectRoot,
  test: {
    include: ["server/**/*.test.ts"],
    environment: "node",
    fileParallelism: false,
  },
});
