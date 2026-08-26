function Profile({ param }) {
  const {
    user,
    setUser,
    setUsers,
    users,
    fav,
    addresses,
    setAddresses,
    nav,
    toast,
    notifications,
  } = useStore();
  const [tab, setTab] = useState(param || "dash");
  const [dashboardStats, setDashboardStats] = useState({
    orders: 0,
    delivered: 0,
    spent: 0,
    wallet: 0,
  });
  useEffect(() => {
    if (param) setTab(param);
  }, [param]);
  useEffect(() => {
    if (!user) return;
    Promise.all([
      accountApiAll("/orders/?page_size=100"),
      accountApi("/auth/wallet/"),
    ])
      .then(([orderData, walletData]) => {
        const rows = orderData.results || orderData;
        setDashboardStats({
          orders: rows.length,
          delivered: rows.filter((x) => x.status === "DELIVERED").length,
          spent: rows
            .filter((x) =>
              ["PAID", "PROCESSING", "SENT", "DELIVERED"].includes(x.status),
            )
            .reduce((sum, x) => sum + Number(x.total || 0), 0),
          wallet: Number(walletData.balance || 0),
        });
      })
      .catch(() => {});
  }, [user]);
  if (!user)
    return (
      <div className="container">
        <div
          className="glass"
          style={{
            padding: 40,
            margin: "40px auto",
            maxWidth: 500,
            textAlign: "center",
          }}
        >
          <p>برای مشاهده پروفایل ابتدا وارد شوید</p>
          <button
            className="btn btn-primary"
            style={{ marginTop: 14 }}
            onClick={() => nav("auth")}
          >
            ورود / ثبت‌نام
          </button>
        </div>
      </div>
    );

  const favProducts = PRODUCTS.filter((p) => fav.includes(p.id));
  const viewed = LS.get("viewed", [])
    .map((id) =>
      PRODUCTS.find(
        (p) =>
          String(p.id) === String(id) ||
          String(p.slug) === String(id) ||
          String(p.apiId) === String(id),
      ),
    )
    .filter(Boolean);

  return (
    <div className="container">
      <div className="prof-layout">
        <aside className="prof-side glass">
          <div className="me">
            <div className="avatar">
              {["🧑🏻", "👩🏻", "👨🏻‍💻", "👩🏻‍💻", "🧑🏻‍🚀"][
                Number((user.avatar || "avatar-1").split("-")[1] || 1) - 1
              ] || "🧑🏻"}
            </div>
            <b>
              {user.firstName} {user.lastName}
            </b>
            <small style={{ color: "var(--muted)" }}>
              {displayPhone(user.phone || user.mobile)}
            </small>
          </div>
          <div className="prof-nav">
            {[
              ["dash", "داشبورد", "user"],
              ["orders", "سفارش‌ها", "bag"],
              ["fav", "علاقه‌مندی‌ها", "heartO"],
              ["compare", "مقایسه محصولات", "search"],
              ["viewed", "بازدید‌شده‌ها", "search"],
              ["addresses", "آدرس‌ها", "truck"],
              ["notifications", "اعلان‌ها", "bell"],
              ["wallet", "کیف پول", "bag"],
              ["loyalty", "باشگاه مشتریان", "gift"],
              ["tickets", "پشتیبانی", "bell"],
              ["returns", "مرجوعی‌ها", "truck"],
              ["edit", "ویرایش اطلاعات", "edit"],
            ].map(([k, v, ic]) => (
              <a
                key={k}
                className={tab === k ? "on" : ""}
                onClick={() => setTab(k)}
              >
                {I[ic]({
                  className: "icon",
                  style: { width: 18, height: 18 },
                })}{" "}
                {v}
              </a>
            ))}
            <a
              onClick={async () => {
                await accountApi("/auth/logout/", { method: "POST" }).catch(() => {});
                AuthTokenVault.clear();
                CrossTabChannel.send("logout");
                setUser(null);
                nav("home");
                toast("خارج شدید");
              }}
              style={{ color: "var(--danger)" }}
            >
              <I.x className="icon" style={{ width: 18, height: 18 }} /> خروج
            </a>
          </div>
        </aside>

        <div className="prof-panel glass">
          {tab === "dash" && (
            <div>
              <h2 className="section-title">سلام {user.firstName} 👋</h2>
              <p className="section-sub">به پنل کاربری خوش آمدید</p>
              <div
                className="prod-grid"
                style={{ gridTemplateColumns: "repeat(3,1fr)", gap: 14 }}
              >
                {[
                  ["سفارش‌ها", fmt(dashboardStats.orders), "bag"],
                  ["تحویل‌شده", fmt(dashboardStats.delivered), "truck"],
                  ["مجموع خرید", fmt(dashboardStats.spent) + " تومان", "bag"],
                  [
                    "موجودی کیف پول",
                    fmt(dashboardStats.wallet) + " تومان",
                    "gift",
                  ],
                  ["علاقه‌مندی‌ها", fmt(fav.length), "heartO"],
                  [
                    "اعلان خوانده‌نشده",
                    fmt(notifications.filter((x) => !x.is_read).length),
                    "bell",
                  ],
                ].map(([t, n, ic]) => (
                  <div
                    className="glass"
                    key={t}
                    style={{ padding: 18, textAlign: "center" }}
                  >
                    <div className="cat-ic" style={{ margin: "0 auto 8px" }}>
                      {I[ic]({
                        className: "icon",
                        style: { width: 24, height: 24 },
                      })}
                    </div>
                    <b
                      style={{
                        fontSize: 22,
                        display: "block",
                        background: "var(--grad)",
                        WebkitBackgroundClip: "text",
                        color: "transparent",
                      }}
                    >
                      {n}
                    </b>
                    <small style={{ color: "var(--muted)" }}>{t}</small>
                  </div>
                ))}
              </div>
            </div>
          )}
          {tab === "orders" && <OrdersCheckout />}
          {tab === "fav" && (
            <div>
              <h2 className="section-title">علاقه‌مندی‌ها</h2>
              <p className="section-sub">{fmt(favProducts.length)} محصول</p>
              {favProducts.length ? (
                <div
                  className="prod-grid"
                  style={{ gridTemplateColumns: "repeat(3,1fr)" }}
                >
                  {favProducts.map((p) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
                </div>
              ) : (
                <div
                  className="glass"
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--muted)",
                  }}
                >
                  لیست علاقه‌مندی خالی است
                </div>
              )}
            </div>
          )}
          {tab === "compare" && <ComparisonPanel />}
          {tab === "viewed" && (
            <div>
              <h2 className="section-title">بازدیدشده‌ها</h2>
              <p className="section-sub">آخرین محصولات مشاهده‌شده</p>
              {viewed.length ? (
                <div
                  className="prod-grid"
                  style={{ gridTemplateColumns: "repeat(3,1fr)" }}
                >
                  {viewed.map((p) => (
                    <ProductCard key={p.id} p={p} />
                  ))}
                </div>
              ) : (
                <div
                  className="glass"
                  style={{
                    padding: 40,
                    textAlign: "center",
                    color: "var(--muted)",
                  }}
                >
                  موردی وجود ندارد
                </div>
              )}
            </div>
          )}
          {tab === "addresses" && <AddressManagerV2 />}
          {tab === "notifications" && <NotificationCenter />}
          {["wallet", "loyalty", "tickets", "returns"].includes(tab) && (
            <AccountServices section={tab} />
          )}
          {tab === "edit" && <EditProfileV2 />}
        </div>
      </div>
    </div>
  );
}
