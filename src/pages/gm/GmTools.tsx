import React, { useState } from "react";
import type { Creature, GmData, InitiativeEntry, Mesa, MesaFile } from "lib/types";
import { generateRandomItem, generateRandomName, Gender, ITEM_CATS, ItemCategoryKey, RACES, RaceKey } from "data/generators";
import { shareFile, updateFileMeta, uploadMesaFile } from "data/api";
import { errorMessage } from "lib/supabase";
import { MapStage, MapTool } from "components/MapStage";
import { IconMap, IconPlus } from "ui/Icons";
import { uid } from "ui/bits";
import { useConfirm } from "ui/Confirm";
import { useUploadGuard } from "ui/Toast";
import styles from "./GmPanel.module.scss";

type Update = (fn: (d: GmData) => GmData) => void;

const TAG_COLOR: Record<InitiativeEntry["kind"], string> = { Jogador: "#7a4fc0", Criatura: "#b23a2c", NPC: "#8a6a2e" };

export function InitiativePanel({ data, update, partyNames }: { data: GmData; update: Update; partyNames: string[] }) {
  const [draft, setDraft] = useState("");
  const [kind, setKind] = useState<InitiativeEntry["kind"]>("Criatura");
  const confirm = useConfirm();
  const list = data.initiative || [];
  const turn = Math.min(data.turn || 0, Math.max(0, list.length - 1));
  const round = data.round || 1;

  function add(e: React.FormEvent) {
    e.preventDefault();
    const m = draft.trim().match(/^(.*?)[\s,;]+(-?\d+)$/);
    const name = (m ? m[1] : draft).trim();
    if (!name) return;
    const value = m ? Number(m[2]) : 1 + Math.floor(Math.random() * 20);
    const k = partyNames.includes(name) ? "Jogador" : kind;
    update((d) => ({ ...d, initiative: sortIni([...(d.initiative || []), { id: uid(), name, value, kind: k }]) }));
    setDraft("");
  }

  return (
    <section aria-labelledby="ini" className={`gm-panel ${styles.flexCol}`}>
      <div className={styles.panelHead}>
        <h2 id="ini" className="gm-h">Iniciativa</h2>
        <span style={{ fontSize: 14, color: "#c9b48a", fontWeight: 700 }}>Rodada {round}</span>
      </div>
      <ol className={styles.iniList}>
        {list.length === 0 && <li className={styles.empty}>Adicione combatentes abaixo. Sem número, rolamos 1d20.</li>}
        {list.map((r, i) => (
          <li key={r.id} className={`${styles.iniRow} ${i === turn ? styles.iniOn : ""}`} aria-current={i === turn ? "true" : undefined}>
            <input
              className={`gm-num ${styles.iniVal}`}
              aria-label={`Iniciativa de ${r.name}`}
              value={r.value}
              inputMode="numeric"
              onChange={(e) => update((d) => ({ ...d, initiative: (d.initiative || []).map((x) => (x.id === r.id ? { ...x, value: Number(e.target.value) || 0 } : x)) }))}
              onBlur={() => update((d) => ({ ...d, initiative: sortIni(d.initiative || []) }))}
            />
            <span style={{ flex: 1, fontWeight: 700, minWidth: 0 }}>{r.name}</span>
            <span className="gm-badge" style={{ background: TAG_COLOR[r.kind], color: "#fff7e8" }}>{r.kind}</span>
            <button type="button" className={`gm-btn ${styles.mini}`} aria-label={`Remover ${r.name}`} onClick={() => update((d) => ({ ...d, initiative: (d.initiative || []).filter((x) => x.id !== r.id) }))}>×</button>
          </li>
        ))}
      </ol>
      <form onSubmit={add} className={styles.inlineForm}>
        <input className="gm-in gm-in--dark" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Nome e valor (ex.: Zumbi 12)" list="gm-party-names" style={{ flex: 1 }} aria-label="Nome e valor" />
        <datalist id="gm-party-names">{partyNames.map((n) => <option key={n} value={n} />)}</datalist>
        <select className="gm-in gm-in--dark" value={kind} onChange={(e) => setKind(e.target.value as InitiativeEntry["kind"])} aria-label="Tipo" style={{ width: 110 }}>
          <option>Criatura</option><option>NPC</option><option>Jogador</option>
        </select>
      </form>
      <div style={{ display: "flex", gap: 8 }}>
        <button
          type="button"
          className="gm-btn gm-btn--gold"
          style={{ flex: 1 }}
          disabled={!list.length}
          onClick={() => update((d) => { const t = (d.turn || 0) + 1; return t >= (d.initiative || []).length ? { ...d, turn: 0, round: (d.round || 1) + 1 } : { ...d, turn: t }; })}
        >
          Próximo turno
        </button>
        <button type="button" className="gm-btn gm-btn--ghost-dark" onClick={async () => (await confirm({ title: "Limpar a iniciativa?", message: "Todos saem da ordem e a rodada volta para 1.", confirmLabel: "Limpar" })) && update((d) => ({ ...d, initiative: [], turn: 0, round: 1 }))}>
          Limpar
        </button>
      </div>
    </section>
  );
}

const sortIni = (l: InitiativeEntry[]) => [...l].sort((a, b) => b.value - a.value);

const DICE = [4, 6, 8, 10, 12, 20, 100];
type DiceMode = "sum" | "max" | "min";
const MODE_LABEL: Record<DiceMode, string> = { sum: "Somar", max: "Maior", min: "Menor" };

export function DicePanel({ animate }: { animate: boolean }) {
  const [mode, setMode] = useState<DiceMode>("sum");
  const [qty, setQty] = useState(1);
  const [mod, setMod] = useState(0);
  const [last, setLast] = useState<{ f: number; rolls: number[]; total: number; qty: number; mod: number; mode: DiceMode; k: number } | null>(null);

  function roll(f: number) {
    const rolls = Array.from({ length: qty }, () => 1 + Math.floor(Math.random() * f));
    const base = mode === "sum" ? rolls.reduce((a, b) => a + b, 0) : mode === "max" ? Math.max(...rolls) : Math.min(...rolls);
    setLast({ f, rolls, total: base + mod, qty, mod, mode, k: Date.now() });
  }

  return (
    <section aria-labelledby="dados" className={`gm-panel ${styles.flexCol}`}>
      <div className={styles.panelHead}>
        <h2 id="dados" className="gm-h">Dados</h2>
        <div className={styles.modes}>
          {(Object.keys(MODE_LABEL) as DiceMode[]).map((m) => (
            <button key={m} type="button" className={`gm-btn ${mode === m ? styles.modeOn : ""}`} aria-pressed={mode === m} onClick={() => setMode(m)}>{MODE_LABEL[m]}</button>
          ))}
        </div>
      </div>
      <div className={styles.diceGrid}>
        {DICE.map((f) => (
          <button key={f} type="button" className={`gm-btn ${styles.die} ${last?.f === f ? styles.dieOn : ""}`} onClick={() => roll(f)} aria-label={`Rolar ${qty}d${f}`}>
            d{f}
          </button>
        ))}
      </div>
      <div className={styles.diceOpts}>
        <div className={styles.opt}>
          <span>Quantidade</span>
          <button type="button" className="gm-btn gm-ib gm-ib--sm" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="Menos dados">−</button>
          <b className="gm-num">{qty}</b>
          <button type="button" className="gm-btn gm-ib gm-ib--sm" onClick={() => setQty(Math.min(30, qty + 1))} aria-label="Mais dados">+</button>
        </div>
        <div className={styles.opt}>
          <span>Bônus</span>
          <button type="button" className="gm-btn gm-ib gm-ib--sm" onClick={() => setMod(mod - 1)} aria-label="Diminuir bônus">−</button>
          <b className="gm-num">{(mod >= 0 ? "+" : "") + mod}</b>
          <button type="button" className="gm-btn gm-ib gm-ib--sm" onClick={() => setMod(mod + 1)} aria-label="Aumentar bônus">+</button>
        </div>
      </div>
      <div className={styles.result} role="status" aria-live="polite">
        <span key={last?.k} className={`gm-num ${styles.total}`} style={animate && last ? { animation: "gm-spin .5s ease-out" } : undefined}>
          {last ? last.total : "—"}
        </span>
        <div style={{ minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 16 }}>
            {last ? `${last.qty}d${last.f}${last.mod ? (last.mod > 0 ? " + " : " − ") + Math.abs(last.mod) : ""} · ${MODE_LABEL[last.mode]}` : "Escolha um dado para rolar"}
          </div>
          <div style={{ fontSize: 14, color: "#5a4430" }}>{last ? "Saíram: " + last.rolls.join(", ") : "Quantidade e bônus se aplicam à próxima rolagem."}</div>
        </div>
      </div>
    </section>
  );
}

export function CreaturesPanel({ data, update }: { data: GmData; update: Update }) {
  const [name, setName] = useState("");
  const [hp, setHp] = useState("");
  const [step, setStep] = useState(5);
  const list = data.creatures || [];
  const set = (id: string, fn: (c: Creature) => Creature) => update((d) => ({ ...d, creatures: (d.creatures || []).map((c) => (c.id === id ? fn(c) : c)) }));

  function add(e: React.FormEvent) {
    e.preventDefault();
    const max = Math.max(1, Number(hp) || 10);
    if (!name.trim()) return;
    update((d) => ({ ...d, creatures: [...(d.creatures || []), { id: uid(), name: name.trim(), hp: max, max }] }));
    setName("");
    setHp("");
  }

  return (
    <section aria-labelledby="cri" className={`gm-panel ${styles.flexCol}`}>
      <div className={styles.panelHead}>
        <h2 id="cri" className="gm-h">Criaturas e NPCs</h2>
        <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 13, color: "#c9b48a", fontWeight: 700 }}>
          Passo
          <input className="gm-in gm-in--dark" type="number" min={1} value={step} onChange={(e) => setStep(Math.max(1, Number(e.target.value) || 1))} style={{ width: 60, height: 34 }} />
        </label>
      </div>
      {list.length === 0 && <div className={styles.empty}>Nenhuma criatura em cena.</div>}
      {list.map((c) => (
        <div key={c.id} className={styles.creature}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, gap: 8 }}>
              <span style={{ overflow: "hidden", textOverflow: "ellipsis" }}>{c.name}</span>
              <span className="gm-num">{c.hp}/{c.max}</span>
            </div>
            <div className="gm-bar gm-bar--dark" style={{ height: 8, marginTop: 6 }}>
              <span style={{ width: Math.round((100 * c.hp) / c.max) + "%", background: "#c2412d" }} />
            </div>
          </div>
          <button type="button" className="gm-btn gm-ib" style={{ width: 44, color: "#e8a093" }} onClick={() => set(c.id, (x) => ({ ...x, hp: Math.max(0, x.hp - step) }))} aria-label={`Causar ${step} de dano em ${c.name}`}>−{step}</button>
          <button type="button" className="gm-btn gm-ib" style={{ width: 44, color: "#a9d69a" }} onClick={() => set(c.id, (x) => ({ ...x, hp: Math.min(x.max, x.hp + step) }))} aria-label={`Curar ${step} em ${c.name}`}>+{step}</button>
          <button type="button" className={`gm-btn ${styles.mini}`} onClick={() => update((d) => ({ ...d, creatures: (d.creatures || []).filter((x) => x.id !== c.id) }))} aria-label={`Remover ${c.name}`}>×</button>
        </div>
      ))}
      <form onSubmit={add} className={styles.inlineForm} style={{ marginTop: "auto" }}>
        <input className="gm-in gm-in--dark" placeholder="Nome" value={name} onChange={(e) => setName(e.target.value)} style={{ flex: 2 }} aria-label="Nome da criatura" />
        <input className="gm-in gm-in--dark" placeholder="Vida" inputMode="numeric" value={hp} onChange={(e) => setHp(e.target.value)} style={{ flex: 1, width: 70 }} aria-label="Vida" />
        <button type="submit" className="gm-btn gm-ib" aria-label="Adicionar criatura" style={{ background: "#e0a040", color: "#2b1f16", border: "none" }}><IconPlus /></button>
      </form>
    </section>
  );
}

export function MorePanel({
  data,
  update,
  mesa,
  userId,
  files,
  partyPieces,
}: {
  data: GmData;
  update: Update;
  mesa: Mesa;
  userId: string;
  files: MesaFile[];
  partyPieces: { label: string; color: string }[];
}) {
  const [tab, setTab] = useState<"notes" | "gen" | "map">("notes");
  const [race, setRace] = useState<RaceKey>("humano");
  const [gender, setGender] = useState<Gender>("m");
  const [cat, setCat] = useState<ItemCategoryKey>("armas");
  const [gen, setGen] = useState<string[]>([]);

  return (
    <section aria-label="Mais ferramentas" className={`gm-panel ${styles.flexCol}`}>
      <div className={styles.tabs} role="tablist">
        {([["notes", "Anotações"], ["gen", "Geradores"], ["map", "Mapa"]] as const).map(([k, l]) => (
          <button key={k} type="button" role="tab" aria-selected={tab === k} className={`gm-btn gm-chip ${tab === k ? "is-on" : ""}`} onClick={() => setTab(k)}>{l}</button>
        ))}
      </div>
      {tab === "notes" && (
        <>
          <textarea
            className="gm-in"
            aria-label="Anotações do mestre"
            value={data.notes || ""}
            onChange={(e) => update((d) => ({ ...d, notes: e.target.value }))}
            style={{ flex: 1, minHeight: 200, fontSize: 16, lineHeight: 1.5, background: "#f1e6cc", borderColor: "#b49a6c" }}
            placeholder="Pistas, ganchos, nomes de NPCs…"
          />
          <div style={{ fontSize: 13, color: "#c9b48a" }}>Só você vê estas anotações. Salvas automaticamente.</div>
        </>
      )}
      {tab === "gen" && (
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          <div className={styles.genOut} aria-live="polite">{gen[0] || "—"}</div>
          <div className={styles.genRow}>
            <select className="gm-in gm-in--dark" value={race} onChange={(e) => setRace(e.target.value as RaceKey)} aria-label="Raça">
              {(Object.keys(RACES) as RaceKey[]).map((k) => <option key={k} value={k}>{RACES[k].label}</option>)}
            </select>
            <select className="gm-in gm-in--dark" value={gender} onChange={(e) => setGender(e.target.value as Gender)} aria-label="Gênero">
              <option value="m">Masculino</option><option value="f">Feminino</option>
            </select>
            <button type="button" className="gm-btn gm-btn--gold" onClick={() => setGen([generateRandomName(race, gender), ...gen].slice(0, 8))}>Gerar nome</button>
          </div>
          <div className={styles.genRow}>
            <select className="gm-in gm-in--dark" value={cat} onChange={(e) => setCat(e.target.value as ItemCategoryKey)} aria-label="Categoria de item">
              {(Object.keys(ITEM_CATS) as ItemCategoryKey[]).map((k) => <option key={k} value={k}>{ITEM_CATS[k].label}</option>)}
            </select>
            <button type="button" className="gm-btn gm-btn--tool" onClick={() => setGen([generateRandomItem(cat), ...gen].slice(0, 8))}>Gerar item</button>
          </div>
          {gen.length > 1 && (
            <ul style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {gen.slice(1).map((g, i) => <li key={i} className="gm-badge" style={{ background: "#241b16", color: "#d9c8a6", border: "1px solid #3a2c22" }}>{g}</li>)}
            </ul>
          )}
        </div>
      )}
      {tab === "map" && <GmMap mesa={mesa} userId={userId} files={files} partyPieces={partyPieces} />}
    </section>
  );
}

function GmMap({ mesa, userId, files, partyPieces }: { mesa: Mesa; userId: string; files: MesaFile[]; partyPieces: { label: string; color: string }[] }) {
  const maps = files.filter((f) => f.kind === "map");
  const [selId, setSelId] = useState<string | null>(null);
  const sel = maps.find((m) => m.id === selId) || maps[maps.length - 1];
  const [tool, setTool] = useState<MapTool>({ kind: "move" });
  const [pieceIdx, setPieceIdx] = useState(0);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const guard = useUploadGuard();
  const pieces = [...partyPieces.map((p) => ({ ...p, pieceKind: "agent" as const })), { label: "Marcador", color: "#2b1f16", pieceKind: "marker" as const }];

  async function upload(f: File | undefined) {
    if (!f) return;
    setBusy(true);
    try {
      const created = await uploadMesaFile(mesa.id, userId, f, "map");
      setSelId(created.id);
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  if (!sel) {
    return (
      <label className={styles.mapDrop}>
        <IconMap size={36} color="#e0a040" />
        <span style={{ fontWeight: 800, color: "#f1e6cc" }}>{busy ? "Enviando…" : "Envie a imagem do mapa"}</span>
        <span style={{ fontSize: 14 }}>Depois coloque peças de jogadores e criaturas e cubra o que ainda não foi revelado.</span>
        <input type="file" accept="image/*" className="gm-sr" onChange={(e) => upload(guard(e.target)[0])} />
        {err && <span className="gm-error">{err}</span>}
      </label>
    );
  }

  const setMeta = (meta: MesaFile["meta"]) => updateFileMeta(sel.id, meta).catch((e) => setErr(errorMessage(e)));
  const piece = pieces[Math.min(pieceIdx, pieces.length - 1)];

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <div className={styles.genRow}>
        <select className="gm-in gm-in--dark" value={sel.id} onChange={(e) => setSelId(e.target.value)} aria-label="Mapa" style={{ flex: 1 }}>
          {maps.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <button type="button" className={`gm-btn gm-btn--tool ${sel.shared ? "" : ""}`} onClick={() => shareFile(sel.id, !sel.shared).catch((e) => setErr(errorMessage(e)))}>
          {sel.shared ? "Visível ao grupo ✓" : "Compartilhar com o grupo"}
        </button>
        <label className="gm-btn gm-btn--ghost-dark" style={{ cursor: "pointer" }}>
          + Mapa
          <input type="file" accept="image/*" className="gm-sr" onChange={(e) => upload(guard(e.target)[0])} />
        </label>
      </div>
      <div className={styles.mapTools} role="toolbar" aria-label="Ferramentas do mapa">
        <button type="button" className={`gm-btn gm-chip ${tool.kind === "move" ? "is-on" : ""}`} onClick={() => setTool({ kind: "move" })}>Mover</button>
        <button type="button" className={`gm-btn gm-chip ${tool.kind === "piece" ? "is-on" : ""}`} onClick={() => setTool({ kind: "piece", ...piece })}>Colocar peça</button>
        {tool.kind === "piece" && (
          <select
            className="gm-in gm-in--dark"
            style={{ height: 40, width: 160 }}
            value={pieceIdx}
            aria-label="Peça"
            onChange={(e) => {
              const i = Number(e.target.value);
              setPieceIdx(i);
              setTool({ kind: "piece", ...pieces[i] });
            }}
          >
            {pieces.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
          </select>
        )}
        <button type="button" className={`gm-btn gm-chip ${tool.kind === "fog" ? "is-on" : ""}`} onClick={() => setTool({ kind: "fog" })}>Cobrir área</button>
        <button type="button" className={`gm-btn gm-chip ${tool.kind === "erase" ? "is-on" : ""}`} onClick={() => setTool({ kind: "erase" })}>Remover / revelar</button>
      </div>
      <MapStage file={sel} tool={tool} onChange={setMeta} />
      {err && <div className="gm-error gm-error--dark">{err}</div>}
    </div>
  );
}
