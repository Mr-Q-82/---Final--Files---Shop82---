function AdvancedOperations() {
  const [data, setData] = useState({}),
    [error, setError] = useState(""),
    [products, setProducts] = useState([]),
    [orders, setOrders] = useState([]),
    [operationModal, setOperationModal] = useState(null);
  const endpoints = {
    suppliers: "/operations/suppliers/",
    inventory: "/operations/inventory/",
    purchases: "/operations/purchase-orders/",
    bundles: "/operations/bundles/",
    gifts: "/operations/gift-cards/",
    promotions: "/operations/promotions/",
    carts: "/operations/abandoned-carts/",
    shipments: "/operations/shipments/",
  };
  const load = () =>
    Promise.all([
      ...Object.entries(endpoints).map(([key, path]) =>
        apiAll(path + "?page_size=100").then((r) => [key, r]),
      ),
      apiAll("/catalog/products/?page_size=100"),
      apiAll("/orders/admin/all/?page_size=100"),
      api("/operations/reports/"),
      api("/operations/message-center/"),
      api("/operations/two-factor/"),
    ])
      .then((rows) => {
        const next = {};
        rows.slice(0, 8).forEach(([k, v]) => (next[k] = v));
        next.reports = rows[10];
        next.messages = rows[11];
        next.twoFactor = rows[12];
        setData(next);
        setProducts(rows[8].results || rows[8]);
        setOrders(rows[9].results || rows[9]);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const create = (kind) => setOperationModal(kind);
  const submitOperation = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      kind = operationModal;
    try {
      if (kind === "suppliers")
        await api(endpoints[kind], {
          method: "POST",
          body: JSON.stringify({
            name: f.get("name"),
            contact_name: f.get("contact_name"),
            phone: f.get("phone"),
            is_active: true,
          }),
        });
      if (kind === "inventory")
        await api(endpoints[kind], {
          method: "POST",
          body: JSON.stringify({
            product: f.get("product"),
            movement_type: f.get("movement_type"),
            quantity: Number(f.get("quantity")),
            reason: f.get("reason"),
            reference: f.get("reference"),
          }),
        });
      if (kind === "purchases") {
        const product = products.find((x) => x.id === f.get("product")),
          quantity = Number(f.get("quantity")),
          unitCost = Number(f.get("unit_cost"));
        const order = await api(endpoints[kind], {
          method: "POST",
          body: JSON.stringify({
            supplier: f.get("supplier"),
            status: "ORDERED",
            total_cost: quantity * unitCost,
            note: f.get("note"),
          }),
        });
        await api("/operations/purchase-items/", {
          method: "POST",
          body: JSON.stringify({
            purchase_order: order.id,
            product: product.id,
            quantity,
            unit_cost: unitCost,
          }),
        });
      }
      if (kind === "gifts")
        await api(endpoints[kind], {
          method: "POST",
          body: JSON.stringify({
            initial_balance: Number(f.get("amount")),
            expires_at: f.get("expires_at")
              ? new Date(f.get("expires_at")).toISOString()
              : null,
            is_active: true,
          }),
        });
      if (kind === "promotions")
        await api(endpoints[kind], {
          method: "POST",
          body: JSON.stringify({
            title: f.get("title"),
            kind: f.get("promotion_kind"),
            percent: Number(f.get("percent") || 0),
            fixed_amount: Number(f.get("fixed_amount") || 0),
            is_active: true,
            conditions: {},
          }),
        });
      if (kind === "bundles") {
        const bundle = await api(endpoints[kind], {
          method: "POST",
          body: JSON.stringify({
            title: f.get("title"),
            slug: f.get("slug"),
            price: Number(f.get("price")),
            is_active: true,
          }),
        });
        await api("/operations/bundle-items/", {
          method: "POST",
          body: JSON.stringify({
            bundle: bundle.id,
            product: f.get("product"),
            quantity: Number(f.get("quantity") || 1),
          }),
        });
      }
      if (kind === "shipments")
        await api(endpoints[kind], {
          method: "POST",
          body: JSON.stringify({
            order: f.get("order"),
            status: f.get("status"),
            location: f.get("location"),
            description: f.get("description"),
          }),
        });
      setOperationModal(null);
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  const remind = async (item) => {
    try {
      await api(`/operations/abandoned-carts/${item.id}/remind/`, {
        method: "POST",
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const toggle2fa = async () => {
    try {
      await api("/operations/two-factor/", {
        method: "POST",
        body: JSON.stringify({ is_enabled: !data.twoFactor?.is_enabled }),
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const labels = {
    suppliers: "تأمین‌کنندگان",
    inventory: "گردش انبار",
    purchases: "سفارش خرید",
    bundles: "باندل‌ها",
    gifts: "کارت هدیه",
    promotions: "تخفیف پیشرفته",
    carts: "سبدهای رهاشده",
    shipments: "پیگیری مرسوله",
  };
  return (
    <>
      {error && <div className="error">{error}</div>}
      <div className="metrics">
        {Object.keys(labels)
          .slice(0, 4)
          .map((k) => (
            <article className="metric glass" key={k}>
              <div className="metric-head">
                <span className="metric-icon">◆</span>
                <button className="trend" onClick={() => create(k)}>
                  + افزودن
                </button>
              </div>
              <p>{labels[k]}</p>
              <strong>{fmt(data[k]?.length)}</strong>
            </article>
          ))}
      </div>
      <div className="dash-bottom">
        {Object.keys(labels).map((k) => (
          <section className="card glass" key={k}>
            <div className="card-head">
              <h2>{labels[k]}</h2>
              {!["carts"].includes(k) && (
                <button onClick={() => create(k)}>+ افزودن</button>
              )}
            </div>
            {(data[k] || []).slice(0, 6).map((x) => (
              <div className="mini-row" key={x.id}>
                <div>
                  <b>
                    {x.name ||
                      x.title ||
                      x.code ||
                      x.product_name ||
                      x.user ||
                      x.status}
                  </b>
                  <small>{jalaliDate(x.created_at, true)}</small>
                </div>
                {k === "carts" ? (
                  <button className="secondary" onClick={() => remind(x)}>
                    یادآوری
                  </button>
                ) : (
                  <span>
                    {fmt(
                      x.balance || x.total || x.quantity || x.stock_after || 0,
                    )}
                  </span>
                )}
              </div>
            ))}
            {!(data[k] || []).length && (
              <div className="empty">موردی ثبت نشده است.</div>
            )}
          </section>
        ))}
        <section className="card glass">
          <div className="card-head">
            <h2>امنیت مدیر</h2>
          </div>
          <p>
            ورود دومرحله‌ای:{" "}
            <b>{data.twoFactor?.is_enabled ? "فعال" : "غیرفعال"}</b>
          </p>
          <button className="primary" onClick={toggle2fa}>
            {data.twoFactor?.is_enabled ? "غیرفعال‌کردن" : "فعال‌کردن"}
          </button>
        </section>
        <section className="card glass">
          <div className="card-head">
            <h2>مرکز پیام</h2>
          </div>
          <div className="status-row">
            <p>تیکت‌های باز</p>
            <strong>{fmt(data.messages?.open_tickets)}</strong>
          </div>
          <div className="status-row">
            <p>اعلان‌های خوانده‌نشده</p>
            <strong>{fmt(data.messages?.unread_notifications)}</strong>
          </div>
        </section>
        <section className="card glass">
          <div className="card-head">
            <h2>گزارش پیشرفته</h2>
          </div>
          <div className="status-row">
            <p>سفارش موفق</p>
            <strong>{fmt(data.reports?.conversion?.paid_orders)}</strong>
          </div>
          <div className="status-row">
            <p>میانگین سفارش</p>
            <strong>{fmt(data.reports?.conversion?.average_order)}</strong>
          </div>
          <div className="status-row">
            <p>کالای بدون فروش</p>
            <strong>{fmt(data.reports?.unsold_products?.length)}</strong>
          </div>
        </section>
      </div>
      {operationModal && (
        <div className="modal-bg" onMouseDown={() => setOperationModal(null)}>
          <form
            className="modal glass"
            onSubmit={submitOperation}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>افزودن {labels[operationModal]}</h2>
              <button
                type="button"
                className="close"
                onClick={() => setOperationModal(null)}
              >
                ×
              </button>
            </div>
            {operationModal === "suppliers" && (
              <div className="form-grid">
                <div className="field">
                  <label>نام تأمین‌کننده</label>
                  <input name="name" required />
                </div>
                <div className="field">
                  <label>نام رابط</label>
                  <input name="contact_name" />
                </div>
                <div className="field">
                  <label>شماره موبایل</label>
                  <input name="phone" dir="ltr" />
                </div>
              </div>
            )}
            {operationModal === "inventory" && (
              <div className="form-grid">
                <div className="field full">
                  <label>محصول</label>
                  <select name="product" required>
                    <option value="">انتخاب کالا</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} — موجودی {fmt(p.stock)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>نوع گردش</label>
                  <select name="movement_type">
                    <option value="IN">ورود</option>
                    <option value="OUT">خروج</option>
                    <option value="ADJUST">اصلاح موجودی نهایی</option>
                  </select>
                </div>
                <div className="field">
                  <label>تعداد</label>
                  <input name="quantity" type="number" min="0" required />
                </div>
                <div className="field full">
                  <label>علت</label>
                  <input name="reason" required />
                </div>
                <div className="field full">
                  <label>شماره مرجع</label>
                  <input name="reference" />
                </div>
              </div>
            )}
            {operationModal === "purchases" && (
              <div className="form-grid">
                <div className="field">
                  <label>تأمین‌کننده</label>
                  <select name="supplier" required>
                    {data.suppliers?.map((x) => (
                      <option value={x.id}>{x.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>محصول</label>
                  <select name="product" required>
                    {products.map((x) => (
                      <option value={x.id}>{x.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>تعداد</label>
                  <input name="quantity" type="number" min="1" required />
                </div>
                <div className="field">
                  <label>قیمت خرید واحد</label>
                  <input name="unit_cost" type="number" min="0" required />
                </div>
                <div className="field full">
                  <label>یادداشت</label>
                  <input name="note" />
                </div>
              </div>
            )}
            {operationModal === "gifts" && (
              <div className="form-grid">
                <div className="field">
                  <label>مبلغ کارت هدیه به تومان</label>
                  <input name="amount" type="number" min="1" required />
                </div>
                <div className="field">
                  <label>تاریخ انقضا</label>
                  <input name="expires_at" type="datetime-local" />
                </div>
              </div>
            )}
            {operationModal === "promotions" && (
              <div className="form-grid">
                <div className="field full">
                  <label>عنوان کمپین</label>
                  <input name="title" required />
                </div>
                <div className="field">
                  <label>نوع تخفیف</label>
                  <select name="promotion_kind">
                    <option value="FIRST_BUY">خرید اول</option>
                    <option value="FREE_SHIPPING">ارسال رایگان</option>
                    <option value="CATEGORY">دسته‌بندی</option>
                    <option value="BRAND">برند</option>
                    <option value="BUY_X_GET_Y">چندتایی</option>
                  </select>
                </div>
                <div className="field">
                  <label>درصد</label>
                  <input name="percent" type="number" min="0" max="100" />
                </div>
                <div className="field">
                  <label>مبلغ ثابت</label>
                  <input name="fixed_amount" type="number" min="0" />
                </div>
              </div>
            )}
            {operationModal === "bundles" && (
              <div className="form-grid">
                <div className="field">
                  <label>عنوان بسته</label>
                  <input name="title" required />
                </div>
                <div className="field">
                  <label>اسلاگ</label>
                  <input name="slug" dir="ltr" required />
                </div>
                <div className="field">
                  <label>محصول</label>
                  <select name="product">
                    {products.map((x) => (
                      <option value={x.id}>{x.name}</option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>تعداد</label>
                  <input
                    name="quantity"
                    type="number"
                    min="1"
                    defaultValue="1"
                  />
                </div>
                <div className="field">
                  <label>قیمت بسته</label>
                  <input name="price" type="number" min="0" required />
                </div>
              </div>
            )}
            {operationModal === "shipments" && (
              <div className="form-grid">
                <div className="field full">
                  <label>سفارش</label>
                  <select name="order">
                    {orders.map((x) => (
                      <option value={x.id}>
                        {x.number} — {displayPhone(x.customer?.phone)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="field">
                  <label>مرحله ارسال</label>
                  <select name="status">
                    <option value="PACKING">آماده‌سازی</option>
                    <option value="POSTED">تحویل پست</option>
                    <option value="IN_TRANSIT">در مسیر</option>
                    <option value="DELIVERED">تحویل‌شده</option>
                  </select>
                </div>
                <div className="field">
                  <label>موقعیت</label>
                  <input name="location" />
                </div>
                <div className="field full">
                  <label>توضیحات</label>
                  <input name="description" />
                </div>
              </div>
            )}
            <div className="save-row">
              <button
                type="button"
                className="secondary"
                onClick={() => setOperationModal(null)}
              >
                انصراف
              </button>
              <button className="primary">ثبت اطلاعات</button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}
