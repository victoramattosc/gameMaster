import React, { useRef } from "react";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { useCampaign } from "../../../state/CampaignContext";
import { WIDGET_REGISTRY } from "../../widgets/registry";
import { WidgetShell } from "../WidgetShell";
import styles from "./WidgetGrid.module.scss";

export function WidgetGrid() {
  const { activeCampaign } = useCampaign();
  const isMobile = useIsMobile();
  const gridRef = useRef<HTMLDivElement>(null);

  return (
    <div ref={gridRef} className={isMobile ? styles.stack : styles.grid}>
      {activeCampaign.widgets.map((widget) => {
        const WidgetContent = WIDGET_REGISTRY[widget.type];
        return (
          <WidgetShell key={widget.id} widget={widget} gridRef={gridRef} isMobile={isMobile}>
            <WidgetContent />
          </WidgetShell>
        );
      })}
    </div>
  );
}
