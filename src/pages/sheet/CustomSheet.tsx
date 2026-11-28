import React from "react";
import { CustomField, CustomSheet as Sheet, evalFormula } from "systems/custom";
import { Bar, uid } from "ui/bits";
import { ConditionsLine, EditTable, Field, NotesSection, NumIn, Portrait, SheetProps } from "./common";
import styles from "./Sheet.module.scss";

const TYPE_LABEL: Record<CustomField["type"], string> = { text: "Texto livre", number: "Número", list: "Lista de itens", check: "Caixa de seleção", formula: "Fórmula" };

export function CustomSheet({ sheet: s, update, roll }: SheetProps<Sheet>) {
  const setField = (id: string, patch: Partial<CustomField>) => update((x) => ({ ...x, fields: x.fields.map((f) => (f.id === id ? { ...f, ...patch } : f)) }));

  return (
    <>
      <section className="gm-sec" data-g="status">
        <h2 className="gm-ban">Personagem</h2>
        <ConditionsLine conditions={s.conditions} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
          <Portrait url={s.portrait} color="#8a6a2e" onChange={(u) => update((x) => ({ ...x, portrait: u }))} />
          <div style={{ flex: "1 1 260px", display: "flex", flexDirection: "column", gap: 12 }}>
            <Field label="Nome" big value={s.name} onChange={(v) => update((x) => ({ ...x, name: v }))} />
            <Field label="Conceito" value={s.concept} onChange={(v) => update((x) => ({ ...x, concept: v }))} placeholder="Ex.: Piloto de dirigível, nível 2" />
          </div>
        </div>
      </section>

      <section className="gm-sec" data-g="status">
        <h2 className="gm-ban">Atributos</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 10 }}>
          {Object.keys(s.attrs).map((k) => (
            <div key={k} className={styles.attr}>
              <button
                type="button"
                className={`gm-btn ${styles.hex}`}
                aria-label={`Rolar ${k}`}
                onClick={() => {
                  const r = 1 + Math.floor(Math.random() * 20);
                  roll({ total: r + s.attrs[k], text: `${k}: d20 → ${r} + ${s.attrs[k]}` });
                }}
              >
                <b>{s.attrs[k]}</b>
              </button>
              <small>{k}</small>
              <div className={styles.pm}>
                <button type="button" className="gm-btn" aria-label={`Diminuir ${k}`} onClick={() => update((x) => ({ ...x, attrs: { ...x.attrs, [k]: x.attrs[k] - 1 } }))}>−</button>
                <button type="button" className="gm-btn" aria-label={`Aumentar ${k}`} onClick={() => update((x) => ({ ...x, attrs: { ...x.attrs, [k]: x.attrs[k] + 1 } }))}>+</button>
              </div>
            </div>
          ))}
        </div>
        <div className="gm-hint">Toque no atributo para rolar 1d20 + valor.</div>
      </section>

      <div className={styles.gridRes} data-g="status">
        {s.resources.map((r, i) => (
          <section key={i} className="gm-sec" style={{ gap: 10 }} data-g="status">
            <div className={styles.resHead}>
              <h2>{r.label}</h2>
              <span className={styles.resChip} style={{ background: r.color }}>{r.label.slice(0, 4).toUpperCase()}</span>
            </div>
            <div className={styles.resCtl}>
              <button type="button" className="gm-btn" aria-label={`Diminuir ${r.label}`} onClick={() => update((x) => ({ ...x, resources: x.resources.map((y, j) => (j === i ? { ...y, cur: Math.max(0, y.cur - 1) } : y)) }))}>−</button>
              <div className={styles.resVal}>
                <NumIn className="" label={`${r.label} atual`} value={r.cur} min={0} onChange={(v) => update((x) => ({ ...x, resources: x.resources.map((y, j) => (j === i ? { ...y, cur: v } : y)) }))} />
                <span> / {r.max}</span>
              </div>
              <button type="button" className="gm-btn" aria-label={`Aumentar ${r.label}`} onClick={() => update((x) => ({ ...x, resources: x.resources.map((y, j) => (j === i ? { ...y, cur: Math.min(y.max, y.cur + 1) } : y)) }))}>+</button>
            </div>
            <Bar cur={r.cur} max={r.max} color={r.color} />
            <label className="gm-lbl" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              Máximo<NumIn value={r.max} min={1} onChange={(v) => update((x) => ({ ...x, resources: x.resources.map((y, j) => (j === i ? { ...y, max: v } : y)) }))} style={{ width: 70, height: 34 }} />
            </label>
          </section>
        ))}
      </div>

      <section className="gm-sec" data-g="skills">
        <div className={styles.headRow}>
          <h2 className="gm-ban">Campos da ficha</h2>
          <span className="gm-hint">Fórmulas usam os nomes dos atributos, ex.: 10 + {Object.keys(s.attrs)[0] || "Força"}</span>
        </div>
        {s.fields.map((f) => (
          <div key={f.id} style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "flex-start", padding: 10, borderRadius: 12, background: "#e9dcbd" }}>
            <input className="gm-in" aria-label="Nome do campo" value={f.label} onChange={(e) => setField(f.id, { label: e.target.value })} style={{ flex: "1 1 160px", fontWeight: 800 }} />
            {f.type === "text" && <textarea className="gm-in" rows={2} aria-label={f.label} value={f.value} onChange={(e) => setField(f.id, { value: e.target.value })} style={{ flex: "3 1 260px" }} />}
            {f.type === "number" && <NumIn label={f.label} value={Number(f.value) || 0} onChange={(v) => setField(f.id, { value: String(v) })} style={{ width: 100 }} />}
            {f.type === "check" && (
              <input type="checkbox" aria-label={f.label} checked={!!f.checked} onChange={(e) => setField(f.id, { checked: e.target.checked })} style={{ width: 24, height: 24, marginTop: 10, accentColor: "#8a6a2e" }} />
            )}
            {f.type === "formula" && (
              <span style={{ display: "flex", gap: 8, alignItems: "center", flex: "3 1 260px" }}>
                <input className="gm-in" aria-label={`Fórmula de ${f.label}`} value={f.value} onChange={(e) => setField(f.id, { value: e.target.value })} placeholder="10 + Força" style={{ flex: 1 }} />
                <span className={styles.calcDark} style={{ minWidth: 56, padding: "0 10px" }}>{evalFormula(f.value, s.attrs)}</span>
              </span>
            )}
            {f.type === "list" && (
              <textarea className="gm-in" rows={3} aria-label={f.label} value={(f.items || []).join("\n")} placeholder="Um item por linha" onChange={(e) => setField(f.id, { items: e.target.value.split("\n") })} style={{ flex: "3 1 260px" }} />
            )}
            <button type="button" className="gm-btn gm-del" aria-label={`Remover ${f.label}`} onClick={() => update((x) => ({ ...x, fields: x.fields.filter((y) => y.id !== f.id) }))}>✕</button>
          </div>
        ))}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {(Object.keys(TYPE_LABEL) as CustomField["type"][]).map((ty) => (
            <button
              key={ty}
              type="button"
              className={`gm-btn ${styles.addBtn}`}
              onClick={() => update((x) => ({ ...x, fields: [...x.fields, { id: uid(), label: TYPE_LABEL[ty], type: ty, value: "", items: [] }] }))}
            >
              + {TYPE_LABEL[ty]}
            </button>
          ))}
        </div>
      </section>

      <section id="inventario" className="gm-sec" data-g="items">
        <h2 className="gm-ban">Inventário</h2>
        <EditTable
          cols={[{ key: "n", label: "Item", width: "3fr" }, { key: "e", label: "Qtd.", width: "90px", type: "number" }]}
          rows={s.items}
          onChange={(rows) => update((x) => ({ ...x, items: rows }))}
          blank={{ n: "", e: 1 }}
          addLabel="Adicionar item"
          minWidth={360}
        />
      </section>

      <NotesSection value={s.notas} onChange={(v) => update((x) => ({ ...x, notas: v }))} />
    </>
  );
}

export const CUSTOM_SECTIONS: [string, string][] = [["inventario", "Inventário"], ["notas", "Anotações"]];
