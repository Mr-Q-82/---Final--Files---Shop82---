function Login({ onLogin }) {
  const { fieldErrors, validateField, validateFields, clearFieldErrors } =
    useValidationErrors();
  const [method, setMethod] = useState("password"),
    [step, setStep] = useState("login"),
    [phone, setPhone] = useState(""),
    [password, setPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [code, setCode] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [debug, setDebug] = useState("");
  const [otpSeconds, startOtpTimer, clearOtpTimer] = useOtpTimer();
  const finish = (r) => {
    if (!["ADMIN", "STAFF"].includes(r.user.role))
      throw new Error("این حساب اجازه ورود به پنل مدیریت را ندارد.");
    AuthTokenVault.set(r.access);
    CrossTabChannel.send("login");
    onLogin(r.user);
  };
  const loginPassword = async () => {
    const validation = validateFields(
      { phone, login_password: password },
      {
        phone: { optional: false },
        login_password: { optional: false },
      },
    );
    if (!validation.valid) return;
    setBusy(true);
    setError("");
    try {
      const result = await api("/auth/password/login/", {
        method: "POST",
        body: JSON.stringify({ phone, password, admin_panel: true }),
      });
      if (result.requires_2fa) {
        setMethod("otp");
        setStep("otp-code");
        setDebug(result.debug_code || "");
        startOtpTimer(result.expires_in || 120);
      } else finish(result);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const requestCode = async (purpose) => {
    const validation = validateFields(
      { phone },
      { phone: { optional: false } },
    );
    if (!validation.valid) return;
    setBusy(true);
    setError("");
    try {
      const r = await api("/auth/otp/request/", {
        method: "POST",
        body: JSON.stringify({ phone, purpose }),
      });
      setDebug(r.debug_code || "");
      setCode("");
      setStep(purpose === "LOGIN" ? "otp-code" : "reset-code");
      startOtpTimer(r.expires_in || 120);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const verifyLogin = async () => {
    const validation = validateFields({ code }, { code: { optional: false } });
    if (!validation.valid) return;
    setBusy(true);
    setError("");
    try {
      finish(
        await api("/auth/otp/verify/", {
          method: "POST",
          body: JSON.stringify({ phone, purpose: "LOGIN", code }),
        }),
      );
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const resetPassword = async () => {
    const validation = validateFields(
      { code, new_password: newPassword },
      { code: { optional: false }, new_password: { optional: false } },
    );
    if (!validation.valid) return;
    setBusy(true);
    setError("");
    try {
      await api("/auth/password/reset/", {
        method: "POST",
        body: JSON.stringify({ phone, code, new_password: newPassword }),
      });
      setMethod("password");
      setStep("login");
      setPassword("");
      setNewPassword("");
      setCode("");
      setDebug("");
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  const changeMethod = (next) => {
    setMethod(next);
    setStep("login");
    setCode("");
    setDebug("");
    setError("");
    clearFieldErrors();
    clearOtpTimer();
  };
  const submit = () =>
    method === "password"
      ? loginPassword()
      : step === "otp-code"
        ? verifyLogin()
        : requestCode("LOGIN");
  return (
    <main className="login-screen">
      <div className="ambient"></div>
      <section className="login-card glass">
        <div className="brand">
          <span className="mark">82</span>
          <span>فروشگاه 82</span>
        </div>
        <h1>
          {method === "reset" ? "بازیابی رمز عبور" : "ورود به پنل مدیریت"}
        </h1>
        <p>
          {method === "reset"
            ? "با کد پیامکی، رمز جدید تعیین کنید."
            : "یکی از روش‌های ورود را انتخاب کنید."}
        </p>
        {method !== "reset" && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 7,
              marginBottom: 18,
            }}
          >
            <button
              className={method === "password" ? "primary" : "secondary"}
              onClick={() => changeMethod("password")}
            >
              شماره و رمز
            </button>
            <button
              className={method === "otp" ? "primary" : "secondary"}
              onClick={() => changeMethod("otp")}
            >
              شماره و کد
            </button>
          </div>
        )}
        {error && <div className="error">{error}</div>}
        <div className={"field" + (fieldErrors.phone ? " field-invalid" : "")}>
          <label>شماره موبایل</label>
          <input
            dir="ltr"
            inputMode="tel"
            name="phone"
            required
            value={phone}
            disabled={step !== "login"}
            onChange={(e) => {
              setPhone(e.target.value);
              validateField("phone", e.target.value, { optional: false });
            }}
            placeholder="09123456789"
          />
          <small className="field-validation-message" hidden={!fieldErrors.phone}>
            {fieldErrors.phone}
          </small>
        </div>
        {method === "password" && (
          <div className={"field" + (fieldErrors.login_password ? " field-invalid" : "")}>
            <label>رمز عبور</label>
            <input
              dir="ltr"
              type="password"
              name="login_password"
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validateField("login_password", e.target.value, {
                  optional: false,
                });
              }}
              placeholder="رمز عبور"
              onKeyDown={(e) => e.key === "Enter" && submit()}
            />
            <small className="field-validation-message" hidden={!fieldErrors.login_password}>
              {fieldErrors.login_password}
            </small>
          </div>
        )}
        {(step === "otp-code" || step === "reset-code") && (
          <div className={"field" + (fieldErrors.code ? " field-invalid" : "")}>
            <label>کد تأیید ۶ رقمی</label>
            <input
              dir="ltr"
              inputMode="numeric"
              name="code"
              required
              maxLength="6"
              value={code}
              onChange={(e) => {
                const value = toLatinDigits(e.target.value)
                  .replace(/\D/g, "")
                  .slice(0, 6);
                setCode(value);
                validateField("code", value, { optional: false });
              }}
              placeholder="••••••"
            />
            <small className="field-validation-message" hidden={!fieldErrors.code}>
              {fieldErrors.code}
            </small>
            {debug && (
              <small className="hint">
                کد حالت توسعه: <b>{debug}</b>
              </small>
            )}
            <div className="otp-timer">
              <span>زمان اعتبار کد</span>
              <strong>{formatOtpTime(otpSeconds)}</strong>
              <button
                disabled={otpSeconds > 0 || busy}
                onClick={() =>
                  requestCode(
                    step === "reset-code" ? "RESET_PASSWORD" : "LOGIN",
                  )
                }
              >
                ارسال دوباره
              </button>
            </div>
          </div>
        )}
        {step === "reset-code" && (
          <div className={"field" + (fieldErrors.new_password ? " field-invalid" : "")}>
            <label>رمز عبور جدید</label>
            <input
              dir="ltr"
              type="password"
              name="new_password"
              required
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                validateField("new_password", e.target.value, {
                  optional: false,
                });
              }}
              placeholder="حداقل ۸ کاراکتر"
            />
            <small className="field-validation-message" hidden={!fieldErrors.new_password}>
              {fieldErrors.new_password}
            </small>
          </div>
        )}
        <button
          className="primary"
          onClick={
            method === "reset"
              ? step === "reset-code"
                ? resetPassword
                : () => requestCode("RESET_PASSWORD")
              : submit
          }
          disabled={busy}
        >
          {busy
            ? "در حال بررسی..."
            : method === "password"
              ? "ورود با رمز"
              : method === "reset"
                ? step === "reset-code"
                  ? "تغییر رمز عبور"
                  : "دریافت کد بازیابی"
                : step === "otp-code"
                  ? "تأیید و ورود"
                  : "دریافت کد تأیید"}
        </button>
        {method === "password" && (
          <button
            className="secondary"
            style={{ width: "100%", marginTop: 8 }}
            onClick={() => {
              setMethod("reset");
              setStep("login");
              setError("");
            }}
          >
            رمز عبور را فراموش کرده‌ام
          </button>
        )}
        {(step !== "login" || method === "reset") && (
          <button
            className="secondary"
            style={{ width: "100%", marginTop: 8 }}
            onClick={() => changeMethod("password")}
          >
            بازگشت به ورود
          </button>
        )}
      </section>
    </main>
  );
}
const statusLabel = {
  PENDING: "در انتظار پرداخت",
  PAID: "پرداخت‌شده",
  PROCESSING: "در حال آماده‌سازی",
  SENT: "ارسال‌شده",
  DELIVERED: "تحویل‌شده",
  CANCELED: "لغوشده",
  RETURNED: "مرجوعی",
};
