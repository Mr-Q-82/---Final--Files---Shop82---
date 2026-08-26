function Users() {
  const [items, setItems] = useState([]),
    [loading, setLoading] = useState(true),
    [modal, setModal] = useState(false);
  const [editing, setEditing] = useState(null),
    [deleteTarget, setDeleteTarget] = useState(null),
    [error, setError] = useState("");
  const load = () =>
    apiAll("/auth/admin/users/?page_size=100")
      .then((r) => setItems(r.results || r))
      .finally(() => setLoading(false));
  useEffect(() => {
    load();
  }, []);
  const open = (u) => {
    setEditing(u || null);
    setModal(true);
    setError("");
  };
  const save = async (e) => {
    e.preventDefault();
    if (!formValidator.validateForm(e.currentTarget)) {
      setError("لطفاً فیلدهای مشخص‌شده را اصلاح کنید.");
      return;
    }
    const f = new FormData(e.currentTarget);
    const body = {
      phone: f.get("phone"),
      first_name: f.get("first_name"),
      last_name: f.get("last_name"),
      email: f.get("email") || null,
      national_id: f.get("national_id"),
      role: f.get("role"),
      is_active: f.has("is_active"),
      is_staff: ["STAFF", "ADMIN"].includes(f.get("role")),
      is_verified: f.has("is_verified"),
    };
    if (f.get("password")) body.password = f.get("password");
    try {
      await api("/auth/admin/users/" + (editing ? editing.id + "/" : ""), {
        method: editing ? "PATCH" : "POST",
        body: JSON.stringify(body),
      });
      setModal(false);
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/auth/admin/users/${deleteTarget.id}/`, { method: "DELETE" });
      setDeleteTarget(null);
      load();
    } catch (err) {
      setError(err.message);
    }
  };
  if (loading) return <div className="loading"></div>;
  return (
    <>
      <div className="toolbar">
        <button
          className="add"
          style={{ padding: 12 }}
          onClick={() => open(null)}
        >
          + افزودن کاربر
        </button>
        <button
          className="secondary"
          onClick={() =>
            downloadFile("/dashboard/export/customers/", "customers.csv")
          }
        >
          خروجی CSV مشتریان
        </button>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="table-card glass">
        <table>
          <thead>
            <tr>
              <th>موبایل</th>
              <th>نام</th>
              <th>نقش</th>
              <th>تأیید</th>
              <th>وضعیت</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((u) => (
              <tr key={u.id}>
                <td>
                  <b>{displayPhone(u.phone)}</b>
                </td>
                <td>{u.full_name || "—"}</td>
                <td>{u.role}</td>
                <td>
                  <span
                    className={"pill " + (u.is_verified ? "green" : "yellow")}
                  >
                    {u.is_verified ? "تأییدشده" : "تأییدنشده"}
                  </span>
                </td>
                <td>
                  <span className={"pill " + (u.is_active ? "green" : "red")}>
                    {u.is_active ? "فعال" : "مسدود"}
                  </span>
                </td>
                <td>
                  <div className="actions">
                    <button onClick={() => open(u)}>✎</button>
                    <button
                      onClick={async () => {
                        await api(`/auth/admin/users/${u.id}/toggle_active/`, {
                          method: "POST",
                        });
                        load();
                      }}
                    >
                      {u.is_active ? "⊘" : "✓"}
                    </button>
                    <button
                      style={{ color: "var(--danger)" }}
                      onClick={() => setDeleteTarget(u)}
                    >
                      ⌫
                    </button>
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
              <h2>{editing ? "ویرایش کاربر" : "افزودن کاربر"}</h2>
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
                <label>نام</label>
                <input name="first_name" defaultValue={editing?.first_name} />
              </div>
              <div className="field">
                <label>نام خانوادگی</label>
                <input name="last_name" defaultValue={editing?.last_name} />
              </div>
              <div className="field">
                <label>شماره موبایل</label>
                <input
                  name="phone"
                  dir="ltr"
                  defaultValue={displayPhone(editing?.phone)}
                  required
                />
              </div>
              <div className="field">
                <label>ایمیل</label>
                <input name="email" dir="ltr" defaultValue={editing?.email} />
              </div>
              <div className="field">
                <label>کد ملی</label>
                <input
                  name="national_id"
                  dir="ltr"
                  defaultValue={editing?.national_id}
                />
              </div>
              <div className="field">
                <label>نقش</label>
                <select name="role" defaultValue={editing?.role || "CUSTOMER"}>
                  <option value="CUSTOMER">مشتری</option>
                  <option value="STAFF">کارمند</option>
                  <option value="ADMIN">مدیر</option>
                </select>
              </div>
              <div className="field full">
                <label>{editing ? "رمز جدید (اختیاری)" : "رمز عبور"}</label>
                <input name="password" type="password" required={!editing} />
              </div>
            </div>
            <label>
              <input
                name="is_active"
                type="checkbox"
                defaultChecked={editing?.is_active ?? true}
              />{" "}
              فعال
            </label>{" "}
            <label>
              <input
                name="is_verified"
                type="checkbox"
                defaultChecked={editing?.is_verified ?? true}
              />{" "}
              تأییدشده
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
      {deleteTarget && (
        <div className="modal-bg" onMouseDown={() => setDeleteTarget(null)}>
          <section
            className="modal glass confirm-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon">⌫</div>
            <h2>حذف حساب</h2>
            <p>
              حساب «{deleteTarget.full_name || displayPhone(deleteTarget.phone)}
              » حذف شود؟
              <br />
              سابقه سفارش‌ها برای گزارش مالی حفظ و اطلاعات ورود غیرفعال می‌شود.
            </p>
            <div className="confirm-actions">
              <button
                className="secondary"
                onClick={() => setDeleteTarget(null)}
              >
                انصراف
              </button>
              <button className="danger-btn" onClick={remove}>
                بله، حذف شود
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
