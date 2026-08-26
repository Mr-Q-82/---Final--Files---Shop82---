const STOREFRONT_MODULES = [
  "/js/shared/core/normalizers.js",
  "/js/shared/data/iran-locations.js",
  "/js/shared/validation/patterns.js",
  "/js/shared/validation/rules.js",
  "/js/shared/validation/form-validator.js",
  "/js/shared/http/ajax-client.js",
  "/js/shared/runtime/live-validation.js",
  "/js/shared/runtime/application-platform.js",
  "/js/shared/runtime/resilience.jsx",
  "/js/shared/runtime/performance.jsx",
  "/js/storefront/core/catalog/runtime.jsx",
  "/js/storefront/core/catalog/icons.jsx",
  "/js/storefront/core/catalog/default-data.jsx",
  "/js/storefront/core/catalog/api-client.jsx",
  "/js/storefront/core/catalog/product-mappers.jsx",
  "/js/storefront/core/catalog/usage-profiles.jsx",
  "/js/storefront/services/browser.jsx",
  "/js/storefront/services/product-selectors.jsx",
  "/js/storefront/store/store/provider/part-01.jsx",
  "/js/storefront/store/store/provider/part-02.jsx",
  "/js/storefront/store/store/provider/part-03.jsx",
  "/js/storefront/effects/background.jsx",
  "/js/storefront/components/header/header/part-01.jsx",
  "/js/storefront/components/header/header/part-02.jsx",
  "/js/storefront/components/header/header/part-03.jsx",
  "/js/storefront/components/product-card.jsx",
  "/js/storefront/pages/home/base.jsx",
  "/js/storefront/pages/home/product-carousels.jsx",
  "/js/storefront/pages/home/brands-and-promos.jsx",
  "/js/storefront/pages/home/amazing-offers.jsx",
  "/js/storefront/pages/home/home-page.jsx",
  "/js/storefront/pages/gaming/config.jsx",
  "/js/storefront/pages/gaming/gaming-page.jsx",
  "/js/storefront/pages/shop/config.jsx",
  "/js/storefront/pages/shop/shop-page.jsx",
  "/js/storefront/pages/shop/usage-profile-picker.jsx",
  "/js/storefront/pages/product-detail/reviews.jsx",
  "/js/storefront/pages/product-detail/questions.jsx",
  "/js/storefront/pages/product-detail/expert-description.jsx",
  "/js/storefront/pages/product-detail/loader.jsx",
  "/js/storefront/pages/product-detail/product-detail-page.jsx",
  "/js/storefront/components/cart-drawer.jsx",
  "/js/storefront/pages/auth/auth-shell.jsx",
  "/js/storefront/pages/auth/backend-login.jsx",
  "/js/storefront/pages/auth/quick-register.jsx",
  "/js/storefront/pages/account/comparison.jsx",
  "/js/storefront/pages/account/services.jsx",
  "/js/storefront/pages/account/profile.jsx",
  "/js/storefront/pages/account/checkout.jsx",
  "/js/storefront/pages/account/address-editor.jsx",
  "/js/storefront/pages/account/notifications.jsx",
  "/js/storefront/pages/account/profile-editors.jsx",
  "/js/storefront/pages/content-pages/shared.jsx",
  "/js/storefront/pages/content-pages/about.jsx",
  "/js/storefront/pages/content-pages/contact.jsx",
  "/js/storefront/pages/content-pages/faq.jsx",
  "/js/storefront/pages/content-pages/returns.jsx",
  "/js/storefront/pages/content-pages/guides.jsx",
  "/js/storefront/components/assistant.jsx",
  "/js/storefront/components/footer.jsx",
  "/js/storefront/components/toasts.jsx",
  "/js/storefront/app.jsx",
];

async function startStorefront() {
  try {
    await import("/dist/storefront.bundle.js?v=138");
  } catch (error) {
    console.error(error);
    const message = document.createElement("main");
    message.className = "bootstrap-failure";
    message.textContent = "بارگذاری فروشگاه ناموفق بود.";
    document.getElementById("root").replaceChildren(message);
  }
}

startStorefront();
