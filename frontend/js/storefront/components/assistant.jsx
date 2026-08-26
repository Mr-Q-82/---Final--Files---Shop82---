/* ============================================================
   AI ASSISTANT
   ============================================================ */
function AIAssistant() {
  const { nav, route } = useStore();
  const [open, setOpen] = useState(false);
  const [msgs, setMsgs] = useState([
    {
      from: "bot",
      text: "سلام! 👋 من دستیار هوشمند فروشگاه 82 هستم. چطور می‌تونم کمکتون کنم؟",
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [inp, setInp] = useState("");
  const bodyRef = useRef();
  useEffect(() => {
    bodyRef.current?.scrollTo(0, bodyRef.current.scrollHeight);
  }, [msgs, typing]);

  const answer = (q) => {
    q = q.toLowerCase();
    const visibleProducts =
      route.name === "gaming"
        ? ProductSelectors.gaming(PRODUCTS)
        : ProductSelectors.regular(PRODUCTS);
    const available = visibleProducts.filter((p) => p.stock > 0);
    const budgetMatch = latinDigits(q)
      .replace(/,/g, "")
      .match(/(\d{5,})/);
    const budget = budgetMatch ? Number(budgetMatch[1]) : 0;
    let candidates = available.filter((p) => {
      if (q.includes("لپ"))
        return (
          p.catName.includes("لپ") || p.name.toLowerCase().includes("laptop")
        );
      if (q.includes("گرافیک") || q.includes("gpu") || q.includes("گیم"))
        return (
          p.catName.includes("گرافیک") ||
          p.name.toLowerCase().includes("rtx") ||
          p.name.toLowerCase().includes("gpu")
        );
      if (q.includes("موبایل") || q.includes("گوشی"))
        return p.catName.includes("موبایل") || p.catName.includes("گوشی");
      if (q.includes("رم"))
        return p.catName.includes("رم") || p.name.toLowerCase().includes("ram");
      return true;
    });
    if (budget) candidates = candidates.filter((p) => p.finalPrice <= budget);
    candidates = [...candidates]
      .sort((a, b) => b.rate - a.rate || b.sold - a.sold)
      .slice(0, 3);
    const recommendation = () =>
      candidates.length
        ? `براساس کالاهای موجود، این گزینه‌ها مناسب‌اند: ${candidates.map((p) => `${p.name} (${fmt(p.finalPrice)} تومان)`).join("، ")}.`
        : "در حال حاضر کالای موجودی با این مشخصات پیدا نکردم؛ فیلترهای فروشگاه را کمی بازتر کنید.";
    if (q.includes("سلام") || q.includes("درود"))
      return "سلام! خوشحالم که اینجایید 😊 دنبال چه محصولی می‌گردید؟";
    if (q.includes("گیمینگ") || q.includes("بازی")) return recommendation();
    if (q.includes("لپ") || q.includes("laptop")) return recommendation();
    if (q.includes("ارسال"))
      return "ارسال عادی رایگان (برای خرید بالای ۵۰ میلیون)، سریع و ویژه هم داریم. زمان ارسال ۱ تا ۳ روز کاری است 🚚";
    if (q.includes("گارانتی"))
      return "همه محصولات دارای گارانتی اصالت و سلامت فیزیکی از ۱۲ تا ۲۴ ماه هستند 🛡️";
    if (q.includes("تخفیف") || q.includes("کد"))
      return "با کد TECH20 می‌تونید ۲۰٪ تخفیف بگیرید! 🎁 بخش تخفیف‌ها رو هم حتماً ببینید.";
    if (q.includes("پرداخت"))
      return "پرداخت از طریق درگاه امن بانکی انجام می‌شود و کاملاً امن است 💳";
    if (q.includes("قیمت")) return recommendation();
    if (q.includes("کارت گرافیک") || q.includes("gpu")) return recommendation();
    if (q.includes("پیشنهاد") || q.includes("چی بخر") || q.includes("محصول"))
      return recommendation();
    return (
      recommendation() +
      " اگر بودجه یا نوع استفاده‌تان را بگویید، پیشنهاد دقیق‌تری می‌دهم."
    );
  };
  const send = (text) => {
    const t = text || inp;
    if (!t.trim()) return;
    setMsgs((m) => [...m, { from: "me", text: t }]);
    setInp("");
    setTyping(true);
    setTimeout(
      () => {
        setTyping(false);
        setMsgs((m) => [...m, { from: "bot", text: answer(t) }]);
      },
      1000 + rnd(0, 600),
    );
  };
  const quick = [
    "محصولات گیمینگ",
    "هزینه ارسال چقدره؟",
    "کد تخفیف دارید؟",
    "گارانتی محصولات",
  ];

  return (
    <>
      <button className="ai-fab" onClick={() => setOpen((o) => !o)}>
        {open ? (
          <I.x className="icon" />
        ) : (
          <I.bot className="icon" style={{ width: 28, height: 28 }} />
        )}
      </button>
      {open && (
        <div className="ai-win glass">
          <div className="ai-head">
            <I.bot className="icon" style={{ width: 26, height: 26 }} />
            <div>
              <b>دستیار هوشمند</b>
              <div style={{ fontSize: 11, opacity: 0.9 }}>
                آنلاین · پاسخگوی شما
              </div>
            </div>
          </div>
          <div className="ai-body" ref={bodyRef}>
            {msgs.map((m, i) => (
              <div
                key={i}
                className={"msg " + (m.from === "bot" ? "bot" : "me")}
              >
                {m.text}
              </div>
            ))}
            {typing && (
              <div className="typing">
                <span></span>
                <span></span>
                <span></span>
              </div>
            )}
          </div>
          <div className="ai-quick">
            {quick.map((q) => (
              <button key={q} onClick={() => send(q)}>
                {q}
              </button>
            ))}
          </div>
          <div className="ai-input">
            <input
              value={inp}
              onChange={(e) => setInp(e.target.value)}
              placeholder="پیام خود را بنویسید..."
              onKeyDown={(e) => {
                if (e.key === "Enter") send();
              }}
            />
            <button
              className="btn btn-primary"
              style={{ padding: "0 16px" }}
              onClick={() => send()}
            >
              <I.send className="icon" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
