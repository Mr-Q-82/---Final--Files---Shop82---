function QuickRegisterForm({ setTab }) {
  const { setUser, nav, toast } = useStore();
  const { fieldErrors, validateField, validateFields, clearFieldErrors } =
    useValidationErrors();
  const [name, setName] = useState("");
  const [mobile, setMobile] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [code, setCode] = useState("");
  const [step, setStep] = useState("details");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [debugCode, setDebugCode] = useState("");
  const [otpSeconds, startOtpTimer] = useOtpTimer();
  const requestCode = async () => {
    const validation = validateFields(
      {
        first_name: name,
        phone: mobile,
        password,
        password_confirm: passwordConfirm,
        referral_code: referralCode,
      },
      {
        first_name: { optional: false },
        phone: { optional: false },
        password: { optional: false },
        password_confirm: {
          optional: false,
          custom: (value) => value === password,
          message: "تکرار رمز عبور با رمز عبور یکسان نیست.",
        },
      },
    );
    if (!validation.valid) {
      return;
    }
    setName(validation.values.first_name);
    setMobile(validation.values.phone);
    setReferralCode(validation.values.referral_code);
    setBusy(true);
    setError("");
    try {
      const data = await accountApi("/auth/otp/request/", {
        method: "POST",
        body: JSON.stringify({
          phone: validation.values.phone,
          purpose: "REGISTER",
        }),
      });
      setDebugCode(data.debug_code || "");
      setStep("code");
      startOtpTimer(data.expires_in || 120);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  const verify = async () => {
    const validation = validateFields({ code }, { code: { optional: false } });
    if (!validation.valid) {
      return;
    }
    setBusy(true);
    setError("");
    try {
      const data = await accountApi("/auth/otp/verify/", {
        method: "POST",
        body: JSON.stringify({
          phone: mobile,
          purpose: "REGISTER",
          code,
          first_name: name.trim(),
          password,
          password_confirm: passwordConfirm,
          referral_code: referralCode.trim(),
        }),
      });
      AuthTokenVault.set(data.access);
      CrossTabChannel.send("login");
      const account = {
        ...data.user,
        mobile: data.user.phone,
        firstName: data.user.first_name,
        lastName: data.user.last_name,
      };
      setUser(account);
      toast(
        "ثبت‌نام اولیه با موفقیت انجام شد؛ اطلاعات تکمیلی را در پنل کاربری وارد کنید.",
      );
      nav("profile");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div>
      <h3 style={{ marginBottom: 16 }}>ثبت‌نام</h3>
      {step === "details" ? (
        <>
          <div className={"field" + (fieldErrors.first_name ? " field-invalid" : "")}>
            <label>نام</label>
            <input
              name="first_name"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                validateField("first_name", e.target.value, {
                  optional: false,
                });
              }}
              placeholder="مثلاً مهدی"
            />
            <small className="field-validation-message" hidden={!fieldErrors.first_name}>
              {fieldErrors.first_name}
            </small>
          </div>
          <div className={"field" + (fieldErrors.phone ? " field-invalid" : "")}>
            <label>شماره موبایل</label>
            <input
              dir="ltr"
              style={{ textAlign: "left" }}
              value={mobile}
              name="phone"
              required
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
          <div className={"field" + (fieldErrors.referral_code ? " field-invalid" : "")}>
            <label>کد دعوت (اختیاری)</label>
            <input
              dir="ltr"
              style={{ textAlign: "left", textTransform: "uppercase" }}
              value={referralCode}
              name="referral_code"
              onChange={(e) => {
                const value = e.target.value.toUpperCase();
                setReferralCode(value);
                validateField("referral_code", value, { optional: true });
              }}
              placeholder="اگر کد دعوت دارید وارد کنید"
              maxLength="16"
            />
            <small className="field-validation-message" hidden={!fieldErrors.referral_code}>
              {fieldErrors.referral_code}
            </small>
            <small style={{ color: "var(--muted)" }}>
              با کد معتبر، امتیاز هدیه‌ای که مدیر تعیین کرده دریافت می‌کنید.
            </small>
          </div>
          <div className={"field" + (fieldErrors.password ? " field-invalid" : "")}>
            <label>رمز عبور</label>
            <PasswordInput
              dir="ltr"
              name="password"
              required
              autoComplete="new-password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                validateField("password", e.target.value, { optional: false });
              }}
              placeholder="حرف بزرگ، کوچک، عدد و نماد"
            />
            <small className="field-validation-message" hidden={!fieldErrors.password}>
              {fieldErrors.password}
            </small>
          </div>
          <div className={"field" + (fieldErrors.password_confirm ? " field-invalid" : "")}>
            <label>تکرار رمز عبور</label>
            <PasswordInput
              dir="ltr"
              name="password_confirm"
              required
              autoComplete="new-password"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                validateField("password_confirm", e.target.value, {
                  optional: false,
                  custom: (value) => value === password,
                  message: "تکرار رمز عبور با رمز عبور یکسان نیست.",
                });
              }}
              placeholder="رمز عبور را دوباره وارد کنید"
            />
            <small className="field-validation-message" hidden={!fieldErrors.password_confirm}>
              {fieldErrors.password_confirm}
            </small>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={busy}
            onClick={requestCode}
          >
            {busy ? "در حال ارسال..." : "دریافت کد تأیید"}
          </button>
        </>
      ) : (
        <>
          <div className={"field" + (fieldErrors.code ? " field-invalid" : "")}>
            <label>کد تأیید ۶ رقمی</label>
            <input
              dir="ltr"
              style={{ textAlign: "center" }}
              value={code}
              name="code"
              required
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
          </div>
          {debugCode && (
            <div
              style={{
                textAlign: "center",
                marginBottom: 12,
                color: "var(--primary)",
              }}
            >
              کد حالت توسعه: <b>{debugCode}</b>
            </div>
          )}
          <div className="otp-timer">
            <span>زمان اعتبار کد</span>
            <strong>{formatOtpTime(otpSeconds)}</strong>
            <button disabled={otpSeconds > 0 || busy} onClick={requestCode}>
              ارسال دوباره
            </button>
          </div>
          <button
            className="btn btn-primary"
            style={{ width: "100%" }}
            disabled={busy}
            onClick={verify}
          >
            {busy ? "در حال بررسی..." : "تأیید و ساخت حساب"}
          </button>
          <button
            className="btn btn-ghost"
            style={{ width: "100%", marginTop: 8 }}
            onClick={() => {
              setStep("details");
              setCode("");
              setError("");
              clearFieldErrors();
            }}
          >
            تغییر اطلاعات
          </button>
        </>
      )}
      {error && (
        <div className="err-msg" style={{ marginTop: 10 }}>
          {error}
        </div>
      )}
      <p
        style={{
          textAlign: "center",
          fontSize: 13,
          color: "var(--text-soft)",
          marginTop: 14,
        }}
      >
        حساب دارید؟{" "}
        <b
          style={{ color: "var(--primary)", cursor: "pointer" }}
          onClick={() => setTab("login")}
        >
          وارد شوید
        </b>
      </p>
    </div>
  );
}
