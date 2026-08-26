/* ============================================================
   HEADER + MEGA MENU
   ============================================================ */
const MEGA_SUBCATEGORY_FALLBACKS = {
  laptop: ["گیمینگ", "اولترابوک", "مهندسی", "دانشجویی", "مک‌بوک", "اداری", "اقتصادی", "لپ‌تاپ ۲ در ۱"],
  cpu: ["Intel Core i9", "Intel Core i7", "Intel Core i5", "AMD Ryzen 9", "AMD Ryzen 7", "AMD Ryzen 5", "با گرافیک داخلی", "بدون گرافیک داخلی"],
  gpu: ["RTX 4090", "RTX 4080", "RTX 4070", "RTX 4060", "RX 7900", "RX 7800", "RX 7700", "کارت گرافیک حرفه‌ای"],
  ram: ["DDR5", "DDR4", "۶۴ گیگابایت", "۳۲ گیگابایت", "۱۶ گیگابایت", "تک ماژول", "دو ماژول", "RGB"],
  ssd: ["NVMe", "SATA", "M.2", "۴ ترابایت", "۲ ترابایت", "۱ ترابایت", "۵۱۲ گیگابایت", "اکسترنال"],
  monitor: ["گیمینگ ۱۴۴ هرتز", "گیمینگ ۲۴۰ هرتز", "4K", "QHD", "منحنی", "اولترا واید", "طراحی", "اداری"],
  mouse: ["گیمینگ", "بی‌سیم", "باسیم", "ارگونومیک", "سبک", "RGB"],
  keyboard: ["مکانیکال", "ممبران", "بی‌سیم", "گیمینگ", "TKL", "RGB"],
  headphone: ["گیمینگ", "بی‌سیم", "باسیم", "نویزکنسلینگ", "میکروفون‌دار", "داخل گوش"],
  speaker: ["بلوتوثی", "رومیزی", "ساندبار", "قابل حمل", "گیمینگ", "چندکاناله"],
  case: ["Mid Tower", "Full Tower", "Mini Tower", "RGB", "شیشه‌ای", "گیمینگ"],
  motherboard: ["Intel", "AMD", "ATX", "Micro-ATX", "Mini-ITX", "DDR5", "DDR4"],
  power: ["ماژولار", "نیمه‌ماژولار", "۶۵۰ وات", "۷۵۰ وات", "۸۵۰ وات", "۱۰۰۰ وات", "گواهی 80 Plus"],
  desk: ["گیمینگ", "اداری", "ارگونومیک", "ارتفاع قابل تنظیم", "L شکل", "مدیریت کابل"],
  chair: ["گیمینگ", "اداری", "ارگونومیک", "طبی", "پارچه‌ای", "چرمی"],
  "mouse-pad": ["گیمینگ", "RGB", "کنترل", "سرعت", "سایز بزرگ", "ضد لغزش"],
  accessories: ["هاب و مبدل", "کابل", "شارژر", "پایه نگهدارنده", "وب‌کم", "ابزار نظافت"],
};

const DEFAULT_PRIMARY_MENU_ITEMS = [
  { id: "shop", title: "فروشگاه", target: "shop" },
  { id: "laptop", title: "لپ‌تاپ", target: "laptop" },
  { id: "cpu", title: "پردازنده", target: "cpu" },
  { id: "gpu", title: "کارت گرافیک", target: "gpu" },
  { id: "ram", title: "حافظه RAM", target: "ram" },
  { id: "gaming", title: "🎮 محصولات گیمینگ", target: "gaming" },
  { id: "ssd", title: "حافظه SSD", target: "ssd" },
  { id: "monitor", title: "مانیتور", target: "monitor" },
  { id: "mouse", title: "ماوس", target: "mouse" },
  { id: "keyboard", title: "کیبورد", target: "keyboard" },
  { id: "headphone", title: "هدفون", target: "headphone" },
  { id: "desk", title: "میز", target: "desk" },
  { id: "chair", title: "صندلی", target: "chair" },
  { id: "mouse-pad", title: "موس‌پد", target: "mouse-pad" },
  { id: "accessories", title: "لوازم جانبی", target: "accessories" },
];

function Header() {
  const {
    nav,
    cart,
    fav,
    user,
    setCartOpen,
    theme,
    setTheme,
    menuItems,
    notifications,
    siteSettings,
    route,
    catalogVersion,
  } = useStore();
  const [mega, setMega] = useState(false);
  const [activeMegaCategory, setActiveMegaCategory] = useState(null);
  const [q, setQ] = useState("");
  const [sug, setSug] = useState([]);
  const [mobileMenu, setMobileMenu] = useState(false);
  const [megaTop, setMegaTop] = useState(0);
  const megaRef = useRef(null);

  useEffect(() => {
    const term = q.trim();
    if (!term) {
      setSug([]);
      return undefined;
    }
    const isGamingSearch = ProductSelectors.queryRequestsGaming(term);
    // The header is global: its local fallback searches every product already
    // available on the active page, while the API searches the entire catalog.
    const pool = PRODUCTS;
    const requestedCategory = ProductSelectors.searchCategory(term);
    const categorySuggestions = CATEGORIES.filter((category) => {
      const categoryText = ProductSelectors.normalizeSearchText(
        `${category.name} ${category.id}`,
      );
      return requestedCategory
        ? categoryText.split(" ").some((value) => requestedCategory.includes(value)) ||
            categoryText.includes(requestedCategory)
        : categoryText.includes(ProductSelectors.normalizeSearchText(term));
    })
      .slice(0, 3)
      .map((category) => ({
        type: "category",
        category,
        catalog: isGamingSearch ? "gaming" : "shop",
      }));
    const productSuggestions = ProductSelectors.search(pool, term, 24).map(
      (product) => ({ type: "product", product }),
    );
    setSug([...categorySuggestions, ...productSuggestions].slice(0, 24));
    const controller = new AbortController();
    const timer = window.setTimeout(() => {
      fetchCatalogRecord(
        `${API_BASE}/catalog/products/suggest/?q=${encodeURIComponent(term)}${isGamingSearch ? "&is_gaming=true" : ""}&limit=100`,
        { signal: controller.signal },
        2,
      )
        .then((data) => {
          const remoteProducts = (data.results || [])
            .map(apiProductToStoreProduct)
            .map((product) => ({ type: "product", product }));
          const seen = new Set();
          setSug([...categorySuggestions, ...remoteProducts, ...productSuggestions]
            .filter((suggestion) => {
              const item = suggestion.type === "category"
                ? suggestion.category
                : suggestion.product;
              const key = `${suggestion.type}:${item.apiId || item.id || item.slug}`;
              if (seen.has(key)) return false;
              seen.add(key);
              return true;
            })
            .slice(0, 100));
        })
        .catch((error) => {
          if (error?.name !== "AbortError")
            setSug([...categorySuggestions, ...productSuggestions].slice(0, 24));
        });
    }, 160);
    return () => {
      window.clearTimeout(timer);
      controller.abort();
    };
  }, [q, route.name, catalogVersion]);

  useEffect(() => {
    if (mega && !activeMegaCategory && CATEGORIES.length)
      setActiveMegaCategory(CATEGORIES[0].id);
  }, [mega, activeMegaCategory]);

  useEffect(() => {
    if (!mega) return;
    const closeOnOutside = (event) => {
      if (!megaRef.current?.contains(event.target)) setMega(false);
    };
    const closeOnEscape = (event) => {
      if (event.key === "Escape") setMega(false);
    };
    const closeOnScroll = () => {
      if (window.innerWidth > 768) setMega(false);
    };
    document.addEventListener("pointerdown", closeOnOutside);
    document.addEventListener("keydown", closeOnEscape);
    window.addEventListener("scroll", closeOnScroll, { passive: true });
    return () => {
      document.removeEventListener("pointerdown", closeOnOutside);
      document.removeEventListener("keydown", closeOnEscape);
      window.removeEventListener("scroll", closeOnScroll);
    };
  }, [mega]);

  useEffect(() => {
    if (!mega) return undefined;
    const positionMega = () => {
      const bottom = megaRef.current?.closest(".navbar")?.getBoundingClientRect().bottom;
      setMegaTop(Math.max(8, Math.round(bottom || 0) + 6));
    };
    positionMega();
    window.addEventListener("resize", positionMega);
    window.addEventListener("scroll", positionMega, { passive: true });
    return () => {
      window.removeEventListener("resize", positionMega);
      window.removeEventListener("scroll", positionMega);
    };
  }, [mega, mobileMenu]);

  const selectedMegaCategory =
    CATEGORIES.find((item) => item.id === activeMegaCategory) || CATEGORIES[0];
  const selectedMegaProducts = selectedMegaCategory
    ? ProductSelectors.regular(PRODUCTS).filter(
        (product) =>
          (product.cat === selectedMegaCategory.id ||
            product.category === selectedMegaCategory.id),
      )
    : [];
  const gamingCategoryHref = selectedMegaCategory
    ? routePath("gaming", selectedMegaCategory.id)
    : "/gaming";
  const selectedMegaSubcategories = [
    ...new Set([
      ...(Array.isArray(selectedMegaCategory?.subs)
        ? selectedMegaCategory.subs
        : []),
      ...(MEGA_SUBCATEGORY_FALLBACKS[selectedMegaCategory?.id] || []),
    ]),
  ];
  const selectedMegaBrandCounts = selectedMegaProducts.reduce(
    (counts, product) => {
      const brand = String(product.brand || "").trim();
      if (brand) counts[brand] = (counts[brand] || 0) + 1;
      return counts;
    },
    {},
  );
  const selectedMegaBrands = Object.entries(selectedMegaBrandCounts)
    .sort(([, firstCount], [, secondCount]) => secondCount - firstCount)
    .map(([name, count]) => ({ name, count }));
  const selectedMegaFeatured = [...selectedMegaProducts]
    .sort(
      (first, second) =>
        Number(second.stock > 0) - Number(first.stock > 0) ||
        second.sold - first.sold ||
        second.off - first.off,
    )
    .slice(0, 4);
  const selectedMegaStats = {
    total: selectedMegaProducts.length,
    available: selectedMegaProducts.filter((product) => product.stock > 0).length,
    discounted: selectedMegaProducts.filter((product) => product.off > 0).length,
  };
  const configuredPrimaryMenu = (menuItems.length
    ? menuItems
    : DEFAULT_PRIMARY_MENU_ITEMS).filter((item) => item.target !== "off");
  if (!configuredPrimaryMenu.some((item) => item.target === "accessories")) {
    configuredPrimaryMenu.push({ id: "accessories", title: "لوازم جانبی", target: "accessories" });
  }
  const homeMenuItem = configuredPrimaryMenu.find(
    (item) => item.target === "home",
  ) || { id: "home", title: "خانه", target: "home" };
  const shopMenuItem = configuredPrimaryMenu.find(
    (item) => item.target === "shop",
  ) || { id: "shop", title: "فروشگاه", target: "shop" };
  const primaryMenuItems = [
    homeMenuItem,
    shopMenuItem,
    ...configuredPrimaryMenu.filter(
      (item) => !["home", "shop"].includes(item.target),
    ),
  ];
  const menuIconFor = (item) => {
    if (item.target === "home") return I.home;
    if (item.target === "shop") return I.bag;
    if (item.target === "gaming") return I.gpu;
    if (item.target === "accessories") return I.gift;
    return I[item.target] || I.cpu;
  };
  const openSelectedGamingCategory = (event) => {
    event?.preventDefault();
    if (!selectedMegaCategory) return;
    sessionStorage.setItem(
      "gaming_focus_category",
      selectedMegaCategory.id,
    );
    nav("gaming", selectedMegaCategory.id);
    setMega(false);
    setMobileMenu(false);
  };

  const toggleTheme = (e) => {
    const rip = document.createElement("div");
    rip.className = "theme-ripple";
    rip.style.left = e.clientX + "px";
    rip.style.top = e.clientY + "px";
    document.body.appendChild(rip);
    setTimeout(() => setTheme((t) => (t === "dark" ? "light" : "dark")), 150);
    setTimeout(() => rip.remove(), 650);
  };

  return (
    <header className={"hdr" + (mega ? " mega-open" : "")}>
      <div className="hdr-inner glass premium-header-row">
        <button
          className="burger iconbtn"
          onClick={() => setMobileMenu((m) => !m)}
          aria-label={mobileMenu ? "بستن منوی اصلی" : "بازکردن منوی اصلی"}
          aria-expanded={mobileMenu}
          aria-controls="store-main-navigation"
        >
          <I.menu className="icon" />
        </button>
        <div
          className="logo premium-logo"
          style={{ cursor: "pointer" }}
          onClick={() => nav("home")}
        >
          <div className="logo-badge">
            {siteSettings.logo ? (
              <img
                src={siteSettings.logo}
                alt={siteSettings.site_name}
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "contain",
                  borderRadius: 10,
                }}
              />
            ) : (
              <I.cpu className="icon" />
            )}
          </div>
          <span className="premium-logo-copy">
            <b>{siteSettings.site_name}</b>
            <small>TECH STORE</small>
          </span>
        </div>
        <div className="search">
          <span className="s-icon">
            <I.search className="icon" />
          </span>
          <input
            value={q}
            type="search"
            aria-label="جستجوی محصولات"
            onChange={(e) => setQ(e.target.value)}
            placeholder="جستجوی محصولات، برندها و دسته‌بندی‌ها..."
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                const term = q.trim();
                const target =
                  route.name === "gaming" || ProductSelectors.queryRequestsGaming(term)
                    ? "gaming"
                    : "shop";
                nav(target);
                const nextUrl = term
                  ? `${routePath(target)}?q=${encodeURIComponent(term)}`
                  : routePath(target);
                window.history.replaceState({ name: target, param: null }, "", nextUrl);
                setSug([]);
              }
            }}
          />
          <kbd className="search-shortcut" aria-hidden="true">/</kbd>
          {sug.length > 0 && (
            <div className="suggest glass">
              {sug.map((suggestion) => {
                const isCategory = suggestion.type === "category";
                const item = isCategory ? suggestion.category : suggestion.product;
                const href = isCategory
                  ? routePath(suggestion.catalog || (route.name === "gaming" ? "gaming" : "shop"), item.id)
                  : routePath("product", item.slug || item.id);
                const SuggestionIcon = I[item.icon] || I.search;
                return (
                <a
