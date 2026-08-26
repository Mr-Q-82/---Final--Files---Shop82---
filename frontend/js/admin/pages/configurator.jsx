function ProductConfiguratorManager() {
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [groups, setGroups] = useState([]);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [tab, setTab] = useState("usage");
  const load = () => Promise.all([
    apiAll("/catalog/categories/?page_size=100"),
    apiAll("/catalog/products/?page_size=100"),
    apiAll("/catalog/usage-profiles/?page_size=200"),
    apiAll("/catalog/customization-groups/?page_size=200"),
  ]).then(([c, p, u, g]) => {
    setCategories(c.results || c); setProducts(p.results || p);
    setProfiles(u.results || u); setGroups(g.results || g);
  });
  useEffect(() => { load().catch((e) => setError(e.message)); }, []);
  const submit = async (event, endpoint, transform = (value) => value) => {
    event.preventDefault(); setError(""); setMessage("");
    try {
      const values = Object.fromEntries(new FormData(event.currentTarget));
      await api(endpoint, { method: "POST", body: JSON.stringify(transform(values)) });
      event.currentTarget.reset(); setMessage("تغییرات با موفقیت ذخیره شد."); await load();
    } catch (e) { setError(e.message); }
  };
  const remove = async (endpoint, title) => {
    if (!(await siteConfirm(`«${title}» حذف شود؟`, "حذف تنظیمات"))) return;
    try { await api(endpoint, { method: "DELETE" }); await load(); }
    catch (e) { setError(e.message); }
  };
  const activeGroups = groups.filter((group) => group.is_active);
  return <div className="config-admin">
    <div className="config-admin-intro">
      <div><span>⚙</span><h2>مرکز کاربری و شخصی‌سازی کالا</h2><p>نوع استفاده، قطعات قابل انتخاب، اختلاف قیمت و موجودی هر انتخاب را مدیریت کنید.</p></div>
      <div className="config-admin-stats"><b>{fmt(profiles.length)}<small>نوع استفاده</small></b><b>{fmt(groups.length)}<small>گروه انتخاب</small></b><b>{fmt(groups.reduce((s,g)=>s+(g.options?.length||0),0))}<small>گزینه قابل سفارش</small></b></div>
    </div>
    <div className="config-tabs"><button className={tab === "usage" ? "active" : ""} onClick={() => setTab("usage")}>دسته‌بندی بر اساس کاربری</button><button className={tab === "options" ? "active" : ""} onClick={() => setTab("options")}>سازنده پیکربندی محصول</button></div>
    {error && <div className="error">{error}</div>}{message && <div className="success">{message}</div>}
    {tab === "usage" && <div className="config-admin-layout">
      <form className="config-editor" onSubmit={(e) => submit(e, "/catalog/usage-profiles/", (v) => ({...v, sort_order:Number(v.sort_order||0), is_active:true, product_ids:[...e.currentTarget.querySelector('[name=product_ids]').selectedOptions].map(o=>o.value)}))}>
        <h3>افزودن نوع استفاده</h3><p>برای هر دسته، فهرست عادی و گیمینگ مستقل است.</p>
        <label>دسته‌بندی<select name="category" required>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label>
        <label>محل نمایش<select name="catalog"><option value="NORMAL">فروشگاه عادی</option><option value="GAMING">فروشگاه گیمینگ</option></select></label>
        <label>عنوان<input name="name" required placeholder="مثلاً برنامه‌نویسی" /></label>
        <label>شناسه انگلیسی<input name="slug" required pattern="[A-Za-z0-9_-]+" placeholder="programming" /></label>
        <label>توضیح کوتاه<input name="description" placeholder="مناسب توسعه نرم‌افزار" /></label>
        <label>آیکن<input name="icon" placeholder="code" /></label>
        <label>محصولات منتخب<select name="product_ids" multiple>{products.map(p=><option value={p.id} key={p.id}>{p.name}</option>)}</select><small>اگر انتخابی نکنید، همه محصولات همان دسته نمایش داده می‌شوند.</small></label>
        <label>ترتیب<input name="sort_order" type="number" min="0" defaultValue="0" /></label><button className="add">ذخیره نوع استفاده</button>
      </form>
      <div className="config-list"><h3>انواع استفاده تعریف‌شده</h3>{profiles.map(item=><article key={item.id}><span>{item.icon || "✦"}</span><div><b>{item.name}</b><small>{item.category_name} · {item.catalog === "GAMING" ? "گیمینگ" : "عادی"}</small></div><button onClick={()=>remove(`/catalog/usage-profiles/${item.id}/`,item.name)}>حذف</button></article>)}</div>
    </div>}
    {tab === "options" && <div className="config-admin-layout wide">
      <div className="config-editor-stack">
        <form className="config-editor" onSubmit={(e)=>submit(e,"/catalog/customization-groups/",v=>({...v,sort_order:Number(v.sort_order||0),is_required:Boolean(v.is_required),applies_to_all_products:Boolean(v.applies_to_all_products),is_active:true}))}>
          <h3>۱. ساخت گروه انتخاب</h3><label>دسته‌بندی<select name="category" required>{categories.map(c=><option value={c.id} key={c.id}>{c.name}</option>)}</select></label><label>فروشگاه<select name="catalog"><option value="BOTH">هر دو</option><option value="NORMAL">عادی</option><option value="GAMING">گیمینگ</option></select></label><label>نام گروه<input name="name" required placeholder="حافظه RAM" /></label><label>کد<input name="code" required pattern="[A-Za-z0-9_-]+" placeholder="ram" /></label><label>راهنما<input name="help_text" /></label><label className="check"><input type="checkbox" name="is_required" defaultChecked /> انتخاب اجباری</label><label className="check"><input type="checkbox" name="applies_to_all_products" defaultChecked /> اعمال روی همه محصولات دسته</label><input name="sort_order" type="hidden" value="0" /><button className="add">ساخت گروه</button>
        </form>
        <form className="config-editor" onSubmit={(e)=>submit(e,"/catalog/customization-options/",v=>({...v,price_delta:Number(v.price_delta||0),stock:v.stock===""?null:Number(v.stock),sort_order:Number(v.sort_order||0),is_default:Boolean(v.is_default),is_active:true}))}>
          <h3>۲. افزودن گزینه به گروه</h3><label>گروه<select name="group" required>{activeGroups.map(g=><option value={g.id} key={g.id}>{g.category_name} / {g.name}</option>)}</select></label><label>عنوان گزینه<input name="name" required placeholder="۳۲ گیگابایت" /></label><label>مقدار فنی<input name="value" placeholder="32GB DDR5" /></label><label>اختلاف قیمت (تومان)<input name="price_delta" type="number" defaultValue="0" /></label><label>موجودی اختصاصی<input name="stock" type="number" min="0" placeholder="خالی = نامحدود" /></label><label>پسوند SKU<input name="sku_suffix" pattern="[A-Za-z0-9_-]*" /></label><label className="check"><input type="checkbox" name="is_default" /> انتخاب پیش‌فرض</label><input name="sort_order" type="hidden" value="0" /><button className="add">افزودن گزینه</button>
        </form>
      </div>
      <div className="config-list groups"><h3>ساختار فعلی پیکربندی</h3>{groups.map(group=><article className="config-group-admin" key={group.id}><header><div><b>{group.category_name} / {group.name}</b><small>{group.catalog === "BOTH" ? "هر دو فروشگاه" : group.catalog === "GAMING" ? "گیمینگ" : "عادی"}</small></div><button onClick={()=>remove(`/catalog/customization-groups/${group.id}/`,group.name)}>حذف گروه</button></header><div>{(group.options||[]).map(option=><span key={option.id}><b>{option.name}</b><small>{fmt(option.price_delta)} تومان · {option.stock===null?"نامحدود":`${fmt(option.stock)} موجود`}</small><button onClick={()=>remove(`/catalog/customization-options/${option.id}/`,option.name)}>×</button></span>)}</div></article>)}</div>
    </div>}
  </div>;
}
