function AccountServices({ section }) {
  const { toast } = useStore();
  const [items, setItems] = useState([]),
    [wallet, setWallet] = useState(null),
    [loyalty, setLoyalty] = useState(null),
    [subject, setSubject] = useState(""),
    [message, setMessage] = useState(""),
    [giftCode, setGiftCode] = useState(""),
    [topupAmount, setTopupAmount] = useState(""),
    [activeTicket, setActiveTicket] = useState(null),
    [reply, setReply] = useState("");
  const load = async () => {
    try {
      if (section === "wallet") setWallet(await accountApi("/auth/wallet/"));
      else if (section === "loyalty")
        setLoyalty(await accountApi("/auth/loyalty/"));
      else {
        const response = await accountApiAll(
          section === "tickets"
            ? "/auth/tickets/?page_size=100"
            : "/orders/returns/?page_size=100",
        );
        const rows = response.results || response;
        setItems(rows);
        if (section === "tickets") {
          const pending = sessionStorage.getItem("open_ticket_id");
          if (pending) {
            sessionStorage.removeItem("open_ticket_id");
            const ticket = rows.find((item) => String(item.id) === pending);
            if (ticket)
              setActiveTicket(await accountApi(`/auth/tickets/${ticket.id}/`));
          }
        }
      }
    } catch (e) {
      toast(e.message, "error");
    }
  };
  useEffect(() => {
    load();
  }, [section]);
  useEffect(() => {
    if (
      section !== "tickets" ||
      !activeTicket ||
      activeTicket.status === "CLOSED"
    )
      return;
    const timer = setInterval(async () => {
      try {
        const fresh = await accountApi(`/auth/tickets/${activeTicket.id}/`);
        setActiveTicket(fresh);
        if (fresh.status === "CLOSED") load();
      } catch (e) {}
    }, 3000);
    return () => clearInterval(timer);
  }, [section, activeTicket?.id, activeTicket?.status]);
  const createTicket = async () => {
    if (!subject.trim() || !message.trim())
      return toast("موضوع و متن پیام را وارد کنید", "error");
    try {
      await accountApi("/auth/tickets/", {
        method: "POST",
        body: JSON.stringify({ subject, initial_message: message }),
      });
      setSubject("");
      setMessage("");
      load();
      toast("تیکت ثبت شد");
    } catch (e) {
      toast(e.message, "error");
    }
  };
  const openTicket = async (ticket) => {
    try {
      const fresh = await accountApi(`/auth/tickets/${ticket.id}/`);
      setActiveTicket(fresh);
    } catch (e) {
      toast(e.message, "error");
    }
  };
  const sendReply = async () => {
    if (!reply.trim()) return;
    try {
      await accountApi(`/auth/tickets/${activeTicket.id}/reply/`, {
        method: "POST",
        body: JSON.stringify({ message: reply }),
      });
      setReply("");
      const fresh = await accountApi(`/auth/tickets/${activeTicket.id}/`);
      setActiveTicket(fresh);
      load();
    } catch (e) {
      toast(e.message, "error");
    }
  };
  const redeem = async () => {
    const points = loyalty?.min_redeem_points || 100;
    try {
      const data = await accountApi("/auth/loyalty/", {
        method: "POST",
        body: JSON.stringify({ redeem_points: points }),
      });
      setLoyalty(data.loyalty);
      toast(`${fmt(points)} امتیاز به کیف پول تبدیل شد`);
    } catch (e) {
      toast(e.message, "error");
    }
  };
  const redeemGift = async () => {
    try {
      await accountApi("/operations/gift-cards/redeem/", {
        method: "POST",
        body: JSON.stringify({ code: giftCode }),
      });
      setGiftCode("");
      load();
      toast("کارت هدیه به کیف پول اضافه شد");
    } catch (e) {
      toast(e.message, "error");
    }
  };
  const topup = async () => {
    try {
      const data = await accountApi("/auth/wallet/", {
        method: "POST",
        body: JSON.stringify({ amount: Number(topupAmount) }),
      });
      setWallet(data);
      setTopupAmount("");
      toast("کیف پول با موفقیت شارژ شد");
    } catch (e) {
      toast(e.message, "error");
    }
  };
  if (section === "wallet")
    return (
      <div>
        <h2 className="section-title">کیف پول</h2>
        <p className="section-sub">
          موجودی: <b>{fmt(wallet?.balance)} تومان</b>
        </p>
        <div className="glass" style={{ padding: 16, marginBottom: 14 }}>
          <h4 style={{ marginBottom: 10 }}>افزایش موجودی کیف پول</h4>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <input
              className="site-input"
              dir="ltr"
              inputMode="numeric"
              value={topupAmount}
              onChange={(e) =>
                setTopupAmount(e.target.value.replace(/\D/g, ""))
              }
              placeholder="مبلغ به تومان"
              style={{ flex: 1 }}
            />
            <button
              className="btn btn-primary"
              disabled={Number(topupAmount) < 10000}
              onClick={topup}
            >
              پرداخت و شارژ
            </button>
          </div>
          <div
            style={{ display: "flex", gap: 6, marginTop: 9, flexWrap: "wrap" }}
          >
            {[100000, 500000, 1000000, 5000000].map((amount) => (
              <button
                className="btn btn-ghost"
                key={amount}
                onClick={() => setTopupAmount(String(amount))}
              >
                {fmt(amount)} تومان
              </button>
            ))}
          </div>
        </div>
        <div
          className="glass"
          style={{ padding: 14, display: "flex", gap: 8, marginBottom: 14 }}
        >
          <input
            className="site-input"
            dir="ltr"
            value={giftCode}
            onChange={(e) => setGiftCode(e.target.value.toUpperCase())}
            placeholder="کد کارت هدیه"
          />
          <button className="btn btn-primary" onClick={redeemGift}>
            افزودن کارت هدیه
          </button>
        </div>
        {(wallet?.transactions || []).map((x) => (
          <div className="addr-card" key={x.id}>
            <div>
              <b>{x.description}</b>
              <small style={{ display: "block", color: "var(--muted)" }}>
                {x.transaction_type} · {jalaliDate(x.created_at, true)}
              </small>
            </div>
            <strong>{fmt(x.amount)} تومان</strong>
          </div>
        ))}
      </div>
    );
  if (section === "loyalty")
    return (
      <div>
        <h2 className="section-title">باشگاه مشتریان</h2>
        <div className="addr-card">
          <div>
            <b>سطح {loyalty?.level_display || "برنزی"}</b>
            <p>
              کد دعوت: <span dir="ltr">{loyalty?.referral_code}</span>
            </p>
            <small>
              هر {fmt(loyalty?.purchase_step_amount)} تومان خرید:{" "}
              {fmt(loyalty?.points_per_step)} امتیاز · ارزش هر امتیاز:{" "}
              {fmt(loyalty?.toman_per_point)} تومان
            </small>
          </div>
          <strong>{fmt(loyalty?.points)} امتیاز</strong>
        </div>
        <button
          className="btn btn-primary"
          disabled={
            (loyalty?.points || 0) < (loyalty?.min_redeem_points || 100)
          }
          onClick={redeem}
        >
          تبدیل {fmt(loyalty?.min_redeem_points || 100)} امتیاز به کیف پول
        </button>
        <section className="referral-history" style={{ marginTop: 24 }}>
          <div className="section-head">
            <div>
              <h3>دعوت‌های موفق من</h3>
              <small>افرادی که با کد دعوت شما عضو فروشگاه شده‌اند</small>
            </div>
            <span className="pill green">
              {fmt((loyalty?.referral_history || []).length)} دعوت موفق
            </span>
          </div>
          {(loyalty?.referral_history || []).length ? (
            <div className="referral-history-list">
              {loyalty.referral_history.map((item) => (
                <article className="addr-card referral-history-card" key={item.id}>
                  <div>
                    <b>{item.invited_name || "کاربر فروشگاه"}</b>
                    <p dir="ltr" style={{ textAlign: "right" }}>
                      {displayPhone(item.invited_phone)}
                    </p>
                    <small>{jalaliDate(item.created_at, true)}</small>
                  </div>
                  <strong className="referral-points">
                    +{fmt(item.inviter_points_awarded)} امتیاز
                  </strong>
                </article>
              ))}
            </div>
          ) : (
            <div className="empty-state compact">
              هنوز کسی با کد دعوت شما ثبت‌نام نکرده است.
            </div>
          )}
        </section>
      </div>
    );
  if (section === "tickets")
    return (
      <div>
        <h2 className="section-title">پشتیبانی و تیکت‌ها</h2>
        <div className="glass" style={{ padding: 16, marginBottom: 16 }}>
          <div className="field">
            <label>موضوع</label>
            <input
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
            />
          </div>
          <div className="field">
            <label>متن درخواست</label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
          <button className="btn btn-primary" onClick={createTicket}>
            شروع گفت‌وگو با پشتیبانی
          </button>
        </div>
        {items.map((x) => (
          <button
            className="addr-card"
            key={x.id}
            onClick={() => openTicket(x)}
            style={{
              width: "100%",
              textAlign: "right",
              cursor: "pointer",
              color: "inherit",
            }}
          >
            <div>
              <b>{x.subject}</b>
              <p>{x.messages?.at(-1)?.message || "بدون پیام"}</p>
              <small>{jalaliDate(x.updated_at, true)}</small>
            </div>
            <span className="pill">
              {x.status === "OPEN"
                ? "منتظر پاسخ"
                : x.status === "ANSWERED"
                  ? "پاسخ داده شده"
                  : "پایان یافته"}
            </span>
          </button>
        ))}
        {activeTicket &&
          ReactDOM.createPortal(
            <>
              <div
                className="overlay"
                style={{ zIndex: 2147483646 }}
                onClick={() => setActiveTicket(null)}
              />
              <div
                className="glass"
                style={{
                  position: "fixed",
                  inset: "50% auto auto 50%",
                  transform: "translate(-50%,-50%)",
                  zIndex: 2147483647,
                  padding: 22,
                  width: "min(680px,94vw)",
                  maxHeight: "86vh",
                  overflowY: "auto",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h3>{activeTicket.subject}</h3>
                    <small>
                      {activeTicket.status === "CLOSED"
                        ? "این گفت‌وگو پایان یافته است"
                        : "گفت‌وگو با پشتیبانی"}
                    </small>
                  </div>
                  <button
                    className="iconbtn"
                    onClick={() => setActiveTicket(null)}
                  >
                    ×
                  </button>
                </div>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                    margin: "20px 0",
                  }}
                >
                  {activeTicket.messages?.map((msg) => (
                    <div
                      key={msg.id}
                      style={{
                        alignSelf: msg.is_staff_reply
                          ? "flex-start"
                          : "flex-end",
                        maxWidth: "82%",
                        padding: "11px 14px",
                        borderRadius: 16,
                        background: msg.is_staff_reply
                          ? "var(--surface-solid)"
                          : "var(--primary)",
                        color: msg.is_staff_reply ? "var(--text)" : "#fff",
                      }}
                    >
                      <b
                        style={{
                          display: "block",
                          fontSize: 11,
                          marginBottom: 5,
                        }}
                      >
                        {msg.is_staff_reply ? "پشتیبانی" : "شما"}
                      </b>
                      {msg.message}
                      <small
                        style={{
                          display: "block",
                          marginTop: 5,
                          opacity: 0.72,
                        }}
                      >
                        {jalaliDate(msg.created_at, true)}
                      </small>
                    </div>
                  ))}
                </div>
                {activeTicket.status !== "CLOSED" && (
                  <div style={{ display: "flex", gap: 8 }}>
                    <textarea
                      rows="2"
                      value={reply}
                      onChange={(e) => setReply(e.target.value)}
                      placeholder="پاسخ خود را بنویسید..."
                      style={{ flex: 1 }}
                    />
                    <button className="btn btn-primary" onClick={sendReply}>
                      ارسال
                    </button>
                  </div>
                )}
              </div>
            </>,
            document.body,
          )}
      </div>
    );
  return (
    <div>
      <h2 className="section-title">درخواست‌های مرجوعی</h2>
      <p className="section-sub">
        ثبت مرجوعی برای سفارش تحویل‌شده از جزئیات سفارش انجام می‌شود.
      </p>
      {items.map((x) => (
        <div className="addr-card" key={x.id}>
          <div>
            <b>سفارش {x.order_number}</b>
            <p>{x.reason}</p>
            <small>{jalaliDate(x.created_at, true)}</small>
          </div>
          <span>{x.status}</span>
        </div>
      ))}
    </div>
  );
}

