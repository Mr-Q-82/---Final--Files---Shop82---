function OrdersCheckout() {
  const { cart, persistCart, toast } = useStore();
  const [orders, setOrders] = useState([]),
    [addresses, setAddresses] = useState([]),
    [addressId, setAddressId] = useState(""),
    [discountCode, setDiscountCode] = useState(LS.get("checkout_discount", "")),
    [busy, setBusy] = useState(false),
    [orderTab, setOrderTab] = useState("CURRENT"),
    [detailOrder, setDetailOrder] = useState(null),
    [returnOrder, setReturnOrder] = useState(null),
    [returnReason, setReturnReason] = useState(""),
    [returnDescription, setReturnDescription] = useState(""),
    [returning, setReturning] = useState(false);
  const load = () =>
    Promise.all([
      accountApiAll("/orders/?page_size=100"),
      accountApiAll("/auth/addresses/?page_size=100"),
    ])
      .then(([o, a]) => {
        setOrders(o.results || o);
        const rows = a.results || a;
        setAddresses(rows);
        if (rows.length && !addressId)
          setAddressId((rows.find((x) => x.is_default) || rows[0]).id);
      })
      .catch((err) => toast(err.message, "error"));
  useEffect(() => {
    load();
  }, []);
  const checkout = async () => {
    if (!addressId) return toast("ابتدا یک آدرس انتخاب کنید", "error");
    if (!cart.items.length) return toast("سبد خرید خالی است", "error");
    setBusy(true);
    try {
      await accountApi("/orders/checkout/", {
        method: "POST",
        body: JSON.stringify({
          address_id: addressId,
          discount_code: discountCode,
          idempotency_key:
            "web-" + Date.now() + "-" + cart.items.map((x) => x.key).join("-"),
          items: cart.items.map((item) => ({
            product_id: item.apiId,
            variant_id: item.variantId || null,
            customization_option_ids: item.customizationOptionIds || [],
            quantity: item.qty,
          })),
        }),
      });
      persistCart(new CartEngine([]));
      LS.set("checkout_discount", "");
      setDiscountCode("");
      await load();
      toast("سفارش ثبت شد؛ اکنون پرداخت را انجام دهید ✓");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };
  const pay = async (order) => {
    try {
      const result = await accountApi(`/orders/${order.id}/payment/`, {
        method: "POST",
      });
      if (result.transaction?.provider === "MOCK") {
        const response = await fetch(result.redirect_url);
        const data = await response.json();
        if (!response.ok || !data.success)
          throw new Error("پرداخت آزمایشی تأیید نشد");
        await load();
        toast("پرداخت موفق بود؛ سفارش وارد مرحله آماده‌سازی شد ✓");
      } else location.href = result.redirect_url;
    } catch (err) {
      toast(err.message, "error");
    }
  };
  const cancel = async (order) => {
    if (!(await siteConfirm("این سفارش لغو شود؟", "لغو سفارش"))) return;
    try {
      await accountApi(`/orders/${order.id}/cancel/`, {
        method: "POST",
        body: JSON.stringify({ reason: "لغو توسط مشتری" }),
      });
      await load();
      toast("سفارش لغو شد");
    } catch (err) {
      toast(err.message, "error");
    }
  };
  const invoice = async (order) => {
    try {
      const response = await fetch(
        API_BASE + `/orders/${order.id}/invoice-pdf/`,
        {
          headers: {
            Authorization: "Bearer " + AuthTokenVault.get(),
          },
        },
      );
      if (!response.ok) throw new Error("دریافت فاکتور ناموفق بود");
      const blob = await response.blob(),
        url = URL.createObjectURL(blob),
        link = document.createElement("a");
      link.href = url;
      link.download = order.number + ".pdf";
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      toast(err.message, "error");
    }
  };
  const submitReturn = async () => {
    if (returnReason.trim().length < 3)
      return toast("دلیل مرجوعی را بنویسید", "error");
    setReturning(true);
    try {
      await accountApi("/orders/returns/", {
        method: "POST",
        body: JSON.stringify({
          order: returnOrder.id,
          reason: returnReason.trim(),
          description: returnDescription.trim(),
        }),
      });
      setReturnOrder(null);
      setReturnReason("");
      setReturnDescription("");
      await load();
      setOrderTab("RETURNED");
      toast("درخواست مرجوعی ثبت شد و در حال بررسی است");
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setReturning(false);
    }
  };
  const groups = {
    CURRENT: orders.filter(
      (x) =>
        ["PENDING", "PAID", "PROCESSING", "SENT"].includes(x.status) &&
        !x.return_status,
    ),
    DELIVERED: orders.filter(
      (x) => x.status === "DELIVERED" && !x.return_status,
    ),
    RETURNED: orders.filter(
      (x) => !!x.return_status && x.return_status !== "REJECTED",
    ),
    CANCELED: orders.filter((x) => x.status === "CANCELED"),
  };
  const tabs = [
    ["CURRENT", "جاری"],
    ["DELIVERED", "تحویل شده"],
    ["RETURNED", "مرجوع شده"],
    ["CANCELED", "لغو شده"],
  ];
  const visible = groups[orderTab] || [];
  const checkoutSubtotal = cart.items.reduce(
    (sum, item) => sum + Number(item.price || 0) * Number(item.qty || 0),
    0,
  );
  const orderStatusInfo = (order) => {
    if (order.return_status && order.return_status !== "REJECTED")
      return { label: "در فرایند مرجوعی", tone: "returned", step: 4 };
    return {
      PENDING: { label: "در انتظار پرداخت", tone: "pending", step: 1 },
      PAID: { label: "پرداخت‌شده", tone: "processing", step: 2 },
      PROCESSING: { label: "در حال آماده‌سازی", tone: "processing", step: 2 },
      SENT: { label: "تحویل به حامل", tone: "sent", step: 3 },
      DELIVERED: { label: "تحویل‌شده", tone: "delivered", step: 4 },
      CANCELED: { label: "لغوشده", tone: "canceled", step: 1 },
    }[order.status] || {
      label: order.status_display || order.status,
      tone: "pending",
      step: 1,
    };
  };
  return (
    <div>
      <h2 className="section-title">تاریخچه سفارش‌ها</h2>
      <p className="section-sub">پیگیری و مدیریت خریدهای شما</p>
      {cart.items.length > 0 && (
        <div className="glass checkout-current-card">
          <div className="checkout-current-head">
            <div>
              <span className="order-eyebrow">سبد آماده ثبت</span>
              <h3>تکمیل سفارش فعلی</h3>
              <p>{fmt(cart.count())} کالا در {fmt(cart.items.length)} ردیف</p>
            </div>
            <div className="checkout-current-total">
              <small>مبلغ فعلی سفارش</small>
              <strong>{fmt(checkoutSubtotal)} <span>تومان</span></strong>
            </div>
          </div>
          <div className="checkout-item-list">
            {cart.items.map((item) => {
              const ItemIcon = I[item.icon] || I.cpu;
              return (
                <div className="checkout-item-row" key={item.key}>
                  <div className="checkout-item-icon"><ItemIcon className="icon" /></div>
                  <div className="checkout-item-info">
                    <b>{item.name}</b>
                    <div className="checkout-item-meta">
                      <span>{fmt(item.qty)} عدد</span>
                      <span>ارسال {item.ship || "عادی"}</span>
                      {item.color && <span>رنگ {item.color}</span>}
                    </div>
                  </div>
                  <strong>{fmt(item.price * item.qty)} <small>تومان</small></strong>
                </div>
              );
            })}
          </div>
          <div className="checkout-form-grid">
            <div className="field">
              <label>آدرس ارسال</label>
              <select value={addressId} onChange={(e) => setAddressId(e.target.value)}>
                <option value="">انتخاب آدرس</option>
                {addresses.map((a) => (
                  <option value={a.id} key={a.id}>{a.province}، {a.city}، {a.address}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>کد تخفیف</label>
              <input dir="ltr" value={discountCode} placeholder="در صورت داشتن کد وارد کنید"
                onChange={(e) => setDiscountCode(e.target.value.toUpperCase())} />
            </div>
          </div>
          {!addresses.length && <p className="checkout-address-warning">ابتدا از بخش «آدرس‌ها» یک آدرس ثبت کنید.</p>}
          <div className="checkout-submit-row">
            <small>پس از ثبت، سفارش برای پرداخت آماده می‌شود.</small>
            <button className="btn btn-primary" onClick={checkout} disabled={busy || !addresses.length}>
              {busy ? "در حال ثبت..." : "ثبت نهایی سفارش"}
            </button>
          </div>
        </div>
      )}
      <div
        className="glass"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4,1fr)",
          padding: "4px 14px",
          marginBottom: 18,
          overflowX: "auto",
        }}
      >
        {tabs.map(([key, label]) => (
          <button
            key={key}
            onClick={() => setOrderTab(key)}
            style={{
              padding: "15px 8px",
              border: 0,
              borderBottom:
                orderTab === key
                  ? "3px solid var(--primary)"
                  : "3px solid transparent",
              background: "transparent",
              color: orderTab === key ? "var(--primary)" : "var(--text-soft)",
              fontWeight: 800,
              whiteSpace: "nowrap",
            }}
          >
            {label}
            <span style={{ display: "block", marginTop: 4, fontSize: 12 }}>
              {fmt(groups[key].length)}
            </span>
          </button>
        ))}
      </div>
      {!visible.length && (
        <div
          className="glass"
          style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
        >
          سفارشی در این بخش وجود ندارد
        </div>
      )}
      {visible.map((order) => {
        const statusInfo = orderStatusInfo(order);
        return (
        <article className="customer-order-card" key={order.id}>
          <header className="customer-order-head">
            <div className="customer-order-identity">
              <span className={`order-status-badge ${statusInfo.tone}`}>{statusInfo.label}</span>
              <div>
                <b>سفارش {order.number}</b>
                <small>ثبت‌شده در {jalaliDate(order.created_at, true)}</small>
              </div>
            </div>
            <div className="customer-order-total">
              <small>مبلغ سفارش</small>
              <strong>{fmt(order.total)} <span>تومان</span></strong>
            </div>
          </header>

          <div className={`order-progress ${statusInfo.tone}`}>
            {["ثبت سفارش", "آماده‌سازی", "ارسال", "تحویل"].map((label, index) => (
              <div className={index + 1 <= statusInfo.step ? "done" : ""} key={label}>
                <span>{index + 1 <= statusInfo.step ? "✓" : index + 1}</span>
                <small>{label}</small>
              </div>
            ))}
          </div>

          <div className="customer-order-products">
            {order.items.map((item, index) => (
              <div className="customer-order-product" key={item.id || `${order.id}-${index}`}>
                <div className="customer-order-product-index">{fmt(index + 1)}</div>
                <div>
                  <b>{item.product_name}</b>
                  <small>{fmt(item.quantity || 1)} عدد{item.variant_name ? ` · ${item.variant_name}` : ""}</small>
                </div>
                <strong>{fmt(item.line_total || Number(item.unit_price || 0) * Number(item.quantity || 1))} <span>تومان</span></strong>
              </div>
            ))}
          </div>

          <div className="customer-order-meta">
            <span><b>تخفیف</b>{fmt(order.discount_amount)} تومان</span>
            <span><b>کد رهگیری</b>{order.tracking_code || "پس از ارسال ثبت می‌شود"}</span>
            <span><b>تعداد کالا</b>{fmt(order.items.reduce((sum, item) => sum + Number(item.quantity || 1), 0))}</span>
          </div>

            {order.shipment_events?.length > 0 && (
              <div className="customer-order-events">
                {order.shipment_events.map((e) => (
                  <span className="pill" key={e.id}>
                    {e.status} · {jalaliDate(e.created_at)}
                  </span>
                ))}
              </div>
            )}
            <footer className="customer-order-actions">
              {order.status === "PENDING" && (
                <>
                  <button
                    className="btn btn-primary"
                    onClick={() => pay(order)}
                  >
                    پرداخت
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={() => cancel(order)}
                  >
                    لغو
                  </button>
                </>
              )}
              <button
                className="btn btn-ghost"
                onClick={() => setDetailOrder(order)}
              >
                جزئیات سفارش
              </button>
              {order.status === "DELIVERED" && !order.return_status && (
                <button
                  className="btn btn-ghost"
                  style={{ color: "var(--danger)" }}
                  onClick={() => setReturnOrder(order)}
                >
                  درخواست مرجوعی
                </button>
              )}
              <button className="btn btn-ghost" onClick={() => invoice(order)}>
                فاکتور PDF
              </button>
            </footer>
        </article>
      );})}
      {detailOrder &&
        ReactDOM.createPortal(
          <>
            <div
              className="overlay"
              style={{ zIndex: 2147483646 }}
              onClick={() => setDetailOrder(null)}
            />
            <div
              className="glass"
              style={{
                position: "fixed",
                inset: "50% auto auto 50%",
                transform: "translate(-50%,-50%)",
                zIndex: 2147483647,
                padding: 24,
                width: "min(760px,94vw)",
                maxHeight: "88vh",
                overflowY: "auto",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <div>
                  <h3>جزئیات سفارش {detailOrder.number}</h3>
                  <small>{jalaliDate(detailOrder.created_at, true)}</small>
                </div>
                <button
                  className="iconbtn"
                  onClick={() => setDetailOrder(null)}
                >
                  ×
                </button>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(5,1fr)",
                  gap: 6,
                  margin: "22px 0",
                  overflowX: "auto",
                }}
              >
                {[
                  ["PENDING", "ثبت سفارش"],
                  ["PAID", "پرداخت"],
                  ["PROCESSING", "آماده‌سازی"],
                  ["SENT", "ارسال"],
                  ["DELIVERED", "تحویل"],
                ].map(([status, label], index) => {
                  const current = [
                    "PENDING",
                    "PAID",
                    "PROCESSING",
                    "SENT",
                    "DELIVERED",
                  ].indexOf(detailOrder.status);
                  return (
                    <div
                      key={status}
                      style={{
                        textAlign: "center",
                        minWidth: 92,
                        color:
                          index <= current ? "var(--primary)" : "var(--muted)",
                      }}
                    >
                      <div
                        style={{
                          height: 5,
                          borderRadius: 9,
                          background:
                            index <= current
                              ? "var(--primary)"
                              : "var(--border)",
                          marginBottom: 8,
                        }}
                      ></div>
                      <b style={{ fontSize: 12 }}>{label}</b>
                    </div>
                  );
                })}
              </div>
              {detailOrder.items.map((item) => (
                <div className="status-row" key={item.id}>
                  <p>
                    <b>{item.product_name}</b>
                    <small>
                      {item.variant_name || "مدل اصلی"} · {fmt(item.quantity)}{" "}
                      عدد
                    </small>
                  </p>
                  <strong>{fmt(item.line_total)} تومان</strong>
                </div>
              ))}
              <div className="glass" style={{ padding: 14, marginTop: 14 }}>
                <b>آدرس تحویل</b>
                <p style={{ fontSize: 13, color: "var(--text-soft)" }}>
                  {detailOrder.address_snapshot?.province}،{" "}
                  {detailOrder.address_snapshot?.city}،{" "}
                  {detailOrder.address_snapshot?.address}
                </p>
                <small>
                  تحویل‌گیرنده: {detailOrder.address_snapshot?.recipient_name} ·{" "}
                  {displayPhone(detailOrder.address_snapshot?.recipient_phone)}
                </small>
              </div>
              <div className="status-row">
                <p>مبلغ کالاها</p>
                <strong>{fmt(detailOrder.subtotal)} تومان</strong>
              </div>
              <div className="status-row">
                <p>هزینه ارسال</p>
                <strong>{fmt(detailOrder.shipping_cost)} تومان</strong>
              </div>
              <div className="status-row">
                <p>تخفیف</p>
                <strong>{fmt(detailOrder.discount_amount)} تومان</strong>
              </div>
              <div className="status-row">
                <p>
                  <b>مبلغ نهایی</b>
                </p>
                <strong>{fmt(detailOrder.total)} تومان</strong>
              </div>
              {detailOrder.status === "DELIVERED" &&
                !detailOrder.return_status && (
                  <button
                    className="btn btn-primary"
                    style={{ marginTop: 14 }}
                    onClick={() => {
                      setDetailOrder(null);
                      setReturnOrder(detailOrder);
                    }}
                  >
                    درخواست مرجوعی کالا
                  </button>
                )}
            </div>
          </>,
          document.body,
        )}
      {returnOrder &&
        ReactDOM.createPortal(
          <>
            <div
              className="overlay"
              style={{ zIndex: 2147483646 }}
              onClick={() => setReturnOrder(null)}
            />
            <div
              className="glass"
              style={{
                position: "fixed",
                inset: "50% auto auto 50%",
                transform: "translate(-50%,-50%)",
                zIndex: 2147483647,
                padding: 24,
                width: "min(520px,92vw)",
              }}
            >
              <h3>چرا این سفارش را مرجوع می‌کنید؟</h3>
              <p style={{ color: "var(--text-soft)", fontSize: 13 }}>
                سفارش {returnOrder.number}
              </p>
              <div className="field">
                <label>دلیل مرجوعی</label>
                <select
                  value={returnReason}
                  onChange={(e) => setReturnReason(e.target.value)}
                >
                  <option value="">انتخاب کنید</option>
                  {[
                    "کالا آسیب‌دیده است",
                    "کالای اشتباه ارسال شده",
                    "با توضیحات محصول مطابقت ندارد",
                    "از خرید منصرف شده‌ام",
                    "دلیل دیگر",
                  ].map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div className="field">
                <label>توضیحات بیشتر</label>
                <textarea
                  rows="4"
                  value={returnDescription}
                  onChange={(e) => setReturnDescription(e.target.value)}
                  placeholder="جزئیات مشکل را بنویسید..."
                />
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button
                  className="btn btn-primary"
                  disabled={returning}
                  onClick={submitReturn}
                >
                  {returning ? "در حال ثبت..." : "ثبت درخواست مرجوعی"}
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setReturnOrder(null)}
                >
                  انصراف
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}
