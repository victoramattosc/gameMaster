import { useCallback, useEffect, useState } from "react";
import React from "react";

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const WHEEL_SENSITIVITY = 0.0015;
const BUTTON_STEP = 1.35;

interface ZoomState {
  scale: number;
  tx: number;
  ty: number;
}

interface PointerPoint {
  x: number;
  y: number;
}

const IDENTITY: ZoomState = { scale: 1, tx: 0, ty: 0 };

/**
 * Pinch/wheel zoom + drag-to-pan for a fixed-size viewport, applied as a
 * CSS transform on its (larger, scrollable) content element. Because the
 * transform uses a top-left origin, the content element's own
 * getBoundingClientRect() already reflects the current zoom/pan — callers
 * that need screen->content coordinate mapping (e.g. placing a map pin)
 * don't need to un-transform anything themselves.
 *
 * The viewport element is tracked as state (a callback ref) rather than a
 * plain useRef: the wheel listener is attached with a native, non-passive
 * `addEventListener` (React's synthetic onWheel is passive and can't
 * preventDefault), and that attachment lives in a useEffect — a useRef's
 * `.current` changing from null to the mounted node would NOT be visible
 * to that effect's dependency array, so the listener would never attach.
 */
export function useMapZoom(panEnabled: boolean) {
  const [viewportEl, setViewportEl] = useState<HTMLDivElement | null>(null);
  const [state, setState] = useState<ZoomState>(IDENTITY);
  const [pointers] = useState(() => new Map<number, PointerPoint>());
  const [pinch, setPinch] = useState<{ dist: number; midX: number; midY: number } | null>(null);
  const [pan, setPan] = useState<{ x: number; y: number; tx: number; ty: number } | null>(null);

  const clamp = useCallback(
    (scale: number, tx: number, ty: number): ZoomState => {
      if (!viewportEl) return { scale, tx, ty };
      const rect = viewportEl.getBoundingClientRect();
      const minTx = rect.width * (1 - scale);
      const minTy = rect.height * (1 - scale);
      return {
        scale,
        tx: Math.min(0, Math.max(minTx, tx)),
        ty: Math.min(0, Math.max(minTy, ty)),
      };
    },
    [viewportEl]
  );

  const zoomAt = useCallback(
    (clientX: number, clientY: number, factor: number) => {
      if (!viewportEl) return;
      const rect = viewportEl.getBoundingClientRect();
      setState((prev) => {
        const newScale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, prev.scale * factor));
        const cx = clientX - rect.left;
        const cy = clientY - rect.top;
        const contentX = (cx - prev.tx) / prev.scale;
        const contentY = (cy - prev.ty) / prev.scale;
        return clamp(newScale, cx - contentX * newScale, cy - contentY * newScale);
      });
    },
    [viewportEl, clamp]
  );

  useEffect(() => {
    if (!viewportEl) return;
    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      zoomAt(e.clientX, e.clientY, Math.exp(-e.deltaY * WHEEL_SENSITIVITY));
    };
    viewportEl.addEventListener("wheel", handleWheel, { passive: false });
    return () => viewportEl.removeEventListener("wheel", handleWheel);
  }, [viewportEl, zoomAt]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2) {
        const [a, b] = Array.from(pointers.values());
        setPinch({ dist: Math.hypot(a.x - b.x, a.y - b.y), midX: (a.x + b.x) / 2, midY: (a.y + b.y) / 2 });
        setPan(null);
      } else if (pointers.size === 1 && panEnabled && state.scale > MIN_SCALE) {
        setPan({ x: e.clientX, y: e.clientY, tx: state.tx, ty: state.ty });
      }
    },
    [pointers, panEnabled, state.scale, state.tx, state.ty]
  );

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

      if (pointers.size === 2 && pinch) {
        const [a, b] = Array.from(pointers.values());
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const midX = (a.x + b.x) / 2;
        const midY = (a.y + b.y) / 2;
        zoomAt(pinch.midX, pinch.midY, dist / pinch.dist);
        setPinch({ dist, midX, midY });
      } else if (pointers.size === 1 && pan) {
        const dx = e.clientX - pan.x;
        const dy = e.clientY - pan.y;
        setState((prev) => clamp(prev.scale, pan.tx + dx, pan.ty + dy));
      }
    },
    [pointers, pinch, pan, zoomAt, clamp]
  );

  const endPointer = useCallback(
    (e: React.PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) setPinch(null);
      if (pointers.size < 1) setPan(null);
    },
    [pointers]
  );

  const zoomButtonAt = useCallback(
    (factor: number) => {
      if (!viewportEl) return;
      const rect = viewportEl.getBoundingClientRect();
      zoomAt(rect.left + rect.width / 2, rect.top + rect.height / 2, factor);
    },
    [viewportEl, zoomAt]
  );

  const zoomIn = useCallback(() => zoomButtonAt(BUTTON_STEP), [zoomButtonAt]);
  const zoomOut = useCallback(() => zoomButtonAt(1 / BUTTON_STEP), [zoomButtonAt]);
  const reset = useCallback(() => setState(IDENTITY), []);

  return {
    viewportRef: setViewportEl,
    scale: state.scale,
    isZoomed: state.scale > MIN_SCALE + 0.001,
    canZoomIn: state.scale < MAX_SCALE - 0.001,
    canZoomOut: state.scale > MIN_SCALE + 0.001,
    transformStyle: {
      transform: `translate(${state.tx}px, ${state.ty}px) scale(${state.scale})`,
      transformOrigin: "0 0",
    } as React.CSSProperties,
    viewportHandlers: { onPointerDown, onPointerMove, onPointerUp: endPointer, onPointerCancel: endPointer },
    zoomIn,
    zoomOut,
    reset,
  };
}
