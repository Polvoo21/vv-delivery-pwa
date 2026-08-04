function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Badge({ as: Component = "span", tone = "sage", className = "", ...props }) {
  return <Component className={cx("vv-badge", tone === "warm" && "vv-badge-warm", className)} {...props} />;
}
