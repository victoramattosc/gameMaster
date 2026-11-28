import React from "react";
import { OP_ATTRS, OP_SKILLS, OP_TRILHAS, OpSheet as Sheet } from "systems/op";
import { OP_CLASS_INFO, OP_ORIGIN_DATA, OP_TRILHA_DATA, opSteps } from "systems/opProgression";
import styles from "./Progression.module.scss";

/** Linha do tempo do que o agente ganhou pela origem, classe e trilha até o NEX atual. */
export function OpProgression({ sheet: s, update }: { sheet: Sheet; update(fn: (s: Sheet) => Sheet): void }) {
  const cls = OP_CLASS_INFO[s.classe];
  const origin = OP_ORIGIN_DATA[s.origem];
  const steps = opSteps(s);
  const choose = (id: string, v: string) => update((x) => ({ ...x, choices: { ...(x.choices || {}), [id]: v } }));
  const pending = steps.filter((st) => st.kind !== "auto" && st.kind !== "grade" && !s.choices?.[st.id]).length;
  const trilhas = (OP_TRILHAS[s.classe] || []).filter((t) => t !== "—");

  if (!cls) {
    return (
      <section id="progressao" className="gm-sec" data-g="skills">
        <h2 className="gm-ban">Progressão</h2>
        <div className="gm-hint">Escolha origem e classe em “Agente” para ver as habilidades que chegam com o NEX.</div>
      </section>
    );
  }

  return (
    <section id="progressao" className="gm-sec" data-g="skills">
      <div className={styles.head}>
        <h2 className="gm-ban">Progressão</h2>
        {pending > 0 && <span className="gm-badge gm-badge--wait">{pending} escolha{pending > 1 ? "s" : ""} pendente{pending > 1 ? "s" : ""}</span>}
      </div>

      <div className={styles.facts}>
        <div>
          <b>{cls.name}</b> · p. {cls.page}
          <span>Perícias: {cls.skills}</span>
          <span>Proficiências: {cls.prof}</span>
        </div>
        {origin && (
          <div>
            <b>Origem · {origin.power}</b> · p. {origin.page}
            <span>{origin.summary}</span>
            <span>
              Perícias treinadas: {origin.skills.length ? origin.skills.map((k) => OP_SKILLS.find(([x]) => x === k)?.[1].replace(/[ *+]+$/, "") || k).join(", ") : "duas à escolha do mestre"}
              {s.autoSk?.length ? " (marcadas automaticamente)" : ""}
            </span>
          </div>
        )}
      </div>

      <ol className={styles.timeline}>
        {steps.map((st) => {
          const pick = s.choices?.[st.id];
          return (
            <li key={st.id} className={`${styles.step} ${st.kind !== "auto" && st.kind !== "grade" && !pick ? styles.todo : ""}`}>
              <span className={styles.nex}>{st.nex}%</span>
              <div className={styles.body}>
                <div className={styles.title}>
                  {st.name}
                  {st.cost && <span className="gm-badge gm-badge--dark">{st.cost}</span>}
                  {st.page && <span className={styles.page}>p. {st.page}</span>}
                </div>
                <div className={styles.summary}>{st.summary}</div>

                {st.kind === "trilha" && trilhas.length > 0 && (
                  <select className="gm-in" aria-label="Escolher trilha" value="" onChange={(e) => e.target.value && update((x) => ({ ...x, trilha: e.target.value }))}>
                    <option value="">Escolher trilha…</option>
                    {trilhas.map((t) => <option key={t} value={t}>{t}{OP_TRILHA_DATA[t] ? ` — ${OP_TRILHA_DATA[t].steps[0][0]}` : ""}</option>)}
                  </select>
                )}

                {(st.kind === "power" || st.kind === "versatility") && (
                  <select className="gm-in" aria-label={`Escolha para ${st.name} (NEX ${st.nex}%)`} value={pick || ""} onChange={(e) => choose(st.id, e.target.value)}>
                    <option value="">{pick ? "Remover escolha" : "Escolher poder…"}</option>
                    {cls.powers.map((p) => (
                      <option key={p.name} value={p.name}>{p.name}{p.req ? ` (req.: ${p.req})` : ""}</option>
                    ))}
                    {st.kind === "versatility" &&
                      trilhas.filter((t) => t !== s.trilha && OP_TRILHA_DATA[t]).map((t) => (
                        <option key={t} value={`${OP_TRILHA_DATA[t].steps[0][0]} (${t})`}>1º poder de {t}: {OP_TRILHA_DATA[t].steps[0][0]}</option>
                      ))}
                  </select>
                )}

                {st.kind === "attr" && (
                  pick === "importado" ? (
                    <span className={styles.done}>Já incluído nos atributos importados</span>
                  ) : (
                    <select className="gm-in" aria-label={`Atributo para aumentar no NEX ${st.nex}%`} value={pick || ""} onChange={(e) => choose(st.id, e.target.value)}>
                      <option value="">Escolher atributo (+1)…</option>
                      {OP_ATTRS.map(([k, key, label]) => (
                        <option key={k} value={k} disabled={pick !== k && s.a[k] >= 5}>{key} · {label} ({s.a[k]})</option>
                      ))}
                    </select>
                  )
                )}
              </div>
            </li>
          );
        })}
      </ol>
      <div className="gm-hint">
        Habilidades automáticas e poderes escolhidos entram sozinhos em “Habilidades e rituais”. Aumento de atributo aplica o +1 na hora; trocar a escolha devolve o ponto.
        Rituais e poderes paranormais ainda são anotados à mão.
      </div>
    </section>
  );
}
