/* Pure input normalization helpers. No DOM or network dependencies. */
const toLatinDigits = (value = "") =>
  String(value)
    .replace(/[۰-۹]/g, (digit) => "۰۱۲۳۴۵۶۷۸۹".indexOf(digit))
    .replace(/[٠-٩]/g, (digit) => "٠١٢٣٤٥٦٧٨٩".indexOf(digit));

const normalizeIranPhone = (value = "") => {
  const digits = toLatinDigits(value).replace(/[^0-9+]/g, "");
  if (/^\+989\d{9}$/.test(digits)) return `0${digits.slice(3)}`;
  if (/^989\d{9}$/.test(digits)) return `0${digits.slice(2)}`;
  return digits;
};

const normalizeSearchInput = (value = "") =>
  String(value ?? "")
    .normalize("NFKC")
    .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g, "")
    .replace(/[يى]/g, "ی")
    .replace(/ك/g, "ک")
    .replace(/[ۀة]/g, "ه")
    .replace(/ؤ/g, "و")
    .replace(/[إأ]/g, "ا")
    .replace(/[۰-۹]/g, (digit) => String("۰۱۲۳۴۵۶۷۸۹".indexOf(digit)))
    .replace(/[٠-٩]/g, (digit) => String("٠١٢٣٤٥٦٧٨٩".indexOf(digit)))
    .replace(/[\u200c\u200f\u202a-\u202e]/g, " ")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim()
    .toLocaleLowerCase("fa-IR");

/* Disable browser history/autofill suggestions across storefront and admin.
   New React forms and modal fields are covered by the observer as well. */
const disableBrowserAutocomplete = (root = document) => {
  if (!root || typeof root.querySelectorAll !== "function") return;
  const scope = root;
  const forms = [
    ...(scope.matches?.("form") ? [scope] : []),
    ...scope.querySelectorAll("form"),
  ];
  const fields = [
    ...(scope.matches?.("input, textarea, select") ? [scope] : []),
    ...scope.querySelectorAll("input, textarea, select"),
  ];

  forms.forEach((form) => form.setAttribute("autocomplete", "off"));
  fields.forEach((field) => {
    const type = String(field.getAttribute("type") || "text").toLowerCase();
    if (["hidden", "checkbox", "radio", "file", "range", "color"].includes(type))
      return;
    field.setAttribute(
      "autocomplete",
      type === "search" ? "off" : "new-password",
    );
    field.setAttribute("autocorrect", "off");
    field.setAttribute("autocapitalize", "off");
    field.setAttribute("spellcheck", "false");
  });
};

if (
  typeof document !== "undefined" &&
  typeof document.querySelectorAll === "function" &&
  typeof MutationObserver !== "undefined"
) {
  disableBrowserAutocomplete(document);
  const autocompleteObserver = new MutationObserver((mutations) => {
    mutations.forEach((mutation) =>
      mutation.addedNodes.forEach((node) => {
        if (node.nodeType === Node.ELEMENT_NODE) disableBrowserAutocomplete(node);
      }),
    );
  });
  autocompleteObserver.observe(document.documentElement, {
    childList: true,
    subtree: true,
  });
}
