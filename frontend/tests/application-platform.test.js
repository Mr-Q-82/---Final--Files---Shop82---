const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (file) => fs.readFileSync(path.join(__dirname, "..", file), "utf8");

test("the shared platform provides the professional runtime primitives", () => {
  const source = read("js/shared/runtime/application-platform.js");
  for (const primitive of ["ApiError", "AuthTokenVault", "RequestCoordinator", "QueryStore", "RuntimeSchemas", "FeatureFlags", "ShopAnalytics", "CrossTabChannel", "FrontendMonitor"]) {
    assert.match(source, new RegExp(`(?:class|const) ${primitive}`));
  }
});

test("access and refresh tokens are never persisted by application code", () => {
  const roots = ["js/storefront", "js/admin", "js/shared"];
  const offenders = [];
  const visit = (directory) => {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const full = path.join(directory, entry.name);
      if (entry.isDirectory()) visit(full);
      else if (/\.(?:js|jsx)$/.test(entry.name)) {
        const source = fs.readFileSync(full, "utf8");
        if (/localStorage\.setItem\(["'](?:access|refresh)["']/.test(source)) offenders.push(full);
      }
    }
  };
  roots.forEach((item) => visit(path.join(__dirname, "..", item)));
  assert.deepEqual(offenders, []);
});

test("service worker has bounded runtime caching and explicit update control", () => {
  const source = read("js/service-worker.js");
  assert.match(source, /MAX_RUNTIME_ENTRIES/);
  assert.match(source, /SKIP_WAITING/);
  assert.match(source, /CLEAR_RUNTIME/);
  assert.match(source, /cache: "no-store"/);
});

test("session restoration uses the HttpOnly refresh-cookie request path", () => {
  const store = read("js/storefront/store/store/provider/part-01.jsx");
  assert.match(store, /accountApi\("\/auth\/me\/"\)/);
  assert.match(store, /AuthTokenVault\.clear\(\)/);
});
