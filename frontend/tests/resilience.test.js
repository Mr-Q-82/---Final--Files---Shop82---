const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relativePath) => {
  const source = fs.readFileSync(path.join(__dirname, relativePath), "utf8");
  if (!source.startsWith("// Compatibility manifest.")) return source;
  return [...source.matchAll(/^\/\/ (\/js\/[^\n]+)/gm)]
    .map((match) => fs.readFileSync(path.join(__dirname, "..", match[1]), "utf8"))
    .join("\n");
};

test("authenticated requests refresh an expired access token only once", () => {
  const source = read("../js/shared/http/ajax-client.js");
  assert.match(source, /refreshPromise/);
  assert.match(source, /xhr\.status === 401/);
  assert.match(source, /await client\.refreshAccessToken\(\)/);
  assert.match(source, /options\.signal/);
});

test("both applications are protected by an error boundary", () => {
  const storefront = read("../js/storefront/app.jsx");
  const admin = read("../js/admin/app.jsx");
  assert.match(storefront, /<AppErrorBoundary>/);
  assert.match(admin, /<AppErrorBoundary>/);
});

test("unknown clean routes render an index-safe 404 state", () => {
  const store = read("../js/storefront/store/store.jsx");
  const app = read("../js/storefront/app.jsx");
  assert.match(store, /name: "not-found"/);
  assert.match(app, /function NotFoundPage/);
});

test("notifications refresh while the signed-in app remains open", () => {
  const store = read("../js/storefront/store/store.jsx");
  assert.match(store, /setInterval\(\(\) => loadNotifications\(true\), 30000\)/);
  assert.match(store, /visibilitychange/);
  assert.ok(
    store.indexOf("const toast = useCallback") < store.indexOf("[user, toast]"),
    "toast must be initialized before React evaluates the notification effect dependencies",
  );
});

test("refresh tokens use credentialed HttpOnly cookie transport", () => {
  const client = read("../js/shared/http/ajax-client.js");
  const auth = read("../js/storefront/pages/auth.jsx");
  assert.match(client, /xhr\.withCredentials = true/);
  assert.doesNotMatch(auth, /setItem\("refresh"/);
});

test("admin image inputs receive drag validation and preview state", () => {
  const runtime = read("../js/shared/runtime/resilience.jsx");
  const admin = read("../js/admin/app.jsx");
  assert.match(runtime, /function useEnhancedFileInputs/);
  assert.match(runtime, /10 \* 1024 \* 1024/);
  assert.match(admin, /useEnhancedFileInputs\(\)/);
});
