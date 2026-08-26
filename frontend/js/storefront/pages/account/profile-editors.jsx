function EditProfileV2() {
  const { user, setUser, toast } = useStore();
  const [f, setF] = useState({
    first_name: user.first_name || user.firstName || "",
    last_name: user.last_name || user.lastName || "",
    email: user.email || "",
    national_id: user.national_id || "",
    avatar: user.avatar || "avatar-1",
  });
  const [currentPassword, setCurrentPassword] = useState(""),
    [newPassword, setNewPassword] = useState("");
  const [emailStep, setEmailStep] = useState("edit"),
    [emailCode, setEmailCode] = useState(""),
    [debugEmailCode, setDebugEmailCode] = useState("");
  const [emailOtpSeconds, startEmailOtpTimer] = useOtpTimer();
  const avatars = ["🧑🏻", "👩🏻", "👨🏻‍💻", "👩🏻‍💻", "🧑🏻‍🚀"];
  const save = async () => {
    if (f.national_id && !validateMelli(f.national_id))
      return toast("کد ملی معتبر نیست", "error");
    try {
      const { email, ...profile } = f;
      const data = await accountApi("/auth/me/", {
        method: "PATCH",
        body: JSON.stringify(profile),
      });
      setUser({
        ...user,
        ...data,
        firstName: data.first_name,
        lastName: data.last_name,
        mobile: data.phone,
      });
      toast("اطلاعات به‌روزرسانی شد ✓");
    } catch (err) {
      toast(err.message, "error");
    }
  };
  const requestEmail = async () => {
    if (!RX.email.test(f.email)) return toast("ایمیل معتبر نیست", "error");
    try {
      const data = await accountApi("/auth/email/request/", {
        method: "POST",
        body: JSON.stringify({ email: f.email }),
      });
      setDebugEmailCode(data.debug_code || "");
      setEmailStep("verify");
      startEmailOtpTimer(data.expires_in || 120);
      toast("کد تأیید به ایمیل ارسال شد");
    } catch (err) {
      toast(err.message, "error");
    }
  };
  const verifyEmail = async () => {
    try {
      const data = await accountApi("/auth/email/verify/", {
        method: "POST",
        body: JSON.stringify({ email: f.email, code: emailCode }),
      });
      setUser({
        ...user,
        ...data,
        firstName: data.first_name,
        lastName: data.last_name,
        mobile: data.phone,
      });
      setEmailStep("edit");
      setEmailCode("");
      toast("ایمیل تأیید و ذخیره شد ✓");
    } catch (err) {
      toast(err.message, "error");
    }
  };
  const changePassword = async () => {
    if (newPassword.length < 8)
      return toast("رمز جدید حداقل ۸ کاراکتر باشد", "error");
    try {
      await accountApi("/auth/password/change/", {
        method: "POST",
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      setCurrentPassword("");
      setNewPassword("");
      toast("رمز عبور تغییر کرد ✓");
    } catch (err) {
      toast(err.message, "error");
    }
  };
  return (
    <div>
      <h2 className="section-title">ویرایش اطلاعات</h2>
      <p className="section-sub" dir="ltr" style={{ textAlign: "right" }}>
        {displayPhone(user.phone || user.mobile)}
      </p>
      <div className="field">
        <label>انتخاب تصویر پروفایل</label>
        <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
          {avatars.map((avatar, i) => (
            <button
              key={i}
              className={
                "iconbtn" + (f.avatar === `avatar-${i + 1}` ? " on" : "")
              }
              style={{
                fontSize: 24,
                border:
                  f.avatar === `avatar-${i + 1}`
                    ? "2px solid var(--primary)"
                    : "1px solid var(--border)",
              }}
              onClick={() => setF({ ...f, avatar: `avatar-${i + 1}` })}
            >
              {avatar}
            </button>
          ))}
        </div>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <div className="field">
          <label>نام</label>
          <input
            value={f.first_name}
            onChange={(e) => setF({ ...f, first_name: e.target.value })}
          />
        </div>
        <div className="field">
          <label>نام خانوادگی</label>
          <input
            value={f.last_name}
            onChange={(e) => setF({ ...f, last_name: e.target.value })}
          />
        </div>
      </div>
      <div className="field">
        <label>
          ایمیل {user.email_verified && f.email === user.email ? "✓" : ""}
        </label>
        <div style={{ display: "flex", gap: 8 }}>
          <input
            dir="ltr"
            value={f.email}
            disabled={emailStep === "verify"}
            onChange={(e) => setF({ ...f, email: e.target.value })}
          />
          {emailStep === "edit" && (
            <button className="btn btn-ghost" onClick={requestEmail}>
              ارسال کد
            </button>
          )}
        </div>
      </div>
      {emailStep === "verify" && (
        <div className="field">
          <label>کد ۶ رقمی ایمیل</label>
          <div style={{ display: "flex", gap: 8 }}>
            <input
              dir="ltr"
              value={emailCode}
              onChange={(e) =>
                setEmailCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
            />
            <button className="btn btn-primary" onClick={verifyEmail}>
              تأیید ایمیل
            </button>
          </div>
          {debugEmailCode && <small>کد حالت توسعه: {debugEmailCode}</small>}
          <div className="otp-timer">
            <span>زمان اعتبار کد</span>
            <strong>{formatOtpTime(emailOtpSeconds)}</strong>
            <button disabled={emailOtpSeconds > 0} onClick={requestEmail}>
              ارسال دوباره
            </button>
          </div>
        </div>
      )}
      <div className="field">
        <label>کد ملی</label>
        <input
          dir="ltr"
          value={f.national_id}
          onChange={(e) =>
            setF({
              ...f,
              national_id: e.target.value.replace(/\D/g, "").slice(0, 10),
            })
          }
        />
      </div>
      <button className="btn btn-primary" onClick={save}>
        ذخیره اطلاعات
      </button>
      <hr
        style={{
          border: 0,
          borderTop: "1px solid var(--border)",
          margin: "24px 0",
        }}
      />
      <h3>تغییر رمز عبور</h3>
      <div className="field">
        <label>رمز فعلی</label>
        <input
          type="password"
          dir="ltr"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.target.value)}
        />
      </div>
      <div className="field">
        <label>رمز جدید</label>
        <input
          type="password"
          dir="ltr"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
        />
      </div>
      <button className="btn btn-ghost" onClick={changePassword}>
        تغییر رمز
      </button>
    </div>
  );
}
