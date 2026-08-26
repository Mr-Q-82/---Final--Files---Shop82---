              <div className="grid" style={{ gridTemplateColumns: "1fr 1fr" }}>
                <section className="card">
                  <h2>مشتری</h2>
                  <p>
                    {activeReturn.customer?.name || "بدون نام"}
                    <br />
                    <span dir="ltr">
                      {displayPhone(activeReturn.customer?.phone)}
                    </span>
                    <br />
                    کد ملی: {activeReturn.customer?.national_id || "—"}
                  </p>
                </section>
                <section className="card">
                  <h2>نشانی دریافت محصول</h2>
                  <p>
                    {activeReturn.order_detail?.address_snapshot?.province}،{" "}
                    {activeReturn.order_detail?.address_snapshot?.city}
                    <br />
                    {activeReturn.order_detail?.address_snapshot?.address}
                    <br />
                    کدپستی:{" "}
                    {activeReturn.order_detail?.address_snapshot?.postal_code ||
                      "—"}
                  </p>
                </section>
              </div>
              <div className="field" style={{ marginTop: 15 }}>
                <label>علت و توضیح مشتری</label>
                <div className="card">
                  {activeReturn.reason}
                  <br />
                  {activeReturn.description || "توضیح بیشتری ثبت نشده است."}
                </div>
              </div>
              <div className="table-card">
                <table>
                  <thead>
                    <tr>
                      <th>محصول</th>
                      <th>تنوع</th>
                      <th>تعداد</th>
                      <th>مبلغ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeReturn.order_detail?.items?.map((i) => (
                      <tr key={i.id}>
                        <td>
                          <b>{i.product_name}</b>
                        </td>
                        <td>{i.variant_name || "—"}</td>
                        <td>{fmt(i.quantity)}</td>
                        <td>{fmt(i.line_total)} تومان</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="status-row">
                <p>
                  <b>مبلغ قابل بازپرداخت</b>
                </p>
                <strong>
                  {fmt(
                    activeReturn.refund_amount ||
                      activeReturn.order_detail?.total,
                  )}{" "}
                  تومان
                </strong>
              </div>
              <p style={{ color: "var(--soft)", fontSize: 11, lineHeight: 2 }}>
                با تأیید درخواست، مبلغ همان لحظه به کیف پول مشتری برمی‌گردد و
                پیام مبلغ بازپرداخت و مراجعه پیک نیز خودکار ارسال می‌شود.
              </p>
              {!["REFUNDED", "REJECTED"].includes(activeReturn.status) && (
                <button
                  className="primary"
                  onClick={async () => {
                    await advance(activeReturn);
                    setActiveReturn(null);
                  }}
                >
                  ثبت مرحله بعد و اطلاع به مشتری
                </button>
              )}
            </section>
          </div>
        )}
      </>
    );
  if (kind === "tickets")
    return (
      <>
        {error && <div className="error">{error}</div>}
        <div className="table-card glass">
          <table>
            <thead>
              <tr>
                <th>موضوع</th>
                <th>کاربر</th>
                <th>وضعیت</th>
                <th>آخرین بروزرسانی</th>
                <th>عملیات</th>
              </tr>
            </thead>
            <tbody>
              {items.map((x) => (
                <tr key={x.id}>
                  <td>
                    <b>{x.subject}</b>
                  </td>
                  <td>{displayPhone(x.user_phone || "")}</td>
                  <td>
                    <span
                      className={
                        "pill " +
                        (x.status === "CLOSED"
                          ? "red"
                          : x.status === "ANSWERED"
                            ? "green"
                            : "yellow")
                      }
                    >
                      {x.status === "OPEN"
                        ? "منتظر پاسخ مدیر"
                        : x.status === "ANSWERED"
                          ? "پاسخ داده شده"
                          : "پایان یافته"}
                    </span>
                  </td>
                  <td>{jalaliDate(x.updated_at, true)}</td>
                  <td>
                    <button className="secondary" onClick={() => openTicket(x)}>
                      مشاهده گفت‌وگو
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {activeTicket && (
          <div className="modal-bg" onMouseDown={() => setActiveTicket(null)}>
            <section
              className="modal glass"
              onMouseDown={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div>
                  <h2>{activeTicket.subject}</h2>
                  <small>
                    {activeTicket.status === "CLOSED"
                      ? "گفت‌وگو پایان یافته"
                      : "گفت‌وگو با کاربر"}
                  </small>
                </div>
                <button className="close" onClick={() => setActiveTicket(null)}>
                  ×
                </button>
              </div>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 9,
                  marginBottom: 18,
                }}
              >
                {activeTicket.messages?.map((msg) => (
                  <div
                    key={msg.id}
                    style={{
                      alignSelf: msg.is_staff_reply ? "flex-end" : "flex-start",
                      maxWidth: "82%",
                      padding: "11px 14px",
                      borderRadius: 14,
                      background: msg.is_staff_reply
                        ? "var(--primary)"
                        : "var(--solid)",
                      color: msg.is_staff_reply ? "#fff" : "var(--text)",
                    }}
                  >
                    <b
                      style={{ display: "block", fontSize: 9, marginBottom: 4 }}
                    >
                      {msg.is_staff_reply ? "مدیریت" : "کاربر"}
                    </b>
                    {msg.message}
                    <small
                      style={{ display: "block", marginTop: 5, opacity: 0.7 }}
                    >
                      {jalaliDate(msg.created_at, true)}
                    </small>
                  </div>
                ))}
              </div>
              {activeTicket.status !== "CLOSED" && (
                <>
                  <div className="field">
                    <label>پاسخ مدیر</label>
                    <textarea
                      rows="3"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="پاسخ خود را بنویسید..."
                    />
                  </div>
                  <div className="save-row">
                    <button className="danger-btn" onClick={closeTicket}>
                      پایان گفت‌وگو
                    </button>
                    <button className="primary" onClick={answerTicket}>
                      ارسال پاسخ
                    </button>
                  </div>
                </>
              )}
            </section>
          </div>
        )}
      </>
    );
  return (
    <>
      {kind === "variants" && (
        <section className="card glass" style={{ marginBottom: 14 }}>
          <h2>تنوع کالا و CSV چیست؟</h2>
          <p style={{ color: "var(--soft)", lineHeight: 2 }}>
            «تنوع» برای مدل‌های مختلف یک محصول است؛ مثلاً «گوشی X، مشکی، حافظه
            ۲۵۶ گیگ». هر تنوع کد SKU، قیمت، موجودی و ویژگی‌های مستقل دارد. در
            افزودن جدید، محصول اصلی را مشخص می‌کنید تا اشتباهاً تنوع روی کالای
            دیگری ساخته نشود. CSV برای خروجی گرفتن از محصولات، ویرایش گروهی در
            Excel و ورود دوباره اطلاعات استفاده می‌شود.
          </p>
        </section>
      )}
      {kind === "flash" && (
        <section className="card glass" style={{ marginBottom: 14 }}>
          <h2>فروش ویژه چیست؟</h2>
          <p style={{ color: "var(--soft)", lineHeight: 2 }}>
            فروش ویژه تخفیف زمان‌دار یک محصول مشخص است. محصول، درصد، تاریخ شروع
            و پایان و سقف فروش را تعیین می‌کنید؛ قیمت فقط در همان بازه کم می‌شود
            و پس از پایان، خودکار به قیمت عادی برمی‌گردد.
          </p>
        </section>
      )}
      <div className="toolbar">
        {["variants", "flash"].includes(kind) && (
          <button className="add" style={{ padding: 12 }} onClick={() => add()}>
            + افزودن {kind === "variants" ? "تنوع" : "فروش ویژه"}
          </button>
        )}
        {kind === "variants" && (
          <>
            <button
              className="secondary"
              onClick={() =>
                downloadFile("/catalog/products/export-csv/", "products.csv")
              }
            >
              خروجی محصولات
            </button>
            <label className="secondary">
              ورود CSV
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={async (e) => {
                  const body = new FormData();
                  body.append("file", e.target.files[0]);
                  try {
                    await api("/catalog/products/import-csv/", {
                      method: "POST",
                      body,
                    });
                    location.reload();
                  } catch (err) {
                    setError(err.message);
