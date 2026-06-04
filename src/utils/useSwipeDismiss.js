import { useRef, useState } from "react";

export function useSwipeDismiss(onDismiss, options = {}) {
  const threshold = options.threshold || 92;
  const [offset, setOffset] = useState(0);
  const gesture = useRef(null);
  const offsetRef = useRef(0);

  function reset() {
    gesture.current = null;
    offsetRef.current = 0;
    setOffset(0);
  }

  function onPointerDown(event) {
    if (event.pointerType === "mouse" && event.button !== 0) return;

    gesture.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startScrollTop: event.currentTarget.scrollTop || 0,
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
    offsetRef.current = Math.min(deltaY, 220);
    setOffset(offsetRef.current);
  }

  function onPointerUp(event) {
    const current = gesture.current;
    if (!current || current.pointerId !== event.pointerId) return;

    if (current.dragging && offsetRef.current > threshold) {
      gesture.current = null;
      offsetRef.current = 0;
      setOffset(0);
      onDismiss();
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
    dragging: offset > 0
  };
}
