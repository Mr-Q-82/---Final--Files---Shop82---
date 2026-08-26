    });
    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: robotsContent,
    });
    upsertMeta('meta[property="og:title"]', {
      property: "og:title",
      content: title,
    });
    upsertMeta('meta[property="og:description"]', {
      property: "og:description",
      content: description.slice(0, 320),
    });
    upsertMeta('meta[property="og:type"]', {
      property: "og:type",
      content: product ? "product" : "website",
    });
    upsertMeta('meta[property="og:url"]', {
      property: "og:url",
      content: canonicalHref,
    });
    upsertMeta('meta[property="og:site_name"]', {
      property: "og:site_name",
      content: siteSettings.site_name,
    });
    upsertMeta('meta[name="twitter:title"]', {
      name: "twitter:title",
      content: title,
    });
    upsertMeta('meta[name="twitter:description"]', {
      name: "twitter:description",
      content: description.slice(0, 320),
    });
    if (socialImage) {
      upsertMeta('meta[property="og:image"]', {
        property: "og:image",
        content: socialImage,
      });
      upsertMeta('meta[name="twitter:image"]', {
        name: "twitter:image",
        content: socialImage,
      });
    } else {
      document.head.querySelector('meta[property="og:image"]')?.remove();
      document.head.querySelector('meta[name="twitter:image"]')?.remove();
    }
    if (siteSettings.google_site_verification) {
      upsertMeta('meta[name="google-site-verification"]', {
        name: "google-site-verification",
        content: siteSettings.google_site_verification,
      });
    }
    if (siteSettings.bing_site_verification) {
      upsertMeta('meta[name="msvalidate.01"]', {
        name: "msvalidate.01",
        content: siteSettings.bing_site_verification,
      });
    }
    const canonical = upsertMeta('link[rel="canonical"]', {
      tag: "link",
      rel: "canonical",
      href: canonicalHref,
    });
    canonical.setAttribute("href", canonicalHref);
    upsertMeta('link[hreflang="fa-IR"]', {
      tag: "link",
      rel: "alternate",
      hreflang: "fa-IR",
      href: canonicalHref,
    });
    upsertMeta('link[hreflang="x-default"]', {
      tag: "link",
      rel: "alternate",
      hreflang: "x-default",
      href: canonicalHref,
    });

    const schemas = [];
    if (route.name === "home") {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "OnlineStore",
        name: siteSettings.site_name,
        url: location.origin,
        ...(siteSettings.logo ? { logo: siteSettings.logo } : {}),
        ...(siteSettings.organization_phone ? { telephone: siteSettings.organization_phone } : {}),
        ...(siteSettings.organization_email ? { email: siteSettings.organization_email } : {}),
        ...(siteSettings.organization_address ? { address: siteSettings.organization_address } : {}),
        ...(Array.isArray(siteSettings.organization_social_links) && siteSettings.organization_social_links.length
          ? { sameAs: siteSettings.organization_social_links } : {}),
      });
      schemas.push({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: siteSettings.site_name,
        url: location.origin,
        inLanguage: "fa-IR",
        potentialAction: {
          "@type": "SearchAction",
          target: `${location.origin}/shop?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      });
    }
    if (contentMeta) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": route.name === "contact" ? "ContactPage" : "WebPage",
        name: title,
        description,
        url: canonicalHref,
        inLanguage: "fa-IR",
      });
    }
    if (["shop", "gaming"].includes(route.name) || product) {
      const breadcrumbItems = [
        {
          "@type": "ListItem",
          position: 1,
          name: "خانه",
          item: location.origin + "/",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: route.name === "gaming" ? "فروشگاه گیمینگ" : "فروشگاه",
          item: location.origin + (route.name === "gaming" ? "/gaming" : "/shop"),
        },
      ];
      if (seoCategory)
        breadcrumbItems.push({
          "@type": "ListItem",
          position: 3,
          name: seoCategory.name,
          item: location.origin + routePath(route.name === "gaming" ? "gaming" : "shop", seoCategory.id),
        });
      if (product)
        breadcrumbItems.push({
          "@type": "ListItem",
          position: seoCategory ? 4 : 3,
          name: product.name,
          item: canonicalHref,
        });
      schemas.push({
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: breadcrumbItems,
      });
    }
    if (route.name === "shop" || route.name === "gaming") {
      const routeProducts =
        route.name === "gaming"
          ? ProductSelectors.gaming(PRODUCTS)
          : ProductSelectors.regular(PRODUCTS);
      const listedProducts = routeProducts
        .filter((item) => !category || item.cat === category.id)
        .slice(0, 24);
      schemas.push({
        "@context": "https://schema.org",
        "@type": "CollectionPage",
        name: title,
        description,
        url: canonicalHref,
        inLanguage: "fa-IR",
        mainEntity: {
          "@type": "ItemList",
          numberOfItems: listedProducts.length,
          itemListElement: listedProducts.map((item, index) => ({
            "@type": "ListItem",
            position: index + 1,
            name: item.name,
            url: location.origin + routePath("product", item.slug || item.id),
          })),
        },
      });
    }
    if (route.name === "faq" && typeof FAQ_ITEMS !== "undefined") {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: FAQ_ITEMS.map((item) => ({
          "@type": "Question",
          name: item.question,
          acceptedAnswer: { "@type": "Answer", text: item.answer },
        })),
      });
    }
    if (category?.faqItems?.length) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: category.faqItems
          .filter((item) => item?.question && item?.answer)
          .map((item) => ({
            "@type": "Question",
            name: item.question,
            acceptedAnswer: { "@type": "Answer", text: item.answer },
          })),
      });
    }
    if (product) {
      schemas.push({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: (
          product.seoDescription ||
          product.description ||
          product.name
        ).slice(0, 5000),
        sku: String(product.sku || product.apiId || product.slug),
        ...(product.gtin ? { gtin: product.gtin } : {}),
        ...(product.mpn ? { mpn: product.mpn } : {}),
        ...(product.material ? { material: product.material } : {}),
        ...(product.productGroupId ? { inProductGroupWithID: product.productGroupId } : {}),
        ...(product.image
          ? { image: [product.image, ...product.gallery].filter(Boolean) }
          : {}),
        ...(product.brand && product.brand !== "بدون برند"
          ? { brand: { "@type": "Brand", name: product.brand } }
          : {}),
        offers: {
          "@type": "Offer",
          url: canonicalHref,
          priceCurrency: "IRR",
          price: String(Math.round(product.finalPrice * 10)),
          availability:
            product.stock > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
          seller: { "@type": "Organization", name: siteSettings.merchant_name || siteSettings.site_name },
          shippingDetails: {
            "@type": "OfferShippingDetails",
            shippingRate: { "@type": "MonetaryAmount", value: String(Number(siteSettings.shipping_cost || 0) * 10), currency: "IRR" },
            deliveryTime: {
              "@type": "ShippingDeliveryTime",
              handlingTime: { "@type": "QuantitativeValue", minValue: 0, maxValue: 1, unitCode: "DAY" },
              transitTime: { "@type": "QuantitativeValue", minValue: Number(siteSettings.shipping_min_days || 1), maxValue: Number(siteSettings.shipping_max_days || 5), unitCode: "DAY" },
            },
          },
          hasMerchantReturnPolicy: {
            "@type": "MerchantReturnPolicy",
            applicableCountry: "IR",
            returnPolicyCategory: "https://schema.org/MerchantReturnFiniteReturnWindow",
            merchantReturnDays: Number(siteSettings.return_window_days || 7),
            returnMethod: "https://schema.org/ReturnByMail",
          },
        },
        ...(product.rate > 0 && product.approvedReviews > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: String(product.rate),
                reviewCount: String(product.approvedReviews),
                bestRating: "5",
                worstRating: "1",
              },
            }
          : {}),
      });
    }
    setStructuredData(schemas);
  }, [route, catalogVersion, catalogLoading, siteSettings]);
  useEffect(() => {
    if (!user || !AuthTokenVault.has()) {
      setNotifications([]);
      return;
    }
    let active = true;
    let knownIds = new Set();
    const loadNotifications = async (announce = false) => {
      if (document.visibilityState === "hidden") return;
      try {
        const data = await accountApiAll("/auth/notifications/?page_size=100");
        if (!active) return;
        const rows = data.results || data;
        if (announce && knownIds.size) {
          const fresh = rows.find((item) => !knownIds.has(item.id));
          if (fresh) toast(fresh.title || "اعلان جدید دریافت شد.", "success");
        }
        knownIds = new Set(rows.map((item) => item.id));
        setNotifications(rows);
      } catch (error) {
        if (active && error.name !== "AbortError" && !knownIds.size)
          toast(error.message, "error");
      }
    };
    loadNotifications();
    const timer = setInterval(() => loadNotifications(true), 30000);
    const visible = () => document.visibilityState === "visible" && loadNotifications(true);
    document.addEventListener("visibilitychange", visible);
    return () => {
      active = false;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", visible);
    };
  }, [user, toast]);
  useEffect(() => {
    if (!user || !AuthTokenVault.has() || !PRODUCTS.length) return;
    accountApiAll("/catalog/favorites/?page_size=100")
      .then((data) => {
        const rows = data.results || data;
        const records = {};
        const ids = [];
        rows.forEach((item) => {
          const product = PRODUCTS.find((p) => p.apiId === item.product);
          if (product) {
            ids.push(product.id);
            records[product.id] = item.id;
          }
        });
        setFav(ids);
        setFavoriteRecords(records);
      })
      .catch(() => {});
  }, [user, catalogVersion]);

  const persistCart = (eng) => {
    const n = new CartEngine([...eng.items]);
    setCart(n);
    LS.set("cart", n.items);
    if (user && AuthTokenVault.has()) {
      accountApi("/operations/abandoned-carts/", {
        method: "POST",
