                  key={`${suggestion.type}-${item.id}`}
                  href={href}
                  onClick={(event) => {
                    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey)
                      return;
                    event.preventDefault();
                    if (isCategory)
                      nav(suggestion.catalog || (route.name === "gaming" ? "gaming" : "shop"), item.id);
                    else {
                      rememberDirectProduct(item);
                      nav("product", item.slug || item.id);
                    }
                    setQ("");
                    setSug([]);
                  }}
                >
                  <SuggestionIcon className="icon" style={{ color: "var(--primary)" }} />
                  <span className="suggest-copy">
                    <b>{item.name}</b>
                    <small>{isCategory ? "مشاهده دسته‌بندی" : `${item.catName} · ${item.brand}`}</small>
                  </span>
                  {!isCategory && <b className="suggest-price">{fmt(item.finalPrice)}</b>}
                </a>
                );
              })}
            </div>
          )}
        </div>
        {siteSettings.guides_enabled !== false && <a className="header-buying-guide-link" href="/guides" target="_blank" rel="noopener noreferrer" aria-label="باز کردن راهنمای خرید در تب جدید">
          <span className="header-guide-icon"><I.search className="icon" /></span>
          <span><b>{siteSettings.guides_header_button_title || "راهنمای خرید"}</b><small>{siteSettings.guides_header_button_subtitle || "انتخاب حرفه‌ای"}</small></span>
          <i aria-hidden="true">↗</i>
        </a>}
        <div className="hdr-actions">
          <button
            className="iconbtn header-action header-action-theme"
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "فعال‌کردن حالت روشن" : "فعال‌کردن حالت تاریک"}
            data-tooltip={theme === "dark" ? "حالت روشن" : "حالت تاریک"}
          >
            {theme === "dark" ? (
              <I.sun className="icon" />
            ) : (
              <I.moon className="icon" />
            )}
          </button>
          <button
            className="iconbtn header-action header-action-favorite"
            onClick={() => nav("profile", "fav")}
            aria-label="علاقه‌مندی‌ها"
            data-tooltip="علاقه‌مندی‌ها"
          >
            <I.heartO className="icon" />
            {fav.length > 0 && <span className="badge">{fmt(fav.length)}</span>}
          </button>
          <button
            className="iconbtn header-action header-action-notification"
            aria-label="اعلان‌ها"
            data-tooltip="اعلان‌ها"
            onClick={() =>
              user ? nav("profile", "notifications") : nav("auth")
            }
          >
            <I.bell className="icon" />
            {notifications.filter((item) => !item.is_read).length > 0 && (
              <span className="badge">
                {fmt(notifications.filter((item) => !item.is_read).length)}
              </span>
            )}
          </button>
          <button
            className="iconbtn header-action header-action-cart"
            onClick={() => setCartOpen(true)}
            aria-label="سبد خرید"
            data-tooltip="سبد خرید"
          >
            <I.cart className="icon" />
            {cart.count() > 0 && (
              <span className="badge">{fmt(cart.count())}</span>
            )}
          </button>
          <button
            className="iconbtn header-action header-action-profile"
            onClick={() => (user ? nav("profile") : nav("auth"))}
            aria-label="حساب کاربری"
            data-tooltip={user ? "پنل کاربری" : "ورود و ثبت‌نام"}
          >
            <I.user className="icon" />
          </button>
        </div>
      </div>

      <nav
        className={"navbar glass premium-navbar" + (mega ? " mega-active" : "")}
      >
        <div className="mega-wrap" ref={megaRef}>
          <div
            id="store-main-navigation"
            className={"nav-list" + (mobileMenu ? " mobile-open" : "")}
          >
            <div
              className="nav-item nav-all-categories"
              onClick={() => setMega((m) => !m)}
              role="button"
              tabIndex="0"
              aria-haspopup="true"
              aria-expanded={mega}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  setMega((value) => !value);
                }
              }}
            >
              <span className="nav-item-icon"><I.menu className="icon" /></span>
              <span>همه دسته‌بندی‌ها</span>
            </div>
            {siteSettings.guides_enabled !== false && <a className="nav-item header-mobile-guide" href="/guides" target="_blank" rel="noopener noreferrer">
              <span className="nav-item-icon"><I.search className="icon" /></span><span>راهنمای خرید</span>
            </a>}
            {primaryMenuItems.map((item) => {
              const MenuIcon = menuIconFor(item);
              const isExternalTarget = /^https?:\/\//.test(item.target);
              const isGamingStoreLink =
                route?.name === "gaming" && item.target === "shop";
              const isProductCategoryLink = CATEGORIES.some(
                (category) => category.id === item.target,
              );
              const isGamingCategoryLink =
                route?.name === "gaming" && isProductCategoryLink;
              const itemHref = isExternalTarget
                ? item.target
                : item.target === "home"
                  ? "/"
                : item.target === "gaming"
                  ? "/gaming"
                  : isGamingStoreLink
                    ? "#gaming-catalog"
                  : isGamingCategoryLink
                    ? `/gaming/${encodeURIComponent(item.target)}`
                  : item.target && item.target !== "shop"
                    ? `/shop/${encodeURIComponent(item.target)}`
                    : "/shop";
              return (
              <a
                className={
                  "nav-item" +
                  (item.target === "gaming" || isGamingStoreLink
                    ? " gaming-nav-link"
                    : "") +
                  (isGamingStoreLink ? " gaming-store-nav-link" : "") +
                  ((route?.name === item.target ||
                    (route?.name === "shop" && item.target === "shop") ||
                    (route?.name === "gaming" && item.target === "gaming"))
                    ? " active"
                    : "")
                }
                key={item.id}
                href={itemHref}
                target={item.target === "gaming" ? "_blank" : undefined}
                rel={item.target === "gaming" ? "noopener noreferrer" : undefined}
                onClick={(event) => {
                  if (isExternalTarget) return;
                  if (item.target === "gaming") {
                    setMobileMenu(false);
                    return;
                  }
                  event.preventDefault();
                  if (isGamingStoreLink) {
                    // Remove a category route such as /gaming/laptop first;
                    // GamingPage will then scroll to the complete catalog.
                    sessionStorage.removeItem("gaming_focus_category");
                    sessionStorage.setItem("gaming_focus_catalog", "1");
                    nav("gaming");
                  } else if (item.target === "home") {
                    nav("home");
                  } else if (isGamingCategoryLink) {
                    sessionStorage.setItem(
                      "gaming_focus_category",
                      item.target,
                    );
                    nav("gaming", item.target);
                  } else {
                    nav(
                      "shop",
                      item.target && item.target !== "shop"
                        ? item.target
                        : null,
                    );
                  }
                  setMega(false);
                  setMobileMenu(false);
                }}
              >
                <span className="nav-item-icon"><MenuIcon className="icon" /></span>
                <span className="nav-item-label">{item.title.replace(/[🎮🔥]/gu, "").trim()}</span>
              </a>
              );
            })}
          </div>
          {mega && (
            <div
              className="mega glass"
              style={{ "--mega-mobile-top": `${megaTop}px` }}
              role="menu"
              aria-label="دسته‌بندی محصولات"
            >
              <aside className="mega-sidebar">
                <span className="mega-sidebar-label">دسته‌های محصولات</span>
                <div className="mega-cats">
                  {CATEGORIES.map((category) => (
                    <button
                      type="button"
                      className={
                        "mega-cat" +
                        (selectedMegaCategory?.id === category.id
                          ? " active"
                          : "")
                      }
                      key={category.id}
                      aria-expanded={selectedMegaCategory?.id === category.id}
                      onMouseEnter={() => {
                        if (window.innerWidth > 768)
                          setActiveMegaCategory(category.id);
                      }}
                      onClick={() => {
                        nav("shop", category.id);
                        setMega(false);
                        setMobileMenu(false);
                      }}
                    >
                      <span className="mega-cat-icon">
                        {(I[category.icon] || I.cpu)({
                          className: "icon",
                          style: { width: 18, height: 18 },
                        })}
                      </span>
                      <span className="mega-cat-text">
                        <b>{category.name}</b>
                        <small>
                          {(() => {
                            const count = ProductSelectors.regular(
                              PRODUCTS,
                            ).filter(
                              (product) =>
                                (product.cat === category.id ||
                                  product.category === category.id),
                            ).length;
                            return count
                              ? `${fmt(count)} محصول`
                              : (Array.isArray(category.subs)
                                  ? category.subs
                                  : []
                                )
                                  .slice(0, 2)
                                  .join("، ") || "مشاهده محصولات";
                          })()}
                        </small>
                      </span>
                      <span className="mega-cat-arrow" aria-hidden="true">
                        ‹
                      </span>
                    </button>
                  ))}
                </div>
              </aside>
              <section
                className="mega-content"
                key={selectedMegaCategory?.id || "empty"}
              >
                {selectedMegaCategory ? (
                  <>
                    <div className="mega-content-head">
                      <div className="mega-heading-block">
                        <span>فروشگاه  /  {selectedMegaCategory.name}</span>
                        <button
                          type="button"
                          className="mega-category-heading-link"
                          onClick={() => {
                            nav("shop", selectedMegaCategory.id);
                            setMega(false);
                            setMobileMenu(false);
                          }}
                        >
                          <h3>{selectedMegaCategory.name}</h3>
                          <span aria-hidden="true">←</span>
                        </button>
                        <div className="mega-category-stats">
                          <small>{fmt(selectedMegaStats.total)} محصول</small>
