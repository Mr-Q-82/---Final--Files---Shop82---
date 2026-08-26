function Discounts() {
  const [items, setItems] = useState([]),
    [modal, setModal] = useState(false),
    [editing, setEditing] = useState(null),
    [error, setError] = useState("");
  const load = () =>
    apiAll("/orders/discounts/?page_size=100").then((r) =>
      setItems(r.results || r),
    );
  useEffect(() => {
    load();
  }, []);
  const save = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    try {
      const body = {
        code: f.get("code").trim().toUpperCase(),
        percent: Number(f.get("percent") || 0),
        fixed_amount: Number(f.get("fixed_amount") || 0),
        min_purchase: Number(f.get("min_purchase") || 0),
        usage_limit: Number(f.get("usage_limit") || 0),
        starts_at: jalaliToIso(f.get("starts_at")),
        expires_at: jalaliToIso(f.get("expires_at")),
        is_active: f.has("is_active"),
      };
      await api("/orders/discounts/" + (editing ? editing.id + "/" : ""), {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setModal(false);
      setEditing(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const open = (item) => {
    setEditing(item || null);
    setError("");
    setModal(true);
  };
  const removeDiscount = async (item) => {
    if (
      !(await siteConfirm(
        `آیا از حذف کد تخفیف «${item.code}» مطمئن هستید؟`,
        "حذف کد تخفیف",
      ))
    )
      return;
    try {
      await api(`/orders/discounts/${item.id}/`, { method: "DELETE" });
      await load();
    } catch (err) {
      setError(err.message);
    }
  };
  return (
    <>
      <div className="toolbar">
        <button className="add" style={{ padding: 12 }} onClick={() => open()}>
          + ساخت کد تخفیف
        </button>
      </div>
      <div className="table-card glass">
        <table>
          <thead>
            <tr>
              <th>کد</th>
              <th>درصد</th>
              <th>مبلغ ثابت</th>
              <th>شروع شمسی</th>
              <th>انقضا شمسی</th>
              <th>استفاده</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td>
                  <b dir="ltr">{x.code}</b>
                </td>
                <td>{x.percent}٪</td>
                <td>{fmt(x.fixed_amount)}</td>
                <td>{jalaliDate(x.starts_at, true)}</td>
                <td>{jalaliDate(x.expires_at, true)}</td>
                <td>
                  {fmt(x.used_count)} / {x.usage_limit || "∞"}
                </td>
                <td>
                  <span className={"pill " + (x.is_active ? "green" : "red")}>
                    {x.is_active ? "فعال" : "غیرفعال"}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button onClick={() => open(x)}>✎</button>
                    <button onClick={() => removeDiscount(x)}>⌫</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {modal && (
        <div className="modal-bg">
          <form className="modal glass" onSubmit={save}>
            <div className="modal-header">
              <h2>{editing ? "ویرایش" : "ساخت"} کد تخفیف</h2>
              <button
                type="button"
                className="close"
                onClick={() => setModal(false)}
              >
                ×
              </button>
            </div>
            {error && <div className="error">{error}</div>}
            <div className="form-grid">
              <div className="field">
                <label>کد</label>
                <input
                  name="code"
                  dir="ltr"
                  defaultValue={editing?.code}
                  required
                />
              </div>
              <div className="field">
                <label>درصد تخفیف</label>
                <input
                  name="percent"
                  type="number"
                  min="0"
                  max="100"
                  defaultValue={editing?.percent || 0}
                />
              </div>
              <div className="field">
                <label>مبلغ ثابت</label>
                <input
                  name="fixed_amount"
                  type="number"
                  defaultValue={editing?.fixed_amount || 0}
                />
              </div>
              <div className="field">
                <label>حداقل خرید</label>
                <input
                  name="min_purchase"
                  type="number"
                  defaultValue={editing?.min_purchase || 0}
                />
              </div>
              <div className="field">
                <label>محدودیت استفاده (۰ نامحدود)</label>
                <input
                  name="usage_limit"
                  type="number"
                  defaultValue={editing?.usage_limit || 0}
                />
              </div>
              <div className="field">
                <label>شروع شمسی</label>
                <input
                  name="starts_at"
                  dir="ltr"
                  placeholder="۱۴۰۵/۰۵/۰۶ ۱۲:۳۰"
                  defaultValue={jalaliNumeric(editing?.starts_at)}
                />
              </div>
              <div className="field">
                <label>انقضای شمسی</label>
                <input
                  name="expires_at"
                  dir="ltr"
                  placeholder="۱۴۰۵/۰۶/۰۶ ۱۲:۳۰"
                  defaultValue={jalaliNumeric(editing?.expires_at)}
                />
              </div>
            </div>
            <label>
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={editing?.is_active ?? true}
              />{" "}
              فعال
            </label>
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
    </>
  );
}
