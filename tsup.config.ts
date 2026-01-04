import { defineConfig } from "tsup";

export default defineConfig({
  entry: {
    loader: "src/loader.ts"
  },
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  target: "es2019",
  platform: "node",
  outDir: "dist"
});