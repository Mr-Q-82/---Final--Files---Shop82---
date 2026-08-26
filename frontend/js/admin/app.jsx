function App() {
  useEnhancedFileInputs();
  const [user, setUser] = useState(null),
    [page, setPage] = useState("dashboard"),
    [dark, setDark] = useState(false),
    [mobile, setMobile] = useState(false),
    [collapsed, setCollapsed] = useState(
      () => localStorage.getItem("admin_sidebar_collapsed") === "1",
    ),
    [navQuery, setNavQuery] = useState(""),
    [commandOpen, setCommandOpen] = useState(false),
    [data, setData] = useState(null),
    [error, setError] = useState("");
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  useEffect(() => {
    if (AuthTokenVault.has())
      api("/auth/me/")
        .then((u) =>
          ["ADMIN", "STAFF"].includes(u.role)
            ? setUser(u)
            : Promise.reject(new Error("دسترسی غیرمجاز")),
        )
        .catch(() => AuthTokenVault.clear());
  }, []);
  useEffect(() => {
    if (user && page === "dashboard")
      api("/dashboard/overview/")
        .then(setData)
        .catch((e) => setError(e.message));
  }, [user, page]);
  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setCommandOpen((value) => !value);
      }
      if (event.key === "Escape") {
        setCommandOpen(false);
        setMobile(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);
  if (!user) return <Login onLogin={setUser} />;
  const pages = {
    dashboard: ["داشبورد", "نمای کلی عملکرد فروشگاه"],
    settings: ["تنظیمات سایت و ظاهر صفحات", "هویت، SEO، چیدمان صفحه اصلی و صفحه گیمینگ"],
    newsletter: ["خبرنامه", "مدیریت ایمیل اعضای خبرنامه"],
    advanced: [
      "عملیات پیشرفته",
      "تأمین‌کننده، باندل، کارت هدیه، امنیت و گزارش",
    ],
    inventory: [
      "گردش انبار",
      "ثبت و مشاهده تمام افزایش‌ها، کاهش‌ها، فروش و مرجوعی",
    ],
    backup: ["بکاپ کامل", "پشتیبان‌گیری و بازیابی دیتابیس و تمام تصاویر"],
    products: ["محصولات", "مدیریت محصولات و موجودی"],
    recommendations: ["پیشنهادهای دسته‌بندی", "انتخاب دستی محصولات پیشنهادی هر دسته‌بندی"],
    configurator: ["کاربری و شخصی‌سازی", "مدیریت نوع استفاده، قطعات انتخابی، قیمت و موجودی"],
    options: ["مشخصات محصول", "گارانتی، رنگ و ارسال"],
    qa: ["پرسش و پاسخ", "مدیریت پرسش‌های محصولات"],
    reviews: ["نظرات محصولات", "تأیید و مدیریت دیدگاه کاربران"],
    content: ["بنرها و اسلایدرها", "مدیریت محتوای صفحه اصلی و صفحه گیمینگ"],
    guides: ["راهنمای خرید", "مدیریت کامل مرکز راهنما، دسته‌بندی‌ها و راهنمای محصولات"],
    taxonomies: ["دسته‌بندی و برند", "مدیریت ساختار کاتالوگ"],
    menu: ["منوی سایت", "مدیریت لینک‌های منوی اصلی"],
    discounts: ["کدهای تخفیف", "ساخت و مدیریت تخفیف‌ها"],
    orders: ["سفارش‌ها", "پیگیری و تغییر وضعیت سفارش‌ها"],
    users: ["کاربران", "افزودن و ویرایش کاربران"],
    notifications: ["اعلان‌ها", "ارسال پیام برای همه یا یک کاربر"],
    tickets: ["پشتیبانی", "تیکت‌های کاربران"],
    returns: ["مرجوعی", "بررسی، اطلاع‌رسانی و بازپرداخت"],
    variants: [
      "تنوع و CSV",
      "مدل‌ها، رنگ‌ها و مشخصات هر کالا؛ CSV برای ورود و خروجی گروهی محصولات",
    ],
    flash: ["فروش ویژه", "تخفیف زمان‌دار با تاریخ شروع، پایان و سقف موجودی"],
    audit: ["گزارش مدیران", "رویدادهای مدیریتی"],
  };
  const navGroups = [
    {
      title: "نمای کلی",
      items: [
        ["dashboard", "⌂", "داشبورد"],
        ["advanced", "◆", "عملیات پیشرفته"],
        ["audit", "≡", "گزارش مدیران"],
      ],
    },
    {
      title: "فروش و سفارش",
      items: [
        ["orders", "▦", "سفارش‌ها"],
        ["returns", "↩", "مرجوعی"],
        ["discounts", "٪", "کد تخفیف"],
        ["flash", "⚡", "فروش ویژه"],
      ],
    },
    {
      title: "کاتالوگ و انبار",
      items: [
        ["products", "◫", "محصولات"],
        ["inventory", "⇅", "گردش انبار"],
        ["taxonomies", "▥", "دسته‌بندی و برند"],
        ["options", "⚙", "مشخصات محصول"],
        ["variants", "◇", "تنوع و CSV"],
        ["recommendations", "✦", "پیشنهادهای دسته‌بندی"],
        ["configurator", "⚙", "کاربری و شخصی‌سازی"],
      ],
    },
    {
      title: "محتوا و ارتباطات",
      items: [
        ["content", "▤", "بنرها و اسلایدرها"],
        ["guides", "؟", "راهنمای خرید"],
        ["menu", "☰", "منوی سایت"],
        ["reviews", "★", "نظرات محصولات"],
        ["qa", "؟", "پرسش و پاسخ"],
        ["newsletter", "✉", "خبرنامه"],
        ["notifications", "●", "اعلان‌ها"],
        ["tickets", "☎", "پشتیبانی"],
      ],
    },
    {
      title: "سیستم",
      items: [
        ["users", "♙", "کاربران"],
        ["settings", "⚙", "تنظیمات سایت و ظاهر"],
        ["backup", "↻", "بکاپ کامل"],
      ],
    },
  ];
  const allNavItems = navGroups.flatMap((group) => group.items);
  const allowedPages = new Set(user.role === "ADMIN" || user.staff_permissions?.includes("*")
    ? Object.keys(pages)
    : (user.staff_permissions?.length ? ["dashboard", ...user.staff_permissions.map((item) => item.split(":")[0])] : Object.keys(pages)));
  const normalizedQuery = normalizeSearchInput(navQuery);
  const visibleGroups = navGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => allowedPages.has(item[0]) &&
        normalizeSearchInput(`${item[2]} ${pages[item[0]][1]}`).includes(normalizedQuery),
      ),
    }))
    .filter((group) => group.items.length);
  const navigateAdmin = (target) => {
    setPage(target);
    setMobile(false);
    setCommandOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className={`app ${collapsed ? "sidebar-collapsed" : ""}`}>
      <div className="ambient"></div>
      {mobile && <button className="sidebar-backdrop" aria-label="بستن منو" onClick={() => setMobile(false)} />}
      <aside className={"sidebar glass " + (mobile ? "open" : "")}>
        <div className="brand">
          <span className="mark">82</span>
          <span className="brand-copy"><b>فروشگاه 82</b><small>مرکز مدیریت</small></span>
          <button
            className="sidebar-collapse"
            aria-label={collapsed ? "باز کردن منو" : "جمع کردن منو"}
            onClick={() => {
              const next = !collapsed;
              setCollapsed(next);
              localStorage.setItem("admin_sidebar_collapsed", next ? "1" : "0");
            }}
          >
            {collapsed ? "‹" : "›"}
          </button>
        </div>
        <label className="sidebar-search">
          <span>⌕</span>
          <input
            value={navQuery}
            onChange={(event) => setNavQuery(event.target.value)}
            placeholder="جستجو در امکانات..."
          />
        </label>
        <nav className="nav">
          {visibleGroups.map((group) => (
            <section className="nav-group" key={group.title}>
              <h3>{group.title}</h3>
              {group.items.map((x) => (
                <button
                  key={x[0]}
                  title={collapsed ? x[2] : undefined}
                  className={page === x[0] ? "active" : ""}
                  onClick={() => navigateAdmin(x[0])}
                >
                  <span>{x[1]}</span>
                  <i>{x[2]}</i>
                  {page === x[0] && <em></em>}
                </button>
              ))}
            </section>
          ))}
          {!visibleGroups.length && <div className="nav-empty">بخشی پیدا نشد.</div>}
        </nav>
        <div className="sidebar-bottom">
          <button
            className="logout"
            onClick={() => {
              api("/auth/logout/", { method: "POST" }).catch(() => {}).finally(() => {
                AuthTokenVault.clear();
                CrossTabChannel.send("logout");
                location.reload();
              });
            }}
          >
            خروج از حساب
          </button>
        </div>
      </aside>
      <main className="main">
        <header className="topbar">
          <button
            className="iconbtn mobile-toggle"
            onClick={() => setMobile(!mobile)}
          >
            ☰
          </button>
          <div className="page-heading">
            <small className="breadcrumb">مدیریت فروشگاه / {pages[page][0]}</small>
            <h1>{pages[page][0]}</h1>
            <p>{pages[page][1]}</p>
          </div>
          <div className="top-actions">
            <button className="command-trigger" onClick={() => setCommandOpen(true)}>
              <span>⌕</span><b>جستجوی سریع</b><kbd>Ctrl K</kbd>
            </button>
            <a className="iconbtn storefront-link" href="/" target="_blank" rel="noreferrer" title="مشاهده فروشگاه">↗</a>
            <button className="iconbtn" title="تغییر پوسته" onClick={() => setDark(!dark)}>
              {dark ? "☀" : "☾"}
            </button>
            <div className="profile glass">
              <span className="avatar">{(user.first_name || "م")[0]}</span>
              <div>
                <b>{user.full_name || "مدیر فروشگاه"}</b>
                <small>{displayPhone(user.phone)}</small>
              </div>
            </div>
          </div>
        </header>
        <div className="admin-context-bar">
          <span><i></i> سیستم فعال و متصل</span>
          <div>
            <button onClick={() => navigateAdmin("products")}>+ محصول جدید</button>
            <button onClick={() => navigateAdmin("orders")}>سفارش‌های جدید {data?.metrics?.pending_orders ? `(${fmt(data.metrics.pending_orders)})` : ""}</button>
            <button onClick={() => navigateAdmin("content")}>ویرایش صفحه اصلی</button>
          </div>
        </div>
        {error && <div className="error">{error}</div>}
        {page === "dashboard" && <Dashboard data={data} onNavigate={navigateAdmin} />}
        {page === "settings" && <SiteSettings />}
        {page === "newsletter" && <NewsletterManager />}{" "}
        {page === "advanced" && (
          <>
            <AdvancedOperations />
            <EnterpriseSuite />
          </>
        )}
        {page === "inventory" && <InventoryManager />}
        {page === "backup" && <DatabaseBackupManager />}
        {page === "products" && <Products />}
        {page === "recommendations" && <CategoryRecommendations />}
        {page === "configurator" && <ProductConfiguratorManager />}
        {page === "options" && <ProductOptions />}
        {page === "qa" && <SimpleManager kind="qa" />}
        {page === "reviews" && <Reviews />}
        {page === "content" && <ContentManager />}
        {page === "guides" && <BuyingGuidesManager />}
        {page === "taxonomies" && <Taxonomies />}
        {page === "menu" && <SimpleManager kind="menu" />}
        {page === "discounts" && <Discounts />}
        {page === "orders" && <Orders />}
        {page === "users" && <Users />}
        {page === "notifications" && <Notifications />}
        {["tickets", "returns", "variants", "flash", "audit"].includes(
          page,
        ) && <CommerceManager kind={page} />}
      </main>
      {commandOpen && (
        <div className="command-overlay" role="presentation" onMouseDown={() => setCommandOpen(false)}>
          <section className="command-palette" role="dialog" aria-modal="true" aria-label="جستجوی سریع پنل" onMouseDown={(event) => event.stopPropagation()}>
            <header><span>⌕</span><input autoFocus value={navQuery} onChange={(event) => setNavQuery(event.target.value)} placeholder="نام بخش یا عملیات را بنویسید..." /><kbd>ESC</kbd></header>
            <div className="command-results">
              {allNavItems.filter((item) => normalizeSearchInput(`${item[2]} ${pages[item[0]][1]}`).includes(normalizedQuery)).map((item) => (
                <button key={item[0]} onClick={() => navigateAdmin(item[0])}>
                  <span>{item[1]}</span><div><b>{item[2]}</b><small>{pages[item[0]][1]}</small></div><em>←</em>
                </button>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
ReactDOM.createRoot(document.getElementById("root")).render(<AppErrorBoundary><NetworkStatus /><UpdateNotice /><App /></AppErrorBoundary>);
