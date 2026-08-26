import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensions = new Set([".js", ".jsx", ".mjs"]);
const files = [];
async function walk(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    if (["node_modules", "dist", "test-results"].includes(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) await walk(full);
    else if (extensions.has(path.extname(entry.name))) files.push(full);
  }
}
await walk(root);
const failures = [];
for (const file of files) {
  const relative = path.relative(root, file).replaceAll(path.sep, "/");
  const source = await fs.readFile(file, "utf8");
  if (/\b(?:eval|Function)\s*\(/.test(source)) failures.push(`${relative}: dynamic code execution is forbidden`);
  if (/localStorage\.setItem\(["'](?:access|refresh)["']/.test(source)) failures.push(`${relative}: auth tokens must not use localStorage`);
  if (/\r/.test(source)) failures.push(`${relative}: use LF line endings`);
  if (source.includes("\t")) failures.push(`${relative}: tab indentation is not allowed`);
}
for (const bootstrap of ["js/storefront/bootstrap.js", "js/admin/bootstrap.js"]) {
  const source = await fs.readFile(path.join(root, bootstrap), "utf8");
  for (const match of source.matchAll(/["'](\/js\/[^"']+)["']/g)) {
    try { await fs.access(path.join(root, match[1].slice(1))); }
    catch { failures.push(`${bootstrap}: missing module ${match[1]}`); }
  }
}
if (failures.length) {
  console.error(failures.join("\n"));
  process.exitCode = 1;
} else {
  console.log(`Quality checks passed (${files.length} source files).`);
}
