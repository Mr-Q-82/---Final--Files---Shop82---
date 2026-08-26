const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const read = (relative) => fs.readFileSync(path.join(__dirname, "..", relative), "utf8");

test("registration and login tolerate a pending UserSession migration", () => {
  const tokens = read("../backend/apps/accounts/serializer_modules/tokens.py");
  const authentication = read("../backend/apps/accounts/serializer_modules/authentication.py");
  const refresh = read("../backend/apps/accounts/view_modules/authentication.py");
  assert.match(tokens, /session_table_available\(\)/);
  assert.match(tokens, /connection\.introspection\.table_names\(\)/);
  assert.match(authentication, /from \.tokens import issue_user_tokens/);
  assert.match(refresh, /except \(OperationalError, ProgrammingError\)/);
  assert.match(refresh, /serializer\.is_valid\(raise_exception=True\)/);
});

test("admin authentication keeps the original transport error", () => {
  const runtime = read("js/admin/core/runtime.jsx");
  assert.match(runtime, /apiError\(error\.data\) \|\| error\.message/);
  assert.doesNotMatch(runtime, /return pick\([^)]+\) \|\| "خطا در ارتباط با سرور"/);
});
