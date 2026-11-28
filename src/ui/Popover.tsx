import React, { useEffect } from "react";
import { IconClose } from "./Icons";
import styles from "./Popover.module.scss";

/** Card flutuante ancorado no canto superior direito (notificações, perfil, convite, música, baú). */
export function PopoverCard({
  open,
  onClose,
  children,
}: {
  open: boolean;
  onClose(): void;
  children: React.ReactNode;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className={styles.layer}>
      <button type="button" className={styles.scrim} aria-label="Fechar" onClick={onClose} />
      <div className={styles.anchor}>{children}</div>
    </div>
  );
}

/** Modal centralizado (mapa, importar ficha, retrato). */
export function Modal({
  open,
  onClose,
  children,
  maxWidth = 760,
}: {
  open: boolean;
  onClose(): void;
  children: React.ReactNode;
  maxWidth?: number;
}) {
  useEscape(open, onClose);
  if (!open) return null;
  return (
    <div className={styles.layer} role="dialog" aria-modal="true">
      <button type="button" className={`${styles.scrim} ${styles.scrimDark}`} aria-label="Fechar" onClick={onClose} />
      <div className={styles.center} style={{ maxWidth }}>
        {children}
      </div>
    </div>
  );
}

/** Cabeçalho escuro padrão dos cards de pergaminho. */
export function CardShell({
  title,
  icon,
  onClose,
  extra,
  width,
  children,
  dark,
}: {
  title: React.ReactNode;
  icon?: React.ReactNode;
  onClose?(): void;
  extra?: React.ReactNode;
  width?: number;
  children: React.ReactNode;
  dark?: boolean;
}) {
  return (
    <section className={`${styles.card} ${dark ? styles.cardDark : ""}`} style={width ? { width } : undefined}>
      <header className={styles.cardHead}>
        {icon}
        <span className={styles.cardTitle}>{title}</span>
        {extra}
        {onClose && (
          <button type="button" className="gm-x gm-btn" onClick={onClose} aria-label="Fechar">
            <IconClose size={16} />
          </button>
        )}
      </header>
      {children}
    </section>
  );
}

function useEscape(active: boolean, cb: () => void) {
  useEffect(() => {
    if (!active) return;
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") cb();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [active, cb]);
}
