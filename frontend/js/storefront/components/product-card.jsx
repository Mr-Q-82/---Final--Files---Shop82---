/* ============================================================
   PRODUCT CARD
   ============================================================ */
function CatalogImage({ src, alt, icon = "cpu", width = 640, height = 640, loading = "lazy", ...props }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (!src || failed) {
    const FallbackIcon = I[icon] || I.cpu;
    return <FallbackIcon className="icon" aria-label={alt} />;
  }
  const className = ["catalog-product-image", props.className]
    .filter(Boolean)
    .join(" ");
  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      loading={loading}
      decoding="async"
      onError={() => setFailed(true)}
      {...props}
      className={className}
    />
  );
}

const rememberDirectProduct = (product) => LS.set("direct_product", product);

let productRevealObserver = null;

function observeProductReveal(node) {
  if (!node) return () => {};
  const reduceMotion = window.matchMedia?.(
    "(prefers-reduced-motion: reduce)",
  ).matches;
  if (reduceMotion || !("IntersectionObserver" in window)) {
    node.classList.add("is-revealed");
    return () => {};
  }
  if (!productRevealObserver) {
    productRevealObserver = new IntersectionObserver(
      (entries) => {
        const visibleEntries = entries.filter((entry) => entry.isIntersecting);
        visibleEntries.forEach((entry, index) => {
          entry.target.style.setProperty(
            "--reveal-delay",
            `${Math.min(index * 55, 220)}ms`,
          );
          entry.target.classList.add("is-revealed");
          productRevealObserver.unobserve(entry.target);
        });
      },
      {
        rootMargin: "0px 0px -7% 0px",
        threshold: 0.08,
      },
    );
  }
  productRevealObserver.observe(node);
  return () => productRevealObserver?.unobserve(node);
}

function ProductCard({ p }) {
  const { addToCart, fav, toggleFav, toast, nav } = useStore();
  const cardRef = useRef(null);
  useEffect(() => observeProductReveal(cardRef.current), [p.id]);
  const productHref = routePath("product", p.slug || p.id);
  const rememberProduct = () => rememberDirectProduct(p);
  const openProduct = () => {
    rememberProduct();
    nav("product", p.slug || p.id);
  };
  const handleProductLink = (event) => {
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
      return;
    event.preventDefault();
    openProduct();
  };
  return (
    <div
      ref={cardRef}
      className={`pcard glass product-reveal ${p.stock > 0 ? "is-available" : "is-unavailable"}`}
      role="link"
      tabIndex="0"
      aria-label={`مشاهده جزئیات ${p.name}`}
      onClick={(event) => {
        if (event.defaultPrevented || event.target.closest("a,button")) return;
        openProduct();
      }}
      onKeyDown={(event) => {
        if (event.key === "Enter") openProduct();
      }}
    >
      <button
        className={"fav" + (fav.includes(p.id) ? " on" : "")}
        onClick={() => toggleFav(p.id)}
      >
        {fav.includes(p.id) ? (
          <I.heart className="icon" style={{ width: 18, height: 18 }} />
        ) : (
          <I.heartO className="icon" style={{ width: 18, height: 18 }} />
        )}
      </button>
      {p.stock > 0 && p.off > 0 && (
        <div className="off-badge">{fmt(p.off)}٪</div>
      )}
      <a
        className="thumb"
        href={productHref}
        onClick={handleProductLink}
        aria-label={`مشاهده ${p.name}`}
        style={{ cursor: "pointer" }}
      >
        <CatalogImage src={p.image} alt={p.name} icon={p.icon} loading="lazy" />
      </a>
      <div className="body">
        <div className="pcard-info">
          <span className="cat-lbl">
            {p.catName} · {p.brand}
          </span>
          <a
            className="name"
            href={productHref}
            onClick={handleProductLink}
          >
            {p.name}
          </a>
          <div className="pcard-meta">
            <div className="rate">
              <I.star className="icon" style={{ width: 14, height: 14 }} /> {p.rate}{" "}
              <span>({fmt(p.sold)} فروش)</span>
            </div>
            <span className="stock-state">
              {p.stock > 0 ? "موجود در انبار" : "ناموجود"}
            </span>
          </div>
        </div>
        <div className="price-row">
          {p.stock > 0 ? (
            <>
              <div>
                {p.off > 0 && <div className="old">{fmt(p.price)}</div>}
                <div className="price">
                  {fmt(p.finalPrice)}{" "}
                  <small style={{ fontSize: 11, color: "var(--muted)" }}>
                    تومان
                  </small>
                </div>
              </div>
              <button
                className="addbtn"
                aria-label={`افزودن ${p.name} به سبد خرید`}
                onClick={() => {
                  addToCart(p, { qty: 1 });
                  toast("به سبد خرید اضافه شد");
                }}
              >
                <svg
                  className="addbtn-basket-icon"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path d="M5.7 9.2h12.6l-1.15 9.05a2 2 0 0 1-1.98 1.75H8.83a2 2 0 0 1-1.98-1.75L5.7 9.2Z" />
                  <path d="m8.8 9.2 1.05-4.05M15.2 9.2l-1.05-4.05" />
                  <path d="M12 12.1v4.8M9.6 14.5h4.8" />
                </svg>
              </button>
            </>
          ) : (
            <div
              style={{
                width: "100%",
                padding: "9px 0",
                color: "var(--danger)",
                fontWeight: 900,
                borderTop: "1px solid var(--border)",
              }}
            >
              ناموجود
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ============================================================
   HOME PAGE
   ============================================================ */
