/* ============================================================
   PRODUCT DETAIL PAGE
   ============================================================ */
function ProductReviews({ product }) {
  const { user, nav, toast } = useStore();
  const [items, setItems] = useState([]),
    [rating, setRating] = useState(5),
    [comment, setComment] = useState(""),
    [pros, setPros] = useState(""),
    [cons, setCons] = useState(""),
    [busy, setBusy] = useState(false),
    [formOpen, setFormOpen] = useState(false);
  const sampleItems = [
    { id: "sample-review-1", user_name: "امیرحسین", rating: 5, comment: `کیفیت ساخت ${product.name} بسیار خوب است و در استفاده طولانی عملکرد پایداری دارد. بسته‌بندی هم سالم و مرتب به دستم رسید.`, pros: ["کیفیت ساخت مناسب", "عملکرد پایدار"], cons: [], is_verified_purchase: true, helpful_count: 12, sample: true },
    { id: "sample-review-2", user_name: "سارا", rating: 4, comment: "مشخصات درج‌شده با محصول دریافتی مطابقت داشت. بهتر است پیش از خرید ابعاد و سازگاری آن با سیستم خود را بررسی کنید.", pros: ["مطابقت با مشخصات", "ارزش خرید مناسب"], cons: ["نیاز به بررسی سازگاری پیش از خرید"], is_verified_purchase: true, helpful_count: 8, sample: true },
    { id: "sample-review-3", user_name: "رضا", rating: 4, comment: "برای کاربری روزمره و حرفه‌ای انتخاب قابل اتکایی است. راه‌اندازی آسان بود و تا این لحظه مشکلی نداشتم.", pros: ["راه‌اندازی آسان"], cons: [], helpful_count: 5, sample: true },
  ];
  const visibleItems = items.length ? items : sampleItems;
  const load = () =>
    accountApiAll(`/catalog/reviews/?product=${product.apiId}&page_size=100`)
      .then((data) => setItems(data.results || data))
      .catch(() => setItems([]));
  useEffect(() => {
    load();
  }, [product.apiId]);
  const submit = async () => {
    if (!user) return nav("auth");
    if (comment.trim().length < 5) return toast("متن نظر کوتاه است.", "error");
    setBusy(true);
    try {
      await accountApi("/catalog/reviews/", {
        method: "POST",
        body: JSON.stringify({
          product: product.apiId,
          rating,
          quality_rating: rating,
          value_rating: rating,
          packaging_rating: rating,
          title: "نظر درباره " + product.name,
          comment,
          pros: pros.split("\n").filter(Boolean),
          cons: cons.split("\n").filter(Boolean),
        }),
      });
      setComment("");
      setPros("");
      setCons("");
      await load();
      toast("نظر شما ثبت شد و پس از تأیید نمایش داده می‌شود.");
      setFormOpen(false);
    } catch (err) {
      toast(err.message, "error");
    } finally {
      setBusy(false);
    }
  };
  const helpful = async (item) => {
    if (!user) return nav("auth");
    try {
      const data = await accountApi(`/catalog/reviews/${item.id}/helpful/`, {
        method: "POST",
        body: JSON.stringify({ is_helpful: true }),
      });
      setItems((rows) =>
        rows.map((x) =>
          x.id === item.id ? { ...x, helpful_count: data.helpful_count } : x,
        ),
      );
    } catch (err) {
      toast(err.message, "error");
    }
  };
  return (
    <div className="product-community-section">
      <div className="community-head">
        <div><h3>نظر خریداران</h3><p>تجربه کاربران درباره این محصول</p></div>
        <button className="btn btn-primary" onClick={() => user ? setFormOpen((open) => !open) : nav("auth")}>
          {formOpen ? "بستن فرم" : "+ افزودن نظر جدید"}
        </button>
      </div>
      {user && formOpen && (
        <div className="glass community-form">
          <div className="field">
            <label>امتیاز شما</label>
            <select
              value={rating}
              onChange={(e) => setRating(Number(e.target.value))}
            >
              {[5, 4, 3, 2, 1].map((x) => (
                <option key={x} value={x}>
                  {x} ستاره
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>نظر</label>
            <textarea
              rows="3"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="تجربه خود از این محصول را بنویسید"
            />
          </div>
          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}
          >
            <div className="field">
              <label>نقاط قوت؛ هر مورد یک خط</label>
              <textarea
                rows="3"
                value={pros}
                onChange={(e) => setPros(e.target.value)}
              />
            </div>
            <div className="field">
              <label>نقاط ضعف؛ هر مورد یک خط</label>
              <textarea
                rows="3"
                value={cons}
                onChange={(e) => setCons(e.target.value)}
              />
            </div>
          </div>
          <button className="btn btn-primary" disabled={busy} onClick={submit}>
            {busy ? "در حال ثبت..." : "ثبت نظر"}
          </button>
        </div>
      )}
      <div className="community-list">
      {visibleItems.map((item) => (
        <div
          key={item.id}
          className="community-card"
        >
          <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
            <b>{item.user_name || "کاربر فروشگاه 82"}</b>
            {item.is_verified_purchase && (
              <small style={{ color: "var(--success)" }}>خریدار محصول ✓</small>
            )}
            <span style={{ color: "var(--warning)" }}>
              {"★".repeat(item.rating)}
              <span style={{ color: "var(--muted)" }}>
                {"★".repeat(5 - item.rating)}
              </span>
            </span>
          </div>
          <p style={{ color: "var(--text-soft)", fontSize: 13, marginTop: 4 }}>
            {item.comment}
          </p>
          {item.pros?.length > 0 && (
            <p style={{ color: "var(--success)", fontSize: 12 }}>
              نقاط قوت: {item.pros.join("، ")}
            </p>
          )}
          {item.cons?.length > 0 && (
            <p style={{ color: "var(--danger)", fontSize: 12 }}>
              نقاط ضعف: {item.cons.join("، ")}
            </p>
          )}
          {item.status === "PENDING" && (
            <small style={{ color: "var(--warning)" }}>
              در انتظار تأیید مدیر
            </small>
          )}
          {item.admin_reply && (
            <p style={{ fontSize: 12, color: "var(--primary)" }}>
              پاسخ فروشگاه: {item.admin_reply}
            </p>
          )}
          <button
            className="btn btn-ghost"
            style={{ marginTop: 6 }}
            onClick={() => item.sample ? toast("این یک نظر نمونه است.") : helpful(item)}
          >
            مفید بود ({fmt(item.helpful_count || 0)})
          </button>
        </div>
      ))}
      </div>
    </div>
  );
}

