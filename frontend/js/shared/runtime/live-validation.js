/* DOM adapter: validates while typing without coupling rules to React pages. */
const liveValidationTimers = new WeakMap();
const isValidatableControl = (input) =>
  input instanceof HTMLInputElement ||
  input instanceof HTMLTextAreaElement ||
  input instanceof HTMLSelectElement;

const validateLiveControl = (input) => {
  if (!isValidatableControl(input) || !input.name || input.disabled) return true;
  const result = formValidator.validateInput(input);
  formValidator.renderFieldError(input, result.error);
  return result.valid;
};

document.addEventListener("submit", (event) => {
  if (!(event.target instanceof HTMLFormElement)) return;
  if (!formValidator.validateForm(event.target)) {
    event.preventDefault();
    event.stopImmediatePropagation();
  }
}, true);

document.addEventListener("input", (event) => {
  const input = event.target;
  if (!isValidatableControl(input) || !input.name) return;
  clearTimeout(liveValidationTimers.get(input));
  liveValidationTimers.set(input, setTimeout(() => validateLiveControl(input), 120));
}, true);

document.addEventListener("change", (event) => validateLiveControl(event.target), true);
document.addEventListener("blur", (event) => validateLiveControl(event.target), true);
