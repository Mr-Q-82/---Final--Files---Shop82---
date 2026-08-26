function NotificationCenter() {
  const { notifications, setNotifications, toast, nav } = useStore();
  const [deleteTarget, setDeleteTarget] = useState(null);
  const markRead = async (item) => {
    if (item.is_read) return;
    try {
      const updated = await accountApi(
        `/auth/notifications/${item.id}/mark_read/`,
        { method: "POST" },
      );
      setNotifications(
        notifications.map((n) => (n.id === updated.id ? updated : n)),
      );
    } catch (err) {
      toast(err.message, "error");
    }
  };
  const remove = async () => {
    const item = deleteTarget;
    if (!item) return;
    try {
      await accountApi(`/auth/notifications/${item.id}/`, { method: "DELETE" });
      setNotifications(notifications.filter((n) => n.id !== item.id));
      setDeleteTarget(null);
      toast("اعلان حذف شد");
    } catch (err) {
      toast(err.message, "error");
    }
  };
  const follow = async (item) => {
    await markRead(item);
    if (!item.target_section) return;
    if (item.target_section === "tickets" && item.target_id)
      sessionStorage.setItem("open_ticket_id", item.target_id);
    nav("profile", item.target_section);
  };
  return (
    <div>
      <h2 className="section-title">اعلان‌های من</h2>
      <p className="section-sub">پیام‌های فروشگاه</p>
      {!notifications.length && (
        <div
          className="glass"
          style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
        >
          اعلانی ندارید
        </div>
      )}
      {notifications.map((item) => (
        <div
          className="addr-card"
          key={item.id}
          style={{ opacity: item.is_read ? 0.72 : 1 }}
        >
          <div
            onClick={() => item.target_section && follow(item)}
            style={{
              cursor: item.target_section ? "pointer" : "default",
              flex: 1,
            }}
          >
            <b>
              {!item.is_read && "● "}
              {item.title}
            </b>
            <p style={{ fontSize: 13, color: "var(--text-soft)" }}>
              {item.message}
            </p>
            <small style={{ color: "var(--muted)" }}>
              {jalaliDate(item.created_at, true)}{" "}
              {item.target_section ? "· مشاهده جزئیات ←" : ""}
            </small>
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            {!item.is_read && (
              <button className="btn btn-ghost" onClick={() => markRead(item)}>
                خوانده شد
              </button>
            )}
            <button
              className="btn btn-ghost"
              style={{ color: "var(--danger)" }}
              onClick={() => setDeleteTarget(item)}
            >
              حذف
            </button>
          </div>
        </div>
      ))}
      {deleteTarget &&
        ReactDOM.createPortal(
          <>
            <div
              className="overlay"
              style={{ zIndex: 2147483646 }}
              onClick={() => setDeleteTarget(null)}
            />
            <div
              className="glass"
              style={{
                position: "fixed",
                inset: "50% auto auto 50%",
                transform: "translate(-50%,-50%)",
                zIndex: 2147483647,
                padding: 25,
                width: "min(420px,92vw)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  width: 58,
                  height: 58,
                  display: "grid",
                  placeItems: "center",
                  margin: "0 auto 14px",
                  borderRadius: 18,
                  color: "var(--danger)",
                  background: "rgba(239,68,68,.12)",
                  fontSize: 26,
                }}
              >
                ⌫
              </div>
              <h3>حذف اعلان</h3>
              <p style={{ color: "var(--text-soft)" }}>این اعلان حذف شود؟</p>
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  gap: 9,
                  marginTop: 20,
                }}
              >
                <button
                  className="btn btn-ghost"
                  onClick={() => setDeleteTarget(null)}
                >
                  انصراف
                </button>
                <button
                  className="btn btn-primary"
                  style={{ background: "var(--danger)" }}
                  onClick={remove}
                >
                  بله، حذف شود
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

