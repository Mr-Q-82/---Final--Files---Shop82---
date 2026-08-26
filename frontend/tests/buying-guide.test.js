const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relative) => fs.readFileSync(path.join(__dirname, "..", relative), "utf8");

test("buying-guide quick navigation scrolls vertically without changing routes", () => {
  const guide = read("js/storefront/pages/content-pages/guides.jsx");
  assert.doesNotMatch(guide, /href=[^\n]*#guide-/);
  assert.match(guide, /window\.scrollTo\(\{ top: Math\.max\(0, top\), left: 0/);
  assert.match(guide, /document\.documentElement\.scrollLeft = 0/);
});

test("buying-guide comparison is user-controlled and uses real specifications", () => {
  const guide = read("js/storefront/pages/content-pages/guides.jsx");
  assert.match(guide, /setCompareIds\(\(items\) => items\.includes\(id\)/);
  assert.match(guide, /comparisonProducts\.flatMap\(\(product\) => Object\.keys\(product\.specs \|\| \{\}\)\)/);
  assert.match(guide, /aria-pressed=\{isCompared\}/);
  assert.match(guide, /guideProductSearch/);
  assert.match(guide, /selectedCriteria=\{selectedCriteria\} userNeed=\{userNeed\}/);
});

test("buying-guide horizontal components remain contained", () => {
  const css = read("css/content-pages-store.css");
  assert.match(css, /\.buying-guides-hub\{overflow-x:clip\}/);
  assert.match(css, /\.guide-search-results,.guide-product-tabs,.guide-quick-nav\{width:100%;contain:inline-size\}/);
  assert.match(css, /\.compare-toggle\{[^}]*max-width:145px/);
});

test("comparison picker renders compact product cards instead of a horizontal strip", () => {
  const guide = read("js/storefront/pages/content-pages/guides.jsx");
  const css = read("css/content-pages-store.css");
  assert.match(guide, /guide-compare-mini-card/);
  assert.match(guide, /guide-mini-image/);
  assert.match(guide, /aria-pressed=\{selected\}/);
  assert.match(css, /\.guide-search-results\{display:grid;grid-template-columns:repeat\(auto-fill,minmax\(155px,1fr\)\)/);
  assert.match(css, /\.guide-mini-copy b\{display:-webkit-box/);
});
