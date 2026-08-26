function ProductQuestions({ product }) {
  const { user, nav, toast } = useStore();
  const [items, setItems] = useState([]), [question, setQuestion] = useState(""), [formOpen, setFormOpen] = useState(false), [replying, setReplying] = useState(null), [reply, setReply] = useState(""), [busy, setBusy] = useState(false);
  const samples = [
    { id: "sample-q-1", user_name: "علی", question: "آیا این محصول برای استفاده طولانی و کار حرفه‌ای مناسب است؟", answer: "بله؛ با توجه به مشخصات فنی محصول برای استفاده روزمره و حرفه‌ای مناسب است. برای انتخاب دقیق‌تر، نیازمندی سیستم خود را با جدول مشخصات تطبیق دهید.", replies: [] },
    { id: "sample-q-2", user_name: "مریم", question: "گارانتی و شرایط ارسال محصول چگونه است؟", answer: `این کالا با گارانتی ${product.warranty || "شرکتی"} عرضه می‌شود و روش ارسال را هنگام خرید می‌توانید انتخاب کنید.`, replies: [] },
    { id: "sample-q-3", user_name: "محمد", question: "آیا مشخصات و لوازم داخل بسته با توضیحات صفحه مطابقت دارد؟", answer: "محتویات بسته و مشخصات براساس اطلاعات ثبت‌شده در همین صفحه ارسال می‌شود؛ هنگام تحویل نیز امکان بررسی سلامت ظاهری بسته وجود دارد.", replies: [] },
  ];
  const load = () => accountApiAll(`/catalog/questions/?product=${product.apiId}&page_size=100`).then((data) => setItems(data.results || data)).catch(() => setItems([]));
  useEffect(() => { load(); }, [product.apiId]);
  const submitQuestion = async () => {
    if (!user) return nav("auth");
    if (question.trim().length < 5) return toast("متن پرسش کوتاه است.", "error");
    setBusy(true);
    try { await accountApi("/catalog/questions/", { method: "POST", body: JSON.stringify({ product: product.apiId, question }) }); setQuestion(""); setFormOpen(false); await load(); toast("پرسش شما ثبت شد."); }
    catch (err) { toast(err.message, "error"); } finally { setBusy(false); }
  };
  const submitReply = async (item) => {
    if (!user) return nav("auth");
    if (item.sample) return toast("پاسخ‌دادن برای پرسش‌های واقعی کاربران فعال است.");
    if (reply.trim().length < 2) return toast("متن پاسخ کوتاه است.", "error");
    setBusy(true);
    try { await accountApi(`/catalog/questions/${item.id}/reply/`, { method: "POST", body: JSON.stringify({ answer: reply }) }); setReply(""); setReplying(null); await load(); toast("پاسخ شما ثبت شد."); }
    catch (err) { toast(err.message, "error"); } finally { setBusy(false); }
  };
  const visibleItems = items.length ? items : samples;
  return <div className="product-community-section">
    <div className="community-head"><div><h3>پرسش‌های کاربران</h3><p>سؤال خود را بپرسید یا به تجربه دیگران کمک کنید</p></div><button className="btn btn-primary" onClick={() => user ? setFormOpen((open) => !open) : nav("auth")}>{formOpen ? "بستن فرم" : "+ افزودن پرسش جدید"}</button></div>
    {formOpen && <div className="glass community-form"><div className="field"><label>متن پرسش</label><textarea rows="4" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="پرسش خود درباره این محصول را کامل بنویسید" /></div><button className="btn btn-primary" disabled={busy} onClick={submitQuestion}>{busy ? "در حال ثبت..." : "ثبت پرسش"}</button></div>}
    <div className="community-list">{visibleItems.map((item) => <article className="community-card question-card" key={item.id}>
      <div className="question-author"><span className="community-avatar">{(item.user_name || "ک").slice(0, 1)}</span><div><b>{item.user_name || "کاربر فروشگاه 82"}</b><small>پرسش درباره {product.name}</small></div></div>
      <p className="question-text"><b>پرسش:</b> {item.question}</p>
      {item.answer && <div className="official-answer"><b>پاسخ فروشگاه 82</b><p>{item.answer}</p></div>}
      {(item.replies || []).map((answer) => <div className="user-answer" key={answer.id}><b>{answer.is_admin ? "پاسخ مدیر" : `پاسخ ${answer.user_name}`}</b><p>{answer.answer}</p></div>)}
      <button className="btn btn-ghost reply-button" onClick={() => user ? (setReplying(replying === item.id ? null : item.id), setReply("")) : nav("auth")}>پاسخ به این پرسش</button>
      {replying === item.id && <div className="inline-reply"><textarea rows="3" value={reply} onChange={(e) => setReply(e.target.value)} placeholder="پاسخ مفید و مرتبط بنویسید"/><button className="btn btn-primary" disabled={busy} onClick={() => submitReply(item)}>ارسال پاسخ</button></div>}
    </article>)}</div>
  </div>;
}

