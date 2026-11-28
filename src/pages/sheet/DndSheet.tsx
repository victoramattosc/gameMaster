import React from "react";
import { applyDndAutomation } from "systems/dndProgression";
import { DndProgression } from "./DndProgression";
import { d20, DND_AB, DND_COINS, DND_SK, DND_SPELL_LEVELS, dndMod, dndProf, dndSkillBonus, DndAb, DndSheet as Sheet, DndText } from "systems/dnd";
import { IconD20 } from "ui/Icons";
import { Bar, signed } from "ui/bits";
import { ConditionsLine, EditTable, Field, NotesSection, NumIn, Portrait, SheetProps } from "./common";
import styles from "./Sheet.module.scss";

export function DndSheet({ sheet: s, update: rawUpdate, roll }: SheetProps<Sheet>) {
  // Toda mudança passa pela automação (classe, nível, antecedente e aumentos).
  const update = (fn: (x: Sheet) => Sheet) => rawUpdate((prev) => applyDndAutomation(prev, fn(prev)));
  const t = (k: DndText) => s.t[k] || "";
  const setT = (k: DndText) => (v: string) => update((x) => ({ ...x, t: { ...x.t, [k]: v } }));
  const set = <K extends keyof Sheet>(k: K, v: Sheet[K]) => update((x) => ({ ...x, [k]: v }));
  const prof = dndProf(s);
  const smod = dndMod(s, s.spellAb);
  const passive = 10 + dndSkillBonus(s, "percepcao", "sab");
  const toggleArr = (k: "ok" | "fail", i: number) => update((x) => ({ ...x, [k]: x[k].map((v, j) => (j === i ? !v : v)) }));

  return (
    <>
      <div className={styles.row} data-g="status">
      <section id="personagem" className="gm-sec" style={{ flex: "3 1 520px" }} data-g="status">
        <h2 className="gm-ban">Personagem</h2>
        <ConditionsLine conditions={s.conditions} />
        <div style={{ display: "flex", flexWrap: "wrap", gap: 20, alignItems: "flex-start" }}>
          <Portrait url={s.portrait} color="#b23a2c" onChange={(u) => set("portrait", u)} />
          <div style={{ flex: "1 1 280px", minWidth: 0, display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: 12 }}>
            <div style={{ gridColumn: "1 / -1" }}><Field label="Nome do personagem" big value={t("nome")} onChange={setT("nome")} /></div>
            <Field label="Classe" value={t("classe")} onChange={setT("classe")} />
            <label className="gm-lbl">Nível<NumIn value={s.level} min={1} max={20} onChange={(v) => set("level", v)} /></label>
            <Field label="Antecedente" value={t("antecedente")} onChange={setT("antecedente")} />
            <Field label="Nome do jogador" value={t("jogador")} onChange={setT("jogador")} />
            <Field label="Raça" value={t("raca")} onChange={setT("raca")} />
            <Field label="Tendência" value={t("tendencia")} onChange={setT("tendencia")} />
            <Field label="Experiência (XP)" value={t("xp")} onChange={setT("xp")} />
          </div>
        </div>
      </section>

      <section id="vida" className="gm-sec" style={{ flex: "2 1 380px" }} data-g="status">
        <h2 className="gm-ban">Vida e defesa</h2>
        <div className={styles.vitals}>
          <label className={`${styles.vital} ${styles.vitalDark}`} title={`Sem armadura (bárbaro/monge): 10 + DES + CON = ${10 + dndMod(s, "des") + dndMod(s, "con")}`}>
            <NumIn className="" label="Classe de armadura" value={s.ca} onChange={(v) => set("ca", v)} />
            <span>CA</span>
          </label>
          <button type="button" className={`gm-btn ${styles.vital}`} onClick={() => roll(d20("Iniciativa", dndMod(s, "des")))} aria-label="Rolar iniciativa">
            <b>{signed(dndMod(s, "des"))}</b>
            <span>Iniciativa</span>
          </button>
          <label className={styles.vital}>
            <input aria-label="Deslocamento" value={t("deslocamento")} onChange={(e) => setT("deslocamento")(e.target.value)} style={{ fontSize: 20 }} />
            <span>Deslocamento</span>
          </label>
          <label className={styles.vital}>
            <input aria-label="Dados de vida" value={t("dvTotal")} onChange={(e) => setT("dvTotal")(e.target.value)} placeholder="1d12" style={{ fontSize: 20 }} />
            <span>Dados de vida</span>
          </label>
        </div>

        <div className={styles.resHead}>
          <h2>Pontos de Vida</h2>
          <span className={styles.resChip} style={{ background: "#c2412d" }}>PV{s.temp ? ` +${s.temp} temp` : ""}</span>
        </div>
        <div className={styles.resCtl}>
          <button type="button" className="gm-btn" aria-label="Tomar 1 de dano" onClick={() => update((x) => (x.temp > 0 ? { ...x, temp: x.temp - 1 } : { ...x, hp: Math.max(0, x.hp - 1) }))}>−</button>
          <div className={styles.resVal}>
            <NumIn className="" label="PV atuais" value={s.hp} min={0} onChange={(v) => set("hp", v)} />
            <span> / {s.hpMax}</span>
          </div>
          <button type="button" className="gm-btn" aria-label="Curar 1" onClick={() => update((x) => ({ ...x, hp: Math.min(x.hpMax, x.hp + 1) }))}>+</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
          <Bar cur={s.hp} max={s.hpMax} color="#c2412d" />
          {s.temp > 0 && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12, fontWeight: 800, color: "#3f5f8a" }}>
              <span>+{s.temp} temp</span>
              <Bar cur={s.temp} max={s.hpMax} color="#3f7cc4" />
            </div>
          )}
        </div>
        <div className={styles.grid3}>
          <label className="gm-lbl">PV máximo<NumIn value={s.hpMax} min={1} onChange={(v) => set("hpMax", v)} /></label>
          <label className="gm-lbl">Temporários<NumIn value={s.temp} min={0} onChange={(v) => set("temp", v)} /></label>
          <label className="gm-lbl">DV restantes<input className="gm-in" value={t("dv")} onChange={(e) => setT("dv")(e.target.value)} /></label>
        </div>

        <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px 16px", paddingTop: 10, borderTop: "1px dashed #b49a6c" }}>
          <span className="gm-lbl" style={{ flexBasis: "100%" }}>Testes contra a morte</span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <b style={{ fontSize: 14 }}>Sucessos</b>
            <span className={styles.dots} style={{ color: "#4f8f3c" }}>
              {s.ok.map((v, i) => <button key={i} type="button" className="gm-btn" aria-pressed={v} aria-label={`Sucesso ${i + 1}`} onClick={() => toggleArr("ok", i)} />)}
            </span>
          </span>
          <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <b style={{ fontSize: 14 }}>Falhas</b>
            <span className={styles.dots} style={{ color: "#b23a2c" }}>
              {s.fail.map((v, i) => <button key={i} type="button" className="gm-btn" aria-pressed={v} aria-label={`Falha ${i + 1}`} onClick={() => toggleArr("fail", i)} />)}
            </span>
          </span>
          <button type="button" className="gm-btn gm-btn--ghost" style={{ height: 36 }} onClick={() => roll(d20("Teste contra a morte", 0))}>Rolar teste</button>
        </div>
      </section>
      </div>

      <div className={styles.row}>
        <section className="gm-sec" style={{ flex: "1 1 320px" }} data-g="status">
          <h2 className="gm-ban">Atributos</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(140px, 1fr))", gap: 10 }}>
            {DND_AB.map(([k, label]) => (
              <div key={k} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, padding: 10, borderRadius: 12, background: "#e9dcbd" }}>
                <span className="gm-eyebrow" style={{ color: "#5a4430", fontSize: 11 }}>{label}</span>
                <button type="button" className="gm-btn" onClick={() => roll(d20(`Teste de ${label.toLowerCase()}`, dndMod(s, k)))} aria-label={`Rolar teste de ${label.toLowerCase()}`} style={{ width: 64, height: 54, borderRadius: 12, background: "#2b1f16", color: "#f1e6cc", fontFamily: "Alegreya, serif", fontSize: 26 }}>
                  {signed(dndMod(s, k))}
                </button>
                <NumIn label={`Valor de ${label}`} value={s.sc[k]} min={1} max={30} onChange={(v) => update((x) => ({ ...x, sc: { ...x.sc, [k]: v } }))} style={{ width: 64, height: 34, textAlign: "center" }} />
              </div>
            ))}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
            <label className={styles.carga} style={{ cursor: "pointer" }}>
              <input type="checkbox" checked={s.insp} onChange={() => set("insp", !s.insp)} style={{ width: 20, height: 20, accentColor: "#b23a2c" }} />
              <b>Inspiração</b>
            </label>
            <div className={styles.carga}><b>Proficiência</b><span className="gm-num" style={{ fontSize: 22 }}>+{prof}</span></div>
            <div className={styles.carga}><b>Percepção passiva</b><span className="gm-num" style={{ fontSize: 22 }}>{passive}</span></div>
          </div>
        </section>

        <section className="gm-sec" style={{ flex: "2 1 460px" }} data-g="skills">
          <div className={styles.headRow}>
            <h2 className="gm-ban">Salvaguardas e perícias</h2>
            <span className="gm-hint">Marque a bolinha para proficiência. Toque no dado para rolar.</span>
          </div>
          <div className="gm-eyebrow" style={{ color: "#5a4430" }}>Salvaguardas</div>
          <div className={styles.dndSkills}>
            {DND_AB.map(([k, label]) => {
              const b = dndMod(s, k) + (s.saveProf[k] ? prof : 0);
              const nm = label.charAt(0) + label.slice(1).toLowerCase();
              return (
                <div key={k} className={styles.dndSkill}>
                  <button type="button" className={`gm-btn ${styles.profDot}`} aria-pressed={!!s.saveProf[k]} aria-label={`Proficiência em salvaguarda de ${nm}`} onClick={() => update((x) => ({ ...x, saveProf: { ...x.saveProf, [k]: !x.saveProf[k] } }))} />
                  <span>{nm}</span>
                  <span className={styles.attrTag} style={{ ["--tag-bg" as string]: "#f3d9d3", ["--tag-ink" as string]: "#7d2219" }}>{k.toUpperCase()}</span>
                  <span className={styles.bonus}>{signed(b)}</span>
                  <button type="button" className={`gm-btn ${styles.rollBtn}`} aria-label={`Rolar salvaguarda de ${nm}`} onClick={() => roll(d20(`Salvaguarda de ${nm}`, b))}><IconD20 size={18} /></button>
                </div>
              );
            })}
          </div>
          <div className="gm-eyebrow" style={{ color: "#5a4430", marginTop: 8 }}>Perícias</div>
          <div className={styles.dndSkills}>
            {DND_SK.map(([k, label, at]) => {
              const b = dndSkillBonus(s, k, at);
              return (
                <div key={k} className={styles.dndSkill}>
                  <button type="button" className={`gm-btn ${styles.profDot}`} aria-pressed={!!s.skillProf[k]} aria-label={`Proficiência em ${label}`} onClick={() => update((x) => ({ ...x, skillProf: { ...x.skillProf, [k]: !x.skillProf[k] } }))} />
                  <span>{label}</span>
                  <span className={styles.attrTag} style={{ ["--tag-bg" as string]: "#f3d9d3", ["--tag-ink" as string]: "#7d2219" }}>{at.toUpperCase()}</span>
                  <span className={styles.bonus}>{signed(b)}</span>
                  <button type="button" className={`gm-btn ${styles.rollBtn}`} aria-label={`Rolar ${label}`} onClick={() => roll(d20(label, b))}><IconD20 size={18} /></button>
                </div>
              );
            })}
          </div>
          <Field area rows={3} label="Outras proficiências e idiomas" value={t("proficiencias")} onChange={setT("proficiencias")} />
        </section>
      </div>

      <DndProgression sheet={s} update={update} />

      <section id="combate" className="gm-sec" data-g="skills">
        <h2 className="gm-ban">Ataques e conjuração</h2>

        <EditTable
          cols={[{ key: "n", label: "Nome", width: "2fr" }, { key: "b", label: "Bônus", width: "90px" }, { key: "d", label: "Dano / tipo", width: "2fr" }]}
          rows={s.weapons}
          onChange={(rows) => set("weapons", rows)}
          blank={{ n: "", b: "", d: "" }}
          addLabel="Adicionar ataque"
        />
        <Field area rows={3} label="Notas de ataques e conjuração" value={t("ataquesTexto")} onChange={setT("ataquesTexto")} />
      </section>

      <section id="equipamento" className="gm-sec" data-g="items">
        <h2 className="gm-ban">Equipamento e tesouro</h2>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 12 }}>
          {DND_COINS.map(([k, name, col]) => (
            <label key={k} style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span className={styles.coin} style={{ background: col }} title={name}>{k}</span>
              <NumIn label={`Moedas de ${name.toLowerCase()}`} value={s.coins[k] || 0} min={0} onChange={(v) => update((x) => ({ ...x, coins: { ...x.coins, [k]: v } }))} style={{ width: 80 }} />
            </label>
          ))}
        </div>
        <div className={styles.grid2}>
          <Field area rows={6} label="Equipamento" value={t("equipamento")} onChange={setT("equipamento")} />
          <Field area rows={6} label="Tesouro" value={t("tesouro")} onChange={setT("tesouro")} />
        </div>
      </section>

      <section id="tracos" className="gm-sec" data-g="notes">
        <h2 className="gm-ban">Traços e história</h2>
        <div className={styles.gridAuto}>
          <Field area rows={3} label="Traços de personalidade" value={t("tracos")} onChange={setT("tracos")} />
          <Field area rows={3} label="Ideais" value={t("ideais")} onChange={setT("ideais")} />
          <Field area rows={3} label="Vínculos" value={t("vinculos")} onChange={setT("vinculos")} />
          <Field area rows={3} label="Defeitos" value={t("defeitos")} onChange={setT("defeitos")} />
        </div>
        <Field area rows={4} label="Características e talentos" value={t("caracteristicas")} onChange={setT("caracteristicas")} />
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(110px, 1fr))", gap: 10 }}>
          {(["idade", "altura", "peso", "olhos", "pele", "cabelo"] as DndText[]).map((k) => (
            <Field key={k} label={k.charAt(0).toUpperCase() + k.slice(1)} value={t(k)} onChange={setT(k)} />
          ))}
        </div>
        <div className={styles.grid2}>
          <Field area rows={4} label="Aliados e organizações" value={t("aliados")} onChange={setT("aliados")} />
          <Field label="Nome da facção" value={t("faccao")} onChange={setT("faccao")} />
        </div>
        <Field area rows={5} label="História do personagem" value={t("historia")} onChange={setT("historia")} />
        <Field area rows={3} label="Características e talentos adicionais" value={t("extras")} onChange={setT("extras")} />
      </section>

      <section id="magias" className="gm-sec" data-g="skills">
        <h2 className="gm-ban">Magias</h2>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 12 }}>
          <Field label="Classe conjuradora" value={t("classeMagia")} onChange={setT("classeMagia")} placeholder="Ex.: Clérigo" />
          <label className="gm-lbl">
            Atributo de conjuração
            <select className="gm-in" value={s.spellAb} onChange={(e) => set("spellAb", e.target.value as DndAb)}>
              {DND_AB.map(([k, l]) => <option key={k} value={k}>{l.charAt(0) + l.slice(1).toLowerCase()}</option>)}
            </select>
          </label>
          <div className="gm-lbl">CD de resistência<span className={styles.calcDark}>{8 + prof + smod}</span><span className="gm-hint">8 + prof. + mod.</span></div>
          <div className="gm-lbl">Bônus de ataque<span className={styles.calcDark}>{signed(prof + smod)}</span><span className="gm-hint">prof. + mod.</span></div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 12 }}>
          {DND_SPELL_LEVELS.map((title, L) => (
            <div key={L} style={{ padding: 12, borderRadius: 12, background: "#e9dcbd", display: "flex", flexDirection: "column", gap: 8 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
                <b className="gm-display" style={{ fontSize: 19, flex: 1 }}>{title}</b>
                {L > 0 && (
                  <label className="gm-lbl" style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    Espaços<NumIn value={s.slots[L]} min={0} max={9} onChange={(v) => update((x) => ({ ...x, slots: x.slots.map((y, j) => (j === L ? v : y)) }))} style={{ width: 50, height: 32 }} />
                  </label>
                )}
              </div>
              {L > 0 && s.slots[L] > 0 && (
                <div style={{ display: "flex", flexWrap: "wrap" }}>
                  {Array.from({ length: s.slots[L] }, (_, i) => (
                    <button
                      key={i}
                      type="button"
                      className={`gm-btn ${styles.pip}`}
                      aria-pressed={s.used[L] > i}
                      aria-label={`Espaço ${i + 1} de ${title} ${s.used[L] > i ? "gasto" : "livre"}`}
                      onClick={() => update((x) => ({ ...x, used: x.used.map((u, j) => (j === L ? (u > i ? i : i + 1) : u)) }))}
                    />
                  ))}
                </div>
              )}
              {s.spells[L].map((sp, i) => (
                <div key={i} style={{ display: "flex", gap: 6, alignItems: "center" }}>
                  {L > 0 && (
                    <input type="checkbox" aria-label="Preparada" checked={sp.prep} onChange={() => update((x) => ({ ...x, spells: x.spells.map((lv, j) => (j === L ? lv.map((y, k) => (k === i ? { ...y, prep: !y.prep } : y)) : lv)) }))} style={{ width: 18, height: 18, accentColor: "#b23a2c" }} />
                  )}
                  <input className="gm-in" style={{ flex: 1, height: 36 }} aria-label="Magia" value={sp.name} onChange={(e) => update((x) => ({ ...x, spells: x.spells.map((lv, j) => (j === L ? lv.map((y, k) => (k === i ? { ...y, name: e.target.value } : y)) : lv)) }))} />
                  <button type="button" className="gm-btn gm-del" style={{ height: 36, minWidth: 36 }} aria-label="Remover magia" onClick={() => update((x) => ({ ...x, spells: x.spells.map((lv, j) => (j === L ? lv.filter((_, k) => k !== i) : lv)) }))}>✕</button>
                </div>
              ))}
              <button type="button" className={`gm-btn ${styles.addBtn}`} style={{ height: 34 }} onClick={() => update((x) => ({ ...x, spells: x.spells.map((lv, j) => (j === L ? [...lv, { name: "", prep: false }] : lv)) }))}>+ magia</button>
            </div>
          ))}
        </div>
      </section>

      <NotesSection value={t("notas")} onChange={setT("notas")} />
    </>
  );
}

export const DND_SECTIONS: [string, string][] = [
  ["personagem", "Personagem"], ["vida", "Vida e defesa"], ["progressao", "Progressão"], ["combate", "Ataques"], ["equipamento", "Equipamento"], ["tracos", "Traços e história"], ["magias", "Magias"], ["notas", "Anotações"],
];
