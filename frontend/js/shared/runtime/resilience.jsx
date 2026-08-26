class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(error) { return { error }; }
  componentDidCatch(error, info) {
    FrontendMonitor.capture(error, { source: "react", componentStack: info.componentStack });
    window.dispatchEvent(new CustomEvent("shop82:client-error", { detail: { message: error.message } }));
  }
  recoverApplication = async () => {
    try {
      if ("serviceWorker" in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        await Promise.all(registrations.map((registration) => registration.unregister()));
      }
      if ("caches" in window) {
        const keys = await caches.keys();
        await Promise.all(keys.filter((key) => key.startsWith("shop82-")).map((key) => caches.delete(key)));
      }
    } finally {
      location.reload();
    }
  };
  render() {
    if (!this.state.error) return this.props.children;
    return <main className="app-failure" role="alert">
      <div className="glass app-failure-card">
        <span aria-hidden="true">!</span>
        <h1>این بخش موقتاً قابل نمایش نیست</h1>
        <p>اطلاعات شما حذف نشده است. صفحه را دوباره بارگذاری کنید.</p>
        <button className="btn btn-primary" onClick={this.recoverApplication}>تلاش مجدد</button>
      </div>
    </main>;
  }
}

class SectionErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, resetKey: props.resetKey };
  }
  static getDerivedStateFromError(error) { return { error }; }
  static getDerivedStateFromProps(props, state) {
    return props.resetKey !== state.resetKey ? { error: null, resetKey: props.resetKey } : null;
  }
  componentDidCatch(error, info) {
    FrontendMonitor.capture(error, {
      source: "react-section",
      section: this.props.name || "unknown",
      componentStack: info.componentStack,
    });
  }
  render() {
    if (!this.state.error) return this.props.children;
    return <section className="async-state is-error" role="alert">
      <p>این بخش موقتاً در دسترس نیست؛ سایر قسمت‌های سایت قابل استفاده هستند.</p>
      <button className="btn btn-ghost" onClick={() => this.setState({ error: null })}>تلاش مجدد</button>
    </section>;
  }
}

function NetworkStatus() {
  const [online, setOnline] = React.useState(navigator.onLine);
  React.useEffect(() => {
    const up = () => setOnline(true), down = () => setOnline(false);
    addEventListener("online", up); addEventListener("offline", down);
    return () => { removeEventListener("online", up); removeEventListener("offline", down); };
  }, []);
  if (online) return null;
  return <div className="network-status" role="status" aria-live="polite">اتصال اینترنت قطع است؛ اطلاعات ذخیره‌شده نمایش داده می‌شود.</div>;
}

function UpdateNotice() {
  const [ready, setReady] = React.useState(false);
  React.useEffect(() => {
    const show = () => setReady(true);
    addEventListener("shop82:update-ready", show);
    return () => removeEventListener("shop82:update-ready", show);
  }, []);
  if (!ready) return null;
  return <div className="update-notice" role="status"><span>نسخه جدید سایت آماده است.</span><button onClick={() => location.reload()}>به‌روزرسانی</button><button aria-label="بستن" onClick={() => setReady(false)}>×</button></div>;
}

function AsyncState({ loading, error, empty, onRetry, emptyText = "موردی برای نمایش وجود ندارد.", children }) {
  if (loading) return <div className="async-state" aria-busy="true"><span className="loading-spinner" />در حال دریافت اطلاعات…</div>;
  if (error) return <div className="async-state is-error" role="alert"><p>{error}</p>{onRetry && <button className="btn btn-ghost" onClick={onRetry}>تلاش مجدد</button>}</div>;
  if (empty) return <div className="async-state is-empty"><p>{emptyText}</p></div>;
  return children;
}

function useEnhancedFileInputs(rootSelector = "#root") {
  React.useEffect(() => {
    const root = document.querySelector(rootSelector);
    if (!root) return;
    const enhance = (input) => {
      if (input.dataset.enhanced || input.type !== "file") return;
      input.dataset.enhanced = "1";
      const host = input.closest("label") || input.parentElement;
      if (!host) return;
      host.classList.add("enhanced-upload");
      const validate = () => {
        const files = [...(input.files || [])];
        host.classList.remove("upload-invalid", "upload-ready");
        if (!files.length) return;
        const invalid = files.find((file) => file.size > 10 * 1024 * 1024 || (input.accept?.includes("image") && !file.type.startsWith("image/")));
        if (invalid) {
          input.setCustomValidity("تصویر باید معتبر و کوچک‌تر از ۱۰ مگابایت باشد.");
          host.classList.add("upload-invalid");
        } else {
          input.setCustomValidity(""); host.classList.add("upload-ready");
          if (files[0].type.startsWith("image/")) {
            const url = URL.createObjectURL(files[0]);
            host.style.setProperty("--upload-preview", `url(${url})`);
            setTimeout(() => URL.revokeObjectURL(url), 30000);
          }
        }
      };
      input.addEventListener("change", validate);
      ["dragenter", "dragover"].forEach((name) => host.addEventListener(name, (event) => { event.preventDefault(); host.classList.add("is-dragging"); }));
      ["dragleave", "drop"].forEach((name) => host.addEventListener(name, () => host.classList.remove("is-dragging")));
    };
    root.querySelectorAll('input[type="file"]').forEach(enhance);
    const observer = new MutationObserver(() => root.querySelectorAll('input[type="file"]').forEach(enhance));
    observer.observe(root, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, [rootSelector]);
}
