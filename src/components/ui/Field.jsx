function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Field({ label, error, className = "", children }) {
  return (
    <label className={cx("vv-field", className)}>
      {label ? <span>{label}</span> : null}
      {children}
      {error ? <small role="alert">{error}</small> : null}
    </label>
  );
}
