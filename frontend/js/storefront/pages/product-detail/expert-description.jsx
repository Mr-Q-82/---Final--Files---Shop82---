function ProductExpertDescription({ product }) {
  const specs = Object.entries(product.specs || {});
  return <div className="expert-description">
    <header><span>بررسی تخصصی</span><h2>{product.name}</h2><p>{product.description || product.shortDescription || `این محصول از گزینه‌های منتخب دسته ${product.catName} است.`}</p></header>
    <section><h3>تحلیل عملکرد و کاربرد</h3><p>{product.name} از برند {product.brand} برای کاربرانی طراحی شده که کیفیت ساخت، عملکرد پایدار و سازگاری را در اولویت قرار می‌دهند. مشخصات ثبت‌شده نشان می‌دهد این مدل در رده {product.catName} قرار می‌گیرد و برای انتخاب نهایی باید نوع استفاده، تجهیزات فعلی و نیاز آینده خود را نیز در نظر بگیرید.</p></section>
    <div className="expert-spec-grid">{specs.map(([key, value]) => <div key={key}><small>{key}</small><strong>{String(value)}</strong><p>این ویژگی روی سازگاری، تجربه استفاده یا سطح عملکرد محصول اثرگذار است.</p></div>)}</div>
    <section><h3>جمع‌بندی پیش از خرید</h3><p>پیش از ثبت سفارش، ابعاد، نوع اتصال، سازگاری قطعات، شرایط گارانتی و لوازم داخل بسته را با نیاز خود تطبیق دهید. قیمت نهایی نیز براساس رنگ، تنوع، روش ارسال و تخفیف فعال محاسبه می‌شود.</p></section>
  </div>;
}

