import React, { useEffect } from "react";
import styles from "./Modal.module.scss";

interface ModalProps {
  onClose: () => void;
  title: React.ReactNode;
  width?: number;
  children: React.ReactNode;
}

export function Modal({ onClose, title, width = 420, children }: ModalProps) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [onClose]);

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div
        className={styles.card}
        style={{ width: `min(${width}px, 90vw)` }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className={styles.header}>
          <span className={styles.title}>{title}</span>
          <button type="button" onClick={onClose} className={styles.close} aria-label="Fechar">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
