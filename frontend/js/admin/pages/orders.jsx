function Orders() {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [detail, setDetail] = useState(null),
    [error, setError] = useState("");
  const load = () =>
    apiAll("/orders/admin/all/?page_size=100")
      .then((r) => setItems(r.results || r))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const change = async (o, status) => {
    try {
      await api(`/orders/admin/all/${o.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  const tracking = async (o) => {
    try {
      await api(`/orders/admin/all/${o.id}/generate-tracking/`, {
        method: "POST",
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  if (loading) return <div className="loading"></div>;
  return (
    <>
      <div className="toolbar">
        <button
          className="add"
          onClick={() =>
            downloadFile("/orders/admin/all/export_csv/", "orders.csv")
          }
        >
          خروجی CSV سفارش‌ها
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="table-card glass">
        <table>
          <thead>
            <tr>
              <th>شماره سفارش</th>
              <th>مشتری</th>
              <th>تاریخ شمسی</th>
              <th>مبلغ</th>
              <th>رهگیری یکتا</th>
              <th>وضعیت</th>
              <th>جزئیات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((o) => (
              <tr key={o.id}>
                <td>
                  <b>{o.number}</b>
                  <small style={{ display: "block" }}>
                    {fmt(o.items?.length)} قلم
                  </small>
                </td>
                <td>
                  <b>{o.customer?.name || "بدون نام"}</b>
                  <small dir="ltr" style={{ display: "block" }}>
                    {displayPhone(o.customer?.phone)}
                  </small>
                </td>
                <td>{jalaliDate(o.created_at, true)}</td>
                <td>{fmt(o.total)} تومان</td>
                <td>
                  {o.tracking_code ? (
                    <b dir="ltr">{o.tracking_code}</b>
                  ) : (
                    <button className="secondary" onClick={() => tracking(o)}>
                      ساخت خودکار
                    </button>
                  )}
                </td>
                <td>
                  <select
                    value={o.status}
                    onChange={(e) => change(o, e.target.value)}
                  >
                    {Object.entries(statusLabel).map(([k, v]) => (
                      <option value={k} key={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="secondary" onClick={() => setDetail(o)}>
                    مشاهده کامل
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {detail && (
        <div className="modal-bg" onMouseDown={() => setDetail(null)}>
          <section
            className="modal glass"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <div>
                <h2>سفارش {detail.number}</h2>
                <small>
                  {jalaliDate(detail.created_at, true)} ·{" "}
                  {statusLabel[detail.status]}
                </small>
              </div>
              <button className="close" onClick={() => setDetail(null)}>
                ×
              </button>
            </div>
            <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
              <section className="card">
                <h2>اطلاعات مشتری</h2>
                <p>
                  {detail.customer?.name || "بدون نام"}
                  <br />
                  <span dir="ltr">{displayPhone(detail.customer?.phone)}</span>
                  <br />
                  {detail.customer?.email || "ایمیل ثبت نشده"}
                  <br />
                  کد ملی: {detail.customer?.national_id || "—"}
                </p>
              </section>
              <section className="card">
                <h2>آدرس تحویل</h2>
                <p>
                  {detail.address_snapshot?.recipient_name}
                  <br />
                  {detail.address_snapshot?.province}،{" "}
                  {detail.address_snapshot?.city}
                  <br />
                  {detail.address_snapshot?.address}
                  <br />
                  کدپستی: {detail.address_snapshot?.postal_code || "—"}
                </p>
              </section>
            </div>
            <div className="table-card" style={{ marginTop: 15 }}>
              <table>
                <thead>
                  <tr>
                    <th>محصول</th>
                    <th>تنوع</th>
                    <th>تعداد</th>
                    <th>قیمت</th>
                    <th>جمع</th>
                  </tr>
                </thead>
                <tbody>
                  {detail.items?.map((x) => (
                    <tr key={x.id}>
                      <td>
                        <b>{x.product_name}</b>
                      </td>
                      <td>{x.variant_name || "—"}</td>
                      <td>{fmt(x.quantity)}</td>
                      <td>{fmt(x.unit_price)}</td>
                      <td>{fmt(x.line_total)} تومان</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="status-row">
              <p>
                <b>جمع کالاها</b>
              </p>
              <strong>{fmt(detail.subtotal)} تومان</strong>
            </div>
            <div className="status-row">
              <p>
                <b>ارسال / تخفیف</b>
              </p>
              <strong>
                {fmt(detail.shipping_cost)} / {fmt(detail.discount_amount)}{" "}
                تومان
              </strong>
            </div>
            <div className="status-row">
              <p>
                <b>مبلغ نهایی</b>
              </p>
              <strong>{fmt(detail.total)} تومان</strong>
            </div>
            {detail.tracking_code && (
              <div className="status-row">
                <p>
                  <b>کد رهگیری</b>
                </p>
                <strong dir="ltr">{detail.tracking_code}</strong>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}
