import React, { useEffect } from "react";
import { OP_ATTRS, OP_NEX, OP_ORIGENS, OP_SKILLS, OP_TRILHAS, opCalc, opSkillRoll, OpSheet as Sheet } from "systems/op";
import { IconD20 } from "ui/Icons";
import { Bar } from "ui/bits";
import { ConditionsLine, EditTable, Field, NotesSection, NumIn, Portrait, SheetProps } from "./common";
import { applyOpAutomation, syncOpAbilities } from "systems/opProgression";
import { OpProgression } from "./OpProgression";
import styles from "./Sheet.module.scss";

const RES: [keyof Sheet["cur"], string, string, string][] = [
  ["pv", "Pontos de Vida", "PV", "#c2412d"],
  ["pe", "Pontos de Esforço", "PE", "#3f7cc4"],
  ["san", "Sanidade", "SAN", "#8a5cc7"],
];

export function OpSheet({ sheet: s, update: rawUpdate, roll }: SheetProps<Sheet>) {
  // Toda mudança passa pela automação (perícias da origem, atributos, habilidades).
  const update = (fn: (x: Sheet) => Sheet) => rawUpdate((prev) => applyOpAutomation(prev, fn(prev)));
  const c = opCalc(s);

  // Ao abrir (ou depois de importar), garante que as habilidades automáticas estão em dia.
  const syncKey = `${s.classe}|${s.trilha}|${s.nex}|${s.origem}`;
  useEffect(() => {
    if (JSON.stringify(syncOpAbilities(s)) !== JSON.stringify(s.abilities)) rawUpdate((x) => ({ ...x, abilities: syncOpAbilities(x) }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncKey]);
  const set = <K extends keyof Sheet>(k: K, v: Sheet[K]) => update((x) => ({ ...x, [k]: v }));
  const maxes = { pv: c.pvMax, pe: c.peMax, san: c.sanMax };
  const formulas = { pv: c.fPv, pe: c.fPe, san: c.fSan };
  const uni = s.origem === "universitario";

  return (
    <>
      <div id="agente" className={styles.row} data-g="status">
        <section className="gm-sec" style={{ flex: "3 1 520px" }} data-g="status">
          <h2 className="gm-ban">Agente</h2>
          <ConditionsLine conditions={s.conditions} />
          <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
            <Portrait url={s.portrait} color="#7a4fc0" onChange={(u) => set("portrait", u)} />
            <div style={{ flex: "1 1 280px", minWidth: 0, display: "flex", flexDirection: "column", gap: 12 }}>
              <div className={styles.grid2}>
                <Field label="Personagem" big value={s.name} onChange={(v) => set("name", v)} />
                <Field label="Jogador" value={s.player} onChange={(v) => set("player", v)} />
                <label className="gm-lbl">
                  Origem
                  <select className="gm-in" value={s.origem} onChange={(e) => set("origem", e.target.value)}>
                    {OP_ORIGENS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </select>
                </label>
                <label className="gm-lbl">
                  Classe
                  <select className="gm-in" value={s.classe} onChange={(e) => update((x) => ({ ...x, classe: e.target.value, trilha: "—" }))}>
                    <option value="0">—</option><option value="1">Combatente</option><option value="2">Especialista</option><option value="3">Ocultista</option>
                  </select>
                </label>
                <label className="gm-lbl" style={{ gridColumn: "1 / -1" }}>
                  Trilha
                  <select className="gm-in" value={s.trilha} onChange={(e) => set("trilha", e.target.value)}>
                    {(OP_TRILHAS[s.classe] || ["—"]).map((t) => <option key={t} value={t}>{t}</option>)}
                  </select>
                </label>
                <div className={`${styles.grid3} ${styles.tight}`} style={{ gridColumn: "1 / -1" }}>
                  <label className="gm-lbl">
                    NEX %
                    <select className="gm-in gm-num" value={s.nex} onChange={(e) => set("nex", Number(e.target.value))} style={{ fontSize: 17 }}>
                      {OP_NEX.map((n) => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </label>
                  <div className="gm-lbl" title="Limite de PE por rodada">PE/rodada<span className={styles.calcDark}>{c.peRodada}</span></div>
                  <Field label="Desloc." value={s.desl} onChange={(v) => set("desl", v)} />
                </div>
              </div>
              <div className="gm-hint">PE por rodada = NEX ÷ 5{uni ? " + 1 (Universitário)" : ""}. NEX só aceita os valores da tabela (5%, 10%… 99%).</div>
            </div>
          </div>
        </section>

        <section className="gm-sec" style={{ flex: "2 1 340px" }} data-g="status">
          <h2 className="gm-ban">Atributos</h2>
          <div className={styles.attrs5}>
            {OP_ATTRS.map(([k, key, label]) => (
              <div key={k} className={styles.attr}>
                <button type="button" className={`gm-btn ${styles.hex}`} aria-label={`Rolar ${label}`} onClick={() => roll(opSkillRoll(label, s.a[k], 0))}>
                  <b>{s.a[k]}</b>
                  <span>{key}</span>
                </button>
                <small>{label}</small>
                <div className={styles.pm}>
                  <button type="button" className="gm-btn" aria-label={`Diminuir ${label}`} onClick={() => update((x) => ({ ...x, a: { ...x.a, [k]: Math.max(0, x.a[k] - 1) } }))}>−</button>
                  <button type="button" className="gm-btn" aria-label={`Aumentar ${label}`} onClick={() => update((x) => ({ ...x, a: { ...x.a, [k]: Math.min(7, x.a[k] + 1) } }))}>+</button>
                </div>
              </div>
            ))}
          </div>
          <div className="gm-hint">Em cada teste você rola tantos d20 quanto o valor do atributo e fica com o maior. Toque no hexágono para rolar.</div>
        </section>
      </div>

      <div className={styles.gridRes} data-g="status">
        {RES.map(([k, title, key, color]) => (
          <section key={k} className="gm-sec" style={{ gap: 10 }} data-g="status">
            <div className={styles.resHead}>
              <h2>{title}</h2>
              <span className={styles.resChip} style={{ background: color }}>{key}</span>
            </div>
            <div className={styles.resCtl}>
              <button type="button" className="gm-btn" aria-label={`Diminuir ${title}`} onClick={() => update((x) => ({ ...x, cur: { ...x.cur, [k]: Math.max(0, x.cur[k] - 1) } }))}>−</button>
              <div className={styles.resVal}>
                <NumIn className="" label={`${title} atual`} value={s.cur[k]} min={0} onChange={(v) => update((x) => ({ ...x, cur: { ...x.cur, [k]: v } }))} />
                <span> / {maxes[k]}</span>
              </div>
              <button type="button" className="gm-btn" aria-label={`Aumentar ${title}`} onClick={() => update((x) => ({ ...x, cur: { ...x.cur, [k]: Math.min(maxes[k], x.cur[k] + 1) } }))}>+</button>
            </div>
            <Bar cur={s.cur[k]} max={maxes[k]} color={color} />
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <label className="gm-lbl" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                Mod
                <NumIn label={`Modificador de ${title}`} value={s.mod[k]} onChange={(v) => update((x) => ({ ...x, mod: { ...x.mod, [k]: v } }))} style={{ width: 64, height: 34 }} />
              </label>
              <span className="gm-hint" style={{ flex: 1 }}>{formulas[k]}</span>
            </div>
            <button type="button" className="gm-btn" style={{ alignSelf: "flex-start", background: "none", color: "#8a5a12", padding: 0, fontSize: 13 }} onClick={() => update((x) => ({ ...x, cur: { ...x.cur, [k]: maxes[k] } }))}>
              Restaurar ao máximo
            </button>
          </section>
        ))}

        <section className="gm-sec" style={{ gap: 10 }} data-g="status">
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div className={styles.shield}><b>{c.defesa}</b><span>DEFESA</span></div>
            <div className="gm-hint" style={{ fontSize: 14 }}>= 10 + AGI {s.a.agi} + Equip. {s.defEquip} + Outros {s.defOutros}{s.origem === "policial" ? " + 2 (Policial)" : ""}</div>
          </div>
          <div className={styles.grid2}>
            <label className="gm-lbl">Equipamento<NumIn value={s.defEquip} onChange={(v) => set("defEquip", v)} /></label>
            <label className="gm-lbl">Outros<NumIn value={s.defOutros} onChange={(v) => set("defOutros", v)} /></label>
            <div className="gm-lbl">Esquiva<span className={styles.calcBox}>{c.esquiva}</span><span className="gm-hint">Defesa + Reflexos</span></div>
            <div className="gm-lbl">Red. bloqueio<span className={styles.calcBox}>{c.bloqueio}</span><span className="gm-hint">= bônus de Fortitude</span></div>
          </div>
          <Field label="Proteções" value={s.protecoes} onChange={(v) => set("protecoes", v)} />
          <Field label="Resistências" value={s.resist} onChange={(v) => set("resist", v)} />
        </section>
      </div>

      <section id="pericias" className="gm-sec" data-g="skills">
        <div className={styles.headRow}>
          <h2 className="gm-ban">Perícias</h2>
          <span className="gm-hint">Bônus = treino (Treinado +5, Veterano +10, Expert +15) + outros. * só treinada · + penalidade de carga. Toque no dado para rolar.</span>
        </div>
        <div className={styles.opSkills}>
          {OP_SKILLS.map(([k, label, at]) => {
            const b = c.bonus(k);
            const sk = s.sk[k] || { t: 0, o: 0 };
            return (
              <div key={k} className={styles.opSkill}>
                <span className={styles.skName}>
                  <span>
                    {label.replace(/[ *+]+$/, "")}
                    {/\*/.test(label) && <sup title="Só pode ser usada se treinada">*</sup>}
                    {/\+$/.test(label) && <sup title="Sofre penalidade de carga">+</sup>}
                  </span>
                  <span className={styles.attrTag}>{at.toUpperCase()}</span>
                </span>
                <select className="gm-in" aria-label={`Treino em ${label}`} value={sk.t} onChange={(e) => update((x) => ({ ...x, sk: { ...x.sk, [k]: { ...sk, t: Number(e.target.value) } } }))} style={{ height: 34, fontSize: 13, paddingLeft: 8 }}>
                  <option value={0}>Destreinado</option><option value={1}>Treinado</option><option value={2}>Veterano</option><option value={3}>Expert</option>
                </select>
                <NumIn label={`Outros bônus em ${label}`} value={sk.o} onChange={(v) => update((x) => ({ ...x, sk: { ...x.sk, [k]: { ...sk, o: v } } }))} style={{ height: 34, padding: "0 6px", width: "100%" }} />
                <span className={styles.bonus}>{b >= 0 ? "+" : ""}{b}</span>
                <button type="button" className={`gm-btn ${styles.rollBtn}`} aria-label={`Rolar ${label}`} onClick={() => roll(opSkillRoll(label, s.a[at], b))}><IconD20 size={18} /></button>
              </div>
            );
          })}
        </div>
      </section>

      <OpProgression sheet={s} update={update} />

      <section id="ataques" className="gm-sec" data-g="skills">
        <h2 className="gm-ban">Ataques</h2>
        <EditTable
          minWidth={720}
          cols={[{ key: "n", label: "Ataque", width: "2fr" }, { key: "t", label: "Teste", width: "1fr" }, { key: "d", label: "Dano", width: "1fr" }, { key: "e", label: "Crítico / alcance / especial", width: "2fr" }]}
          rows={s.attacks}
          onChange={(rows) => set("attacks", rows)}
          blank={{ n: "", t: "", d: "", e: "" }}
          addLabel="Adicionar ataque"
        />
      </section>

      <section id="habilidades" className="gm-sec" data-g="skills">
        <div className={styles.headRow}>
          <h2 className="gm-ban">Habilidades e rituais</h2>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span className="gm-eyebrow" style={{ color: "#5a4430" }}>DT de rituais</span>
            <span className={styles.calcDark} style={{ width: 56, height: 48, fontSize: 24 }}>{c.dt}</span>
            <label className="gm-lbl" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
              Mod<NumIn value={s.modDt} onChange={(v) => set("modDt", v)} style={{ width: 60, height: 34 }} />
            </label>
          </div>
        </div>
        <div className="gm-hint">DT = 10 + ⌈NEX ÷ 5⌉ ({c.steps}) + PRE {s.a.pre} + mod {s.modDt}{uni ? " + 1 (Universitário)" : ""}</div>
        <EditTable
          minWidth={720}
          cols={[{ key: "n", label: "Nome", width: "2fr" }, { key: "c", label: "Custo", width: "90px" }, { key: "p", label: "Página", width: "80px" }, { key: "d", label: "Descrição", width: "4fr" }]}
          rows={s.abilities}
          onChange={(rows) => set("abilities", rows)}
          blank={{ n: "", c: "", p: "", d: "" }}
          addLabel="Adicionar habilidade ou ritual"
        />
      </section>

      <section id="inventario" className="gm-sec" data-g="items">
        <h2 className="gm-ban">Inventário</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
          <label className="gm-lbl">Pontos de prestígio<NumIn value={s.prestigio} onChange={(v) => set("prestigio", v)} /></label>
          <Field label="Patente" value={s.patente} onChange={(v) => set("patente", v)} />
          <Field label="Limite de crédito" value={s.credito} onChange={(v) => set("credito", v)} />
          {["I", "II", "III", "IV"].map((r, i) => (
            <label key={r} className="gm-lbl">
              {i === 0 ? "Limite itens I" : r}
              <NumIn value={s.lim[i]} onChange={(v) => set("lim", s.lim.map((x, j) => (j === i ? v : x)) as Sheet["lim"])} />
            </label>
          ))}
        </div>
        <div className={`${styles.carga} ${c.carga > c.cargaMax ? styles.cargaOver : ""}`}>
          <span style={{ fontWeight: 800 }}>Carga</span>
          <span className="gm-num" style={{ fontSize: 24 }}>{c.carga} / {c.cargaMax}</span>
          <span className="gm-hint" style={{ flex: 1 }}>Soma dos espaços dos itens · carga máxima = 5 × FOR (mínimo 2){c.carga > c.cargaMax ? " — sobrecarregado!" : ""}</span>
        </div>
        <EditTable
          cols={[{ key: "n", label: "Item", width: "3fr" }, { key: "c", label: "Categoria", width: "1fr" }, { key: "e", label: "Espaços", width: "90px", type: "number" }]}
          rows={s.items}
          onChange={(rows) => set("items", rows)}
          blank={{ n: "", c: "", e: 1 }}
          addLabel="Adicionar item"
        />
      </section>

      <section id="descricao" className="gm-sec" data-g="notes">
        <h2 className="gm-ban">Descrição</h2>
        <div className={styles.gridAuto}>
          <Field area rows={5} label="Aparência" value={s.aparencia} onChange={(v) => set("aparencia", v)} />
          <Field area rows={5} label="Personalidade" value={s.personalidade} onChange={(v) => set("personalidade", v)} />
          <Field area rows={5} label="Histórico" value={s.historico} onChange={(v) => set("historico", v)} />
          <Field area rows={5} label="Objetivo" value={s.objetivo} onChange={(v) => set("objetivo", v)} />
        </div>
      </section>

      <NotesSection value={s.notas} onChange={(v) => set("notas", v)} />
    </>
  );
}

export const OP_SECTIONS: [string, string][] = [
  ["agente", "Agente"], ["pericias", "Perícias"], ["progressao", "Progressão"], ["ataques", "Ataques"], ["habilidades", "Habilidades e rituais"],
  ["inventario", "Inventário"], ["descricao", "Descrição"], ["notas", "Anotações"],
];
