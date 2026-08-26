/* ============================================================
   TOASTS
   ============================================================ */
function Toasts() {
  const { toasts } = useStore();
  return ReactDOM.createPortal(
    <div className="toast-wrap" role="status" aria-live="polite" aria-atomic="false">
      {toasts.map((t) => (
        <div key={t.id} className={"toast " + t.type}>
          {t.type === "success" ? (
            <I.shield
              className="icon"
              style={{ width: 20, height: 20, color: "var(--success)" }}
            />
          ) : (
            <I.x
              className="icon"
              style={{ width: 20, height: 20, color: "var(--danger)" }}
            />
          )}
          {t.msg}
        </div>
      ))}
    </div>,
    document.body,
  );
}
