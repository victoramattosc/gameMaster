import React from "react";
import { WIDGET_LABEL, WIDGET_SEAL_COLOR } from "../../../data/generators";
import { useCampaign } from "../../../state/CampaignContext";
import { Widget } from "../../../state/types";
import { useWidgetDrag } from "../../../hooks/useWidgetDrag";
import { useWidgetResize } from "../../../hooks/useWidgetResize";
import { SealBadge } from "../../common/SealBadge";
import { ClearIcon, GripIcon, ResizeHandleIcon } from "../../common/icons";
import styles from "./WidgetShell.module.scss";

interface WidgetShellProps {
  widget: Widget;
  gridRef: React.RefObject<HTMLDivElement>;
  isMobile: boolean;
  children: React.ReactNode;
}

export function WidgetShell({ widget, gridRef, isMobile, children }: WidgetShellProps) {
  const { dispatch } = useCampaign();
  const onHeaderDown = useWidgetDrag(gridRef, widget, dispatch);
  const onResizeDown = useWidgetResize(gridRef, widget, dispatch);

  const style: React.CSSProperties = isMobile
    ? { width: "100%", minHeight: 260 }
    : {
        gridColumn: `${widget.col} / span ${widget.colSpan}`,
        gridRow: `${widget.row} / span ${widget.rowSpan}`,
      };

  return (
    <div className={styles.card} style={style}>
      <div
        className={styles.header}
        onPointerDown={isMobile ? undefined : onHeaderDown}
        style={{ cursor: isMobile ? "default" : "grab" }}
      >
        <span className={styles.grip} style={{ opacity: isMobile ? 0 : 0.55 }}>
          <GripIcon />
        </span>
        <SealBadge type={widget.type} color={WIDGET_SEAL_COLOR[widget.type]} />
        <span className={styles.title}>{WIDGET_LABEL[widget.type]}</span>
        <button
          type="button"
          onClick={() => dispatch({ type: "REQUEST_CLEAR_WIDGET", widgetType: widget.type })}
          className={`${styles.clearBtn} gm-btn`}
          title="Limpar seção"
        >
          <ClearIcon />
        </button>
      </div>
      <div className={`${styles.body} gm-scroll`}>
        {children}
        {!isMobile && (
          <div className={styles.resizeHandle} onPointerDown={onResizeDown}>
            <ResizeHandleIcon />
          </div>
        )}
      </div>
    </div>
  );
}
