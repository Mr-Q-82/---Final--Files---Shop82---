let PRODUCTS = [];
const CatalogRepository = Object.freeze({
  products: () => PRODUCTS,
  categories: () => CATEGORIES,
  replaceProducts(items) {
    PRODUCTS = RuntimeSchemas.list(items, "محصولات");
    QueryStore.set("catalog:products", PRODUCTS, Number.POSITIVE_INFINITY);
    return PRODUCTS;
  },
  replaceCategories(items) {
    CATEGORIES = RuntimeSchemas.list(items, "دسته‌بندی‌ها");
    QueryStore.set("catalog:categories", CATEGORIES, Number.POSITIVE_INFINITY);
    return CATEGORIES;
  },
});
const defaultApiBase = () => {
  if (["5500", "5501", "5173"].includes(location.port))
    return `${location.protocol}//${location.hostname}:8000/api/v1`;
  return `${location.origin}/api/v1`;
};
const API_BASE = localStorage.getItem("api_base") || defaultApiBase();
const API_ORIGIN = new URL(API_BASE, location.origin).origin;
const apiMediaUrl = (value, versioned = true) => {
  if (!value) return null;
  const raw = String(value);
  if (/^(data:|blob:)/i.test(raw)) return raw;
  let resolved;
  try {
    // Media paths returned as `/media/...` belong to Django (port 8000),
    // not to Live Server/Vite (5500/5173).
    resolved = new URL(raw, `${API_ORIGIN}/`).href;
  } catch (_) {
    return raw;
  }
  if (!versioned) return resolved;
  const url = new URL(resolved);
  url.searchParams.set(
    "catalog_v",
    localStorage.getItem("catalog_revision") || "initial",
  );
  return url.href;
};
const normalizeMediaPayload = (value) => {
  if (Array.isArray(value)) return value.map(normalizeMediaPayload);
  if (!value || typeof value !== "object") return value;
  return Object.fromEntries(Object.entries(value).map(([key, item]) => {
    const isMediaField = key === "image" || key === "gaming_image" ||
      key === "logo" || key.endsWith("_image");
    return [key, isMediaField && typeof item === "string"
      ? apiMediaUrl(item)
      : normalizeMediaPayload(item)];
  }));
};
const CATALOG_RESPONSE_CACHE = "shop82-catalog-api-v2";
const catalogRequestCache = new Map();
const catalogRequestInflight = new Map();
// Lives only for the current SPA session. A hard refresh starts with fresh
// requests, while internal route changes reuse the already-built catalog.
const CATALOG_MEMORY_TTL = Number.POSITIVE_INFINITY;
const invalidateCatalogCaches = async () => {
  catalogRequestCache.clear();
  catalogRequestInflight.clear();
  QueryStore.invalidate("catalog:");
  Object.keys(localStorage)
    .filter((key) => key.startsWith("catalog_cache_"))
    .forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem("catalog_cache_categories");
  if ("caches" in window) {
    try {
      await caches.delete(CATALOG_RESPONSE_CACHE);
    } catch (_) {}
  }
};
const wait = (milliseconds) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));
const isCacheableCatalogRequest = (url, options = {}) =>
  (!options.method || options.method === "GET") &&
  String(url).includes("/api/v1/catalog/") &&
  !options.headers?.Authorization;
const cacheCatalogResponse = async (url, response, options = {}) => {
  if (!isCacheableCatalogRequest(url, options) || !("caches" in window)) return;
  try {
    const cache = await caches.open(CATALOG_RESPONSE_CACHE);
    await cache.put(url, response.clone());
  } catch (_) {}
};
const cachedCatalogResponse = async (url, options = {}) => {
  if (!isCacheableCatalogRequest(url, options) || !("caches" in window))
    return null;
  try {
    const cached = await (await caches.open(CATALOG_RESPONSE_CACHE)).match(url);
    if (!cached) return null;
    const cachedAt = Date.parse(cached.headers.get("Date") || "");
    if (cachedAt && Date.now() - cachedAt > 24 * 60 * 60 * 1000) return null;
    return cached;
  } catch (_) {
    return null;
  }
};
const fetchWithRetry = async (url, options = {}, attempts = 6) => {
  if (navigator.onLine === false) {
    const cached = await cachedCatalogResponse(url, options);
    if (cached) return cached;
  }
  let lastError;
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      const response = await fetch(url, {
        // The admin panel can change catalog rows and media at any moment.
        // Always revalidate online; Cache Storage remains an offline fallback.
        cache: "no-store",
        ...options,
      });
      if (response.ok) {
        await cacheCatalogResponse(url, response, options);
        return response;
      }
      const retryable = response.status === 429 || response.status >= 500;
      if (!retryable) {
        const error = new Error(`catalog-${response.status}`);
        error.retryable = false;
        throw error;
      }
      lastError = new Error(`catalog-${response.status}`);
      const retryAfter = Number(response.headers.get("Retry-After") || 0);
      if (attempt < attempts - 1)
        await wait(
          retryAfter > 0
            ? Math.min(retryAfter * 1000, 5000)
            : Math.min(500 * 2 ** attempt, 4000),
        );
    } catch (error) {
      if (error.retryable === false) throw error;
      lastError = error;
      if (attempt < attempts - 1)
        await wait(Math.min(500 * 2 ** attempt, 4000));
    }
  }
  const cached = await cachedCatalogResponse(url, options);
  if (cached) return cached;
  throw lastError || new Error("catalog");
};
const fetchAllPages = async (url, options = {}, attempts = 6) => {
  const cacheable = isCacheableCatalogRequest(url, options);
  const cacheKey = `${url}::${JSON.stringify(options.headers || {})}`;
  const saved = catalogRequestCache.get(cacheKey);
  if (cacheable && saved && Date.now() - saved.at < CATALOG_MEMORY_TTL)
    return saved.rows;
  if (cacheable && catalogRequestInflight.has(cacheKey))
    return catalogRequestInflight.get(cacheKey);
  const request = (async () => {
    const rows = [];
    let next = url;
    while (next) {
      const response = await fetchWithRetry(next, options, attempts);
      const data = normalizeMediaPayload(await response.json());
      if (Array.isArray(data)) {
        const result = [...rows, ...data];
        if (cacheable) catalogRequestCache.set(cacheKey, { at: Date.now(), rows: result });
        return result;
      }
      const page = RuntimeSchemas.paginated(data);
      rows.push(...page.results);
      next = page.next || null;
    }
    if (cacheable) catalogRequestCache.set(cacheKey, { at: Date.now(), rows });
    return rows;
  })();
  if (cacheable) catalogRequestInflight.set(cacheKey, request);
  try {
    return await request;
  } finally {
    if (cacheable) catalogRequestInflight.delete(cacheKey);
  }
};
const fetchFirstPageRows = async (url, options = {}, attempts = 3) => {
  const response = await fetchWithRetry(url, options, attempts);
  const data = normalizeMediaPayload(await response.json());
  return Array.isArray(data) ? data : RuntimeSchemas.paginated(data).results;
};
const fetchCatalogRecord = async (url, options = {}, attempts = 3) => {
  const response = await fetchWithRetry(url, options, attempts);
  return normalizeMediaPayload(await response.json());
};
const displayPhone = (phone = "") =>
  String(phone).startsWith("+98") ? "0" + String(phone).slice(3) : phone;
const accountAjax = new AjaxClient({
  baseUrl: API_BASE,
  timeout: 15000,
  getToken: () => AuthTokenVault.get(),
});
const accountApi = async (path, options = {}) => {
  const publicAuth =
    path.startsWith("/auth/otp/") ||
    path === "/auth/password/login/" ||
    path === "/auth/password/reset/";
  try {
    return await accountAjax.request(path, { ...options, auth: !publicAuth });
  } catch (error) {
    if (error.status === 401 && !publicAuth) {
      AuthTokenVault.clear();
      CrossTabChannel.send("logout");
    }
    const data = error.data || {};
    const details = data?.error?.details || data;
    const first = details && Object.values(details)[0];
    throw new Error(
      details?.detail ||
        (Array.isArray(first) ? first[0] : first) ||
        error.message || "خطا در ارتباط با سرور",
    );
  }
};
const accountApiAll = async (path, options = {}) => {
  const rows = [];
  let next = path;
  while (next) {
    const data = await accountApi(next, options);
    if (Array.isArray(data)) return [...rows, ...data];
    rows.push(...(data.results || []));
    next = data.next || null;
  }
  return rows;
};
const siteConfirm = (message, title = "تأیید عملیات") =>
  new Promise((resolve) => {
    const wrapper = document.createElement("div");
    wrapper.className = "site-confirm-overlay";
    wrapper.innerHTML = `
      <section class="site-confirm glass" role="dialog" aria-modal="true">
        <div class="site-confirm-icon">!</div>
        <h3></h3><p></p>
        <div class="site-confirm-actions">
          <button class="btn btn-ghost cancel" type="button">انصراف</button>
          <button class="btn btn-primary accept" type="button">تأیید</button>
        </div>
      </section>`;
    wrapper.querySelector("h3").textContent = title;
    wrapper.querySelector("p").textContent = message;
    const finish = (value) => {
      wrapper.remove();
      resolve(value);
    };
    wrapper.addEventListener("mousedown", (event) => {
      if (event.target === wrapper) finish(false);
    });
    wrapper.querySelector(".cancel").onclick = () => finish(false);
    wrapper.querySelector(".accept").onclick = () => finish(true);
    document.body.appendChild(wrapper);
    wrapper.querySelector(".cancel").focus();
  });
