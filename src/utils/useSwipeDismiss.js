import { useEffect, useRef, useState } from "react";

export function useSwipeDismiss(onDismiss, options = {}) {
  const closeDuration = options.closeDuration || 260;
  const thresholdRatio = options.thresholdRatio || 0.5;
  const [offset, setOffset] = useState(0);
  const [closing, setClosing] = useState(false);
  const gesture = useRef(null);
  const offsetRef = useRef(0);
  const closeTimer = useRef(null);

  useEffect(() => {
    return () => {
      if (closeTimer.current) {
        clearTimeout(closeTimer.current);
      }
    };
  }, []);

  function finishClose() {
    if (closeTimer.current) {
      clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }

    setClosing(true);
    const closeOffset = typeof window === "undefined" ? 720 : window.innerHeight + 80;
    offsetRef.current = closeOffset;
    setOffset(closeOffset);

    closeTimer.current = setTimeout(() => {
      closeTimer.current = null;
      onDismiss();
    }, closeDuration);
  }

  function reset() {
    gesture.current = null;
    offsetRef.current = 0;
    setOffset(0);
  }

  function canStartFrom(target) {
    return !target.closest("button, input, textarea, select, a, [data-no-sheet-drag]");
  }

  function startGesture(pointerId, clientX, clientY, target, currentTarget) {
    if (closing) return;
    if (!canStartFrom(target)) return;

    gesture.current = {
      pointerId,
      startX: clientX,
      startY: clientY,
      startScrollTop: currentTarget.scrollTop || 0,
      sheetHeight: currentTarget.getBoundingClientRect().height,
      dragging: false
    };
  }

  function moveGesture(pointerId, clientX, clientY, event) {
    const current = gesture.current;
    if (!current || current.pointerId !== pointerId) return;

    const deltaX = clientX - current.startX;
    const deltaY = clientY - current.startY;
    const canPullDown = current.startScrollTop <= 0 && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX);

    if (!current.dragging && !canPullDown) return;

    current.dragging = true;
    event?.preventDefault?.();
    offsetRef.current = Math.min(Math.max(deltaY, 0), current.sheetHeight + 80);
    setOffset(offsetRef.current);
  }

  function endGesture(pointerId) {
    const current = gesture.current;
    if (!current || current.pointerId !== pointerId) return;

    const threshold = current.sheetHeight * thresholdRatio;
    if (current.dragging && offsetRef.current > threshold) {
      gesture.current = null;
      offsetRef.current = 0;
      finishClose();
      return;
    }

    reset();
  }

  function onPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    startGesture(event.pointerId, event.clientX, event.clientY, event.target, event.currentTarget);
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    moveGesture(event.pointerId, event.clientX, event.clientY, event);
  }

  function onPointerUp(event) {
    endGesture(event.pointerId);
  }

  function onTouchStart(event) {
    const touch = event.touches[0];
    if (!touch) return;
    startGesture("touch", touch.clientX, touch.clientY, event.target, event.currentTarget);
  }

  function onTouchMove(event) {
    const touch = event.touches[0];
    if (!touch) return;
    moveGesture("touch", touch.clientX, touch.clientY, event);
  }

  function onTouchEnd() {
    endGesture("touch");
  }

  return {
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset,
      onTouchStart,
      onTouchMove,
      onTouchEnd,
      onTouchCancel: reset
    },
    style: {
      transform: offset ? `translateY(${offset}px)` : undefined
    },
    dragging: offset > 0 && !closing,
    closing,
    close: finishClose
  };
}
