/* ============================================================
   ROOT APP + ROUTER
   ============================================================ */
function App() {
  useBg3D();
  const { route, cartOpen, catalogLoading } = useStore();
  let page;
  switch (route.name) {
    case "shop":
      page = <Shop param={route.param} navigationKey={route.navigationKey} />;
      break;
    case "product":
      page = catalogLoading ? (
        <div className="container">
          <div
            className="skeleton"
            style={{ height: 420, marginTop: 30 }}
          ></div>
        </div>
      ) : PRODUCTS.length ? (
        <ProductDetail param={route.param} />
      ) : (
        <div className="container">
          <div
            className="glass"
            style={{ padding: 45, textAlign: "center", marginTop: 30 }}
          >
            محصولی در دیتابیس ثبت نشده است.
          </div>
        </div>
      );
      break;
    case "gaming":
      page = <GamingPage param={route.param} navigationKey={route.navigationKey} />;
      break;
    case "auth":
      page = <Auth />;
      break;
    case "profile":
      page = <Profile param={route.param} />;
      break;
    case "about":
      page = <AboutPage />;
      break;
    case "contact":
      page = <ContactPage />;
      break;
    case "faq":
      page = <FAQPage />;
      break;
    case "returns":
      page = <ReturnsPage />;
      break;
    case "guides":
      page = <BuyingGuidesPage />;
      break;
    case "guide":
      page = <BuyingGuidesPage slug={route.param} />;
      break;
    case "not-found":
      page = <NotFoundPage />;
      break;
    default:
      page = <Home />;
  }
  return (
    <>
      <SectionErrorBoundary name="header" resetKey={route.name}><Header /></SectionErrorBoundary>
      <main style={{ minHeight: "60vh" }}>
        <SectionErrorBoundary name={`page:${route.name}`} resetKey={`${route.name}:${route.param || ""}`}>
          {page}
        </SectionErrorBoundary>
      </main>
      <SectionErrorBoundary name="footer"><Footer /></SectionErrorBoundary>
      {cartOpen && <SectionErrorBoundary name="cart"><CartDrawer /></SectionErrorBoundary>}
      {FeatureFlags.enabled("assistant") && <DeferredFeature><SectionErrorBoundary name="assistant"><AIAssistant /></SectionErrorBoundary></DeferredFeature>}
      <Toasts />
    </>
  );
}

function NotFoundPage() {
  const { nav } = useStore();
  return <section className="not-found-page container">
    <div className="glass"><strong>۴۰۴</strong><h1>این صفحه پیدا نشد</h1>
      <p>ممکن است نشانی تغییر کرده باشد یا صفحه حذف شده باشد.</p>
      <div><button className="btn btn-primary" onClick={() => nav("home")}>بازگشت به خانه</button><button className="btn btn-ghost" onClick={() => nav("shop")}>مشاهده فروشگاه</button></div>
    </div>
  </section>;
}

ReactDOM.createRoot(document.getElementById("root")).render(
  <AppErrorBoundary><StoreProvider><NetworkStatus /><UpdateNotice /><App /></StoreProvider></AppErrorBoundary>,
);
if ("serviceWorker" in navigator && location.protocol !== "file:") {
  window.addEventListener("load", () =>
    navigator.serviceWorker
      .register("/service-worker.js", { updateViaCache: "none" })
      .then((registration) => {
        registration.addEventListener("updatefound", () => {
          const worker = registration.installing;
          worker?.addEventListener("statechange", () => {
            if (worker.state === "installed" && navigator.serviceWorker.controller)
              window.dispatchEvent(new CustomEvent("shop82:update-ready"));
          });
        });
      })
      .catch(() => {}),
    { once: true },
  );
}
FrontendMonitor.startWebVitals();
