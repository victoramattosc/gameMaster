// Leitura de fichas em PDF preenchível e conversão para o formato do app.
// Módulo puro (sem React) para dar para testar com os PDFs reais.
import type { SystemKey } from "lib/types";
import { DND_AB, DND_COINS, DND_SK, dndDefault, DndSheet } from "./dnd";
import { OP_ATTRS, OP_NEX, OP_ORIGENS, OP_SKILLS, OP_TRILHAS, opCalc, opDefault, OpSheet } from "./op";
import { OP2_ATTR, op2Default, Op2Sheet, op2Step } from "./op2";

export interface PdfImport {
  sheet: unknown;
  found: string[];
}

/** Lê todos os campos de formulário preenchidos, com o nome normalizado. */
export async function readPdfFields(data: ArrayBuffer | Uint8Array): Promise<Record<string, string>> {
  const { PDFDocument } = await import("pdf-lib");
  const doc = await PDFDocument.load(data, { ignoreEncryption: true });
  const fields: Record<string, string> = {};
  doc.getForm().getFields().forEach((fl) => {
    const anyF = fl as unknown as { getText?: () => string | undefined; isChecked?: () => boolean; getSelected?: () => string[] };
    let v = "";
    try {
      if (anyF.getText) v = anyF.getText() || "";
      else if (anyF.isChecked) v = anyF.isChecked() ? "1" : "";
      else if (anyF.getSelected) v = (anyF.getSelected() || []).join(", ");
    } catch {
      v = "";
    }
    if (v.trim()) fields[norm(fl.getName())] = v.trim();
  });
  return fields;
}

export function mapPdfSheet(system: SystemKey, fields: Record<string, string>, player: string): PdfImport | null {
  if (system === "dnd") return mapDnd(fields, player);
  if (system === "op") return mapOp(fields, player);
  if (system === "op2") return mapOp2(fields);
  return null;
}

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]/g, "");
const toNum = (v: string | undefined) => {
  const m = (v || "").match(/-?\d+/);
  return m ? Number(m[0]) : undefined;
};

/** Ficha oficial preenchível de D&D 5e (nomes de campo do PDF da WotC). */
export function mapDnd(f: Record<string, string>, player: string): { sheet: DndSheet; found: string[] } {
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
    s.t.classe = cl.replace(/[\s\-–—,]*(nv|n[ií]vel|lvl|level|niv)?\.?\s*\d+\s*$/i, "").trim() || cl;
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
  // Espaços de magia: SlotsTotal 19…27 = 1º…9º círculo na ficha oficial.
  let anySlot = false;
  for (let L = 1; L <= 9; L++) {
    const v = toNum(g(`SlotsTotal ${18 + L}`));
    if (v !== undefined) { s.slots[L] = Math.max(0, Math.min(9, v)); anySlot = true; }
  }
  if (anySlot) found.add("Espaços de magia");
  const insp = g("Inspiration");
  if (insp && insp.trim()) s.insp = true;
  // Ficha importada: mantém PV, espaços e atributos do PDF (o jogador liga a automação se quiser).
  s.auto = { hp: false, slots: !anySlot, saves: false };
  s.autoSk = [];
  s.choices = {};
  [4, 6, 8, 10, 12, 14, 16].forEach((n) => {
    if (s.level >= n) s.choices![`asi-${n}`] = "importado";
  });
  return { sheet: s, found: Array.from(found) };
}

/**
 * Ficha automática de Ordem Paranormal (PDF preenchível da comunidade, campos como
 * atr_agi, treino_luta, o_luta, mod_pv, invent1/categ1/esp1). Ataques, habilidades,
 * rituais e descrição ficam de fora de propósito: o jogador preenche no app.
 */
export function mapOp(f: Record<string, string>, player: string): { sheet: OpSheet; found: string[] } {
  const s = opDefault(player);
  const found = new Set<string>();
  const g = (k: string) => f[norm(k)];
  const n = (k: string) => toNum(g(k));

  const nome = g("personagem") || g("nome");
  if (nome) { s.name = nome; found.add("Nome"); }
  const jog = g("jogador");
  if (jog) s.player = jog;

  const origem = g("origem");
  if (origem) {
    const o = OP_ORIGENS.find(([k, l]) => k === origem || norm(l) === norm(origem));
    if (o && o[0] !== "0") { s.origem = o[0]; found.add("Origem"); }
  }
  const classe = g("classe");
  if (classe) {
    const idx = /^[0-3]$/.test(classe) ? Number(classe) : ["combatente", "especialista", "ocultista"].indexOf(norm(classe)) + 1;
    if (idx > 0) { s.classe = String(idx); found.add("Classe"); }
  }
  // A trilha costuma vir vazia no PDF; tentamos achar o nome dela nas habilidades.
  const trilhas = OP_TRILHAS[s.classe] || [];
  const trilhaRaw = g("trilha");
  let trilha = trilhas.find((t) => t !== "—" && !!trilhaRaw && norm(t) === norm(trilhaRaw));
  if (!trilha) {
    const habs = Object.keys(f).filter((k) => /^habi\d+$/.test(k)).map((k) => norm(f[k]));
    trilha = trilhas.find((t) => t !== "—" && habs.some((h) => h.includes(norm(t))));
  }
  if (trilha) { s.trilha = trilha; found.add("Trilha"); }

  const nex = n("nex");
  if (nex !== undefined) { s.nex = OP_NEX.reduce((a, b) => (Math.abs(b - nex) < Math.abs(a - nex) ? b : a), 5); found.add("NEX"); }
  const desl = g("deslocamento");
  if (desl) s.desl = desl;

  let anyA = false;
  OP_ATTRS.forEach(([k]) => {
    const v = n(`atr_${k}`);
    if (v !== undefined) { s.a[k] = Math.max(0, Math.min(7, v)); anyA = true; }
  });
  if (anyA) found.add("5 atributos");

  s.mod = { pv: n("mod_pv") ?? 0, pe: n("mod_pe") ?? 0, san: n("mod_san") ?? 0 };
  s.modDt = n("mod_dt") ?? 0;
  const defEquip = n("defesa_equip");
  const defOutros = n("defesa_outros");
  if (defEquip !== undefined || defOutros !== undefined) {
    s.defEquip = defEquip ?? 0;
    s.defOutros = defOutros ?? 0;
    found.add("Defesa");
  }
  const prot = g("protecao") || g("protecoes");
  if (prot) s.protecoes = prot;
  const res = g("resistencias");
  if (res) s.resist = res;

  let anySk = false;
  OP_SKILLS.forEach(([k]) => {
    const t = n(`treino_${k}`);
    const o = n(`o_${k}`);
    if (t !== undefined || o !== undefined) {
      s.sk[k] = { t: Math.max(0, Math.min(3, t ?? 0)), o: o ?? 0 };
      if (t || o) anySk = true;
    }
  });
  if (anySk) found.add("Perícias e treino");

  // Máximos: a ficha do app recalcula pela classe; se o PDF tiver outro total
  // (poderes, itens…), a diferença vira modificador para o máximo bater.
  const c0 = opCalc(s);
  ([["pv", "pv_max", c0.pvMax], ["pe", "pe_max", c0.peMax], ["san", "san_max", c0.sanMax]] as const).forEach(([k, maxKey, calc]) => {
    const pdfMax = n(maxKey);
    if (pdfMax !== undefined && pdfMax > 0 && pdfMax !== calc) s.mod[k] += pdfMax - calc;
  });
  const c1 = opCalc(s);
  const cur = { pv: n("pv_atual"), pe: n("pe_atual"), san: n("san_atual") };
  s.cur = {
    pv: Math.max(0, Math.min(cur.pv ?? c1.pvMax, c1.pvMax)),
    pe: Math.max(0, Math.min(cur.pe ?? c1.peMax, c1.peMax)),
    san: Math.max(0, Math.min(cur.san ?? c1.sanMax, c1.sanMax)),
  };
  if (c1.pvMax || cur.pv !== undefined) found.add("PV / PE / SAN");

  const prest = n("pontos_prestigio");
  if (prest !== undefined) s.prestigio = prest;
  const patente = g("patente");
  if (patente) s.patente = patente;
  const credito = g("limite_credito");
  if (credito) s.credito = credito;
  const lim = [1, 2, 3, 4].map((i) => n(`limite${i}`));
  if (lim.some((x) => x !== undefined)) s.lim = lim.map((x, i) => x ?? s.lim[i]) as OpSheet["lim"];

  const ROMAN = ["0", "I", "II", "III", "IV"];
  const items: OpSheet["items"] = [];
  for (let i = 1; i <= 40; i++) {
    const name = g(`invent${i}`);
    if (!name) continue;
    const cat = g(`categ${i}`) || "";
    const catN = toNum(cat);
    items.push({ n: name, c: catN !== undefined && ROMAN[catN] ? ROMAN[catN] : cat, e: n(`esp${i}`) ?? 1 });
  }
  if (items.length) { s.items = items; found.add(`Inventário (${items.length} itens)`); }

  // A ficha importada já traz atributos e perícias finais: não reaplicamos
  // perícias da origem nem aumentos de atributo já passados.
  s.autoSk = [];
  s.choices = {};
  [20, 50, 80, 95].forEach((n) => {
    if (s.nex >= n) s.choices![`atributo-${n}`] = "importado";
  });

  return { sheet: s, found: Array.from(found) };
}

/** Ficha de Ordem Paranormal II, playtest 1.2 (Físico/Mente/Emoção e perícias 1–20 em ordem alfabética). */
export function mapOp2(f: Record<string, string>): { sheet: Op2Sheet; found: string[] } {
  const s = op2Default();
  const found = new Set<string>();
  const g = (k: string) => f[norm(k)];
  const lvl = (v: string | undefined) => op2Step(v);
  const nome = g("Nome");
  if (nome) { s.t.nome = nome; found.add("Nome"); }
  const perfil = g("Texto1");
  if (perfil) { s.t.perfil = perfil; found.add("Perfil"); }
  const ocup = g("Texto2");
  if (ocup) { s.t.ocupacao = ocup; found.add("Vocação"); }
  const nivel = g("Nivel");
  if (nivel) { s.t.nivel = nivel; found.add("Nível"); }
  const nex = g("NEX");
  if (nex) { s.t.nex = nex; found.add("NEX"); }
  let anyA = false;
  OP2_ATTR.forEach(([k, label]) => {
    const v = lvl(g(label));
    if (v !== undefined) { s.a[k] = v; anyA = true; }
  });
  if (anyA) found.add("Físico / Mente / Emoção");
  let anySk = false;
  s.sk = s.sk.map((cur, i) => {
    const v = lvl(g(String(i + 1)));
    if (v !== undefined) anySk = true;
    return v ?? cur;
  });
  if (anySk) found.add("20 perícias");
  const pv = toNum(g("PV"));
  if (pv !== undefined) { s.pv = { total: pv, lost: 0 }; found.add("PV"); }
  const pd = toNum(g("PD"));
  if (pd !== undefined) { s.pd = { total: pd, lost: 0 }; found.add("PD"); }
  return { sheet: s, found: Array.from(found) };
}
