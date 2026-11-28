import React, { useState } from "react";
import { signedUrl, useMyItems } from "data/api";
import { errorMessage } from "lib/supabase";
import type { ChestItem, Mesa, MesaFile } from "lib/types";
import { CardShell } from "ui/Popover";
import { IconChest } from "ui/Icons";
import { CATS } from "pages/gm/GmCards";
import styles from "pages/gm/GmCards.module.scss";

/** Baú do jogador: itens e arquivos que o mestre entregou. Mesmo visual do baú do mestre. */
export function PlayerChestCard({
  mesa,
  userId,
  files,
  onTake,
  onClose,
}: {
  mesa: Mesa;
  userId: string;
  /** Arquivos que este jogador pode ver (entregues a ele ou compartilhados com o grupo). */
  files: MesaFile[];
  onTake(it: ChestItem): void;
  onClose(): void;
}) {
  const [tab, setTab] = useState<"items" | "files">("items");
  const items = useMyItems(mesa.id, userId);
  const [err, setErr] = useState("");
  const [opening, setOpening] = useState<string | null>(null);

  async function open(f: MesaFile) {
    setOpening(f.id);
    setErr("");
    try {
      window.open(await signedUrl(f.path), "_blank", "noopener");
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setOpening(null);
    }
  }

  return (
    <CardShell width={440} title="Baú do Jogador" icon={<IconChest />} onClose={onClose}>
      <div className={styles.body}>
        <div className="gm-seg" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "items"} className="gm-btn" onClick={() => setTab("items")}>Itens e tesouros</button>
          <button type="button" role="tab" aria-selected={tab === "files"} className="gm-btn" onClick={() => setTab("files")}>
            Arquivos{files.length ? ` (${files.length})` : ""}
          </button>
        </div>
        {err && <div className="gm-error">{err}</div>}

        {tab === "items" && (
          <>
            <div style={{ fontSize: 13, color: "#6b5640" }}>O que o mestre te entregou nesta mesa. Guarde para o item ir para o inventário da sua ficha.</div>
            {!items.loading && items.data.length === 0 && <div style={{ fontSize: 14, color: "#6b5640" }}>Nada por aqui ainda.</div>}
            {items.data.map((it) => (
              <div key={it.id} className={styles.item}>
                <span className={styles.cat} style={{ background: CATS[it.category] || "#5a4430" }}>{it.category}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>{it.name}</div>
                  {it.note && <div style={{ fontSize: 13, color: "#5a4430" }}>{it.note}</div>}
                </div>
                {it.claimed ? (
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#33501f" }}>Na sua ficha</span>
                ) : (
                  <button type="button" className="gm-btn gm-btn--ink" style={{ height: 36, fontSize: 13 }} onClick={() => onTake(it)}>
                    Guardar na ficha
                  </button>
                )}
              </div>
            ))}
          </>
        )}

        {tab === "files" && (
          <>
            <div style={{ fontSize: 13, color: "#6b5640" }}>Handouts e documentos que o mestre te entregou.</div>
            {files.length === 0 && <div style={{ fontSize: 14, color: "#6b5640" }}>Nenhum arquivo ainda.</div>}
            {files.map((f) => (
              <div key={f.id} className={styles.item}>
                <span className={styles.cat} style={{ background: "#2b1f16" }}>
                  {(f.mime.split("/")[1] || "arq").replace(/^vnd\..*|^x-/, "").slice(0, 4) || "arq"}
                </span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                </div>
                <button type="button" className="gm-btn gm-btn--ink" style={{ height: 36, fontSize: 13 }} disabled={opening === f.id} onClick={() => open(f)}>
                  {opening === f.id ? "Abrindo…" : "Abrir"}
                </button>
              </div>
            ))}
          </>
        )}
      </div>
    </CardShell>
  );
}
