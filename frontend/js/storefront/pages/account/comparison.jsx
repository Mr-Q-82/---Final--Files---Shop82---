/* ============================================================
   PROFILE PAGE
   ============================================================ */
function ComparisonPanel() {
  const { toast } = useStore();
  const [items, setItems] = useState([]),
    [hideSame, setHideSame] = useState(false);
  const load = () =>
    accountApi("/catalog/comparison/?page_size=10")
      .then((data) => setItems(data.results || data))
      .catch((err) => toast(err.message, "error"));
  useEffect(() => {
    load();
  }, []);
  const remove = async (item) => {
    await accountApi(`/catalog/comparison/${item.id}/`, { method: "DELETE" });
    load();
  };
  const specKeys = [
    ...new Set(
      items.flatMap((x) => Object.keys(x.product_detail.specifications || {})),
    ),
  ];
  const rows = specKeys.filter(
    (key) =>
      !hideSame ||
      new Set(
        items.map((x) =>
          String((x.product_detail.specifications || {})[key] || "—"),
        ),
      ).size > 1,
  );
  return (
    <div>
      <h2 className="section-title">مقایسه محصولات</h2>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 14,
        }}
      >
        <p className="section-sub" style={{ margin: 0 }}>
          مقایسه ۲ تا ۴ محصول
        </p>
        <label>
          <input
            type="checkbox"
            checked={hideSame}
            onChange={(e) => setHideSame(e.target.checked)}
          />{" "}
          مخفی‌کردن شباهت‌ها
        </label>
      </div>
      {!items.length ? (
        <div
          className="glass"
          style={{ padding: 35, textAlign: "center", color: "var(--muted)" }}
        >
          محصولی برای مقایسه انتخاب نشده است.
        </div>
      ) : (
        <div style={{ overflowX: "auto" }}>
          <table className="spec-table">
            <tbody>
              <tr>
                <td>محصول</td>
                {items.map((x) => (
                  <td key={x.id}>
                    <b>{x.product_detail.name}</b>
                    <button
                      className="btn btn-ghost"
                      style={{ display: "block", marginTop: 8 }}
                      onClick={() => remove(x)}
                    >
                      حذف
                    </button>
                  </td>
                ))}
              </tr>
              <tr>
                <td>قیمت</td>
                {items.map((x) => (
                  <td key={x.id}>
                    {fmt(Number(x.product_detail.final_price))} تومان
                  </td>
                ))}
              </tr>
              <tr>
                <td>امتیاز</td>
                {items.map((x) => (
                  <td key={x.id}>{x.product_detail.rating} از ۵</td>
                ))}
              </tr>
              <tr>
                <td>گارانتی</td>
                {items.map((x) => (
                  <td key={x.id}>{x.product_detail.warranty || "—"}</td>
                ))}
              </tr>
              {rows.map((key) => (
                <tr key={key}>
                  <td>
                    <b>{key}</b>
                  </td>
                  {items.map((x) => {
                    const different =
                      new Set(
                        items.map((row) =>
                          String(
                            (row.product_detail.specifications || {})[key] ||
                              "—",
                          ),
                        ),
                      ).size > 1;
                    return (
                      <td
                        key={x.id}
                        style={
                          different
                            ? { color: "var(--primary)", fontWeight: 700 }
                            : {}
                        }
                      >
                        {String(
                          (x.product_detail.specifications || {})[key] || "—",
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

