/* ============================================================
   PROTOTYPE usage: custom Cart engine
   ============================================================ */
function CartEngine(items) {
  this.items = items || [];
}
CartEngine.prototype.add = function (p, opts) {
  const key =
    p.id +
    "-" +
    (opts?.variantId || "") +
    "-" +
    (opts?.color || "") +
    "-" +
    (opts?.ship || "") + "-" +
    (opts?.customizationOptionIds || []).slice().sort().join("_");
  const ex = this.items.find((x) => x.key === key);
  if (ex) {
    ex.qty = Math.min(
      Number(ex.maxStock || p.stock || Infinity),
      ex.qty + (opts?.qty || 1),
    );
  } else
    this.items.push({
      key,
      id: p.id,
      apiId: p.apiId,
      variantId: opts?.variantId || null,
      customizationOptionIds: opts?.customizationOptionIds || [],
      customizationSummary: opts?.customizationSummary || [],
      slug: p.slug,
      name: p.name,
      icon: p.icon,
      price: p.finalPrice,
      qty: opts?.qty || 1,
      maxStock: Number(opts?.maxStock || p.stock || 0),
      color: opts?.color || "",
      ship: opts?.ship || "عادی",
    });
  return this;
};
CartEngine.prototype.remove = function (key) {
  this.items = this.items.filter((x) => x.key !== key);
  return this;
};
CartEngine.prototype.setQty = function (key, q) {
  const it = this.items.find((x) => x.key === key);
  if (it) it.qty = Math.min(Number(it.maxStock || Infinity), Math.max(1, q));
  return this;
};
CartEngine.prototype.count = function () {
  return this.items.reduce((s, i) => s + i.qty, 0);
};
CartEngine.prototype.subtotal = function () {
  return this.items.reduce((s, i) => s + i.price * i.qty, 0);
};
CartEngine.prototype.tax = function () {
  return Math.round(this.subtotal() * 0.09);
};
CartEngine.prototype.shipping = function () {
  return this.subtotal() > 50000000 ? 0 : 290000;
};
CartEngine.prototype.total = function (disc) {
  return this.subtotal() + this.tax() + this.shipping() - (disc || 0);
};

/* ============================================================
   STORAGE HELPER (LocalStorage)
   ============================================================ */
const LS = {
  get: (k, d) => {
    try {
      const v = localStorage.getItem(k);
      return v ? JSON.parse(v) : d;
    } catch (e) {
      return d;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, JSON.stringify(v));
    } catch (e) {}
  },
};

/* ============================================================
   AJAX helper (XMLHttpRequest + Fetch)
   ============================================================ */
function ajaxGet(url) {
  return new Promise((res, rej) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", url, true);
    xhr.onreadystatechange = function () {
      if (xhr.readyState === 4) {
        xhr.status >= 200 && xhr.status < 300
          ? res(xhr.responseText)
          : rej(xhr.status);
      }
    };
    xhr.onerror = () => rej("network");
    xhr.send();
  });
}
// (نمونه استفاده: در خبرنامه از fetch نیز استفاده می‌شود)

/* ============================================================
   VALIDATION (strict regex)
   ============================================================ */
const RX = {
  name: VALIDATION_PATTERNS.name,
  mobile: VALIDATION_PATTERNS.phone,
  email: VALIDATION_PATTERNS.email,
  pass: VALIDATION_PATTERNS.password,
  melli: VALIDATION_PATTERNS.nationalId,
  postal: VALIDATION_PATTERNS.postalCode,
  otp: VALIDATION_PATTERNS.otp,
};
const validateMelli = isValidNationalId;

/* ============================================================
   GLOBAL STORE (Context)
   ============================================================ */
