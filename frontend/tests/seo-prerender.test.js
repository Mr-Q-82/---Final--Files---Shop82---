const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");

const root = path.join(__dirname, "..");

test("SEO prerender remains optional and preserves the existing build", () => {
  const packageJson = JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"));
  const source = fs.readFileSync(path.join(root, "scripts/prerender.mjs"), "utf8");
  assert.match(packageJson.scripts.build, /scripts\/build\.mjs/);
  assert.match(packageJson.scripts.build, /scripts\/prerender\.mjs/);
  assert.match(source, /Django is offline/);
  assert.match(source, /SEO_SITE_URL/);
  assert.match(source, /seo-structured-data/);
});

test("static prerender output contains indexable metadata and structured data", () => {
  const home = fs.readFileSync(path.join(root, "dist/prerender/index.html"), "utf8");
  const faq = fs.readFileSync(path.join(root, "dist/prerender/faq/index.html"), "utf8");
  assert.match(home, /rel="canonical" href="http:\/\/127\.0\.0\.1:5500"/);
  assert.match(home, /id="seo-structured-data"/);
  assert.match(home, /"@type":"WebSite"/);
  assert.match(faq, /سؤالات متداول/);
  assert.match(faq, /index,follow,max-image-preview:large/);
});
