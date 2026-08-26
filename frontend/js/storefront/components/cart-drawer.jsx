/* ============================================================
   CART DRAWER
   ============================================================ */
function CartDrawer() {
  const { cart, persistCart, setCartOpen, toast, nav, user } = useStore();
  const [code, setCode] = useState("");
  const [disc, setDisc] = useState(0);
  const apply = async () => {
    if (!user) {
      setCartOpen(false);
      nav("auth");
      return toast("برای بررسی کد تخفیف وارد شوید", "error");
    }
    try {
      const data = await accountApi("/orders/discounts/validate_code/", {
        method: "POST",
        body: JSON.stringify({ code, subtotal: cart.subtotal() }),
      });
      setDisc(Number(data.discount_amount));
      LS.set("checkout_discount", data.code);
      toast("کد تخفیف اعمال شد ✓");
    } catch (err) {
      setDisc(0);
      LS.set("checkout_discount", "");
      toast(err.message, "error");
    }
  };
  return ReactDOM.createPortal(
    <>
      <div className="overlay" onClick={() => setCartOpen(false)} />
      <div className="drawer">
        <div className="drawer-head">
          <h3>
            <I.cart className="icon" style={{ verticalAlign: "-4px" }} /> سبد
            خرید ({fmt(cart.count())})
          </h3>
          <button className="iconbtn" onClick={() => setCartOpen(false)}>
            <I.x className="icon" />
          </button>
        </div>
        <div className="drawer-body">
          {cart.items.length === 0 && (
            <div
              style={{
                textAlign: "center",
                padding: 40,
                color: "var(--muted)",
              }}
            >
              <I.cart
                className="icon"
                style={{ width: 60, height: 60, opacity: 0.3 }}
              />
              <p style={{ marginTop: 12 }}>سبد خرید شما خالی است</p>
            </div>
          )}
          {cart.items.map((it) => (
            <div className="cart-item" key={it.key}>
              <div className="ci-img">{(I[it.icon] || I.cpu)({})}</div>
              <div style={{ flex: 1 }}>
                <b style={{ fontSize: 13, display: "block" }}>{it.name}</b>
                <small style={{ color: "var(--muted)", fontSize: 11 }}>
                  {it.color && "رنگ: " + it.color + " · "}ارسال: {it.ship}
                </small>
                {!!it.customizationSummary?.length && (
                  <div className="cart-config-summary">
                    {it.customizationSummary.map((row) => (
                      <span key={row.group}>{row.group}: {row.option}</span>
                    ))}
                  </div>
                )}
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginTop: 8,
                  }}
                >
                  <div
                    className="qty"
                    style={{
                      transform: "scale(.85)",
                      transformOrigin: "right",
                    }}
                  >
                    <button
                      onClick={() => {
                        cart.setQty(it.key, it.qty - 1);
                        persistCart(cart);
                      }}
                    >
                      −
                    </button>
                    <span>{fmt(it.qty)}</span>
                    <button
                      disabled={Boolean(it.maxStock && it.qty >= it.maxStock)}
                      onClick={() => {
                        cart.setQty(it.key, it.qty + 1);
                        persistCart(cart);
                      }}
                    >
                      +
                    </button>
                  </div>
                  <b style={{ fontSize: 13, color: "var(--primary)" }}>
                    {fmt(it.price * it.qty)}
                  </b>
                  <button
                    onClick={() => {
                      persistCart(
                        new CartEngine(
                          cart.items.filter((item) => item.key !== it.key),
                        ),
                      );
                      toast("حذف شد");
                    }}
                    style={{ color: "var(--danger)" }}
                  >
                    <I.trash
                      className="icon"
                      style={{ width: 18, height: 18 }}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
        {cart.items.length > 0 && (
          <div className="drawer-foot">
            <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
              <input
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="کد تخفیف (TECH20)"
                style={{
                  flex: 1,
                  padding: 10,
                  borderRadius: 10,
                  border: "1px solid var(--border)",
                  background: "var(--surface-solid)",
                  color: "var(--text)",
                }}
              />
              <button className="btn btn-ghost" onClick={apply}>
                اعمال
              </button>
            </div>
            <div className="sum-row">
              <span>جمع کالاها</span>
              <span>{fmt(cart.subtotal())}</span>
            </div>
            <div className="sum-row">
              <span>مالیات (۹٪)</span>
              <span>{fmt(cart.tax())}</span>
            </div>
            <div className="sum-row">
              <span>هزینه ارسال</span>
              <span>
                {cart.shipping() === 0 ? "رایگان" : fmt(cart.shipping())}
              </span>
            </div>
            {disc > 0 && (
              <div className="sum-row" style={{ color: "var(--success)" }}>
                <span>تخفیف</span>
                <span>−{fmt(disc)}</span>
              </div>
            )}
            <div className="sum-row total">
              <span>مبلغ قابل پرداخت</span>
              <span>{fmt(cart.total(disc))} تومان</span>
            </div>
            <button
              className="btn btn-primary"
              style={{ width: "100%", marginTop: 14 }}
              onClick={() => {
                setCartOpen(false);
                user
                  ? nav("profile", "orders")
                  : (nav("auth"), toast("برای ادامه وارد شوید", "error"));
              }}
            >
              تکمیل خرید و پرداخت
            </button>
          </div>
        )}
      </div>
    </>,
    document.body,
  );
}
