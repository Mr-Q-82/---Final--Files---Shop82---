function AmazingOffers({
  section,
  products,
  nav,
  showCountdown = true,
  onViewAll = null,
  className = "",
  themeStyle = null,
}) {
  const { addToCart, toast } = useStore();
  const trackRef = useRef(null);
  useAutoSlider(trackRef, products.length, section?.slider_interval_seconds);
  useDragToScroll(trackRef);
  const loopProducts =
    products.length > 1 ? [...products, ...products, ...products] : products;
  const endingTimes = products
    .map((product) => product.activeFlashSale?.ends_at)
    .filter(Boolean)
    .sort();
  const endsAt = showCountdown
    ? endingTimes[0] || section?.ends_at || null
    : null;
  const [days, hours, minutes, seconds] = useAmazingCountdown(endsAt);
  const timerParts = [days, hours, minutes, seconds].map((value) =>
    String(value).padStart(2, "0"),
  );
  return (
    <section
      className={`home-products-section amazing-shell ${className}`}
      style={themeStyle || undefined}
    >
      <aside className="amazing-side">
        <div className="amazing-mark">٪</div>
        <h2>{section?.title || "پیشنهادهای شگفت‌انگیز"}</h2>
        <p>{section?.subtitle || "تخفیف‌های محدود و زمان‌دار"}</p>
        {showCountdown && endsAt ? (
          <div className="amazing-countdown" aria-label="زمان باقی‌مانده">
            {timerParts.map((part, index) => (
              <React.Fragment key={index}>
                {index > 0 && <b>:</b>}
                <span>{part}</span>
              </React.Fragment>
            ))}
          </div>
        ) : showCountdown ? (
          <small>تا پایان موجودی</small>
        ) : (
          <small>منتخب ویژه برای شما</small>
        )}
        <button
          className="btn"
          onClick={() =>
            onViewAll ? onViewAll() : nav && nav("shop", "off")
          }
        >
          مشاهده همه
        </button>
      </aside>
      <div className="amazing-track-wrap">
        {products.length > 1 && (
          <>
            <button
              type="button"
              className="amazing-arrow prev"
              aria-label="پیشنهاد قبلی"
              onClick={() => scrollHomeTrack(trackRef, 1)}
            >
              ›
            </button>
            <button
              type="button"
              className="amazing-arrow next"
              aria-label="پیشنهاد بعدی"
              onClick={() => scrollHomeTrack(trackRef, -1)}
            >
              ‹
            </button>
          </>
        )}
        <div
          className="amazing-products"
          ref={trackRef}
          data-auto-interval={section?.slider_interval_seconds || 5}
          data-loop-count={products.length}
        >
          {products.length ? (
            loopProducts.map((product, index) => (
              <a
                className="amazing-product"
                href={routePath("product", product.slug || product.id)}
                onClick={(event) => {
                  if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
                    return;
                  event.preventDefault();
                  rememberDirectProduct(product);
                  nav?.("product", product.slug || product.id);
                }}
                key={`${product.id}-${index}`}
              >
                <div className="amazing-image">
                  <CatalogImage
                    src={product.image}
                    alt={product.name}
                    icon={product.icon}
                    loading="lazy"
                  />
                </div>
                <h3>{product.name}</h3>
                <div className="amazing-price-row">
                  <span className="amazing-discount">{fmt(product.off)}٪</span>
                  <strong>
                    {fmt(product.finalPrice)} <small>تومان</small>
                  </strong>
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
                <div className="amazing-old-price">{fmt(product.price)}</div>
              </a>
            ))
          ) : (
            <div className="empty-home-products">
              هنوز فروش ویژه فعالی ثبت نشده است.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

