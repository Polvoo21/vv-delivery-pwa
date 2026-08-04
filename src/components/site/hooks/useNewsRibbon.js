import { useCallback, useEffect, useRef, useState } from "react";

export function useNewsRibbon() {
  const newsTrackRef = useRef(null);
  const dragRef = useRef({ active: false, pointerId: null, startX: 0, scrollLeft: 0, moved: false });
  const [newsArrowState, setNewsArrowState] = useState({ left: false, right: true });

  const updateNewsArrows = useCallback(() => {
    const track = newsTrackRef.current;
    if (!track) return;

    const maxScroll = Math.max(0, track.scrollWidth - track.clientWidth);
    const nextState = {
      left: track.scrollLeft > 4,
      right: maxScroll > 4 && track.scrollLeft < maxScroll - 4
    };

    setNewsArrowState((currentState) =>
      currentState.left === nextState.left && currentState.right === nextState.right
        ? currentState
        : nextState
    );
  }, []);

  const scrollNewsRibbon = useCallback((direction) => {
    const track = newsTrackRef.current;
    if (!track) return;

    track.scrollBy({
      left: direction * Math.min(track.clientWidth * 0.82, 760),
      behavior: "smooth"
    });
  }, []);

  useEffect(() => {
    const track = newsTrackRef.current;
    if (!track || typeof window === "undefined") return undefined;

    updateNewsArrows();
    const frameId = window.requestAnimationFrame(updateNewsArrows);
    const handleScroll = () => updateNewsArrows();
    const dragState = dragRef.current;

    const stopDragging = (event) => {
      if (!dragState.active || event.pointerId !== dragState.pointerId) return;

      dragState.active = false;
      dragState.pointerId = null;
      track.classList.remove("is-dragging");

      if (track.hasPointerCapture?.(event.pointerId)) {
        track.releasePointerCapture(event.pointerId);
      }
    };

    const handlePointerDown = (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) return;

      dragState.active = true;
      dragState.pointerId = event.pointerId;
      dragState.startX = event.clientX;
      dragState.scrollLeft = track.scrollLeft;
      dragState.moved = false;
      track.classList.add("is-dragging");
      track.setPointerCapture?.(event.pointerId);
    };

    const handlePointerMove = (event) => {
      if (!dragState.active || event.pointerId !== dragState.pointerId) return;

      const deltaX = event.clientX - dragState.startX;
      if (Math.abs(deltaX) > 4) {
        dragState.moved = true;
      }

      track.scrollLeft = dragState.scrollLeft - deltaX;
    };

    const preventDraggedClick = (event) => {
      if (!dragState.moved) return;

      event.preventDefault();
      event.stopPropagation();
      dragState.moved = false;
    };

    track.addEventListener("scroll", handleScroll, { passive: true });
    track.addEventListener("pointerdown", handlePointerDown);
    track.addEventListener("pointermove", handlePointerMove);
    track.addEventListener("pointerup", stopDragging);
    track.addEventListener("pointercancel", stopDragging);
    track.addEventListener("click", preventDraggedClick, true);
    window.addEventListener("resize", updateNewsArrows);

    return () => {
      window.cancelAnimationFrame(frameId);
      track.removeEventListener("scroll", handleScroll);
      track.removeEventListener("pointerdown", handlePointerDown);
      track.removeEventListener("pointermove", handlePointerMove);
      track.removeEventListener("pointerup", stopDragging);
      track.removeEventListener("pointercancel", stopDragging);
      track.removeEventListener("click", preventDraggedClick, true);
      window.removeEventListener("resize", updateNewsArrows);
    };
  }, [updateNewsArrows]);

  return { newsTrackRef, newsArrowState, scrollNewsRibbon };
}
