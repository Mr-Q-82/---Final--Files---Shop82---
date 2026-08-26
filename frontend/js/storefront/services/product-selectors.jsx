/* ============================================================
   PRODUCT VISIBILITY RULES
   ============================================================ */
const SEARCH_ALIASES = Object.freeze({
  "لپ تاپ": ["لپتاپ", "لب تاپ", "لبتاب", "notebook", "laptop"],
  "کارت گرافیک": ["گرافیک", "gpu", "vga"],
  "پردازنده": ["سی پی یو", "cpu", "processor"],
  "حافظه رم": ["رم", "ram", "memory"],
  "حافظه ssd": ["اس اس دی", "ssd", "nvme"],
  "هارد hdd": ["هارد", "hdd", "hard disk"],
  "مادربرد": ["مادر برد", "motherboard", "mainboard"],
  "هدفون": ["هدست", "ایرفون", "headphone", "headset"],
  "کیبورد": ["صفحه کلید", "keyboard"],
  "ماوس": ["موس", "mouse"],
  "موس پد": ["موس‌پد", "ماوس پد", "ماوس‌پد", "mouse pad", "mousepad", "desk mat"],
  "میز کامپیوتر": ["میز", "میز گیمینگ", "gaming desk", "computer desk"],
  "صندلی کامپیوتر": ["صندلی", "صندلی گیمینگ", "gaming chair", "office chair"],
  "مانیتور": ["نمایشگر", "monitor", "display"],
  "کیس": ["case", "chassis"],
  "فن و کول پد": ["کول پد", "خنک کننده", "cooling pad", "fan"],
  "لوازم جانبی": ["اکسسوری", "لوازم کامپیوتر", "هاب", "مبدل", "کابل", "شارژر", "وب کم", "webcam", "accessories"],
});

const normalizeSearchText = typeof normalizeSearchInput === "function"
  ? normalizeSearchInput
  : (value = "") => String(value ?? "")
      .normalize("NFKC")
      .replace(/[يى]/g, "ی")
      .replace(/ك/g, "ک")
      .replace(/[ۀة]/g, "ه")
      .replace(/[\u200c\u200f]/g, " ")
      .replace(/[^\p{L}\p{N}]+/gu, " ")
      .trim()
      .toLocaleLowerCase("fa-IR");

const SEARCH_CATEGORY_PHRASES = Object.entries(SEARCH_ALIASES)
  .flatMap(([category, aliases]) =>
    [category, ...aliases].map((phrase) => ({
      category: normalizeSearchText(category),
      phrase: normalizeSearchText(phrase),
      alternatives: [category, ...aliases].map(normalizeSearchText),
    })),
  )
  .filter((item) => item.phrase)
  .sort((first, second) => second.phrase.length - first.phrase.length);

const containsSearchPhrase = (text, phrase) =>
  ` ${normalizeSearchText(text)} `.includes(` ${normalizeSearchText(phrase)} `);

const resolveSearchCategory = (query) => {
  const normalized = normalizeSearchText(query);
  return SEARCH_CATEGORY_PHRASES.find((item) =>
    containsSearchPhrase(normalized, item.phrase),
  ) || null;
};

const searchTokenGroups = (query, categoryIntent = null) => {
  let normalized = normalizeSearchText(query);
  if (!normalized) return [];
  if (categoryIntent)
    normalized = ` ${normalized} `
      .replace(` ${categoryIntent.phrase} `, " ")
      .trim();
  if (!normalized) return [];
  return normalized.split(/\s+/).map((token) => {
    const aliases = Object.entries(SEARCH_ALIASES)
      .filter(([label, values]) =>
        [label, ...values]
          .map(normalizeSearchText)
          .some((value) => value === token),
      )
      .flatMap(([label, values]) => [label, ...values])
      .map(normalizeSearchText);
    return [...new Set([token, ...aliases])];
  });
};

const productSearchText = (product) =>
  normalizeSearchText([
    product?.name,
    product?.brand,
    product?.catName,
    product?.cat,
    product?.sku,
    product?.description,
    product?.shortDescription,
    ProductSelectors?.isGaming?.(product) ? "گیمینگ gaming" : "عادی regular",
    ...Object.keys(product?.specs || {}),
    ...Object.values(product?.specs || {}),
    ...(product?.variants || []).flatMap((variant) => [variant?.name, variant?.sku]),
    ...(product?.customizationGroups || []).flatMap((group) => [
      group?.name,
      group?.title,
      ...(group?.options || []).map((option) => option?.name || option?.title),
    ]),
  ].filter(Boolean).join(" "));

const ProductSelectors = Object.freeze({
  normalizeSearchText,

  queryRequestsGaming(query) {
    const tokens = normalizeSearchText(query).split(" ").filter(Boolean);
    return tokens.some((token) => ["گیمینگ", "gaming", "game"].includes(token));
  },

  searchCategory(query) {
    return resolveSearchCategory(query)?.category || "";
  },

  matchesSearch(product, query) {
    const categoryIntent = resolveSearchCategory(query);
    if (categoryIntent) {
      const productCategories = [product?.catName, product?.cat]
        .filter(Boolean)
        .map(normalizeSearchText);
      if (!productCategories.some((value) =>
        categoryIntent.alternatives.includes(value))) return false;
    }
    const groups = searchTokenGroups(query, categoryIntent);
    if (!groups.length) return Boolean(categoryIntent) || !normalizeSearchText(query);
    const haystack = productSearchText(product);
    return groups.every((alternatives) =>
      alternatives.some((token) => {
        if (containsSearchPhrase(haystack, token)) return true;
        // Live search must work from the very first character. Short terms are
        // intentionally matched as substrings; longer terms also get prefix
        // matching so incomplete product names keep producing useful results.
        if (token.length < 3) return haystack.includes(token);
        return haystack.split(" ").some((word) => word.startsWith(token));
      }),
    );
  },

  searchScore(product, query) {
    if (!this.matchesSearch(product, query)) return -1;
    const term = normalizeSearchText(query);
    const name = normalizeSearchText(product?.name);
    const category = normalizeSearchText(product?.catName);
    const brand = normalizeSearchText(product?.brand);
    let score = 10;
    if (name === term) score += 240;
    else if (name.startsWith(term)) score += 170;
    else if (name.split(" ").some((word) => word.startsWith(term))) score += 125;
    else if (name.includes(term)) score += 90;
    if (category === term || category.startsWith(term)) score += 100;
    else if (category.includes(term)) score += 55;
    if (brand === term || brand.startsWith(term)) score += 75;
    else if (brand.includes(term)) score += 35;
    score += Math.min(Number(product?.sold || 0) / 20, 20);
    score += Number(product?.stock || 0) > 0 ? 8 : 0;
    return score;
  },

  search(products = PRODUCTS, query = "", limit = Infinity) {
    const term = normalizeSearchText(query);
    if (!term) return [];
    return products
      .map((product) => ({ product, score: this.searchScore(product, term) }))
      .filter((item) => item.score >= 0)
      .sort((first, second) => second.score - first.score)
      .slice(0, limit)
      .map((item) => item.product);
  },
  isGaming(product) {
    if (!product) return false;
    const sku = String(product.sku || "").trim();
    return Boolean(product.isGaming) || /^GAM-/i.test(sku);
  },

  regular(products = PRODUCTS) {
    return products.filter((product) => !this.isGaming(product));
  },

  gaming(products = PRODUCTS) {
    return products.filter((product) => this.isGaming(product));
  },

  featured(products = PRODUCTS) {
    return products.filter(
      (product) => Boolean(product.isFeatured) && Number(product.stock) > 0,
    );
  },

  featuredBalanced(products = PRODUCTS, limit = 12) {
    const groups = new Map();
    this.featured(products)
      .sort((a, b) => b.off - a.off || b.sold - a.sold)
      .forEach((product) => {
        const key = String(product.cat || "other");
        if (!groups.has(key)) groups.set(key, []);
        groups.get(key).push(product);
      });
    const result = [];
    while (result.length < limit && [...groups.values()].some((rows) => rows.length)) {
      for (const rows of groups.values()) {
        if (rows.length && result.length < limit) result.push(rows.shift());
      }
    }
    return result;
  },

  inCategory(products, categoryId) {
    if (!categoryId) return [...products];
    return products.filter(
      (product) => String(product.cat) === String(categoryId),
    );
  },

  similar(products, sourceProduct) {
    if (!sourceProduct) return [];
    return products.filter(
      (product) =>
        String(product.id) !== String(sourceProduct.id) &&
        String(product.cat) === String(sourceProduct.cat) &&
        this.isGaming(product) === this.isGaming(sourceProduct),
    );
  },
});
