import React, { createContext, useCallback, useContext, useRef, useState } from "react";
import { CardShell, Modal } from "./Popover";

interface ConfirmOpts {
  title: string;
  message?: React.ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

type ConfirmFn = (o: ConfirmOpts) => Promise<boolean>;
const Ctx = createContext<ConfirmFn>(async () => false);

/** Substitui window.confirm por um card no estilo do app. */
export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [opts, setOpts] = useState<ConfirmOpts | null>(null);
  const resolver = useRef<(v: boolean) => void>();

  const confirm = useCallback<ConfirmFn>(
    (o) =>
      new Promise<boolean>((res) => {
        resolver.current = res;
        setOpts(o);
      }),
    []
  );

  const close = useCallback((v: boolean) => {
    resolver.current?.(v);
    resolver.current = undefined;
    setOpts(null);
  }, []);
  const cancel = useCallback(() => close(false), [close]);

  return (
    <Ctx.Provider value={confirm}>
      {children}
      <Modal open={!!opts} onClose={cancel} maxWidth={400}>
        {opts && (
          <CardShell title={opts.title} onClose={cancel}>
            <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 16 }}>
              {opts.message && <div style={{ fontSize: 15, color: "#5a4430", lineHeight: 1.45 }}>{opts.message}</div>}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
                <button type="button" className="gm-btn gm-btn--ghost" onClick={cancel}>{opts.cancelLabel || "Cancelar"}</button>
                <button type="button" className={`gm-btn ${opts.danger ? "gm-btn--primary" : "gm-btn--ink"}`} style={{ height: 44 }} onClick={() => close(true)} autoFocus>
                  {opts.confirmLabel || "Confirmar"}
                </button>
              </div>
            </div>
          </CardShell>
        )}
      </Modal>
    </Ctx.Provider>
  );
}

export const useConfirm = () => useContext(Ctx);
