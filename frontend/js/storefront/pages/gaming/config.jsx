/* ============================================================
   GAMING LANDING PAGE
   ============================================================ */
const GAMING_DEFAULT_SLIDES = [
  { id: "gaming-default-gpu", title: "تجهیزات گرافیکی گیمینگ", icon_name: "gpu" },
  { id: "gaming-default-cpu", title: "پردازنده‌های گیمینگ", icon_name: "cpu" },
  { id: "gaming-default-monitor", title: "مانیتورهای گیمینگ", icon_name: "monitor" },
  { id: "gaming-default-laptop", title: "لپ‌تاپ‌های گیمینگ", icon_name: "laptop" },
];

const normalizeGamingSlides = (rows) => {
  const activeSlides = rows.filter((slide) => slide.is_active).slice(0, 4);
  const missingCount = Math.max(0, 4 - activeSlides.length);
  return [
    ...activeSlides,
    ...GAMING_DEFAULT_SLIDES.slice(0, missingCount),
  ].slice(0, 4);
};

const GAMING_FILTERS_KEY = "shop82:filters:gaming";
const readGamingFilters = () => {
  try {
    const value = JSON.parse(localStorage.getItem(GAMING_FILTERS_KEY) || "{}");
    return value && typeof value === "object" ? value : {};
  } catch (_) {
    return {};
  }
};

