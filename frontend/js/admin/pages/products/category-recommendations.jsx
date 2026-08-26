function CategoryRecommendations() {
  const [categories, setCategories] = useState([]),
    [products, setProducts] = useState([]),
    [items, setItems] = useState([]),
    [categoryId, setCategoryId] = useState(""),
    [productId, setProductId] = useState(""),
    [sortOrder, setSortOrder] = useState(0),
    [loading, setLoading] = useState(true),
    [saving, setSaving] = useState(false),
    [error, setError] = useState("");

  const load = () =>
    Promise.all([
      apiAll("/catalog/categories/?page_size=100"),
      apiAll("/catalog/products/?page_size=100"),
      apiAll("/catalog/category-recommendations/?page_size=200"),
    ])
      .then(([categoryData, productData, recommendationData]) => {
        setCategories(categoryData.results || categoryData);
        setProducts(productData.results || productData);
        setItems(recommendationData.results || recommendationData);
      })
      .finally(() => setLoading(false));

  useEffect(() => {
    load().catch((requestError) => setError(requestError.message));
  }, []);

  const availableProducts = products.filter(
    (product) => String(product.category) === String(categoryId),
  );
  const addRecommendation = async (event) => {
    event.preventDefault();
    if (!categoryId || !productId) {
      setError("ابتدا دسته‌بندی و محصول را انتخاب کنید.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await api("/catalog/category-recommendations/", {
        method: "POST",
        body: JSON.stringify({
          category: Number(categoryId),
          product: Number(productId),
          sort_order: Number(sortOrder) || 0,
          is_active: true,
        }),
      });
      setProductId("");
      setSortOrder(0);
      await load();
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setSaving(false);
    }
  };
  const removeRecommendation = async (item) => {
    if (!(await siteConfirm(`«${item.product_name}» از پیشنهادهای این دسته حذف شود؟`, "حذف پیشنهاد"))) return;
    try {
      await api(`/catalog/category-recommendations/${item.id}/`, { method: "DELETE" });
      setItems((current) => current.filter((row) => row.id !== item.id));
    } catch (requestError) {
      setError(requestError.message);
    }
  };

  if (loading) return <div className="loading"></div>;
  return (
    <div className="category-recommendations-admin">
      <section className="card glass recommendation-form-card">
        <div className="card-head">
          <div>
            <h3>افزودن پیشنهاد ویژه دسته‌بندی</h3>
            <small>محصول فقط در دسته‌بندی متعلق به خودش قابل انتخاب است.</small>
          </div>
          <span className="pill gaming">انتخاب دستی مدیر</span>
        </div>
        {error && <div className="error">{error}</div>}
        <form className="recommendation-form" onSubmit={addRecommendation}>
          <label>
            دسته‌بندی
            <select
              className="admin-select"
              value={categoryId}
              onChange={(event) => {
                setCategoryId(event.target.value);
                setProductId("");
              }}
            >
              <option value="">انتخاب دسته‌بندی</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>
          <label>
            محصول پیشنهادی
            <select className="admin-select" value={productId} onChange={(event) => setProductId(event.target.value)} disabled={!categoryId}>
              <option value="">انتخاب محصول</option>
              {availableProducts.map((product) => <option key={product.id} value={product.id}>{product.name}</option>)}
            </select>
          </label>
          <label>
            اولویت نمایش
            <input type="number" min="0" value={sortOrder} onChange={(event) => setSortOrder(event.target.value)} />
          </label>
          <button className="add" disabled={saving}>{saving ? "در حال افزودن..." : "+ افزودن پیشنهاد"}</button>
        </form>
      </section>

      <section className="table-card glass">
        <table>
          <thead><tr><th>دسته‌بندی</th><th>محصول پیشنهادی</th><th>نوع</th><th>اولویت</th><th>عملیات</th></tr></thead>
          <tbody>
            {items.length ? items.map((item) => (
              <tr key={item.id}>
                <td><b>{item.category_name}</b></td>
                <td>{item.product_name}</td>
                <td><span className={`pill ${item.product_is_gaming ? "gaming" : "green"}`}>{item.product_is_gaming ? "گیمینگ" : "معمولی"}</span></td>
                <td>{fmt(item.sort_order)}</td>
                <td><div className="actions"><button className="table-action delete-action" onClick={() => removeRecommendation(item)}>حذف</button></div></td>
              </tr>
            )) : <tr><td colSpan="5" className="empty">هنوز پیشنهادی برای دسته‌بندی‌ها ثبت نشده است.</td></tr>}
          </tbody>
        </table>
      </section>
    </div>
  );
}
