import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { MAX_UPLOAD_BYTES } from "data/api";
import styles from "./Toast.module.scss";

type Tone = "error" | "info" | "ok";
interface Toast {
  id: number;
  title: string;
  body?: string;
  tone: Tone;
}
type Show = (t: { title: string; body?: string; tone?: Tone }) => void;

const Ctx = createContext<Show>(() => undefined);
const MARK: Record<Tone, { mark: string; color: string }> = {
  error: { mark: "!", color: "#b23a2c" },
  info: { mark: "i", color: "#7a4fc0" },
  ok: { mark: "✓", color: "#5c8a3a" },
};

/** Avisos flutuantes no estilo dos cards de notificação. */
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const seq = useRef(0);

  const dismiss = useCallback((id: number) => setItems((l) => l.filter((t) => t.id !== id)), []);
  const show = useCallback<Show>(
    ({ title, body, tone = "info" }) => {
      const id = ++seq.current;
      setItems((l) => [...l.slice(-3), { id, title, body, tone }]);
      window.setTimeout(() => dismiss(id), 6000);
    },
    [dismiss]
  );

  return (
    <Ctx.Provider value={show}>
      {children}
      <div className={styles.stack} aria-live="assertive" aria-atomic="false">
        {items.map((t) => (
          <div key={t.id} className={styles.toast} role={t.tone === "error" ? "alert" : "status"}>
            <span className={styles.icon} style={{ background: MARK[t.tone].color }} aria-hidden="true">{MARK[t.tone].mark}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className={styles.title}>{t.title}</div>
              {t.body && <div className={styles.body}>{t.body}</div>}
            </div>
            <button type="button" className={`gm-btn ${styles.close}`} onClick={() => dismiss(t.id)} aria-label="Fechar aviso">✕</button>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}

export const useToast = () => useContext(Ctx);

const mb = (bytes: number) => (bytes / 1024 / 1024).toFixed(1).replace(".", ",");

/**
 * Lê os arquivos escolhidos num <input type="file">, recusa os acima de 50 MB
 * com um aviso e devolve só os que podem subir. Limpa o input para permitir
 * escolher o mesmo arquivo de novo.
 */
export function useUploadGuard() {
  const toast = useToast();
  return useCallback(
    (input: HTMLInputElement): File[] => {
      const files = Array.from(input.files || []);
      input.value = "";
      const tooBig = files.filter((f) => f.size > MAX_UPLOAD_BYTES);
      if (tooBig.length === 1) {
        toast({
          tone: "error",
          title: "Arquivo grande demais",
          body: `“${tooBig[0].name}” tem ${mb(tooBig[0].size)} MB. Só são permitidos arquivos de até 50 MB.`,
        });
      } else if (tooBig.length > 1) {
        toast({
          tone: "error",
          title: `${tooBig.length} arquivos grandes demais`,
          body: `Só são permitidos arquivos de até 50 MB. Ficaram de fora: ${tooBig.map((f) => f.name).join(", ")}.`,
        });
      }
      return files.filter((f) => f.size <= MAX_UPLOAD_BYTES);
    },
    [toast]
  );
}
