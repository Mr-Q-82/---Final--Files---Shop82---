function MapPicker({ value, onSelect }) {
  const ref = useRef(null);
  const mapRef = useRef(null);
  useEffect(() => {
    if (!ref.current || !window.L || mapRef.current) return;
    const lat = Number(value.latitude) || 35.6892;
    const lng = Number(value.longitude) || 51.389;
    const map = L.map(ref.current).setView([lat, lng], 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap",
    }).addTo(map);
    let marker = L.marker([lat, lng]).addTo(map);
    map.on("click", async (event) => {
      const { lat, lng } = event.latlng;
      marker.setLatLng([lat, lng]);
      let selectedAddress = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
      try {
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&accept-language=fa&lat=${lat}&lon=${lng}`,
        );
        const data = await response.json();
        selectedAddress = data.display_name || selectedAddress;
      } catch {}
      onSelect({
        latitude: lat.toFixed(6),
        longitude: lng.toFixed(6),
        address: selectedAddress,
      });
    });
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);
    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);
  return (
    <div
      ref={ref}
      style={{
        height: 230,
        borderRadius: 14,
        overflow: "hidden",
        marginBottom: 12,
      }}
    />
  );
}

function AddressInput({
  name,
  label,
  value,
  onChange,
  ltr,
  numeric,
  maxLength,
  error,
}) {
  return (
    <div className={"field" + (error ? " field-invalid" : "")}>
      <label>{label}</label>
      <input
        name={name}
        value={value || ""}
        dir={ltr ? "ltr" : "rtl"}
        inputMode={numeric ? "numeric" : undefined}
        maxLength={maxLength}
        style={ltr ? { textAlign: "left" } : {}}
        onChange={(event) => {
          const next = numeric
            ? event.target.value.replace(/\D/g, "").slice(0, maxLength)
            : event.target.value;
          onChange(name, next);
        }}
        aria-invalid={error ? "true" : "false"}
      />
      {error && <small className="field-validation-message">{error}</small>}
    </div>
  );
}

function AddressManagerV2() {
  const { toast, user } = useStore();
  const [items, setItems] = useState([]);
  const [show, setShow] = useState(false);
  const [edit, setEdit] = useState(null);
  const [errors, setErrors] = useState({});
  const empty = {
    title: "خانه",
    recipient_name: [
      user.first_name || user.firstName,
      user.last_name || user.lastName,
    ]
      .filter(Boolean)
      .join(" "),
    province: "",
    city: "",
    address: "",
    postal_code: "",
    recipient_phone: displayPhone(user.phone || user.mobile),
    national_id: user.national_id || "",
    latitude: "",
    longitude: "",
    is_default: false,
  };
  const [f, setF] = useState(empty);
  const load = () =>
    accountApiAll("/auth/addresses/?page_size=100")
      .then((data) => setItems(data.results || data))
      .catch((err) => toast(err.message, "error"));
  useEffect(() => {
    load();
  }, []);
  const open = (item) => {
    setEdit(item || null);
    setF(
      item
        ? { ...item, recipient_phone: displayPhone(item.recipient_phone) }
        : { ...empty },
    );
    setShow(true);
    setErrors({});
  };
  const save = async () => {
    const validation = validateValues(
      {
        recipient_name: f.recipient_name,
        recipient_phone: f.recipient_phone,
        postal_code: f.postal_code,
        national_id: f.national_id,
        address: f.address,
      },
      {
        recipient_name: { optional: false },
        recipient_phone: { optional: false },
        postal_code: { optional: false },
        national_id: { optional: false },
        address: { optional: false },
      },
    );
    const locationErrors = {
      ...validation.errors,
      ...(!f.province ? { province: "انتخاب استان الزامی است." } : {}),
      ...(!f.city ? { city: "انتخاب شهر الزامی است." } : {}),
    };
    if (Object.keys(locationErrors).length) {
      setErrors(locationErrors);
      return toast("لطفاً فیلدهای مشخص‌شده را اصلاح کنید.", "error");
    }
    setErrors({});
    try {
      await accountApi("/auth/addresses/" + (edit ? edit.id + "/" : ""), {
        method: edit ? "PATCH" : "POST",
        body: JSON.stringify(f),
      });
      setShow(false);
      load();
      toast("آدرس انتخاب‌شده ذخیره شد.");
    } catch (err) {
      toast(err.message, "error");
    }
  };
  const remove = async (item) => {
    if (!(await siteConfirm("آدرس حذف شود؟", "حذف آدرس"))) return;
    await accountApi(`/auth/addresses/${item.id}/`, { method: "DELETE" });
    load();
  };
  const updateField = (name, value) => {
    setF((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };
  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <div>
          <h2 className="section-title">آدرس‌های من</h2>
          <p className="section-sub">آدرس دقیق ارسال را روی نقشه انتخاب کنید</p>
        </div>
        <button className="btn btn-primary" onClick={() => open(null)}>
          <I.plus className="icon" /> آدرس جدید
        </button>
      </div>
      {!items.length && (
        <div
          className="glass"
          style={{ padding: 40, textAlign: "center", color: "var(--muted)" }}
        >
          آدرسی ثبت نشده است
        </div>
      )}
      {items.map((a) => (
        <div className="addr-card" key={a.id}>
          <div>
            <b>
              {a.title} · {a.province}، {a.city}
            </b>
            <p style={{ fontSize: 13, color: "var(--text-soft)" }}>
              {a.address}
            </p>
            <small style={{ color: "var(--muted)" }}>
              کدپستی: {a.postal_code} · موبایل:{" "}
              {displayPhone(a.recipient_phone)} · کد ملی: {a.national_id}
            </small>
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <button className="iconbtn" onClick={() => open(a)}>
              <I.edit className="icon" />
            </button>
            <button
              className="iconbtn"
              style={{ color: "var(--danger)" }}
              onClick={() => remove(a)}
            >
              <I.trash className="icon" />
            </button>
          </div>
        </div>
      ))}
      {show &&
        ReactDOM.createPortal(
          <>
            <div
              className="overlay"
              style={{ zIndex: 2147483644 }}
              onClick={() => setShow(false)}
            />
            <div
              className="glass"
              style={{
                position: "fixed",
                inset: "50% auto auto 50%",
                transform: "translate(-50%,-50%)",
                zIndex: 2147483645,
                padding: 24,
                width: "min(720px,94vw)",
                maxHeight: "88vh",
                overflowY: "auto",
                isolation: "isolate",
              }}
            >
              <h3 style={{ marginBottom: 16 }}>
                {edit ? "ویرایش آدرس" : "آدرس جدید"}
              </h3>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 12,
                }}
              >
                <div className={"field" + (errors.province ? " field-invalid" : "")}>
                  <label>استان</label>
                  <select
                    value={f.province}
                    onChange={(e) =>
                      setF((current) => ({
                        ...current,
                        province: e.target.value,
                        city: "",
                      }))
                    }
                    aria-invalid={errors.province ? "true" : "false"}
                  >
                    <option value="">انتخاب استان</option>
                    {Object.keys(IRAN_LOCATIONS).map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                  {errors.province && <small className="field-validation-message">{errors.province}</small>}
                </div>
                <div className={"field" + (errors.city ? " field-invalid" : "")}>
                  <label>شهر</label>
                  <select
                    value={f.city}
                    disabled={!f.province}
                    onChange={(e) => updateField("city", e.target.value)}
                    aria-invalid={errors.city ? "true" : "false"}
                  >
                    <option value="">انتخاب شهر</option>
                    {(IRAN_LOCATIONS[f.province] || []).map((name) => (
                      <option key={name}>{name}</option>
                    ))}
                  </select>
                  {errors.city && <small className="field-validation-message">{errors.city}</small>}
                </div>
                <AddressInput
                  name="recipient_name"
                  label="نام تحویل‌گیرنده"
                  value={f.recipient_name}
                  onChange={updateField}
                  error={errors.recipient_name}
                />
                <AddressInput
                  name="recipient_phone"
                  label="شماره موبایل"
                  value={f.recipient_phone}
                  onChange={updateField}
                  ltr
                  error={errors.recipient_phone}
                />
                <AddressInput
                  name="postal_code"
                  label="کد پستی"
                  value={f.postal_code}
                  onChange={updateField}
                  ltr
                  numeric
                  maxLength={10}
                  error={errors.postal_code}
                />
                <AddressInput
                  name="national_id"
                  label="کد ملی"
                  value={f.national_id}
                  onChange={updateField}
                  ltr
                  numeric
                  maxLength={10}
                  error={errors.national_id}
                />
              </div>
              <MapPicker
                value={f}
                onSelect={(location) =>
                  setF((current) => ({ ...current, ...location }))
                }
              />
              <div className={"field" + (errors.address ? " field-invalid" : "")}>
                <label>آدرس کامل انتخاب‌شده</label>
                <textarea
                  rows="3"
                  value={f.address}
                  onChange={(e) => updateField("address", e.target.value)}
                  aria-invalid={errors.address ? "true" : "false"}
                />
                {errors.address && <small className="field-validation-message">{errors.address}</small>}
              </div>
              <label className="fopt">
                <input
                  type="checkbox"
                  checked={f.is_default}
                  onChange={(e) => updateField("is_default", e.target.checked)}
                />{" "}
                آدرس پیش‌فرض
              </label>
              <div style={{ display: "flex", gap: 8, marginTop: 12 }}>
                <button
                  className="btn btn-primary"
                  style={{ flex: 1 }}
                  onClick={save}
                >
                  ثبت آدرس انتخاب‌شده
                </button>
                <button
                  className="btn btn-ghost"
                  onClick={() => setShow(false)}
                >
                  انصراف
                </button>
              </div>
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

