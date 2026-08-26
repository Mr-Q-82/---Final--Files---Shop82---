/* ============================================================
   FOOTER
   ============================================================ */
function Footer() {
  const { toast, siteSettings } = useStore();
  const [email, setEmail] = useState("");
  const subscribe = () => {
    if (!RX.email.test(email)) {
      toast("ایمیل معتبر نیست", "error");
      return;
    }
    fetch(API_BASE + "/catalog/newsletter/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    })
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) throw new Error(data.detail || "عضویت انجام نشد");
        return data;
      })
      .then(() => {
        toast("عضویت در خبرنامه انجام شد ✓");
        setEmail("");
      })
      .catch((error) =>
        toast(error.message || "عضویت در خبرنامه انجام نشد", "error"),
      );
  };
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <footer className="site-footer" aria-label="پایان صفحه">
      <div className="footer-aura footer-aura-primary" aria-hidden="true" />
      <div className="footer-aura footer-aura-accent" aria-hidden="true" />
      {siteSettings.home_services_enabled !== false && (
        <section className="footer-trust-strip" aria-label="خدمات فروشگاه">
          {[
            ["truck", "ارسال سریع", "ارسال ۲۴ ساعته به سراسر کشور"],
            ["shield", "گارانتی اصالت", "ضمانت اصل بودن کالا"],
            ["power", "پرداخت امن", "درگاه پرداخت معتبر"],
            ["bot", "پشتیبانی ۲۴/۷", "همیشه در کنار شما"],
          ].map(([icon, title, description], index) => (
            <article className={`footer-trust-card footer-trust-card-${index + 1}`} key={title}>
              <span className="footer-trust-icon" aria-hidden="true">
                {I[icon]({ className: "icon" })}
              </span>
              <div>
                <strong>{title}</strong>
                <small>{description}</small>
              </div>
            </article>
          ))}
        </section>
      )}
      <div className="container footer-shell">
        <section className="footer-service-bar" aria-label="مزایای خرید">
          <div className="footer-service-item">
            <span className="footer-service-icon"><I.shield className="icon" /></span>
            <span><strong>ضمانت اصالت کالا</strong><small>خرید مطمئن و تضمین‌شده</small></span>
          </div>
          <div className="footer-service-item">
            <span className="footer-service-icon"><I.truck className="icon" /></span>
            <span><strong>ارسال سریع و ایمن</strong><small>تحویل به سراسر کشور</small></span>
          </div>
          <div className="footer-service-item">
            <span className="footer-service-icon"><I.gift className="icon" /></span>
            <span><strong>پیشنهادهای اختصاصی</strong><small>تخفیف‌های ویژه اعضا</small></span>
          </div>
          <div className="footer-service-item">
            <span className="footer-service-icon"><I.cpu className="icon" /></span>
            <span><strong>مشاوره تخصصی</strong><small>انتخاب دقیق تجهیزات دیجیتال</small></span>
          </div>
        </section>

        <div className="footer-main">
          <section className="footer-brand" aria-labelledby="footer-brand-title">
            <div className="footer-brand-head">
              <div className="footer-brand-logo">
                {siteSettings.logo ? (
                  <img
                    src={siteSettings.logo}
                    alt={siteSettings.site_name}
                  />
                ) : (
                  <I.cpu className="icon" />
                )}
              </div>
              <div>
                <h3 id="footer-brand-title">{siteSettings.site_name}</h3>
                <span>مرکز تخصصی تجهیزات دیجیتال</span>
              </div>
            </div>
            <p className="footer-brand-copy">
              فروشگاه تخصصی کامپیوتر، لپ‌تاپ و لوازم جانبی با ضمانت اصالت کالا و
              ارسال سریع به سراسر کشور.
            </p>
            <div className="footer-live-status"><i aria-hidden="true" /> فروشگاه آنلاین و آماده پاسخ‌گویی</div>
          </section>

          <nav className="footer-links" aria-label="دسترسی سریع">
            <h4>دسترسی سریع</h4>
            <a href="/"><span>صفحه اصلی</span><b aria-hidden="true">←</b></a>
            <a href="/shop"><span>فروشگاه</span><b aria-hidden="true">←</b></a>
            <a href="/shop/off"><span>تخفیف‌ها</span><b aria-hidden="true">←</b></a>
            <a href="/about"><span>درباره ما</span><b aria-hidden="true">←</b></a>
          </nav>

          <nav className="footer-links" aria-label="خدمات مشتریان">
            <h4>خدمات مشتریان</h4>
            <a href="/account/orders"><span>پیگیری سفارش</span><b aria-hidden="true">←</b></a>
            <a href="/returns"><span>شرایط بازگشت</span><b aria-hidden="true">←</b></a>
        <a href="/faq"><span>سؤالات متداول</span><b aria-hidden="true">←</b></a>
        <a href="/guides"><span>راهنماهای خرید</span><b aria-hidden="true">←</b></a>
            <a href="/contact"><span>تماس با ما</span><b aria-hidden="true">←</b></a>
          </nav>

          <section className="footer-newsletter" aria-labelledby="newsletter-title">
            <span className="footer-newsletter-kicker">خبرهای خوب در راه‌اند</span>
            <h4 id="newsletter-title">یک قدم جلوتر از تخفیف‌ها</h4>
            <p>پیشنهادهای ویژه و تازه‌ترین محصولات را زودتر از همه دریافت کنید.</p>
            <form className="news-in" onSubmit={(event) => { event.preventDefault(); subscribe(); }} autoComplete="off">
              <input
                type="email"
                name="footer-newsletter-email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                aria-label="ایمیل خبرنامه"
                autoComplete="off"
                dir="ltr"
              />
              <button className="btn btn-primary" type="submit">
                عضویت
              </button>
            </form>
            <small>بدون پیام مزاحم؛ هر زمان بخواهید می‌توانید لغو عضویت کنید.</small>
          </section>
        </div>

        <div className="footer-bottom">
          <p>{siteSettings.footer_text}</p>
          <div className="footer-bottom-badges" aria-label="تعهدهای فروشگاه">
            <span>پرداخت امن</span><i aria-hidden="true" />
            <span>۷ روز ضمانت بازگشت</span><i aria-hidden="true" />
            <span>پشتیبانی واقعی</span>
          </div>
          <button className="footer-back-top" type="button" onClick={scrollToTop} aria-label="بازگشت به بالای صفحه">
            <span aria-hidden="true">↑</span>
            بازگشت به بالا
          </button>
        </div>
      </div>
    </footer>
  );
}
