function FAQPage() {
  const { nav } = useStore();
  const [openIndex, setOpenIndex] = useState(0);
  return (
    <div className="container content-page content-page-narrow">
      <ContentHero
        eyebrow="راهنمای خرید"
        title="سؤالات متداول"
        description="پاسخ پرسش‌های رایج درباره خرید، ارسال، موجودی، گارانتی و بازگشت کالا."
        icon={I.plus}
      />
      <section className="faq-list" aria-label="سؤالات متداول">
        {FAQ_ITEMS.map((item, index) => {
          const open = openIndex === index;
          return (
            <article
              className={`faq-item glass${open ? " open" : ""}`}
              key={item.question}
            >
              <button
                type="button"
                aria-expanded={open}
                onClick={() => setOpenIndex(open ? -1 : index)}
              >
                <span>{item.question}</span>
                <b aria-hidden="true">{open ? "−" : "+"}</b>
              </button>
              {open && (
                <div className="faq-answer">
                  <p>{item.answer}</p>
                </div>
              )}
            </article>
          );
        })}
      </section>
      <section className="content-cta glass">
        <div>
          <h2>پاسخ خود را پیدا نکردید؟</h2>
          <p>یک درخواست برای تیم پشتیبانی ثبت کنید.</p>
        </div>
        <button className="btn btn-primary" onClick={() => nav("contact")}>
          تماس با ما
        </button>
      </section>
    </div>
  );
}

