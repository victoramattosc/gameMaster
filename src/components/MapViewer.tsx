import React, { useState } from "react";
import type { MesaFile } from "lib/types";
import { MapStage } from "./MapStage";
import { IconEye, IconMap } from "ui/Icons";
import { timeAgo } from "ui/bits";

/** Mapa compartilhado pelo mestre — jogadores só visualizam. */
export function MapViewer({ maps, onClose }: { maps: MesaFile[]; onClose(): void }) {
  const [selId, setSelId] = useState<string | null>(null);
  const sel = maps.find((m) => m.id === selId) || maps[maps.length - 1];

  return (
    <section style={{ background: "#1e1713", color: "#f1e6cc", borderRadius: 16, boxShadow: "0 0 0 1px #5a4430, 0 24px 60px rgba(0,0,0,.6)", overflow: "hidden" }}>
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 10, padding: "12px 14px", background: "#2b1f16", borderBottom: "1px solid #3a2c22" }}>
        <IconMap size={22} color="#e0a040" />
        <div style={{ flex: "1 1 180px", minWidth: 0 }}>
          {maps.length > 1 ? (
            <select className="gm-in gm-in--dark" aria-label="Mapa" value={sel?.id} onChange={(e) => setSelId(e.target.value)} style={{ height: 36 }}>
              {maps.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
            </select>
          ) : (
            <div className="gm-display" style={{ fontSize: 20, lineHeight: 1.1 }}>{sel?.name || "Mapa"}</div>
          )}
          {sel && <div style={{ fontSize: 13, color: "#c9b48a" }}>Compartilhado pelo mestre {timeAgo(sel.created_at)}</div>}
        </div>
        <span className="gm-badge" style={{ background: "#241b16", border: "1px solid #5a4430", color: "#f3c477", gap: 6, fontSize: 13 }}>
          <IconEye size={14} />Só visualização
        </span>
        <button type="button" className="gm-btn gm-x" style={{ width: 40, height: 40 }} onClick={onClose} aria-label="Fechar mapa">✕</button>
      </div>
      {sel ? (
        <MapStage file={sel} />
      ) : (
        <div style={{ padding: 40, textAlign: "center", color: "#c9b48a" }}>O mestre ainda não compartilhou nenhum mapa.</div>
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 14, padding: "10px 14px", fontSize: 13, color: "#d9c8a6" }}>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, borderRadius: "50%", background: "#7a4fc0" }} />Agentes</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><svg viewBox="0 0 12 12" width="12" height="12" aria-hidden="true"><path d="M6 1l5 10H1z" fill="#e8a093" /></svg>Marcador do mestre</span>
        <span style={{ display: "flex", alignItems: "center", gap: 6 }}><span style={{ width: 12, height: 12, background: "#2b1f16", border: "1px solid #5a4430" }} />Área ainda não revelada</span>
        <span style={{ marginLeft: "auto" }}>Roda do mouse: zoom · arraste para mover</span>
      </div>
    </section>
  );
}
