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

  function onPointerDown(event) {
    if (closing) return;
    if (event.pointerType === "mouse" && event.button !== 0) return;

    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollTop: event.currentTarget.scrollTop || 0,
      sheetHeight: event.currentTarget.getBoundingClientRect().height,
      dragging: false
    };

    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function onPointerMove(event) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - current.startX;
    const deltaY = event.clientY - current.startY;
    const canPullDown = current.startScrollTop <= 0 && deltaY > 0 && Math.abs(deltaY) > Math.abs(deltaX);

    if (!current.dragging && !canPullDown) return;

    current.dragging = true;
    offsetRef.current = Math.min(Math.max(deltaY, 0), current.sheetHeight + 80);
    setOffset(offsetRef.current);
  }

  function onPointerUp(event) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;

    const threshold = Math.max(86, current.sheetHeight * thresholdRatio);
    if (current.dragging && offsetRef.current > threshold) {
      gesture.current = null;
      offsetRef.current = 0;
      finishClose();
      return;
    }

    reset();
  }

  return {
    bind: {
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: reset
    },
    style: {
      transform: offset ? `translateY(${offset}px)` : undefined
    },
    dragging: offset > 0 && !closing,
    closing,
    close: finishClose
  };
}
