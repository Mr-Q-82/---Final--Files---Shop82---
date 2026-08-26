function NewsletterManager() {
  const [members, setMembers] = useState([]),
    [campaigns, setCampaigns] = useState([]),
    [selectedMembers, setSelectedMembers] = useState([]),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");
  const load = () =>
    Promise.all([
      apiAll("/catalog/newsletter/?page_size=100"),
      apiAll("/catalog/newsletter-campaigns/?page_size=100"),
    ])
      .then(([m, c]) => {
        const memberRows = m.results || m;
        setMembers(memberRows);
        setSelectedMembers((current) =>
          current.filter((id) => memberRows.some((member) => member.id === id)),
        );
        setCampaigns(c.results || c);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const create = async (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    try {
      await api("/catalog/newsletter-campaigns/", {
        method: "POST",
        body: JSON.stringify({
          title: f.get("title"),
          message: f.get("message"),
        }),
      });
      form.reset();
      setMessage("خبر جدید ذخیره شد.");
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const send = async (item) => {
    if (!selectedMembers.length) {
      setError("حداقل یک عضو خبرنامه را انتخاب کنید.");
      return;
    }
    try {
      setError("");
      const result = await api(
        `/catalog/newsletter-campaigns/${item.id}/send/`,
        {
          method: "POST",
          body: JSON.stringify({ subscriber_ids: selectedMembers }),
        },
      );
      setMessage(`خبر برای ${fmt(result.sent_count)} ایمیل ارسال شد.`);
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const removeCampaign = async (item) => {
    if (!(await siteConfirm(`خبر «${item.title}» حذف شود؟`, "حذف خبر"))) return;
    try {
      await api(`/catalog/newsletter-campaigns/${item.id}/`, {
        method: "DELETE",
      });
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const removeMember = async (item) => {
    try {
      await api(`/catalog/newsletter/${item.id}/`, { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <>
      {error && <div className="error">{error}</div>}
      {message && (
        <div className="pill green" style={{ marginBottom: 12 }}>
          {message}
        </div>
      )}
      <div className="grid">
        <form className="card glass" onSubmit={create}>
          <div className="card-head">
            <h2>ساخت ایمیل خبرنامه</h2>
            <span>{fmt(members.length)} عضو ایمیلی</span>
          </div>
          <p style={{ color: "var(--soft)", fontSize: 11 }}>
            خبر را ذخیره کنید؛ گیرندگان را از جدول پایین انتخاب کنید و سپس ایمیل
            را ارسال کنید.
          </p>
          <div className="field">
            <label>عنوان ایمیل</label>
            <input name="title" required />
          </div>
          <div className="field">
            <label>متن خبر</label>
            <textarea name="message" rows="8" required />
          </div>
          <button className="primary">ذخیره خبر</button>
        </form>
        <section className="card glass">
          <div className="card-head">
            <h2>خبرهای آماده ارسال</h2>
          </div>
          {campaigns.map((x) => (
            <div className="status-row" key={x.id}>
              <p>
                <b>{x.title}</b>
                <small>
                  {x.sent_at
                    ? `ارسال‌شده برای ${fmt(x.sent_count)} نفر · ${jalaliDate(x.sent_at, true)}`
                    : "هنوز برای اعضا ارسال نشده"}
                </small>
              </p>
              <div className="actions">
                <button
                  className="secondary"
                  style={{ width: "auto" }}
                  onClick={() => send(x)}
                >
                  ارسال به {fmt(selectedMembers.length)} نفر انتخاب‌شده
                </button>
                <button onClick={() => removeCampaign(x)}>⌫</button>
              </div>
            </div>
          ))}
        </section>
      </div>
      <div className="table-card glass" style={{ marginTop: 14 }}>
        <table>
          <thead>
            <tr>
              <th>
                <label className="newsletter-select">
                  <input
                    type="checkbox"
                    checked={
                      members.length > 0 &&
                      selectedMembers.length === members.length
                    }
                    onChange={(event) =>
                      setSelectedMembers(
                        event.target.checked
                          ? members.map((member) => member.id)
                          : [],
                      )
                    }
                  />
                  همه
                </label>
              </th>
              <th>ایمیل عضو</th>
              <th>تاریخ عضویت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {members.map((x) => (
              <tr key={x.id}>
                <td>
                  <input
                    className="newsletter-checkbox"
                    type="checkbox"
                    checked={selectedMembers.includes(x.id)}
                    onChange={() =>
                      setSelectedMembers((current) =>
                        current.includes(x.id)
                          ? current.filter((id) => id !== x.id)
                          : [...current, x.id],
                      )
                    }
                    aria-label={`انتخاب ${x.email}`}
                  />
                </td>
                <td dir="ltr">
                  <b>{x.email}</b>
                </td>
                <td>{jalaliDate(x.created_at, true)}</td>
                <td>
                  <button
                    className="danger-btn"
                    onClick={() => removeMember(x)}
                  >
                    حذف
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
