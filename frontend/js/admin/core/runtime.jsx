const { useEffect, useMemo, useRef, useState } = React;
const formatOtpTime = (seconds) =>
  `${String(Math.floor(seconds / 60)).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
function useOtpTimer() {
  const [otpSeconds, setOtpSeconds] = useState(0);
  useEffect(() => {
    if (otpSeconds <= 0) return;
    const id = setTimeout(
      () => setOtpSeconds((value) => Math.max(0, value - 1)),
      1000,
    );
    return () => clearTimeout(id);
  }, [otpSeconds]);
  return [
    otpSeconds,
    (seconds = 120) => setOtpSeconds(Number(seconds) || 120),
    () => setOtpSeconds(0),
  ];
}
const defaultApiBase = () => {
  if (["5500", "5501", "5173"].includes(location.port))
    return `${location.protocol}//${location.hostname}:8000/api/v1`;
  return `${location.origin}/api/v1`;
};
const storedApiBase = localStorage.getItem("api_base");
const isLocalFrontend = ["5500", "5501", "5173"].includes(location.port);
// Avoid connecting this local panel to an API address saved by another copy.
const API = isLocalFrontend ? defaultApiBase() : storedApiBase || defaultApiBase();
if (isLocalFrontend && storedApiBase && storedApiBase !== API)
  localStorage.setItem("api_base", API);
const adminAjax = new AjaxClient({
  baseUrl: API,
  timeout: 15000,
  getToken: () => AuthTokenVault.get(),
});
const fmt = (n) => (Number(n) || 0).toLocaleString("fa-IR");
const jalaliDate = (value, withTime = false) => {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "long",
    day: "numeric",
    ...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
  }).format(date);
};
const jalaliShort = (value) =>
  value
    ? new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
        month: "short",
        day: "numeric",
      }).format(new Date(value))
    : "—";
const jalaliNumeric = (value) => {
  if (!value) return "";
  const parts = new Intl.DateTimeFormat("fa-IR-u-ca-persian", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(new Date(value));
  const get = (t) => (parts.find((x) => x.type === t) || {}).value || "";
  return `${get("year")}/${get("month")}/${get("day")} ${get("hour")}:${get("minute")}`;
};
const latinDigits = (value) =>
  String(value || "").replace(/[۰-۹]/g, (d) => "۰۱۲۳۴۵۶۷۸۹".indexOf(d));
const jalaliToIso = (value) => {
  if (!value) return null;
  const match = latinDigits(value).match(
    /^(\d{4})[/-](\d{1,2})[/-](\d{1,2})(?:\s+(\d{1,2}):(\d{2}))?$/,
  );
  if (!match)
    throw new Error("تاریخ شمسی را مانند ۱۴۰۵/۰۵/۰۶ ۱۲:۳۰ وارد کنید.");
  let jy = +match[1] + 1595,
    jm = +match[2],
    jd = +match[3],
    days =
      -355668 +
      365 * jy +
      Math.floor(jy / 33) * 8 +
      Math.floor(((jy % 33) + 3) / 4) +
      jd +
      (jm < 7 ? (jm - 1) * 31 : (jm - 7) * 30 + 186),
    gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let gd = days + 1,
    leap = (gy % 4 === 0 && gy % 100 !== 0) || gy % 400 === 0,
    sizes = [31, leap ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31],
    gm = 1;
  for (const size of sizes) {
    if (gd <= size) break;
    gd -= size;
    gm++;
  }
  return new Date(
    gy,
    gm - 1,
    gd,
    +(match[4] || 0),
    +(match[5] || 0),
  ).toISOString();
};
const JALALI_MONTHS = [
  "فروردین",
  "اردیبهشت",
  "خرداد",
  "تیر",
  "مرداد",
  "شهریور",
  "مهر",
  "آبان",
  "آذر",
  "دی",
  "بهمن",
  "اسفند",
];
const JALALI_WEEKDAYS = ["ش", "ی", "د", "س", "چ", "پ", "ج"];
const jalaliPickerParts = (value) => {
  const numeric = latinDigits(jalaliNumeric(value || new Date()));
  const match = numeric.match(/^(\d{4})\/(\d{2})\/(\d{2})\s+(\d{2}):(\d{2})$/);
  return {
    year: Number(match?.[1] || 1405),
    month: Number(match?.[2] || 1),
    day: Number(match?.[3] || 1),
    time: `${match?.[4] || "12"}:${match?.[5] || "00"}`,
  };
};
const jalaliMonthLength = (year, month) => {
  const nextYear = month === 12 ? year + 1 : year;
  const nextMonth = month === 12 ? 1 : month + 1;
  const start = new Date(jalaliToIso(`${year}/${month}/1 00:00`));
  const end = new Date(jalaliToIso(`${nextYear}/${nextMonth}/1 00:00`));
  return Math.round((end - start) / 86400000);
};
function JalaliDateTimePicker({ name, label, value, required = false }) {
  const initial = jalaliPickerParts(value);
  const [year, setYear] = useState(initial.year);
  const [month, setMonth] = useState(initial.month);
  const [day, setDay] = useState(initial.day);
  const [time, setTime] = useState(initial.time);
  const [open, setOpen] = useState(false);
  const monthLength = jalaliMonthLength(year, month);
  const firstWeekday =
    (new Date(jalaliToIso(`${year}/${month}/1 00:00`)).getDay() + 1) % 7;
  const hiddenValue = `${year}/${String(month).padStart(2, "0")}/${String(
    day,
  ).padStart(2, "0")} ${time}`;
  const moveMonth = (amount) => {
    let nextMonth = month + amount;
    let nextYear = year;
    if (nextMonth < 1) {
      nextMonth = 12;
      nextYear -= 1;
    } else if (nextMonth > 12) {
      nextMonth = 1;
      nextYear += 1;
    }
    setYear(nextYear);
    setMonth(nextMonth);
    setDay((current) =>
      Math.min(current, jalaliMonthLength(nextYear, nextMonth)),
    );
  };
  const selectToday = () => {
    const today = jalaliPickerParts(new Date());
    setYear(today.year);
    setMonth(today.month);
    setDay(today.day);
    setTime(today.time);
  };
  return (
    <div className="field jalali-picker">
      <label>{label}</label>
      <input
        name={name}
        type="hidden"
        value={hiddenValue}
        required={required}
        readOnly
      />
      <button
        type="button"
        className="jalali-picker-trigger"
        onClick={() => setOpen((current) => !current)}
      >
        <span>🗓️</span>
        <b>
          {fmt(day)} {JALALI_MONTHS[month - 1]} {fmt(year)}
        </b>
        <small>{time}</small>
      </button>
      {open && (
        <div className="jalali-calendar" role="dialog" aria-label={label}>
          <div className="jalali-calendar-head">
            <button type="button" onClick={() => moveMonth(-1)}>
              ›
            </button>
            <strong>
              {JALALI_MONTHS[month - 1]} {fmt(year)}
            </strong>
            <button type="button" onClick={() => moveMonth(1)}>
              ‹
            </button>
          </div>
          <div className="jalali-calendar-grid weekdays">
            {JALALI_WEEKDAYS.map((item) => (
              <span key={item}>{item}</span>
            ))}
          </div>
          <div className="jalali-calendar-grid days">
            {Array.from({ length: firstWeekday }).map((_, index) => (
              <span key={`empty-${index}`} />
            ))}
            {Array.from({ length: monthLength }, (_, index) => index + 1).map(
              (number) => (
                <button
                  type="button"
                  className={number === day ? "selected" : ""}
                  onClick={() => setDay(number)}
                  key={number}
                >
                  {fmt(number)}
                </button>
              ),
            )}
          </div>
          <div className="jalali-calendar-footer">
            <button type="button" className="secondary" onClick={selectToday}>
              امروز
            </button>
            <label>
              ساعت
              <input
                type="time"
                value={time}
                onChange={(event) => setTime(event.target.value)}
                required
              />
            </label>
            <button
              type="button"
              className="primary"
              onClick={() => setOpen(false)}
            >
              تأیید
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
const displayPhone = (phone) =>
  String(phone || "").startsWith("+98") ? "0" + String(phone).slice(3) : phone;
const apiError = (data) => {
  const pick = (value) => {
    if (typeof value === "string") return value;
    if (Array.isArray(value)) return pick(value[0]);
    if (value && typeof value === "object") {
      if (value.detail) return pick(value.detail);
      for (const item of Object.values(value)) {
        const found = pick(item);
        if (found) return found;
      }
    }
    return "";
  };
  return pick(data?.error?.details || data);
};
const notifyStorefrontChanged = (reason = "admin-update") => {
  const revision = String(Date.now());
  localStorage.setItem("catalog_revision", revision);
  Object.keys(localStorage)
    .filter((key) => key.startsWith("catalog_cache_"))
    .forEach((key) => localStorage.removeItem(key));
  localStorage.removeItem("catalog_cache_categories");
  if ("caches" in window)
    caches.delete("shop82-catalog-api-v2").catch(() => {});
  CrossTabChannel.send("catalog-invalidated", { reason, revision });
};
const adminMediaUrl = (url) => {
  if (!url) return "";
  const raw = String(url);
  if (/^(data:|blob:)/i.test(raw)) return raw;
  let resolved = raw;
  try {
    resolved = new URL(raw, `${new URL(API, location.origin).origin}/`).href;
  } catch (_) {}
  const revision = localStorage.getItem("catalog_revision") || "initial";
  const separator = resolved.includes("?") ? "&" : "?";
  return `${resolved}${separator}admin_v=${encodeURIComponent(revision)}`;
};
const api = async (path, options = {}) => {
  const publicAuth =
    path.startsWith("/auth/otp/") ||
    path === "/auth/password/login/" ||
    path === "/auth/password/reset/";
  try {
    const result = await adminAjax.request(path, { ...options, auth: !publicAuth });
    const method = String(options.method || "GET").toUpperCase();
    if (method !== "GET" && path.startsWith("/catalog/"))
      notifyStorefrontChanged(path);
    return result;
  } catch (error) {
    if (error.status === 401 && !publicAuth) {
      AuthTokenVault.clear();
      throw new Error("نشست شما منقضی شده است.");
    }
    throw new Error(apiError(error.data) || error.message || "خطا در ارتباط با سرور");
  }
};
const apiAll = async (path, options = {}) => {
  const rows = [];
  let next = path;
  while (next) {
    const data = await api(next, options);
    if (Array.isArray(data)) return [...rows, ...data];
    rows.push(...(data.results || []));
    next = data.next || null;
  }
  return rows;
};
const downloadFile = async (path, name) => {
  const response = await fetch(API + path, {
    headers: { Authorization: "Bearer " + AuthTokenVault.get() },
  });
  if (!response.ok) throw new Error("دریافت فایل ناموفق بود.");
  const blob = await response.blob(),
    url = URL.createObjectURL(blob),
    link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  URL.revokeObjectURL(url);
};
