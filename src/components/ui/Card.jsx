function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Card({ as: Component = "article", warm = false, className = "", ...props }) {
  return <Component className={cx("vv-card", warm && "vv-card-warm", className)} {...props} />;
}
