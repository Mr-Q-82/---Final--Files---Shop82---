function GamingPage({ param = null, navigationKey = 0 }) {
  const { nav, siteSettings, catalogVersion, catalogLoading } = useStore();
  const savedFilters = useMemo(readGamingFilters, []);
  const [slides, setSlides] = useState(GAMING_DEFAULT_SLIDES);
  const [slideIndex, setSlideIndex] = useState(0);
  const [promoBanners, setPromoBanners] = useState([]);
  const [brands, setBrands] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState(
    param ? [param] : savedFilters.categories || [],
  );
  const [selectedBrands, setSelectedBrands] = useState(savedFilters.brands || []);
  const [minPrice, setMinPrice] = useState(Number(savedFilters.minPrice) || 0);
  const [maxPrice, setMaxPrice] = useState(
    Number(savedFilters.maxPrice) || Number.MAX_SAFE_INTEGER,
  );
  const [minRating, setMinRating] = useState(Number(savedFilters.minRating) || 0);
  const [onlyOff, setOnlyOff] = useState(Boolean(savedFilters.onlyOff));
  const [inStock, setInStock] = useState(Boolean(savedFilters.inStock));
  const [sort, setSort] = useState(savedFilters.sort || "pop");
  const [limit, setLimit] = useState(12);
  const [usageProfiles, setUsageProfiles] = useState([]);
  const [selectedUsage, setSelectedUsage] = useState(usageFromLocation() || savedFilters.selectedUsage || "");
  const searchQuery = new URLSearchParams(location.search).get("q")?.trim() || "";
  const productsSentinel = useRef(null);

  useEffect(() => {
    if (param) {
      // Do not carry filters from the previously viewed gaming category.
      setSelectedCategories([param]);
      setSelectedBrands([]);
      setMinPrice(0);
      setMaxPrice(Number.MAX_SAFE_INTEGER);
      setMinRating(0);
      setOnlyOff(false);
      setInStock(false);
      setSelectedUsage("");
      setUsageProfiles([]);
      setUsageInLocation("");
    } else if (navigationKey) {
      // The gaming "Shop" button opens the complete gaming catalog instead
      // of retaining the category selected in the previous route.
      setSelectedCategories([]);
      setSelectedBrands([]);
      setMinPrice(0);
      setMaxPrice(Number.MAX_SAFE_INTEGER);
      setMinRating(0);
      setOnlyOff(false);
      setInStock(false);
      setSort("pop");
      setSelectedUsage("");
      setUsageProfiles([]);
      setUsageInLocation("");
    }
    setLimit(12);
  }, [param, navigationKey]);

  useEffect(() => {
    if (catalogLoading || !navigationKey) return undefined;
    if (sessionStorage.getItem("gaming_focus_catalog") !== "1") return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById("gaming-catalog")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      sessionStorage.removeItem("gaming_focus_catalog");
    }, 180);
    return () => window.clearTimeout(timer);
  }, [navigationKey, catalogLoading, catalogVersion]);

  useEffect(() => {
    localStorage.setItem(
      GAMING_FILTERS_KEY,
      JSON.stringify({ categories: selectedCategories, brands: selectedBrands, minPrice, maxPrice, minRating, onlyOff, inStock, sort, selectedUsage }),
    );
  }, [selectedCategories, selectedBrands, minPrice, maxPrice, minRating, onlyOff, inStock, sort, selectedUsage]);

  useEffect(() => {
    if (selectedCategories.length !== 1) {
      setUsageProfiles([]);
      setSelectedUsage("");
      setUsageInLocation("");
      return;
    }
    const requestedUsage = usageFromLocation() || selectedUsage;
    setSelectedUsage(requestedUsage);
    const category = CATEGORIES.find((item) => item.id === selectedCategories[0]);
    const defaults = defaultUsageProfiles(category, "GAMING");
    setUsageProfiles(defaults);
    if (!category?.apiId) return;
    fetchAllPages(`${API_BASE}/catalog/usage-profiles/?page_size=100&catalog=GAMING&category=${category.apiId}`)
      .then((rows) => {
        const active = rows.filter((item) => item.is_active);
        setUsageProfiles(active.length ? active : defaults);
      })
      .catch(() => setUsageProfiles(defaults));
  }, [selectedCategories.join("|"), catalogVersion]);

  useEffect(() => {
    if (catalogLoading || !param) return undefined;
    const requestedCategory = sessionStorage.getItem("gaming_focus_category");
    if (requestedCategory !== String(param)) return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById("gaming-catalog")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
      sessionStorage.removeItem("gaming_focus_category");
    }, 180);
    return () => window.clearTimeout(timer);
  }, [param, catalogLoading, catalogVersion]);

  useEffect(() => {
    if (!searchQuery || catalogLoading) return undefined;
    const timer = window.setTimeout(() => {
      document.getElementById("gaming-catalog")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 160);
    return () => window.clearTimeout(timer);
  }, [searchQuery, catalogLoading]);

  useEffect(() => {
    fetchAllPages(`${API_BASE}/catalog/hero-slides/?page_size=100&placement=GAMING`)
      .then((rows) => setSlides(normalizeGamingSlides(rows)))
      .catch(() => setSlides(GAMING_DEFAULT_SLIDES));
    fetchAllPages(`${API_BASE}/catalog/promo-banners/?page_size=20&placement=GAMING`)
      .then((rows) =>
        setPromoBanners(rows.filter((banner) => banner.is_active).slice(0, 3)),
      )
      .catch(() => setPromoBanners([]));
    fetchAllPages(`${API_BASE}/catalog/brands/?page_size=100`)
      .then((rows) => setBrands(rows.filter((brand) => brand.is_active)))
      .catch(() => setBrands([]));
  }, []);

  useEffect(() => {
    if (slides.length < 2 || siteSettings.gaming_hero_autoplay === false) return;
    const timer = setInterval(
      () => setSlideIndex((index) => (index + 1) % slides.length),
      Math.max(2, Number(siteSettings.gaming_hero_interval_seconds || 5)) * 1000,
    );
    return () => clearInterval(timer);
  }, [slides.length, siteSettings.gaming_hero_autoplay, siteSettings.gaming_hero_interval_seconds]);

  const allGamingProducts = useMemo(
    () => ProductSelectors.gaming(PRODUCTS),
    [catalogVersion],
  );
  const selectedSeoCategory = selectedCategories.length === 1
    ? CATEGORIES.find((category) => category.id === selectedCategories[0])
    : null;
  const gamingProducts = useMemo(
    () =>
      selectedCategories.length
        ? allGamingProducts.filter((product) =>
            selectedCategories.includes(product.cat),
          )
        : allGamingProducts,
    [allGamingProducts, selectedCategories],
  );
  const availableGamingBrands = useMemo(
    () => [...new Set(gamingProducts.map((product) => product.brand).filter(Boolean))],
    [gamingProducts],
  );
  const priceCeiling = Math.max(
    1000000,
    ...gamingProducts.map((product) => product.finalPrice),
  );
  useEffect(() => {
    if (availableGamingBrands.length)
      setSelectedBrands((current) =>
        current.filter((brand) => availableGamingBrands.includes(brand)),
      );
    setMinPrice((current) => Math.min(current, priceCeiling));
    setMaxPrice((current) => Math.min(Math.max(current, 0), priceCeiling));
    setLimit(12);
  }, [availableGamingBrands.join("|"), priceCeiling]);

  const filteredGamingProducts = useMemo(() => {
    let result = gamingProducts.filter(
      (product) =>
        ProductSelectors.matchesSearch(product, searchQuery) &&
        productMatchesUsage(product, usageProfiles.find((profile) => profile.id === selectedUsage), usageProfiles, gamingProducts) &&
        (!selectedBrands.length || selectedBrands.includes(product.brand)) &&
        product.finalPrice >= minPrice &&
        product.finalPrice <= maxPrice &&
        product.rate >= minRating &&
        (!onlyOff || product.off > 0) &&
        (!inStock || product.stock > 0),
    );
    if (sort === "cheap") result = [...result].sort((a, b) => a.finalPrice - b.finalPrice);
    if (sort === "exp") result = [...result].sort((a, b) => b.finalPrice - a.finalPrice);
    if (sort === "rate") result = [...result].sort((a, b) => b.rate - a.rate);
    if (sort === "pop") result = [...result].sort((a, b) => b.sold - a.sold);
    if (sort === "least") result = [...result].sort((a, b) => a.sold - b.sold);
    if (sort === "new") result = [...result].sort((a, b) =>
      String(b.createdAt).localeCompare(String(a.createdAt)),
    );
    return result;
  }, [gamingProducts, selectedBrands, minPrice, maxPrice, minRating, onlyOff, inStock, sort, selectedUsage, usageProfiles, searchQuery]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting)
          setLimit((current) => Math.min(current + 8, filteredGamingProducts.length));
      },
      { rootMargin: "200px" },
    );
    if (productsSentinel.current) observer.observe(productsSentinel.current);
    return () => observer.disconnect();
  }, [filteredGamingProducts.length]);

  const toggleGamingCategory = (categoryId) => {
    setSelectedUsage("");
    setUsageInLocation("");
    setSelectedCategories((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId],
    );
  };
  const gamingDeals = ProductSelectors.featuredBalanced(gamingProducts, 12);
  const bestGaming = [...gamingProducts]
    .sort((a, b) => b.sold - a.sold || b.rate - a.rate)
    .slice(0, 12);
  const newestGaming = [...gamingProducts]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 12);
  const topRatedGaming = [...gamingProducts]
    .filter((product) => product.stock > 0)
    .sort((a, b) => b.rate - a.rate || b.sold - a.sold)
    .slice(0, 12);
  const valueGaming = [...gamingProducts]
    .filter((product) => product.stock > 0)
    .sort(
      (a, b) =>
        b.off - a.off || a.finalPrice - b.finalPrice || b.rate - a.rate,
    )
    .slice(0, 12);
  const gamingCategories = CATEGORIES;
  const gamingBrandNames = new Set(
    gamingProducts.map((product) => String(product.brand || "").trim()),
  );
  const gamingBrands = [
    ...brands.filter((brand) => gamingBrandNames.has(String(brand.name).trim())),
    ...[...gamingBrandNames]
      .filter(Boolean)
      .filter(
        (name) =>
          !brands.some((brand) => String(brand.name).trim() === String(name)),
      )
      .map((name) => ({ id: `gaming-${name}`, name, logo: "" })),
  ];
  const visibleGamingBrands = gamingBrands.length >= 4 ? gamingBrands : brands;
  const activeSlide = slides[slideIndex] || null;
  const ActiveIcon = I[activeSlide?.icon_name] || I.gpu;
  const openGamingSlide = (slide) => {
    if (!slide?.target) return;
    slide.target === "gaming"
      ? nav("gaming")
      : nav("shop", slide.target === "shop" ? null : slide.target);
  };

  return (
    <div className="gaming-page">
      {selectedSeoCategory?.introText && (
        <section className="container category-seo-content glass" aria-labelledby="gaming-category-seo-title">
          <h1 id="gaming-category-seo-title">{selectedSeoCategory.name} گیمینگ</h1>
          <p>{selectedSeoCategory.introText}</p>
          {selectedSeoCategory.buyingGuide && <p>{selectedSeoCategory.buyingGuide}</p>}
        </section>
      )}
      <div className="gaming-ambient" aria-hidden="true"></div>
      <div className="container gaming-container">
        {siteSettings.gaming_hero_enabled !== false && <section className="gaming-hero-slider" aria-label="اسلایدر گیمینگ">
          <div
            key={activeSlide?.id || slideIndex}
            className="gaming-hero-stage gaming-hero-modern"
            onClick={() => openGamingSlide(activeSlide)}
            role={activeSlide?.target ? "link" : undefined}
            tabIndex={activeSlide?.target ? 0 : undefined}
            onKeyDown={(event) => {
              if (activeSlide?.target && (event.key === "Enter" || event.key === " ")) {
                event.preventDefault();
                openGamingSlide(activeSlide);
              }
            }}
          >
            {activeSlide?.image ? (
              <img src={activeSlide.image} alt={activeSlide.title} />
            ) : (
              <ActiveIcon className="gaming-hero-icon icon" />
            )}
          </div>
          {siteSettings.gaming_hero_controls !== false && slides.length > 1 && (
            <div className="gaming-slide-controls">
              <button
                type="button"
                onClick={() =>
                  setSlideIndex(
                    (index) => (index - 1 + slides.length) % slides.length,
                  )
                }
                aria-label="اسلاید قبلی"
              >
                ›
              </button>
              <div className="gaming-slide-dots">
                {slides.map((slide, index) => (
                  <button
                    type="button"
                    key={slide.id}
                    className={index === slideIndex ? "active" : ""}
                    onClick={() => setSlideIndex(index)}
                    aria-label={`اسلاید ${index + 1}`}
                  />
                ))}
              </div>
              <button
                type="button"
                onClick={() =>
                  setSlideIndex((index) => (index + 1) % slides.length)
                }
                aria-label="اسلاید بعدی"
              >
                ‹
              </button>
            </div>
          )}
        </section>}

        {siteSettings.gaming_heading_enabled !== false && <header className="gaming-heading fade-in">
          <span className="gaming-kicker">{siteSettings.gaming_heading_kicker}</span>
          <h1>{siteSettings.gaming_heading_title}</h1>
          <p>{siteSettings.gaming_heading_subtitle}</p>
        </header>}

        {siteSettings.gaming_banners_enabled !== false && <PromoBannerGrid banners={promoBanners} placeholderCount={3} />}

        {siteSettings.gaming_categories_enabled !== false && <section className="gaming-category-section">
          <h2 className="section-title">دسته‌بندی محصولات گیمینگ</h2>
          <p className="section-sub">تجهیزات گیمینگ موردنظرت را انتخاب کن</p>
          <div className="cat-strip gaming-category-grid">
            {gamingCategories.map((category) => {
              const CategoryIcon = I[category.icon] || I.cpu;
              const count = allGamingProducts.filter(
                (product) => product.cat === category.id,
              ).length;
              return (
                <button
                  className={`cat-card glass gaming-category-card${category.gamingImage ? " has-image" : ""}`}
                  key={category.id}
                  aria-pressed={selectedCategories.includes(category.id)}
                  onClick={() => {
                    setSelectedUsage("");
                    setUsageInLocation("");
                    setSelectedCategories([category.id]);
                    requestAnimationFrame(() =>
                      document
                        .querySelector(".gaming-products-start")
                        ?.scrollIntoView({ behavior: "smooth", block: "start" }),
                    );
                  }}
                >
                  {category.gamingImage && (
                    <img
                      className="cat-card-image gaming-category-image"
                      src={category.gamingImage}
                      alt={category.name}
                      loading="lazy"
                    />
                  )}
                  <span className="cat-ic gaming-category-icon">
                    <CategoryIcon className="icon" />
                  </span>
                  <span className="cat-card-copy">
                    <b>{category.name}</b>
                    <small>
                      {count ? `${fmt(count)} محصول گیمینگ` : "مشاهده دسته‌بندی"}
                    </small>
                  </span>
                  <i className="cat-card-arrow gaming-category-arrow" aria-hidden="true">←</i>
                </button>
              );
            })}
          </div>
        </section>}

        {siteSettings.gaming_brands_enabled !== false && <BrandCarousel
          brands={visibleGamingBrands}
          title="محبوب‌ترین برندهای گیمینگ"
          className="gaming-brands-carousel"
        />}

        {gamingProducts.length ? (
          <>
            {siteSettings.gaming_deals_enabled !== false && gamingDeals.length > 0 && <AmazingOffers
              section={{
                title: siteSettings.gaming_deals_title,
                subtitle: "تخفیف تجهیزات منتخب بازی",
                slider_interval_seconds: 5,
              }}
              products={gamingDeals}
              nav={nav}
              showCountdown={false}
              className="gaming-amazing"
              themeStyle={{
                "--amazing-gradient":
                  "linear-gradient(125deg, #111827, #7c3aed 52%, #06b6d4)",
                "--amazing-accent": "#7c3aed",
              }}
              onViewAll={() =>
                document
                  .querySelector("#gaming-catalog, .gaming-products-start")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            />}

            {siteSettings.gaming_top_rated_enabled !== false && <ProductCarousel
              title={siteSettings.gaming_top_rated_title}
              products={topRatedGaming}
              nav={nav}
              section={{ slider_interval_seconds: 5 }}
              showAll={false}
            />}
            {siteSettings.gaming_value_enabled !== false && <ProductCarousel
              title={siteSettings.gaming_value_title}
              products={valueGaming}
              nav={nav}
              section={{ slider_interval_seconds: 6 }}
              showAll={false}
            />}

            {siteSettings.gaming_best_sellers_enabled !== false && <div className="gaming-products-start">
              <ProductCarousel
                title={siteSettings.gaming_best_sellers_title}
                products={bestGaming}
                nav={nav}
                section={{ slider_interval_seconds: 5 }}
                showAll={false}
              />
            </div>}
            {siteSettings.gaming_newest_enabled !== false && <ProductCarousel
              title={siteSettings.gaming_newest_title}
              products={newestGaming}
              nav={nav}
              section={{ slider_interval_seconds: 6 }}
              showAll={false}
            />}

            {siteSettings.gaming_catalog_enabled !== false && <section id="gaming-catalog" className="gaming-catalog-section" aria-labelledby="gaming-catalog-title">
              <h2 id="gaming-catalog-title" className="section-title">{siteSettings.gaming_catalog_title}</h2>
              <UsageProfilePicker profiles={usageProfiles} value={selectedUsage} onChange={setSelectedUsage} />
              <p className="section-sub">
                {searchQuery ? `نتایج جستجوی «${searchQuery}» · ` : ""}
                {fmt(filteredGamingProducts.length)} محصول گیمینگ یافت شد
              </p>
              <div className="shop-layout gaming-shop-layout">
                <aside className="filters glass">
                  <h4 style={{ marginBottom: 8 }}>فیلترها</h4>
                  <FilterAccordion title="دسته‌بندی">
                    <label className="fopt">
                      <input type="checkbox" checked={!selectedCategories.length} onChange={() => {
                        setSelectedCategories([]);
                        setSelectedUsage("");
                        setUsageInLocation("");
                      }} /> همه
                    </label>
                    {CATEGORIES.map((category) => (
                      <label className="fopt" key={category.id}>
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category.id)}
                          onChange={() => toggleGamingCategory(category.id)}
                        /> {category.name}
                      </label>
                    ))}
                  </FilterAccordion>
                  <FilterAccordion title="محدوده قیمت">
                    <div className="gaming-price-inputs">
                      <input className="site-input filter-number" type="number" min="0" max={maxPrice} value={minPrice}
                        onChange={(event) => setMinPrice(Math.min(Number(event.target.value || 0), maxPrice))} />
                      <input className="site-input filter-number" type="number" min={minPrice} max={priceCeiling} value={maxPrice}
                        onChange={(event) => setMaxPrice(Math.max(minPrice, Math.min(Number(event.target.value || 0), priceCeiling)))} />
                    </div>
                    <input className="range" type="range" min="0" max={priceCeiling} step={Math.max(10000, Math.round(priceCeiling / 100))} value={minPrice}
                      onChange={(event) => setMinPrice(Math.min(+event.target.value, maxPrice))} />
                    <input className="range" type="range" min="0" max={priceCeiling} step={Math.max(10000, Math.round(priceCeiling / 100))} value={maxPrice}
                      onChange={(event) => setMaxPrice(Math.max(+event.target.value, minPrice))} />
                    <div className="gaming-price-caption"><span>از {fmt(minPrice)}</span><span>تا {fmt(maxPrice)} تومان</span></div>
                    <button className="btn btn-ghost gaming-reset-price" onClick={() => { setMinPrice(0); setMaxPrice(priceCeiling); }}>
                      پاک‌کردن محدوده قیمت
                    </button>
                  </FilterAccordion>
                  <FilterAccordion title="حداقل امتیاز کاربران">
                    {[[0, "همه"], [3, "۳ ستاره و بیشتر"], [4, "۴ ستاره و بیشتر"]].map(([value, label]) => (
                      <label className="fopt" key={value}>
                        <input type="radio" checked={minRating === value} onChange={() => setMinRating(value)} /> {label}
                      </label>
                    ))}
                  </FilterAccordion>
                  <FilterAccordion title="برند">
                    <div className="filter-options-scroll">
                      {availableGamingBrands.map((brand) => (
                        <label className="fopt" key={brand}>
                          <input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() =>
                            setSelectedBrands((current) => current.includes(brand) ? current.filter((item) => item !== brand) : [...current, brand])
                          } /> {brand}
                        </label>
                      ))}
                    </div>
                  </FilterAccordion>
                  <FilterAccordion title="وضعیت محصول" className="filter-accordion-last">
                    <label className="fopt"><input type="checkbox" checked={onlyOff} onChange={(event) => setOnlyOff(event.target.checked)} /> فقط تخفیف‌دار</label>
                    <label className="fopt"><input type="checkbox" checked={inStock} onChange={(event) => setInStock(event.target.checked)} /> فقط موجود</label>
                  </FilterAccordion>
                </aside>
                <div>
                  <div className="glass shop-sort-bar gaming-sort-bar">
                    <b className="shop-sort-title">مرتب‌سازی:</b>
                    <div className="shop-sort-options">
                    {[["pop", "پرفروش‌ترین"], ["least", "کم‌فروش‌ترین"], ["new", "جدیدترین"], ["cheap", "ارزان‌ترین"], ["exp", "گران‌ترین"], ["rate", "بیشترین امتیاز"]].map(([key, label]) => (
                      <button key={key} className={`tab${sort === key ? " on" : ""}`} onClick={() => setSort(key)}>{label}</button>
                    ))}
                    </div>
                  </div>
                  <div className="prod-grid">
                    {filteredGamingProducts.slice(0, limit).map((product) => <ProductCard key={product.id} p={product} />)}
                  </div>
                  {catalogLoading && !filteredGamingProducts.length && <div className="glass gaming-catalog-message">در حال دریافت محصولات گیمینگ...</div>}
                  {!catalogLoading && !filteredGamingProducts.length && <div className="glass gaming-catalog-message">محصول گیمینگ مطابق این فیلترها پیدا نشد 😔</div>}
                  <div ref={productsSentinel} className="gaming-products-sentinel" />
                </div>
              </div>
            </section>}
          </>
        ) : (
          <section className="gaming-empty glass">
            <I.gpu className="icon" />
            <h2>هنوز محصول گیمینگ ثبت نشده است</h2>
            <p>
              در پنل ادمین، هنگام افزودن یا ویرایش محصول گزینه «این محصول
              گیمینگ است» را فعال کنید.
            </p>
            <button className="btn btn-primary" onClick={() => nav("shop")}>
              مشاهده فروشگاه
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
