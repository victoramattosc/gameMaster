import React, { useEffect, useState } from "react";
import styles from "./ConsentBanner.module.scss";

const STORAGE_KEY = "gm_cookie_consent";

export function ConsentBanner() {
  const [dismissed, setDismissed] = useState(true);

  useEffect(() => {
    setDismissed(!!localStorage.getItem(STORAGE_KEY));
  }, []);

  const respond = (accepted: boolean) => {
    localStorage.setItem(STORAGE_KEY, accepted ? "granted" : "denied");
    setDismissed(true);
  };

  if (dismissed) return null;

  return (
    <div className={styles.banner} role="dialog" aria-live="polite">
      <p className={styles.text}>
        Este site usa o armazenamento local do navegador para salvar suas mesas, personagens e
        anotações. Nenhum dado é enviado para servidores externos.
      </p>
      <div className={styles.actions}>
        <button type="button" onClick={() => respond(false)} className={`${styles.decline} gm-btn`}>
          Recusar
        </button>
        <button type="button" onClick={() => respond(true)} className={`${styles.accept} gm-btn`}>
          Aceitar
        </button>
      </div>
    </div>
  );
}
