import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoredCartSummary, saveStoredCart, saveStoredPromo } from "../cartModel";
import { pluralRu } from "../siteCoreData";

export function useCartSummary() {
  const [cartSummary, setCartSummary] = useState(() => getStoredCartSummary());
  const cartItems = useMemo(
    () => (Array.isArray(cartSummary.cart) ? cartSummary.cart : []),
    [cartSummary.cart]
  );
  const hasCartItems = cartItems.length > 0 && cartSummary.count > 0 && cartSummary.total > 0;
  const cartItemsLabel = `${cartSummary.count} ${pluralRu(cartSummary.count, "товар", "товара", "товаров")}`;

  const syncCartSummary = useCallback(() => {
    setCartSummary(getStoredCartSummary());
  }, []);

  const saveCartState = useCallback((nextCart) => {
    const nextSummary = saveStoredCart(nextCart);
    if (nextSummary) {
      setCartSummary(nextSummary);
    }
  }, []);

  const addCartItem = useCallback(
    (item) => {
      saveCartState([...cartItems, item]);
    },
    [cartItems, saveCartState]
  );

  const addCartItems = useCallback(
    (items) => {
      const nextItems = Array.isArray(items) ? items.filter(Boolean) : [];

      if (!nextItems.length) {
        return;
      }

      saveCartState([...cartItems, ...nextItems]);
    },
    [cartItems, saveCartState]
  );

  const updateCartItemQty = useCallback(
    (targetIndex, delta) => {
      const nextCart = cartItems
        .map((item, index) =>
          index === targetIndex
            ? { ...item, qty: Math.max(0, Number(item.qty || 0) + delta) }
            : item
        )
        .filter((item) => Number(item.qty || 0) > 0);

      saveCartState(nextCart);
    },
    [cartItems, saveCartState]
  );

  const removeCartItem = useCallback(
    (targetIndex) => {
      saveCartState(cartItems.filter((_, index) => index !== targetIndex));
    },
    [cartItems, saveCartState]
  );

  const replaceCartItem = useCallback(
    (targetIndex, nextItem) => {
      if (!nextItem || targetIndex < 0 || targetIndex >= cartItems.length) {
        return;
      }

      saveCartState(cartItems.map((item, index) => (index === targetIndex ? nextItem : item)));
    },
    [cartItems, saveCartState]
  );

  const applyCartPromo = useCallback((promo) => {
    const nextSummary = saveStoredPromo(promo);
    if (nextSummary) {
      setCartSummary(nextSummary);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return undefined;

    syncCartSummary();
    window.addEventListener("storage", syncCartSummary);
    window.addEventListener("focus", syncCartSummary);

    return () => {
      window.removeEventListener("storage", syncCartSummary);
      window.removeEventListener("focus", syncCartSummary);
    };
  }, [syncCartSummary]);

  return {
    cartSummary,
    cartItems,
    hasCartItems,
    cartItemsLabel,
    syncCartSummary,
    addCartItem,
    addCartItems,
    updateCartItemQty,
    removeCartItem,
    replaceCartItem,
    applyCartPromo
  };
}
