const Store = createContext();
const useStore = () => useContext(Store);

const routePath = (name, param = null) => {
  const safe = param ? encodeURIComponent(param) : "";
  if (name === "shop") return safe ? `/shop/${safe}` : "/shop";
  if (name === "product") return safe ? `/product/${safe}` : "/shop";
  if (name === "gaming") return safe ? `/gaming/${safe}` : "/gaming";
  if (name === "auth") return "/auth";
  if (name === "profile") return safe ? `/account/${safe}` : "/account";
  if (["about", "contact", "faq", "returns"].includes(name)) return `/${name}`;
  if (name === "guides") return "/guides";
  if (name === "guide") return safe ? `/guides/${safe}` : "/guides";
  return "/";
};
const routeFromLocation = () => {
  const legacy = location.hash.replace(/^#/, "").split("/").filter(Boolean);
  if (legacy.length)
    return { name: legacy[0] || "home", param: legacy[1] || null };
  const parts = decodeURIComponent(location.pathname)
    .replace(/\/index\.html\/?/i, "/")
    .split("/")
    .filter(Boolean);
  if (parts[0] === "shop") return { name: "shop", param: parts[1] || null };
  if (parts[0] === "product")
    return { name: "product", param: parts[1] || null };
  if (parts[0] === "gaming")
    return { name: "gaming", param: parts[1] || null };
  if (parts[0] === "auth") return { name: "auth", param: null };
  if (parts[0] === "account")
    return { name: "profile", param: parts[1] || null };
  if (["about", "contact", "faq", "returns"].includes(parts[0]))
    return { name: parts[0], param: null };
  if (parts[0] === "guides") return { name: parts[1] ? "guide" : "guides", param: parts[1] || null };
  if (!parts.length) return { name: "home", param: null };
  return { name: "not-found", param: parts.join("/") };
};
const upsertMeta = (selector, attributes) => {
  let node = document.head.querySelector(selector);
  if (!node) {
    node = document.createElement(attributes.tag || "meta");
    document.head.appendChild(node);
  }
  Object.entries(attributes).forEach(([key, value]) => {
    if (key !== "tag") node.setAttribute(key, value);
  });
  return node;
};
const setStructuredData = (items) => {
  let node = document.head.querySelector("#seo-structured-data");
  if (!node) {
    node = document.createElement("script");
    node.id = "seo-structured-data";
    node.type = "application/ld+json";
    document.head.appendChild(node);
  }
  node.textContent = JSON.stringify(items.length === 1 ? items[0] : items);
};

function StoreProvider({ children }) {
  const initialRoute = routeFromLocation();
  const directProduct = LS.get("direct_product", null);
  const initialCatalogMode =
    initialRoute.name === "gaming" ||
    (initialRoute.name === "product" &&
      ProductSelectors.isGaming(directProduct))
      ? "gaming"
      : "regular";
  const cachedCategories = LS.get("catalog_cache_categories", []);
  if (cachedCategories.length) CatalogRepository.replaceCategories(cachedCategories);
  if (!PRODUCTS.length) {
    const initialCacheScope = initialRoute.name === "home"
      ? "home"
      : initialRoute.name === "product" ? "detail" : "full";
    const initialCacheParam = initialRoute.param
      ? `_${encodeURIComponent(initialRoute.param)}`
      : "";
    const cachedProducts = LS.get(
      `catalog_cache_${initialCatalogMode}_${initialCacheScope}${initialCacheParam}`,
      [],
    );
    CatalogRepository.replaceProducts(
      initialCatalogMode === "gaming"
        ? ProductSelectors.gaming(cachedProducts)
        : ProductSelectors.regular(cachedProducts),
    );
  }
  if (
    !PRODUCTS.length &&
    initialRoute.name === "product" &&
    directProduct &&
    [directProduct.slug, directProduct.id, directProduct.apiId]
      .map(String)
      .includes(String(initialRoute.param))
  )
    CatalogRepository.replaceProducts([directProduct]);
  const [theme, setTheme] = useState(LS.get("theme", "light"));
  const [route, setRoute] = useState(initialRoute);
  const [cart, setCart] = useState(() => new CartEngine(LS.get("cart", [])));
  const [fav, setFav] = useState(LS.get("fav", []));
  const [favoriteRecords, setFavoriteRecords] = useState({});
  const [user, setUser] = useState(LS.get("user", null));
  const [users, setUsers] = useState(LS.get("users", []));
  const [addresses, setAddresses] = useState(LS.get("addresses", []));
  const [toasts, setToasts] = useState([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [catalogVersion, setCatalogVersion] = useState(0);
  const [catalogRefreshKey, setCatalogRefreshKey] = useState(0);
  const catalogRevisionRef = useRef(localStorage.getItem("catalog_revision") || "");
  const [catalogLoading, setCatalogLoading] = useState(!PRODUCTS.length);
  const [menuItems, setMenuItems] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [siteSettings, setSiteSettings] = useState({
    site_name: "فروشگاه 82",
    seo_home_title: "فروشگاه 82 | فروشگاه تخصصی کالای دیجیتال",
    seo_home_description:
      "خرید اینترنتی کالای دیجیتال، لپ‌تاپ و قطعات کامپیوتر با ضمانت و ارسال سریع.",
    seo_social_image: "",
    google_site_verification: "",
    bing_site_verification: "",
    organization_phone: "",
    organization_email: "",
    organization_address: "",
    organization_social_links: [],
    merchant_name: "",
    shipping_cost: 0,
    shipping_min_days: 1,
    shipping_max_days: 5,
    return_window_days: 7,
    mega_promo_title: "پیشنهاد ویژه هفته",
    mega_promo_subtitle: "تا ۳۵٪ تخفیف روی کارت‌های گرافیک گیمینگ",
    mega_promo_image: "",
    category_title: "دسته‌بندی محصولات",
    category_subtitle: "دسته مورد نظر خود را انتخاب کنید",
    hero_slogan: "هوشمند انتخاب کن؛ قدرتمندتر زندگی کن",
    hero_laptop_image: "",
    hero_components_image: "",
    hero_gaming_image: "",
    hero_monitor_image: "",
    hero_audio_image: "",
    home_hero_enabled: true,
    home_hero_autoplay: true,
    home_hero_interval_seconds: 6,
    home_hero_controls: true,
    home_quick_links_enabled: true,
    home_banners_enabled: true,
    home_categories_enabled: true,
    home_brands_enabled: true,
    home_recommendations_enabled: true,
    home_recommendations_title: "👀 بازدیدهای اخیر و محصولات مشابه",
    home_services_enabled: true,
    home_laptop_title: "لپ‌تاپ‌ها",
    home_laptop_subtitle: "کار، دانشگاه و بازی",
    home_components_title: "قطعات حرفه‌ای",
    home_components_subtitle: "ارتقای سیستم هوشمند",
    home_gaming_title: "دنیای گیمینگ",
    home_gaming_subtitle: "تجهیزات منتخب گیمرها",
    home_monitor_title: "مانیتورها",
    home_monitor_subtitle: "تصویر دقیق و حرفه‌ای",
    home_audio_title: "هدفون و صدا",
    home_audio_subtitle: "تجربه صوتی فراگیر",
    gaming_hero_enabled: true,
    gaming_hero_autoplay: true,
    gaming_hero_interval_seconds: 5,
    gaming_hero_controls: true,
    gaming_heading_enabled: true,
    gaming_heading_kicker: "🎮 GAMING ZONE",
    gaming_heading_title: "دنیای محصولات گیمینگ",
    gaming_heading_subtitle: "تجهیزات منتخب برای گیمرهایی که سرعت، دقت و قدرت واقعی می‌خواهند.",
    gaming_banners_enabled: true,
    gaming_categories_enabled: true,
    gaming_brands_enabled: true,
    gaming_deals_enabled: true,
    gaming_deals_title: "پیشنهادهای ویژه گیمینگ",
    gaming_top_rated_enabled: true,
    gaming_top_rated_title: "💎 پیشنهادهای منتخب گیمینگ",
    gaming_value_enabled: true,
    gaming_value_title: "⚡ پیشنهادهای ویژه تجهیزات گیمینگ",
    gaming_best_sellers_enabled: true,
    gaming_best_sellers_title: "🔥 محبوب‌ترین محصولات گیمینگ",
    gaming_newest_enabled: true,
    gaming_newest_title: "⚡ جدیدترین تجهیزات گیمینگ",
    gaming_catalog_enabled: true,
    gaming_catalog_title: "فروشگاه محصولات گیمینگ",
    footer_text:
      "© ۱۴۰۵ فروشگاه 82 · تمامی حقوق محفوظ است · طراحی و توسعه اختصاصی",
  });

  const toast = useCallback((msg, type = "success") => {
    const id = Date.now() + Math.random();
    setToasts((current) => [...current, { id, msg, type }]);
    setTimeout(
      () => setToasts((current) => current.filter((item) => item.id !== id)),
      3000,
    );
  }, []);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    LS.set("theme", theme);
  }, [theme]);
  useEffect(() => LS.set("fav", fav), [fav]);
  useEffect(() => LS.set("user", user), [user]);
  useEffect(() => LS.set("users", users), [users]);
  useEffect(() => LS.set("addresses", addresses), [addresses]);
  useEffect(() => {
    fetch(API_BASE + "/catalog/site-settings/", { cache: "no-store" })
      .then((r) => r.json())
      .then((data) => {
        const item = normalizeMediaPayload((data.results || data)[0]);
        if (item) setSiteSettings((current) => ({ ...current, ...item }));
      })
      .catch(() => {});
  }, [catalogRefreshKey]);
  useEffect(() => {
    const cachedUser = LS.get("user", null);
    if (!cachedUser) return undefined;
    let active = true;
    accountApi("/auth/me/")
      .then((profile) => {
        if (active) setUser(profile);
      })
      .catch(() => {
        AuthTokenVault.clear();
        if (active) setUser(null);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => {
    const apply = () =>
      document.querySelectorAll("[title]").forEach((node) => {
        const text = node.getAttribute("title");
        if (text) {
          node.setAttribute("data-tooltip", text);
          node.removeAttribute("title");
        }
      });
    apply();
    const observer = new MutationObserver(apply);
    observer.observe(document.body, { subtree: true, childList: true });
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (location.hash) {
      history.replaceState(route, "", routePath(route.name, route.param));
    }
  }, []);
  useEffect(() => {
    const product =
      route.name === "product"
        ? PRODUCTS.find(
            (item) =>
              item.slug === route.param ||
              String(item.id) === String(route.param),
          )
        : null;
    const category =
      ["shop", "gaming"].includes(route.name)
        ? CATEGORIES.find((item) => item.id === route.param)
        : null;
    const seoCategory =
      category ||
      (product ? CATEGORIES.find((item) => item.id === product.cat) : null);
    const contentMeta = {
      about: {
        title: `درباره ما | ${siteSettings.site_name}`,
        description: `با ${siteSettings.site_name}، خدمات فروشگاه و ارزش‌های ما بیشتر آشنا شوید.`,
      },
      contact: {
        title: `تماس با ما | ${siteSettings.site_name}`,
        description: `راه‌های ارتباط با پشتیبانی ${siteSettings.site_name} و ثبت درخواست درباره سفارش، پرداخت، محصول و بازگشت کالا.`,
      },
      faq: {
        title: `سؤالات متداول | ${siteSettings.site_name}`,
        description:
          "پاسخ پرسش‌های رایج درباره خرید، ارسال، موجودی، گارانتی و مرجوعی کالا.",
      },
      returns: {
        title: `شرایط بازگشت کالا | ${siteSettings.site_name}`,
        description: `شرایط، مراحل ثبت درخواست و پیگیری بازگشت کالا در ${siteSettings.site_name}.`,
      },
      gaming: {
        title: `محصولات گیمینگ | ${siteSettings.site_name}`,
        description: `خرید محصولات گیمینگ منتخب، لپ‌تاپ، قطعات و تجهیزات حرفه‌ای بازی از ${siteSettings.site_name}.`,
      },
      guides: { title: `راهنماهای خرید | ${siteSettings.site_name}`, description: "راهنماهای تخصصی مقایسه و انتخاب محصولات دیجیتال و گیمینگ." },
      guide: { title: `راهنمای خرید | ${siteSettings.site_name}`, description: "راهنمای تخصصی برای انتخاب و خرید آگاهانه محصول." },
    }[route.name];
    const title = product
      ? product.seoTitle ||
        `${product.name} | خرید از ${siteSettings.site_name}`
      : category
        ? category.seoTitle || `خرید ${category.name} | ${siteSettings.site_name}`
        : route.name === "shop"
          ? `فروشگاه محصولات دیجیتال | ${siteSettings.site_name}`
          : route.name === "home"
            ? siteSettings.seo_home_title ||
              `${siteSettings.site_name} | فروشگاه تخصصی کالای دیجیتال`
            : contentMeta?.title || `حساب کاربری | ${siteSettings.site_name}`;
    const description = product
      ? product.seoDescription ||
        product.description ||
        `خرید ${product.name} با ضمانت و ارسال سریع از فروشگاه 82`
      : category
        ? category.seoDescription || `مشاهده و خرید جدیدترین محصولات ${category.name} با ضمانت و ارسال سریع.`
        : contentMeta?.description ||
          siteSettings.seo_home_description ||
          "خرید اینترنتی کالای دیجیتال، لپ‌تاپ و قطعات کامپیوتر با ضمانت و ارسال سریع.";
    const routeIsMissing =
      !catalogLoading &&
      ((route.name === "product" && !product) ||
        (["shop", "gaming"].includes(route.name) && route.param && !category));
    const queryParameters = new URLSearchParams(location.search);
    const hasFilterParameters = [...queryParameters.keys()].some((key) => key !== "page");
    const robotsContent = hasFilterParameters
      ? "noindex,follow"
      : ["auth", "profile"].includes(route.name) || routeIsMissing
        ? "noindex,nofollow"
        : "index,follow,max-image-preview:large,max-snippet:-1,max-video-preview:-1";
    const canonicalHref =
      product?.canonicalUrl ||
      location.origin + routePath(route.name, route.param) +
      (queryParameters.has("page") && !hasFilterParameters ? `?page=${encodeURIComponent(queryParameters.get("page"))}` : "");
    const socialImage =
      product?.image ||
      siteSettings.seo_social_image ||
      siteSettings.logo ||
      "";
    document.title = title;
    upsertMeta('meta[name="description"]', {
      name: "description",
      content: description.slice(0, 320),
