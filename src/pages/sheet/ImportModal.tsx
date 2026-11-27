import React, { useEffect, useState } from "react";
import { myOtherCharacters, OtherCharacter } from "data/api";
import { errorMessage } from "lib/supabase";
import type { Mesa } from "lib/types";
import { AnySheet, SYSTEMS } from "systems";
import { DND_AB, DND_COINS, DND_SK, dndDefault, DndSheet } from "systems/dnd";
import { OP_ATTRS, OP_ORIGENS, opDefault, OpSheet } from "systems/op";
import { CardShell } from "ui/Popover";
import { IconCheck, IconExport, IconFile, IconImport } from "ui/Icons";
import styles from "./Import.module.scss";

type Step = "choose" | "review" | "done";

export function ImportModal({
  mesa,
  current,
  playerName,
  onImport,
  onClose,
}: {
  mesa: Mesa;
  current: AnySheet;
  playerName: string;
  onImport(sheet: unknown): void;
  onClose(): void;
}) {
  const sys = SYSTEMS[mesa.system];
  const [step, setStep] = useState<Step>("choose");
  const [source, setSource] = useState("");
  const [parsed, setParsed] = useState<unknown>(null);
  const [found, setFound] = useState<string[]>([]);
  const [others, setOthers] = useState<OtherCharacter[] | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    myOtherCharacters(mesa.system, mesa.id).then(setOthers).catch(() => setOthers([]));
  }, [mesa.system, mesa.id]);

  async function fromJson(f: File) {
    const data = JSON.parse(await f.text());
    if (data?.app !== "gamemaster" || !data.sheet) throw new Error("Esse arquivo não é uma ficha exportada do Game Master.");
    if (data.system !== mesa.system) throw new Error(`Essa ficha é de ${SYSTEMS[data.system as keyof typeof SYSTEMS]?.label || data.system}, mas a mesa usa ${sys.label}.`);
    return { sheet: data.sheet, found: sys.importFields };
  }

  async function fromPdf(f: File) {
    const { PDFDocument } = await import("pdf-lib");
    const doc = await PDFDocument.load(await f.arrayBuffer(), { ignoreEncryption: true });
    const fields: Record<string, string> = {};
    doc.getForm().getFields().forEach((fl) => {
      const name = fl.getName();
      const anyF = fl as unknown as { getText?: () => string | undefined; isChecked?: () => boolean; getSelected?: () => string[] };
      let v = "";
      try {
        if (anyF.getText) v = anyF.getText() || "";
        else if (anyF.isChecked) v = anyF.isChecked() ? "1" : "";
        else if (anyF.getSelected) v = (anyF.getSelected() || []).join(", ");
      } catch {
        v = "";
      }
      if (v.trim()) fields[norm(name)] = v.trim();
    });
    if (!Object.keys(fields).length) throw new Error("Não achamos campos preenchidos nesse PDF. Ele precisa ser a ficha preenchível (com campos de formulário).");
    if (mesa.system === "dnd") return mapDnd(fields, playerName);
    if (mesa.system === "op") return mapOp(fields, playerName);
    throw new Error(`Importação de PDF ainda não tem mapeamento para ${sys.label}. Use um arquivo exportado do Game Master.`);
  }

  async function pickFile(f: File | undefined, kind: "pdf" | "json") {
    if (!f) return;
    setErr("");
    setBusy(true);
    try {
      const r = kind === "pdf" ? await fromPdf(f) : await fromJson(f);
      if (!r.found.length) throw new Error("Nenhum campo reconhecido nesse arquivo.");
      setParsed(r.sheet);
      setFound(r.found);
      setSource(f.name);
      setStep("review");
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ app: "gamemaster", v: 1, system: mesa.system, sheet: current }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = ("name" in current && current.name) || ("t" in current && (current.t as { nome?: string }).nome) || "ficha";
    a.download = `${String(name).replace(/[^\w\- ]+/g, "").trim() || "ficha"}.gamemaster.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <CardShell
      title={<>Importar ficha<div style={{ fontFamily: "Alegreya Sans, sans-serif", fontSize: 13, color: "#c9b48a" }}>Sistema da mesa: {sys.label}</div></>}
      icon={<IconImport size={22} />}
      onClose={onClose}
    >
      <div className={styles.body}>
        {step === "choose" && (
          <>
            <div style={{ fontSize: 15, color: "#5a4430" }}>Já tem a ficha pronta? Traga ela inteira de uma vez.</div>
            {(mesa.system === "dnd" || mesa.system === "op") && (
              <label className={styles.opt}>
                <span className={styles.mark}>PDF</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b>PDF da ficha preenchida</b>
                  <span>A ficha oficial preenchível do sistema (com campos de formulário).</span>
                </span>
                <input type="file" accept=".pdf,application/pdf" className={styles.cover} aria-label="Escolher PDF da ficha" onChange={(e) => pickFile(e.target.files?.[0], "pdf")} />
              </label>
            )}
            <label className={styles.opt}>
              <span className={styles.mark}>GM</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>Arquivo exportado do Game Master</b>
                <span>Um .json baixado de outra mesa ou de um amigo.</span>
              </span>
              <input type="file" accept=".json,application/json" className={styles.cover} aria-label="Escolher arquivo exportado" onChange={(e) => pickFile(e.target.files?.[0], "json")} />
            </label>
            <div className={styles.opt} style={{ cursor: "default", alignItems: "flex-start" }}>
              <span className={styles.mark}>⇄</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>Copiar de outra mesa minha</b>
                <span>Usa um personagem que você já tem em outra mesa de {sys.label}.</span>
                {others === null && <span>Procurando…</span>}
                {others?.length === 0 && <span style={{ fontStyle: "italic" }}>Nenhum personagem seu em outras mesas deste sistema.</span>}
                <span style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                  {others?.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="gm-btn gm-btn--ghost"
                      style={{ justifyContent: "flex-start", height: 38 }}
                      onClick={() => {
                        setParsed(o.sheet);
                        setFound(sys.importFields);
                        setSource(`${o.name || "Personagem"} de “${o.mesa_name}”`);
                        setStep("review");
                      }}
                    >
                      {o.name || "Sem nome"} · {o.mesa_name}
                    </button>
                  ))}
                </span>
              </span>
            </div>
            <button type="button" className="gm-btn gm-btn--ghost" onClick={exportJson} style={{ alignSelf: "flex-start" }}>
              <IconExport size={18} />
              Exportar esta ficha (.json)
            </button>
            {busy && <div className="gm-hint">Lendo arquivo…</div>}
          </>
        )}

        {step === "review" && (
          <>
            <div className={styles.fileRow}>
              <IconFile color="#8a5a12" />
              <span style={{ flex: 1, minWidth: 0, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{source}</span>
              <button type="button" className="gm-btn gm-btn--ghost" style={{ height: 32, fontSize: 13 }} onClick={() => setStep("choose")}>Trocar</button>
            </div>
            <div style={{ fontWeight: 800 }}>Dados encontrados:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {found.map((f) => <span key={f} className="gm-badge gm-badge--ok" style={{ fontSize: 13 }}>✓ {f}</span>)}
            </div>
            <div className={styles.warn}>Os campos importados substituem os atuais. Valores automáticos (modificadores, PV máximo, Defesa…) são recalculados.</div>
            <button
              type="button"
              className="gm-btn gm-btn--primary"
              onClick={() => {
                onImport(parsed);
                setStep("done");
              }}
            >
              Importar ficha
            </button>
          </>
        )}

        {step === "done" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "18px 8px", textAlign: "center" }}>
            <span style={{ width: 60, height: 60, borderRadius: "50%", background: "#5c8a3a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconCheck size={30} color="#fff" />
            </span>
            <div className="gm-display" style={{ fontSize: 24 }}>Ficha importada!</div>
            <div style={{ fontSize: 15, color: "#5a4430" }}>Confira os campos e ajuste o que for preciso.</div>
            <button type="button" className="gm-btn gm-btn--ink" onClick={onClose}>Ver ficha</button>
          </div>
        )}

        {err && <div className="gm-error" role="alert">{err}</div>}
      </div>
    </CardShell>
  );
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const toNum = (v: string | undefined) => {
  const m = (v || "").match(/-?\d+/);
  return m ? Number(m[0]) : undefined;
};

/** Ficha oficial preenchível de D&D 5e (nomes de campo do PDF da WotC). */
function mapDnd(f: Record<string, string>, player: string): { sheet: DndSheet; found: string[] } {
  const s = dndDefault(player);
  const found = new Set<string>();
  const g = (...keys: string[]) => keys.map(norm).map((k) => f[k]).find((v) => v !== undefined);
  const txt = (k: keyof DndSheet["t"], label: string, ...keys: string[]) => {
    const v = g(...keys);
    if (v) {
      s.t[k] = v;
      found.add(label);
    }
  };
  txt("nome", "Nome", "CharacterName", "CharacterName 2");
  const cl = g("ClassLevel");
  if (cl) {
    s.t.classe = cl.replace(/\s*\d+\s*$/, "").trim() || cl;
    s.level = Math.max(1, Math.min(20, toNum(cl) || 1));
    found.add("Classe e nível");
  }
  txt("raca", "Raça", "Race", "Race ");
  txt("antecedente", "Antecedente", "Background");
  txt("jogador", "Jogador", "PlayerName");
  txt("tendencia", "Tendência", "Alignment");
  txt("xp", "XP", "XP", "Experience Points");
  const abMap: Record<string, string> = { for: "STR", des: "DEX", con: "CON", int: "INT", sab: "WIS", car: "CHA" };
  let anyAb = false;
  DND_AB.forEach(([k]) => {
    const v = toNum(g(abMap[k]));
    if (v !== undefined) {
      s.sc[k] = v;
      anyAb = true;
    }
  });
  if (anyAb) found.add("6 atributos");
  const saveKeys: Record<string, string> = { for: "Check Box 11", des: "Check Box 18", con: "Check Box 19", int: "Check Box 20", sab: "Check Box 21", car: "Check Box 22" };
  DND_AB.forEach(([k]) => {
    if (g(saveKeys[k])) s.saveProf[k] = true;
  });
  // No PDF oficial as caixas 23–40 seguem a ordem alfabética das perícias em inglês.
  const enOrder = ["acrobacia", "adestrar", "arcanismo", "atletismo", "enganacao", "historia", "intuicao", "intimidacao", "investigacao", "medicina", "natureza", "percepcao", "atuacao", "persuasao", "religiao", "prestidigitacao", "furtividade", "sobrevivencia"];
  let anySk = false;
  DND_SK.forEach(([k]) => {
    const i = enOrder.indexOf(k);
    if (i >= 0 && g(`Check Box ${23 + i}`)) {
      s.skillProf[k] = true;
      anySk = true;
    }
  });
  if (anySk) found.add("Perícias");
  const ca = toNum(g("AC"));
  if (ca !== undefined) { s.ca = ca; found.add("CA"); }
  const hpMax = toNum(g("HPMax"));
  if (hpMax !== undefined) {
    s.hpMax = hpMax;
    s.hp = toNum(g("HPCurrent")) ?? hpMax;
    s.temp = toNum(g("HPTemp")) ?? 0;
    found.add("PV");
  }
  txt("deslocamento", "Deslocamento", "Speed");
  txt("dvTotal", "Dados de vida", "HDTotal");
  txt("dv", "Dados de vida", "HD");
  const weapons: DndSheet["weapons"] = [];
  [["Wpn Name", "Wpn1 AtkBonus", "Wpn1 Damage"], ["Wpn Name 2", "Wpn2 AtkBonus ", "Wpn2 Damage "], ["Wpn Name 3", "Wpn3 AtkBonus  ", "Wpn3 Damage "]].forEach(([n, b, d]) => {
    const nm = g(n);
    if (nm) weapons.push({ n: nm, b: g(b) || "", d: g(d) || "" });
  });
  if (weapons.length) { s.weapons = weapons; found.add("Ataques"); }
  txt("ataquesTexto", "Ataques", "AttacksSpellcasting");
  txt("equipamento", "Equipamento", "Equipment");
  txt("tesouro", "Tesouro", "Treasure");
  let coins = false;
  DND_COINS.forEach(([k]) => {
    const key = { PC: "CP", PP: "SP", PE: "EP", PO: "GP", PL: "PP" }[k] as string;
    const v = toNum(g(key));
    if (v !== undefined) { s.coins[k] = v; coins = true; }
  });
  if (coins) found.add("Moedas");
  txt("proficiencias", "Proficiências", "ProficienciesLang");
  txt("tracos", "Traços", "PersonalityTraits", "PersonalityTraits ");
  txt("ideais", "Traços", "Ideals");
  txt("vinculos", "Traços", "Bonds");
  txt("defeitos", "Traços", "Flaws");
  txt("caracteristicas", "Características", "Features and Traits", "Feat+Traits");
  txt("historia", "História", "Backstory");
  txt("aliados", "Aliados", "Allies");
  txt("faccao", "Facção", "FactionName");
  txt("idade", "Aparência", "Age");
  txt("altura", "Aparência", "Height");
  txt("peso", "Aparência", "Weight");
  txt("olhos", "Aparência", "Eyes");
  txt("pele", "Aparência", "Skin");
  txt("cabelo", "Aparência", "Hair");
  txt("classeMagia", "Magias", "Spellcasting Class 2");
  return { sheet: s, found: Array.from(found) };
}

/** Ficha de Ordem Paranormal: casa os campos pelo nome (os PDFs da comunidade variam). */
function mapOp(f: Record<string, string>, player: string): { sheet: OpSheet; found: string[] } {
  const s = opDefault(player);
  const found = new Set<string>();
  const keys = Object.keys(f);
  const find = (...needles: string[]) => {
    for (const n of needles.map(norm)) {
      const exact = keys.find((k) => k === n);
      if (exact) return f[exact];
    }
    for (const n of needles.map(norm)) {
      const part = keys.find((k) => k.includes(n));
      if (part) return f[part];
    }
    return undefined;
  };
  const nome = find("personagem", "nome", "nomedopersonagem");
  if (nome) { s.name = nome; found.add("Nome"); }
  const jog = find("jogador");
  if (jog) s.player = jog;
  const origem = find("origem");
  if (origem) {
    const o = OP_ORIGENS.find(([, l]) => norm(l) === norm(origem));
    if (o) { s.origem = o[0]; found.add("Origem"); }
  }
  const classe = find("classe");
  if (classe) {
    const c = ["combatente", "especialista", "ocultista"].indexOf(norm(classe));
    if (c >= 0) { s.classe = String(c + 1); found.add("Classe"); }
  }
  const trilha = find("trilha");
  if (trilha) { s.trilha = trilha; found.add("Trilha"); }
  const nex = toNum(find("nex"));
  if (nex !== undefined) { s.nex = nex >= 99 ? 99 : Math.max(5, Math.round(nex / 5) * 5); found.add("NEX"); }
  let anyA = false;
  OP_ATTRS.forEach(([k, key, label]) => {
    const v = toNum(find(key, label));
    if (v !== undefined && v <= 7) { s.a[k] = v; anyA = true; }
  });
  if (anyA) found.add("5 atributos");
  const pv = toNum(find("pvatual", "pv"));
  const pe = toNum(find("peatual", "pe"));
  const san = toNum(find("sanatual", "sanidadeatual", "san", "sanidade"));
  if (pv !== undefined || pe !== undefined || san !== undefined) {
    s.cur = { pv: pv ?? 0, pe: pe ?? 0, san: san ?? 0 };
    found.add("PV / PE / SAN");
  }
  const desl = find("deslocamento");
  if (desl) s.desl = desl;
  ([["aparencia", "Aparência"], ["personalidade", "Personalidade"], ["historico", "Histórico"], ["objetivo", "Objetivo"]] as const).forEach(([k, l]) => {
    const v = find(k, l);
    if (v) { s[k] = v; found.add("Descrição"); }
  });
  const inv = find("inventario", "itens", "equipamento");
  if (inv) {
    s.items = inv.split(/\n|;/).map((x) => x.trim()).filter(Boolean).map((n) => ({ n, c: "", e: 1 }));
    found.add("Inventário");
  }
  return { sheet: s, found: Array.from(found) };
}
