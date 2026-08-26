const adminProductSearchScore = (product, rawQuery) => {
  const query = normalizeSearchInput(rawQuery);
  if (!query) return 0;
  const name = normalizeSearchInput(product?.name);
  const sku = normalizeSearchInput(product?.sku);
  const category = normalizeSearchInput(product?.category_name);
  const brand = normalizeSearchInput(product?.brand_name);
  const keywords = normalizeSearchInput(product?.search_keywords);
  const kind = product?.is_gaming ? "گیمینگ gaming" : "عادی regular";
  const fields = [name, sku, category, brand, keywords, kind];
  const tokens = query.split(" ").filter(Boolean);
  if (!tokens.every((token) => fields.some((field) => field.includes(token))))
    return -1;

  let score = 1;
  if (sku === query) score += 1000;
  if (name === query) score += 900;
  else if (name.startsWith(query)) score += 600;
  else if (` ${name} `.includes(` ${query} `)) score += 450;
  else if (name.includes(query)) score += 300;
  if (category === query) score += 220;
  else if (category.includes(query)) score += 90;
  if (brand === query) score += 180;
  else if (brand.includes(query)) score += 70;
  if (sku.startsWith(query)) score += 160;
  return score;
};

function Products() {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [query, setQuery] = useState(""),
    [selectedCategory, setSelectedCategory] = useState(""),
    [categoryQuery, setCategoryQuery] = useState(""),
    [categoryItems, setCategoryItems] = useState(null),
    [categoryLoading, setCategoryLoading] = useState(false),
    [remoteSearchItems, setRemoteSearchItems] = useState(null),
    [searchLoading, setSearchLoading] = useState(false),
    [searchError, setSearchError] = useState(""),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState(null),
    [deleteTarget, setDeleteTarget] = useState(null),
    [deleting, setDeleting] = useState(false),
    [cats, setCats] = useState([]),
    [brands, setBrands] = useState([]),
    [saving, setSaving] = useState(false),
    [gamingToggleId, setGamingToggleId] = useState(null),
    [formError, setFormError] = useState(""),
    [csvMessage, setCsvMessage] = useState("");
  const searchRequestId = useRef(0);
  const categoryRequestId = useRef(0);
  const toggleGaming = async (product) => {
    if (gamingToggleId) return;
    setGamingToggleId(product.id);
    setFormError("");
    const nextValue = !product.is_gaming;
    setItems((current) =>
      current.map((item) =>
        item.id === product.id ? { ...item, is_gaming: nextValue } : item,
      ),
    );
    try {
      await api(`/catalog/products/${product.slug}/`, {
        method: "PATCH",
        body: JSON.stringify({ is_gaming: nextValue }),
      });
    } catch (error) {
      setItems((current) =>
        current.map((item) =>
          item.id === product.id ? { ...item, is_gaming: !nextValue } : item,
        ),
      );
      setFormError(error.message);
    } finally {
      setGamingToggleId(null);
    }
  };
  const load = () =>
    Promise.all([
      apiAll("/catalog/products/?page_size=100"),
      apiAll("/catalog/categories/?page_size=100"),
      apiAll("/catalog/brands/?page_size=100"),
    ])
      .then(([p, c, b]) => {
        setItems(p.results || p);
        setCats(c.results || c);
        setBrands(b.results || b);
      })
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const selectedCategoryRecord = cats.find(
    (category) => String(category.id) === String(selectedCategory),
  );
  useEffect(() => {
    const requestId = ++categoryRequestId.current;
    if (!selectedCategory) {
      setCategoryItems(null);
      setCategoryLoading(false);
      return undefined;
    }
    if (!selectedCategoryRecord?.slug) return undefined;
    setCategoryItems([]);
    setCategoryLoading(true);
    apiAll(
      `/catalog/products/?category__slug=${encodeURIComponent(selectedCategoryRecord.slug)}&page_size=100`,
    )
      .then((products) => {
        if (requestId === categoryRequestId.current) setCategoryItems(products);
      })
      .catch((error) => {
        if (requestId !== categoryRequestId.current) return;
        setCategoryItems([]);
        setSearchError(error.message || "محصولات این دسته دریافت نشد.");
      })
      .finally(() => {
        if (requestId === categoryRequestId.current) setCategoryLoading(false);
      });
    return undefined;
  }, [selectedCategory, selectedCategoryRecord?.slug]);
  useEffect(() => {
    const term = query.trim();
    const requestId = ++searchRequestId.current;
    setSearchError("");
    if (!term) {
      setRemoteSearchItems(null);
      setSearchLoading(false);
      return undefined;
    }
    // Never keep rows from the previous query visible while a new request is pending.
    setRemoteSearchItems([]);
    setSearchLoading(true);
    const timer = window.setTimeout(() => {
      const categoryParameter = selectedCategory
        ? `&category_id=${encodeURIComponent(selectedCategory)}`
        : "";
      api(`/catalog/products/suggest/?q=${encodeURIComponent(term)}${categoryParameter}&limit=100`)
        .then((response) => {
          if (requestId !== searchRequestId.current) return;
          const localById = new Map(items.map((product) => [String(product.id), product]));
          const exactRows = (response.results || []).map((product) => ({
            ...product,
            ...(localById.get(String(product.id)) || {}),
          }));
          setRemoteSearchItems(exactRows);
        })
        .catch((error) => {
          if (requestId !== searchRequestId.current) return;
          setRemoteSearchItems([]);
          setSearchError(error.message || "جستجوی محصولات انجام نشد.");
        })
        .finally(() => {
          if (requestId === searchRequestId.current) setSearchLoading(false);
        });
    }, 160);
    return () => window.clearTimeout(timer);
  }, [query, selectedCategory, items]);
  const categoryCounts = items.reduce((counts, product) => {
    const key = String(product.category || product.category_slug || "");
    counts[key] = (counts[key] || 0) + 1;
    return counts;
  }, {});
  const visibleCategories = cats.filter((category) =>
    normalizeSearchInput(`${category.name} ${category.slug}`).includes(
      normalizeSearchInput(categoryQuery),
    ),
  );
  const hasRemoteResults = remoteSearchItems !== null;
  const tableSource = query.trim()
    ? (remoteSearchItems ?? [])
    : (categoryItems ?? items);
  const filtered = tableSource
    .map((product, index) => ({
      product,
      index,
      // The backend has already normalized aliases and ranked remote matches.
      // Re-filtering them locally used to discard valid «لب تاب» results.
      score: hasRemoteResults ? 0 : adminProductSearchScore(product, query),
    }))
    .filter((entry) => hasRemoteResults || entry.score >= 0)
    .sort((first, second) =>
      query && !hasRemoteResults
        ? second.score - first.score || first.index - second.index
        : first.index - second.index,
    )
    .map((entry) => entry.product);
  const closeModal = () => {
    setModal(false);
    setEditing(null);
    setFormError("");
  };
  const openEdit = async (product) => {
    setFormError("");
    try {
      const fresh = await api(`/catalog/products/${product.slug}/`);
      setEditing(fresh);
      setModal(true);
    } catch (error) {
      setFormError(error.message);
    }
  };
  const save = async (e) => {
    e.preventDefault();
    setSaving(true);
    setFormError("");
    try {
      const form = new FormData(e.currentTarget),
        galleryFiles = form.getAll("gallery_images");
      form.delete("gallery_images");
      if (!form.get("image")?.size) form.delete("image");
      if (!form.has("is_active")) form.set("is_active", "false");
      else form.set("is_active", "true");
      if (!form.has("is_gaming")) form.set("is_gaming", "false");
      else form.set("is_gaming", "true");
      if (!form.has("is_featured")) form.set("is_featured", "false");
      else form.set("is_featured", "true");
      const path = editing
        ? `/catalog/products/${editing.slug}/`
        : "/catalog/products/";
      const product = await api(path, {
        method: editing ? "PATCH" : "POST",
        body: form,
      });
      if (galleryFiles.some((file) => file.size)) {
        const galleryData = new FormData();
        galleryFiles
          .filter((file) => file.size)
          .forEach((file) => galleryData.append("images", file));
        await api(`/catalog/products/${product.slug}/images/`, {
          method: "POST",
          body: galleryData,
        });
      }
      closeModal();
      await load();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setSaving(false);
    }
  };
  const removeGalleryImage = async (imageId) => {
    if (!(await siteConfirm("این تصویر از گالری حذف شود؟", "حذف تصویر گالری")))
      return;
    await api(`/catalog/products/${editing.slug}/images/${imageId}/`, {
      method: "DELETE",
    });
    const fresh = await api(`/catalog/products/${editing.slug}/`);
    setEditing(fresh);
    await load();
  };
  const removeMainImage = async () => {
    if (!(await siteConfirm("تصویر اصلی محصول حذف شود؟", "حذف تصویر اصلی")))
      return;
    await api(`/catalog/products/${editing.slug}/main-image/`, {
      method: "DELETE",
    });
    const fresh = await api(`/catalog/products/${editing.slug}/`);
    setEditing(fresh);
    await load();
  };
  const deleteProduct = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setFormError("");
    try {
      await api(`/catalog/products/${deleteTarget.slug}/`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      await load();
    } catch (error) {
      setFormError(error.message);
    } finally {
      setDeleting(false);
    }
  };
  const importProducts = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setFormError("");
    setCsvMessage("در حال پردازش فایل محصولات...");
    try {
      const body = new FormData();
      body.append("file", file);
      const result = await api("/catalog/products/import-csv/", {
        method: "POST",
        body,
      });
      const summary = `${result.created || 0} محصول ساخته و ${result.updated || 0} محصول بروزرسانی شد.`;
      setCsvMessage(
        result.failed
          ? `${summary} ${result.failed} ردیف خطا داشت: ${(result.errors || []).map((x) => `ردیف ${x.row}: ${x.message}`).join(" | ")}`
          : summary,
      );
      await load();
    } catch (error) {
      setCsvMessage("");
      setFormError(error.message);
    }
  };
  if (loading) return <div className="loading"></div>;
  return (
    <>
      <section className="product-category-browser glass" aria-label="دسته‌بندی محصولات">
        <div className="product-category-browser-head">
          <div>
            <h2>دسته‌بندی محصولات</h2>
            <p>ابتدا دسته را انتخاب کنید، سپس محصول را فقط داخل همان دسته جستجو کنید.</p>
          </div>
          <input
            className="category-search"
            type="search"
            value={categoryQuery}
            onChange={(event) => setCategoryQuery(event.target.value)}
            placeholder="جستجوی دسته‌بندی..."
            aria-label="جستجوی دسته‌بندی محصولات"
          />
        </div>
        <div className="product-category-tabs" role="tablist" aria-label="فهرست دسته‌بندی‌ها">
          <button
            type="button"
            role="tab"
            aria-selected={!selectedCategory}
            className={!selectedCategory ? "is-active" : ""}
            onClick={() => {
              setSelectedCategory("");
              setCategoryItems(null);
              setRemoteSearchItems(null);
            }}
          >
            <span>همه محصولات</span><b>{fmt(items.length)}</b>
          </button>
          {visibleCategories.map((category) => {
            const count = categoryCounts[String(category.id)] || categoryCounts[String(category.slug)] || 0;
            return (
              <button
                type="button"
                role="tab"
                aria-selected={String(selectedCategory) === String(category.id)}
                className={String(selectedCategory) === String(category.id) ? "is-active" : ""}
                key={category.id}
                onClick={() => {
                  setSelectedCategory(String(category.id));
                  setCategoryItems([]);
                  setRemoteSearchItems(null);
                }}
              >
                <span>{category.name}</span><b>{fmt(count)}</b>
              </button>
            );
          })}
        </div>
      </section>
      <div className="toolbar">
        <input
          className="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={selectedCategoryRecord
            ? `جستجوی محصول در دسته ${selectedCategoryRecord.name}...`
            : "جستجوی زنده نام، کد، برند یا دسته‌بندی..."}
          aria-label="جستجوی زنده محصولات"
        />
        <button className="add" onClick={() => setModal(true)}>
          + محصول جدید
        </button>
        <button
          className="secondary"
          onClick={() =>
            downloadFile(
              "/catalog/products/template-csv/",
              "products-template.csv",
            )
          }
        >
          دانلود نمونه CSV
        </button>
        <button
          className="secondary"
          onClick={() =>
            downloadFile("/catalog/products/export-csv/", "products.csv")
          }
        >
          خروجی محصولات
        </button>
        <label className="secondary">
          ورود محصولات CSV
          <input
            type="file"
            accept=".csv,text/csv"
            hidden
            onChange={importProducts}
          />
        </label>
      </div>
      {query.trim() && (
        <div className="admin-search-status" role="status" aria-live="polite">
          {searchLoading || categoryLoading
            ? "در حال جستجو در تمام محصولات..."
            : `${fmt(filtered.length)} محصول مرتبط پیدا شد.`}
        </div>
      )}
      {searchError && <div className="error">{searchError}</div>}
      {csvMessage && (
        <div
          className={csvMessage.includes("خطا") ? "error" : "pill green"}
          style={{ marginBottom: 12, lineHeight: 2 }}
        >
          {csvMessage}
        </div>
      )}
      {formError && !modal && <div className="error">{formError}</div>}
      <div className="table-card glass">
        <table>
          <thead>
            <tr>
              <th>تصویر</th>
              <th>محصول</th>
              <th>کد</th>
              <th>دسته‌بندی</th>
              <th>قیمت</th>
              <th>موجودی</th>
              <th>گالری</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => (
              <tr key={p.id}>
                <td>
                  {p.image ? (
                    <img className="image-preview" src={adminMediaUrl(p.image)} alt={p.name} />
                  ) : (
                    <span
                      className="image-preview"
                      style={{ display: "grid", placeItems: "center" }}
                    >
                      ◫
                    </span>
                  )}
                </td>
                <td>
                  <b>{p.name}</b>
                  {p.is_gaming && (
                    <span className="pill gaming" style={{ marginRight: 8 }}>
                      گیمینگ
                    </span>
                  )}
                  {p.is_featured && (
                    <span className="pill yellow" style={{ marginRight: 8 }}>
                      پیشنهاد ویژه
                    </span>
                  )}
                </td>
                <td>{p.sku}</td>
                <td>{p.category_name}</td>
                <td>{fmt(p.final_price)} تومان</td>
                <td>{fmt(p.stock)}</td>
                <td>{fmt(p.gallery?.length || 0)} تصویر</td>
                <td>
                  <span className={"pill " + (p.is_active ? "green" : "red")}>
                    {p.is_active ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <label
                      className={`gaming-quick-toggle ${p.is_gaming ? "is-on" : ""}`}
                      title={p.is_gaming ? "حذف از محصولات گیمینگ" : "افزودن به محصولات گیمینگ"}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(p.is_gaming)}
                        disabled={gamingToggleId === p.id}
                        onChange={() => toggleGaming(p)}
                        aria-label={`${p.name}؛ محصول گیمینگ`}
                      />
                      <span aria-hidden="true">🎮</span>
                    </label>
                    <button
                      onClick={() => openEdit(p)}
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => {
                        setFormError("");
                        setDeleteTarget(p);
                      }}
                    >
                      ⌫
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {deleteTarget && (
        <div
          className="modal-bg"
          onMouseDown={() => !deleting && setDeleteTarget(null)}
        >
          <section
            className="modal glass confirm-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon">⌫</div>
            <h2>حذف محصول</h2>
            <p>
              آیا از حذف «{deleteTarget.name}» مطمئن هستید؟
              <br />
              این محصول از فروشگاه و پنل مدیریت حذف می‌شود.
            </p>
            <div className="confirm-actions">
              <button
                className="secondary"
                disabled={deleting}
                onClick={() => setDeleteTarget(null)}
              >
                انصراف
              </button>
              <button
                className="danger-btn"
                disabled={deleting}
                onClick={deleteProduct}
              >
                {deleting ? "در حال حذف..." : "بله، حذف شود"}
              </button>
            </div>
          </section>
        </div>
      )}
      {modal && (
        <div className="modal-bg" onMouseDown={closeModal}>
          <form
            className="modal glass"
            onSubmit={save}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>{editing ? "ویرایش محصول" : "افزودن محصول جدید"}</h2>
              <button type="button" className="close" onClick={closeModal}>
                ×
              </button>
            </div>
            {formError && <div className="error">{formError}</div>}
            <div className="form-grid">
              <div className="field full">
                <label>نام محصول</label>
                <input name="name" defaultValue={editing?.name} required />
                <small>
                  {editing
                    ? `نشانی محصول: ${editing.slug}`
                    : "نشانی محصول بعد از ذخیره، خودکار و یکتا ساخته می‌شود."}
                </small>
              </div>
              <div className="field">
                <label>کد کالا</label>
                <input
                  name="sku"
                  dir="ltr"
                  defaultValue={editing?.sku}
                  required
                />
              </div>
              <div className="field">
                <label>دسته‌بندی</label>
                <select
                  name="category"
                  defaultValue={editing?.category}
                  required
                >
                  <option value="">انتخاب کنید</option>
                  {cats.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>برند</label>
                <select name="brand" defaultValue={editing?.brand || ""}>
                  <option value="">بدون برند</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>قیمت (تومان)</label>
                <input
                  name="price"
                  type="number"
                  defaultValue={editing?.price}
                  required
                />
              </div>
              <div className="field">
                <label>موجودی</label>
                <input
                  name="stock"
                  type="number"
                  defaultValue={editing?.stock || 0}
                  required
                />
              </div>
              <div className="field">
                <label>درصد تخفیف</label>
                <input
                  name="discount_percent"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={editing?.discount_percent || 0}
                />
              </div>
              <div className="field">
                <label>وضعیت</label>
                <label>
                  <input
                    name="is_active"
                    type="checkbox"
                    defaultChecked={editing?.is_active ?? true}
                  />{" "}
                  فعال
                </label>
              </div>
              <div className="field">
                <label>نمایش در صفحه گیمینگ</label>
                <label>
                  <input
                    name="is_gaming"
                    type="checkbox"
                    defaultChecked={editing?.is_gaming ?? false}
                  />{" "}
                  این محصول گیمینگ است
                </label>
              </div>
              <div className="field">
                <label>پیشنهاد ویژه</label>
                <label>
                  <input
                    name="is_featured"
                    type="checkbox"
                    defaultChecked={editing?.is_featured ?? false}
                  />{" "}
                  نمایش دستی در بخش پیشنهادهای ویژه
                </label>
                <small>فقط محصولاتی که این گزینه را دارند در اسلایدر پیشنهاد ویژه نمایش داده می‌شوند.</small>
              </div>
              <div className="field full">
                <label>توضیح کوتاه</label>
                <textarea
                  name="short_description"
                  rows="3"
                  defaultValue={editing?.short_description}
                ></textarea>
              </div>
              <div className="field full"><label>توضیحات کامل محصول</label><textarea name="description" rows="6" defaultValue={editing?.description}></textarea></div>
              <div className="field"><label>GTIN / بارکد جهانی</label><input name="gtin" dir="ltr" maxLength="14" defaultValue={editing?.gtin} /></div>
              <div className="field"><label>MPN / کد سازنده</label><input name="mpn" dir="ltr" defaultValue={editing?.mpn} /></div>
              <div className="field"><label>جنس محصول</label><input name="material" defaultValue={editing?.material} /></div>
              <div className="field"><label>شناسه گروه محصول</label><input name="product_group_id" dir="ltr" defaultValue={editing?.product_group_id} /></div>
              <div className="field"><label>وزن (گرم)</label><input name="weight_grams" type="number" min="0" defaultValue={editing?.weight_grams || 0} /></div>
              <div className="field full"><label>عنوان SEO</label><input name="seo_title" maxLength="180" defaultValue={editing?.seo_title} /></div>
              <div className="field full"><label>توضیحات SEO</label><textarea name="seo_description" maxLength="320" defaultValue={editing?.seo_description}></textarea></div>
              <div className="field full"><label>Canonical URL (اختیاری)</label><input name="canonical_url" type="url" dir="ltr" defaultValue={editing?.canonical_url} /></div>
              <div className="field full"><label>کلیدواژه‌های جست‌وجوی داخلی</label><input name="search_keywords" defaultValue={editing?.search_keywords} /></div>
              <div className="field full upload-box">
                <label>تصویر اصلی محصول</label>
                <input
                  name="image"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                />
                <small>فرمت‌های JPG، PNG، WEBP یا GIF؛ حداکثر ۵ مگابایت.</small>
                {editing?.image && (
                  <div className="current-main">
                    <img
                      className="image-preview"
                      src={editing.image}
                      alt={editing.name}
                    />
                    <button type="button" onClick={removeMainImage}>
                      حذف تصویر اصلی
                    </button>
                  </div>
                )}
              </div>
              <div className="field full upload-box">
                <label>افزودن تصاویر گالری</label>
                <input
                  name="gallery_images"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  multiple
                />
                <small>
                  چند تصویر را هم‌زمان انتخاب کنید؛ حداکثر ۱۰ تصویر در هر بار.
                </small>
                {editing?.gallery?.length > 0 && (
                  <div className="gallery-grid">
                    {editing.gallery.map((img) => (
                      <div className="gallery-item" key={img.id}>
                        <img
                          src={adminMediaUrl(img.image)}
                          alt={img.alt_text || editing.name}
                        />
                        <button
                          type="button"
                          onClick={() => removeGalleryImage(img.id)}
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="save-row">
              <button type="button" className="secondary" onClick={closeModal}>
                انصراف
              </button>
              <button className="primary" disabled={saving}>
                {saving ? "در حال آپلود..." : "ذخیره محصول و تصاویر"}
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
