function SiteSettings() {
  const [item, setItem] = useState(null),
    [loyalty, setLoyalty] = useState(null),
    [error, setError] = useState(""),
    [message, setMessage] = useState("");
  const load = () =>
    Promise.all([
      api("/catalog/site-settings/"),
      api("/auth/admin/loyalty-settings/"),
    ])
      .then(([site, club]) => {
        setItem((site.results || site)[0] || {});
        setLoyalty(club);
      })
      .catch((e) => setError(e.message));
  useEffect(() => {
    load();
  }, []);
  const saveSite = async (e) => {
    e.preventDefault();
    setError("");
    const form = new FormData(e.currentTarget);
    [
      "home_hero_enabled",
      "home_hero_autoplay",
      "home_hero_controls",
      "home_quick_links_enabled",
      "home_banners_enabled",
      "home_categories_enabled",
      "home_brands_enabled",
      "home_recommendations_enabled",
      "home_services_enabled",
      "gaming_hero_enabled",
      "gaming_hero_autoplay",
      "gaming_hero_controls",
      "gaming_heading_enabled",
      "gaming_banners_enabled",
      "gaming_categories_enabled",
      "gaming_brands_enabled",
      "gaming_deals_enabled",
      "gaming_top_rated_enabled",
      "gaming_value_enabled",
      "gaming_best_sellers_enabled",
      "gaming_newest_enabled",
      "gaming_catalog_enabled",
    ].forEach((name) => form.set(name, form.has(name) ? "true" : "false"));
    if (!form.get("logo")?.size) form.delete("logo");
    if (!form.get("seo_social_image")?.size) form.delete("seo_social_image");
    if (!form.get("mega_promo_image")?.size) form.delete("mega_promo_image");
    [
      "hero_laptop_image",
      "hero_components_image",
      "hero_gaming_image",
      "hero_monitor_image",
      "hero_audio_image",
    ].forEach(
      (name) => {
        if (!form.get(name)?.size) form.delete(name);
      },
    );
    try {
      const updated = await api(
        "/catalog/site-settings/" + (item.id ? item.id + "/" : ""),
        { method: item.id ? "PATCH" : "POST", body: form },
      );
      setItem(updated);
      setMessage("تنظیمات سایت و SEO ذخیره شد.");
    } catch (err) {
      setError(err.message);
    }
  };
  const saveLoyalty = async (e) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget),
      body = {
        purchase_step_amount: Number(f.get("purchase_step_amount")),
        points_per_step: Number(f.get("points_per_step")),
        toman_per_point: Number(f.get("toman_per_point")),
        min_redeem_points: Number(f.get("min_redeem_points")),
        invited_user_bonus: Number(f.get("invited_user_bonus")),
        inviter_bonus: Number(f.get("inviter_bonus")),
        silver_threshold: Number(f.get("silver_threshold")),
        gold_threshold: Number(f.get("gold_threshold")),
        is_active: f.has("is_active"),
      };
    try {
      setLoyalty(
        await api("/auth/admin/loyalty-settings/", {
          method: "PATCH",
          body: JSON.stringify(body),
        }),
      );
      setMessage("تنظیمات باشگاه مشتریان ذخیره شد.");
    } catch (err) {
      setError(err.message);
    }
  };
  if (!item || !loyalty) return <div className="loading"></div>;
  return (
    <div className="grid">
      <form className="card glass" onSubmit={saveSite}>
        <div className="card-head">
          <h2>هویت، متن‌ها و SEO سایت</h2>
          <span className="pill green">متصل به سایت اصلی</span>
        </div>
        {error && <div className="error">{error}</div>}
        {message && (
          <div className="pill green" style={{ marginBottom: 14 }}>
            {message}
          </div>
        )}
        <div className="form-grid">
          <div className="field">
            <label>نام سایت</label>
            <input
              name="site_name"
              defaultValue={item.site_name || "فروشگاه 82"}
              required
            />
          </div>
          <div className="field upload-box">
            <label>لوگوی سایت</label>
            <input name="logo" type="file" accept="image/*" />
            {item.logo && <img className="image-preview" src={item.logo} />}
          </div>
          <div className="field full">
            <label>عنوان SEO صفحه اصلی</label>
            <input
              name="seo_home_title"
              maxLength="180"
              defaultValue={item.seo_home_title}
            />
          </div>
          <div className="field full">
            <label>توضیحات SEO صفحه اصلی</label>
            <textarea
              name="seo_home_description"
              maxLength="320"
              defaultValue={item.seo_home_description}
            />
          </div>
          <div className="field upload-box">
            <label>تصویر اشتراک‌گذاری شبکه‌های اجتماعی</label>
            <input name="seo_social_image" type="file" accept="image/*" />
            {item.seo_social_image && (
              <img className="image-preview" src={item.seo_social_image} />
            )}
          </div>
          <div className="field">
            <label>کد Google Site Verification</label>
            <input
              name="google_site_verification"
              dir="ltr"
              defaultValue={item.google_site_verification}
              placeholder="فقط مقدار content"
            />
          </div>
          <div className="field">
            <label>کد Bing Webmaster Verification</label>
            <input name="bing_site_verification" dir="ltr" defaultValue={item.bing_site_verification} placeholder="فقط مقدار content" />
          </div>
          <div className="field"><label>نام فروشنده در فید محصولات</label><input name="merchant_name" defaultValue={item.merchant_name} /></div>
          <div className="field"><label>تلفن سازمان</label><input name="organization_phone" dir="ltr" defaultValue={item.organization_phone} /></div>
          <div className="field"><label>ایمیل سازمان</label><input name="organization_email" type="email" dir="ltr" defaultValue={item.organization_email} /></div>
          <div className="field full"><label>نشانی سازمان</label><input name="organization_address" defaultValue={item.organization_address} /></div>
          <div className="field full"><label>پیوند شبکه‌های اجتماعی (JSON)</label><textarea name="organization_social_links" dir="ltr" defaultValue={JSON.stringify(item.organization_social_links || [])} /></div>
          <div className="field"><label>هزینه ارسال پایه (تومان)</label><input name="shipping_cost" type="number" min="0" defaultValue={item.shipping_cost || 0} /></div>
          <div className="field"><label>حداقل زمان ارسال (روز)</label><input name="shipping_min_days" type="number" min="0" defaultValue={item.shipping_min_days || 1} /></div>
          <div className="field"><label>حداکثر زمان ارسال (روز)</label><input name="shipping_max_days" type="number" min="1" defaultValue={item.shipping_max_days || 5} /></div>
          <div className="field"><label>مهلت بازگشت (روز)</label><input name="return_window_days" type="number" min="0" defaultValue={item.return_window_days || 7} /></div>
          <div className="field full">
            <label>عنوان پیشنهاد داخل منوی دسته‌بندی</label>
            <input
              name="mega_promo_title"
              defaultValue={item.mega_promo_title}
            />
          </div>
          <div className="field full">
            <label>متن پیشنهاد داخل منوی دسته‌بندی</label>
            <textarea
              name="mega_promo_subtitle"
              defaultValue={item.mega_promo_subtitle}
            />
          </div>
          <div className="field full upload-box">
            <label>تصویر پیشنهاد داخل منوی دسته‌بندی</label>
            <input name="mega_promo_image" type="file" accept="image/*" />
            <small>
              تصویر به‌صورت خودکار هم‌اندازه کادر پیشنهاد نمایش داده می‌شود.
            </small>
            {item.mega_promo_image && (
              <img className="image-preview" src={item.mega_promo_image} />
            )}
          </div>
          <div className="field full admin-appearance-panel">
            <h3>چیدمان و اسلایدر صفحه اصلی</h3>
            <div className="form-grid">
              <label><input name="home_hero_enabled" type="checkbox" defaultChecked={item.home_hero_enabled ?? true} /> نمایش اسلایدر اصلی</label>
              <label><input name="home_hero_autoplay" type="checkbox" defaultChecked={item.home_hero_autoplay ?? true} /> تعویض خودکار اسلایدها</label>
              <label><input name="home_hero_controls" type="checkbox" defaultChecked={item.home_hero_controls ?? true} /> نمایش فلش‌ها و نقطه‌ها</label>
              <label><input name="home_quick_links_enabled" type="checkbox" defaultChecked={item.home_quick_links_enabled ?? true} /> نمایش پنج کارت زیر اسلایدر</label>
              <label><input name="home_banners_enabled" type="checkbox" defaultChecked={item.home_banners_enabled ?? true} /> نمایش بنرهای تبلیغاتی</label>
              <label><input name="home_categories_enabled" type="checkbox" defaultChecked={item.home_categories_enabled ?? true} /> نمایش دسته‌بندی محصولات</label>
              <label><input name="home_brands_enabled" type="checkbox" defaultChecked={item.home_brands_enabled ?? true} /> نمایش محبوب‌ترین برندها</label>
              <label><input name="home_recommendations_enabled" type="checkbox" defaultChecked={item.home_recommendations_enabled ?? true} /> نمایش پیشنهادهای شخصی</label>
              <label><input name="home_services_enabled" type="checkbox" defaultChecked={item.home_services_enabled ?? true} /> نمایش مزیت‌های خدمات فروشگاه</label>
              <div className="field"><label>زمان تعویض اسلایدر (ثانیه)</label><input name="home_hero_interval_seconds" type="number" min="2" max="60" defaultValue={item.home_hero_interval_seconds || 6} /></div>
              <div className="field"><label>عنوان پیشنهادهای شخصی</label><input name="home_recommendations_title" defaultValue={item.home_recommendations_title || "👀 بازدیدهای اخیر و محصولات مشابه"} /></div>
            </div>
          </div>
          <div className="field full admin-appearance-panel">
            <h3>متن کارت‌های سریع صفحه اصلی</h3>
            <div className="form-grid">
              {[
                ["laptop", "لپ‌تاپ‌ها", "کار، دانشگاه و بازی"],
                ["components", "قطعات حرفه‌ای", "ارتقای سیستم هوشمند"],
                ["gaming", "دنیای گیمینگ", "تجهیزات منتخب گیمرها"],
                ["monitor", "مانیتورها", "تصویر دقیق و حرفه‌ای"],
                ["audio", "هدفون و صدا", "تجربه صوتی فراگیر"],
              ].map(([key, title, subtitle]) => (
                <div className="admin-copy-pair" key={key}>
                  <div className="field"><label>عنوان {title}</label><input name={`home_${key}_title`} defaultValue={item[`home_${key}_title`] || title} /></div>
                  <div className="field"><label>زیرعنوان {title}</label><input name={`home_${key}_subtitle`} defaultValue={item[`home_${key}_subtitle`] || subtitle} /></div>
                </div>
              ))}
            </div>
          </div>
          <div className="field full admin-appearance-panel">
            <h3>چیدمان صفحه محصولات گیمینگ</h3>
            <div className="form-grid">
              <label><input name="gaming_hero_enabled" type="checkbox" defaultChecked={item.gaming_hero_enabled ?? true} /> نمایش اسلایدر گیمینگ</label>
              <label><input name="gaming_hero_autoplay" type="checkbox" defaultChecked={item.gaming_hero_autoplay ?? true} /> تعویض خودکار اسلایدها</label>
              <label><input name="gaming_hero_controls" type="checkbox" defaultChecked={item.gaming_hero_controls ?? true} /> نمایش کنترل‌های اسلایدر</label>
              <label><input name="gaming_heading_enabled" type="checkbox" defaultChecked={item.gaming_heading_enabled ?? true} /> نمایش عنوان معرفی صفحه</label>
              <label><input name="gaming_banners_enabled" type="checkbox" defaultChecked={item.gaming_banners_enabled ?? true} /> نمایش بنرها</label>
              <label><input name="gaming_categories_enabled" type="checkbox" defaultChecked={item.gaming_categories_enabled ?? true} /> نمایش دسته‌بندی‌ها</label>
              <label><input name="gaming_brands_enabled" type="checkbox" defaultChecked={item.gaming_brands_enabled ?? true} /> نمایش برندها</label>
              <label><input name="gaming_deals_enabled" type="checkbox" defaultChecked={item.gaming_deals_enabled ?? true} /> نمایش پیشنهادهای ویژه</label>
              <label><input name="gaming_top_rated_enabled" type="checkbox" defaultChecked={item.gaming_top_rated_enabled ?? true} /> نمایش منتخب گیمینگ</label>
              <label><input name="gaming_value_enabled" type="checkbox" defaultChecked={item.gaming_value_enabled ?? true} /> نمایش پیشنهاد تجهیزات</label>
              <label><input name="gaming_best_sellers_enabled" type="checkbox" defaultChecked={item.gaming_best_sellers_enabled ?? true} /> نمایش محبوب‌ترین‌ها</label>
              <label><input name="gaming_newest_enabled" type="checkbox" defaultChecked={item.gaming_newest_enabled ?? true} /> نمایش جدیدترین‌ها</label>
              <label><input name="gaming_catalog_enabled" type="checkbox" defaultChecked={item.gaming_catalog_enabled ?? true} /> نمایش فروشگاه و فیلترها</label>
              <div className="field"><label>زمان تعویض اسلایدر (ثانیه)</label><input name="gaming_hero_interval_seconds" type="number" min="2" max="60" defaultValue={item.gaming_hero_interval_seconds || 5} /></div>
              <div className="field"><label>برچسب بالای عنوان</label><input name="gaming_heading_kicker" defaultValue={item.gaming_heading_kicker || "🎮 GAMING ZONE"} /></div>
              <div className="field"><label>عنوان صفحه گیمینگ</label><input name="gaming_heading_title" defaultValue={item.gaming_heading_title || "دنیای محصولات گیمینگ"} /></div>
              <div className="field full"><label>توضیح صفحه گیمینگ</label><textarea name="gaming_heading_subtitle" defaultValue={item.gaming_heading_subtitle || "تجهیزات منتخب برای گیمرهایی که سرعت، دقت و قدرت واقعی می‌خواهند."} /></div>
              {[
                ["gaming_deals_title", "عنوان پیشنهادهای ویژه گیمینگ"],
                ["gaming_top_rated_title", "عنوان منتخب‌های گیمینگ"],
                ["gaming_value_title", "عنوان پیشنهاد تجهیزات"],
                ["gaming_best_sellers_title", "عنوان محبوب‌ترین محصولات"],
                ["gaming_newest_title", "عنوان جدیدترین تجهیزات"],
                ["gaming_catalog_title", "عنوان فروشگاه گیمینگ"],
              ].map(([name, label]) => <div className="field" key={name}><label>{label}</label><input name={name} defaultValue={item[name]} /></div>)}
            </div>
          </div>
          <div className="field"><label>عنوان بخش دسته‌بندی صفحه اصلی</label><input name="category_title" defaultValue={item.category_title} /></div>
          <div className="field"><label>زیرعنوان بخش دسته‌بندی صفحه اصلی</label><input name="category_subtitle" defaultValue={item.category_subtitle} /></div>
          {[
            ["hero_laptop_image", "تصویر کارت لپ‌تاپ‌ها"],
            ["hero_components_image", "تصویر کارت قطعات حرفه‌ای"],
            ["hero_gaming_image", "تصویر کارت دنیای گیمینگ"],
            ["hero_monitor_image", "تصویر کارت مانیتورها"],
            ["hero_audio_image", "تصویر کارت هدفون و صدا"],
          ].map(([name, label]) => (
            <div className="field upload-box" key={name}>
              <label>{label}</label>
              <input name={name} type="file" accept="image/png,image/jpeg,image/webp" />
              <small>پیشنهاد: تصویر افقی WebP با نسبت ۱۶:۹</small>
              {item[name] && <img className="image-preview" src={item[name]} alt={label} />}
            </div>
          ))}
          <div className="field full">
            <label>متن کپی‌رایت فوتر</label>
            <input name="footer_text" defaultValue={item.footer_text} />
          </div>
        </div>
        <button className="primary" style={{ width: "auto" }}>
          ذخیره تنظیمات و SEO
        </button>
      </form>
      <form className="card glass" onSubmit={saveLoyalty}>
        <div className="card-head">
          <h2>کنترل باشگاه مشتریان</h2>
          <span className="pill yellow">امتیاز و تبدیل به پول</span>
        </div>
        <div className="form-grid">
          <div className="field">
            <label>هر چند تومان خرید</label>
            <input
              name="purchase_step_amount"
              type="number"
              min="1"
              defaultValue={loyalty.purchase_step_amount}
            />
          </div>
          <div className="field">
            <label>چند امتیاز بدهد</label>
            <input
              name="points_per_step"
              type="number"
              min="0"
              defaultValue={loyalty.points_per_step}
            />
          </div>
          <div className="field">
            <label>ارزش هر امتیاز (تومان)</label>
            <input
              name="toman_per_point"
              type="number"
              min="1"
              defaultValue={loyalty.toman_per_point}
            />
          </div>
          <div className="field">
            <label>حداقل امتیاز تبدیل</label>
            <input
              name="min_redeem_points"
              type="number"
              min="1"
              defaultValue={loyalty.min_redeem_points}
            />
          </div>
          <div className="field">
            <label>پاداش کاربر دعوت‌شده</label>
            <input
              name="invited_user_bonus"
              type="number"
              min="0"
              defaultValue={loyalty.invited_user_bonus}
            />
          </div>
          <div className="field">
            <label>پاداش دعوت‌کننده</label>
            <input
              name="inviter_bonus"
              type="number"
              min="0"
              defaultValue={loyalty.inviter_bonus}
            />
          </div>
          <div className="field">
            <label>حد امتیاز سطح نقره‌ای</label>
            <input
              name="silver_threshold"
              type="number"
              min="1"
              defaultValue={loyalty.silver_threshold}
            />
          </div>
          <div className="field">
            <label>حد امتیاز سطح طلایی</label>
            <input
              name="gold_threshold"
              type="number"
              min="1"
              defaultValue={loyalty.gold_threshold}
            />
          </div>
        </div>
        <label>
          <input
            name="is_active"
            type="checkbox"
            defaultChecked={loyalty.is_active}
          />{" "}
          امتیازدهی خرید فعال باشد
        </label>
        <button className="primary" style={{ width: "auto", marginTop: 15 }}>
          ذخیره باشگاه مشتریان
        </button>
      </form>
    </div>
  );
}
