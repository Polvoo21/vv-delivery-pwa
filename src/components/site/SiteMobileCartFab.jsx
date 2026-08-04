import { ShoppingBag } from "lucide-react";
import { formatPrice } from "../../utils/price";

export function SiteMobileCartFab({
  hasCartItems,
  cartSummary,
  isCartDrawerOpen,
  isCartDrawerClosing,
  onCartClick
}) {
  if (!hasCartItems) {
    return null;
  }

  return (
    <button
      className="site-mobile-cart-fab"
      type="button"
      aria-haspopup="dialog"
      aria-expanded={isCartDrawerOpen && !isCartDrawerClosing}
      aria-label={`Открыть корзину на сумму ${formatPrice(cartSummary.total)} рублей`}
      onClick={onCartClick}
    >
      <ShoppingBag size={19} strokeWidth={2.6} />
      <span>{formatPrice(cartSummary.total)} ₽</span>
    </button>
  );
}
