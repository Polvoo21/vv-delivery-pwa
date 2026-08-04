export function getProductInitials(product, fallback = "VV") {
  if (!product?.name) return fallback;

  const initials = product.name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("")
    .toUpperCase();

  return initials || fallback;
}
