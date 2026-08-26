function ContentManager() {
  const [sections, setSections] = useState([]),
    [slides, setSlides] = useState([]),
    [banners, setBanners] = useState([]),
    [editingSection, setEditingSection] = useState(null),
    [editingSlide, setEditingSlide] = useState(null),
    [slidePlacement, setSlidePlacement] = useState("HOME"),
    [slideModal, setSlideModal] = useState(false),
    [editingBanner, setEditingBanner] = useState(null),
    [bannerPlacement, setBannerPlacement] = useState("HOME"),
    [bannerModal, setBannerModal] = useState(false),
    [error, setError] = useState("");
  const load = () =>
    Promise.all([
      apiAll("/catalog/home-sections/?page_size=100"),
      apiAll("/catalog/hero-slides/?page_size=100"),
      apiAll("/catalog/promo-banners/?page_size=100"),
    ])
      .then(([a, b, c]) => {
        setSections(a.results || a);
        setSlides(b.results || b);
        setBanners(c.results || c);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const saveSection = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api(`/catalog/home-sections/${editingSection.key}/`, {
        method: "PATCH",
        body: JSON.stringify({
          title: f.get("title"),
          subtitle: f.get("subtitle"),
          sort_order: Number(f.get("sort_order") || 0),
          is_active: f.has("is_active"),
          product_ordering:
            f.get("product_ordering") ||
            editingSection.product_ordering ||
            "NEWEST",
          product_limit: Number(
            f.get("product_limit") || editingSection.product_limit || 4,
          ),
          slider_interval_seconds: Number(
            f.get("slider_interval_seconds") ||
              editingSection.slider_interval_seconds ||
              5,
          ),
        }),
      });
      setEditingSection(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const openSlide = (item, placement = "HOME") => {
    setEditingSlide(item || null);
    setSlidePlacement(item?.placement || placement);
    setSlideModal(true);
    setError("");
  };
  const saveSlide = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    f.set("metric_type", "CUSTOM");
    f.set("placement", slidePlacement);
    f.set("sort_order", Number(f.get("sort_order") || 0));
    f.set("is_active", f.has("is_active") ? "true" : "false");
    if (!f.get("image")?.size) f.delete("image");
    try {
      await api(
        "/catalog/hero-slides/" + (editingSlide ? editingSlide.id + "/" : ""),
        { method: editingSlide ? "PATCH" : "POST", body: f },
      );
      setSlideModal(false);
      setEditingSlide(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const removeSlide = async (item) => {
    if (!(await siteConfirm(`اسلاید «${item.title}» حذف شود؟`, "حذف اسلاید")))
      return;
    try {
      await api(`/catalog/hero-slides/${item.id}/`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const openBanner = (item, placement = "HOME") => {
    setEditingBanner(item || null);
    setBannerPlacement(item?.placement || placement);
    setBannerModal(true);
    setError("");
  };
  const saveBanner = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    f.set("sort_order", Number(f.get("sort_order") || 0));
    f.set("placement", bannerPlacement);
    f.set("is_active", f.has("is_active") ? "true" : "false");
    if (!f.get("image")?.size) f.delete("image");
    try {
      await api(
        "/catalog/promo-banners/" +
          (editingBanner ? editingBanner.id + "/" : ""),
        { method: editingBanner ? "PATCH" : "POST", body: f },
      );
      setBannerModal(false);
      setEditingBanner(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const removeBanner = async (item) => {
    if (!(await siteConfirm(`بنر «${item.title || "بدون عنوان"}» حذف شود؟`, "حذف بنر")))
      return;
    try {
      await api(`/catalog/promo-banners/${item.id}/`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <>
      {error && <div className="error">{error}</div>}
      <div className="toolbar">
        <button className="add" onClick={() => openSlide(null, "HOME")}>
          + اسلاید صفحه اصلی
        </button>
        <button className="add" onClick={() => openSlide(null, "GAMING")}>
          + اسلاید صفحه گیمینگ
        </button>
      </div>
      <div className="grid">
        <section className="card glass">
          <div className="card-head">
            <h2>اسلایدر عریض بالای صفحه اصلی</h2>
            <span>{fmt(slides.length)} اسلاید</span>
          </div>
          {slides.filter((x) => (x.placement || "HOME") === "HOME").map((x) => (
            <div className="status-row" key={x.id}>
              <p>
                <b>{x.title}</b>
                <small>
                  {x.image ? "تصویر اختصاصی گالری" : `آیکن ${x.icon_name || "gpu"}`} ·{" "}
                  {x.subtitle || "بدون توضیح"}
                </small>
              </p>
              <span className={"pill " + (x.is_active ? "green" : "red")}>
                {x.is_active ? "فعال" : "مخفی"}
              </span>
              <div className="actions">
                <button onClick={() => openSlide(x)}>✎</button>
                <button onClick={() => removeSlide(x)}>⌫</button>
              </div>
            </div>
          ))}
        </section>
        <section className="card glass">
          <div className="card-head">
            <h2>سایر بخش‌های صفحه اصلی</h2>
          </div>
          {sections.map((x) => (
            <div className="status-row" key={x.id}>
              <p>
                <b>{x.title}</b>
                <small>{x.subtitle || "بدون توضیح"}</small>
              </p>
              <button
                className="secondary"
                onClick={() => setEditingSection(x)}
              >
                ویرایش
              </button>
            </div>
          ))}
        </section>
        <section className="card glass promo-banner-admin-card">
          <div className="card-head">
            <div>
              <h2>بنرهای تبلیغاتی صفحه اصلی</h2>
              <small>سه بنر فعال اول بر اساس ترتیب، در یک ردیف نمایش داده می‌شوند.</small>
            </div>
            <button className="add" onClick={() => openBanner(null)}>
              + افزودن بنر
            </button>
          </div>
          <div className="promo-banner-admin-grid">
            {banners.filter((banner) => (banner.placement || "HOME") === "HOME").map((banner) => (
              <article className="promo-banner-admin-item" key={banner.id}>
                <img src={banner.image} alt={banner.title || "بنر تبلیغاتی"} />
                <div>
                  <b>{banner.title || "بدون عنوان نمایشی"}</b>
                  <small>{banner.subtitle || banner.target || "بدون زیرعنوان"}</small>
                </div>
                <span className={"pill " + (banner.is_active ? "green" : "red")}>
                  {banner.is_active ? "فعال" : "مخفی"}
                </span>
                <div className="actions">
                  <button onClick={() => openBanner(banner)}>✎</button>
                  <button onClick={() => removeBanner(banner)}>⌫</button>
                </div>
              </article>
            ))}
            {!banners.some((banner) => (banner.placement || "HOME") === "HOME") && (
              <div className="empty">هنوز بنری برای صفحه اصلی ثبت نشده است.</div>
            )}
          </div>
        </section>
        <section className="card glass promo-banner-admin-card">
          <div className="card-head">
            <div>
              <h2>اسلایدر و بنرهای صفحه گیمینگ</h2>
              <small>تصاویر این بخش فقط در صفحه اختصاصی محصولات گیمینگ نمایش داده می‌شوند.</small>
            </div>
            <div className="actions">
              <button className="add" onClick={() => openSlide(null, "GAMING")}>+ اسلاید</button>
              <button className="add" onClick={() => openBanner(null, "GAMING")}>+ بنر</button>
            </div>
          </div>
          <h3>اسلایدهای بزرگ گیمینگ</h3>
          {slides.filter((x) => x.placement === "GAMING").map((x) => (
            <div className="status-row" key={x.id}>
              <p><b>{x.title}</b><small>{x.subtitle || "بدون زیرعنوان"}</small></p>
              <span className={"pill " + (x.is_active ? "green" : "red")}>{x.is_active ? "فعال" : "مخفی"}</span>
              <div className="actions"><button onClick={() => openSlide(x)}>✎</button><button onClick={() => removeSlide(x)}>⌫</button></div>
            </div>
          ))}
          <h3>بنرهای گیمینگ</h3>
          <div className="promo-banner-admin-grid">
            {banners.filter((x) => x.placement === "GAMING").map((banner) => (
              <article className="promo-banner-admin-item" key={banner.id}>
                <img src={banner.image} alt={banner.title || "بنر گیمینگ"} />
                <div><b>{banner.title || "بدون عنوان"}</b><small>{banner.subtitle || banner.target || "بدون زیرعنوان"}</small></div>
                <span className={"pill " + (banner.is_active ? "green" : "red")}>{banner.is_active ? "فعال" : "مخفی"}</span>
                <div className="actions"><button onClick={() => openBanner(banner)}>✎</button><button onClick={() => removeBanner(banner)}>⌫</button></div>
              </article>
            ))}
          </div>
        </section>
      </div>
      {editingSection && (
        <div className="modal-bg">
          <form className="modal glass" onSubmit={saveSection}>
            <div className="modal-header">
              <h2>ویرایش محتوای صفحه اصلی</h2>
              <button
                type="button"
                className="close"
                onClick={() => setEditingSection(null)}
              >
                ×
              </button>
            </div>
            <div className="field">
              <label>عنوان</label>
              <input
                name="title"
                defaultValue={editingSection.title}
                required
              />
            </div>
            <div className="field">
              <label>زیرعنوان</label>
              <textarea
                name="subtitle"
                defaultValue={editingSection.subtitle}
              />
            </div>
            <div className="field">
              <label>ترتیب</label>
              <input
                name="sort_order"
                type="number"
                defaultValue={editingSection.sort_order}
              />
            </div>
            {["offers", "best_sellers", "newest"].includes(
              editingSection.key,
            ) && (
              <div className="form-grid">
                <div className="field">
                  <label>معیار مرتب‌سازی محصولات</label>
                  <select
                    name="product_ordering"
                    defaultValue={editingSection.product_ordering || "NEWEST"}
                  >
                    <option value="BEST_SELLING">پرفروش‌ترین</option>
                    <option value="NEWEST">جدیدترین</option>
                    <option value="DISCOUNT">بیشترین تخفیف</option>
                    <option value="RATING">بالاترین امتیاز</option>
                    <option value="PRICE_ASC">ارزان‌ترین</option>
                    <option value="PRICE_DESC">گران‌ترین</option>
                  </select>
                </div>
                <div className="field">
                  <label>تعداد محصول قابل نمایش</label>
                  <input
                    name="product_limit"
                    type="number"
                    min="1"
                    max="24"
                    defaultValue={editingSection.product_limit || 4}
                  />
                </div>
                <div className="field">
                  <label>زمان تعویض خودکار اسلایدر (ثانیه)</label>
                  <input
                    name="slider_interval_seconds"
                    type="number"
                    min="2"
                    max="60"
                    defaultValue={editingSection.slider_interval_seconds || 5}
                  />
                </div>
              </div>
            )}
            <label>
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={editingSection.is_active}
              />{" "}
              فعال
            </label>
            <div className="save-row">
              <button
                type="button"
                className="secondary"
                onClick={() => setEditingSection(null)}
              >
                انصراف
              </button>
              <button className="primary">ذخیره</button>
            </div>
          </form>
        </div>
      )}
      {slideModal && (
        <div className="modal-bg">
          <form className="modal glass" onSubmit={saveSlide}>
            <div className="modal-header">
              <h2>{editingSlide ? "ویرایش" : "افزودن"} اسلاید تصویری</h2>
              <button
                type="button"
                className="close"
                onClick={() => setSlideModal(false)}
              >
                ×
              </button>
            </div>
            <div className="form-grid">
              <div className="field full">
                <label>محل نمایش</label>
                <select value={slidePlacement} onChange={(event) => setSlidePlacement(event.target.value)}>
                  <option value="HOME">صفحه اصلی</option>
                  <option value="GAMING">صفحه گیمینگ</option>
                </select>
              </div>
              <div className="field">
                <label>عنوان تصویر</label>
                <input
                  name="title"
                  defaultValue={editingSlide?.title}
                  placeholder="مثلاً نسل جدید لپ‌تاپ‌های حرفه‌ای"
                  required
                />
              </div>
              <div className="field">
                <label>آیکن پیش‌فرض</label>
                <select
                  name="icon_name"
                  defaultValue={editingSlide?.icon_name || "gpu"}
                >
                  <option value="gpu">کارت گرافیک</option>
                  <option value="cpu">پردازنده</option>
                  <option value="ram">حافظه رم</option>
                  <option value="monitor">مانیتور</option>
                  <option value="laptop">لپ‌تاپ</option>
                  <option value="star">ستاره</option>
                </select>
              </div>
              <div className="field full">
                <label>زیرعنوان</label>
                <input name="subtitle" defaultValue={editingSlide?.subtitle} />
              </div>
              <div className="field full upload-box">
                <label>
                  تصویر اسلایدر
                </label>
                <input
                  name="image"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  required={slidePlacement === "HOME" && !editingSlide?.image}
                />
                <small>برای بهترین کیفیت: WebP افقی با ابعاد پیشنهادی ۱۶۰۰×۷۰۰ پیکسل</small>
                {editingSlide?.image && (
                  <img className="image-preview" src={editingSlide.image} />
                )}
              </div>
              <div className="field">
                <label>مقصد کلیک</label>
                <input
                  name="target"
                  dir="ltr"
                  defaultValue={editingSlide?.target}
                  placeholder="shop یا اسلاگ دسته"
                />
              </div>
              <div className="field">
                <label>ترتیب</label>
                <input
                  name="sort_order"
                  type="number"
                  defaultValue={editingSlide?.sort_order || 0}
                />
              </div>
            </div>
            <label>
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={editingSlide?.is_active ?? true}
              />{" "}
              فعال
            </label>
            <div className="save-row">
              <button
                type="button"
                className="secondary"
                onClick={() => setSlideModal(false)}
              >
                انصراف
              </button>
              <button className="primary">ذخیره اسلاید</button>
            </div>
          </form>
        </div>
      )}
      {bannerModal && (
        <div className="modal-bg">
          <form className="modal glass" onSubmit={saveBanner}>
            <div className="modal-header">
              <h2>{editingBanner ? "ویرایش" : "افزودن"} بنر تبلیغاتی</h2>
              <button
                type="button"
                className="close"
                onClick={() => setBannerModal(false)}
              >
                ×
              </button>
            </div>
            <div className="form-grid">
              <div className="field full">
                <label>محل نمایش</label>
                <select value={bannerPlacement} onChange={(event) => setBannerPlacement(event.target.value)}>
                  <option value="HOME">صفحه اصلی</option>
                  <option value="GAMING">صفحه گیمینگ</option>
                </select>
              </div>
              <div className="field full upload-box">
                <label>تصویر بنر (نسبت پیشنهادی ۳ به ۱)</label>
                <input
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp"
                  required={!editingBanner}
                />
                {editingBanner?.image && (
                  <img className="image-preview" src={editingBanner.image} />
                )}
                <small>حداکثر حجم فایل ۵ مگابایت است.</small>
              </div>
              <div className="field">
                <label>عنوان اختیاری روی تصویر</label>
                <input name="title" defaultValue={editingBanner?.title} />
              </div>
              <div className="field">
                <label>زیرعنوان اختیاری</label>
                <input name="subtitle" defaultValue={editingBanner?.subtitle} />
              </div>
              <div className="field">
                <label>لینک مقصد</label>
                <input
                  name="target"
                  dir="ltr"
                  defaultValue={editingBanner?.target}
                  placeholder="/shop/laptop یا https://..."
                />
              </div>
              <div className="field">
                <label>ترتیب نمایش</label>
                <input
                  name="sort_order"
                  type="number"
                  min="0"
                  defaultValue={editingBanner?.sort_order || 0}
                />
              </div>
            </div>
            <label>
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={editingBanner?.is_active ?? true}
              />{" "}
              فعال و قابل نمایش
            </label>
            <div className="save-row">
              <button
                type="button"
                className="secondary"
                onClick={() => setBannerModal(false)}
              >
                انصراف
              </button>
              <button className="primary">ذخیره بنر</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
