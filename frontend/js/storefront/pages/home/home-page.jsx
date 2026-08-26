function Home() {
  const { nav, siteSettings, catalogVersion } = useStore();
  const heroRef = useRef();
  const [homeSections, setHomeSections] = useState({});
  const [heroSlides, setHeroSlides] = useState([]);
  const [brands, setBrands] = useState([]);
  const [promoBanners, setPromoBanners] = useState([]);
  const [viewedVersion, setViewedVersion] = useState(0);
  const [heroSlideIndex, setHeroSlideIndex] = useState(0);
  const regularProducts = useMemo(
    () => ProductSelectors.regular(PRODUCTS),
    [catalogVersion],
  );
  useEffect(() => {
    fetchAllPages(API_BASE + "/catalog/home-sections/?page_size=100")
      .then((rows) => {
        const next = {};
        rows.forEach((x) => (next[x.key] = x));
        setHomeSections(next);
      })
      .catch(() => {});
  }, []);
  useEffect(() => {
    const refreshViewed = () => setViewedVersion((version) => version + 1);
    window.addEventListener("storage", refreshViewed);
    window.addEventListener("focus", refreshViewed);
    return () => {
      window.removeEventListener("storage", refreshViewed);
      window.removeEventListener("focus", refreshViewed);
    };
  }, []);
  useEffect(() => {
    fetchAllPages(`${API_BASE}/catalog/brands/?page_size=100`)
      .then((rows) => setBrands(rows.filter((brand) => brand.is_active)))
      .catch(() => setBrands([]));
  }, []);
  useEffect(() => {
    fetchAllPages(API_BASE + "/catalog/hero-slides/?page_size=100&placement=HOME")
      .then((rows) => setHeroSlides(rows))
      .catch(() => setHeroSlides([]));
  }, []);
  useEffect(() => {
    fetchAllPages(`${API_BASE}/catalog/promo-banners/?page_size=20&placement=HOME`)
      .then((rows) =>
        setPromoBanners(rows.filter((banner) => banner.is_active).slice(0, 3)),
      )
      .catch(() => setPromoBanners([]));
  }, []);
  useEffect(() => {
    if (heroSlides.length < 2 || siteSettings.home_hero_autoplay === false) return;
    const timer = setInterval(
      () => setHeroSlideIndex((i) => (i + 1) % heroSlides.length),
      Math.max(2, Number(siteSettings.home_hero_interval_seconds || 6)) * 1000,
    );
    return () => clearInterval(timer);
  }, [heroSlides.length, siteSettings.home_hero_autoplay, siteSettings.home_hero_interval_seconds]);
  const sectionProducts = (section, fallbackOrdering) => {
    const ordering = section?.product_ordering || fallbackOrdering;
    const rows = [...regularProducts];
    const sorters = {
      BEST_SELLING: (a, b) => b.sold - a.sold,
      NEWEST: (a, b) => String(b.createdAt).localeCompare(String(a.createdAt)),
      DISCOUNT: (a, b) => b.off - a.off,
      RATING: (a, b) => b.rate - a.rate,
      PRICE_ASC: (a, b) => a.finalPrice - b.finalPrice,
      PRICE_DESC: (a, b) => b.finalPrice - a.finalPrice,
    };
    rows.sort(sorters[ordering] || sorters.NEWEST);
    return rows.slice(0, Math.max(1, Number(section?.product_limit || 4)));
  };
  const featured = ProductSelectors.featuredBalanced(
    regularProducts,
    Math.max(1, Number(homeSections.offers?.product_limit || 8)),
  );
  const best = sectionProducts(homeSections.best_sellers, "BEST_SELLING");
  const newest = sectionProducts(homeSections.newest, "NEWEST");
  const viewedProducts = LS.get("viewed", [])
    .map((id) =>
      regularProducts.find(
        (product) =>
          String(product.id) === String(id) ||
          String(product.slug) === String(id) ||
          String(product.apiId) === String(id),
      ),
    )
    .filter(Boolean);
  const viewedCategories = new Set(
    viewedProducts.map((product) => product.cat),
  );
  const viewedBrands = new Set(viewedProducts.map((product) => product.brand));
  const recommendationProducts = [
    ...viewedProducts,
    ...regularProducts.filter(
      (product) =>
        !viewedProducts.includes(product) &&
        (viewedCategories.has(product.cat) || viewedBrands.has(product.brand)),
    ).sort((a, b) => b.rate - a.rate || b.sold - a.sold),
  ].slice(0, 12);
  void viewedVersion;
  const activeHeroSlide = heroSlides[heroSlideIndex] || null;
  const visibleHeroSlides = heroSlides.length
    ? (heroSlides.length === 1
        ? [{ slide: heroSlides[0], position: "active", index: 0 }]
        : heroSlides.length === 2
          ? [
              { slide: heroSlides[heroSlideIndex], position: "active", index: heroSlideIndex },
              { slide: heroSlides[(heroSlideIndex + 1) % 2], position: "next", index: (heroSlideIndex + 1) % 2 },
            ]
          : [
              { slide: heroSlides[(heroSlideIndex - 1 + heroSlides.length) % heroSlides.length], position: "previous", index: (heroSlideIndex - 1 + heroSlides.length) % heroSlides.length },
              { slide: heroSlides[heroSlideIndex], position: "active", index: heroSlideIndex },
              { slide: heroSlides[(heroSlideIndex + 1) % heroSlides.length], position: "next", index: (heroSlideIndex + 1) % heroSlides.length },
            ])
    : [{
        slide: {
          id: "hero-fallback",
          title: "تجهیزات حرفه‌ای فروشگاه 82",
          subtitle: "جدیدترین محصولات دیجیتال را با ضمانت معتبر انتخاب کنید.",
          icon_name: "gpu",
          target: "shop",
        },
        position: "active",
        index: 0,
      }];

  const openHeroSlide = (slide) => {
    if (!slide?.target) return;
    nav("shop", slide.target === "shop" ? null : slide.target);
  };

  return (
    <div className="container">
      {siteSettings.home_hero_enabled !== false && <section className="hero" ref={heroRef}>
        <div className="hero-full-layout">
          <div className="hero-visual hero-showcase" aria-roledescription="carousel">
            <div className="hero-showcase-stage">
              {visibleHeroSlides.map(({ slide, position, index }) => {
                const SlideIcon = I[slide.icon_name] || I.gpu;
                const isActive = position === "active";
                return (
                  <article
                    className={`hero-showcase-card hero-showcase-card--${position}`}
                    key={slide.id}
                    aria-hidden={!isActive}
                    onClick={() => {
                      if (isActive) openHeroSlide(slide);
                      else setHeroSlideIndex(index);
                    }}
                  >
                    <div className="hero-showcase-media">
                      {slide.image ? (
                        <img
                          src={slide.image}
                          alt={isActive ? slide.title : ""}
                          decoding="async"
                          loading={isActive ? "eager" : "lazy"}
                        />
                      ) : (
                        <SlideIcon className="hero-showcase-icon" aria-hidden="true" />
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
            {siteSettings.home_hero_controls !== false && heroSlides.length > 1 && (
              <div className="hero-slide-controls">
                <button
                  type="button"
                  className="hero-slide-arrow"
                  aria-label="اسلاید قبلی"
                  onClick={(event) => {
                    event.stopPropagation();
                    setHeroSlideIndex(
                      (index) => (index - 1 + heroSlides.length) % heroSlides.length,
                    );
                  }}
                >
                  ›
                </button>
                <div className="hero-slide-dots">
                  {heroSlides.map((slide, index) => (
                    <button
                      type="button"
                      key={slide.id}
                      className={index === heroSlideIndex ? "active" : ""}
                      aria-label={`اسلاید ${index + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setHeroSlideIndex(index);
                      }}
                    />
                  ))}
                </div>
                <button
                  type="button"
                  className="hero-slide-arrow"
                  aria-label="اسلاید بعدی"
                  onClick={(event) => {
                    event.stopPropagation();
                    setHeroSlideIndex((index) => (index + 1) % heroSlides.length);
                  }}
                >
                  ‹
                </button>
              </div>
            )}
          </div>
          {siteSettings.home_quick_links_enabled !== false && <div className="hero-paths hero-quick-links" aria-label="مسیرهای سریع خرید">
            <button type="button" onClick={() => nav("shop", "laptop")}>
              {siteSettings.hero_laptop_image ? <img src={siteSettings.hero_laptop_image} alt="لپ‌تاپ‌ها" /> : <span><I.laptop /></span>}
              <strong><b>{siteSettings.home_laptop_title}</b><small>{siteSettings.home_laptop_subtitle}</small></strong><i aria-hidden="true">←</i>
            </button>
            <button type="button" onClick={() => nav("shop", "cpu")}>
              {siteSettings.hero_components_image ? <img src={siteSettings.hero_components_image} alt="قطعات حرفه‌ای" /> : <span><I.cpu /></span>}
              <strong><b>{siteSettings.home_components_title}</b><small>{siteSettings.home_components_subtitle}</small></strong><i aria-hidden="true">←</i>
            </button>
            <button type="button" onClick={() => nav("gaming")}>
              {siteSettings.hero_gaming_image ? <img src={siteSettings.hero_gaming_image} alt="دنیای گیمینگ" /> : <span><I.gpu /></span>}
              <strong><b>{siteSettings.home_gaming_title}</b><small>{siteSettings.home_gaming_subtitle}</small></strong><i aria-hidden="true">←</i>
            </button>
            <button type="button" onClick={() => nav("shop", "monitor")}>
              {siteSettings.hero_monitor_image ? <img src={siteSettings.hero_monitor_image} alt="مانیتورها" /> : <span><I.monitor /></span>}
              <strong><b>{siteSettings.home_monitor_title}</b><small>{siteSettings.home_monitor_subtitle}</small></strong><i aria-hidden="true">←</i>
            </button>
            <button type="button" onClick={() => nav("shop", "headphone")}>
              {siteSettings.hero_audio_image ? <img src={siteSettings.hero_audio_image} alt="هدفون و صدا" /> : <span><I.headphone /></span>}
              <strong><b>{siteSettings.home_audio_title}</b><small>{siteSettings.home_audio_subtitle}</small></strong><i aria-hidden="true">←</i>
            </button>
          </div>}
        </div>
      </section>}

      {siteSettings.home_banners_enabled !== false && <PromoBannerGrid banners={promoBanners} />}

      {siteSettings.home_categories_enabled !== false && <section style={{ marginTop: 20 }}>
        <h2 className="section-title">{siteSettings.category_title}</h2>
        <p className="section-sub">{siteSettings.category_subtitle}</p>
        <div className="cat-strip">
          {CATEGORIES.map((c) => (
            <button
              type="button"
              className={`cat-card glass${c.image ? " has-image" : ""}`}
              key={c.id}
              onClick={() => nav("shop", c.id)}
            >
              {c.image && (
                <img className="cat-card-image" src={c.image} alt={c.name} loading="lazy" />
              )}
              <div className="cat-ic">
                {I[c.icon]({
                  className: "icon",
                  style: { width: 28, height: 28 },
                })}
              </div>
              <span className="cat-card-copy">
                <b>{c.name}</b>
                <small>{c.subs?.[0] || "مشاهده محصولات"}</small>
              </span>
              <i className="cat-card-arrow" aria-hidden="true">←</i>
            </button>
          ))}
        </div>
      </section>}

      {siteSettings.home_brands_enabled !== false && <BrandCarousel brands={brands} />}

      {homeSections.offers?.is_active !== false && featured.length > 0 && (
        <AmazingOffers
          section={homeSections.offers}
          products={featured}
          nav={nav}
        />
      )}
      {homeSections.best_sellers?.is_active !== false && (
        <ProductCarousel
          title={`🔥 ${homeSections.best_sellers?.title || "پرفروش‌ترین‌ها"}`}
          products={best}
          nav={nav}
          section={homeSections.best_sellers}
        />
      )}
      {homeSections.newest?.is_active !== false && (
        <ProductCarousel
          title={`✨ ${homeSections.newest?.title || "جدیدترین محصولات"}`}
          products={newest}
          nav={nav}
          section={homeSections.newest}
        />
      )}
      {siteSettings.home_recommendations_enabled !== false && recommendationProducts.length > 0 && (
        <ProductCarousel
          title={siteSettings.home_recommendations_title}
          products={recommendationProducts}
          nav={nav}
          section={{ slider_interval_seconds: 7 }}
        />
      )}

    </div>
  );
}
