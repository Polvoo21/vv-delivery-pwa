function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function Container({ as: Component = "div", wide = false, className = "", ...props }) {
  return <Component className={cx(wide ? "vv-container-wide" : "vv-container", className)} {...props} />;
}

export function Section({ as: Component = "section", className = "", ...props }) {
  return <Component className={cx("vv-section", className)} {...props} />;
}

export function SectionHeader({ eyebrow, title, children, className = "" }) {
  return (
    <header className={cx("vv-section-header", className)}>
      {eyebrow ? <p className="vv-eyebrow">{eyebrow}</p> : null}
      {title ? <h2 className="vv-title">{title}</h2> : null}
      {children ? <div className="vv-body">{children}</div> : null}
    </header>
  );
}
