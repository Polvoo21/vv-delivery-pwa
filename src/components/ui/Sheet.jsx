function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export function SheetFrame({ as: Component = "section", className = "", children, ...props }) {
  return (
    <Component className={cx("vv-sheet", className)} {...props}>
      {children}
    </Component>
  );
}

export function SheetGrabber({ className = "" }) {
  return <div className={cx("vv-sheet-grabber", className)} aria-hidden="true" />;
}
