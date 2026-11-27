import React from "react";
import type { ResourceStatus } from "lib/types";

export function Bar({ cur, max, color, dark }: { cur: number; max: number; color: string; dark?: boolean }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((100 * cur) / max))) : 0;
  return (
    <div className={`gm-bar ${dark ? "gm-bar--dark" : ""}`} role="meter" aria-valuemin={0} aria-valuemax={max} aria-valuenow={cur}>
      <span style={{ width: pct + "%", background: color }} />
    </div>
  );
}

export function ResourceRow({ r, compact }: { r: ResourceStatus; compact?: boolean }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: compact ? 8 : 10 }}>
      <span style={{ width: compact ? 30 : 34, fontSize: compact ? 12 : 13, fontWeight: 800, color: "#3b2b1e" }}>{r.label}</span>
      <Bar cur={r.cur} max={r.max} color={r.color} />
      <span className="gm-num" style={{ width: compact ? 46 : 56, textAlign: "right", fontSize: compact ? 14 : 15 }}>
        {r.cur}/{r.max}
      </span>
    </div>
  );
}

/** Avatar circular com inicial. */
export function Seal({
  name,
  color,
  size = 36,
  display,
  grayscale,
  img,
}: {
  name: string;
  color: string;
  size?: number;
  display?: boolean;
  grayscale?: boolean;
  img?: string | null;
}) {
  const initial = initialOf(name);
  return (
    <span
      style={{
        width: size,
        height: size,
        flex: "none",
        borderRadius: "50%",
        background: color,
        color: "#fff7e8",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: display ? "'IM Fell English SC', serif" : undefined,
        fontWeight: display ? 400 : 800,
        fontSize: Math.round(size * (display ? 0.5 : 0.42)),
        filter: grayscale ? "grayscale(.8)" : undefined,
        overflow: "hidden",
      }}
    >
      {img ? <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : initial}
    </span>
  );
}

export function initialOf(name: string): string {
  const clean = (name || "?").replace(/^(Dra?\.|Sr\.|Sra\.|Cabo|Sgt\.|Prof\.)\s+/i, "").trim();
  return (clean[0] || "?").toUpperCase();
}

export function Stepper({
  value,
  onChange,
  min = -Infinity,
  max = Infinity,
  label,
  render,
  dark,
}: {
  value: number;
  onChange(v: number): void;
  min?: number;
  max?: number;
  label: string;
  render?: (v: number) => React.ReactNode;
  dark?: boolean;
}) {
  const cls = dark ? "gm-btn gm-ib gm-ib--sm" : "gm-btn gm-ib gm-ib--sm";
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <button type="button" className={cls} onClick={() => onChange(Math.max(min, value - 1))} aria-label={`Diminuir ${label}`}>
        −
      </button>
      <span className="gm-num" style={{ fontSize: 20, minWidth: 30, textAlign: "center" }}>
        {render ? render(value) : value}
      </span>
      <button type="button" className={cls} onClick={() => onChange(Math.min(max, value + 1))} aria-label={`Aumentar ${label}`}>
        +
      </button>
    </div>
  );
}

export function Spinner({ label = "Carregando…" }: { label?: string }) {
  return (
    <div className="gm-center-screen" role="status">
      {label}
    </div>
  );
}

export const n = (v: unknown): number => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
export const signed = (v: number) => (v >= 0 ? "+" : "−") + Math.abs(v);
export const uid = () =>
  (typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : Math.random().toString(36).slice(2) + Date.now().toString(36));

export function timeAgo(iso: string): string {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return "agora";
  if (d < 3600) return `há ${Math.floor(d / 60)} min`;
  if (d < 86400) return `há ${Math.floor(d / 3600)} h`;
  if (d < 172800) return "ontem";
  return `há ${Math.floor(d / 86400)} dias`;
}
