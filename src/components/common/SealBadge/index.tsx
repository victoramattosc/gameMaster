import React from "react";
import { WidgetType } from "../../../state/types";
import { WIDGET_SEAL_ICON } from "../icons";
import styles from "./SealBadge.module.scss";

interface SealBadgeProps {
  type: WidgetType;
  color: string;
  size?: number;
}

export function SealBadge({ type, color, size = 22 }: SealBadgeProps) {
  const Icon = WIDGET_SEAL_ICON[type];
  return (
    <span className={styles.seal} style={{ background: color, width: size, height: size }}>
      <Icon size={Math.round(size * 0.6)} />
    </span>
  );
}
