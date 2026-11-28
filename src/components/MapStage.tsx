import React, { useRef, useState } from "react";
import { useSignedUrl } from "data/api";
import type { MapPointer, MesaFile } from "lib/types";
import { uid } from "ui/bits";
import styles from "./MapStage.module.scss";

export interface FogRect {
  id: string;
  x: number;
  y: number;
  w: number;
  h: number;
}
export type MapMeta = MesaFile["meta"] & { fog?: FogRect[] };

export type MapTool = { kind: "move" } | { kind: "piece"; label: string; color: string; pieceKind: "agent" | "marker" } | { kind: "fog" } | { kind: "erase" };

const TOOL_CLASS = { move: "toolMove", piece: "toolPiece", fog: "toolFog", erase: "toolErase" } as const;

/** Mapa com peças e áreas cobertas. Coordenadas normalizadas (0..1). */
export function MapStage({
  file,
  zoom = 100,
  tool,
  onChange,
}: {
  file: MesaFile;
  zoom?: number;
  tool?: MapTool;
  onChange?(meta: MapMeta): void;
}) {
  const url = useSignedUrl(file.path);
  const ref = useRef<HTMLDivElement>(null);
  const meta = (file.meta || {}) as MapMeta;
  const pointers = meta.pointers || [];
  const fog = meta.fog || [];
  const editable = !!onChange && !!tool;
  const [drag, setDrag] = useState<{ id: string } | null>(null);
  const [draft, setDraft] = useState<{ x0: number; y0: number; x: number; y: number } | null>(null);
  const [local, setLocal] = useState<MapPointer[] | null>(null);
  const shown = local || pointers;

  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };

  function down(e: React.PointerEvent) {
    if (!editable || !tool) return;
    const p = pos(e);
    if (tool.kind === "piece") {
      onChange!({ ...meta, pointers: [...pointers, { id: uid(), x: p.x, y: p.y, label: tool.label, color: tool.color, kind: tool.pieceKind }] });
    } else if (tool.kind === "fog") {
      (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
      setDraft({ x0: p.x, y0: p.y, x: p.x, y: p.y });
    }
  }
  function move(e: React.PointerEvent) {
    if (draft) {
      const p = pos(e);
      setDraft({ ...draft, x: p.x, y: p.y });
    } else if (drag) {
      const p = pos(e);
      setLocal(shown.map((pt) => (pt.id === drag.id ? { ...pt, x: p.x, y: p.y } : pt)));
    }
  }
  function up() {
    if (draft) {
      const r = { id: uid(), x: Math.min(draft.x0, draft.x), y: Math.min(draft.y0, draft.y), w: Math.abs(draft.x - draft.x0), h: Math.abs(draft.y - draft.y0) };
      setDraft(null);
      if (r.w > 0.01 && r.h > 0.01) onChange!({ ...meta, fog: [...fog, r] });
    }
    if (drag && local) {
      onChange!({ ...meta, pointers: local });
      setLocal(null);
    }
    setDrag(null);
  }

  return (
    <div className={styles.scroller}>
      <div
        ref={ref}
        className={`${styles.stage} ${editable ? styles[TOOL_CLASS[tool!.kind]] : ""}`}
        style={{ width: zoom + "%" }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
      >
        {url ? <img src={url} alt={file.name} draggable={false} /> : <div className={styles.loading}>Carregando mapa…</div>}
        {fog.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`${styles.fog} ${editable ? styles.fogEdit : ""}`}
            style={{ left: f.x * 100 + "%", top: f.y * 100 + "%", width: f.w * 100 + "%", height: f.h * 100 + "%" }}
            tabIndex={editable && tool?.kind === "erase" ? 0 : -1}
            aria-label={editable && tool?.kind === "erase" ? "Revelar área" : "Área não revelada"}
            onPointerDown={(e) => {
              if (editable && tool?.kind === "erase") {
                e.stopPropagation();
                onChange!({ ...meta, fog: fog.filter((x) => x.id !== f.id) });
              }
            }}
          >
            {!editable && <span>Não revelado</span>}
          </button>
        ))}
        {draft && (
          <span
            className={styles.fogDraft}
            style={{ left: Math.min(draft.x0, draft.x) * 100 + "%", top: Math.min(draft.y0, draft.y) * 100 + "%", width: Math.abs(draft.x - draft.x0) * 100 + "%", height: Math.abs(draft.y - draft.y0) * 100 + "%" }}
          />
        )}
        {shown.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`${styles.piece} ${p.kind === "marker" ? styles.marker : ""}`}
            style={{ left: p.x * 100 + "%", top: p.y * 100 + "%", ["--c" as string]: p.color }}
            title={p.label}
            aria-label={p.label}
            tabIndex={editable ? 0 : -1}
            onPointerDown={(e) => {
              if (!editable) return;
              e.stopPropagation();
              if (tool?.kind === "erase") onChange!({ ...meta, pointers: pointers.filter((x) => x.id !== p.id) });
              else if (tool?.kind === "move") {
                (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
                setDrag({ id: p.id });
              }
            }}
          >
            {p.kind === "marker" ? "!" : (p.label || "?")[0].toUpperCase()}
          </button>
        ))}
      </div>
    </div>
  );
}
