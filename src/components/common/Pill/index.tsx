import React from "react";
import styles from "./Pill.module.scss";

interface ChipProps {
  color?: string;
  onClick?: () => void;
  onRemove?: () => void;
  children: React.ReactNode;
  className?: string;
  labelClassName?: string;
}

export function Chip({ color, onClick, onRemove, children, className, labelClassName }: ChipProps) {
  const content = (
    <>
      <span
        onClick={onClick}
        className={[onClick ? styles.clickableLabel : "", labelClassName].filter(Boolean).join(" ")}
      >
        {children}
      </span>
      {onRemove && (
        <button type="button" onClick={onRemove} className={styles.remove} aria-label="Remover">
          ×
        </button>
      )}
    </>
  );

  return (
    <span
      className={[styles.chip, className].filter(Boolean).join(" ")}
      style={color ? { background: color, color: "#fff" } : undefined}
    >
      {content}
    </span>
  );
}
