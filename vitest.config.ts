import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node", // Use node environment for worker tests
    include: ["worker/**/*.test.ts", "src/**/*.test.ts"],
    globals: true
  }
});