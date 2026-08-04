import { useCallback, useEffect, useRef, useState } from "react";
import { CART_DRAWER_EXIT_MS } from "../siteData";

export function useCartDrawer(onOpen) {
  const timerRef = useRef(null);
  const frameRef = useRef(null);
  const statusRef = useRef({ open: false, visible: false, closing: false });
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);
  const [isCartDrawerVisible, setIsCartDrawerVisible] = useState(false);
  const [isCartDrawerClosing, setIsCartDrawerClosing] = useState(false);

  const clearTimer = useCallback(() => {
    if (!timerRef.current) return;

    window.clearTimeout(timerRef.current);
    timerRef.current = null;
  }, []);

  const clearFrame = useCallback(() => {
    if (!frameRef.current) return;

    window.cancelAnimationFrame(frameRef.current);
    frameRef.current = null;
  }, []);

  const openCartDrawer = useCallback(() => {
    clearTimer();
    clearFrame();
    statusRef.current = { open: true, visible: false, closing: false };
    setIsCartDrawerClosing(false);
    setIsCartDrawerVisible(false);
    onOpen?.();
    setIsCartDrawerOpen(true);

    frameRef.current = window.requestAnimationFrame(() => {
      frameRef.current = window.requestAnimationFrame(() => {
        frameRef.current = null;
        statusRef.current = { open: true, visible: true, closing: false };
        setIsCartDrawerVisible(true);
      });
    });
  }, [clearFrame, clearTimer, onOpen]);

  const closeCartDrawer = useCallback(() => {
    const { open, closing } = statusRef.current;
    if (!open || closing) return;

    statusRef.current = { open: true, visible: false, closing: true };
    clearFrame();
    setIsCartDrawerClosing(true);
    setIsCartDrawerVisible(false);
    clearTimer();

    timerRef.current = window.setTimeout(() => {
      timerRef.current = null;
      statusRef.current = { open: false, visible: false, closing: false };
      setIsCartDrawerOpen(false);
      setIsCartDrawerVisible(false);
      setIsCartDrawerClosing(false);
    }, CART_DRAWER_EXIT_MS);
  }, [clearFrame, clearTimer]);

  useEffect(() => {
    statusRef.current = {
      open: isCartDrawerOpen,
      visible: isCartDrawerVisible,
      closing: isCartDrawerClosing
    };
  }, [isCartDrawerClosing, isCartDrawerOpen, isCartDrawerVisible]);

  useEffect(
    () => () => {
      clearTimer();
      clearFrame();
    },
    [clearFrame, clearTimer]
  );

  return {
    isCartDrawerOpen,
    isCartDrawerVisible,
    isCartDrawerClosing,
    openCartDrawer,
    closeCartDrawer
  };
}
