const ADMIN_MODULES = [
  "/js/shared/core/normalizers.js",
  "/js/shared/validation/patterns.js",
  "/js/shared/validation/rules.js",
  "/js/shared/validation/form-validator.js",
  "/js/shared/http/ajax-client.js",
  "/js/shared/runtime/live-validation.js",
  "/js/shared/runtime/application-platform.js",
  "/js/shared/runtime/resilience.jsx",
  "/js/shared/runtime/performance.jsx",
  "/js/admin/core/runtime.jsx",
  "/js/admin/pages/auth.jsx",
  "/js/admin/pages/dashboard.jsx",
  "/js/admin/components/confirm.jsx",
  "/js/admin/pages/products/products-manager.jsx",
  "/js/admin/pages/products/category-recommendations.jsx",
  "/js/admin/pages/configurator.jsx",
  "/js/admin/pages/orders.jsx",
  "/js/admin/pages/catalog/taxonomies.jsx",
  "/js/admin/pages/catalog/simple-manager.jsx",
  "/js/admin/pages/catalog/product-options.jsx",
  "/js/admin/pages/users/users-manager.jsx",
  "/js/admin/pages/communications/notifications.jsx",
  "/js/admin/pages/communications/discounts.jsx",
  "/js/admin/pages/communications/reviews.jsx",
  "/js/admin/pages/commerce/commerce-manager/fragments/part-01.jsx",
  "/js/admin/pages/commerce/commerce-manager/fragments/part-02.jsx",
  "/js/admin/pages/commerce/commerce-manager/fragments/part-03.jsx",
  "/js/admin/pages/commerce/commerce-manager/fragments/part-04.jsx",
  "/js/admin/pages/operations/inventory-manager.jsx",
  "/js/admin/pages/operations/database-backup.jsx",
  "/js/admin/pages/operations/advanced-operations.jsx",
  "/js/admin/pages/content-settings/site-settings.jsx",
  "/js/admin/pages/content-settings/content-manager.jsx",
  "/js/admin/pages/content-settings/buying-guides-manager.jsx",
  "/js/admin/pages/content-settings/newsletter.jsx",
  "/js/admin/pages/enterprise.jsx",
  "/js/admin/app.jsx",
];

async function startAdmin() {
  try {
    await import("/dist/admin.bundle.js?v=18");
  } catch (error) {
    console.error(error);
    const message = document.createElement("main");
    message.className = "bootstrap-failure";
    message.textContent = "بارگذاری پنل مدیریت ناموفق بود.";
    document.getElementById("root").replaceChildren(message);
  }
}

startAdmin();
