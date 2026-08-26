const GUIDE_PROFILES = {
  laptop: ["کاربری و نرم‌افزارهای اصلی", "نسل و توان پردازنده", "ظرفیت و امکان ارتقای RAM", "نوع و ظرفیت SSD", "کیفیت و روشنایی نمایشگر", "وزن، باتری، درگاه و خنک‌کنندگی"],
  cpu: ["سوکت و چیپست سازگار", "نسل و معماری", "تعداد هسته و رشته", "توان مصرفی", "گرافیک داخلی", "کارایی واقعی در نرم‌افزار هدف"],
  gpu: ["وضوح و نرخ فریم هدف", "توان پردازشی واقعی", "حافظه گرافیکی", "توان و کانکتور پاور", "ابعاد و فضای کیس", "دما، نویز و ضمانت"],
  ram: ["نسل DDR4 یا DDR5", "ظرفیت کل", "فرکانس و تایمینگ", "تعداد ماژول و Dual Channel", "سازگاری با مادربرد", "ارتفاع و XMP/EXPO"],
  ssd: ["رابط SATA یا NVMe", "نسل PCIe و فرم‌فکتور", "ظرفیت قابل استفاده", "سرعت پایدار و DRAM", "دوام TBW و نوع NAND", "دمای کاری و ضمانت"],
  monitor: ["اندازه و وضوح", "نوع پنل", "نرخ نوسازی و پاسخ‌گویی", "دقت و پوشش رنگ", "روشنایی و HDR", "اتصالات، پایه و VESA"],
  mouse: ["اندازه و فرم دست", "حسگر و دقت", "وزن و تعادل", "نوع اتصال و تأخیر", "کیفیت کلیدها", "باتری و نرم‌افزار"],
  keyboard: ["ابعاد و چیدمان", "نوع سوییچ", "کیفیت کلید و بدنه", "اتصال و تأخیر", "زبان و چاپ کلیدها", "نورپردازی و نرم‌افزار"],
  headphone: ["راحتی و وزن", "کیفیت و تفکیک صدا", "کیفیت میکروفون", "اتصال و تأخیر", "باتری", "تهویه و ضمانت"],
  speaker: ["توان واقعی و اندازه فضا", "چیدمان کانال‌ها", "پاسخ فرکانسی", "اتصالات", "ابعاد و محل نصب", "برق، باتری و کنترل‌ها"],
  case: ["فرم‌فکتور مادربرد", "فضای کارت و کولر", "گردش هوا", "فن و رادیاتور", "مدیریت کابل", "فیلتر و کیفیت بدنه"],
  motherboard: ["سوکت و چیپست", "مدار تغذیه", "RAM و محدودیت آن", "M.2 و PCIe", "شبکه و صدا", "BIOS و اتصالات"],
  power: ["توان واقعی و حاشیه امن", "راندمان 80 Plus", "کیفیت پلتفرم", "حفاظت‌های الکتریکی", "کانکتورها", "ضمانت و طول کابل"],
  hdd: ["ظرفیت", "سرعت چرخش", "حافظه کش", "نوع کاربری", "نویز و لرزش", "ضمانت و نرخ خرابی"],
  "laptop-hdd": ["ضخامت ۷ یا ۹.۵ میلی‌متر", "رابط SATA", "ظرفیت", "مصرف انرژی", "لرزش و صدا", "سازگاری با محفظه"],
  "laptop-battery": ["پارت‌نامبر", "ولتاژ", "ظرفیت Wh و mAh", "تعداد سلول", "اصالت و تاریخ تولید", "ضمانت تعویض"],
  "laptop-board": ["کد فنی برد", "نسخه Revision", "قطعات لحیم‌شده", "سوکت و کانکتورها", "وضعیت تعمیر", "مهلت تست و ضمانت"],
  "cooling-pad": ["ابعاد لپ‌تاپ", "محل و تعداد فن", "جریان هوا", "میزان نویز", "تنظیم ارتفاع", "جنس و نوع تغذیه"],
  desk: ["عرض و عمق", "ارتفاع و تنظیم", "تحمل وزن", "استحکام فریم", "مدیریت کابل", "مونتاژ و خدمات"],
  chair: ["تناسب با قد و وزن", "حمایت کمر و گردن", "تنظیم دسته و ارتفاع", "ابعاد نشیمن", "روکش، پایه و جک", "تحمل وزن و ضمانت"],
  "mouse-pad": ["سطح Control یا Speed", "ابعاد", "ضخامت", "کف ضدلغزش", "لبه دوردوزی", "شست‌وشو یا RGB"],
  accessories: ["سازگاری درگاه", "توان ورودی و خروجی", "سرعت انتقال", "کیفیت کابل و کانکتور", "حفاظت الکتریکی", "اصالت و ضمانت"],
};

const GUIDE_MISTAKES = {
  laptop: ["انتخاب فقط براساس نام پردازنده", "نادیده‌گرفتن رم لحیم‌شده", "خرید مدل سنگین برای حمل روزانه"],
  cpu: ["مقایسه فقط با فرکانس", "خرید سوکت ناسازگار", "محاسبه‌نکردن خنک‌کننده و پاور"],
  gpu: ["انتخاب فقط با مقدار VRAM", "نادیده‌گرفتن پاور", "بررسی‌نکردن فضای کیس"],
  ram: ["ترکیب ماژول‌های نامشابه", "خرید نسل ناسازگار", "بی‌توجهی به محدودیت مادربرد"],
  ssd: ["توجه صرف به سرعت تبلیغاتی", "پرکردن کامل SSD", "اشتباه‌گرفتن M.2 SATA و NVMe"],
  power: ["خرید پاور بی‌نام", "انتخاب وات بدون محاسبه مصرف", "استفاده از تبدیل غیراستاندارد"],
  accessories: ["خرید مبدل در جهت اشتباه", "شارژر با پروتکل ناسازگار", "کابل ارزان بدون استاندارد"],
};

const profileFor = (category) => ({
  keys: GUIDE_PROFILES[category?.id] || ["نیاز واقعی", "سازگاری", "کیفیت ساخت", "مشخصات فنی", "ضمانت", "ارزش خرید"],
  mistakes: GUIDE_MISTAKES[category?.id] || ["خرید بدون مقایسه", "نادیده‌گرفتن سازگاری", "انتخاب صرفاً براساس قیمت"],
});

function ProductGuidePanel({ product, category, customGuide = null, selectedCriteria = [], userNeed = "" }) {
  if (!product) return <div className="guide-empty">برای دیدن راهنمای دقیق، یکی از محصولات این دسته را انتخاب کنید.</div>;
  const baseProfile = profileFor(category);
  const profile = { ...baseProfile, keys: customGuide?.criteria?.length ? customGuide.criteria : baseProfile.keys };
  const specifications = Object.entries(product.specs || {}).filter(([, value]) => value).slice(0, 8);
  const ProductIcon = I[category.icon] || I.gift;
  const strengths = [
    product.stock > 0 && `موجودی قابل سفارش (${fmt(product.stock)} عدد)`,
    product.rate >= 4 && `امتیاز مناسب کاربران (${fmt(product.rate)} از ۵)`,
    product.off > 0 && `${fmt(product.off)}٪ تخفیف فعال`,
    product.warranty && `ضمانت ${product.warranty}`,
    specifications.length >= 5 && "مشخصات فنی نسبتاً کامل برای تصمیم‌گیری",
  ].filter(Boolean);
  const cautions = [
    product.stock <= 0 && "در حال حاضر موجود نیست",
    !product.warranty && "اطلاعات ضمانت نیاز به استعلام دارد",
    specifications.length < 4 && "مشخصات ثبت‌شده برای تصمیم قطعی کافی نیست",
    !product.rate && "هنوز امتیاز قابل اتکایی ثبت نشده است",
  ].filter(Boolean);
  const criteriaText = selectedCriteria.length ? selectedCriteria.join("، ") : "سازگاری، کیفیت، ضمانت و ارزش خرید";
  return <article className="guide-product-panel" role="tabpanel">
    <div className="guide-product-intro"><div className="guide-product-image">{product.image ? <img src={product.image} alt={product.name} /> : <ProductIcon className="icon" />}</div><div><span>{customGuide?.title || "راهنمای بررسی همین محصول"}</span><h3>{product.name}</h3><p>{customGuide?.summary || product.shortDescription || product.description || `این ${category.name} را با نیاز واقعی و محصولات هم‌رده مقایسه کنید.`}</p></div></div>
    {customGuide?.content && <div className="guide-custom-content">{customGuide.content}</div>}
    <div className="guide-product-columns">
      <section><h4>قبل از انتخاب این مدل</h4><ul>{profile.keys.map((item) => { const title = typeof item === "string" ? item : item.title; return <li key={title}><b>{title}</b><span>{typeof item === "string" ? "مقدار ثبت‌شده را با نیاز و تجهیزات فعلی خود تطبیق دهید." : item.description}</span></li>; })}</ul></section>
      <section><h4>مشخصات ثبت‌شده محصول</h4>{specifications.length ? <dl>{specifications.map(([key, value]) => <div key={key}><dt>{key}</dt><dd>{String(value)}</dd></div>)}</dl> : <p>مشخصات تکمیلی ثبت نشده است؛ پیش از سفارش از پشتیبانی استعلام بگیرید.</p>}</section>
    </div>
    <div className="guide-smart-verdict"><div className="guide-verdict-head"><span>✦</span><div><b>جمع‌بندی هوشمند براساس مشخصات همین محصول</b><p>{userNeed ? `نیاز نوشته‌شده شما: «${userNeed}»` : "نیاز خود را در بخش روش انتخاب بنویسید تا هنگام بررسی در نظر گرفته شود."}</p></div></div><p className="guide-verdict-summary">{product.name} با قیمت {product.finalPrice ? `${fmt(product.finalPrice)} تومان` : "نیازمند استعلام"}، {product.stock > 0 ? "موجودی قابل سفارش" : "وضعیت ناموجود"} و امتیاز {product.rate ? `${fmt(product.rate)} از ۵` : "ثبت‌نشده"} برای کاربری شما باید براساس معیارهای {criteriaText} سنجیده شود. {specifications.length ? `از میان اطلاعات ثبت‌شده، ${specifications.slice(0,3).map(([key,value]) => `${key}: ${value}`).join("؛ ")} مهم‌ترین داده‌های فعلی هستند.` : "پیش از خرید، مشخصات دقیق را از پشتیبانی دریافت کنید."}</p><div className="guide-verdict-columns"><section><h4>نقاط مثبت قابل مشاهده</h4><ul>{(strengths.length ? strengths : ["پس از تکمیل مشخصات قابل ارزیابی است"]).map((item) => <li key={item}>{item}</li>)}</ul></section><section className="caution"><h4>موارد نیازمند توجه</h4><ul>{(cautions.length ? cautions : ["سازگاری نهایی با تجهیزات شما باید کنترل شود", "قیمت و اقلام بسته را پیش از پرداخت دوباره بررسی کنید"]).map((item) => <li key={item}>{item}</li>)}</ul></section></div><div className="guide-product-verdict"><div><b>نتیجه پیشنهادی</b><p>{product.stock > 0 && specifications.length >= 4 ? "این محصول ارزش قرارگرفتن در فهرست نهایی مقایسه را دارد؛ تصمیم قطعی را بعد از تطبیق معیارهای انتخابی و سازگاری بگیرید." : "برای تصمیم قطعی هنوز اطلاعات یا موجودی کافی نیست؛ ابتدا موارد هشدار را برطرف کنید."}</p></div><a href={routePath("product", product.slug || product.id)}>صفحه محصول و خرید <span>←</span></a></div></div>
  </article>;
}

function BuyingGuidesPage({ slug = null }) {
  const { catalogVersion, siteSettings } = useStore();
  const [customGuides, setCustomGuides] = useState([]);
  const selectedCategory = CATEGORIES.find((item) => item.id === slug) || CATEGORIES[0];
  const [query, setQuery] = useState("");
  const [userNeed, setUserNeed] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedCriteria, setSelectedCriteria] = useState([]);
  const [productSearch, setProductSearch] = useState("");
  const [guideProductSearch, setGuideProductSearch] = useState("");
  const [compareIds, setCompareIds] = useState([]);
  const products = PRODUCTS.filter((item) => item.cat === selectedCategory?.id);
  const [selectedProductId, setSelectedProductId] = useState(null);
  useEffect(() => setSelectedProductId(products[0]?.id || null), [selectedCategory?.id, catalogVersion]);
  useEffect(() => { setCompareIds([]); setProductSearch(""); setGuideProductSearch(""); setSelectedCriteria([]); }, [selectedCategory?.id]);
  useEffect(() => {
    document.documentElement.scrollLeft = 0;
    document.body.scrollLeft = 0;
  }, [selectedCategory?.id]);
  useEffect(() => {
    let active = true;
    fetch(`${API_BASE}/catalog/buying-guides/?page_size=200&is_published=true`).then((response) => response.ok ? response.json() : []).then((data) => { if (active) setCustomGuides(data.results || data || []); }).catch(() => {});
    return () => { active = false; };
  }, [catalogVersion]);
  const normalized = ProductSelectors.normalizeSearchText(query);
  const categories = CATEGORIES.filter((item) => !normalized || ProductSelectors.normalizeSearchText(`${item.name} ${(item.subs || []).join(" ")}`).includes(normalized));
  const selectedProduct = products.find((item) => String(item.id) === String(selectedProductId)) || products[0];
  const categoryGuide = customGuides.find((item) => item.category_slug === selectedCategory?.id && !item.product);
  const defaultProfile = profileFor(selectedCategory);
  const profile = {
    keys: categoryGuide?.criteria?.length ? categoryGuide.criteria : defaultProfile.keys,
    mistakes: categoryGuide?.common_mistakes?.length ? categoryGuide.common_mistakes : defaultProfile.mistakes,
  };
  const productGuide = customGuides.find((item) => String(item.product) === String(selectedProduct?.apiId || selectedProduct?.id));
  const CategoryIcon = I[selectedCategory?.icon] || I.gift;
  const comparisonProducts = compareIds.map((id) => products.find((item) => String(item.id) === String(id))).filter(Boolean);
  const comparisonSpecKeys = [...new Set([
    ...selectedCriteria,
    ...comparisonProducts.flatMap((product) => Object.keys(product.specs || {})),
  ])].slice(0, 12);
  const searchedProducts = productSearch.trim() ? ProductSelectors.search(products, productSearch, 20) : products.slice(0, 12);
  const guideProducts = guideProductSearch.trim() ? ProductSelectors.search(products, guideProductSearch, 50) : products;
  const recommendedProducts = [...products].filter((item) => !budget || Number(item.finalPrice) <= Number(budget)).sort((a, b) => {
    const score = (item) => Number(item.stock > 0) * 30 + Number(item.rate || 0) * 5 + Math.min(Number(item.sold || 0) / 50, 10) + selectedCriteria.reduce((sum, criterion) => {
      const text = ProductSelectors.normalizeSearchText(`${item.name} ${item.brand || ""} ${item.shortDescription || ""} ${Object.keys(item.specs || {}).join(" ")} ${Object.values(item.specs || {}).join(" ")}`);
      return sum + (text.includes(ProductSelectors.normalizeSearchText(criterion)) ? 8 : 2);
    }, 0);
    return score(b) - score(a);
  }).slice(0, 6);
  const priceValues = products.map((item) => Number(item.finalPrice)).filter(Boolean).sort((a, b) => a - b);
  const priceAt = (ratio) => priceValues[Math.min(priceValues.length - 1, Math.floor(priceValues.length * ratio))] || 0;
  const scrollToGuide = (id) => {
    const target = document.getElementById(id);
    if (!target) return;
    const reduceMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches;
    const top = target.getBoundingClientRect().top + window.scrollY - 96;
    window.scrollTo({ top: Math.max(0, top), left: 0, behavior: reduceMotion ? "auto" : "smooth" });
  };
  const toggleCriterion = (title) => setSelectedCriteria((items) => items.includes(title) ? items.filter((item) => item !== title) : [...items, title]);
  const toggleCompare = (id) => setCompareIds((items) => items.includes(id) ? items.filter((item) => item !== id) : [...items, id]);

  return <main className="container buying-guides-hub">
    <header className="guides-hub-hero glass"><div className="guides-hub-icon"><I.search className="icon" /></div><div><span>{siteSettings.guides_eyebrow || "مرکز دانش فروشگاه ۸۲"}</span><h1>{siteSettings.guides_title || "راهنمای جامع و تخصصی خرید"}</h1><p>{siteSettings.guides_description || "از انتخاب دسته‌بندی تا مقایسه مدل‌ها، بررسی سازگاری و تصمیم نهایی؛ همه اطلاعات در یک مسیر ساده قرار گرفته است."}</p></div><label className="guides-hub-search"><I.search className="icon" /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={siteSettings.guides_search_placeholder || "جست‌وجوی دسته یا موضوع..."} /></label></header>
    <div className="guides-hub-layout">
      <aside className="guides-category-nav glass"><div><b>دسته‌بندی‌ها</b><span>{fmt(CATEGORIES.length)} راهنمای تخصصی</span></div><nav>{categories.map((category) => { const Icon = I[category.icon] || I.gift; return <a key={category.id} href={routePath("guide", category.id)} className={category.id === selectedCategory?.id ? "active" : ""}><Icon className="icon" /><span><b>{category.name}</b><small>{(category.subs || []).slice(0, 3).join("، ")}</small></span><i>←</i></a>; })}</nav></aside>
      <section className="guides-category-content">
        <div className="guide-category-overview glass"><div className="guide-category-title"><span><CategoryIcon className="icon" /></span><div><small>راهنمای دسته‌بندی</small><h2>راهنمای خرید {selectedCategory?.name}</h2><p>ابتدا نوع استفاده و بودجه را مشخص کنید؛ سپس معیارهای زیر را به‌ترتیب بررسی کنید.</p></div></div><div className="guide-decision-path"><span>نیازسنجی</span><i>←</i><span>سازگاری</span><i>←</i><span>مقایسه</span><i>←</i><span>خدمات</span><i>←</i><span>خرید</span></div><nav className="guide-quick-nav" aria-label="دسترسی سریع به بخش‌های راهنما">{[["guide-needs","روش انتخاب"],["guide-criteria","معیارها"],["guide-recommendations","پیشنهادهای من"],["guide-compare","مقایسه محصولات"],["guide-products","راهنمای محصولات"],["guide-compatibility","سازگاری"],["guide-after-buy","بعد از خرید"],["guide-faq","پرسش‌ها"]].map(([id,label]) => <button type="button" key={id} onClick={() => scrollToGuide(id)}>{label}</button>)}</nav></div>
        <section id="guide-needs" className="glass guide-needs-section"><GuideBlockTitle number="۰۰" title="از کدام سطح خرید شروع کنم؟" subtitle="سطحی را انتخاب کنید که با نیاز واقعی و بودجه شما هماهنگ است؛ نه صرفاً گران‌ترین گزینه." /><div className="guide-level-grid"><GuideLevel badge="اقتصادی" title="نیازهای ضروری و روزمره" price={priceAt(.2)} text="مناسب استفاده سبک و کاربری پایه؛ امکانات ضروری، سازگاری و ضمانت را در اولویت بگذارید." items={["تمرکز بر نیازهای اصلی", "حذف امکانات غیرضروری", "کنترل امکان ارتقای آینده"]} /><GuideLevel badge="متعادل" title="بهترین نسبت قیمت به کارایی" price={priceAt(.55)} text="برای بیشتر کاربران؛ تعادل بین عملکرد، کیفیت ساخت، طول عمر و هزینه نهایی." items={["ظرفیت و عملکرد کافی", "کیفیت ساخت قابل اتکا", "ضمانت و خدمات مناسب"]} featured /><GuideLevel badge="حرفه‌ای" title="کار سنگین و استفاده طولانی" price={priceAt(.82)} text="برای کار تخصصی یا استفاده فشرده؛ کارایی پایدار، قابلیت ارتقا و خدمات جدی‌تر مهم‌اند." items={["عملکرد پایدار زیر فشار", "امکانات تخصصی واقعی", "حاشیه امن برای آینده"]} /></div><div className="guide-choice-workspace"><div className="guide-choice-copy"><b>روش انتخاب شخصی شما</b><p>نوع استفاده، نرم‌افزارها، دستگاه فعلی، محدودیت فضا و سه ویژگی ضروری خود را بنویسید. این متن در جمع‌بندی محصول انتخاب‌شده استفاده می‌شود.</p></div><div className="guide-choice-fields"><label><span>نیازها و اولویت‌های من</span><textarea value={userNeed} onChange={(event) => setUserNeed(event.target.value)} rows="4" placeholder={`مثال: برای ${selectedCategory.name}، استفاده روزانه و حرفه‌ای دارم؛ کیفیت ساخت و ضمانت برایم مهم است...`} /></label><label><span>حداکثر بودجه (تومان)</span><input type="number" min="0" value={budget} onChange={(event) => setBudget(event.target.value)} placeholder="مثلاً 30000000" /></label></div></div></section>
        <div id="guide-criteria" className="guide-professional-grid"><section className="glass guide-criteria-card"><GuideBlockTitle number="۰۱" title="معیارهای حرفه‌ای انتخاب" subtitle="معیارهای مهم خود را انتخاب کنید تا پیشنهادها و جمع‌بندی محصولات براساس آن‌ها تنظیم شود." />{categoryGuide?.content && <div className="guide-custom-content">{categoryGuide.content}</div>}<div className="guide-selected-criteria"><b>{fmt(selectedCriteria.length)} معیار انتخاب شده</b>{selectedCriteria.length > 0 && <button type="button" onClick={() => setSelectedCriteria([])}>پاک‌کردن همه</button>}</div><div className="guide-criteria-list selectable">{profile.keys.map((item, index) => { const title = typeof item === "string" ? item : item.title; const active = selectedCriteria.includes(title); return <button type="button" key={title} className={active ? "active" : ""} aria-pressed={active} onClick={() => toggleCriterion(title)}><i>{active ? "✓" : fmt(index + 1)}</i><div><h4>{title}</h4><p>{typeof item === "string" ? "برای اولویت‌دادن به این معیار آن را انتخاب کنید؛ در پیشنهادها و جمع‌بندی لحاظ می‌شود." : item.description}</p></div></button>; })}</div></section>{siteSettings.guides_show_mistakes !== false && <aside className="glass guide-warning-card"><span>قبل از خرید مراقب باشید</span><h3>اشتباهات رایج</h3><ul>{profile.mistakes.map((item) => <li key={item}>{item}</li>)}</ul><div><b>قانون طلایی</b><p>بهترین محصول گران‌ترین مدل نیست؛ مدلی است که بدون هزینه اضافی دقیقاً نیاز شما را پوشش دهد.</p></div></aside>}</div>
        <section id="guide-recommendations" className="glass guide-recommendations"><GuideBlockTitle number="۰۲" title="محصولات پیشنهادی براساس انتخاب شما" subtitle={selectedCriteria.length || budget ? "نتایج براساس معیارها، بودجه، موجودی، امتیاز و محبوبیت مرتب شده‌اند." : "برای پیشنهاد دقیق‌تر، در بخش بالا معیارها و بودجه را مشخص کنید."} /><div className="guide-recommendation-grid">{recommendedProducts.map((product, index) => { const isCompared = compareIds.includes(product.id); return <article key={product.id} className={isCompared ? "is-compared" : ""}><span className="guide-match">پیشنهاد {fmt(index + 1)}</span><div className="guide-rec-image">{product.image ? <img src={product.image} alt={product.name} /> : <CategoryIcon className="icon" />}</div><h3>{product.name}</h3><p>{selectedCriteria.length ? `مناسب برای بررسی براساس: ${selectedCriteria.join("، ")}` : "موجودی، امتیاز و استقبال کاربران در رتبه‌بندی لحاظ شده است."}</p><div><b>{product.finalPrice ? `${fmt(product.finalPrice)} تومان` : "استعلام قیمت"}</b><span>★ {fmt(product.rate)}</span></div><footer><button type="button" className="compare-toggle" aria-pressed={isCompared} onClick={() => toggleCompare(product.id)}><span aria-hidden="true">{isCompared ? "✓" : "+"}</span>{isCompared ? "انتخاب شد" : "افزودن به مقایسه"}</button><button type="button" className="product-guide-button" onClick={() => { setSelectedProductId(product.id); scrollToGuide("guide-products"); }}>راهنمای محصول</button></footer></article>; })}</div></section>
        <section id="guide-compare" className="glass guide-comparison-section"><GuideBlockTitle number="۰۳" title="مقایسه دلخواه محصولات" subtitle="محصولات را از کارت‌های کوچک زیر انتخاب کنید؛ جست‌وجو و تعداد انتخاب محدودیتی ندارد." /><div className="guide-compare-builder"><label><I.search className="icon" /><input value={productSearch} onChange={(event) => setProductSearch(event.target.value)} placeholder={`جست‌وجو میان محصولات ${selectedCategory.name}...`} /></label><div className="guide-search-results" role="list" aria-label="محصولات قابل افزودن به مقایسه">{searchedProducts.map((product) => { const selected = compareIds.includes(product.id); return <button type="button" role="listitem" key={product.id} className={`guide-compare-mini-card${selected ? " selected" : ""}`} aria-pressed={selected} onClick={() => toggleCompare(product.id)}><span className="guide-mini-select" aria-hidden="true">{selected ? "✓" : "+"}</span><span className="guide-mini-image">{product.image ? <img src={product.image} alt="" loading="lazy" /> : <CategoryIcon className="icon" />}</span><span className="guide-mini-copy"><small>{product.brand || selectedCategory.name}</small><b>{product.name}</b></span><span className="guide-mini-meta"><b>{product.finalPrice ? `${fmt(product.finalPrice)} تومان` : "استعلام قیمت"}</b><small>★ {fmt(product.rate || 0)}</small></span><span className={`guide-mini-action${selected ? " selected" : ""}`}>{selected ? "انتخاب شد؛ برای حذف کلیک کنید" : "افزودن به مقایسه"}</span></button>; })}</div>{!searchedProducts.length && <div className="guide-empty compact">محصولی مطابق عبارت جست‌وجوشده پیدا نشد.</div>}<div className="guide-compare-status"><b>{fmt(compareIds.length)} محصول برای مقایسه انتخاب شده</b>{compareIds.length > 0 && <button type="button" onClick={() => setCompareIds([])}>حذف همه</button>}</div></div>{comparisonProducts.length ? <div className="guide-comparison-scroll"><table><thead><tr><th>محصول</th><th>قیمت نهایی</th><th>امتیاز</th><th>موجودی</th><th>ضمانت</th>{comparisonSpecKeys.map((item) => <th key={item}>{item}</th>)}<th>عملیات</th></tr></thead><tbody>{comparisonProducts.map((product) => <tr key={product.id}><td><div className="guide-compare-product">{product.image ? <img src={product.image} alt="" /> : <CategoryIcon className="icon" />}<span><b>{product.name}</b><small>{product.brand}</small></span></div></td><td><b>{product.finalPrice ? `${fmt(product.finalPrice)} تومان` : "استعلام"}</b></td><td><span className="guide-rating">★ {fmt(product.rate)}</span></td><td><span className={product.stock > 0 ? "guide-stock in" : "guide-stock"}>{product.stock > 0 ? `${fmt(product.stock)} عدد` : "ناموجود"}</span></td><td>{product.warranty || "استعلام"}</td>{comparisonSpecKeys.map((criterion) => <td key={criterion}>{product.specs?.[criterion] || "—"}</td>)}<td><div className="guide-table-actions"><button type="button" onClick={() => { setSelectedProductId(product.id); scrollToGuide("guide-products"); }}>راهنما</button><button type="button" className="remove" onClick={() => toggleCompare(product.id)}>حذف</button></div></td></tr>)}</tbody></table></div> : <div className="guide-empty">هنوز محصولی انتخاب نشده است. یکی از کارت‌های کوچک بالا را برای مقایسه انتخاب کنید.</div>}<p className="guide-table-note">جدول افقی قابل پیمایش است و تا ۱۲ مشخصه واقعی مشترک و اختصاصی محصولات را کنار قیمت، ضمانت و موجودی نمایش می‌دهد.</p></section>
        {siteSettings.guides_show_product_tabs !== false && <section id="guide-products" className="glass guide-products-section"><GuideBlockTitle number="۰۴" title="راهنمای عمیق محصولات این دسته" subtitle="محصول موردنظر را جست‌وجو کنید؛ هر مدل راهنمای مستقل، مشخصات واقعی، نکات مثبت، هشدارها و نتیجه پیشنهادی دارد." />{products.length ? <><label className="guide-deep-search"><I.search className="icon" /><input value={guideProductSearch} onChange={(event) => setGuideProductSearch(event.target.value)} placeholder="جست‌وجوی نام یا مشخصات محصول برای مشاهده راهنمای اختصاصی..." /></label>{guideProducts.length ? <div className="guide-product-tabs" role="tablist">{guideProducts.map((product) => <button type="button" key={product.id} role="tab" aria-selected={String(product.id) === String(selectedProduct?.id)} className={String(product.id) === String(selectedProduct?.id) ? "active" : ""} onClick={() => setSelectedProductId(product.id)}>{product.name}</button>)}</div> : <div className="guide-empty compact">محصولی مطابق جست‌وجوی شما پیدا نشد.</div>}<ProductGuidePanel product={selectedProduct} category={selectedCategory} customGuide={productGuide} selectedCriteria={selectedCriteria} userNeed={userNeed} /></> : <div className="guide-empty">هنوز محصولی در این دسته ثبت نشده است؛ راهنمای عمومی بالا همچنان قابل استفاده است.</div>}</section>}
        <div id="guide-compatibility" className="guide-safety-grid"><section className="glass guide-compatibility-card"><GuideBlockTitle number="۰۴" title="کنترل سازگاری پیش از خرید" subtitle="این اطلاعات را از دستگاه یا تجهیزات فعلی استخراج و با محصول تطبیق دهید." /><div className="guide-check-matrix">{["مدل و کد فنی دقیق دستگاه", "ابعاد و فضای نصب", "نسل و استاندارد ارتباطی", "نوع درگاه یا سوکت", "توان ورودی و خروجی", "سیستم‌عامل یا نرم‌افزار", "قطعات و لوازم داخل بسته", "محدودیت اعلام‌شده سازنده"].map((item, index) => <label key={item}><input type="checkbox" /><span><b>{item}</b><small>{index < 4 ? "تطبیق فیزیکی و فنی الزامی است." : "شرایط استفاده و پشتیبانی را کنترل کنید."}</small></span></label>)}</div><div className="guide-compat-alert"><b>اگر یک مورد نامشخص است، خرید را متوقف کنید.</b><p>نام مشابه، شکل یکسان یا اتصال ظاهری تضمین سازگاری نیست. مدل کامل را از برچسب دستگاه یا سایت سازنده پیدا کنید.</p></div></section><section className="glass guide-glossary-card"><GuideBlockTitle number="۰۵" title="اصطلاحات مهم این راهنما" subtitle="معنی ساده عبارت‌هایی که هنگام مقایسه می‌بینید." /><dl>{profile.keys.slice(0,6).map((item) => { const title = typeof item === "string" ? item : item.title; return <div key={title}><dt>{title}</dt><dd>یک معیار مؤثر بر سازگاری، عملکرد یا ارزش خرید است؛ مقدار بیشتر همیشه بهتر نیست و باید با کاربری شما هماهنگ باشد.</dd></div>; })}</dl></section></div>
        <section id="guide-after-buy" className="glass guide-after-buy"><GuideBlockTitle number="۰۶" title="تحویل، تست اولیه و نگهداری" subtitle="خرید مطمئن با پرداخت تمام نمی‌شود؛ این مراحل را بعد از دریافت انجام دهید." /><div className="guide-timeline">{[["هنگام تحویل","سلامت بسته، پلمب، مدل و برچسب مشخصات را پیش از استفاده بررسی کنید."],["بازکردن بسته","از جعبه و محتویات فیلم بگیرید و اقلام داخل بسته را با صفحه محصول تطبیق دهید."],["تست اولیه","ظاهر، اتصالات، عملکردهای اصلی، صدا یا دمای غیرعادی را در مهلت تست کنترل کنید."],["ثبت ضمانت","فاکتور، شماره سریال، کارت ضمانت و شرایط فعال‌سازی را نگهداری و در صورت نیاز ثبت کنید."],["نگهداری اصولی","راهنمای سازنده، تهویه، تمیزکاری، شارژ یا به‌روزرسانی‌های ایمن را رعایت کنید."]].map(([title,text],index) => <article key={title}><i>{fmt(index+1)}</i><div><h4>{title}</h4><p>{text}</p></div></article>)}</div><div className="guide-final-check"><div><b>چک نهایی سفارش</b><p>مدل، نسخه، رنگ، تعداد، ضمانت، آدرس، روش ارسال و مبلغ نهایی را کنترل کردم.</p></div><a href={routePath("shop", selectedCategory.id)}>مشاهده همه محصولات {selectedCategory.name} <span>←</span></a></div></section>
        {siteSettings.guides_show_faq !== false && <section id="guide-faq" className="glass guide-faq-section"><GuideBlockTitle number="۰۷" title="پرسش‌های مهم پیش از سفارش" subtitle="پاسخ‌های دقیق برای جلوگیری از انتخاب اشتباه." /><div className="guide-hub-faq">{(categoryGuide?.faq_items?.length ? categoryGuide.faq_items.map((item) => [item.question, item.answer]) : [
          ["از کجا بفهمم این محصول برای من مناسب است؟", "کاربری، بودجه، دستگاه یا فضای فعلی و ویژگی‌های ضروری را مشخص کنید. سپس هر شش معیار بالا را با مشخصات محصول تطبیق دهید."],
          ["چطور سازگاری را قطعی بررسی کنم؟", "مدل دقیق تجهیزات، ابعاد، نسل، رابط، توان و محدودیت‌های سازنده را استخراج کنید؛ نام یا ظاهر مشابه به‌معنای سازگاری نیست."],
          ["برای مقایسه دو مدل هم‌قیمت چه کنم؟", "کارایی واقعی، کیفیت ساخت، امکان ارتقا، ضمانت، موجودی قطعات و هزینه‌های جانبی را کنار هم قرار دهید."],
          ["آیا مدل ارزان‌تر همیشه اقتصادی‌تر است؟", "خیر؛ عمر کمتر، نبود ضمانت یا نیاز به لوازم تکمیلی می‌تواند هزینه نهایی مدل ارزان را بیشتر کند."],
          ["پیش از پرداخت چه چیزهایی را کنترل کنم؟", "مدل، نسخه، رنگ، موجودی، اقلام بسته، ضمانت، روش ارسال، شرایط بازگشت و مبلغ نهایی را دوباره بررسی کنید."],
          ["اگر بین دو محصول مردد بودم چه کنم؟", "سه اولویت اصلی خود را بنویسید و مدلی را انتخاب کنید که هر سه را با ضمانت بهتر و هزینه منطقی پوشش می‌دهد."],
        ]).map(([question, answer]) => <details key={question}><summary>{question}<i>+</i></summary><p>{answer}</p></details>)}</div></section>}
      </section>
    </div>
  </main>;
}

function GuideBlockTitle({ number, title, subtitle }) {
  return <div className="guide-block-title"><span>{number}</span><div><h3>{title}</h3><p>{subtitle}</p></div></div>;
}

function GuideLevel({ badge, title, price, text, items, featured = false }) {
  return <article className={`guide-level-card${featured ? " featured" : ""}`}><span>{badge}</span><h3>{title}</h3><p>{text}</p><ul>{items.map((item) => <li key={item}>{item}</li>)}</ul><div><small>حدود بازه شروع در محصولات فعلی</small><b>{price ? `${fmt(price)} تومان` : "پس از ثبت محصول"}</b></div></article>;
}
