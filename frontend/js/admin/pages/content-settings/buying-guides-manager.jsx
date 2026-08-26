function BuyingGuidesManager() {
  const [guides, setGuides] = useState([]), [categories, setCategories] = useState([]), [products, setProducts] = useState([]);
  const [settings, setSettings] = useState(null), [editing, setEditing] = useState(null), [modal, setModal] = useState(false);
  const [guideCategory, setGuideCategory] = useState("");
  const [filterCategory, setFilterCategory] = useState(""), [error, setError] = useState(""), [message, setMessage] = useState("");
  const load = () => Promise.all([
    apiAll("/catalog/buying-guides/?page_size=200"), apiAll("/catalog/categories/?page_size=200"),
    apiAll("/catalog/products/?page_size=500"), api("/catalog/site-settings/"),
  ]).then(([guideRows, categoryRows, productRows, siteRows]) => {
    setGuides(guideRows.results || guideRows); setCategories(categoryRows.results || categoryRows);
    setProducts(productRows.results || productRows); setSettings((siteRows.results || siteRows)[0] || {});
  }).catch((err) => setError(err.message));
  useEffect(() => { load(); }, []);
  useEffect(() => { if (editing?.category) setGuideCategory(editing.category); }, [editing?.id]);

  const parseJson = (form, name, fallback = []) => {
    const value = String(form.get(name) || "").trim();
    if (!value) return fallback;
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) throw new Error(`مقدار «${name}» باید یک آرایه JSON معتبر باشد.`);
    return parsed;
  };
  const saveSettings = async (event) => {
    event.preventDefault(); setError(""); setMessage("");
    const form = new FormData(event.currentTarget);
    const body = {
      guides_enabled: form.has("guides_enabled"), guides_eyebrow: form.get("guides_eyebrow"), guides_title: form.get("guides_title"),
      guides_description: form.get("guides_description"), guides_search_placeholder: form.get("guides_search_placeholder"),
      guides_header_button_title: form.get("guides_header_button_title"), guides_header_button_subtitle: form.get("guides_header_button_subtitle"),
      guides_show_product_tabs: form.has("guides_show_product_tabs"), guides_show_mistakes: form.has("guides_show_mistakes"), guides_show_faq: form.has("guides_show_faq"),
    };
    try { setSettings(await api(`/catalog/site-settings/${settings.id}/`, { method: "PATCH", body: JSON.stringify(body) })); setMessage("تنظیمات عمومی مرکز راهنمای خرید ذخیره شد."); }
    catch (err) { setError(err.message); }
  };
  const saveGuide = async (event) => {
    event.preventDefault(); setError("");
    const form = new FormData(event.currentTarget);
    try {
      const body = {
        title: form.get("title"), slug: form.get("slug"), summary: form.get("summary"), content: form.get("content"),
        category: form.get("category") || null, product: form.get("product") || null,
        criteria: parseJson(form, "criteria"), common_mistakes: parseJson(form, "common_mistakes"),
        checklist: parseJson(form, "checklist"), faq_items: parseJson(form, "faq_items"),
        accent_color: form.get("accent_color") || "#6d28d9", sort_order: Number(form.get("sort_order") || 0),
        is_featured: form.has("is_featured"), show_in_category_accordion: form.has("show_in_category_accordion"), is_published: form.has("is_published"),
      };
      await api(`/catalog/buying-guides/${editing ? encodeURIComponent(editing.slug) + "/" : ""}`, { method: editing ? "PATCH" : "POST", body: JSON.stringify(body) });
      setModal(false); setEditing(null); setMessage("راهنما با موفقیت ذخیره شد."); load();
    } catch (err) { setError(err.message); }
  };
  const removeGuide = async (guide) => {
    if (!(await siteConfirm(`راهنمای «${guide.title}» حذف شود؟`, "حذف راهنمای خرید"))) return;
    try { await api(`/catalog/buying-guides/${encodeURIComponent(guide.slug)}/`, { method: "DELETE" }); load(); }
    catch (err) { setError(err.message); }
  };
  if (!settings) return <div className="loading"></div>;
  const visibleGuides = filterCategory ? guides.filter((item) => String(item.category) === String(filterCategory)) : guides;
  const modalCategory = guideCategory || editing?.category || categories[0]?.id || "";
  return <div className="guide-admin-page">
    {error && <div className="error">{error}</div>}{message && <div className="success">{message}</div>}
    <form className="card glass" onSubmit={saveSettings}>
      <div className="card-head"><div><h2>تنظیمات عمومی مرکز راهنمای خرید</h2><small>عنوان هدر، متن معرفی، دکمه بالای سایت و بخش‌های قابل نمایش</small></div><button className="primary" type="submit">ذخیره تنظیمات</button></div>
      <div className="form-grid">
        <div className="field"><label>عبارت بالای عنوان</label><input name="guides_eyebrow" defaultValue={settings.guides_eyebrow} /></div>
        <div className="field"><label>عنوان اصلی صفحه</label><input name="guides_title" defaultValue={settings.guides_title} /></div>
        <div className="field full"><label>توضیح معرفی مرکز راهنما</label><textarea rows="3" name="guides_description" defaultValue={settings.guides_description} /></div>
        <div className="field"><label>متن جست‌وجو</label><input name="guides_search_placeholder" defaultValue={settings.guides_search_placeholder} /></div>
        <div className="field"><label>عنوان دکمه هدر</label><input name="guides_header_button_title" defaultValue={settings.guides_header_button_title} /></div>
        <div className="field"><label>زیرعنوان دکمه هدر</label><input name="guides_header_button_subtitle" defaultValue={settings.guides_header_button_subtitle} /></div>
        <label className="switch"><input type="checkbox" name="guides_enabled" defaultChecked={settings.guides_enabled} /><span />فعال‌بودن مرکز راهنما</label>
        <label className="switch"><input type="checkbox" name="guides_show_product_tabs" defaultChecked={settings.guides_show_product_tabs} /><span />نمایش تب محصولات</label>
        <label className="switch"><input type="checkbox" name="guides_show_mistakes" defaultChecked={settings.guides_show_mistakes} /><span />نمایش اشتباهات رایج</label>
        <label className="switch"><input type="checkbox" name="guides_show_faq" defaultChecked={settings.guides_show_faq} /><span />نمایش پرسش‌ها</label>
      </div>
    </form>
    <section className="card glass" style={{ marginTop: 16 }}>
      <div className="card-head"><div><h2>راهنماهای دسته‌بندی و محصول</h2><small>برای کل دسته یا یک محصول مشخص، محتوای اختصاصی بسازید.</small></div><button className="add" onClick={() => { setEditing(null); setGuideCategory(categories[0]?.id || ""); setModal(true); }}>+ راهنمای جدید</button></div>
      <div className="toolbar"><select value={filterCategory} onChange={(event) => setFilterCategory(event.target.value)}><option value="">همه دسته‌بندی‌ها</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><span className="pill">{fmt(visibleGuides.length)} راهنما</span></div>
      <div className="table-card"><table><thead><tr><th>عنوان</th><th>دسته / محصول</th><th>محتوا</th><th>وضعیت</th><th>عملیات</th></tr></thead><tbody>{visibleGuides.map((guide) => <tr key={guide.id}><td><b>{guide.title}</b><small dir="ltr" style={{ display: "block" }}>/guides/{guide.slug}</small></td><td>{guide.category_name || "عمومی"}<small style={{ display: "block" }}>{guide.product_name || "تمام محصولات دسته"}</small></td><td>{(guide.criteria || []).length} معیار · {(guide.faq_items || []).length} پرسش</td><td><span className={`pill ${guide.is_published ? "green" : "red"}`}>{guide.is_published ? "منتشرشده" : "پیش‌نویس"}</span></td><td><div className="actions"><button onClick={() => { setEditing(guide); setModal(true); }}>✎</button><button onClick={() => removeGuide(guide)}>⌫</button></div></td></tr>)}</tbody></table></div>
    </section>
    {modal && <div className="modal-bg" onMouseDown={() => { setModal(false); setEditing(null); }}><form className="modal glass guide-admin-modal" onSubmit={saveGuide} onMouseDown={(event) => event.stopPropagation()}><div className="modal-header"><h2>{editing ? "ویرایش راهنمای خرید" : "ساخت راهنمای خرید"}</h2><button type="button" className="close" onClick={() => setModal(false)}>×</button></div><div className="form-grid">
      <div className="field"><label>عنوان</label><input name="title" required defaultValue={editing?.title} /></div><div className="field"><label>نشانی یکتا</label><input name="slug" dir="ltr" required defaultValue={editing?.slug} placeholder="laptop-main-guide" /></div>
      <div className="field"><label>دسته‌بندی</label><select name="category" value={modalCategory} onChange={(event) => setGuideCategory(event.target.value)}>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div className="field"><label>محصول اختصاصی (اختیاری)</label><select name="product" defaultValue={editing?.product || ""}><option value="">راهنمای کل دسته</option>{products.filter((item) => !modalCategory || String(item.category) === String(modalCategory)).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
      <div className="field full"><label>خلاصه</label><textarea name="summary" rows="2" defaultValue={editing?.summary} /></div><div className="field full"><label>محتوای کامل و توضیحات تخصصی</label><textarea name="content" rows="7" required defaultValue={editing?.content} /></div>
      <JsonGuideField name="criteria" label="معیارهای انتخاب" value={editing?.criteria} sample='["سازگاری", "کیفیت ساخت"]' />
      <JsonGuideField name="common_mistakes" label="اشتباهات رایج" value={editing?.common_mistakes} sample='["خرید بدون بررسی مدل"]' />
      <JsonGuideField name="checklist" label="چک‌لیست قبل از خرید" value={editing?.checklist} sample='["مدل دقیق را بررسی کردم"]' />
      <JsonGuideField name="faq_items" label="پرسش و پاسخ" value={editing?.faq_items} sample='[{"question":"سؤال","answer":"پاسخ"}]' />
      <div className="field"><label>رنگ اختصاصی</label><input name="accent_color" type="color" defaultValue={editing?.accent_color || "#6d28d9"} /></div><div className="field"><label>ترتیب نمایش</label><input name="sort_order" type="number" defaultValue={editing?.sort_order || 0} /></div>
      <label className="switch"><input name="is_published" type="checkbox" defaultChecked={editing ? editing.is_published : true} /><span />منتشرشده</label><label className="switch"><input name="is_featured" type="checkbox" defaultChecked={editing?.is_featured} /><span />راهنمای ویژه</label><label className="switch"><input name="show_in_category_accordion" type="checkbox" defaultChecked={editing ? editing.show_in_category_accordion : true} /><span />نمایش داخل صفحه دسته</label>
    </div><button className="primary" type="submit">ذخیره راهنما</button></form></div>}
  </div>;
}

function JsonGuideField({ name, label, value, sample }) {
  return <div className="field full"><label>{label} (JSON)</label><textarea name={name} dir="ltr" rows="4" defaultValue={JSON.stringify(value || [], null, 2)} /><small>نمونه: {sample}</small></div>;
}
