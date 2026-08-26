/* Promise-based AJAX transport with JWT, timeout and structured errors. */
function AjaxClient(options = {}) {
  this.baseUrl = options.baseUrl || "";
  this.timeout = options.timeout || 15000;
  this.getToken = options.getToken || (() => AuthTokenVault.get());
  this.getRefreshToken = options.getRefreshToken || (() => null);
  this.setTokens = options.setTokens || ((tokens) => {
    if (tokens.access) AuthTokenVault.set(tokens.access);
  });
  this.onSessionExpired = options.onSessionExpired || (() => {
    AuthTokenVault.clear();
    CrossTabChannel.send("logout");
    window.dispatchEvent(new CustomEvent("shop82:session-expired"));
  });
  this.refreshPromise = null;
}
AjaxClient.prototype.refreshAccessToken = function () {
  if (this.refreshPromise) return this.refreshPromise;
  const refresh = this.getRefreshToken();
  this.refreshPromise = new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", `${this.baseUrl}/auth/token/refresh/`, true);
    xhr.timeout = this.timeout;
    xhr.responseType = "json";
    xhr.withCredentials = true;
    xhr.setRequestHeader("Content-Type", "application/json");
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300 && xhr.response?.access) {
        this.setTokens(xhr.response);
        resolve(xhr.response.access);
      } else reject(new Error("نشست منقضی شده است."));
    };
    xhr.onerror = () => reject(new Error("ارتباط با سرور برقرار نشد."));
    xhr.ontimeout = () => reject(new Error("زمان پاسخ سرور به پایان رسید."));
    xhr.send(JSON.stringify(refresh ? { refresh } : {}));
  }).catch((error) => {
    this.onSessionExpired();
    throw error;
  }).finally(() => { this.refreshPromise = null; });
  return this.refreshPromise;
};
AjaxClient.prototype.request = function (path, options = {}) {
  const client = this;
  const execute = (hasRefreshed = false) => new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = /^https?:\/\//i.test(path) ? path : client.baseUrl + path;
    xhr.open(options.method || "GET", url, true);
    xhr.timeout = options.timeout || client.timeout;
    xhr.responseType = options.responseType || "json";
    xhr.withCredentials = true;
    const token = options.auth === false ? null : client.getToken();
    if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
    if (!(options.body instanceof FormData) && options.body != null) xhr.setRequestHeader("Content-Type", "application/json");
    Object.entries(options.headers || {}).forEach(([name, value]) => xhr.setRequestHeader(name, value));
    const abort = () => xhr.abort();
    if (options.signal) {
      if (options.signal.aborted) return reject(Object.assign(new Error("درخواست لغو شد."), { name: "AbortError" }));
      options.signal.addEventListener("abort", abort, { once: true });
    }
    const cleanup = () => options.signal?.removeEventListener("abort", abort);
    xhr.onload = async () => {
      cleanup();
      const data = xhr.response ?? {};
      if (xhr.status >= 200 && xhr.status < 300) return resolve(data);
      if (xhr.status === 401 && options.auth !== false && !hasRefreshed && !path.includes("/token/refresh/")) {
        try {
          await client.refreshAccessToken();
          return resolve(await execute(true));
        } catch (error) { return reject(error); }
      }
      const contentType = xhr.getResponseHeader("Content-Type") || "";
      const details = data?.error?.details || data;
      const firstMessage = (value) => {
        if (typeof value === "string") return value;
        if (Array.isArray(value)) return firstMessage(value[0]);
        if (value && typeof value === "object") {
          for (const item of Object.values(value)) {
            const found = firstMessage(item);
            if (found) return found;
          }
        }
        return "";
      };
      const message = contentType.includes("text/html")
        ? "خطای داخلی سرور رخ داد. جزئیات را در پنجره اجرای Django بررسی کنید."
        : firstMessage(details) || "درخواست توسط سرور پذیرفته نشد.";
      const error = new ApiError(message, {
        status: xhr.status,
        code: data?.error?.code || "request_failed",
        fields: details,
        requestId: xhr.getResponseHeader("X-Request-ID") || "",
        retryable: xhr.status === 429 || xhr.status >= 500,
      });
      error.data = data;
      reject(error);
    };
    xhr.onerror = () => { cleanup(); reject(Object.assign(new Error("ارتباط با سرور برقرار نشد."), { status: 0 })); };
    xhr.onabort = () => { cleanup(); reject(Object.assign(new Error("درخواست لغو شد."), { name: "AbortError" })); };
    xhr.ontimeout = () => { cleanup(); reject(Object.assign(new Error("زمان پاسخ سرور به پایان رسید؛ دوباره تلاش کنید."), { status: 408 })); };
    xhr.send(options.body ?? null);
  });
  return execute();
};
