const {
  useState,
  useEffect,
  useRef,
  createContext,
  useContext,
  useMemo,
  useCallback,
  useId,
} = React;
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

/* ============================================================
   ICONS (inline SVG - lightweight)
   ============================================================ */
