import React from "react";
import styles from "./IconButton.module.scss";

type IconButtonVariant = "solid-teal" | "outline-danger" | "outline-gold" | "ghost" | "ghost-danger";

interface IconButtonProps {
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  title?: string;
  variant?: IconButtonVariant;
  size?: number;
  active?: boolean;
  className?: string;
  children: React.ReactNode;
}

export function IconButton({
  onClick,
  title,
  variant = "ghost",
  size = 32,
  active = false,
  className,
  children,
}: IconButtonProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={[styles.button, styles[variant], active ? styles.active : "", "gm-btn", className]
        .filter(Boolean)
        .join(" ")}
      style={{ width: size, height: size }}
    >
      {children}
    </button>
  );
}
