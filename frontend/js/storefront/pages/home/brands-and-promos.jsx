const BRAND_ENGLISH_NAMES = {
  "ایسوس": "ASUS",
  "ام‌اس‌آی": "MSI",
  "ام اس آی": "MSI",
  "گیگابایت": "GIGABYTE",
  "کورسیر": "CORSAIR",
  "سیگیت": "SEAGATE",
  "وسترن دیجیتال": "WESTERN DIGITAL",
  "توشیبا": "TOSHIBA",
  "لنوو": "LENOVO",
  "هایپراکس": "HYPERX",
  "هایپرایکس": "HYPERX",
  "ریزر": "RAZER",
  "اینتل": "INTEL",
  "ای ام دی": "AMD",
  "ای‌ام‌دی": "AMD",
  "انویدیا": "NVIDIA",
  "سامسونگ": "SAMSUNG",
  "لاجیتک": "LOGITECH",
  "ایسر": "ACER",
  "دل": "DELL",
  "اچ پی": "HP",
  "اپل": "APPLE",
  "ترنسند": "TRANSCEND",
  "تیم گروپ": "TEAMGROUP",
  "جی اسکیل": "G.SKILL",
  "جی‌اسکیل": "G.SKILL",
  "جی بی ال": "JBL",
  "رپو": "RAPOO",
  "ردراگون": "REDRAGON",
  "زوتک": "ZOTAC",
  "سافایر": "SAPPHIRE",
  "سن دیسک": "SANDISK",
  "سندیسک": "SANDISK",
  "سنهایزر": "SENNHEISER",
  "سونی": "SONY",
  "سیلیکون پاور": "SILICON POWER",
  "فنتک": "FANTECH",
  "فیلیپس": "PHILIPS",
  "کروشیال": "CRUCIAL",
  "کی‌کرون": "KEYCHRON",
  "کیوکسیا": "KIOXIA",
  "لکسار": "LEXAR",
  "مایکروسافت": "MICROSOFT",
  "ویوسونیک": "VIEWSONIC",
  "ازراک": "ASROCK",
  "استیل سریز": "STEELSERIES",
  "ال جی": "LG",
  "ای او سی": "AOC",
  "ای دیتا": "ADATA",
  "ایکس اف ایکس": "XFX",
  "بنکیو": "BENQ",
  "پاتریوت": "PATRIOT",
  "پالیت": "PALIT",
  "پی ان وای": "PNY",
};

const BRAND_BUILTIN_LOGOS = {
  ASUS: "/public/brands/asus.svg",
  MSI: "/public/brands/msi.svg",
  AMD: "/public/brands/amd.svg",
  INTEL: "/public/brands/intel.svg",
  CORSAIR: "/public/brands/corsair.svg",
  GIGABYTE: "/public/brands/gigabyte.svg",
  KINGSTON: "/public/brands/kingstontechnology.svg",
  ACER: "/public/brands/acer.svg",
  SAMSUNG: "/public/brands/samsung.svg",
  "LOGITECH G": "/public/brands/logitechg.svg",
  SEAGATE: "/public/brands/seagate.svg",
  "WESTERN DIGITAL": "/public/brands/westerndigital.svg",
  TOSHIBA: "/public/brands/toshiba.svg",
  LENOVO: "/public/brands/lenovo.svg",
  HYPERX: "/public/brands/hyperx.svg",
  RAZER: "/public/brands/razer.svg",
  DELL: "/public/brands/dell.svg",
  HP: "/public/brands/hp.svg",
  "COOLER MASTER": "/public/brands/coolermaster.svg",
  DEEPCOOL: "/public/brands/deepcool.svg",
  APPLE: "/public/brands/apple.svg",
  JBL: "/public/brands/jbl.svg",
  LOGITECH: "/public/brands/logitech.svg",
  LG: "/public/brands/lg.svg",
  NVIDIA: "/public/brands/nvidia.svg",
  REDRAGON: "/public/brands/redragon.svg",
  SENNHEISER: "/public/brands/sennheiser.svg",
  SONY: "/public/brands/sony.svg",
  STEELSERIES: "/public/brands/steelseries.svg",
};

const BRAND_WORDMARK_COLORS = {
  TRANSCEND: "#e51b23", TEAMGROUP: "#202b5b", "G.SKILL": "#e2231a",
  RAPOO: "#111827", ZOTAC: "#f58220", SAPPHIRE: "#0099d8",
  SANDISK: "#ed1c24", "SILICON POWER": "#005baa", FANTECH: "#ef3123",
  PHILIPS: "#0b5ed7", CRUCIAL: "#005eb8", KEYCHRON: "#111827",
  KIOXIA: "#e6007e", LEXAR: "#111827", MICROSOFT: "#737373",
  VIEWSONIC: "#e31b23", ASROCK: "#111827", AOC: "#e30613",
  ADATA: "#e21b2d", XFX: "#111827", BENQ: "#6b2da8",
  PATRIOT: "#d71920", PALIT: "#00a651", PNY: "#111827",
};

const brandEnglishName = (brand) => {
  const name = String(brand?.name || "").trim();
  const slug = String(brand?.slug || "").trim();
  if (BRAND_ENGLISH_NAMES[name]) return BRAND_ENGLISH_NAMES[name];
  if (/^[a-z0-9][a-z0-9 .&+_-]*$/i.test(name)) return name.toUpperCase();
  return slug
    ? slug.replace(/[-_]+/g, " ").toUpperCase()
    : name;
};

function BrandVisual({ brand }) {
  const [failed, setFailed] = useState(false);
  const hue = brandHue(brand.name);
  const englishName = brandEnglishName(brand);
  const logoSource = brand.logo || BRAND_BUILTIN_LOGOS[englishName] || "";
  useEffect(() => setFailed(false), [logoSource]);
  if (logoSource && !failed)
    return (
      <img
        src={logoSource}
        alt={`${englishName} logo`}
        onError={() => setFailed(true)}
      />
    );
  if (BRAND_WORDMARK_COLORS[englishName])
    return (
      <span
        className="brand-wordmark-logo"
        style={{ "--wordmark-color": BRAND_WORDMARK_COLORS[englishName] }}
        aria-label={`${englishName} logo`}
      >
        {englishName}
      </span>
    );
  return (
    <span
      className="brand-fallback-logo"
      style={{
        background: `linear-gradient(135deg,hsl(${hue} 75% 46%),hsl(${
          (hue + 48) % 360
        } 82% 58%))`,
      }}
      aria-hidden="true"
    >
      <strong>{brandInitials(englishName)}</strong>
      <small>{englishName}</small>
    </span>
  );
}

function BrandCarousel({
  brands,
  title = "محبوب‌ترین برندها",
  className = "",
}) {
  if (!brands.length) return null;
  let repeatCount = Math.max(2, Math.ceil(12 / brands.length));
  if (repeatCount % 2) repeatCount += 1;
  const loopBrands = Array.from({ length: repeatCount }, () => brands).flat();
  return (
    <section
      className={`brands-section ${className}`.trim()}
      aria-label={title}
    >
      <div className="brands-carousel-head">
        <span className="brand-head-icon">✣</span>
        <h2 className="section-title">{title}</h2>
      </div>
      <div className="brands-carousel glass">
        <div className="brands-marquee" dir="ltr">
          <div
            className="brands-marquee-track"
            style={{
              "--brand-duration": `${Math.max(24, (loopBrands.length / 2) * 3.5)}s`,
            }}
          >
            {loopBrands.map((brand, index) => (
              <div
                className="brand-slide"
                dir="rtl"
                key={`${brand.id}-${index}`}
              >
                <div className="brand-visual">
                  <BrandVisual brand={brand} />
                </div>
                <b dir="ltr" lang="en">{brandEnglishName(brand)}</b>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function PromoBannerGrid({ banners, placeholderCount = 0 }) {
  if (!banners.length && !placeholderCount) return null;
  const placeholderIcons = ["gpu", "headphone", "monitor", "cpu"];
  const visibleBanners = [...banners];
  while (visibleBanners.length < placeholderCount) {
    const index = visibleBanners.length;
    visibleBanners.push({
      id: `placeholder-${index}`,
      isPlaceholder: true,
      iconName: placeholderIcons[index % placeholderIcons.length],
      title: `جایگاه بنر گیمینگ ${fmt(index + 1)}`,
      subtitle: "تصویر این بنر را از پنل مدیریت اضافه کنید",
    });
  }
  const bannerHref = (target) => {
    const value = String(target || "").trim();
    if (!value) return "";
    if (/^(https?:)?\/\//i.test(value) || value.startsWith("/")) return value;
    if (value === "shop") return "/shop";
    return `/shop/${encodeURIComponent(value)}`;
  };
  return (
    <section
      className={`home-promo-banners ${visibleBanners.length === 1 ? "single" : ""}`}
      aria-label="بنرهای تبلیغاتی"
    >
      {visibleBanners.map((banner) => {
        const href = bannerHref(banner.target);
        const PlaceholderIcon = I[banner.iconName] || I.gpu;
        const content = (
          <>
            {banner.isPlaceholder ? (
              <span className="home-promo-banner-placeholder" aria-hidden="true">
                <PlaceholderIcon className="icon" />
              </span>
            ) : (
              <img
                src={banner.image}
                alt={banner.title || "بنر تبلیغاتی فروشگاه 82"}
                loading="lazy"
              />
            )}
            {(banner.title || banner.subtitle) && (
              <span className="home-promo-banner-copy">
                {banner.title && <b>{banner.title}</b>}
                {banner.subtitle && <small>{banner.subtitle}</small>}
              </span>
            )}
          </>
        );
        return href ? (
          <a
            className="home-promo-banner"
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            key={banner.id}
          >
            {content}
          </a>
        ) : (
          <article
            className={`home-promo-banner${banner.isPlaceholder ? " is-placeholder" : ""}`}
            key={banner.id}
          >
            {content}
          </article>
        );
      })}
    </section>
  );
}

