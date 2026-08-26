function Taxonomies() {
  const [cats, setCats] = useState([]),
    [brands, setBrands] = useState([]),
    [loading, setLoading] = useState(true),
    [modal, setModal] = useState(null),
    [editing, setEditing] = useState(null),
    [imagePreview, setImagePreview] = useState(""),
    [gamingImagePreview, setGamingImagePreview] = useState(""),
    [error, setError] = useState(""),
    [csvMessage, setCsvMessage] = useState("");
  const load = () =>
    Promise.all([
      apiAll("/catalog/categories/?page_size=100"),
      apiAll("/catalog/brands/?page_size=100"),
    ])
      .then(([c, b]) => {
        setCats(c.results || c);
        setBrands(b.results || b);
      })
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const save = async (e) => {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget),
      type = modal,
      path = type === "brand" ? "/catalog/brands/" : "/catalog/categories/";
    let body = new FormData();
    if (type !== "gaming-category") {
      body.set("name", f.get("name"));
      body.set("slug", f.get("slug"));
      body.set("is_active", f.has("is_active") ? "true" : "false");
    }
    if (type === "category") {
      body.set("icon", f.get("icon"));
      body.set("sort_order", String(Number(f.get("sort_order") || 0)));
      body.set(
        "subcategories",
        JSON.stringify(
          String(f.get("subcategories") || "")
            .split("\\n")
            .map((x) => x.trim())
            .filter(Boolean),
        ),
      );
      const image = f.get("image");
      if (image?.size) body.set("image", image);
      body.set("remove_image", f.has("remove_image") ? "true" : "false");
      for (const field of ["seo_title", "seo_description", "intro_text", "buying_guide"]) body.set(field, f.get(field) || "");
      try {
        body.set("faq_items", JSON.stringify(JSON.parse(String(f.get("faq_items") || "[]"))));
      } catch (_) {
        setError("ساختار JSON پرسش‌های متداول معتبر نیست.");
        return;
      }
    } else if (type === "gaming-category") {
      const gamingImage = f.get("gaming_image");
      if (gamingImage?.size) body.set("gaming_image", gamingImage);
      body.set(
        "remove_gaming_image",
        f.has("remove_gaming_image") ? "true" : "false",
      );
    } else {
      const logo = f.get("logo");
      if (logo?.size) body.set("logo", logo);
    }
    try {
      await api(path + (editing ? editing.slug + "/" : ""), {
        method: editing ? "PATCH" : "POST",
        body,
      });
      setModal(null);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const remove = async (type, item) => {
    const label = type === "category" ? "دسته‌بندی" : "برند";
    if (
      !(await siteConfirm(
        `آیا از حذف «${item.name}» مطمئن هستید؟`,
        `حذف ${label}`,
      ))
    )
      return;
    try {
      await api(
        `${type === "category" ? "/catalog/categories/" : "/catalog/brands/"}${item.slug}/`,
        { method: "DELETE" },
      );
      await load();
    } catch (err) {
      setError(err.message);
    }
  };
  const importBrands = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setError("");
    setCsvMessage("در حال پردازش فایل برندها...");
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await api("/catalog/brands/import-csv/", {
        method: "POST",
        body,
      });
      const summary = `${result.created || 0} برند ساخته و ${result.updated || 0} برند بروزرسانی شد.`;
      setCsvMessage(
        result.failed
          ? `${summary} ${result.failed} ردیف خطا داشت: ${(result.errors || []).map((x) => `ردیف ${x.row}: ${x.message}`).join(" | ")}`
          : summary,
      );
      await load();
    } catch (err) {
      setCsvMessage("");
      setError(err.message);
    }
  };
  if (loading) return <div className="loading"></div>;
  const open = (type, item = null) => {
    setEditing(item);
    setImagePreview(type === "category" ? item?.image || "" : "");
    setGamingImagePreview(
      type === "gaming-category" ? item?.gaming_image || "" : "",
    );
    setModal(type);
    setError("");
  };
  const list = (title, type, items) => (
    <section className="card glass">
      <div className="card-head">
        <h2>{title}</h2>
        {type !== "gaming-category" && (
          <button onClick={() => open(type)}>+ افزودن</button>
        )}
      </div>
      {items.length ? (
        items.map((x) => (
          <div className="status-row" key={x.id}>
            <span
              className="status-dot"
              style={{
                background: x.is_active ? "var(--success)" : "var(--muted)",
              }}
            ></span>
            <p>
              {type === "brand" && (
                <span className="admin-brand-mini" aria-hidden="true">
                  {x.logo ? (
                    <img src={x.logo} alt="" />
                  ) : (
                    x.name.trim().slice(0, 2)
                  )}
                </span>
              )}
              {type === "category" && (
                <span className="admin-category-mini" aria-hidden="true">
                  {x.image ? <img src={x.image} alt="" /> : x.name.trim().slice(0, 1)}
                </span>
              )}
              {type === "gaming-category" && (
                <span className="admin-category-mini gaming" aria-hidden="true">
                  {x.gaming_image ? (
                    <img src={x.gaming_image} alt="" />
                  ) : (
                    x.name.trim().slice(0, 1)
                  )}
                </span>
              )}
              <b>{x.name}</b>
              <small dir="ltr">{x.slug}</small>
            </p>
            <div className="actions">
              <button onClick={() => open(type, x)}>✎</button>
              {type !== "gaming-category" && (
                <button onClick={() => remove(type, x)}>⌫</button>
              )}
            </div>
          </div>
        ))
      ) : (
        <div className="empty">موردی ثبت نشده است.</div>
      )}
    </section>
  );
  return (
    <>
      <div className="toolbar">
        <button
          className="secondary"
          onClick={() =>
            downloadFile("/catalog/brands/template-csv/", "brands-template.csv")
          }
        >
          دانلود نمونه برندها
        </button>
        <button
          className="secondary"
          onClick={() =>
            downloadFile("/catalog/brands/export-csv/", "brands.csv")
          }
        >
          خروجی برندها
        </button>
        <label className="secondary">
          ورود برندها CSV
          <input
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={importBrands}
          />
        </label>
      </div>
      {csvMessage && (
        <div
          className={csvMessage.includes("خطا") ? "error" : "pill green"}
          style={{ marginBottom: 12, lineHeight: 2 }}
        >
          {csvMessage}
        </div>
      )}
      {error && !modal && <div className="error">{error}</div>}
      <div className="grid">
        {list("دسته‌بندی‌ها", "category", cats)}
        {list("برندها", "brand", brands)}
      </div>
      <div className="admin-gaming-category-manager">
        {list("تصاویر دسته‌بندی‌های گیمینگ", "gaming-category", cats)}
      </div>
      {modal && (
        <div className="modal-bg">
          <form className="modal glass" onSubmit={save}>
            <div className="modal-header">
              <h2>
                {modal === "gaming-category"
                  ? `تصویر گیمینگ «${editing?.name || "دسته‌بندی"}»`
                  : `${editing ? "ویرایش" : "افزودن"} ${modal === "category" ? "دسته‌بندی" : "برند"}`}
              </h2>
              <button
                type="button"
                className="close"
                onClick={() => setModal(null)}
              >
                ×
              </button>
            </div>
            {error && <div className="error">{error}</div>}
            {modal !== "gaming-category" && (
              <>
                <div className="field">
                  <label>نام</label>
                  <input name="name" defaultValue={editing?.name} required />
                </div>
                <div className="field">
                  <label>اسلاگ انگلیسی</label>
                  <input
                    name="slug"
                    dir="ltr"
                    defaultValue={editing?.slug}
                    required
                  />
                </div>
              </>
            )}
            {modal === "category" && (
              <>
                <div className="field admin-category-image-field">
                  <label>تصویر کارت در فروشگاه اصلی</label>
                  <label className="admin-category-image-picker">
                    {imagePreview ? (
                      <img src={imagePreview} alt="پیش‌نمایش تصویر دسته‌بندی" />
                    ) : (
                      <span>
                        <b>انتخاب تصویر</b>
                        <small>JPG، PNG یا WebP</small>
                      </span>
                    )}
                    <input
                      name="image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) setImagePreview(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                  <small className="field-hint">
                    اندازه پیشنهادی ۶۰۰×۴۲۰ پیکسل و حداکثر حجم ۴ مگابایت است.
                  </small>
                  {editing?.image && (
                    <label className="admin-remove-category-image">
                      <input name="remove_image" type="checkbox" />
                      حذف تصویر فعلی و نمایش آیکن پیش‌فرض
                    </label>
                  )}
                </div>
                <div className="field">
                  <label>نام آیکن (مثل laptop یا cpu)</label>
                  <input
                    name="icon"
                    dir="ltr"
                    defaultValue={editing?.icon || "cpu"}
                  />
                </div>
                <div className="field">
                  <label>ترتیب نمایش</label>
                  <input
                    name="sort_order"
                    type="number"
                    defaultValue={editing?.sort_order || 0}
                  />
                </div>
                <div className="field">
                  <label>زیر‌دسته‌ها (هر خط یک مورد)</label>
                  <textarea
                    name="subcategories"
                    rows="5"
                    defaultValue={(editing?.subcategories || []).join("\\n")}
                  />
                </div>
                <div className="field full"><label>عنوان SEO دسته‌بندی</label><input name="seo_title" maxLength="180" defaultValue={editing?.seo_title} /></div>
                <div className="field full"><label>توضیحات SEO دسته‌بندی</label><textarea name="seo_description" maxLength="320" defaultValue={editing?.seo_description} /></div>
                <div className="field full"><label>متن معرفی دسته‌بندی</label><textarea name="intro_text" rows="4" defaultValue={editing?.intro_text} /></div>
                <div className="field full"><label>راهنمای خرید دسته‌بندی</label><textarea name="buying_guide" rows="6" defaultValue={editing?.buying_guide} /></div>
                <div className="field full"><label>پرسش‌های متداول (JSON)</label><textarea name="faq_items" dir="ltr" rows="7" defaultValue={JSON.stringify(editing?.faq_items || [], null, 2)} /><small>نمونه: [{`{"question":"...","answer":"..."}`}]</small></div>
              </>
            )}
            {modal === "gaming-category" && (
              <div className="field admin-category-image-field">
                  <label>تصویر مخصوص صفحه محصولات گیمینگ</label>
                  <label className="admin-category-image-picker gaming-image-picker">
                    {gamingImagePreview ? (
                      <img
                        src={gamingImagePreview}
                        alt="پیش‌نمایش تصویر دسته‌بندی گیمینگ"
                      />
                    ) : (
                      <span>
                        <b>انتخاب تصویر گیمینگ</b>
                        <small>این تصویر فقط در صفحه گیمینگ نمایش داده می‌شود</small>
                      </span>
                    )}
                    <input
                      name="gaming_image"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file)
                          setGamingImagePreview(URL.createObjectURL(file));
                      }}
                    />
                  </label>
                  <small className="field-hint">
                    اندازه پیشنهادی ۶۰۰×۴۲۰ پیکسل و حداکثر حجم ۴ مگابایت است.
                  </small>
                  {editing?.gaming_image && (
                    <label className="admin-remove-category-image">
                      <input name="remove_gaming_image" type="checkbox" />
                      حذف تصویر گیمینگ و نمایش آیکن پیش‌فرض
                    </label>
                  )}
              </div>
            )}
            {modal === "brand" && (
              <div className="field">
                <label>لوگوی برند (اختیاری)</label>
                {editing?.logo && (
                  <img
                    className="admin-brand-logo-preview"
                    src={editing.logo}
                    alt={editing.name}
                  />
                )}
                <input name="logo" type="file" accept="image/*" />
                <small className="field-hint">
                  اگر لوگو انتخاب نشود، آیکن خودکار از نام برند ساخته می‌شود.
                </small>
              </div>
            )}
            {modal !== "gaming-category" && (
              <label>
                <input
                  name="is_active"
                  type="checkbox"
                  defaultChecked={editing?.is_active ?? true}
                />{" "}
                فعال
              </label>
            )}
            <div className="save-row">
              <button
                type="button"
                className="secondary"
                onClick={() => setModal(null)}
              >
                انصراف
              </button>
              <button className="primary">ذخیره</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
