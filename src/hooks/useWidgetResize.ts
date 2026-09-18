import { useCallback, useRef } from "react";
import { CampaignAction } from "../state/campaignReducer";
import { Widget } from "../state/types";
import { GRID_COLUMNS, getGridSteps } from "./gridMath";

interface ResizeSession {
  startX: number;
  startY: number;
  startColSpan: number;
  startRowSpan: number;
  col: number;
  colStep: number;
  rowStep: number;
}

export function useWidgetResize(
  gridRef: React.RefObject<HTMLDivElement>,
  widget: Widget,
  dispatch: React.Dispatch<CampaignAction>
) {
  const session = useRef<ResizeSession | null>(null);

  const onPointerMove = useCallback(
    (e: PointerEvent) => {
      const d = session.current;
      if (!d) return;
      const dCol = Math.round((e.clientX - d.startX) / d.colStep);
      const dRow = Math.round((e.clientY - d.startY) / d.rowStep);
      const maxSpan = GRID_COLUMNS + 1 - d.col;
      const nextColSpan = Math.min(Math.max(2, d.startColSpan + dCol), maxSpan);
      const nextRowSpan = Math.max(3, d.startRowSpan + dRow);
      dispatch({
        type: "SET_WIDGET_LAYOUT",
        widgetId: widget.id,
        colSpan: nextColSpan,
        rowSpan: nextRowSpan,
      });
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
      e.stopPropagation();
      const { colStep, rowStep } = getGridSteps(gridRef.current);
      session.current = {
        startX: e.clientX,
        startY: e.clientY,
        startColSpan: widget.colSpan,
        startRowSpan: widget.rowSpan,
        col: widget.col,
        colStep,
        rowStep,
      };
      window.addEventListener("pointermove", onPointerMove);
      window.addEventListener("pointerup", endSession);
    },
    [gridRef, widget.col, widget.colSpan, widget.rowSpan, onPointerMove, endSession]
  );

  return onPointerDown;
}
