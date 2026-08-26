function AboutPage() {
  const { nav, siteSettings } = useStore();
  return (
    <div className="container content-page">
      <ContentHero
        eyebrow="داستان ما"
        title={`درباره ${siteSettings.site_name}`}
        description="یک فروشگاه تخصصی برای انتخاب ساده‌تر، مطمئن‌تر و سریع‌تر محصولات دیجیتال و قطعات کامپیوتر."
        icon={I.cpu}
      />

      <section className="content-split">
        <article className="content-card glass">
          <span className="content-card-number">۸۲</span>
          <h2>انتخاب آگاهانه، خرید مطمئن</h2>
          <p>
            هدف ما این است که مشخصات فنی، موجودی، قیمت و شرایط گارانتی هر محصول
            شفاف باشد تا بتوانید متناسب با نیاز و بودجه خود بهترین انتخاب را
            انجام دهید.
          </p>
          <p>
            از مقایسه محصولات و پیشنهادهای هوشمند تا پیگیری سفارش و پشتیبانی،
            تمام مراحل خرید در یک تجربه یکپارچه در دسترس شماست.
          </p>
        </article>
        <div className="value-grid">
          {[
            [
              I.shield,
              "اصالت و شفافیت",
              "نمایش دقیق مشخصات، گارانتی و وضعیت موجودی کالا",
            ],
            [
              I.truck,
              "ارسال قابل انتخاب",
              "ارسال عادی، سریع و ویژه متناسب با سفارش شما",
            ],
            [
              I.user,
              "پشتیبانی همراه",
              "پاسخ‌گویی و پیگیری درخواست‌ها در پنل کاربری",
            ],
            [
              I.gift,
              "مزایای مشتریان",
              "امتیاز خرید، کد دعوت و پیشنهادهای ویژه اعضا",
            ],
          ].map(([Icon, title, text]) => (
            <article className="value-card glass" key={title}>
              <span>
                <Icon className="icon" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="content-cta glass">
        <div>
          <h2>برای انتخاب محصول آماده‌اید؟</h2>
          <p>محصولات را ببینید، مقایسه کنید و انتخاب مطمئن‌تری داشته باشید.</p>
        </div>
        <button className="btn btn-primary" onClick={() => nav("shop")}>
          <I.bag className="icon" /> مشاهده فروشگاه
        </button>
      </section>
    </div>
  );
}

