function ProductDetailReady({ param, p }) {
  const { addToCart, toast, nav, fav, toggleFav, user } = useStore();
  const customizationGroups = (p.customizationGroups || [])
    .map((group) => ({
      ...group,
      options: (group.options || []).filter((option) => option.is_active !== false),
    }))
    .filter((group) => group.is_active !== false && group.options.length >= 2);
  const hasCustomization = customizationGroups.length > 0;
  const [color, setColor] = useState(p.colors?.[0]?.[0] || "");
  const [ship, setShip] = useState(p.shippingOptions[0]?.name || "عادی");
  const [warranty] = useState(p.warranty);
  const [qty, setQty] = useState(1);
  const [thumb, setThumb] = useState(0);
  const [tab, setTab] = useState("spec");
  const [variantId, setVariantId] = useState(
    p.variants?.find((v) => v.is_active && Number(v.stock) > 0)?.id || "",
  );
  const [customSelections, setCustomSelections] = useState(() =>
    Object.fromEntries(customizationGroups.map((group) => [
      group.id,
      group.options?.find((option) => option.is_default && option.is_active)?.id || "",
    ])),
  );
  const productImages = [p.image, ...(p.gallery || [])].filter(Boolean);
  const currentImage = productImages[thumb] || productImages[0] || null;

  useEffect(() => {
    setColor(p.colors?.[0]?.[0] || "");
    setShip(p.shippingOptions?.[0]?.name || "عادی");
    setVariantId(p.variants?.find((v) => v.is_active && Number(v.stock) > 0)?.id || "");
    setCustomSelections(Object.fromEntries(customizationGroups.map((group) => [
      group.id,
      group.options?.find((option) => option.is_default && option.is_active)?.id || "",
    ])));
  }, [p.apiId, customizationGroups.map((group) => `${group.id}:${group.options.length}`).join("|")]);

  useEffect(() => {
    // save to viewed history (LocalStorage)
    const viewedKey = p.slug || p.apiId || p.id;
    const v = LS.get("viewed", []).filter(
      (item) => String(item) !== String(viewedKey),
    );
    v.unshift(viewedKey);
    LS.set("viewed", v.slice(0, 10));
    setThumb(0);
    accountApi("/operations/events/", {
      method: "POST",
      body: JSON.stringify({
        event_type: "PRODUCT_VIEW",
        product: p.apiId,
        session_key: LS.get("analytics_session", "") || String(Date.now()),
        metadata: { source: document.referrer || "direct" },
      }),
    }).catch(() => {});
  }, [p.id]);

  const shipCost =
    Number(p.shippingOptions.find((option) => option.name === ship)?.cost) || 0;
  const selectedVariant = (p.variants || []).find((x) => x.id === variantId);
  const selectedCustomizationOptions = customizationGroups
    .flatMap((group) => group.options || [])
    .filter((option) => Object.values(customSelections).includes(option.id));
  const customizationPrice = selectedCustomizationOptions.reduce(
    (sum, option) => sum + Number(option.price_delta || 0), 0,
  );
  const price = Number(selectedVariant?.price || p.finalPrice) + customizationPrice + shipCost;
  const availableStock = selectedVariant
    ? Number(selectedVariant.stock)
    : Number(p.baseStock ?? p.stock);
  useEffect(
    () =>
      setQty((current) => Math.max(1, Math.min(current, availableStock || 1))),
    [availableStock],
  );
  const addCompare = async () => {
    if (!user) return nav("auth");
    try {
      await accountApi("/catalog/comparison/", {
        method: "POST",
        body: JSON.stringify({ product: p.apiId }),
      });
      toast("محصول به مقایسه اضافه شد");
      nav("profile", "compare");
    } catch (err) {
      toast(err.message, "error");
    }
  };
  const stockAlert = async () => {
    if (!user) return nav("auth");
    try {
      await accountApi("/catalog/stock-alerts/", {
        method: "POST",
        body: JSON.stringify({ product: p.apiId }),
      });
      toast("پس از موجودشدن به شما اطلاع می‌دهیم");
    } catch (err) {
      toast(err.message, "error");
    }
  };
  const share = async () => {
    const data = { title: p.name, url: location.href };
    if (navigator.share) await navigator.share(data);
    else {
      await navigator.clipboard.writeText(location.href);
      toast("لینک محصول کپی شد");
    }
  };
  const reserveAndAdd = async () => {
    try {
      const missingGroup = customizationGroups.find(
        (group) => group.is_required && !customSelections[group.id],
      );
      if (missingGroup) return toast(`گزینه «${missingGroup.name}» را انتخاب کنید`, "error");
      if (user)
        await accountApi("/operations/reservations/", {
          method: "POST",
          body: JSON.stringify({ product: p.apiId, quantity: qty }),
        });
      addToCart(
        { ...p, finalPrice: price - shipCost, stock: availableStock },
        {
          qty, color, ship, variantId, maxStock: availableStock,
          customizationOptionIds: selectedCustomizationOptions.map((option) => option.id),
          customizationSummary: customizationGroups
            .filter((group) => customSelections[group.id])
            .map((group) => ({
              group: group.name,
              option: group.options.find((option) => option.id === customSelections[group.id])?.name || "",
            })),
        },
      );
      toast("محصول برای ۱۵ دقیقه رزرو و به سبد اضافه شد ✓");
    } catch (err) {
      toast(err.message, "error");
    }
  };
  const similar = ProductSelectors.similar(PRODUCTS, p).slice(0, 4);
  const techSpecs = Object.entries(p.specs || {}).slice(0, 6);
  const oldTotal = (Number(selectedVariant?.price || p.price || price) + shipCost) * qty;
  const saving = Math.max(0, oldTotal - price * qty);
  const requiredConfigurationCount = customizationGroups.filter((group) => group.is_required).length;
  const completedConfigurationCount = customizationGroups.filter((group) => customSelections[group.id]).length;

  return (
    <div className="container">
      <div className="pd-breadcrumb">
        <a onClick={() => nav("home")} style={{ cursor: "pointer" }}>
          خانه
        </a>{" "}
        /{" "}
        <a onClick={() => nav("shop", p.cat)} style={{ cursor: "pointer" }}>
          {p.catName}
        </a>{" "}
        / {p.name}
      </div>
      <div className="pd pd-v2 glass">
        <header className="pd-product-head">
          <div className="pd-head-copy">
            <div className="pd-head-eyebrow">
              <span>{p.brand}</span><i></i><span>{p.catName}</span>
              {hasCustomization && <span className="pd-customizable-badge"><I.cpu className="icon" /> قابل شخصی‌سازی</span>}
            </div>
            <h1>{p.name}</h1>
            <div className="pd-head-meta">
              <span className="pd-rating-chip"><I.star className="icon" /> {p.rate}</span>
              <span>{fmt(p.sold)} فروش</span>
              <span className={p.stock > 0 ? "in-stock" : "out-stock"}>{p.stock > 0 ? "موجود در انبار" : "ناموجود"}</span>
              <span>کد کالا: {p.sku || p.apiId}</span>
            </div>
          </div>
          <div className="pd-head-actions">
            {p.off > 0 && <span className="pd-head-discount">{fmt(p.off)}٪ تخفیف</span>}
            <button type="button" onClick={() => toggleFav(p.id)} aria-label="افزودن به علاقه‌مندی‌ها">
              {fav.includes(p.id) ? <I.heart className="icon active" /> : <I.heartO className="icon" />}
            </button>
            <button type="button" onClick={addCompare} aria-label="مقایسه محصول"><I.board className="icon" /></button>
            <button type="button" onClick={share} aria-label="اشتراک‌گذاری محصول"><I.send className="icon" /></button>
          </div>
        </header>

        <div className="pd-visual-column">
        <div className="pd-gallery">
          <div className="main-img">
            <CatalogImage src={currentImage} alt={p.name} icon={p.icon} width={900} height={900} loading="eager" fetchPriority="high" />
            {p.off > 0 && <div className="off-badge">{fmt(p.off)}٪ تخفیف</div>}
          </div>
          <div className="pd-gallery-strip">
            <div className="pd-gallery-strip-head">
              <b>گالری محصول</b>
              <small>{productImages.length ? `${fmt(productImages.length)} تصویر` : "تصویر اصلی ثبت نشده"}</small>
            </div>
            <div className="thumbs">
            {(productImages.length ? productImages : [null]).map(
              (image, i) => (
                <button
                  type="button"
                  key={i}
                  className={"t" + (thumb === i ? " on" : "")}
                  disabled={!image}
                  onClick={() => setThumb(i)}
                >
                  <CatalogImage
                    width={96}
                    height={96}
                    src={image}
                    alt={`${p.name} - تصویر ${i + 1}`}
                    icon={p.icon}
                  />
                </button>
              ),
            )}
            </div>
          </div>
        </div>
        </div>
        <div className="pd-info">
          {hasCustomization && <div className="pd-selection-intro"><div><span>انتخاب و پیکربندی</span><b>محصول را مطابق نیاز خود آماده کنید</b></div><small>قیمت نهایی همان لحظه محاسبه می‌شود</small></div>}

          {!!p.variants?.length && (
            <div className="opt-row">
              <div className="lbl">مدل / تنوع:</div>
              <div className="opt-pills">
                {Number(p.baseStock) > 0 && (
                  <div className={"opt-pill" + (!variantId ? " on" : "")} onClick={() => setVariantId("")}>
                    مدل اصلی · {fmt(p.baseStock)} موجود
                  </div>
                )}
                {p.variants.filter((x) => x.is_active).map((x) => (
                  <div key={x.id} className={"opt-pill" + (variantId === x.id ? " on" : "")} onClick={() => setVariantId(x.id)}>
                    {x.name} · {Number(x.stock) > 0 ? fmt(x.stock) + " موجود" : "ناموجود"}
                  </div>
                ))}
              </div>
            </div>
          )}

          {hasCustomization && (
            <section className="product-configurator" aria-label="شخصی‌سازی محصول">
              <div className="product-configurator-head">
                <div><b>پیکربندی اختصاصی</b><small>قطعات و مشخصات مورد نیازتان را انتخاب کنید</small></div>
                <div className="pd-config-progress"><span>{completedConfigurationCount}/{customizationGroups.length}</span><small>{customizationPrice ? `+${fmt(customizationPrice)} تومان` : "بدون هزینه اضافه"}</small></div>
              </div>
              {customizationGroups.map((group) => (
                <div className="config-group" key={group.id}>
                  <div className="config-group-title">
                    <b>{group.name}{group.is_required ? " *" : ""}</b>
                    {group.help_text && <small>{group.help_text}</small>}
                  </div>
                  <div className="config-options">
                    {(group.options || []).filter((option) => option.is_active).map((option) => {
                      const unavailable = option.stock !== null && Number(option.stock) <= 0;
                      return <button
                        type="button"
                        disabled={unavailable}
                        className={customSelections[group.id] === option.id ? "selected" : ""}
                        onClick={() => setCustomSelections((current) => ({ ...current, [group.id]: option.id }))}
                        key={option.id}
                      >
                        <i className="config-check">✓</i>
                        <strong>{option.name}</strong>
                        <span>{unavailable ? "ناموجود" : Number(option.price_delta) ? `${Number(option.price_delta) > 0 ? "+" : ""}${fmt(option.price_delta)} تومان` : "قیمت پایه"}</span>
                      </button>;
                    })}
                  </div>
                </div>
              ))}
              <div className="pd-config-summary">
                <div><small>پیکربندی انتخاب‌شده</small><b>{requiredConfigurationCount && completedConfigurationCount < requiredConfigurationCount ? "نیازمند تکمیل" : "آماده ثبت سفارش"}</b></div>
                <div className="pd-config-summary-chips">
                  {selectedCustomizationOptions.length ? selectedCustomizationOptions.map((option) => <span key={option.id}>{option.name}</span>) : <span>پیکربندی پایه</span>}
                </div>
              </div>
            </section>
          )}

          {!!p.colors?.length && <div className="opt-row">
            <div className="lbl">انتخاب رنگ:</div>
            <div className="opt-pills">
              {p.colors.map(([n, c]) => (
                <div
                  key={n}
                  className={"color-dot" + (color === n ? " on" : "")}
                  style={{ background: c }}
                  title={n}
                  onClick={() => setColor(n)}
                />
              ))}
            </div>
            <small style={{ color: "var(--muted)", fontSize: 12 }}>
              رنگ انتخابی: {color}
            </small>
          </div>}

          <div className="opt-row">
            <div className="lbl pd-option-label">
              <I.truck className="icon" /> نوع ارسال:
            </div>
            <div className="opt-pills">
              {p.shippingOptions.map((option) => (
                <div
                  key={option.name}
                  className={"opt-pill" + (ship === option.name ? " on" : "")}
                  onClick={() => setShip(option.name)}
                >
                  {option.name}
                </div>
              ))}
            </div>
          </div>

          <div className="opt-row">
            <div className="lbl pd-option-label">
              <I.shield className="icon" /> گارانتی:
            </div>
            <div className="opt-pills">
              <div className="opt-pill on">{warranty}</div>
            </div>
          </div>
          {p.videoUrl && (
            <a
              className="btn btn-ghost"
              style={{ marginTop: 10, display: "inline-flex" }}
              href={p.videoUrl}
              target="_blank"
            >
              ویدیوی معرفی محصول
            </a>
          )}
          <div className="pd-purchase-dock">
          {availableStock > 0 ? (
            <>
              <div className="pd-dock-price">
                {p.off > 0 && <span className="pd-old-price">{fmt(oldTotal)} تومان</span>}
                <div><strong>{fmt(price * qty)}</strong><span>تومان</span></div>
                {saving > 0 && <small>{fmt(saving)} تومان صرفه‌جویی</small>}
              </div>
              <div className="pd-dock-qty">
                <small>تعداد</small>
                <div className="qty">
                  <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
                  <span>{fmt(qty)}</span>
                  <button disabled={qty >= availableStock} onClick={() => setQty((q) => Math.min(availableStock, q + 1))}>+</button>
                </div>
              </div>
              <button className="btn btn-primary pd-add-to-cart" onClick={reserveAndAdd}>
                <I.cart className="icon" /> افزودن به سبد خرید
              </button>
              <div className="pd-dock-benefits">
                <span><I.truck className="icon" /><b>ارسال {ship}</b></span>
                <span><I.shield className="icon" /><b>{warranty}</b></span>
                <span><I.gift className="icon" /><b>۷ روز بازگشت</b></span>
              </div>
            </>
          ) : (
            <div className="pd-out-of-stock">
              <div><b>این محصول به اتمام رسیده است</b><span>در صورت شارژ دوباره به شما اطلاع می‌دهیم.</span></div>
              <button className="btn btn-primary" onClick={stockAlert}><I.bell className="icon" /> موجود شد به من اطلاع بده</button>
            </div>
          )}
          </div>
          <aside className="pd-tech-rail" aria-label="مشخصات کلیدی محصول">
            <div className="pd-tech-rail-title"><span>مشخصات کلیدی</span><small>خلاصه‌ای برای تصمیم سریع‌تر</small></div>
            {(techSpecs.length
              ? techSpecs
              : [["دسته‌بندی", p.catName], ["برند", p.brand], ["گارانتی", warranty]]
            ).map(([key, value], index) => (
              <div className="pd-tech-item" key={key}>
                <span className="pd-tech-icon">
                  {index % 3 === 0 ? <I.cpu className="icon" /> : index % 3 === 1 ? <I.ram className="icon" /> : <I.shield className="icon" />}
                </span>
                <small>{key}</small>
                <strong>{String(value)}</strong>
              </div>
            ))}
          </aside>
        </div>
      </div>

      <div className="glass pd-detail-content">
        <div className="tabs">
          {[
            ["spec", "مشخصات فنی"],
            ["desc", "توضیحات"],
            ["review", "نظرات کاربران"],
            ["qa", "پرسش و پاسخ"],
          ].map(([k, v]) => (
            <div
              key={k}
              className={"tab" + (tab === k ? " on" : "")}
              onClick={() => setTab(k)}
            >
              {v}
            </div>
          ))}
        </div>
        {tab === "spec" && (
          <table className="spec-table">
            <tbody>
              {Object.entries(p.specs).map(([k, v]) => (
                <tr key={k}>
                  <td>{k}</td>
                  <td>{v}</td>
                </tr>
              ))}
              {!!p.colors?.length && <tr>
                <td>رنگ‌های موجود</td>
                <td>{p.colors.map((c) => c[0]).join("، ")}</td>
              </tr>}
              <tr>
                <td>امتیاز</td>
                <td>{p.rate} از ۵</td>
              </tr>
              {!!p.priceHistory?.length && (
                <tr>
                  <td>آخرین تغییر قیمت</td>
                  <td>
                    {fmt(p.priceHistory[0].price)} تومان ·{" "}
                    {jalaliDate(p.priceHistory[0].created_at)}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
        {tab === "desc" && <ProductExpertDescription product={p} />}
        {tab === "review" && <ProductReviews product={p} />}
        {tab === "qa" && <ProductQuestions product={p} />}
      </div>

      <ProductCarousel
        title="محصولات مشابه"
        products={similar}
        nav={nav}
        section={{ slider_interval_seconds: 6 }}
        showAll={false}
      />
    </div>
  );
}
