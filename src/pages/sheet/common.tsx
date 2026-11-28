import React, { useState } from "react";
import { useAuth } from "auth/AuthProvider";
import { deletePortrait, uploadPortrait } from "data/api";
import { errorMessage } from "lib/supabase";
import type { Mesa } from "lib/types";
import { Silhouette } from "ui/Icons";
import { useUploadGuard } from "ui/Toast";
import styles from "./Sheet.module.scss";

export interface RollResult {
  total: number | string;
  text: string;
}

export interface SheetProps<S> {
  sheet: S;
  update(fn: (s: S) => S): void;
  roll(r: RollResult): void;
  mesa: Mesa;
}

export const num = (v: unknown) => Number(v) || 0;

/** Input numérico que aceita campo vazio enquanto se digita. */
export function NumIn({
  value,
  onChange,
  className = "gm-in",
  style,
  label,
  min,
  max,
}: {
  value: number;
  onChange(v: number): void;
  className?: string;
  style?: React.CSSProperties;
  label?: string;
  min?: number;
  max?: number;
}) {
  const [txt, setTxt] = useState<string | null>(null);
  return (
    <input
      className={className}
      style={style}
      aria-label={label}
      inputMode="numeric"
      value={txt ?? String(value)}
      onChange={(e) => {
        setTxt(e.target.value);
        if (/^-?\d+$/.test(e.target.value.trim())) {
          let v = Number(e.target.value);
          if (min !== undefined) v = Math.max(min, v);
          if (max !== undefined) v = Math.min(max, v);
          onChange(v);
        }
      }}
      onBlur={() => setTxt(null)}
    />
  );
}

export function Field({
  label,
  value,
  onChange,
  area,
  rows = 4,
  big,
  placeholder,
}: {
  label: string;
  value: string;
  onChange(v: string): void;
  area?: boolean;
  rows?: number;
  big?: boolean;
  placeholder?: string;
}) {
  return (
    <label className="gm-lbl">
      {label}
      {area ? (
        <textarea className="gm-in" rows={rows} value={value} placeholder={placeholder} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input
          className="gm-in"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(e.target.value)}
          style={big ? { font: "400 20px 'IM Fell English SC', serif" } : undefined}
        />
      )}
    </label>
  );
}

export function Portrait({ url, color, onChange }: { url?: string | null; color: string; onChange(url: string | null): void }) {
  const { profile } = useAuth();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const guard = useUploadGuard();

  async function pick(f: File | undefined) {
    if (!f || !profile) return;
    setBusy(true);
    setErr("");
    try {
      const old = url;
      onChange(await uploadPortrait(profile.id, f));
      // O retrato anterior foi trocado: não precisa mais ficar no Storage.
      void deletePortrait(profile.id, old).catch(() => undefined);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  async function remove() {
    if (!profile) return;
    setBusy(true);
    setErr("");
    try {
      await deletePortrait(profile.id, url);
      onChange(null);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.portrait}>
      <label className={styles.portraitFrame}>
        {url ? (
          <img src={url} alt="Retrato do personagem" />
        ) : (
          <span className={styles.portraitEmpty} style={{ background: color }}>
            <Silhouette width={120} height={144} />
            <span className={styles.portraitHint}>{busy ? "Enviando…" : "Toque para enviar a imagem"}</span>
          </span>
        )}
        <input type="file" accept="image/*" aria-label="Enviar retrato do personagem" className="gm-sr" onChange={(e) => pick(guard(e.target)[0])} />
      </label>
      {url && (
        <button type="button" className="gm-btn" style={{ background: "none", color: "#8a2a1f", fontSize: 13, padding: 0 }} onClick={remove} disabled={busy}>
          Remover retrato
        </button>
      )}
      {err && <div className="gm-error" style={{ fontSize: 12 }}>{err}</div>}
      <div style={{ fontSize: 12, lineHeight: 1.35, color: "#6b5640", textAlign: "center" }}>Este retrato aparece em “Mesas em que eu jogo” e no painel do mestre.</div>
    </div>
  );
}

/** Lista editável genérica (ataques, habilidades, itens…). */
export function EditTable<T extends Record<string, unknown>>({
  cols,
  rows,
  onChange,
  blank,
  addLabel,
  minWidth = 560,
}: {
  cols: { key: keyof T & string; label: string; width: string; type?: "number" }[];
  rows: T[];
  onChange(rows: T[]): void;
  blank: T;
  addLabel: string;
  minWidth?: number;
}) {
  const tpl = cols.map((c) => c.width).join(" ") + " 40px";
  return (
    <>
      <div className="gm-scroll-x">
        <div className={styles.table} style={{ minWidth }}>
          <div className={styles.tHead} style={{ gridTemplateColumns: tpl }}>
            {cols.map((c) => <span key={c.key}>{c.label}</span>)}
            <span />
          </div>
          {rows.map((r, i) => (
            <div key={i} className={styles.tRow} style={{ gridTemplateColumns: tpl }}>
              {cols.map((c) =>
                c.type === "number" ? (
                  <NumIn key={c.key} label={c.label} value={num(r[c.key])} onChange={(v) => onChange(rows.map((x, j) => (j === i ? { ...x, [c.key]: v } : x)))} />
                ) : (
                  <input
                    key={c.key}
                    className="gm-in"
                    aria-label={c.label}
                    value={String(r[c.key] ?? "")}
                    onChange={(e) => onChange(rows.map((x, j) => (j === i ? { ...x, [c.key]: e.target.value } : x)))}
                  />
                )
              )}
              <button type="button" className="gm-btn gm-del" aria-label="Remover linha" onClick={() => onChange(rows.filter((_, j) => j !== i))}>✕</button>
            </div>
          ))}
        </div>
      </div>
      <button type="button" className={`gm-btn ${styles.addBtn}`} onClick={() => onChange([...rows, { ...blank }])}>+ {addLabel}</button>
    </>
  );
}

export function NotesSection({ value, onChange }: { value: string; onChange(v: string): void }) {
  return (
    <section id="notas" className={`gm-sec ${styles.notes}`} data-g="notes">
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
        <h2 className="gm-ban">Anotações</h2>
        <span className="gm-hint">Privadas — nem o mestre vê.</span>
      </div>
      <textarea className="gm-in" rows={7} aria-label="Anotações privadas" value={value} onChange={(e) => onChange(e.target.value)} />
    </section>
  );
}

export function ConditionsLine({ conditions }: { conditions: string[] }) {
  if (!conditions?.length) return null;
  return (
    <div className={styles.condList} aria-label="Condições aplicadas pelo mestre">
      {conditions.map((c) => <span key={c} className="gm-badge gm-badge--dark">{c}</span>)}
    </div>
  );
}
