function ProductCarousel({ title, products, nav, section, showAll = true }) {
  const trackRef = useRef(null);
  useAutoSlider(trackRef, products.length, section?.slider_interval_seconds);
  useDragToScroll(trackRef);
  const loopProducts =
    products.length > 1 ? [...products, ...products, ...products] : products;
  return (
    <section className="home-products-section">
      <div className="home-section-head">
        <h2 className="section-title">{title}</h2>
        <div className="home-slider-actions">
          <button
            type="button"
            className="slider-arrow"
            aria-label="محصولات قبلی"
            onClick={() => scrollHomeTrack(trackRef, 1)}
          >
            ›
          </button>
          <button
            type="button"
            className="slider-arrow"
            aria-label="محصولات بعدی"
            onClick={() => scrollHomeTrack(trackRef, -1)}
          >
            ‹
          </button>
          {showAll && (
            <button className="btn btn-ghost" onClick={() => nav("shop")}>
              مشاهده همه
            </button>
          )}
        </div>
      </div>
      <div className="product-carousel-shell">
        <div
          className="product-carousel-track"
          ref={trackRef}
          data-auto-interval={section?.slider_interval_seconds || 5}
          data-loop-count={products.length}
        >
          {products.length ? (
            loopProducts.map((product, index) => (
              <ProductCard key={`${product.id}-${index}`} p={product} />
            ))
          ) : (
            <div className="empty-home-products glass">
              محصولی برای نمایش در این بخش وجود ندارد.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

const SHOP_OFFER_PALETTES = {
  laptop: { from: "#2563eb", to: "#06b6d4", accent: "#1d4ed8", tint: "#eff6ff" },
  cpu: { from: "#f97316", to: "#f59e0b", accent: "#ea580c", tint: "#fff7ed" },
  gpu: { from: "#7c3aed", to: "#db2777", accent: "#6d28d9", tint: "#f5f3ff" },
  ram: { from: "#db2777", to: "#f43f5e", accent: "#be185d", tint: "#fdf2f8" },
  ssd: { from: "#059669", to: "#14b8a6", accent: "#047857", tint: "#ecfdf5" },
  monitor: { from: "#0891b2", to: "#3b82f6", accent: "#0e7490", tint: "#ecfeff" },
  mouse: { from: "#4f46e5", to: "#8b5cf6", accent: "#4338ca", tint: "#eef2ff" },
  keyboard: { from: "#334155", to: "#6366f1", accent: "#1e293b", tint: "#f1f5f9" },
  headphone: { from: "#9333ea", to: "#ec4899", accent: "#7e22ce", tint: "#faf5ff" },
  desk: { from: "#0f766e", to: "#14b8a6", accent: "#115e59", tint: "#f0fdfa" },
  chair: { from: "#b45309", to: "#f59e0b", accent: "#92400e", tint: "#fffbeb" },
  "mouse-pad": { from: "#be123c", to: "#8b5cf6", accent: "#9f1239", tint: "#fff1f2" },
  accessories: { from: "#0f766e", to: "#6366f1", accent: "#0f766e", tint: "#f0fdfa" },
  default: { from: "#6d28d9", to: "#0ea5e9", accent: "#6d28d9", tint: "#f5f3ff" },
};

const shopOfferPalette = (categoryId) =>
  SHOP_OFFER_PALETTES[categoryId] || SHOP_OFFER_PALETTES.default;

function ShopOfferCarousel({ title, products, categoryIds = [] }) {
  const { nav } = useStore();
  const { addToCart, toast } = useStore();
  const trackRef = useRef(null);
  useAutoSlider(trackRef, products.length, 6);
  useDragToScroll(trackRef);
  const categoryId = useMemo(() => {
    if (categoryIds.length === 1) return categoryIds[0];
    const counts = products.reduce((result, product) => {
      result[product.cat] = (result[product.cat] || 0) + 1;
      return result;
    }, {});
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || "default";
  }, [categoryIds.join("|"), products]);
  const palette = shopOfferPalette(categoryId);
  const loopProducts =
    products.length > 1 ? [...products, ...products, ...products] : products;
  return (
    <section
      className="shop-showcase"
      aria-label={title}
      data-category={categoryId}
      style={{
        "--showcase-from": palette.from,
        "--showcase-to": palette.to,
        "--showcase-accent": palette.accent,
      }}
    >
      <aside className="shop-showcase-side">
        <div className="shop-showcase-mark">٪</div>
        <h2>{title}</h2>
        <p>منتخب براساس فیلترهای شما</p>
        <button
          type="button"
          onClick={() =>
            document
              .querySelector(".shop-layout")
              ?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
        >
          مشاهده همه
        </button>
      </aside>
      <div className="shop-showcase-track-wrap">
        {products.length > 1 && (
          <>
            <button
              type="button"
              className="shop-showcase-arrow prev"
              aria-label="محصول قبلی"
              onClick={() => scrollHomeTrack(trackRef, 1)}
            >
              ›
            </button>
            <button
              type="button"
              className="shop-showcase-arrow next"
              aria-label="محصول بعدی"
              onClick={() => scrollHomeTrack(trackRef, -1)}
            >
              ‹
            </button>
          </>
        )}
        <div
          className="shop-showcase-products"
          ref={trackRef}
          data-loop-count={products.length}
        >
          {loopProducts.map((product, index) => (
            <a
              className="shop-showcase-product"
              href={routePath("product", product.slug || product.id)}
              onClick={(event) => {
                if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
                  return;
                event.preventDefault();
                rememberDirectProduct(product);
                nav("product", product.slug || product.id);
              }}
              style={{ "--product-tint": shopOfferPalette(product.cat).tint }}
              key={`${product.id}-${index}`}
            >
              <div className="shop-showcase-image">
                <CatalogImage
                  src={product.image}
                  alt={product.name}
                  icon={product.icon}
                  loading="lazy"
                />
              </div>
              <h3>{product.name}</h3>
              <div className="shop-showcase-price">
                <strong>
                  {fmt(product.finalPrice)} <small>تومان</small>
                </strong>
                {product.off > 0 && <span>{fmt(product.off)}٪</span>}
                {product.stock > 0 && (
                  <button
                    type="button"
                    className="offer-add-button"
                    aria-label={`افزودن ${product.name} به سبد خرید`}
                    onClick={(event) => {
                      event.preventDefault();
                      event.stopPropagation();
                      addToCart(product, { qty: 1 });
                      toast("به سبد خرید اضافه شد");
                    }}
                  >
                    <I.plus className="icon" />
                  </button>
                )}
              </div>
              {product.off > 0 && <del>{fmt(product.price)} تومان</del>}
            </a>
          ))}
        </div>
      </div>
    </section>
  );
}

const brandInitials = (name) => {
  const words = String(name || "برند")
    .trim()
    .split(/\s+/)
    .filter(Boolean);
  return (
    words.length > 1
      ? `${words[0][0]}${words[1][0]}`
      : words[0]?.slice(0, 2) || "ب"
  ).toUpperCase();
};
const brandHue = (name) =>
  [...String(name || "")].reduce(
    (total, letter) => (total * 31 + letter.charCodeAt(0)) % 360,
    210,
  );
