function InventoryManager() {
  const [items, setItems] = useState([]),
    [products, setProducts] = useState([]),
    [modal, setModal] = useState(false),
    [filter, setFilter] = useState(""),
    [error, setError] = useState("");
  const load = () =>
    Promise.all([
      apiAll("/operations/inventory/?page_size=100"),
      apiAll("/catalog/products/?page_size=100"),
    ])
      .then(([m, p]) => {
        setItems(m.results || m);
        setProducts(p.results || p);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const save = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      await api("/operations/inventory/", {
        method: "POST",
        body: JSON.stringify({
          product: f.get("product"),
          movement_type: f.get("movement_type"),
          quantity: Number(f.get("quantity")),
          reason: f.get("reason"),
          reference: f.get("reference"),
        }),
      });
      setModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const rows = filter ? items.filter((x) => x.movement_type === filter) : items;
  return (
    <>
      {error && <div className="error">{error}</div>}
      <div className="toolbar">
        <select
          className="admin-select"
          aria-label="فیلتر نوع گردش انبار"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="">همه گردش‌ها</option>
          <option value="IN">ورود</option>
          <option value="OUT">خروج</option>
          <option value="ADJUST">اصلاح</option>
        </select>
        <button className="add" onClick={() => setModal(true)}>
          + ثبت گردش انبار
        </button>
      </div>
      <div className="table-card glass">
        <table>
          <thead>
            <tr>
              <th>محصول</th>
              <th>نوع</th>
              <th>تعداد</th>
              <th>موجودی پس از عملیات</th>
              <th>علت</th>
              <th>مرجع</th>
              <th>تاریخ</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.id}>
                <td>
                  <b>{x.product_name}</b>
                </td>
                <td>
                  <span
                    className={
                      "pill " +
                      (x.movement_type === "IN"
                        ? "green"
                        : x.movement_type === "OUT"
                          ? "red"
                          : "yellow")
                    }
                  >
                    {x.movement_type === "IN"
                      ? "ورود"
                      : x.movement_type === "OUT"
                        ? "خروج"
                        : "اصلاح"}
                  </span>
                </td>
                <td>{fmt(x.quantity)}</td>
                <td>{fmt(x.stock_after)}</td>
                <td>{x.reason}</td>
                <td dir="ltr">{x.reference || "—"}</td>
                <td>{jalaliDate(x.created_at, true)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="modal-bg" onMouseDown={() => setModal(false)}>
          <form
            className="modal glass"
            onSubmit={save}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>ثبت گردش جدید انبار</h2>
              <button
                type="button"
                className="close"
                onClick={() => setModal(false)}
              >
                ×
              </button>
            </div>
            <div className="form-grid">
              <div className="field full">
                <label>محصول</label>
                <select name="product" required>
                  <option value="">انتخاب کالا</option>
                  {products.map((p) => (
                    <option value={p.id} key={p.id}>
                      {p.name} — موجودی {fmt(p.stock)}
                    </option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>نوع عملیات</label>
                <select name="movement_type">
                  <option value="IN">افزایش موجودی</option>
                  <option value="OUT">کاهش موجودی</option>
                  <option value="ADJUST">تعیین موجودی دقیق</option>
                </select>
              </div>
              <div className="field">
                <label>تعداد</label>
                <input name="quantity" type="number" min="0" required />
              </div>
              <div className="field full">
                <label>علت عملیات</label>
                <input
                  name="reason"
                  required
                  placeholder="مثلاً ورود از تأمین‌کننده یا اصلاح شمارش"
                />
              </div>
              <div className="field full">
                <label>کد مرجع</label>
                <input
                  name="reference"
                  placeholder="شماره سفارش، فاکتور یا سند"
                />
              </div>
            </div>
            <div className="save-row">
              <button
                type="button"
                className="secondary"
                onClick={() => setModal(false)}
              >
                انصراف
              </button>
              <button className="primary">ثبت گردش</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}

