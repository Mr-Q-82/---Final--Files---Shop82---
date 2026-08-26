/* ============================================================
   SHOP PAGE (filters + sort + infinite-ish)
   ============================================================ */
const SHOP_FILTERS_KEY = "shop82:filters:regular";
const readShopFilters = () => {
  try {
    const value = JSON.parse(localStorage.getItem(SHOP_FILTERS_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch (_) {
    return {};
  }
};

