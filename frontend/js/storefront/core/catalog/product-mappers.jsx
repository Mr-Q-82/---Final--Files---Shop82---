const apiBoolean = (value) =>
  value === true ||
  value === 1 ||
  ["true", "1", "yes", "on"].includes(String(value || "").toLowerCase());

const catalogMediaUrl = (url) => {
  return apiMediaUrl(url);
};

const apiProductToStoreProduct = (item, index) => {
  const category =
    CATEGORIES.find((c) => c.name === item.category_name) ||
    CATEGORIES.find((c) => c.id === item.category_slug) ||
    CATEGORIES[0];
  const gallery = (item.gallery || [])
    .map((image) => catalogMediaUrl(image.image))
    .filter(Boolean);
  const finalPrice = Number(item.final_price || item.price || 0);
  const originalPrice = Number(item.price || 0);
  const effectiveDiscount = originalPrice
    ? Math.max(0, Math.round((1 - finalPrice / originalPrice) * 100))
    : 0;
  return {
    id: index + 1,
    apiId: item.id,
    sku: item.sku || "",
    slug: item.slug,
    cat: category.id,
    catName: item.category_name || category.name,
    icon: category.icon,
    name: item.name,
    brand: item.brand_name || "بدون برند",
    price: originalPrice,
    off: Math.max(Number(item.discount_percent || 0), effectiveDiscount),
    finalPrice,
    activeFlashSale: item.active_flash_sale || null,
    isFeatured: apiBoolean(item.is_featured),
    isGaming:
      apiBoolean(item.is_gaming) || /^GAM-/i.test(String(item.sku || "")),
    rate: Number(item.rating || 0),
    sold: Number(item.sold_count || 0),
    createdAt: item.created_at || "",
    baseStock: Number(item.stock || 0),
    variantStock: Array.isArray(item.variants)
      ? item.variants
          .filter((v) => v.is_active)
          .reduce((sum, v) => sum + Number(v.stock || 0), 0)
      : 0,
    stock:
      Number(item.stock || 0) +
      (Array.isArray(item.variants)
        ? item.variants
            .filter((v) => v.is_active)
            .reduce((sum, v) => sum + Number(v.stock || 0), 0)
        : 0),
    image: catalogMediaUrl(item.image),
    gallery,
    description: item.description || item.short_description || "",
    shortDescription: item.short_description || "",
    colors:
      Array.isArray(item.available_colors) && item.available_colors.length
        ? item.available_colors.map((color) =>
            Array.isArray(color) ? color : [color.name, color.hex || "#6d28d9"],
          )
        : [],
    shippingOptions:
      Array.isArray(item.shipping_options) && item.shipping_options.length
        ? item.shipping_options.map((option) =>
            typeof option === "string" ? { name: option, cost: 0 } : option,
          )
        : [
            { name: "عادی", cost: 0 },
            { name: "سریع", cost: 150000 },
            { name: "ویژه", cost: 320000 },
          ],
    warranty: item.warranty || "۱۸ ماهه شرکتی",
    questions: item.questions || [],
    variants: item.variants || [],
    usageProfileIds: item.usage_profile_ids || [],
    customizationGroups: item.customization_groups || [],
    videoUrl: item.video_url || "",
    priceHistory: item.price_history || [],
    seoTitle: item.seo_title || "",
    seoDescription: item.seo_description || "",
    canonicalUrl: item.canonical_url || "",
    gtin: item.gtin || "",
    mpn: item.mpn || "",
    material: item.material || "",
    productGroupId: item.product_group_id || "",
    weightGrams: Number(item.weight_grams || 0),
    approvedReviews: Number(item.approved_reviews_count || 0),
    specs: {
      برند: item.brand_name || "بدون برند",
      گارانتی: item.warranty || "۱۸ ماهه شرکتی",
      ارسال:
        (item.shipping_options || [])
          .map((option) => (typeof option === "string" ? option : option.name))
          .join("، ") || "۲۴ ساعته",
      دسته: item.category_name || category.name,
      ...(item.specifications || {}),
    },
  };
};
const fmt = (n) => Number(n || 0).toLocaleString("fa-IR");
const jalaliDate = (value, withTime = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
};
