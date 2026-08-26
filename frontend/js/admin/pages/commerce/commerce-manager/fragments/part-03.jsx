                  }
                }}
              />
            </label>
          </>
        )}
      </div>
      {error && <div className="error">{error}</div>}
      <div className="table-card glass">
        <table>
          <thead>
            <tr>
              <th>{kind === "variants" ? "نام تنوع" : "عنوان فروش ویژه"}</th>
              <th>محصول</th>
              <th>
                {kind === "variants" ? "SKU / ویژگی‌ها" : "درصد / سقف فروش"}
              </th>
              <th>{kind === "variants" ? "قیمت و موجودی" : "شروع و پایان"}</th>
              <th>عملیات</th>
            </tr>
          </thead>
          <tbody>
            {items.map((x) => (
              <tr key={x.id}>
                <td>
                  <b>{x.title || x.name}</b>
                </td>
                <td>
                  {x.product_name ||
                    products.find((p) => p.id === x.product)?.name ||
                    "—"}
                </td>
                <td>
                  {kind === "variants" ? (
                    <>
                      <span dir="ltr">{x.sku}</span>
                      <small style={{ display: "block" }}>
                        {Object.entries(x.attributes || {})
                          .map(([k, v]) => `${k}: ${v}`)
                          .join("، ") || "بدون ویژگی"}
                      </small>
                    </>
                  ) : (
                    <>
                      {x.special_price
                        ? `${fmt(x.special_price)} تومان`
                        : `${fmt(x.discount_percent)}٪ تخفیف`}{" "}
                      · سقف {x.stock_limit ? fmt(x.stock_limit) : "تا موجودی"}
                    </>
                  )}
                </td>
                <td>
                  {kind === "variants" ? (
                    <>
                      {fmt(x.price)} تومان · {fmt(x.stock)} موجود
                    </>
                  ) : (
                    <>
                      {jalaliDate(x.starts_at, true)}
                      <br />
                      {jalaliDate(x.ends_at, true)}
                    </>
                  )}
                </td>
                <td>
                  <div className="actions">
                    {kind === "flash" && (
                      <button
                        className="table-action edit-action"
                        title="ویرایش فروش ویژه"
                        aria-label="ویرایش فروش ویژه"
                        onClick={() => add(x)}
                      >
                        <span aria-hidden="true">✎</span>
                        ویرایش
                      </button>
                    )}
                    <button
                      className="table-action delete-action"
                      title={`حذف ${kind === "variants" ? "تنوع" : "فروش ویژه"}`}
                      aria-label={`حذف ${kind === "variants" ? "تنوع" : "فروش ویژه"}`}
                      onClick={() => setDeleteTarget(x)}
                    >
                      <span aria-hidden="true">⌫</span>
                      حذف
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {deleteTarget && (
        <div className="modal-bg" onMouseDown={() => setDeleteTarget(null)}>
          <section
            className="modal glass confirm-modal"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="confirm-icon">🗑️</div>
            <h2>حذف {kind === "variants" ? "تنوع" : "فروش ویژه"}</h2>
            <p>
              آیا از حذف «{deleteTarget.name || deleteTarget.title}» مطمئن
              هستید؟ این عملیات قابل بازگشت نیست.
            </p>
            <div className="confirm-actions">
              <button
                className="secondary"
                onClick={() => setDeleteTarget(null)}
              >
                انصراف
              </button>
              <button className="danger-btn" onClick={removeCommerce}>
                بله، حذف شود
              </button>
            </div>
          </section>
        </div>
      )}
      {createModal && (
        <div
          className="modal-bg"
          onMouseDown={() => {
            setCreateModal(false);
            setEditingCommerce(null);
          }}
        >
          <form
            className="modal glass"
            onSubmit={saveCommerce}
            onMouseDown={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h2>
                {kind === "variants"
                  ? "افزودن تنوع محصول"
                  : editingCommerce
                    ? "ویرایش فروش ویژه"
                    : "ساخت فروش ویژه"}
              </h2>
              <button
                type="button"
                className="close"
                onClick={() => {
                  setCreateModal(false);
                  setEditingCommerce(null);
                }}
              >
                ×
              </button>
            </div>
            {kind === "flash" && !editingCommerce ? (
              <div className="field">
                <label>محصولات موردنظر را انتخاب کنید</label>
                <div className="flash-product-picker">
                  {products.map((p) => (
                    <label className="flash-product-option" key={p.id}>
                      <input
                        type="checkbox"
                        checked={selectedFlashProducts.includes(String(p.id))}
                        onChange={(event) =>
                          setSelectedFlashProducts((current) =>
                            event.target.checked
                              ? [...current, String(p.id)]
                              : current.filter((id) => id !== String(p.id)),
                          )
                        }
                      />
                      <span>
                        <b>{p.name}</b>
                        <small>
                          {p.sku} · موجودی {fmt(p.stock)}
                        </small>
                      </span>
                    </label>
                  ))}
                </div>
                <small className="field-hint">
                  {fmt(selectedFlashProducts.length)} محصول انتخاب شده است.
                </small>
              </div>
            ) : (
              <div className="field">
                <label>محصول موردنظر</label>
                <select
                  name="product"
                  defaultValue={editingCommerce?.product || ""}
                  required
                >
                  <option value="">محصول را انتخاب کنید</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {p.sku} — موجودی {fmt(p.stock)}
                    </option>
                  ))}
                </select>
              </div>
            )}
            {kind === "variants" ? (
              <div className="form-grid">
                <div className="field">
                  <label>نام تنوع</label>
                  <input
                    name="name"
                    placeholder="مثلاً مشکی ۲۵۶ گیگ"
                    required
                  />
                </div>
                <div className="field">
                  <label>کد SKU یکتا</label>
                  <input name="sku" dir="ltr" required />
                </div>
                <div className="field">
                  <label>قیمت (تومان)</label>
                  <input name="price" type="number" min="0" required />
                </div>
                <div className="field">
                  <label>موجودی همین تنوع</label>
                  <input name="stock" type="number" min="0" required />
                </div>
                <div className="field full">
                  <label>ویژگی‌ها؛ هر خط به شکل نام: مقدار</label>
                  <textarea
                    name="attributes"
                    rows="4"
                    placeholder={"رنگ: مشکی\nحافظه: ۲۵۶ گیگ\nگارانتی: ۱۸ ماهه"}
                  />
                </div>
              </div>
            ) : (
              <div className="form-grid">
                <div className="field full">
                  <label>عنوان کمپین</label>
                  <input
                    name="title"
                    placeholder="مثلاً شگفت‌انگیز آخر هفته"
                    defaultValue={editingCommerce?.title || ""}
                    required
                  />
                </div>
                <div className="field">
                  <label>درصد تخفیف؛ در صورت قیمت مستقیم اختیاری است</label>
                  <input
                    name="discount_percent"
                    type="number"
                    min="0"
                    max="100"
                    defaultValue={editingCommerce?.discount_percent || 0}
                  />
                </div>
                <div className="field">
                  <label>قیمت ویژه مستقیم (تومان)</label>
                  <input
                    name="special_price"
                    type="number"
                    min="1"
                    defaultValue={editingCommerce?.special_price || ""}
                    placeholder="مثلاً ۴۹۹۰۰۰۰"
                  />
                </div>
                <div className="field">
                  <label>سقف فروش؛ صفر یعنی تا سقف موجودی محصول</label>
                  <input
                    name="stock_limit"
                    type="number"
                    min="0"
                    max={
                      editingCommerce
                        ? (products.find(
                            (p) => p.id === editingCommerce.product,
                          )?.stock || 0) +
                          Number(editingCommerce.sold_count || 0)
                        : selectedFlashProducts.length
                          ? Math.min(
                              ...products
                                .filter((p) =>
                                  selectedFlashProducts.includes(String(p.id)),
                                )
                                .map((p) => Number(p.stock || 0)),
                            )
