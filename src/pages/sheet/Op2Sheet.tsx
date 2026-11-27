import React from "react";
import { OP2_ATTR, OP2_DIE, OP2_FACES, OP2_SK, Op2Sheet as Sheet, rollFace } from "systems/op2";
import { IconD20 } from "ui/Icons";
import { ConditionsLine, EditTable, Field, NotesSection, NumIn, Portrait, RollResult, SheetProps } from "./common";
import styles from "./Sheet.module.scss";

const roll2 = (label: string, a: number, b: number): RollResult => {
  const x = rollFace(OP2_FACES[a]);
  const y = rollFace(OP2_FACES[b]);
  return { total: x + y, text: `${label}: ${OP2_DIE[a]} (${x}) + ${OP2_DIE[b]} (${y})` };
};

export function Op2Sheet({ sheet: s, update, roll }: SheetProps<Sheet>) {
  const setT = (k: keyof Sheet["t"]) => (v: string) => update((x) => ({ ...x, t: { ...x.t, [k]: v } }));

  const pool = (k: "pv" | "pd", key: string, color: string) => {
    const P = s[k];
    return (
      <section className="gm-sec" style={{ gap: 10, flex: "1 1 280px" }} data-g="status">
        <div className={styles.resHead}>
          <h2>{key === "PV" ? "Pontos de Vida" : "Pontos de Determinação"}</h2>
          <span className={styles.resChip} style={{ background: color }}>{key} {Math.max(0, P.total - P.lost)}/{P.total}</span>
        </div>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
          {Array.from({ length: P.total }, (_, i) => {
            const lost = i >= P.total - P.lost;
            return (
              <button
                key={i}
                type="button"
                className={`gm-btn ${styles.tri}`}
                style={{ background: lost ? "#c9b48a" : color }}
                aria-pressed={!lost}
                aria-label={`${key} ${i + 1} ${lost ? "perdido" : "disponível"}`}
                onClick={() => update((x) => ({ ...x, [k]: { ...x[k], lost: lost ? x[k].total - i - 1 : x[k].total - i } }))}
              />
            );
          })}
        </div>
        <label className="gm-lbl" style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
          Total
          <NumIn value={P.total} min={0} max={60} onChange={(v) => update((x) => ({ ...x, [k]: { total: v, lost: Math.min(x[k].lost, v) } }))} style={{ width: 70, height: 34 }} />
        </label>
        <span className="gm-hint">Toque num triângulo para marcar perda ou recuperação.</span>
      </section>
    );
  };

  return (
    <>
      <div className={styles.row} data-g="status">
        <section className="gm-sec" style={{ flex: "3 1 480px" }} data-g="status">
          <h2 className="gm-ban">Agente</h2>
          <ConditionsLine conditions={s.conditions} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
            <Portrait url={s.portrait} color="#2a8a80" onChange={(u) => update((x) => ({ ...x, portrait: u }))} />
            <div style={{ flex: "1 1 260px", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <Field label="Nome" big value={s.t.nome} onChange={setT("nome")} />
              <div className={styles.grid2}>
                <Field label="Perfil" value={s.t.perfil} onChange={setT("perfil")} />
                <Field label="Ocupação" value={s.t.ocupacao} onChange={setT("ocupacao")} />
                <Field label="Nível" value={s.t.nivel} onChange={setT("nivel")} />
                <Field label="NEX" value={s.t.nex} onChange={setT("nex")} />
              </div>
            </div>
          </div>
        </section>
        <section className="gm-sec" style={{ flex: "2 1 300px" }} data-g="status">
          <h2 className="gm-ban">Atributos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 10 }}>
            {OP2_ATTR.map(([k, label]) => (
              <div key={k} className={styles.attr}>
                <button type="button" className={`gm-btn ${styles.hex}`} aria-label={`Rolar ${label}`} onClick={() => { const x = rollFace(OP2_FACES[s.a[k]]); roll({ total: x, text: `${label}: ${OP2_DIE[s.a[k]]} → ${x}` }); }}>
                  <b>{s.a[k]}</b>
                  <span>{OP2_DIE[s.a[k]]}</span>
                </button>
                <small>{label}</small>
                <div className={styles.pm}>
                  <button type="button" className="gm-btn" aria-label={`Diminuir ${label}`} onClick={() => update((x) => ({ ...x, a: { ...x.a, [k]: Math.max(1, x.a[k] - 1) } }))}>−</button>
                  <button type="button" className="gm-btn" aria-label={`Aumentar ${label}`} onClick={() => update((x) => ({ ...x, a: { ...x.a, [k]: Math.min(6, x.a[k] + 1) } }))}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="gm-hint">Valor 1–6 vira dado: 1–2 d4 · 3 d6 · 4 d8 · 5 d10 · 6 d12.</div>
        </section>
      </div>

      <div className={styles.row} data-g="status">
        {pool("pv", "PV", "#c2412d")}
        {pool("pd", "PD", "#3f7cc4")}
      </div>

      <section id="pericias" className="gm-sec" style={{ ["--sys" as string]: "#2a8a80" }} data-g="skills">
        <div className={styles.headRow}>
          <h2 className="gm-ban">Perícias</h2>
          <span className="gm-hint">Teste = dado da perícia + dado do atributo.</span>
        </div>
        <div className={styles.skills}>
          {OP2_SK.map(([label, at], i) => {
            const v = s.sk[i] ?? 1;
            return (
              <div key={label} className={styles.skill}>
                <span>{label}</span>
                <span className={styles.attrTag} style={{ ["--tag-bg" as string]: "#d4ece8", ["--tag-ink" as string]: "#1d5f58", width: 64 }}>{OP2_ATTR.find((x) => x[0] === at)?.[1]}</span>
                <select className="gm-in" aria-label={`Nível em ${label}`} value={v} onChange={(e) => update((x) => ({ ...x, sk: x.sk.map((y, j) => (j === i ? Number(e.target.value) : y)) }))} style={{ width: 70, height: 34, paddingLeft: 10 }}>
                  {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
                <span className={styles.bonus} style={{ width: 80, fontSize: 14 }}>{OP2_DIE[v]}+{OP2_DIE[s.a[at]]}</span>
                <button type="button" className={`gm-btn ${styles.rollBtn}`} aria-label={`Rolar ${label}`} onClick={() => roll(roll2(label, v, s.a[at]))}><IconD20 size={18} /></button>
              </div>
            );
          })}
        </div>
        <div style={{ padding: 12, borderRadius: 12, background: "#e9dcbd", display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
          <div style={{ flex: "1 1 200px" }}><Field label="Aptidão" value={s.t.aptidao} onChange={setT("aptidao")} /></div>
          <label className="gm-lbl">
            Nível
            <select className="gm-in" value={s.apt} onChange={(e) => update((x) => ({ ...x, apt: Number(e.target.value) }))} style={{ width: 70 }}>
              {[1, 2, 3, 4, 5, 6].map((n) => <option key={n} value={n}>{n}</option>)}
            </select>
          </label>
          <span className={styles.calcDark} style={{ padding: "0 12px" }}>{OP2_DIE[s.apt]}+{OP2_DIE[s.a.mente]}</span>
          <button type="button" className="gm-btn gm-btn--ink" style={{ background: "#2a8a80" }} onClick={() => roll(roll2(`Aptidão (${s.t.aptidao || "—"})`, s.apt, s.a.mente))}>Rolar aptidão</button>
          <div style={{ flexBasis: "100%" }}><Field label="Descrição da aptidão" value={s.t.aptidaoDesc} onChange={setT("aptidaoDesc")} /></div>
        </div>
      </section>

      <section className="gm-sec" data-g="skills">
        <h2 className="gm-ban">Habilidades</h2>
        <div className={styles.gridAuto}>
          {s.habs.map((h, i) => (
            <Field key={i} area rows={6} label={`Habilidade ${i + 1}`} value={h} onChange={(v) => update((x) => ({ ...x, habs: x.habs.map((y, j) => (j === i ? v : y)) }))} />
          ))}
        </div>
      </section>

      <section id="inventario" className="gm-sec" style={{ ["--sys" as string]: "#2a8a80" }} data-g="items">
        <h2 className="gm-ban">Inventário</h2>
        <EditTable
          cols={[{ key: "n", label: "Item", width: "3fr" }, { key: "e", label: "Qtd.", width: "90px", type: "number" }]}
          rows={s.items || []}
          onChange={(rows) => update((x) => ({ ...x, items: rows }))}
          blank={{ n: "", e: 1 }}
          addLabel="Adicionar item"
          minWidth={360}
        />
      </section>

      <NotesSection value={s.t.notas} onChange={setT("notas")} />
    </>
  );
}

export const OP2_SECTIONS: [string, string][] = [["pericias", "Perícias"], ["inventario", "Inventário"], ["notas", "Anotações"]];
