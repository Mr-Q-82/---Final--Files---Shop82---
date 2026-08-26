function CommerceManager({ kind }) {
  const cfg = {
    tickets: { title: "تیکت‌های پشتیبانی", path: "/auth/tickets/" },
    returns: { title: "درخواست‌های مرجوعی", path: "/orders/returns/" },
    variants: { title: "تنوع محصولات", path: "/catalog/variants/" },
    flash: { title: "فروش ویژه زمان‌دار", path: "/catalog/flash-sales/" },
    audit: { title: "گزارش فعالیت مدیران", path: "/auth/admin/audit-logs/" },
  }[kind];
  const [items, setItems] = useState([]),
    [products, setProducts] = useState([]),
    [error, setError] = useState(""),
    [activeTicket, setActiveTicket] = useState(null),
    [activeReturn, setActiveReturn] = useState(null),
    [createModal, setCreateModal] = useState(false),
    [editingCommerce, setEditingCommerce] = useState(null),
    [selectedFlashProducts, setSelectedFlashProducts] = useState([]),
    [deleteTarget, setDeleteTarget] = useState(null),
    [reply, setReply] = useState("");
  const load = () =>
    Promise.all([
      apiAll(cfg.path + "?page_size=100"),
      apiAll("/catalog/products/?page_size=100"),
    ])
      .then(([r, p]) => {
        setItems(r.results || r);
        setProducts(p.results || p);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, [kind]);
  const add = (item = null) => {
    setEditingCommerce(item);
    setSelectedFlashProducts(item?.product ? [String(item.product)] : []);
    setCreateModal(true);
  };
  const saveCommerce = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      if (kind === "variants") {
        const attributes = {};
        String(f.get("attributes") || "")
          .split("\n")
          .forEach((line) => {
            const [key, ...value] = line.split(":");
            if (key?.trim() && value.length)
              attributes[key.trim()] = value.join(":").trim();
          });
        await api(cfg.path, {
          method: "POST",
          body: JSON.stringify({
            product: f.get("product"),
            name: f.get("name"),
            sku: f.get("sku"),
            attributes,
            price: Number(f.get("price")),
            stock: Number(f.get("stock")),
            is_active: true,
          }),
        });
      }
      if (kind === "flash") {
        const payload = {
          title: f.get("title"),
          discount_percent: Number(f.get("discount_percent") || 0),
          special_price: f.get("special_price")
            ? Number(f.get("special_price"))
            : null,
          starts_at: jalaliToIso(f.get("starts_at")),
          ends_at: jalaliToIso(f.get("ends_at")),
          stock_limit: Number(f.get("stock_limit") || 0),
          is_active: true,
        };
        if (editingCommerce) {
          await api(`${cfg.path}${editingCommerce.id}/`, {
            method: "PATCH",
            body: JSON.stringify({ ...payload, product: f.get("product") }),
          });
        } else {
          await api(`${cfg.path}bulk-create/`, {
            method: "POST",
            body: JSON.stringify({
              ...payload,
              product_ids: selectedFlashProducts,
            }),
          });
        }
      }
      setCreateModal(false);
      setEditingCommerce(null);
      await load();
    } catch (err) {
      setError(err.message);
    }
  };
  const advance = async (x) => {
    try {
      if (kind === "returns") {
        const next = {
          REQUESTED: "REVIEWING",
          REVIEWING: "APPROVED",
          APPROVED: "REFUNDED",
        }[x.status];
        if (next)
          await api(cfg.path + x.id + "/", {
            method: "PATCH",
            body: JSON.stringify({ status: next }),
          });
      } else if (kind === "tickets")
        await api(cfg.path + x.id + "/close/", { method: "POST" });
      await load();
    } catch (e) {
      setError(e.message);
    }
  };
  const openTicket = async (x) => {
    try {
      setActiveTicket(await api(cfg.path + x.id + "/"));
    } catch (e) {
      setError(e.message);
    }
  };
  const answerTicket = async () => {
    if (!reply.trim()) return;
    try {
      await api(cfg.path + activeTicket.id + "/reply/", {
        method: "POST",
        body: JSON.stringify({ message: reply }),
      });
      setReply("");
      setActiveTicket(await api(cfg.path + activeTicket.id + "/"));
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const closeTicket = async () => {
    try {
      await api(cfg.path + activeTicket.id + "/close/", { method: "POST" });
      setActiveTicket(await api(cfg.path + activeTicket.id + "/"));
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const removeCommerce = async () => {
    if (!deleteTarget) return;
    try {
      await api(cfg.path + deleteTarget.id + "/", { method: "DELETE" });
      setDeleteTarget(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  if (kind === "audit")
    return (
      <>
        {error && <div className="error">{error}</div>}
        <div className="table-card glass">
          <table>
            <thead>
              <tr>
                <th>مدیر</th>
                <th>شماره موبایل</th>
                <th>شرح کامل عملیات</th>
                <th>مسیر</th>
                <th>IP</th>
                <th>تاریخ شمسی</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.id}>
                  <td>
                    <b>{x.actor_name || "مدیر"}</b>
                  </td>
                  <td dir="ltr">{displayPhone(x.actor_phone)}</td>
                  <td style={{ minWidth: 300 }}>{x.description}</td>
                  <td dir="ltr">{x.target_type}</td>
                  <td dir="ltr">{x.ip_address || "—"}</td>
                  <td>{jalaliDate(x.created_at, true)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>
    );
  if (kind === "returns")
    return (
      <>
        {error && <div className="error">{error}</div>}
        <div className="table-card glass">
          <table>
            <thead>
              <tr>
                <th>سفارش</th>
                <th>مشتری</th>
                <th>محصولات</th>
                <th>علت</th>
                <th>وضعیت</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.id}>
                  <td>
                    <b>{x.order_number}</b>
                    <small style={{ display: "block" }}>
                      {jalaliDate(x.created_at, true)}
                    </small>
                  </td>
                  <td>
                    <b>{x.customer?.name || "بدون نام"}</b>
                    <small dir="ltr" style={{ display: "block" }}>
                      {displayPhone(x.customer?.phone)}
                    </small>
                  </td>
                  <td>
                    {x.order_detail?.items
                      ?.map((i) => `${i.product_name} × ${fmt(i.quantity)}`)
                      .join("، ")}
                  </td>
                  <td>{x.reason}</td>
                  <td>
                    <span
                      className={
                        "pill " +
                        (x.status === "REFUNDED"
                          ? "green"
                          : x.status === "REJECTED"
                            ? "red"
                            : "yellow")
                      }
                    >
                      {x.status_display || x.status}
                    </span>
                  </td>
                  <td>
                    <div style={{ display: "flex", gap: 6 }}>
                      <button
                        className="secondary"
                        onClick={() => setActiveReturn(x)}
                      >
                        جزئیات
                      </button>
                      {!["REFUNDED", "REJECTED"].includes(x.status) && (
                        <button
                          className="primary"
                          style={{ width: "auto" }}
                          onClick={() => advance(x)}
                        >
                          مرحله بعد
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {activeReturn && (
          <div className="modal-bg" onMouseDown={() => setActiveReturn(null)}>
            <section
              className="modal glass"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2>مرجوعی سفارش {activeReturn.order_number}</h2>
                  <small>{activeReturn.status_display}</small>
                </div>
                <button className="close" onClick={() => setActiveReturn(null)}>
                  ×
                </button>
              </div>
