function SimpleManager({ kind }) {
  const config = {
    menu: { title: "آیتم منو", path: "/catalog/menu-items/" },
    qa: { title: "پرسش و پاسخ", path: "/catalog/questions/" },
    options: { title: "مشخصات قابل انتخاب محصول", path: "/catalog/products/" },
  }[kind];
  const [items, setItems] = useState([]),
    [products, setProducts] = useState([]),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState(null),
    [error, setError] = useState("");
  const load = () =>
    Promise.all([
      apiAll(config.path + "?page_size=100"),
      apiAll("/catalog/products/?page_size=100"),
    ]).then(([a, p]) => {
      setItems(a.results || a);
      setProducts(p.results || p);
    });
  useEffect(() => {
    load();
  }, [kind]);
  const save = async (e) => {
    e.preventDefault();
    setError("");
    const f = new FormData(e.currentTarget);
    try {
      if (kind === "options") {
        const product = products.find((p) => String(p.id) === f.get("product"));
        const colors = f
          .get("colors")
          .split("\\n")
          .filter(Boolean)
          .map((line, i) => {
            const [name, hex] = line.split("|");
            return [
              name.trim(),
              (hex || ["#111827", "#e5e7eb", "#6d28d9"][i % 3]).trim(),
            ];
          });
        const shipping = f
          .get("shipping")
          .split("\\n")
          .filter(Boolean)
          .map((line) => {
            const [name, cost] = line.split("|");
            return { name: name.trim(), cost: Number(cost || 0) };
          });
        await api(`/catalog/products/${product.slug}/`, {
          method: "PATCH",
          body: JSON.stringify({
            warranty: f.get("warranty"),
            available_colors: colors,
            shipping_options: shipping,
          }),
        });
      } else {
        const body =
          kind === "menu"
            ? {
                title: f.get("title"),
                target: f.get("target"),
                sort_order: Number(f.get("sort_order") || 0),
                is_active: f.has("is_active"),
              }
            : {
                product: f.get("product"),
                question: f.get("question"),
                answer: f.get("answer"),
                is_published: f.has("is_published"),
              };
        await api(config.path + (editing ? editing.id + "/" : ""), {
          method: editing ? "PATCH" : "POST",
          body: JSON.stringify(body),
        });
      }
      setModal(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const remove = async (item) => {
    const label = kind === "menu" ? `«${item.title}»` : "این پرسش";
    if (
      await siteConfirm(
        `آیا از حذف ${label} مطمئن هستید؟`,
        kind === "menu" ? "حذف آیتم منو" : "حذف پرسش و پاسخ",
      )
    ) {
      await api(config.path + item.id + "/", { method: "DELETE" });
      await load();
    }
  };
  const open = (item) => {
    setEditing(item || null);
    setModal(true);
    setError("");
  };
  return (
    <>
      <div className="toolbar">
        <button
          className="add"
          onClick={() => open()}
          style={{ padding: "12px 18px" }}
        >
          + {kind === "options" ? "ویرایش مشخصات محصول" : "افزودن مورد"}
        </button>
      </div>
      <div className="table-card glass">
        <table>
          <thead>
            <tr>
              <th>عنوان / محصول</th>
              <th>جزئیات</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td>
                  <b>
                    {kind === "menu"
                      ? x.title
                      : kind === "qa"
                        ? x.product_name
                        : x.name}
                  </b>
                </td>
                <td>
                  {kind === "menu"
                    ? x.target
                    : kind === "qa"
                      ? x.question
                      : x.warranty || "—"}
                </td>
                <td>
                  <span className="pill green">
                    {(x.is_active ?? x.is_published ?? true)
                      ? "فعال"
                      : "غیرفعال"}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button onClick={() => open(x)}>✎</button>
                    {kind !== "options" && (
                      <button onClick={() => remove(x)}>⌫</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="modal-bg">
          <form className="modal glass" onSubmit={save}>
            <div className="modal-header">
              <h2>{config.title}</h2>
              <button
                type="button"
                className="close"
                onClick={() => setModal(false)}
              >
                ×
              </button>
            </div>
            {error && <div className="error">{error}</div>}
            {kind === "menu" && (
              <>
                <div className="field">
                  <label>عنوان منو</label>
                  <input name="title" defaultValue={editing?.title} required />
                </div>
                <div className="field">
                  <label>مقصد (shop، اسلاگ دسته یا URL)</label>
                  <input
                    name="target"
                    dir="ltr"
                    defaultValue={editing?.target}
                  />
                </div>
                <div className="field">
                  <label>ترتیب</label>
                  <input
                    name="sort_order"
                    type="number"
                    defaultValue={editing?.sort_order || 0}
                  />
                </div>
                <label>
                  <input
                    name="is_active"
                    type="checkbox"
                    defaultChecked={editing?.is_active ?? true}
                  />{" "}
                  فعال
                </label>
              </>
            )}
            {kind === "qa" && (
              <>
                <div className="field">
                  <label>محصول</label>
                  <select
                    name="product"
                    defaultValue={editing?.product}
                    required
                  >
                    {products.map((p) => (
                      <option value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>پرسش</label>
                  <textarea
                    name="question"
                    defaultValue={editing?.question}
                    required
                  />
                </div>
                <div className="field">
                  <label>پاسخ</label>
                  <textarea name="answer" defaultValue={editing?.answer} />
                </div>
                <label>
                  <input
                    name="is_published"
                    type="checkbox"
                    defaultChecked={editing?.is_published ?? true}
                  />{" "}
                  منتشر شود
                </label>
              </>
            )}
            {kind === "options" && (
              <>
                <div className="field">
                  <label>محصول</label>
                  <select name="product" defaultValue={editing?.id} required>
                    {products.map((p) => (
                      <option value={p.id}>{p.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>گارانتی</label>
                  <input name="warranty" defaultValue={editing?.warranty} />
                </div>
                <div className="field">
                  <label>رنگ‌ها (هر خط: نام|کد رنگ)</label>
                  <textarea
                    name="colors"
                    rows="4"
                    defaultValue={(editing?.available_colors || [])
                      .map((c) =>
                        Array.isArray(c) ? c.join("|") : c.name + "|" + c.hex,
                      )
                      .join("\\n")}
                  />
                </div>
                <div className="field">
                  <label>ارسال (هر خط: نام|هزینه)</label>
                  <textarea
                    name="shipping"
                    rows="4"
                    defaultValue={(editing?.shipping_options || [])
                      .map((s) =>
                        typeof s === "string"
                          ? s + "|0"
                          : s.name + "|" + s.cost,
                      )
                      .join("\\n")}
                  />
                </div>
              </>
            )}
            <div className="save-row">
              <button
                type="button"
                className="secondary"
                onClick={() => setModal(false)}
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
