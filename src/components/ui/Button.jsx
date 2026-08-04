const VARIANT_CLASS = {
  primary: "vv-button-primary",
  secondary: "vv-button-secondary",
  tertiary: "vv-button-tertiary",
  dark: "vv-button-dark"
};

const SIZE_CLASS = {
  sm: "vv-button-sm",
  md: "",
  lg: "vv-button-lg"
};

function cx(...classes) {
  return classes.filter(Boolean).join(" ");
}

export default function Button({
  as: Component = "button",
  variant = "primary",
  size = "md",
  className = "",
  type,
  ...props
}) {
  const resolvedType = Component === "button" ? type || "button" : undefined;

  return (
    <Component
      className={cx("vv-button", VARIANT_CLASS[variant], SIZE_CLASS[size], className)}
      type={resolvedType}
      {...props}
    />
  );
}
