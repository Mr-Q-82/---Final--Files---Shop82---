const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const assert = require("node:assert/strict");
const vm = require("node:vm");

const source = [
  "../js/shared/core/normalizers.js",
  "../js/shared/validation/patterns.js",
  "../js/shared/validation/rules.js",
  "../js/shared/validation/form-validator.js",
  "../js/shared/http/ajax-client.js",
].map((file) => fs.readFileSync(path.join(__dirname, file), "utf8")).join("\n");
const context = {
  XMLHttpRequest: function () {},
  document: { addEventListener() {} },
  HTMLFormElement: function () {},
  HTMLInputElement: function () {},
  HTMLTextAreaElement: function () {},
  HTMLSelectElement: function () {},
};
vm.createContext(context);
vm.runInContext(
  `${source}\nthis.validationApi = { normalizeIranPhone, isValidNationalId, validateValues, AjaxClient, FormValidator };`,
  context,
);
const api = context.validationApi;

test("normalizes Iranian mobile formats", () => {
  assert.equal(api.normalizeIranPhone("+98 912 345 6789"), "09123456789");
  assert.equal(api.normalizeIranPhone("۰۹۱۲۳۴۵۶۷۸۹"), "09123456789");
});

test("validates national id checksum", () => {
  assert.equal(api.isValidNationalId("0013546120"), true);
  assert.equal(api.isValidNationalId("0013546129"), false);
  assert.equal(api.isValidNationalId("1111111111"), false);
});

test("returns field-specific errors and normalized values", () => {
  const result = api.validateValues({ phone: "+989123456789", postal_code: "1111111111" });
  assert.equal(result.valid, false);
  assert.equal(result.values.phone, "09123456789");
  assert.match(result.errors.postal_code, /کد پستی/);
});

test("AJAX and validator behavior is prototype based", () => {
  assert.equal(typeof api.AjaxClient.prototype.request, "function");
  assert.equal(typeof api.FormValidator.prototype.validateForm, "function");
});

test("a field changes from invalid to valid while its value is completed", () => {
  const validator = new api.FormValidator();
  const partial = validator.validateValue("phone", "0912", { optional: false });
  const complete = validator.validateValue("phone", "09123456789", { optional: false });
  assert.equal(partial.valid, false);
  assert.equal(complete.valid, true);
  assert.match(partial.error, /شماره موبایل/);
});

test("auth fields return precise regular-expression errors", () => {
  const result = api.validateValues(
    {
      first_name: "مهدی82",
      phone: "09123",
      referral_code: "abc",
      code: "123",
      new_password: "password",
    },
    {
      first_name: { optional: false },
      phone: { optional: false },
      code: { optional: false },
      new_password: { optional: false },
    },
  );
  assert.equal(result.valid, false);
  assert.match(result.errors.first_name, /بدون عدد/);
  assert.match(result.errors.phone, /09123456789/);
  assert.match(result.errors.referral_code, /۸ تا ۱۶/);
  assert.match(result.errors.code, /۶ رقم/);
  assert.match(result.errors.new_password, /حرف بزرگ/);
});
