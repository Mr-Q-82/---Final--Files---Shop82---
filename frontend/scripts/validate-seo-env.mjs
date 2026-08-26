const siteUrl = process.env.SEO_SITE_URL || "";
if (!/^https:\/\//i.test(siteUrl) || /localhost|127\.0\.0\.1/i.test(siteUrl)) {
  throw new Error("For production set SEO_SITE_URL to the public HTTPS storefront domain.");
}
const apiBase = process.env.SEO_API_BASE || "";
if (!/^https?:\/\//i.test(apiBase) || /localhost|127\.0\.0\.1/i.test(apiBase)) {
  throw new Error("For production set SEO_API_BASE to the reachable Django API URL.");
}
console.log(`SEO production environment validated for ${siteUrl}`);
