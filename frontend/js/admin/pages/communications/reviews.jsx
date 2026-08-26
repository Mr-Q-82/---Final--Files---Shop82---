function Reviews() {
  const [items, setItems] = useState([]),
    [error, setError] = useState("");
  const load = () =>
    apiAll("/catalog/admin/reviews/?page_size=100")
      .then((r) => setItems(r.results || r))
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const update = async (item, status) => {
    try {
      await api(`/catalog/admin/reviews/${item.id}/`, {
        method: "PATCH",
        body: JSON.stringify({ status }),
      });
      load();
    } catch (e) {
      setError(e.message);
    }
  };
  return (
    <>
      <div className="toolbar">
        <select
          onChange={(e) =>
            apiAll(
              "/catalog/admin/reviews/?page_size=100" +
                (e.target.value ? "&status=" + e.target.value : ""),
            ).then((r) => setItems(r.results || r))
          }
        >
          <option value="">همه نظرات</option>
          <option value="PENDING">در انتظار</option>
          <option value="APPROVED">تأییدشده</option>
          <option value="REJECTED">ردشده</option>
        </select>
      </div>
      {error && <div className="error">{error}</div>}
      <div className="table-card glass">
        <table>
          <thead>
            <tr>
              <th>محصول</th>
              <th>نام کاربر</th>
              <th>شماره موبایل</th>
              <th>امتیاز</th>
              <th>نظر</th>
              <th>وضعیت</th>
              <th>خریدار</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td>
                  <b>{x.product_name}</b>
                </td>
                <td>{x.user_name || "بدون نام"}</td>
                <td dir="ltr">{displayPhone(x.user_phone)}</td>
                <td>{x.rating} ★</td>
                <td>{x.comment}</td>
                <td>
                  <span
                    className={
                      "pill " +
                      (x.status === "APPROVED"
                        ? "green"
                        : x.status === "REJECTED"
                          ? "red"
                          : "yellow")
                    }
                  >
                    {x.status === "APPROVED"
                      ? "تأییدشده"
                      : x.status === "REJECTED"
                        ? "ردشده"
                        : "در انتظار بررسی"}
                  </span>
                </td>
                <td>{x.is_verified_purchase ? "✓" : "—"}</td>
                <td>
                  <div style={{ display: "flex", gap: 6 }}>
                    <button
                      className="secondary"
                      disabled={x.status === "APPROVED"}
                      style={{ color: "var(--success)" }}
                      onClick={() => update(x, "APPROVED")}
                    >
                      تأیید نظر
                    </button>
                    <button
                      className="secondary"
                      disabled={x.status === "REJECTED"}
                      style={{ color: "var(--danger)" }}
                      onClick={() => update(x, "REJECTED")}
                    >
                      رد نظر
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
