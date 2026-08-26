const defaultApiBase = () => {
  if (["5500", "5501", "5173"].includes(location.port))
    return `${location.protocol}//${location.hostname}:8000/api/v1`;
  return `${location.origin}/api/v1`;
};
const TECHSTORE_API_BASE = localStorage.getItem("api_base") || defaultApiBase();

export async function apiRequest(path, options = {}) {
  const token = AuthTokenVault.get();
  const response = await fetch(`${TECHSTORE_API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.detail || "خطا در ارتباط با سرور");
  return data;
}

export const StoreAPI = {
  products: (params = "") => apiRequest(`/catalog/products/${params}`),
  categories: () => apiRequest("/catalog/categories/"),
  requestOtp: (phone, purpose = "LOGIN") =>
    apiRequest("/auth/otp/request/", {
      method: "POST",
      body: JSON.stringify({ phone, purpose }),
    }),
  verifyOtp: (phone, code, purpose = "LOGIN") =>
    apiRequest("/auth/otp/verify/", {
      method: "POST",
      body: JSON.stringify({ phone, code, purpose }),
    }),
  checkout: (addressId, items) =>
    apiRequest("/orders/checkout/", {
      method: "POST",
      body: JSON.stringify({ address_id: addressId, items }),
    }),
};
