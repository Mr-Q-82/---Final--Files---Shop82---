function DeferredFeature({ children, timeout = 1200, placeholder = null }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let timer;
    const start = () => setReady(true);
    if ("requestIdleCallback" in window) {
      timer = window.requestIdleCallback(start, { timeout });
      return () => window.cancelIdleCallback(timer);
    }
    timer = window.setTimeout(start, Math.min(timeout, 500));
    return () => window.clearTimeout(timer);
  }, [timeout]);
  return ready ? children : placeholder;
}

function DeferredSection({ children, minHeight = 240, rootMargin = "300px" }) {
  const host = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    if (!host.current || !("IntersectionObserver" in window)) {
      setVisible(true);
      return undefined;
    }
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin },
    );
    observer.observe(host.current);
    return () => observer.disconnect();
  }, [rootMargin]);
  return <div ref={host} style={!visible ? { minHeight } : undefined}>{visible ? children : null}</div>;
}

function useDebouncedValue(value, delay = 250) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(timer);
  }, [value, delay]);
  return debounced;
}

function useFormModel(initialValues, validate) {
  const [values, setValues] = useState(initialValues);
  const [errors, setErrors] = useState({});
  const setField = useCallback((name, value) => {
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
  }, []);
  const submit = useCallback(
    (handler) => async (event) => {
      event?.preventDefault?.();
      const nextErrors = validate ? validate(values) || {} : {};
      setErrors(nextErrors);
      if (!Object.keys(nextErrors).length) await handler(values);
    },
    [values, validate],
  );
  return { values, errors, setValues, setField, submit };
}
