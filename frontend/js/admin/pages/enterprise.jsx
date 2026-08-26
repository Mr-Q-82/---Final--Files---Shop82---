function EnterpriseSuite() {
  const groups = {
    warehouses: {
      title: "انبارهای چندگانه",
      path: "/operations/warehouses/",
      fields: [
        ["name", "نام انبار"],
        ["code", "کد انبار"],
        ["address", "نشانی"],
      ],
    },
    shipping: {
      title: "قوانین ارسال",
      path: "/operations/shipping-rules/",
      fields: [
        ["title", "عنوان روش"],
        ["base_cost", "هزینه پایه", "number"],
        ["free_above", "ارسال رایگان از مبلغ", "number"],
        ["estimated_days", "زمان تحویل (روز)", "number"],
      ],
    },
    expenses: {
      title: "هزینه‌ها و مالی",
      path: "/operations/expenses/",
      fields: [
        ["title", "عنوان هزینه"],
        ["category", "دسته هزینه"],
        ["amount", "مبلغ", "number"],
        ["incurred_at", "تاریخ میلادی", "date"],
      ],
    },
    templates: {
      title: "قالب‌های پیام",
      path: "/operations/message-templates/",
      fields: [
        ["key", "کلید یکتا"],
        ["title", "عنوان"],
        ["subject", "موضوع"],
        ["body", "متن پیام", "textarea"],
      ],
    },
    guides: {
      title: "راهنمای خرید",
      path: "/catalog/buying-guides/",
      fields: [
        ["title", "عنوان"],
        ["slug", "نشانی انگلیسی"],
        ["summary", "خلاصه"],
        ["content", "محتوا", "textarea"],
      ],
    },
    missions: {
      title: "مأموریت‌های باشگاه",
      path: "/auth/loyalty-missions/",
      fields: [
        ["title", "عنوان مأموریت"],
        ["target", "هدف", "number"],
        ["reward_points", "امتیاز جایزه", "number"],
      ],
    },
    referrals: {
      title: "گزارش دعوت‌های موفق",
      path: "/auth/admin/referrals/",
      fields: [],
      readOnly: true,
    },
    redirects: {
      title: "ریدایرکت SEO",
      path: "/catalog/redirects/",
      fields: [
        ["source_path", "مسیر قدیمی"],
        ["destination_path", "مسیر جدید"],
        ["status_code", "کد وضعیت", "number"],
      ],
    },
  };
  const [tab, setTab] = useState("warehouses"),
    [items, setItems] = useState([]),
    [modal, setModal] = useState(false),
    [error, setError] = useState("");
  const cfg = groups[tab];
  const load = () =>
    apiAll(cfg.path + "?page_size=100")
      .then((r) => setItems(r.results || r))
      .catch((e) => setError(e.message));
  useEffect(() => {
    setItems([]);
    setError("");
    load();
  }, [tab]);
  const save = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      body = {};
    cfg.fields.forEach(
      ([key, _label, type]) =>
        (body[key] = type === "number" ? Number(f.get(key) || 0) : f.get(key)),
    );
    if (tab === "shipping") {
      body.method = "NORMAL";
      body.is_active = true;
    }
    if (tab === "templates") {
      body.channel = "NOTIFICATION";
      body.is_active = true;
    }
    if (tab === "guides") body.is_published = true;
    if (tab === "missions") {
      body.kind = "PURCHASE";
      body.is_active = true;
    }
    if (tab === "redirects") body.is_active = true;
    try {
      await api(cfg.path, { method: "POST", body: JSON.stringify(body) });
      setModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const remove = async (x) => {
    if (
      !(await siteConfirm(
        `«${x.title || x.name || x.key || x.source_path}» حذف شود؟`,
        "حذف مورد",
      ))
    )
      return;
    try {
      await api(cfg.path + x.id + "/", { method: "DELETE" });
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <section className="card glass" style={{ marginTop: 16 }}>
      <div className="card-head">
        <div>
          <h2>مدیریت یکپارچه امکانات حرفه‌ای</h2>
          <small>انبار، ارسال، مالی، پیام، وفاداری و SEO</small>
        </div>
        {!cfg.readOnly && (
          <button className="add" onClick={() => setModal(true)}>
            + افزودن
          </button>
        )}
      </div>
      <div
        className="toolbar"
        style={{ overflowX: "auto", flexWrap: "nowrap" }}
      >
        {Object.entries(groups).map(([key, value]) => (
          <button
            key={key}
            className={tab === key ? "primary" : "secondary"}
            style={{ width: "auto", whiteSpace: "nowrap" }}
            onClick={() => setTab(key)}
          >
            {value.title}
          </button>
        ))}
      </div>
      {error && <div className="error">{error}</div>}
      <div className="table-card">
        <table>
          <thead>
            <tr>
              <th>{tab === "referrals" ? "معرف" : cfg.title}</th>
              <th>{tab === "referrals" ? "کاربر دعوت‌شده" : "جزئیات"}</th>
              <th>تاریخ</th>
              <th>{tab === "referrals" ? "امتیاز معرف" : "عملیات"}</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td>
                  <b>{tab === "referrals" ? (x.inviter_name || "کاربر فروشگاه") : (x.title || x.name || x.key || x.source_path)}</b>
                  {tab === "referrals" && <small dir="ltr" style={{ display: "block" }}>{displayPhone(x.inviter_phone)}</small>}
                </td>
                <td>
                  {tab === "referrals" ? <><b>{x.invited_name || "کاربر فروشگاه"}</b><small dir="ltr" style={{ display: "block" }}>{displayPhone(x.invited_phone)}</small></> : (x.code ||
                    x.destination_path ||
                    x.category ||
                    x.subject ||
                    x.address ||
                    `${fmt(x.amount || x.base_cost || x.reward_points || 0)}`)}
                </td>
                <td>{jalaliDate(x.created_at, true)}</td>
                <td>
                  {tab === "referrals" ? <span className="pill green">+{fmt(x.inviter_points_awarded)} امتیاز</span> : <button className="danger-btn" onClick={() => remove(x)}>حذف</button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && !cfg.readOnly && (
        <div className="modal-bg" onMouseDown={() => setModal(false)}>
          <form
            className="modal glass"
            onSubmit={save}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>افزودن {cfg.title}</h2>
              <button
                type="button"
                className="close"
                onClick={() => setModal(false)}
              >
                ×
              </button>
            </div>
            <div className="form-grid">
              {cfg.fields.map(([key, label, type]) => (
                <div
                  className={"field " + (type === "textarea" ? "full" : "")}
                  key={key}
                >
                  <label>{label}</label>
                  {type === "textarea" ? (
                    <textarea name={key} rows="5" required />
                  ) : (
                    <input
                      name={key}
                      type={type || "text"}
                      min={type === "number" ? "0" : undefined}
                      required
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="save-row">
              <button
                type="button"
                className="secondary"
                onClick={() => setModal(false)}
              >
                انصراف
              </button>
              <button className="primary">ذخیره</button>
            </div>
          </form>
        </div>
      )}
    </section>
  );
}
