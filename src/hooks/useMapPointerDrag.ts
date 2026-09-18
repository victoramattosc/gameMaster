import { useCallback, useRef } from "react";
import { CampaignAction } from "../state/campaignReducer";

interface PointerDragSession {
  pointerId: string;
  mapEl: HTMLElement;
}

export function useMapPointerDrag(
  mapRef: React.RefObject<HTMLDivElement>,
  dispatch: React.Dispatch<CampaignAction>
) {
  const session = useRef<PointerDragSession | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = session.current;
      if (!d) return;
      const rect = d.mapEl.getBoundingClientRect();
      const x = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
      const y = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
      dispatch({ type: "MOVE_MAP_POINTER", id: d.pointerId, x, y });
    },
    [dispatch]
  );

  const endSession = useCallback(() => {
    session.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endSession);
  }, [onPointerMove]);

  const startDrag = useCallback(
    (pointerId: string) => (e: React.PointerEvent) => {
      if (!mapRef.current) return;
      e.preventDefault();
      e.stopPropagation();
      session.current = { pointerId, mapEl: mapRef.current };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", endSession);
    },
    [mapRef, onPointerMove, endSession]
  );

  return startDrag;
}
