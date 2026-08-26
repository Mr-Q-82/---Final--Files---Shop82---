function Notifications() {
  const [items, setItems] = useState([]),
    [users, setUsers] = useState([]),
    [message, setMessage] = useState(""),
    [deleteTarget, setDeleteTarget] = useState(null);
  const load = () =>
    Promise.all([
      apiAll("/auth/admin/notifications/?page_size=100"),
      apiAll("/auth/admin/users/?page_size=100"),
    ]).then(([n, u]) => {
      setItems(n.results || n);
      setUsers(u.results || u);
    });
  useEffect(() => {
    load();
  }, []);
  const send = async (e) => {
    e.preventDefault();
    const form = e.currentTarget,
      f = new FormData(form);
    try {
      const r = await api("/auth/admin/notifications/", {
        method: "POST",
        body: JSON.stringify({
          title: f.get("title"),
          message: f.get("message"),
          user: f.get("user") || null,
        }),
      });
      setMessage(r.message);
      form.reset();
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };
  const grouped = items.filter(
    (n, i, rows) =>
      !n.broadcast_id ||
      rows.findIndex((x) => x.broadcast_id === n.broadcast_id) === i,
  );
  const remove = async () => {
    if (!deleteTarget) return;
    try {
      await api(`/auth/admin/notifications/${deleteTarget.id}/`, {
        method: "DELETE",
      });
      setDeleteTarget(null);
      setMessage("اعلان برای همه گیرندگان حذف شد.");
      load();
    } catch (err) {
      setMessage(err.message);
    }
  };
  return (
    <>
      <div className="grid">
        <form className="card glass" onSubmit={send}>
          <h2>ارسال اعلان</h2>
          <div className="field">
            <label>گیرنده</label>
            <select name="user">
              <option value="">همه کاربران</option>
              {users.map((u) => (
                <option value={u.id} key={u.id}>
                  {u.full_name || displayPhone(u.phone)}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label>عنوان</label>
            <input name="title" required />
          </div>
          <div className="field">
            <label>متن پیام</label>
            <textarea name="message" rows="5" required />
          </div>
          {message && <div className="pill green">{message}</div>}
          <button className="primary" style={{ marginTop: 12 }}>
            ارسال پیام
          </button>
        </form>
        <section className="card glass">
          <h2>آخرین اعلان‌ها</h2>
          {grouped.slice(0, 20).map((n) => (
            <div className="status-row" key={n.id}>
              <p>
                <b>{n.title}</b>
                <small>{n.message}</small>
              </p>
              <button
                className="actions"
                style={{ color: "var(--danger)" }}
                onClick={() => setDeleteTarget(n)}
              >
                ⌫
              </button>
            </div>
          ))}
        </section>
      </div>
      {deleteTarget && (
        <div className="modal-bg" onMouseDown={() => setDeleteTarget(null)}>
          <section
            className="modal glass confirm-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon">⌫</div>
            <h2>حذف اعلان</h2>
            <p>
              این اعلان حذف شود؟
              {deleteTarget.broadcast_id && (
                <>
                  <br />
                  با تأیید، اعلان برای همه گیرندگان حذف می‌شود.
                </>
              )}
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
