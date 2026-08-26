function Dashboard({ data, onNavigate }) {
  const m = data?.metrics || {},
    growth = data?.growth || {},
    returns = data?.return_metrics || {},
    chart = data?.sales_chart || [],
    recent = data?.recent_orders || [],
    statuses = data?.status_breakdown || [],
    top = data?.top_products || [],
    low = data?.low_stock_products || [],
    customers = data?.top_customers || [],
    inventory = data?.recent_inventory || [];
  const max = Math.max(...chart.map((x) => +x.revenue), 1),
    totalStatuses = statuses.reduce((s, x) => s + x.count, 0) || 1;
  const statusColors = {
    PENDING: "#f59e0b",
    PAID: "#8b5cf6",
    PROCESSING: "#06b6d4",
    SENT: "#3b82f6",
    DELIVERED: "#10b981",
    CANCELED: "#ef4444",
    RETURNED: "#ec4899",
  };
  let cursor = 0;
  const gradient = statuses
    .map((x) => {
      const start = cursor;
      cursor += (x.count / totalStatuses) * 100;
      return `${statusColors[x.status] || "#94a3b8"} ${start}% ${cursor}%`;
    })
    .join(",");
  const trend = (value) => (
    <span
      className="trend"
      style={
        value < 0
          ? { color: "var(--danger)", background: "rgba(239,68,68,.1)" }
          : {}
      }
    >
      {value >= 0 ? "↗" : "↘"} {Math.abs(value || 0)}٪
    </span>
  );
  const cards = [
    ["درآمد کل", fmt(m.revenue) + " تومان", "↗", growth.revenue],
    ["سفارش‌ها", fmt(m.orders), "▦", growth.orders],
    ["مشتریان", fmt(m.customers), "♙", growth.customers],
    ["محصولات", fmt(m.products), "◫", null],
  ];
  return (
    <>
      <section className="admin-welcome">
        <div>
          <span className="eyebrow">مرکز فرمان فروشگاه</span>
          <h2>امروز چه چیزی را مدیریت می‌کنید؟</h2>
          <p>عملیات مهم فروشگاه، محتوا و ارتباط با مشتریان از همین‌جا در دسترس است.</p>
        </div>
        <div className="admin-quick-actions">
          {[
            ["products", "＋", "افزودن محصول", "کالا، تصویر و موجودی"],
            ["orders", "▦", "مدیریت سفارش‌ها", `${fmt(m.pending_orders || 0)} سفارش در انتظار`],
            ["inventory", "⇅", "کنترل موجودی", `${fmt(m.low_stock || 0)} کالای کم‌موجود`],
            ["content", "▤", "بنر و اسلایدر", "ویرایش ویترین فروشگاه"],
            ["notifications", "●", "ارسال اعلان", "پیام به کاربران"],
            ["settings", "⚙", "تنظیمات سایت", "نام، لوگو و اطلاعات"],
          ].map((action) => (
            <button key={action[0]} onClick={() => onNavigate(action[0])}>
              <span>{action[1]}</span><div><b>{action[2]}</b><small>{action[3]}</small></div><em>←</em>
            </button>
          ))}
        </div>
      </section>
      <div className="dash-tools">
        <div>
          <button className="add" onClick={() => location.reload()}>
            ↻ بروزرسانی
          </button>
          <button
            className="secondary"
            onClick={() =>
              downloadFile("/orders/admin/all/export_csv/", "orders.csv")
            }
          >
            ↓ خروجی سفارش‌ها
          </button>
        </div>
        <small style={{ color: "var(--soft)" }}>
          آخرین بروزرسانی: {jalaliDate(data?.generated_at, true)}
        </small>
      </div>
      <div className="metrics">
        {cards.map((x) => (
          <article className="metric glass" key={x[0]}>
            <div className="metric-head">
              <span className="metric-icon">{x[2]}</span>
              {x[3] === null ? (
                <span className="trend">{fmt(m.low_stock)} کم‌موجودی</span>
              ) : (
                trend(x[3])
              )}
            </div>
            <p>{x[0]}</p>
            <strong>{x[1]}</strong>
          </article>
        ))}
      </div>
      <div className="dash-grid">
        <section className="card glass">
          <div className="card-head">
            <h2>آمار فروش ۱۴ روز اخیر</h2>
            <span className="pill green">امروز {fmt(m.today_sales)} تومان</span>
          </div>
          <div className="spark-bars">
            {chart.length ? (
              chart.map((x, i) => (
                <div className="spark-col" key={i}>
                  <div
                    className="spark-bar"
                    style={{
                      height: Math.max(7, (+x.revenue / max) * 100) + "%",
                    }}
                    title={`${fmt(x.revenue)} تومان · ${fmt(x.orders)} سفارش`}
                  ></div>
                  <small>{jalaliShort(x.day)}</small>
                </div>
              ))
            ) : (
              <div className="empty">هنوز فروش ثبت نشده است.</div>
            )}
          </div>
        </section>
        <section className="card glass">
          <div className="card-head">
            <h2>وضعیت سفارش‌ها</h2>
            <span>{fmt(totalStatuses)} کل</span>
          </div>
          <div
            className="donut"
            style={{
              background: `conic-gradient(${gradient || "#e2e8f0 0 100%"})`,
            }}
          >
            <div className="donut-center">
              <b>{fmt(totalStatuses)}</b>
              <small>سفارش</small>
            </div>
          </div>
          <div className="legend">
            {statuses.map((x) => (
              <span key={x.status}>
                <i style={{ background: statusColors[x.status] }}></i>
                {statusLabel[x.status] || x.status}: {fmt(x.count)}
              </span>
            ))}
          </div>
        </section>
        <section className="card glass wide-card operations-feed">
          <div className="card-head">
            <div>
              <h2>آخرین گردش‌های انبار</h2>
              <small>نمای زنده ورود، خروج، فروش و بازگشت کالا</small>
            </div>
            <button onClick={() => onNavigate("inventory")}>مدیریت انبار</button>
          </div>
          <div className="operations-feed-list">
            {inventory.length ? inventory.slice(0, 8).map((movement) => {
              const incoming = movement.movement_type === "IN";
              return (
                <button key={movement.id} onClick={() => onNavigate("inventory")}>
                  <span className={incoming ? "movement-in" : "movement-out"}>{incoming ? "＋" : "−"}</span>
                  <div>
                    <b>{movement.product__name}</b>
                    <small>{movement.reason || movement.reference || "گردش ثبت‌شده"}</small>
                  </div>
                  <strong>{incoming ? "+" : "−"}{fmt(movement.quantity)}</strong>
                  <em>موجودی {fmt(movement.stock_after)}</em>
                  <time>{jalaliDate(movement.created_at, true)}</time>
                </button>
              );
            }) : <div className="empty">هنوز گردش انباری ثبت نشده است.</div>}
          </div>
        </section>
      </div>
      <div className="dash-bottom">
        <section className="card glass">
          <div className="card-head">
            <h2>آخرین سفارش‌ها</h2>
            <button onClick={() => onNavigate("orders")}>مشاهده همه</button>
          </div>
          <div className="mini-list">
            {recent.slice(0, 6).map((o) => (
              <div className="mini-row" key={o.id}>
                <div>
                  <b>{o.number}</b>
                  <small>
                    {displayPhone(o.user__phone)} · {jalaliDate(o.created_at)}
                  </small>
                </div>
                <div style={{ textAlign: "left" }}>
                  <b>{fmt(o.total)}</b>
                  <small>{statusLabel[o.status]}</small>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="card glass">
          <div className="card-head">
            <h2>محصولات پرفروش</h2>
          </div>
          <div className="mini-list">
            {top.map((p) => (
              <div className="mini-row" key={p.id}>
                <div>
                  <b>{p.name}</b>
                  <small>موجودی: {fmt(p.stock)}</small>
                </div>
                <div style={{ textAlign: "left" }}>
                  <b>{fmt(p.sold_count)} فروش</b>
                  <small>{fmt(p.price)} تومان</small>
                </div>
              </div>
            ))}
          </div>
        </section>
        <section className="card glass">
          <div className="card-head">
            <h2>مشتریان برتر</h2>
          </div>
          <div className="mini-list">
            {customers.map((c) => (
              <div className="mini-row" key={c.id}>
                <div>
                  <b>
                    {`${c.first_name || ""} ${c.last_name || ""}`.trim() ||
                      displayPhone(c.phone)}
                  </b>
                  <small>{fmt(c.orders_count)} سفارش</small>
                </div>
                <b>{fmt(c.total_spent)} تومان</b>
              </div>
            ))}
          </div>
        </section>
        <section className="card glass wide-card">
          <div className="card-head">
            <h2>هشدار موجودی انبار</h2>
            <span className="pill yellow">{fmt(low.length)} کالا</span>
          </div>
          <div className="table-card">
            <table>
              <thead>
                <tr>
                  <th>کالا</th>
                  <th>کد کالا</th>
                  <th>موجودی</th>
                  <th>وضعیت</th>
                </tr>
              </thead>
              <tbody>
                {low.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <b>{p.name}</b>
                    </td>
                    <td dir="ltr">{p.sku}</td>
                    <td>{fmt(p.stock)}</td>
                    <td>
                      <span
                        className={"pill " + (p.stock === 0 ? "red" : "yellow")}
                      >
                        {p.stock === 0 ? "ناموجود" : "رو به اتمام"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
        <section className="card glass">
          <div className="card-head">
            <h2>آمار مرجوعی‌ها</h2>
            <span className="pill red">{fmt(returns.all)} درخواست</span>
          </div>
          {[
            ["ثبت‌شده", fmt(returns.requested)],
            ["در حال بررسی", fmt(returns.reviewing)],
            ["تأییدشده", fmt(returns.approved)],
            ["بازپرداخت‌شده", fmt(returns.refunded)],
            ["مبلغ بازگشتی", fmt(returns.amount) + " تومان"],
          ].map((x) => (
            <div className="status-row" key={x[0]}>
              <p>
                <b>{x[0]}</b>
              </p>
              <strong>{x[1]}</strong>
            </div>
          ))}
        </section>
        <section className="card glass">
          <div className="card-head">
            <h2>خلاصه عملکرد</h2>
          </div>
          {[
            ["میانگین مبلغ سفارش", fmt(m.average_order) + " تومان"],
            ["ورود انبار امروز", fmt(m.stock_in_today)],
            ["خروج انبار امروز", fmt(m.stock_out_today)],
            ["بازگشت مرجوعی امروز", fmt(m.return_stock_today)],
            ["تحویل‌شده", fmt(m.delivered_orders)],
            ["لغوشده", fmt(m.canceled_orders)],
          ].map((x) => (
            <div className="status-row" key={x[0]}>
              <p>
                <b>{x[0]}</b>
              </p>
              <strong>{x[1]}</strong>
            </div>
          ))}
        </section>
      </div>
    </>
  );
}
