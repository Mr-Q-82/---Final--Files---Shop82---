function ProductOptions() {
  const [products, setProducts] = useState([]),
    [selected, setSelected] = useState("");
  const [warranty, setWarranty] = useState("18 ماهه"),
    [colors, setColors] = useState([]);
  const [colorName, setColorName] = useState(""),
    [colorHex, setColorHex] = useState("#111827");
  const [shipping, setShipping] = useState({
    عادی: 0,
    سریع: 150000,
    ویژه: 320000,
  });
  const [specs, setSpecs] = useState([]),
    [seoTitle, setSeoTitle] = useState(""),
    [seoDescription, setSeoDescription] = useState(""),
    [canonicalUrl, setCanonicalUrl] = useState(""),
    [message, setMessage] = useState("");
  const load = () =>
    apiAll("/catalog/products/?page_size=100").then((r) => {
      const rows = r.results || r;
      setProducts(rows);
      if (rows.length && !selected) choose(rows[0], rows);
    });
  useEffect(() => {
    load();
  }, []);
  const choose = (value, rows = products) => {
    const p =
      typeof value === "object" ? value : rows.find((x) => x.id === value);
    if (!p) return;
    setSelected(p.id);
    setWarranty(p.warranty || "18 ماهه");
    setSeoTitle(p.seo_title || "");
    setSeoDescription(p.seo_description || "");
    setCanonicalUrl(p.canonical_url || "");
    setSpecs(
      Object.entries(p.specifications || {}).map(([name, value]) => ({
        name,
        value: String(value),
      })),
    );
    setColors(
      (p.available_colors || []).map((c) =>
        Array.isArray(c) ? c : [c.name, c.hex],
      ),
    );
    const next = { عادی: 0, سریع: 150000, ویژه: 320000 };
    (p.shipping_options || []).forEach(
      (s) => (next[typeof s === "string" ? s : s.name] = Number(s.cost || 0)),
    );
    setShipping(next);
  };
  const addColor = () => {
    if (!colorName.trim()) return;
    setColors([...colors, [colorName.trim(), colorHex]]);
    setColorName("");
  };
  const save = async () => {
    const p = products.find((x) => x.id === selected);
    if (!p) return;
    const specifications = {};
    specs.forEach((row) => {
      if (row.name.trim()) specifications[row.name.trim()] = row.value.trim();
    });
    try {
      await api(`/catalog/products/${p.slug}/`, {
        method: "PATCH",
        body: JSON.stringify({
          warranty,
          specifications,
          seo_title: seoTitle,
          seo_description: seoDescription,
          canonical_url: canonicalUrl,
          available_colors: colors,
          shipping_options: Object.entries(shipping).map(([name, cost]) => ({
            name,
            cost: Number(cost),
          })),
        }),
      });
      setMessage("مشخصات فنی محصول ذخیره شد.");
      await load();
    } catch (e) {
      setMessage(e.message);
    }
  };
  return (
    <section className="card glass">
      <div className="field">
        <label>محصول</label>
        <select value={selected} onChange={(e) => choose(e.target.value)}>
          {products.map((p) => (
            <option value={p.id} key={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label>گارانتی</label>
        <select value={warranty} onChange={(e) => setWarranty(e.target.value)}>
          {["18 ماهه", "24 ماهه", "48 ماهه", "72 ماهه", "مادام‌العمر"].map(
            (x) => (
              <option key={x}>{x}</option>
            ),
          )}
        </select>
      </div>
      <div className="field">
        <label>رنگ‌های قابل انتخاب</label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            value={colorName}
            onChange={(e) => setColorName(e.target.value)}
            placeholder="نام رنگ"
          />
          <input
            type="color"
            value={colorHex}
            onChange={(e) => setColorHex(e.target.value)}
            style={{ width: 60, padding: 4 }}
          />
          <button type="button" className="secondary" onClick={addColor}>
            افزودن رنگ
          </button>
        </div>
        <div
          style={{ display: "flex", gap: 8, flexWrap: "wrap", marginTop: 10 }}
        >
          {colors.map((c, i) => (
            <button
              type="button"
              key={i}
              onClick={() => setColors(colors.filter((_, n) => n !== i))}
              className="secondary"
            >
              <span
                style={{
                  display: "inline-block",
                  width: 12,
                  height: 12,
                  borderRadius: "50%",
                  background: c[1],
                  marginLeft: 5,
                }}
              ></span>
              {c[0]} ×
            </button>
          ))}
        </div>
      </div>
      <div className="field">
        <label>روش‌های ارسال و هزینه</label>
        {Object.keys(shipping).map((name) => (
          <div
            key={name}
            style={{
              display: "grid",
              gridTemplateColumns: "100px 1fr",
              gap: 8,
              marginBottom: 8,
              alignItems: "center",
            }}
          >
            <b>{name}</b>
            <input
              type="number"
              value={shipping[name]}
              onChange={(e) =>
                setShipping({ ...shipping, [name]: e.target.value })
              }
            />
          </div>
        ))}
      </div>
      <div className="form-grid">
        <div className="field">
          <label>عنوان سئوی محصول</label>
          <input
            maxLength="180"
            value={seoTitle}
            onChange={(e) => setSeoTitle(e.target.value)}
          />
        </div>
        <div className="field">
          <label>توضیحات سئوی محصول</label>
          <input
            maxLength="320"
            value={seoDescription}
            onChange={(e) => setSeoDescription(e.target.value)}
          />
        </div>
        <div className="field full">
          <label>Canonical URL محصول (اختیاری)</label>
          <input
            dir="ltr"
            type="url"
            value={canonicalUrl}
            onChange={(e) => setCanonicalUrl(e.target.value)}
            placeholder="اگر خالی باشد URL خود محصول استفاده می‌شود"
          />
        </div>
      </div>
      <div className="field">
        <div className="card-head">
          <div>
            <h2>مشخصات فنی دلخواه</h2>
            <small>
              برای مثال نوع RAM، DDR4، معماری دو کاناله و ظرفیت ماژول
            </small>
          </div>
          <button
            type="button"
            className="secondary"
            onClick={() => setSpecs([...specs, { name: "", value: "" }])}
          >
            + افزودن مشخصه
          </button>
        </div>
        {specs.map((row, index) => (
          <div
            key={index}
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr auto",
              gap: 8,
              marginBottom: 8,
            }}
          >
            <input
              value={row.name}
              onChange={(e) =>
                setSpecs(
                  specs.map((item, i) =>
                    i === index ? { ...item, name: e.target.value } : item,
                  ),
                )
              }
              placeholder="نام مشخصه"
            />
            <input
              value={row.value}
              onChange={(e) =>
                setSpecs(
                  specs.map((item, i) =>
                    i === index ? { ...item, value: e.target.value } : item,
                  ),
                )
              }
              placeholder="مقدار مشخصه"
            />
            <button
              type="button"
              className="danger-btn"
              onClick={() => setSpecs(specs.filter((_, i) => i !== index))}
            >
              حذف
            </button>
          </div>
        ))}
      </div>
      {message && (
        <div className={message.includes("ذخیره") ? "pill green" : "error"}>
          {message}
        </div>
      )}
      <button
        className="primary"
        style={{ width: "auto", marginTop: 15 }}
        onClick={save}
      >
        ذخیره مشخصات
      </button>
    </section>
  );
}
