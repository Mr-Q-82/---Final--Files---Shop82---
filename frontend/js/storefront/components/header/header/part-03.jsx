                          <small>{fmt(selectedMegaStats.available)} موجود</small>
                          {selectedMegaStats.discounted > 0 && (
                            <small>{fmt(selectedMegaStats.discounted)} تخفیف‌دار</small>
                          )}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          nav("shop", selectedMegaCategory.id);
                          setMega(false);
                        }}
                      >
                        مشاهده همه <span aria-hidden="true">←</span>
                      </button>
                    </div>
                    <div className="mega-groups">
                      <div className="mega-col mega-group">
                        <h4><span className="mega-title-mark"></span>زیر‌دسته‌ها <small>{fmt(selectedMegaSubcategories.length)}</small></h4>
                        <a
                          className="mega-gaming-category-link"
                          href={gamingCategoryHref}
                          onClick={openSelectedGamingCategory}
                        >
                          🎮 محصولات گیمینگ {selectedMegaCategory.name}
                        </a>
                        <div className="mega-subcategory-list">
                        {selectedMegaSubcategories
                          .filter((sub) => !/گیم/i.test(String(sub)))
                          .map((sub) => (
                          <a
                            key={sub}
                            href={routePath("shop", selectedMegaCategory.id)}
                            onClick={(event) => {
                              event.preventDefault();
                              nav("shop", selectedMegaCategory.id);
                              setMega(false);
                            }}
                          >
                            {sub}
                          </a>
                        ))}
                        </div>
                        {!selectedMegaSubcategories.length && (
                          <a
                            onClick={() => {
                              nav("shop", selectedMegaCategory.id);
                              setMega(false);
                            }}
                          >
                            همه محصولات این دسته
                          </a>
                        )}
                      </div>
                      <div className="mega-col mega-group">
                        <h4><span className="mega-title-mark"></span>برندهای مرتبط <small>{fmt(selectedMegaBrands.length)}</small></h4>
                        <div className="mega-brand-list">
                        {selectedMegaBrands.map((brand) => (
                          <a
                            key={brand.name}
                            className="mega-brand-link"
                            href={`${routePath("shop", selectedMegaCategory.id)}?brand=${encodeURIComponent(brand.name)}`}
                            onClick={() => {
                              setMega(false);
                            }}
                          >
                            <span className="mega-brand-avatar">{brand.name.slice(0, 2)}</span>
                            <span className="mega-brand-name">{brand.name}</span>
                            <small>{fmt(brand.count)}</small>
                          </a>
                        ))}
                        </div>
                        {!selectedMegaBrands.length && (
                          <span className="mega-muted-row">
                            هنوز برندی برای این دسته ثبت نشده است.
                          </span>
                        )}
                      </div>
                      <div className="mega-col mega-group mega-products-group">
                        <div className="mega-products-heading">
                          <h4><span className="mega-title-mark"></span>محصولات پیشنهادی</h4>
                          <small>منتخب براساس موجودی و محبوبیت</small>
                        </div>
                        <div className="mega-product-list">
                        {selectedMegaFeatured
                          .map((product) => (
                            <a
                              className="mega-product-card"
                              key={product.id}
                              href={routePath(
                                "product",
                                product.slug || product.id,
                              )}
                              onClick={(event) => {
                                event.preventDefault();
                                rememberDirectProduct(product);
                                sessionStorage.removeItem("gaming_focus_category");
                                nav("product", product.slug || product.id);
                                setMega(false);
                                setMobileMenu(false);
                              }}
                            >
                              <span className="mega-product-visual">
                                <CatalogImage src={product.image} alt="" icon={product.icon} loading="lazy" />
                              </span>
                              <span className="mega-product-info">
                                <b>{product.name}</b>
                                <small>
                                  {product.brand} · {ProductSelectors.isGaming(product) ? "گیمینگ · " : ""}
                                  {product.stock > 0 ? "موجود" : "ناموجود"}
                                </small>
                              </span>
                              <span className="mega-product-price">
                                {product.stock > 0 ? <>{fmt(product.finalPrice)} <small>تومان</small></> : "ناموجود"}
                              </span>
                            </a>
                          ))}
                        {!selectedMegaFeatured.length && (
                          <a
                            className="mega-empty-product"
                            onClick={() => {
                              nav("shop", selectedMegaCategory.id);
                              setMega(false);
                            }}
                          >
                            هنوز محصولی در این دسته ثبت نشده است
                          </a>
                        )}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="mega-empty">
                    هنوز دسته‌بندی فعالی ثبت نشده است.
                  </div>
                )}
              </section>
              <div className="mega-promo">
                {siteSettings.mega_promo_image && (
                  <img
                    className="mega-promo-image"
                    src={siteSettings.mega_promo_image}
                    alt={siteSettings.mega_promo_title || "پیشنهاد ویژه"}
                  />
                )}
                <div>
                  <span className="mega-promo-label">پیشنهاد منتخب هفته</span>
                  {!siteSettings.mega_promo_image && (
                    <I.gift
                      className="icon"
                      style={{ width: 40, height: 40 }}
                    />
                  )}
                  <h3>
                    {siteSettings.mega_promo_title}
                  </h3>
                  <p>
                    {siteSettings.mega_promo_subtitle}
                  </p>
                </div>
                <div className="mega-promo-actions">
                  <button
                    className="btn mega-promo-primary"
                    onClick={() => {
                      nav("shop", "off");
                      setMega(false);
                    }}
                  >
                    مشاهده تخفیف‌ها
                  </button>
                  <button
                    className="mega-promo-gaming"
                    onClick={() => {
                      nav("gaming", selectedMegaCategory?.id || null);
                      setMega(false);
                    }}
                  >
                    🎮 گیمینگ این دسته
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>
      {mega && <div className="mega-overlay" onClick={() => setMega(false)} />}
    </header>
  );
}
