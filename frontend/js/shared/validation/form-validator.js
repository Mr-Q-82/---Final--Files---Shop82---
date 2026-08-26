/* Reusable prototype-based validation engine. */
function FormValidator(rules = FIELD_RULES) {
  this.rules = rules;
}
FormValidator.prototype.validateValue = function (name, rawValue, overrides = {}) {
  const rule = { ...(this.rules[name] || {}), ...overrides };
  let value = String(rawValue ?? "").trim();
  if (rule.normalize) value = rule.normalize(value);
  if (rule.transform) value = rule.transform(value);
  if (!value && rule.optional) return { valid: true, value, error: "" };
  if (!value) return { valid: false, value, error: rule.requiredMessage || "تکمیل این فیلد الزامی است." };
  const pattern = rule.pattern && VALIDATION_PATTERNS[rule.pattern];
  const valid =
    (!rule.min || value.length >= rule.min) &&
    (!rule.max || value.length <= rule.max) &&
    (!pattern || pattern.test(value)) &&
    (!rule.custom || rule.custom(value));
  return { valid, value, error: valid ? "" : rule.message || "مقدار واردشده معتبر نیست." };
};
FormValidator.prototype.validateNativeValue = function (input) {
  const value = String(input.value || "").trim();
  let error = "";
  if (input.required && !value) error = "تکمیل این فیلد الزامی است.";
  else if (value && input.type === "email" && !VALIDATION_PATTERNS.email.test(value)) error = "ساختار ایمیل معتبر نیست.";
  else if (value && input.type === "number" && !Number.isFinite(Number(value))) error = "مقدار عددی معتبر وارد کنید.";
  else if (value && input.min !== "" && Number(value) < Number(input.min)) error = `مقدار نمی‌تواند کمتر از ${input.min} باشد.`;
  else if (value && input.max !== "" && Number(value) > Number(input.max)) error = `مقدار نمی‌تواند بیشتر از ${input.max} باشد.`;
  else if (value && input.maxLength > -1 && value.length > input.maxLength) error = `حداکثر ${input.maxLength} نویسه مجاز است.`;
  else if (value && input.pattern) {
    try {
      if (!new RegExp(`^(?:${input.pattern})$`, "u").test(value)) error = input.title || "فرمت مقدار واردشده صحیح نیست.";
    } catch (_) {}
  }
  return { valid: !error, value, error };
};
FormValidator.prototype.validateInput = function (input) {
  const rule = this.rules[input.name];
  return rule
    ? this.validateValue(input.name, input.value, { optional: !input.required && rule.optional !== false })
    : this.validateNativeValue(input);
};
FormValidator.prototype.validateValues = function (values, overrides = {}) {
  const normalized = { ...values };
  const errors = {};
  Object.keys(values).forEach((name) => {
    if (!this.rules[name] && !overrides[name]) return;
    const result = this.validateValue(name, values[name], overrides[name]);
    normalized[name] = result.value;
    if (!result.valid) errors[name] = result.error;
  });
  return { valid: Object.keys(errors).length === 0, values: normalized, errors };
};
FormValidator.prototype.renderFieldError = function (input, message = "") {
  if (!input) return;
  const field = input.closest(".field") || input.parentElement;
  if (!field) return;
  const node = field.querySelector(":scope > .field-validation-message");
  if (node) {
    node.textContent = message;
    node.hidden = !message;
  }
  field.dataset.validationMessage = node ? "" : message;
  input.setAttribute("aria-invalid", message ? "true" : "false");
  field.classList.toggle("field-invalid", Boolean(message));

  const type = String(input.type || "text").toLowerCase();
  const supportsValidState = ![
    "hidden", "checkbox", "radio", "file", "range", "color",
    "button", "submit", "reset",
  ].includes(type);
  const hasValue = String(input.value ?? "").trim().length > 0;
  const isValid = supportsValidState && hasValue && !message && !input.disabled;

  input.dataset.validationState = message
    ? "invalid"
    : isValid
      ? "valid"
      : "pristine";
  field.classList.toggle("field-valid", isValid);
};
FormValidator.prototype.validateForm = function (form, options = {}) {
  let valid = true;
  Array.from(form.elements || []).forEach((input) => {
    if (!input.name || input.disabled || ["hidden", "button", "submit"].includes(input.type)) return;
    const result = this.validateInput(input);
    this.renderFieldError(input, result.error);
    if (result.valid && input.value !== result.value) input.value = result.value;
    valid = result.valid && valid;
  });
  if (!valid && options.focus !== false) form.querySelector('[aria-invalid="true"]')?.focus();
  return valid;
};

const formValidator = new FormValidator();
const validateValues = (values, overrides) => formValidator.validateValues(values, overrides);

/* React adapter used by controlled forms for immediate field-level feedback. */
function useValidationErrors() {
  const [fieldErrors, setFieldErrors] = React.useState({});

  const validateField = (name, value, overrides = {}) => {
    const result = formValidator.validateValue(name, value, overrides);
    setFieldErrors((current) => ({
      ...current,
      [name]: result.error,
    }));
    return result;
  };

  const validateFields = (values, overrides = {}) => {
    const result = formValidator.validateValues(values, overrides);
    setFieldErrors((current) => {
      const next = { ...current };
      Object.keys(values).forEach((name) => {
        next[name] = result.errors[name] || "";
      });
      return next;
    });
    return result;
  };

  const clearFieldErrors = () => setFieldErrors({});
  return { fieldErrors, validateField, validateFields, clearFieldErrors };
}
