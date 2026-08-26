function DatabaseBackupManager() {
  const [backupFile, setBackupFile] = useState(null),
    [busy, setBusy] = useState(""),
    [message, setMessage] = useState(""),
    [error, setError] = useState("");

  const createBackup = async () => {
    setBusy("backup");
    setError("");
    setMessage("");
    try {
      const response = await fetch(`${API}/operations/database-backup/`, {
        headers: { Authorization: `Bearer ${AuthTokenVault.get()}` },
      });
      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(apiError(data));
      }
      const disposition = response.headers.get("Content-Disposition") || "";
      const match = disposition.match(/filename\*?=(?:UTF-8''|\")?([^\";]+)/i);
      const filename = decodeURIComponent(match?.[1] || "shop82-full-backup.zip");
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      setMessage("فایل بکاپ کامل دیتابیس و تصاویر با موفقیت ساخته و دانلود شد.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  const restoreBackup = async () => {
    if (!backupFile) {
      setError("ابتدا فایل بکاپ کامل با پسوند zip را انتخاب کنید.");
      return;
    }
    const accepted = await siteConfirm(
      "تمام اطلاعات دیتابیس و تصاویر فعلی با محتوای این بکاپ جایگزین می‌شوند. قبل از ریستور یک بکاپ کامل ایمنی ساخته خواهد شد.",
      "ریستور کامل فروشگاه",
    );
    if (!accepted) return;
    setBusy("restore");
    setError("");
    setMessage("");
    const body = new FormData();
    body.append("backup", backupFile);
    body.append("confirmation", "RESTORE");
    try {
      const result = await api("/operations/database-backup/", {
        method: "POST",
        body,
        // Full restore includes database loading and media replacement and can
        // legitimately take much longer than the global 15-second API timeout.
        timeout: 30 * 60 * 1000,
      });
      setMessage(result.detail);
      notifyStorefrontChanged("full-backup-restored");
      AuthTokenVault.clear();
      CrossTabChannel.send("logout");
      setTimeout(() => location.reload(), 2200);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  };

  return (
    <div className="dash-bottom database-backup-page">
      {error && <div className="error">{error}</div>}
      {message && <div className="success">{message}</div>}
      <section className="card glass">
        <div className="card-head">
          <div>
            <h2>دریافت بکاپ کامل فروشگاه</h2>
            <small>دیتابیس، تصاویر محصولات، گالری‌ها، لوگوها و بنرها در یک فایل</small>
          </div>
          <span className="pill green">امن و فشرده</span>
        </div>
        <p>فایل خروجی یک بسته فشرده <b>ZIP</b> شامل دیتابیس و تمام پوشه media است.</p>
        <button className="primary" disabled={!!busy} onClick={createBackup}>
          {busy === "backup" ? "در حال ساخت بکاپ..." : "دانلود بکاپ جدید"}
        </button>
      </section>
      <section className="card glass">
        <div className="card-head">
          <div>
            <h2>ریستور کامل فروشگاه</h2>
            <small>بازگرداندن هم‌زمان اطلاعات دیتابیس و تمام تصاویر</small>
          </div>
          <span className="pill red">عملیات حساس</span>
        </div>
        <div className="field upload-box">
          <label>انتخاب فایل بکاپ</label>
          <input
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => setBackupFile(event.target.files?.[0] || null)}
          />
          <small>{backupFile ? backupFile.name : "حداکثر حجم مجاز: ۲ گیگابایت"}</small>
        </div>
        <button className="danger-btn" disabled={!!busy || !backupFile} onClick={restoreBackup}>
          {busy === "restore" ? "در حال ریستور..." : "ریستور فایل انتخاب‌شده"}
        </button>
      </section>
      <section className="card glass">
        <div className="card-head"><h2>نکات مهم</h2></div>
        <ul>
          <li>بکاپ شامل دیتابیس و تمام فایل‌های تصویری پوشه media است.</li>
          <li>فقط فایل‌های کامل ZIP که از همین بخش گرفته شده‌اند قابل ریستور هستند.</li>
          <li>فایل backups.zip نسخه‌های قدیمی شامل دیتابیس و media نیز پشتیبانی می‌شود.</li>
          <li>قبل از ریستور، بکاپ کامل ایمنی در پوشه backend/backups ساخته می‌شود.</li>
          <li>پس از ریستور برای امنیت باید دوباره وارد پنل مدیریت شوید.</li>
          <li>هنگام ریستور، دیتابیس و تصاویر دقیقاً به وضعیت زمان بکاپ برمی‌گردند.</li>
        </ul>
      </section>
    </div>
  );
}
