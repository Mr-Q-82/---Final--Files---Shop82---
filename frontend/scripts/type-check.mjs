import { build } from "esbuild";
import { spawnSync } from "node:child_process";

const result = spawnSync(process.execPath, ["scripts/build.mjs"], { stdio: "inherit" });
if (result.status !== 0) process.exit(result.status || 1);
await build({
  entryPoints: ["js/shared/runtime/application-platform.js"],
  bundle: true,
  write: false,
  platform: "browser",
  target: "es2020",
  logLevel: "error",
});
console.log("Static JavaScript compilation checks passed.");
