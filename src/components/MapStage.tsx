import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
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
const MAX_ZOOM = 6;

/** Posição/zoom do mapa dentro da janela: o conteúdo é desenhado em `translate(x, y) scale(s)`. */
interface View {
  s: number;
  x: number;
  y: number;
}

/**
 * Mapa com peças e áreas cobertas. Coordenadas normalizadas (0..1).
 * Roda do mouse (ou pinça) dá zoom; arrastar com o botão esquerdo move o mapa
 * (para o mestre, na ferramenta "Mover" fora das peças; botão do meio move em qualquer ferramenta).
 */
export function MapStage({ file, tool, onChange }: { file: MesaFile; tool?: MapTool; onChange?(meta: MapMeta): void }) {
  const url = useSignedUrl(file.path);
  const viewport = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const meta = (file.meta || {}) as MapMeta;
  const pointers = meta.pointers || [];
  const fog = meta.fog || [];
  const editable = !!onChange && !!tool;
  const [drag, setDrag] = useState<{ id: string } | null>(null);
  const [draft, setDraft] = useState<{ x0: number; y0: number; x: number; y: number } | null>(null);
  const [local, setLocal] = useState<MapPointer[] | null>(null);
  const shown = local || pointers;

  // ── zoom e arraste ──
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [ratio, setRatio] = useState(0.75); // altura / largura da imagem
  const [view, setViewState] = useState<View>({ s: 1, x: 0, y: 0 });
  const viewRef = useRef(view);
  const [panning, setPanning] = useState(false);
  const touches = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{ kind: "pan"; x: number; y: number } | { kind: "pinch"; dist: number } | null>(null);

  /** Menor zoom: o mapa inteiro cabe na janela. */
  const fitScale = box.w ? Math.min(1, box.h / (box.w * ratio)) : 1;

  const clamp = useCallback(
    (v: View): View => {
      const s = Math.min(MAX_ZOOM, Math.max(fitScale, v.s));
      const w = box.w * s;
      const h = box.w * ratio * s;
      // Menor que a janela: centraliza; maior: não deixa sobrar borda vazia.
      const x = w <= box.w ? (box.w - w) / 2 : Math.min(0, Math.max(box.w - w, v.x));
      const y = h <= box.h ? (box.h - h) / 2 : Math.min(0, Math.max(box.h - h, v.y));
      return { s, x, y };
    },
    [box, ratio, fitScale]
  );

  const setView = useCallback(
    (fn: (v: View) => View) => {
      const next = clamp(fn(viewRef.current));
      viewRef.current = next;
      setViewState(next);
    },
    [clamp]
  );

  /** Zoom mantendo fixo o ponto (px, py) da janela. */
  const zoomAt = useCallback(
    (factor: number, px: number, py: number) =>
      setView((v) => {
        const s = Math.min(MAX_ZOOM, Math.max(fitScale, v.s * factor));
        const k = s / v.s;
        return { s, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
      }),
    [setView, fitScale]
  );

  const fit = useCallback(() => setView(() => ({ s: 0, x: 0, y: 0 })), [setView]);

  useLayoutEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setBox({ w: el.clientWidth, h: el.clientHeight }));
    ro.observe(el);
    setBox({ w: el.clientWidth, h: el.clientHeight });
    return () => ro.disconnect();
  }, []);

  // Mapa novo ou janela mudou de tamanho: enquadra o mapa inteiro.
  useEffect(() => {
    if (box.w) fit();
  }, [file.id, box.w, box.h, ratio, fit]);

  // A roda precisa de listener não-passivo para não rolar a página junto.
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const delta = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
      zoomAt(Math.exp(-delta * 0.0015), e.clientX - r.left, e.clientY - r.top);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const canPan = (e: React.PointerEvent) => e.button === 1 || (e.button === 0 && (!editable || tool?.kind === "move"));

  function vpDown(e: React.PointerEvent) {
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (touches.current.size === 2) {
      // Segundo dedo: vira pinça (cancela o que o primeiro estava fazendo).
      const [a, b] = Array.from(touches.current.values());
      gesture.current = { kind: "pinch", dist: Math.hypot(a.x - b.x, a.y - b.y) };
      setDraft(null);
      setDrag(null);
      setLocal(null);
      return;
    }
    if (!canPan(e) || drag) return;
    e.preventDefault();
    viewport.current?.setPointerCapture?.(e.pointerId);
    gesture.current = { kind: "pan", x: e.clientX, y: e.clientY };
    setPanning(true);
  }

  function vpMove(e: React.PointerEvent) {
    if (!touches.current.has(e.pointerId)) return;
    touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    if (g?.kind === "pinch" && touches.current.size >= 2) {
      const [a, b] = Array.from(touches.current.values());
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const r = viewport.current!.getBoundingClientRect();
      if (g.dist > 0) zoomAt(dist / g.dist, (a.x + b.x) / 2 - r.left, (a.y + b.y) / 2 - r.top);
      gesture.current = { kind: "pinch", dist };
    } else if (g?.kind === "pan") {
      const dx = e.clientX - g.x;
      const dy = e.clientY - g.y;
      gesture.current = { kind: "pan", x: e.clientX, y: e.clientY };
      setView((v) => ({ ...v, x: v.x + dx, y: v.y + dy }));
    }
  }

  function vpUp(e: React.PointerEvent) {
    touches.current.delete(e.pointerId);
    if (touches.current.size === 0) {
      gesture.current = null;
      setPanning(false);
    } else if (gesture.current?.kind === "pinch") {
      const [rest] = Array.from(touches.current.values());
      gesture.current = { kind: "pan", x: rest.x, y: rest.y };
    }
  }

  // ── ferramentas do mestre ──
  const pos = (e: React.PointerEvent) => {
    const r = ref.current!.getBoundingClientRect();
    return { x: Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), y: Math.min(1, Math.max(0, (e.clientY - r.top) / r.height)) };
  };

  function down(e: React.PointerEvent) {
    if (!editable || !tool || e.button !== 0 || touches.current.size > 0) return;
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

  const pannable = !editable || tool?.kind === "move";

  return (
    <div
      ref={viewport}
      className={`${styles.viewport} ${pannable ? styles.pannable : ""} ${panning ? styles.panning : ""}`}
      onPointerDown={vpDown}
      onPointerMove={vpMove}
      onPointerUp={vpUp}
      onPointerCancel={vpUp}
      onAuxClick={(e) => e.preventDefault()}
    >
      <div
        ref={ref}
        className={`${styles.stage} ${editable ? styles[TOOL_CLASS[tool!.kind]] : ""}`}
        style={{ transform: `translate(${view.x}px, ${view.y}px) scale(${view.s})`, ["--inv" as string]: 1 / view.s }}
        onPointerDown={down}
        onPointerMove={move}
        onPointerUp={up}
        onPointerLeave={up}
      >
        {url ? (
          <img
            src={url}
            alt={file.name}
            draggable={false}
            onLoad={(e) => {
              const img = e.currentTarget;
              if (img.naturalWidth) setRatio(img.naturalHeight / img.naturalWidth);
            }}
          />
        ) : (
          <div className={styles.loading}>Carregando mapa…</div>
        )}
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
              if (!editable || e.button !== 0) return;
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

      <div className={styles.zoomBar} onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" className="gm-btn" onClick={() => zoomAt(1 / 1.4, box.w / 2, box.h / 2)} aria-label="Diminuir zoom">−</button>
        <span className={styles.zoomVal}>{Math.round((view.s / fitScale) * 100)}%</span>
        <button type="button" className="gm-btn" onClick={() => zoomAt(1.4, box.w / 2, box.h / 2)} aria-label="Aumentar zoom">+</button>
        <button type="button" className="gm-btn" onClick={fit} aria-label="Enquadrar o mapa inteiro" title="Enquadrar">⤢</button>
      </div>
    </div>
  );
}
