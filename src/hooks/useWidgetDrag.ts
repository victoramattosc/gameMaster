import { useCallback, useRef } from "react";
import { CampaignAction } from "../state/campaignReducer";
import { Widget } from "../state/types";
import { GRID_COLUMNS, getGridSteps } from "./gridMath";

interface DragSession {
  pointerId: number;
  startX: number;
  startY: number;
  startCol: number;
  startRow: number;
  colSpan: number;
  colStep: number;
  rowStep: number;
}

export function useWidgetDrag(
  gridRef: React.RefObject<HTMLDivElement>,
  widget: Widget,
  dispatch: React.Dispatch<CampaignAction>
) {
  const session = useRef<DragSession | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = session.current;
      if (!d) return;
      const dCol = Math.round((e.clientX - d.startX) / d.colStep);
      const dRow = Math.round((e.clientY - d.startY) / d.rowStep);
      const maxCol = GRID_COLUMNS + 1 - d.colSpan;
      const nextCol = Math.min(Math.max(1, d.startCol + dCol), maxCol);
      const nextRow = Math.max(1, d.startRow + dRow);
      dispatch({ type: "SET_WIDGET_LAYOUT", widgetId: widget.id, col: nextCol, row: nextRow });
    },
    [dispatch, widget.id]
  );

  const endSession = useCallback(() => {
    session.current = null;
    window.removeEventListener("pointermove", onPointerMove);
    window.removeEventListener("pointerup", endSession);
  }, [onPointerMove]);

  const onPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (!gridRef.current) return;
      e.preventDefault();
      const { colStep, rowStep } = getGridSteps(gridRef.current);
      session.current = {
        pointerId: e.pointerId,
        startX: e.clientX,
        startY: e.clientY,
        startCol: widget.col,
        startRow: widget.row,
        colSpan: widget.colSpan,
        colStep,
        rowStep,
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", endSession);
    },
    [gridRef, widget.col, widget.row, widget.colSpan, onPointerMove, endSession]
  );

  return onPointerDown;
}
