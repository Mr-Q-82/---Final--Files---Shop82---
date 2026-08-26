/* Shared browser platform: auth memory, requests, flags, analytics and observability. */
class ApiError extends Error {
  constructor(message, options = {}) {
    super(message || "خطا در ارتباط با سرور");
    this.name = "ApiError";
    this.status = Number(options.status || 0);
    this.code = options.code || "request_failed";
    this.fields = options.fields || {};
    this.requestId = options.requestId || "";
    this.retryable = Boolean(options.retryable);
    this.cause = options.cause;
  }
}

const AuthTokenVault = (() => {
  let accessToken = localStorage.getItem("access") || "";
  localStorage.removeItem("access");
  localStorage.removeItem("refresh");
  return Object.freeze({
    get: () => accessToken,
    set: (token) => { accessToken = String(token || ""); },
    clear: () => { accessToken = ""; },
    has: () => Boolean(accessToken),
  });
})();

const RequestCoordinator = (() => {
  const inflight = new Map();
  const controllers = new Map();
  return Object.freeze({
    dedupe(key, factory) {
      if (inflight.has(key)) return inflight.get(key);
      const request = Promise.resolve().then(factory).finally(() => inflight.delete(key));
      inflight.set(key, request);
      return request;
    },
    nextController(scope) {
      controllers.get(scope)?.abort();
      const controller = new AbortController();
      controllers.set(scope, controller);
      return controller;
    },
    abort(scope) {
      controllers.get(scope)?.abort();
      controllers.delete(scope);
    },
  });
})();

const QueryStore = (() => {
  const values = new Map();
  const subscribers = new Map();
  const notify = (key) =>
    (subscribers.get(key) || new Set()).forEach((listener) => listener(values.get(key)));
  return Object.freeze({
    fresh(key) {
      const entry = values.get(key);
      return entry && entry.expiresAt > Date.now() ? entry.value : undefined;
    },
    set(key, value, ttl = 60_000) {
      values.set(key, { value, expiresAt: Date.now() + ttl });
      notify(key);
      return value;
    },
    invalidate(prefix = "") {
      [...values.keys()].filter((key) => key.startsWith(prefix)).forEach((key) => values.delete(key));
    },
    subscribe(key, listener) {
      if (!subscribers.has(key)) subscribers.set(key, new Set());
      subscribers.get(key).add(listener);
      return () => subscribers.get(key)?.delete(listener);
    },
  });
})();

const RuntimeSchemas = Object.freeze({
  list(value, label = "فهرست") {
    if (!Array.isArray(value))
      throw new ApiError(`${label} ساختار معتبری ندارد.`, { code: "invalid_response" });
    return value;
  },
  object(value, label = "پاسخ") {
    if (!value || typeof value !== "object" || Array.isArray(value))
      throw new ApiError(`${label} ساختار معتبری ندارد.`, { code: "invalid_response" });
    return value;
  },
  paginated(value) {
    if (Array.isArray(value)) return { results: value, next: null, count: value.length };
    const data = this.object(value, "پاسخ صفحه‌بندی");
    return { ...data, results: this.list(data.results || [], "نتایج") };
  },
});

const FeatureFlags = (() => {
  const defaults = {
    assistant: true, comparison: true, customization: true, gaming: true,
    newsletter: true, wallet: true, analytics: true, offline: true,
  };
  let stored = {};
  try { stored = JSON.parse(localStorage.getItem("shop82:feature-flags") || "{}"); } catch (_) {}
  const flags = { ...defaults, ...stored };
  return Object.freeze({
    enabled: (name) => flags[name] !== false,
    snapshot: () => ({ ...flags }),
  });
})();

const ShopAnalytics = (() => {
  const queue = [];
  const allowed = new Set([
    "page_view", "search", "view_product", "add_to_cart", "remove_from_cart",
    "checkout_start", "payment_success", "payment_failed", "discount_applied", "web_vital",
  ]);
  return Object.freeze({
    track(name, properties = {}) {
      if (!FeatureFlags.enabled("analytics") || !allowed.has(name)) return;
      const safe = Object.fromEntries(
        Object.entries(properties).filter(([key]) => !/phone|email|token|password|customer/i.test(key)),
      );
      const event = { name, properties: safe, at: new Date().toISOString() };
      queue.push(event);
      window.dispatchEvent(new CustomEvent("shop82:analytics", { detail: event }));
    },
    drain: () => queue.splice(0),
  });
})();

const CrossTabChannel = (() => {
  const channel = "BroadcastChannel" in window ? new BroadcastChannel("shop82-session") : null;
  return Object.freeze({
    send: (type, payload = null) => channel?.postMessage({ type, payload, at: Date.now() }),
    listen(listener) {
      if (!channel) return () => {};
      const receive = (event) => listener(event.data || {});
      channel.addEventListener("message", receive);
      return () => channel.removeEventListener("message", receive);
    },
  });
})();

const FrontendMonitor = Object.freeze({
  capture(error, context = {}) {
    const payload = {
      message: String(error?.message || error || "unknown"),
      stack: String(error?.stack || "").slice(0, 4000),
      route: location.pathname,
      build: "v110.3",
      context,
    };
    console.error("Shop82 client error", payload);
    window.dispatchEvent(new CustomEvent("shop82:monitor", { detail: payload }));
  },
  startWebVitals() {
    if (!("PerformanceObserver" in window)) return;
    const report = (metric, value, rating = "") => {
      const payload = {
        metric,
        value: Number(value || 0),
        rating,
        path: location.pathname,
        navigationType: performance.getEntriesByType("navigation")[0]?.type || "navigate",
      };
      ShopAnalytics.track("web_vital", payload);
      const body = JSON.stringify(payload);
      const metricsOrigin = ["5500", "5501", "5173"].includes(location.port)
        ? `${location.protocol}//${location.hostname}:8000`
        : location.origin;
      const metricsUrl = `${metricsOrigin}/api/v1/metrics/web-vitals/`;
      if (!navigator.sendBeacon?.(metricsUrl, new Blob([body], { type: "application/json" }))) {
        fetch(metricsUrl, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
      }
    };
    const thresholds = {
      LCP: [2500, 4000], CLS: [0.1, 0.25], INP: [200, 500], FCP: [1800, 3000], TTFB: [800, 1800],
    };
    const rating = (metric, value) => value <= thresholds[metric][0] ? "good" : value <= thresholds[metric][1] ? "needs-improvement" : "poor";
    const definitions = [
      ["largest-contentful-paint", "LCP"],
      ["layout-shift", "CLS"],
      ["event", "INP"],
      ["paint", "FCP"],
      ["navigation", "TTFB"],
    ];
    definitions.forEach(([type, metric]) => {
      try {
        const observer = new PerformanceObserver((list) => {
          const entries = list.getEntries();
          if (!entries.length) return;
          let value;
          if (metric === "CLS") value = entries.filter((entry) => !entry.hadRecentInput).reduce((sum, entry) => sum + entry.value, 0);
          else if (metric === "INP") value = Math.max(...entries.map((entry) => entry.duration || 0));
          else if (metric === "TTFB") value = entries[0].responseStart || 0;
          else if (metric === "FCP") value = entries.find((entry) => entry.name === "first-contentful-paint")?.startTime;
          else value = entries.at(-1)?.startTime;
          if (Number.isFinite(value)) report(metric, metric === "CLS" ? Number(value.toFixed(4)) : Math.round(value), rating(metric, value));
        });
        observer.observe({ type, buffered: true });
      } catch (_) {}
    });
  },
});

window.addEventListener("error", (event) =>
  FrontendMonitor.capture(event.error || event.message, { source: "window" }),
);
window.addEventListener("unhandledrejection", (event) =>
  FrontendMonitor.capture(event.reason, { source: "promise" }),
);
