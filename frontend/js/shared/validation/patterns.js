/* Central source of truth for client-side regular expressions. */
const VALIDATION_PATTERNS = Object.freeze({
  name: /^(?=.{2,80}$)[\p{L}\p{M}]+(?:[\s‌'’-][\p{L}\p{M}]+)*$/u,
  phone: /^09\d{9}$/,
  email: /^(?=.{6,254}$)(?!.*\.\.)[A-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?(?:\.[A-Z0-9](?:[A-Z0-9-]{0,61}[A-Z0-9])?)+$/i,
  password: /^(?=.{8,128}$)(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[^\s]+$/,
  otp: /^\d{6}$/,
  nationalId: /^\d{10}$/,
  postalCode: /^(?!0)(?!.*(\d)\1{9})\d{10}$/,
  referral: /^[A-Z0-9]{8,16}$/,
  safeText: /^(?!.*[<>\u0000-\u0008\u000B\u000C\u000E-\u001F]).{2,2000}$/s,
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
});

const isValidNationalId = (rawValue) => {
  const value = toLatinDigits(rawValue).replace(/\D/g, "");
  if (!VALIDATION_PATTERNS.nationalId.test(value) || /^(\d)\1{9}$/.test(value))
    return false;
  const sum = value
    .slice(0, 9)
    .split("")
    .reduce((total, digit, index) => total + Number(digit) * (10 - index), 0);
  const remainder = sum % 11;
  const expected = remainder < 2 ? remainder : 11 - remainder;
  return Number(value[9]) === expected;
};
