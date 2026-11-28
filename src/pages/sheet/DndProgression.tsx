import React, { useState } from "react";
import { DND_AB, DndSheet as Sheet } from "systems/dnd";
import { DND_BACKGROUNDS, DND_CLASSES } from "systems/dndData";
import { asiLabel, dndSteps, findBackground, findClass, spellAbility } from "systems/dndProgression";
import styles from "./Progression.module.scss";

type Update = (fn: (s: Sheet) => Sheet) => void;

/** Classe, subclasse, antecedente e tudo o que chega a cada nível (D&D 2024). */
export function DndProgression({ sheet: s, update }: { sheet: Sheet; update: Update }) {
  const cls = findClass(s.t.classe);
  const c = cls ? DND_CLASSES[cls] : null;
  const bg = findBackground(s.t.antecedente);
  const steps = dndSteps(s);
  const auto = s.auto || { hp: false, slots: false, saves: false };
  const choose = (id: string, v: string | undefined) =>
    update((x) => {
      const choices = { ...(x.choices || {}) };
      if (v) choices[id] = v;
      else delete choices[id];
      return { ...x, choices };
    });
  const pending = steps.filter((st) => (st.kind === "subclass" && !s.subclass) || (st.kind === "asi" && !s.choices?.[st.id])).length;

  return (
    <section id="progressao" className="gm-sec" data-g="skills">
      <div className={styles.head}>
        <h2 className="gm-ban">Progressão</h2>
        {pending > 0 && <span className="gm-badge gm-badge--wait">{pending} escolha{pending > 1 ? "s" : ""} pendente{pending > 1 ? "s" : ""}</span>}
      </div>

      <div className={styles.facts}>
        <label className="gm-lbl">
          Classe
          <select className="gm-in" value={cls || ""} onChange={(e) => update((x) => ({ ...x, t: { ...x.t, classe: e.target.value } }))}>
            <option value="">{s.t.classe && !cls ? `“${s.t.classe}” (fora do livro)` : "Escolher classe…"}</option>
            {Object.keys(DND_CLASSES).map((k) => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
        <label className="gm-lbl">
          <span style={{ display: "flex", alignItems: "baseline", gap: 6, whiteSpace: "nowrap" }}>
            Subclasse
            {c && s.level < 3 && <span className="gm-hint" style={{ fontSize: 11 }}>· no nível 3</span>}
          </span>
          <select className="gm-in" value={s.subclass || ""} disabled={!c || s.level < 3} onChange={(e) => update((x) => ({ ...x, subclass: e.target.value || undefined }))}>
            <option value="">Escolher subclasse…</option>
            {c?.subclasses.map((sc) => <option key={sc.name} value={sc.name}>{sc.name} · p. {sc.page}</option>)}
          </select>
        </label>
        <label className="gm-lbl">
          Antecedente
          <select className="gm-in" value={bg?.name || ""} onChange={(e) => update((x) => ({ ...x, t: { ...x.t, antecedente: e.target.value } }))}>
            <option value="">{s.t.antecedente && !bg ? `“${s.t.antecedente}”` : "Escolher antecedente…"}</option>
            {DND_BACKGROUNDS.map((b) => <option key={b.name} value={b.name}>{b.name}</option>)}
          </select>
        </label>
      </div>

      {(c || bg) && (
        <div className={styles.facts}>
          {c && cls && (
            <div>
              <b>{cls}</b> · p. {c.page} · d{c.hd} de vida
              <span>Atributo primário: {c.primary}</span>
              <span>Salvaguardas: {c.saves.map((k) => DND_AB.find(([x]) => x === k)?.[1].toLowerCase()).join(" e ")}</span>
              <span>Perícias: {c.skills}</span>
              <span>Armas: {c.weapons} · Armaduras: {c.armor || "nenhuma"}</span>
              {spellAbility(cls, s.subclass) && <span>Conjura com {DND_AB.find(([x]) => x === spellAbility(cls, s.subclass))?.[1].toLowerCase()}</span>}
            </div>
          )}
          {bg && (
            <div>
              <b>Antecedente · {bg.name}</b> · p. {bg.page}
              <span>Aumentos: +2/+1 ou +1/+1/+1 entre {bg.attrs.map((k) => DND_AB.find(([x]) => x === k)?.[1].toLowerCase()).join(", ")}</span>
              <span>Talento de origem: {bg.feat}</span>
              <span>Perícias: {bg.skills.join(", ")}{s.autoSk?.length ? " (marcadas automaticamente)" : ""}</span>
              {bg.tool && <span>Ferramenta: {bg.tool}</span>}
            </div>
          )}
        </div>
      )}

      {c && (
        <div className={styles.toggles}>
          <label><input type="checkbox" checked={auto.hp} onChange={(e) => update((x) => ({ ...x, auto: { ...auto, hp: e.target.checked } }))} /> PV máximo pelo dado de vida (valor fixo por nível)</label>
          <label><input type="checkbox" checked={auto.saves} onChange={(e) => update((x) => ({ ...x, auto: { ...auto, saves: e.target.checked } }))} /> Salvaguardas da classe</label>
          <label><input type="checkbox" checked={auto.slots} onChange={(e) => update((x) => ({ ...x, auto: { ...auto, slots: e.target.checked } }))} /> Espaços de magia pela tabela da classe</label>
        </div>
      )}

      {c ? (
        <ol className={styles.timeline}>
          {steps.map((st) => {
            const pick = s.choices?.[st.id];
            const todo = (st.kind === "subclass" && !s.subclass) || (st.kind === "asi" && !pick);
            return (
              <li key={st.id} className={`${styles.step} ${todo ? styles.todo : ""}`}>
                <span className={styles.nex}>Nv {st.level}</span>
                <div className={styles.body}>
                  <div className={styles.title}>
                    {st.kind === "subclass" && s.subclass ? s.subclass : st.name}
                    {st.source !== cls && <span className="gm-badge gm-badge--dark">{st.source}</span>}
                    {st.page && <span className={styles.page}>p. {st.page}</span>}
                  </div>
                  {st.kind === "subclass" && !s.subclass && <div className={styles.summary}>Escolha a subclasse acima para liberar as características dela.</div>}
                  {st.kind === "asi" && <AsiPicker value={pick} onChange={(v) => choose(st.id, v)} sheet={s} />}
                  {st.kind === "boon" && (
                    <input className="gm-in" placeholder="Qual Dádiva Épica você escolheu?" value={pick || ""} onChange={(e) => choose(st.id, e.target.value || undefined)} style={{ maxWidth: 420 }} />
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      ) : (
        <div className="gm-hint">Escolha a classe para ver o que chega a cada nível.</div>
      )}
      <div className="gm-hint">
        Mostramos o nome e a página de cada característica; a regra completa fica no Livro do Jogador (ícone de livro). Aumentos de atributo aplicam o valor na hora e
        trocar a escolha desfaz.
      </div>
    </section>
  );
}

function AsiPicker({ value, onChange, sheet }: { value?: string; onChange(v: string | undefined): void; sheet: Sheet }) {
  const parts = value?.startsWith("attr:") ? value.slice(5).split(",") : [];
  const saved = !value ? "" : value.startsWith("feat:") ? "feat" : parts.length === 2 && parts[0] === parts[1] ? "two" : "split";
  const [mode, setMode] = useState(saved);
  if (value === "importado") return <span className={styles.done}>{asiLabel(value)}</span>;
  const [a = "", b = ""] = parts;
  const attrSelect = (v: string, set: (k: string) => void, label: string) => (
    <select className="gm-in" aria-label={label} value={v} onChange={(e) => set(e.target.value)} style={{ width: 160 }}>
      <option value="">Atributo…</option>
      {DND_AB.map(([k, l]) => (
        <option key={k} value={k} disabled={sheet.sc[k] >= 20 && v !== k}>
          {l.charAt(0) + l.slice(1).toLowerCase()} ({sheet.sc[k]})
        </option>
      ))}
    </select>
  );
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8, alignItems: "center" }}>
      <select
        className="gm-in"
        aria-label="Tipo de aumento"
        value={mode}
        style={{ width: 200 }}
        onChange={(e) => {
          setMode(e.target.value);
          onChange(e.target.value === "feat" ? "feat:" : undefined);
        }}
      >
        <option value="">Escolher…</option>
        <option value="two">+2 em um atributo</option>
        <option value="split">+1 em dois atributos</option>
        <option value="feat">Talento</option>
      </select>
      {mode === "two" && attrSelect(a, (k) => onChange(k ? `attr:${k},${k}` : undefined), "Atributo +2")}
      {mode === "split" && (
        <>
          {attrSelect(a, (k) => onChange(k ? (b ? `attr:${k},${b}` : `attr:${k}`) : b ? `attr:${b}` : undefined), "Primeiro atributo +1")}
          {attrSelect(b, (k) => onChange(a ? (k ? `attr:${a},${k}` : `attr:${a}`) : k ? `attr:${k}` : undefined), "Segundo atributo +1")}
        </>
      )}
      {mode === "feat" && (
        <input className="gm-in" placeholder="Nome do talento" value={value?.startsWith("feat:") ? value.slice(5) : ""} onChange={(e) => onChange(`feat:${e.target.value}`)} style={{ width: 220 }} />
      )}
      {value && value !== "feat:" && <span className={styles.done}>{asiLabel(value)}</span>}
    </div>
  );
}
