const categoryGuideFactors = (categoryName = "") => {
  const name = String(categoryName);
  if (/لوازم جانبی|اکسسوری/i.test(name)) return [
    ["سازگاری دقیق", "نوع درگاه، نسخه استاندارد، توان موردنیاز و سیستم‌عامل پشتیبانی‌شده را با دستگاه اصلی تطبیق دهید."],
    ["کیفیت ساخت", "جنس کابل و کانکتور، محافظت الکتریکی، دوام اتصالات و کیفیت مونتاژ را در استفاده طولانی بررسی کنید."],
    ["کاربرد واقعی", "هاب، مبدل، پایه یا ابزار جانبی را براساس تعداد تجهیزات و سناریوی روزانه انتخاب کنید تا هزینه اضافه نپردازید."],
    ["ایمنی و ضمانت", "برای شارژر و تجهیزات برقی، توان خروجی، پروتکل‌های ایمنی، اصالت کالا و شرایط ضمانت اهمیت ویژه دارد."],
  ];
  if (/RAM|رم/i.test(name)) return [
    ["نسل حافظه", "DDR4 یا DDR5 را دقیقاً مطابق مادربرد و پردازنده انتخاب کنید؛ این نسل‌ها با یکدیگر سازگار نیستند."],
    ["ظرفیت مناسب", "برای کار روزمره ۱۶ گیگابایت، کار حرفه‌ای ۳۲ گیگابایت و پردازش سنگین ۶۴ گیگابایت یا بیشتر پیشنهاد می‌شود."],
    ["فرکانس و تایمینگ", "فرکانس بالاتر و CL پایین‌تر عملکرد بهتری می‌دهد، اما ابتدا سقف پشتیبانی مادربرد و CPU را بررسی کنید."],
    ["چیدمان ماژول‌ها", "کیت دوماژوله مشابه معمولاً Dual Channel را فعال می‌کند و نسبت به یک ماژول هم‌ظرفیت پهنای باند بیشتری می‌دهد."],
  ];
  if (/SSD|HDD|هارد|حافظه/i.test(name)) return [
    ["نوع و رابط", "برای سرعت بیشتر NVMe M.2 و برای سازگاری گسترده‌تر SATA را بررسی کنید؛ ابعاد و نسل PCIe باید با دستگاه هماهنگ باشد."],
    ["ظرفیت واقعی", "فضای سیستم‌عامل، نرم‌افزارها و رشد آینده فایل‌ها را محاسبه کنید و حداقل ۲۰ درصد فضای خالی در نظر بگیرید."],
    ["دوام و سرعت", "سرعت خواندن/نوشتن، TBW، نوع NAND، حافظه DRAM و مدت ضمانت را کنار قیمت مقایسه کنید."],
    ["کاربری", "برای سیستم‌عامل SSD، برای آرشیو اقتصادی HDD و برای کار حرفه‌ای ترکیب هر دو معمولاً انتخاب متعادلی است."],
  ];
  if (/لپ.?تاپ/i.test(name)) return [
    ["نوع استفاده", "مدل را براساس کاربری روزمره، برنامه‌نویسی، طراحی، مهندسی یا بازی انتخاب کنید؛ فقط به نام پردازنده اکتفا نکنید."],
    ["نمایشگر و بدنه", "اندازه، وضوح، پوشش رنگ، روشنایی، وزن و کیفیت لولا را متناسب با حمل‌ونقل و مدت استفاده بسنجید."],
    ["ارتقاپذیری", "قابلیت ارتقای RAM و SSD، تعداد درگاه‌ها و محدودیت‌های لحیم‌شده دستگاه را پیش از خرید کنترل کنید."],
    ["باتری و خنک‌کنندگی", "ظرفیت باتری، توان شارژر، صدای فن و عملکرد پایدار دستگاه زیر بار از مشخصات مهم هستند."],
  ];
  if (/مانیتور/i.test(name)) return [
    ["پنل و کیفیت تصویر", "IPS برای رنگ و زاویه دید، VA برای کنتراست و OLED برای کیفیت ممتاز مناسب است؛ نوع پنل را با کاربرد هماهنگ کنید."],
    ["وضوح و اندازه", "برای اندازه‌های بزرگ‌تر، وضوح بالاتر تراکم تصویر را حفظ می‌کند؛ توان کارت گرافیک را نیز در نظر بگیرید."],
    ["سرعت تصویر", "نرخ نوسازی، زمان پاسخ‌گویی و Adaptive Sync برای بازی مهم‌اند؛ طراحان باید دقت رنگ و پوشش فضای رنگی را اولویت دهند."],
    ["اتصالات و ارگونومی", "نسخه HDMI/DisplayPort، USB-C، تنظیم ارتفاع، چرخش و استاندارد VESA را بررسی کنید."],
  ];
  if (/موس|کیبورد|موس.?پد|هدفون/i.test(name)) return [
    ["نوع کاربری", "برای بازی، کار اداری یا تولید محتوا ویژگی‌های متفاوتی مهم است؛ سرعت، راحتی و دقت را متناسب با استفاده بسنجید."],
    ["اتصال", "سیمی کم‌تأخیر است و بی‌سیم آزادی بیشتری دارد؛ نوع دانگل، بلوتوث و عمر باتری را کنترل کنید."],
    ["ارگونومی", "ابعاد، وزن، فرم قرارگیری دست یا هدبند و کیفیت متریال در استفاده طولانی اهمیت زیادی دارد."],
    ["سازگاری", "نرم‌افزار اختصاصی، سیستم‌عامل، نورپردازی و درگاه موردنیاز را پیش از سفارش بررسی کنید."],
  ];
  if (/میز|صندلی/i.test(name)) return [
    ["ابعاد و فضا", "عرض، عمق و ارتفاع را با فضای اتاق، اندازه تجهیزات و وضعیت نشستن خود تطبیق دهید."],
    ["ارگونومی", "تنظیم ارتفاع، حمایت کمر و گردن، دسته‌ها و فاصله صحیح چشم تا نمایشگر برای استفاده طولانی ضروری است."],
    ["تحمل وزن", "ظرفیت تحمل وزن، استحکام اتصالات و جنس پایه و سطح را با تجهیزات یا وزن کاربر مقایسه کنید."],
    ["مونتاژ و خدمات", "شرایط ارسال، مونتاژ، قطعات یدکی، ضمانت و امکان نظافت متریال را بررسی کنید."],
  ];
  return [
    ["نیاز واقعی", "ابتدا نوع استفاده و ویژگی‌های ضروری را مشخص کنید تا بابت امکانات غیرضروری هزینه نکنید."],
    ["سازگاری", "ابعاد، اتصالات، سیستم‌عامل و هماهنگی محصول با تجهیزات فعلی خود را کنترل کنید."],
    ["کیفیت و ضمانت", "برند، کیفیت ساخت، شرایط ضمانت و خدمات پس از فروش را در کنار مشخصات فنی بسنجید."],
    ["ارزش خرید", "قیمت نهایی، موجودی، امتیاز کاربران و هزینه‌های جانبی را با محصولات هم‌رده مقایسه کنید."],
  ];
};

function CategoryBuyingGuide({ category, products }) {
  const [isGuideOpen, setIsGuideOpen] = useState(false);
  const [managedGuide, setManagedGuide] = useState(null);
  useEffect(() => setIsGuideOpen(false), [category?.id]);
  useEffect(() => {
    let active = true;
    if (!category?.id) return undefined;
    fetch(`${API_BASE}/catalog/buying-guides/?page_size=20&category=${encodeURIComponent(category.id)}`).then((response) => response.ok ? response.json() : []).then((data) => {
      if (!active) return;
      const rows = data.results || data || [];
      setManagedGuide(rows.find((item) => !item.product && item.show_in_category_accordion) || null);
    }).catch(() => active && setManagedGuide(null));
    return () => { active = false; };
  }, [category?.id]);
  if (!category) return null;
  const prices = products.map((product) => Number(product.finalPrice || 0)).filter(Boolean);
  const brands = new Set(products.map((product) => product.brand).filter(Boolean));
  const available = products.filter((product) => Number(product.stock) > 0).length;
  const managedFactors = Array.isArray(managedGuide?.criteria) ? managedGuide.criteria.map((item) => typeof item === "string" ? [item, "این معیار را با نیاز واقعی، مشخصات دستگاه و مدل‌های هم‌رده مقایسه کنید."] : [item.title, item.description]) : [];
  const factors = [
    ...(managedFactors.length ? managedFactors : categoryGuideFactors(category.name)),
    ["هزینه مالکیت", "قیمت خرید را همراه هزینه نصب، لوازم تکمیلی، مصرف انرژی، نگهداری و امکان ارتقا محاسبه کنید؛ انتخاب ارزان‌تر همیشه اقتصادی‌تر نیست."],
    ["اصالت و پشتیبانی", "شناسه و مدل دقیق، محتویات بسته، فروشنده، مدت و شرکت ضمانت، مهلت تست و دسترسی به خدمات پس از فروش را کنترل کنید."],
  ];
  const savedFaqs = Array.isArray(managedGuide?.faq_items) && managedGuide.faq_items.length ? managedGuide.faq_items : (Array.isArray(category.faqItems) ? category.faqItems.filter((item) => item?.question && item?.answer) : []);
  const checklist = Array.isArray(managedGuide?.checklist) && managedGuide.checklist.length ? managedGuide.checklist : ["مدل و مشخصات دقیق را با نیازم تطبیق دادم", "سازگاری با دستگاه یا فضای فعلی را بررسی کردم", "شرایط ضمانت و ارسال را خواندم", "قیمت و امتیاز مدل‌های مشابه را مقایسه کردم", "موجودی و اقلام داخل بسته را کنترل کردم"];
  const defaultFaqs = [
    { question: `برای خرید ${category.name} از کجا شروع کنم؟`, answer: "ابتدا نوع استفاده و بودجه را مشخص کنید، سپس با فیلترها مدل‌های سازگار را محدود کرده و مشخصات، امتیاز، ضمانت و قیمت نهایی را مقایسه کنید." },
    { question: `آیا گران‌ترین ${category.name} همیشه انتخاب بهتری است؟`, answer: "خیر. بهترین انتخاب مدلی است که امکانات آن با نیاز واقعی شما هماهنگ باشد. پرداخت بیشتر برای ویژگی‌هایی که استفاده نمی‌کنید ارزش خرید را کاهش می‌دهد." },
    { question: "چطور از سازگاری محصول مطمئن شوم؟", answer: "مدل دقیق دستگاه یا قطعات فعلی، ابعاد، نسل، رابط اتصال و محدودیت‌های سازنده را با بخش مشخصات محصول تطبیق دهید؛ در صورت تردید پیش از سفارش از پشتیبانی راهنمایی بگیرید." },
    { question: "هنگام مقایسه دو مدل به چه مواردی توجه کنم؟", answer: "علاوه بر قیمت، مشخصات کلیدی، موجودی، کیفیت ساخت، امتیاز خریداران، مدت ضمانت، روش ارسال، اقلام داخل بسته و هزینه لوازم جانبی را کنار هم قرار دهید." },
    { question: "شرایط ضمانت و بازگشت کالا چگونه بررسی می‌شود؟", answer: "مدت و شرکت ارائه‌دهنده ضمانت در صفحه محصول نمایش داده می‌شود. پیش از پرداخت، شرایط بازگشت و سلامت فیزیکی کالا را مطالعه و پس از تحویل بسته را مطابق همان شرایط بررسی کنید." },
    { question: "چطور هزینه واقعی خرید را محاسبه کنم؟", answer: "قیمت نهایی، هزینه ارسال، نصب، کابل یا مبدل لازم، مصرف انرژی، نگهداری و ارتقای احتمالی را با هم جمع کنید و سپس مدل‌ها را مقایسه کنید." },
    { question: "اگر مشخصات یک محصول کامل نبود چه کار کنم؟", answer: "تا زمان دریافت مدل دقیق، نسخه، ابعاد، رابط‌ها و شرایط ضمانت سفارش را نهایی نکنید؛ اطلاعات را از پشتیبانی یا مرجع رسمی سازنده استعلام بگیرید." },
    { question: "آیا امتیاز کاربران برای تصمیم‌گیری کافی است؟", answer: "امتیاز مفید است اما کافی نیست. تعداد بررسی‌ها، تجربه استفاده طولانی، نقاط ضعف تکرارشونده و تفاوت نیاز کاربران را همراه مشخصات فنی بسنجید." },
  ];
  const faqs = [...savedFaqs, ...defaultFaqs.filter((fallback) => !savedFaqs.some((item) => item.question === fallback.question))];
  return (
    <section className={`category-buying-guide${isGuideOpen ? " is-open" : ""}`} aria-labelledby="category-guide-title">
      <div className="category-guide-collapsed-head">
        <div>
          <span className="category-guide-eyebrow"><i aria-hidden="true">✦</i> راهنمای تخصصی انتخاب</span>
          <h2 id="category-guide-title">راهنمای کامل خرید {category.name}</h2>
          <p>{isGuideOpen ? "برای بستن راهنما روی دکمه زیر بزنید." : "برای مشاهده معیارهای انتخاب، چک‌لیست و پاسخ پرسش‌های مهم، راهنما را باز کنید."}</p>
        </div>
        <button
          type="button"
          className="category-guide-toggle"
          aria-expanded={isGuideOpen}
          aria-controls="category-guide-panel"
          onClick={() => setIsGuideOpen((open) => !open)}
        >
          <span>{isGuideOpen ? "بستن راهنمای خرید" : "باز کردن راهنمای خرید"}</span>
          <i aria-hidden="true"><b /></i>
        </button>
      </div>

      <div id="category-guide-panel" className="category-guide-panel" aria-hidden={!isGuideOpen}>
        <div className="category-guide-panel-inner">
      <div className="category-guide-hero">
        <div className="category-guide-heading">
          <span className="category-guide-eyebrow"><i aria-hidden="true">✦</i> راهنمای تخصصی انتخاب</span>
          <h2 id="category-guide-title">راهنمای کامل خرید {category.name}</h2>
          <p>{category.introText || `برای انتخاب مطمئن ${category.name}، مشخصات، سازگاری، قیمت و شرایط خدمات را مرحله‌به‌مرحله بررسی کنید.`}</p>
        </div>
        <div className="category-guide-stats" aria-label="خلاصه وضعیت دسته‌بندی">
          <div><strong>{fmt(products.length)}</strong><span>محصول برای مقایسه</span></div>
          <div><strong>{fmt(brands.size)}</strong><span>برند موجود</span></div>
          <div><strong>{fmt(available)}</strong><span>کالای آماده سفارش</span></div>
          <div><strong>{prices.length ? `${fmt(Math.min(...prices))} تومان` : "—"}</strong><span>شروع بازه قیمت</span></div>
        </div>
      </div>

      <div className="category-guide-body">
        <div className="category-guide-main">
          <div className="category-guide-section-head"><span>۰۱</span><div><h3>مهم‌ترین معیارهای انتخاب</h3><p>این چهار مورد را قبل از مقایسه مدل‌ها مشخص کنید.</p></div></div>
          <div className="category-guide-factors">
            {factors.map(([title, text], index) => <article key={title}><i>{fmt(index + 1)}</i><div><h4>{title}</h4><p>{text}</p></div></article>)}
          </div>

          <div className="category-guide-section-head"><span>۰۲</span><div><h3>مسیر پیشنهادی تا انتخاب نهایی</h3><p>با این ترتیب احتمال انتخاب اشتباه کمتر می‌شود.</p></div></div>
          <ol className="category-guide-steps">
            <li><b>نیاز و بودجه را مشخص کنید</b><span>کاربری اصلی، امکانات ضروری و سقف هزینه واقعی خود را بنویسید.</span></li>
            <li><b>سازگاری را کنترل کنید</b><span>ابعاد، رابط‌ها، نسل قطعات و تجهیزات فعلی را با مشخصات محصول تطبیق دهید.</span></li>
            <li><b>مدل‌های هم‌رده را مقایسه کنید</b><span>فیلترها را اعمال کرده و قیمت، امتیاز، موجودی و مشخصات کلیدی را کنار هم ببینید.</span></li>
            <li><b>خدمات و هزینه نهایی را ببینید</b><span>ضمانت، روش ارسال، لوازم جانبی لازم و امکان مرجوعی را پیش از پرداخت بررسی کنید.</span></li>
          </ol>
        </div>

        <aside className="category-guide-aside">
          <div className="category-guide-checklist">
            <span className="category-guide-mini-title">چک‌لیست قبل از خرید</span>
            {checklist.map((item) => <label key={item}><input type="checkbox" /> <span>{item}</span></label>)}
          </div>
          <div className="category-guide-pro-tip"><b>نکته حرفه‌ای</b><p>{managedGuide?.content || category.buyingGuide || "محصول ارزان‌تر همیشه انتخاب اقتصادی‌تری نیست؛ طول عمر، قابلیت ارتقا، ضمانت و هزینه لوازم جانبی را در ارزش خرید نهایی حساب کنید."}</p></div>
          <a className="category-guide-action" href="#shop-products-grid">مشاهده و مقایسه محصولات <span aria-hidden="true">←</span></a>
        </aside>
      </div>

      {faqs.length > 0 && <div className="category-guide-faq"><div className="category-guide-section-head"><span>۰۳</span><div><h3>پرسش‌های پرتکرار</h3><p>پاسخ سریع به سؤال‌های مهم قبل از سفارش.</p></div></div><div className="category-guide-faq-list">{faqs.map((item, index) => <details key={`${item.question}-${index}`}><summary><span>{item.question}</span><i aria-hidden="true">+</i></summary><p>{item.answer}</p></details>)}</div></div>}
        </div>
      </div>
    </section>
  );
}

function Shop({ param, navigationKey = 0 }) {
  const { catalogVersion, catalogLoading, nav } = useStore();
  const savedFilters = useMemo(readShopFilters, []);
  const initialBrand = new URLSearchParams(location.search).get("brand") || "";
  const [cats, setCats] = useState(
    param && param !== "off" ? [param] : savedFilters.cats || [],
  );
  const [brands, setBrands] = useState(
    initialBrand ? [initialBrand] : savedFilters.brands || [],
  );
  const [availableBrands, setAvailableBrands] = useState([]);
  const [minPrice, setMinPrice] = useState(Number(savedFilters.minPrice) || 0);
  const [maxPrice, setMaxPrice] = useState(
    Number(savedFilters.maxPrice) || Number.MAX_SAFE_INTEGER,
  );
  const [minRating, setMinRating] = useState(Number(savedFilters.minRating) || 0);
  const [onlyOff, setOnlyOff] = useState(param === "off" || Boolean(savedFilters.onlyOff));
  const [inStock, setInStock] = useState(Boolean(savedFilters.inStock));
  const [sort, setSort] = useState(savedFilters.sort || "pop");
  const [limit, setLimit] = useState(8);
  const [usageProfiles, setUsageProfiles] = useState([]);
  const [selectedUsage, setSelectedUsage] = useState(
    usageFromLocation() || savedFilters.selectedUsage || "",
  );
  const searchQuery = new URLSearchParams(location.search).get("q")?.trim().toLocaleLowerCase("fa") || "";

  useEffect(() => {
    if (param && param !== "off") {
      // A category chosen from the main navigation is a fresh catalog view.
      // Filters belonging to the previous category must not hide its products.
      setCats([param]);
      setBrands([]);
      setMinPrice(0);
      setMaxPrice(Number.MAX_SAFE_INTEGER);
      setMinRating(0);
      setOnlyOff(false);
      setInStock(false);
      setSelectedUsage("");
      setUsageProfiles([]);
      setUsageInLocation("");
    } else if (param === "off") {
      setCats([]);
      setBrands([]);
      setMinPrice(0);
      setMaxPrice(Number.MAX_SAFE_INTEGER);
      setMinRating(0);
      setOnlyOff(true);
      setInStock(false);
      setSelectedUsage("");
    } else if (navigationKey) {
      // Clicking the explicit "Shop" navigation item means opening the whole
      // regular catalog. Keep saved filters on a browser refresh, but never
      // carry a previously selected category into this fresh navigation.
      setCats([]);
      setBrands([]);
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
    if (initialBrand) setBrands([initialBrand]);
    setLimit(8);
  }, [param, navigationKey]);

  useEffect(() => {
    localStorage.setItem(
      SHOP_FILTERS_KEY,
      JSON.stringify({ cats, brands, minPrice, maxPrice, minRating, onlyOff, inStock, sort, selectedUsage }),
    );
  }, [cats, brands, minPrice, maxPrice, minRating, onlyOff, inStock, sort, selectedUsage]);

  useEffect(() => {
    if (cats.length !== 1) {
      setUsageProfiles([]);
      setSelectedUsage("");
      setUsageInLocation("");
      return;
    }
    const requestedUsage = usageFromLocation() || selectedUsage;
    setSelectedUsage(requestedUsage);
    const category = CATEGORIES.find((item) => item.id === cats[0]);
    const defaults = defaultUsageProfiles(category, "NORMAL");
    setUsageProfiles(defaults);
    if (!category?.apiId) return;
    fetchAllPages(`${API_BASE}/catalog/usage-profiles/?page_size=100&catalog=NORMAL&category=${category.apiId}`)
      .then((rows) => {
        const active = rows.filter((item) => item.is_active);
        setUsageProfiles(active.length ? active : defaults);
      })
      .catch(() => setUsageProfiles(defaults));
  }, [cats.join("|"), catalogVersion]);

  const categoryProducts = useMemo(
    () =>
      ProductSelectors.regular(PRODUCTS).filter(
        (p) => !cats.length || cats.includes(p.cat),
      ),
    [cats, catalogVersion],
  );
  useEffect(() => {
    let active = true;
    const categoryQuery = cats.length
      ? `&categories=${encodeURIComponent(cats.join(","))}`
      : "";
    fetchAllPages(`${API_BASE}/catalog/brands/?page_size=100${categoryQuery}`)
      .then((rows) => {
        if (active)
          setAvailableBrands(
            rows.filter((brand) => brand.is_active).map((brand) => brand.name),
          );
      })
      .catch(() => {
        if (active)
          setAvailableBrands([
            ...new Set(
              categoryProducts.map((product) => product.brand).filter(Boolean),
            ),
          ]);
      });
    return () => {
      active = false;
    };
  }, [cats.join("|"), categoryProducts.length, catalogVersion]);
  const priceCeiling = Math.max(
    1000000,
    ...categoryProducts.map((p) => p.finalPrice),
  );
  // Keep the absence of a user-selected maximum as an open-ended value. If we
  // clamp it while the catalog is still empty, the temporary 1M ceiling hides
  // every laptop as soon as the real products arrive.
  const effectiveMaxPrice =
    maxPrice === Number.MAX_SAFE_INTEGER
      ? priceCeiling
      : Math.min(maxPrice, priceCeiling);
  useEffect(() => {
    setBrands((current) =>
      current.filter((brand) => availableBrands.includes(brand)),
    );
    setMinPrice((current) => Math.min(current, priceCeiling));
  }, [availableBrands.join("|"), priceCeiling]);

  const toggleCategory = (categoryId) => {
    setSelectedUsage("");
    setUsageInLocation("");
    setBrands([]);
    setAvailableBrands([]);
    setMinPrice(0);
    setMaxPrice(Number.MAX_SAFE_INTEGER);
    setLimit(8);
    setCats((current) =>
      current.includes(categoryId)
        ? current.filter((item) => item !== categoryId)
        : [...current, categoryId],
    );
  };

  const list = useMemo(() => {
    let r = ProductSelectors.regular(PRODUCTS).filter(
      (p) =>
        (!cats.length || cats.includes(p.cat)) &&
        productMatchesUsage(p, usageProfiles.find((profile) => profile.id === selectedUsage), usageProfiles, categoryProducts) &&
        ProductSelectors.matchesSearch(p, searchQuery) &&
        (brands.length === 0 || brands.includes(p.brand)) &&
        p.finalPrice >= minPrice &&
        p.finalPrice <= effectiveMaxPrice &&
        p.rate >= minRating &&
        (!onlyOff || p.off > 0) &&
        (!inStock || p.stock > 0),
    );
    if (sort === "cheap")
      r = [...r].sort((a, b) => a.finalPrice - b.finalPrice);
    if (sort === "exp") r = [...r].sort((a, b) => b.finalPrice - a.finalPrice);
    if (sort === "rate") r = [...r].sort((a, b) => b.rate - a.rate);
    if (sort === "pop") r = [...r].sort((a, b) => b.sold - a.sold);
    if (sort === "least") r = [...r].sort((a, b) => a.sold - b.sold);
    if (sort === "new") r = [...r].reverse();
    return r;
  }, [
    cats,
    brands,
    minPrice,
    effectiveMaxPrice,
    minRating,
    onlyOff,
    inStock,
    sort,
    searchQuery,
    selectedUsage,
    usageProfiles,
    catalogVersion,
  ]);
  const selectedCategoryTitle = cats.length
    ? CATEGORIES.filter((category) => cats.includes(category.id))
        .map((category) => category.name)
        .join(" و ")
    : "محصولات فروشگاه";
  const selectedSeoCategory = cats.length === 1
    ? CATEGORIES.find((category) => category.id === cats[0])
    : null;
  const offerPalette = shopOfferPalette(cats[0] || list[0]?.cat || "default");
  const featuredList = ProductSelectors.featured(list);
  const discountedOffers = list
    .filter((product) => Number(product.stock) > 0 && Number(product.off) > 0)
    .sort((a, b) => b.off - a.off || b.sold - a.sold);
  const categoryFallbackOffers = list
    .filter((product) => Number(product.stock) > 0)
    .sort((a, b) => b.sold - a.sold || b.rate - a.rate);
  const offerProducts = (
    featuredList.length
      ? featuredList
      : discountedOffers.length
        ? discountedOffers
        : categoryFallbackOffers
  ).slice(0, 12);

  const sentinel = useRef();
  useEffect(() => {
    // Intersection Observer - infinite scroll
    const io = new IntersectionObserver(
      (es) => {
        if (es[0].isIntersecting) setLimit((l) => Math.min(l + 4, list.length));
      },
      { rootMargin: "200px" },
    );
    if (sentinel.current) io.observe(sentinel.current);
    return () => io.disconnect();
  }, [list.length]);

  return (
    <div className="container" style={{ paddingTop: 24 }}>
      <h1 className="section-title">فروشگاه</h1>
      <p className="section-sub">
        {searchQuery ? `نتایج جستجوی «${searchQuery}» · ` : ""}{fmt(list.length)} محصول یافت شد
      </p>
      <CategoryBuyingGuide category={selectedSeoCategory} products={categoryProducts} />
      <UsageProfilePicker profiles={usageProfiles} value={selectedUsage} onChange={setSelectedUsage} />
      {offerProducts.length > 0 && (
        <div className="shop-top-slider">
          <AmazingOffers
            section={{
              title: `پیشنهادهای ${selectedCategoryTitle}`,
              subtitle: "منتخب براساس فیلترهای شما",
              slider_interval_seconds: 6,
            }}
            products={offerProducts}
            nav={nav}
            showCountdown={false}
            className="shop-amazing-offers"
            themeStyle={{
              "--amazing-gradient": `linear-gradient(125deg, ${offerPalette.from}, ${offerPalette.to})`,
              "--amazing-accent": offerPalette.accent,
            }}
            onViewAll={() =>
              document
                .querySelector(".shop-layout")
                ?.scrollIntoView({ behavior: "smooth", block: "start" })
            }
          />
        </div>
      )}
      <div className="shop-layout" id="shop-products-grid">
        <aside className="filters glass">
          <h4 style={{ marginBottom: 8 }}>فیلترها</h4>
          <FilterAccordion title="دسته‌بندی">
            <label className="fopt">
              <input
                type="checkbox"
                checked={!cats.length}
                onChange={() => {
                  setCats([]);
                  setBrands([]);
                  setAvailableBrands([]);
                  setMinPrice(0);
                  setMaxPrice(Number.MAX_SAFE_INTEGER);
                  setMinRating(0);
                  setOnlyOff(false);
                  setInStock(false);
                  setSelectedUsage("");
                  setUsageInLocation("");
                  setLimit(8);
                }}
              />{" "}
              همه
            </label>
            {CATEGORIES.map((c) => (
              <label className="fopt" key={c.id}>
                <input
                  type="checkbox"
                  checked={cats.includes(c.id)}
                  onChange={() => toggleCategory(c.id)}
                />{" "}
                {c.name}
              </label>
            ))}
          </FilterAccordion>
          <FilterAccordion title="محدوده قیمت">
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 7,
                marginBottom: 9,
              }}
            >
              <input
                className="site-input filter-number"
                type="number"
                min="0"
                max={effectiveMaxPrice}
                value={minPrice}
                onChange={(e) =>
                  setMinPrice(Math.min(Number(e.target.value || 0), effectiveMaxPrice))
                }
                placeholder="از قیمت"
              />
              <input
                className="site-input filter-number"
                type="number"
                min={minPrice}
                max={priceCeiling}
                value={effectiveMaxPrice}
                onChange={(e) =>
                  setMaxPrice(
                    Math.max(
                      minPrice,
                      Math.min(Number(e.target.value || 0), priceCeiling),
                    ),
                  )
                }
                placeholder="تا قیمت"
              />
            </div>
            <input
              className="range"
              type="range"
              min="0"
              max={priceCeiling}
              step={Math.max(10000, Math.round(priceCeiling / 100))}
              value={minPrice}
              onChange={(e) => setMinPrice(Math.min(+e.target.value, effectiveMaxPrice))}
            />
            <input
              className="range"
              type="range"
              min="0"
              max={priceCeiling}
              step={Math.max(10000, Math.round(priceCeiling / 100))}
              value={effectiveMaxPrice}
              onChange={(e) => setMaxPrice(Math.max(+e.target.value, minPrice))}
            />
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                fontSize: 10,
                color: "var(--muted)",
                marginTop: 5,
              }}
            >
              <span>از {fmt(minPrice)}</span>
              <span>تا {fmt(effectiveMaxPrice)} تومان</span>
            </div>
            <button
              className="btn btn-ghost"
              style={{ width: "100%", marginTop: 8 }}
              onClick={() => {
                setMinPrice(0);
                setMaxPrice(Number.MAX_SAFE_INTEGER);
              }}
            >
              پاک‌کردن محدوده قیمت
            </button>
          </FilterAccordion>
          <FilterAccordion title="حداقل امتیاز کاربران">
            {[
              [0, "همه"],
              [3, "۳ ستاره و بیشتر"],
              [4, "۴ ستاره و بیشتر"],
            ].map(([value, label]) => (
              <label className="fopt" key={value}>
                <input
                  type="radio"
                  checked={minRating === value}
                  onChange={() => setMinRating(value)}
                />{" "}
                {label}
              </label>
            ))}
          </FilterAccordion>
          <FilterAccordion title="برند">
            <div className="filter-options-scroll">
              {availableBrands.map((b) => (
                <label className="fopt" key={b}>
                  <input
                    type="checkbox"
                    checked={brands.includes(b)}
                    onChange={() =>
                      setBrands((x) =>
                        x.includes(b) ? x.filter((y) => y !== b) : [...x, b],
                      )
                    }
                  />{" "}
                  {b}
                </label>
              ))}
            </div>
            {!availableBrands.length && (
              <small style={{ color: "var(--muted)" }}>
                برای این دسته برندی ثبت نشده است.
              </small>
            )}
          </FilterAccordion>
          <FilterAccordion title="وضعیت محصول" className="filter-accordion-last">
            <label className="fopt">
              <input
                type="checkbox"
                checked={onlyOff}
                onChange={(e) => setOnlyOff(e.target.checked)}
              />{" "}
              فقط تخفیف‌دار
            </label>
            <label className="fopt">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
              />{" "}
              فقط موجود
            </label>
          </FilterAccordion>
        </aside>
        <div>
          <div className="glass shop-sort-bar">
            <b className="shop-sort-title">مرتب‌سازی:</b>
            <div className="shop-sort-options">
            {[
              ["pop", "پرفروش‌ترین"],
              ["least", "کم‌فروش‌ترین"],
              ["new", "جدیدترین"],
              ["cheap", "ارزان‌ترین"],
              ["exp", "گران‌ترین"],
              ["rate", "بیشترین امتیاز"],
            ].map(([k, v]) => (
              <button
                key={k}
                className={"tab" + (sort === k ? " on" : "")}
                onClick={() => setSort(k)}
              >
                {v}
              </button>
            ))}
            </div>
          </div>
          <div className="prod-grid">
            {list.slice(0, limit).map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
          {catalogLoading && list.length === 0 && (
            <div className="glass" style={{ padding: 40, textAlign: "center" }}>
              در حال دریافت محصولات فروشگاه...
            </div>
          )}
          {!catalogLoading && list.length === 0 && (
            <div className="glass" style={{ padding: 40, textAlign: "center" }}>
              محصولی با این فیلترها یافت نشد 😔
            </div>
          )}
          <div ref={sentinel} style={{ height: 1 }}></div>
        </div>
      </div>
    </div>
  );
}
