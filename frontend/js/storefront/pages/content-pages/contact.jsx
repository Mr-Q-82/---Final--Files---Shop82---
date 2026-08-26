function ContactPage() {
  const { user, nav, toast } = useStore();
  const [sending, setSending] = useState(false);

  const submitTicket = async (event) => {
    event.preventDefault();
    if (!user || !AuthTokenVault.has()) {
      toast("برای ارسال درخواست ابتدا وارد حساب کاربری شوید.", "error");
      nav("auth");
      return;
    }
    const form = event.currentTarget;
    const data = Object.fromEntries(new FormData(form).entries());
    if (
      !String(data.subject || "").trim() ||
      !String(data.initial_message || "").trim()
    ) {
      toast("موضوع و متن درخواست را کامل کنید.", "error");
      return;
    }
    setSending(true);
    try {
      await accountApi("/auth/tickets/", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast("درخواست شما با موفقیت برای پشتیبانی ارسال شد ✓");
      form.reset();
      nav("profile", "tickets");
    } catch (error) {
      toast(error.message || "ارسال درخواست انجام نشد.", "error");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="container content-page">
      <ContentHero
        eyebrow="پشتیبانی فروشگاه"
        title="تماس با ما"
        description="پرسش یا مشکلی دارید؟ درخواست خود را ثبت کنید تا پاسخ در حساب کاربری شما نمایش داده شود."
        icon={I.send}
      />

      <section className="contact-layout">
        <div className="contact-options">
          <article className="contact-option glass">
            <I.user className="icon" />
            <div>
              <h2>گفت‌وگو با پشتیبانی</h2>
              <p>
                پاسخ‌ها و ادامه گفت‌وگو در بخش پشتیبانی حساب کاربری ذخیره
                می‌شود.
              </p>
            </div>
          </article>
          <article className="contact-option glass">
            <I.bag className="icon" />
            <div>
              <h2>پیگیری سفارش</h2>
              <p>
                وضعیت سفارش، مراحل ارسال و کد رهگیری را از پنل خود مشاهده کنید.
              </p>
              <button
                className="text-action"
                onClick={() => nav("profile", "orders")}
              >
                مشاهده سفارش‌ها
              </button>
            </div>
          </article>
          <article className="contact-option glass">
            <I.shield className="icon" />
            <div>
              <h2>راهنمای بازگشت کالا</h2>
              <p>
                پیش از ثبت درخواست، شرایط و مراحل بازگشت کالا را مطالعه کنید.
              </p>
              <button className="text-action" onClick={() => nav("returns")}>
                مطالعه شرایط بازگشت
              </button>
            </div>
          </article>
        </div>

        <form className="contact-form glass" onSubmit={submitTicket}>
          <div className="content-section-head">
            <span>
              <I.send className="icon" />
            </span>
            <div>
              <h2>ثبت درخواست پشتیبانی</h2>
              <p>
                {user
                  ? "پیام با حساب فعلی شما ثبت می‌شود."
                  : "برای ثبت پیام باید وارد حساب شوید."}
              </p>
            </div>
          </div>
          <label>
            موضوع درخواست
            <input
              name="subject"
              maxLength="180"
              placeholder="مثلاً پیگیری سفارش"
              required
            />
          </label>
          <div className="contact-form-row">
            <label>
              دسته‌بندی
              <select name="category" defaultValue="عمومی">
                <option>عمومی</option>
                <option>سفارش و ارسال</option>
                <option>پرداخت و بازپرداخت</option>
                <option>مرجوعی کالا</option>
                <option>محصول و گارانتی</option>
              </select>
            </label>
            <label>
              اولویت
              <select name="priority" defaultValue="NORMAL">
                <option value="LOW">کم</option>
                <option value="NORMAL">عادی</option>
                <option value="HIGH">فوری</option>
              </select>
            </label>
          </div>
          <label>
            متن درخواست
            <textarea
              name="initial_message"
              rows="6"
              maxLength="2000"
              placeholder="درخواست خود را با جزئیات بنویسید..."
              required
            />
          </label>
          <button className="btn btn-primary" type="submit" disabled={sending}>
            <I.send className="icon" />{" "}
            {sending ? "در حال ارسال..." : "ارسال درخواست"}
          </button>
        </form>
      </section>
    </div>
  );
}
