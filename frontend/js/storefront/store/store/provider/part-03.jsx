        body: JSON.stringify({
          items: n.items,
          total: n.items.reduce((sum, item) => sum + item.price * item.qty, 0),
        }),
      }).catch(() => {});
    }
  };

  const addToCart = (product, options = {}) => {
    const nextCart = new CartEngine([...cart.items]);
    nextCart.add(product, options);
    persistCart(nextCart);
    ShopAnalytics.track("add_to_cart", {
      productId: product.apiId || product.id,
      quantity: options.qty || 1,
      value: product.finalPrice,
    });
    return nextCart;
  };

  useEffect(() => {
    const expired = () => {
      setUser(null);
      toast("نشست شما منقضی شد؛ لطفاً دوباره وارد شوید.", "error");
    };
    const clientError = () => toast("یک خطای نمایشی کنترل شد؛ اطلاعات شما محفوظ است.", "error");
    window.addEventListener("shop82:session-expired", expired);
    window.addEventListener("shop82:client-error", clientError);
    return () => {
      window.removeEventListener("shop82:session-expired", expired);
      window.removeEventListener("shop82:client-error", clientError);
    };
  }, [toast]);

  useEffect(() => {
    ShopAnalytics.track("page_view", { page: route.name, id: route.param || "" });
  }, [route.name, route.param]);

  useEffect(() => CrossTabChannel.listen(async ({ type, payload }) => {
    if (type === "logout") {
      AuthTokenVault.clear();
      setUser(null);
    }
    if (type === "catalog-invalidated") {
      const revision = String(payload?.revision || Date.now());
      if (catalogRevisionRef.current === revision) return;
      catalogRevisionRef.current = revision;
      await invalidateCatalogCaches();
      setCatalogRefreshKey((value) => value + 1);
    }
  }), []);

  useEffect(() => {
    const refreshFromAdmin = async (event) => {
      if (event.key !== "catalog_revision") return;
      const revision = String(event.newValue || "");
      if (!revision || catalogRevisionRef.current === revision) return;
      catalogRevisionRef.current = revision;
      await invalidateCatalogCaches();
      setCatalogRefreshKey((value) => value + 1);
    };
    window.addEventListener("storage", refreshFromAdmin);
    return () => window.removeEventListener("storage", refreshFromAdmin);
  }, []);

  const routeProduct = PRODUCTS.find((product) =>
    [product.slug, product.id, product.apiId]
      .map(String)
      .includes(String(route.param || "")),
  );
  const requestedCatalogMode =
    route.name === "gaming" ||
    (route.name === "product" &&
      ProductSelectors.isGaming(routeProduct || directProduct))
      ? "gaming"
      : "regular";
  const catalogScope = route.name === "home"
    ? "home"
    : route.name === "product"
      ? "detail"
      : ["shop", "gaming", "guides", "guide"].includes(route.name)
        ? "full"
        : "shell";

  useEffect(() => {
    let active = true;
    let loadingCatalog = false;
    const wantsGamingCatalog = requestedCatalogMode === "gaming";
    const loadCatalog = async (silent = false) => {
      if (loadingCatalog) return;
      loadingCatalog = true;
      const controller = RequestCoordinator.nextController("catalog-route");
      try {
        const [categoriesResult, menuResult, productsResult] =
          await RequestCoordinator.dedupe(
            `catalog:${requestedCatalogMode}:${catalogScope}:${route.param || ""}`,
            () => Promise.allSettled([
            fetchAllPages(
              API_BASE + "/catalog/categories/?page_size=100",
              { signal: controller.signal },
              3,
            ),
            fetchAllPages(
              API_BASE + "/catalog/menu-items/?page_size=100",
              { signal: controller.signal },
              3,
            ),
            catalogScope === "shell"
              ? Promise.resolve(PRODUCTS)
              : catalogScope === "detail"
              ? fetchCatalogRecord(
                  `${API_BASE}/catalog/products/${encodeURIComponent(route.param || "")}/`,
                  { signal: controller.signal },
                ).then((product) => [product])
              : (catalogScope === "home" ? fetchFirstPageRows : fetchAllPages)(
                  API_BASE +
                    `/catalog/products/?page_size=${catalogScope === "home" ? 120 : 500}&is_active=true&is_gaming=${
                      wantsGamingCatalog ? "true" : "false"
                    }${route.param && ["shop", "gaming", "guide"].includes(route.name)
                      ? `&category__slug=${encodeURIComponent(route.param)}`
                      : ""}`,
                  { signal: controller.signal },
                ),
            ]),
          );
        if (!active) return;

        if (
          categoriesResult.status === "fulfilled" &&
          categoriesResult.value.length
        ) {
          const mappedCategories = categoriesResult.value
            .filter((category) => category.is_active)
            .map((category) => ({
              id: category.slug,
              apiId: category.id,
              name: category.name,
              icon: I[category.icon] ? category.icon : "cpu",
              image: apiMediaUrl(category.image) || "",
              gamingImage: apiMediaUrl(category.gaming_image) || "",
              count: Number(category.products_count || 0),
              seoTitle: category.seo_title || "",
              seoDescription: category.seo_description || "",
              introText: category.intro_text || "",
              buyingGuide: category.buying_guide || "",
              faqItems: Array.isArray(category.faq_items) ? category.faq_items : [],
              subs: Array.isArray(category.subcategories)
                ? category.subcategories
                : [],
            }));
          CatalogRepository.replaceCategories(mappedCategories);
          LS.set("catalog_cache_categories", mappedCategories);
        }
        if (menuResult.status === "fulfilled") setMenuItems(menuResult.value);
        if (productsResult.status === "rejected") throw productsResult.reason;

        if (catalogScope === "shell") {
          setCatalogVersion((version) => version + 1);
          return;
        }
        const mappedProducts = productsResult.value.map(apiProductToStoreProduct);
        CatalogRepository.replaceProducts(catalogScope === "detail"
          ? mappedProducts
          : wantsGamingCatalog
            ? ProductSelectors.gaming(mappedProducts)
            : ProductSelectors.regular(mappedProducts));
        const cacheParam = route.param
          ? `_${encodeURIComponent(route.param)}`
          : "";
        LS.set(
          `catalog_cache_${wantsGamingCatalog ? "gaming" : "regular"}_${catalogScope}${cacheParam}`,
          PRODUCTS,
        );
        setCatalogVersion((version) => version + 1);
      } catch (_) {
        if (active && !silent && !PRODUCTS.length)
          toast(
            "دریافت محصولات انجام نشد؛ اتصال بک‌اند را بررسی کنید.",
            "error",
          );
      } finally {
        loadingCatalog = false;
        if (active) setCatalogLoading(false);
      }
    };
    loadCatalog();
    const retryWhenOnline = () => loadCatalog(Boolean(PRODUCTS.length));
    window.addEventListener("online", retryWhenOnline);
    return () => {
      active = false;
      RequestCoordinator.abort("catalog-route");
      window.removeEventListener("online", retryWhenOnline);
    };
  }, [toast, requestedCatalogMode, catalogScope, route.param, catalogRefreshKey]);

  const nav = useCallback((name, param = null) => {
    const navigationKey = Date.now();
    setRoute({ name, param, navigationKey });
    window.scrollTo({ top: 0, behavior: "smooth" });
    // History API (BOM)
    window.history.pushState(
      { name, param, navigationKey },
      "",
      routePath(name, param),
    );
  }, []);

  useEffect(() => {
    const onPop = (e) => {
      setRoute(e.state || routeFromLocation());
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const toggleFav = async (id) => {
    const product = PRODUCTS.find((item) => item.id === id);
    if (user && product?.apiId && AuthTokenVault.has()) {
      try {
        if (fav.includes(id)) {
          const recordId = favoriteRecords[id];
          if (recordId)
            await accountApi(`/catalog/favorites/${recordId}/`, {
              method: "DELETE",
            });
          setFavoriteRecords((current) => {
            const next = { ...current };
            delete next[id];
            return next;
          });
        } else {
          const created = await accountApi("/catalog/favorites/", {
            method: "POST",
            body: JSON.stringify({ product: product.apiId }),
          });
          setFavoriteRecords((current) => ({ ...current, [id]: created.id }));
        }
      } catch (error) {
        return toast(error.message, "error");
      }
    }
    setFav((f) => (f.includes(id) ? f.filter((x) => x !== id) : [...f, id]));
    toast(
      fav.includes(id)
        ? "از علاقه‌مندی‌ها حذف شد"
        : "به علاقه‌مندی‌ها اضافه شد",
    );
  };

  const val = {
    theme,
    setTheme,
    route,
    nav,
    cart,
    persistCart,
    addToCart,
    fav,
    toggleFav,
    user,
    setUser,
    users,
    setUsers,
    addresses,
    setAddresses,
    toast,
    toasts,
    cartOpen,
    setCartOpen,
    catalogVersion,
    catalogLoading,
    menuItems,
    notifications,
    setNotifications,
    siteSettings,
    products: CatalogRepository.products(),
    categories: CatalogRepository.categories(),
    featureFlags: FeatureFlags.snapshot(),
  };
  return <Store.Provider value={val}>{children}</Store.Provider>;
}
