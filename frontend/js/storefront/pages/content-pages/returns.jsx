function ReturnsPage() {
  const { nav } = useStore();
  const steps = [
    [
      "۱",
      "ثبت درخواست",
      "از جزئیات سفارش تحویل‌شده، دلیل و توضیحات مرجوعی را ثبت کنید.",
    ],
    [
      "۲",
      "بررسی پشتیبانی",
      "درخواست و شرایط کالا بررسی می‌شود و نتیجه برای شما اعلان خواهد شد.",
    ],
    [
      "۳",
      "تحویل کالا",
      "پس از تأیید، هماهنگی لازم برای دریافت یا ارسال کالا انجام می‌شود.",
    ],
    [
      "۴",
      "بازپرداخت",
      "پس از دریافت و تأیید نهایی کالا، فرایند بازگشت مبلغ آغاز می‌شود.",
    ],
  ];
  return (
    <div className="container content-page">
      <ContentHero
        eyebrow="خرید مطمئن"
        title="شرایط بازگشت کالا"
        description="برای بررسی سریع‌تر درخواست، کالا را همراه با بسته‌بندی، متعلقات و مدارک سفارش نگهداری کنید."
        icon={I.shield}
      />

      <section className="return-steps">
        {steps.map(([number, title, text]) => (
          <article className="return-step glass" key={number}>
            <span>{number}</span>
            <h2>{title}</h2>
            <p>{text}</p>
          </article>
        ))}
      </section>

      <section className="return-policy-grid">
        <article className="policy-card glass policy-accepted">
          <h2>موارد قابل بررسی</h2>
          <ul>
            <li>مغایرت کالای دریافت‌شده با سفارش ثبت‌شده</li>
            <li>آسیب‌دیدگی ظاهری یا نقصی که هنگام تحویل وجود داشته است</li>
            <li>ناقص‌بودن متعلقات درج‌شده در مشخصات محصول</li>
            <li>
              ثبت درخواست در مهلت اعلام‌شده و پیش از آسیب یا استفاده نامتعارف
            </li>
          </ul>
        </article>
        <article className="policy-card glass policy-rejected">
          <h2>نکات ضروری</h2>
          <ul>
            <li>کالا، جعبه، برچسب‌ها و تمام متعلقات باید نگهداری شوند.</li>
            <li>
              آسیب ناشی از نصب نادرست یا استفاده خارج از دستورالعمل قابل پذیرش
              نیست.
            </li>
            <li>
              اطلاعات شخصی خود را پیش از تحویل حافظه‌ها و دستگاه‌ها پاک کنید.
            </li>
            <li>
              نتیجه نهایی پس از بررسی فنی و تطبیق کالا با سفارش اعلام می‌شود.
            </li>
          </ul>
        </article>
      </section>

      <aside className="policy-note glass">
        <I.shield className="icon" />
        <p>
          پذیرش اولیه درخواست به معنی تأیید نهایی مرجوعی نیست. وضعیت درخواست و
          پیام‌های مربوط به دریافت کالا یا بازپرداخت در حساب کاربری نمایش داده
          می‌شود.
        </p>
      </aside>

      <section className="content-cta glass">
        <div>
          <h2>می‌خواهید درخواست مرجوعی ثبت کنید؟</h2>
          <p>از بخش سفارش‌ها وارد جزئیات سفارش تحویل‌شده شوید.</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => nav("profile", "orders")}
        >
          مشاهده سفارش‌ها
        </button>
      </section>
    </div>
  );
}
