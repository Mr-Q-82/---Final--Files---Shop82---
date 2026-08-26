function BackendLoginForm({ setTab }) {
  const { setUser, nav, toast } = useStore();
  const { fieldErrors, validateField, validateFields, clearFieldErrors } =
    useValidationErrors();
  const [method, setMethod] = useState("password"),
    [step, setStep] = useState("login");
  const [mobile, setMobile] = useState(""),
    [password, setPassword] = useState(""),
    [newPassword, setNewPassword] = useState(""),
    [newPasswordConfirm, setNewPasswordConfirm] = useState(""),
    [code, setCode] = useState(""),
    [debugCode, setDebugCode] = useState(""),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  const [otpSeconds, startOtpTimer, clearOtpTimer] = useOtpTimer();
  const finish = (data) => {
    AuthTokenVault.set(data.access);
    CrossTabChannel.send("login");
    const account = {
      ...data.user,
      mobile: data.user.phone,
      firstName: data.user.first_name,
      lastName: data.user.last_name,
    };
    setUser(account);
    toast("خوش آمدید " + (account.firstName || "") + " 🎉");
    nav("profile");
  };
  const loginPassword = async () => {
    const validation = validateFields(
      { phone: mobile, login_password: password },
      { phone: { optional: false }, login_password: { optional: false } },
    );
    if (!validation.valid) return;
    setBusy(true);
    setError("");
    try {
      finish(
        await accountApi("/auth/password/login/", {
          method: "POST",
          body: JSON.stringify({ phone: mobile, password }),
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const requestCode = async (purpose) => {
    const validation = validateFields(
      { phone: mobile },
      { phone: { optional: false } },
    );
    if (!validation.valid) return;
    setBusy(true);
    setError("");
    try {
      const data = await accountApi("/auth/otp/request/", {
        method: "POST",
        body: JSON.stringify({ phone: mobile, purpose }),
      });
      setDebugCode(data.debug_code || "");
      setCode("");
      setStep(purpose === "LOGIN" ? "code" : "reset-code");
      startOtpTimer(data.expires_in || 120);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const verifyCode = async () => {
    const validation = validateFields({ code }, { code: { optional: false } });
    if (!validation.valid) return;
    setBusy(true);
    setError("");
    try {
      finish(
        await accountApi("/auth/otp/verify/", {
          method: "POST",
          body: JSON.stringify({ phone: mobile, purpose: "LOGIN", code }),
        }),
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const resetPassword = async () => {
    const validation = validateFields(
      {
        code,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      },
      {
        code: { optional: false },
        new_password: { optional: false },
        new_password_confirm: {
          optional: false,
          custom: (value) => value === newPassword,
          message: "تکرار رمز عبور جدید یکسان نیست.",
        },
      },
    );
    if (!validation.valid) return;
    setBusy(true);
    setError("");
    clearFieldErrors();
    try {
      await accountApi("/auth/password/reset/", {
        method: "POST",
        body: JSON.stringify({
          phone: mobile,
          code,
          new_password: newPassword,
          new_password_confirm: newPasswordConfirm,
        }),
      });
      toast("رمز عبور تغییر کرد؛ اکنون وارد شوید.");
      setMethod("password");
      setStep("login");
      setCode("");
      setNewPassword("");
      setNewPasswordConfirm("");
      setDebugCode("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const changeMethod = (next) => {
    setMethod(next);
    setStep("login");
    setCode("");
    setDebugCode("");
    setError("");
    clearFieldErrors();
    clearOtpTimer();
  };
  return (
    <div>
      <h3 style={{ marginBottom: 12 }}>
        {method === "reset" ? "بازیابی رمز عبور" : "ورود به حساب"}
      </h3>
      {method !== "reset" && (
        <div className="auth-tabs" style={{ marginBottom: 14 }}>
          <button
            className={method === "password" ? "on" : ""}
            onClick={() => changeMethod("password")}
          >
            شماره و رمز
          </button>
          <button
            className={method === "otp" ? "on" : ""}
            onClick={() => changeMethod("otp")}
          >
            شماره و کد
          </button>
        </div>
      )}
      <div className={"field" + (fieldErrors.phone ? " field-invalid" : "")}>
        <label>شماره موبایل</label>
        <input
          dir="ltr"
          style={{ textAlign: "left" }}
          name="phone"
          required
          value={mobile}
          disabled={step !== "login"}
          onChange={(e) => {
            setMobile(e.target.value);
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
          <PasswordInput
            name="login_password"
            required
            dir="ltr"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              validateField("login_password", e.target.value, {
                optional: false,
              });
            }}
          />
          <small className="field-validation-message" hidden={!fieldErrors.login_password}>
            {fieldErrors.login_password}
          </small>
        </div>
      )}
      {(step === "code" || step === "reset-code") && (
        <div className={"field" + (fieldErrors.code ? " field-invalid" : "")}>
          <label>کد تأیید ۶ رقمی</label>
          <input
            dir="ltr"
            name="code"
            required
            inputMode="numeric"
            maxLength="6"
            style={{ textAlign: "center" }}
            value={code}
            onChange={(e) => {
              const value = toLatinDigits(e.target.value)
                .replace(/\D/g, "")
                .slice(0, 6);
              setCode(value);
              validateField("code", value, { optional: false });
            }}
          />
          <small className="field-validation-message" hidden={!fieldErrors.code}>
            {fieldErrors.code}
          </small>
          {debugCode && <small>کد حالت توسعه: {debugCode}</small>}
          <div className="otp-timer">
            <span>زمان اعتبار کد</span>
            <strong>{formatOtpTime(otpSeconds)}</strong>
            <button
              disabled={otpSeconds > 0 || busy}
              onClick={() =>
                requestCode(step === "reset-code" ? "RESET_PASSWORD" : "LOGIN")
              }
            >
              ارسال دوباره
            </button>
          </div>
        </div>
      )}
      {step === "reset-code" && (
        <>
        <div className={"field" + (fieldErrors.new_password ? " field-invalid" : "")}>
          <label>رمز عبور جدید</label>
          <PasswordInput
            name="new_password"
            required
            dir="ltr"
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
        <div className={"field" + (fieldErrors.new_password_confirm ? " field-invalid" : "")}>
          <label>تکرار رمز عبور جدید</label>
          <PasswordInput
            name="new_password_confirm"
            required
            dir="ltr"
            value={newPasswordConfirm}
            onChange={(e) => {
              setNewPasswordConfirm(e.target.value);
              validateField("new_password_confirm", e.target.value, {
                optional: false,
                custom: (value) => value === newPassword,
                message: "تکرار رمز عبور جدید یکسان نیست.",
              });
            }}
            placeholder="رمز جدید را دوباره وارد کنید"
          />
          <small className="field-validation-message" hidden={!fieldErrors.new_password_confirm}>
            {fieldErrors.new_password_confirm}
          </small>
        </div>
        </>
      )}
      {error && (
        <div className="err-msg" style={{ marginBottom: 10 }}>
          {error}
        </div>
      )}
      <button
        className="btn btn-primary"
        style={{ width: "100%" }}
        disabled={busy}
        onClick={
          method === "password"
            ? loginPassword
            : method === "reset"
              ? step === "reset-code"
                ? resetPassword
                : () => requestCode("RESET_PASSWORD")
              : step === "code"
                ? verifyCode
                : () => requestCode("LOGIN")
        }
      >
        {busy
          ? "در حال بررسی..."
          : method === "password"
            ? "ورود با رمز"
            : method === "reset"
              ? step === "reset-code"
                ? "تغییر رمز عبور"
                : "دریافت کد بازیابی"
              : step === "code"
                ? "تأیید و ورود"
                : "دریافت کد تأیید"}
      </button>
      {method === "password" && (
        <button
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: 8 }}
          onClick={() => changeMethod("reset")}
        >
          رمز عبور را فراموش کرده‌ام
        </button>
      )}
      {(step !== "login" || method === "reset") && (
        <button
          className="btn btn-ghost"
          style={{ width: "100%", marginTop: 8 }}
          onClick={() => changeMethod("password")}
        >
          بازگشت به ورود
        </button>
      )}
      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-soft)",
          marginTop: 14,
        }}
      >
        حساب ندارید؟{" "}
        <b
          style={{ color: "var(--primary)", cursor: "pointer" }}
          onClick={() => setTab("register")}
        >
          ثبت‌نام کنید
        </b>
      </p>
    </div>
  );
}
