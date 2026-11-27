// D&D 5e — ficha com modificadores, proficiência, perícias e magias calculados.
import type { ResourceStatus } from "lib/types";

export type DndAb = "for" | "des" | "con" | "int" | "sab" | "car";
export const DND_AB: [DndAb, string][] = [
  ["for", "FORÇA"], ["des", "DESTREZA"], ["con", "CONSTITUIÇÃO"], ["int", "INTELIGÊNCIA"], ["sab", "SABEDORIA"], ["car", "CARISMA"],
];
export const DND_SK: [string, string, DndAb][] = [
  ["acrobacia", "Acrobacia", "des"], ["adestrar", "Adestrar Animais", "sab"], ["arcanismo", "Arcanismo", "int"],
  ["atletismo", "Atletismo", "for"], ["atuacao", "Atuação", "car"], ["enganacao", "Enganação", "car"],
  ["furtividade", "Furtividade", "des"], ["historia", "História", "int"], ["intimidacao", "Intimidação", "car"],
  ["intuicao", "Intuição", "sab"], ["investigacao", "Investigação", "int"], ["medicina", "Medicina", "sab"],
  ["natureza", "Natureza", "int"], ["percepcao", "Percepção", "sab"], ["persuasao", "Persuasão", "car"],
  ["prestidigitacao", "Prestidigitação", "des"], ["religiao", "Religião", "int"], ["sobrevivencia", "Sobrevivência", "sab"],
];
export const DND_COINS: [string, string, string][] = [
  ["PC", "Cobre", "#b87333"], ["PP", "Prata", "#a9a9a9"], ["PE", "Electro", "#7fa7a0"], ["PO", "Ouro", "#d4a017"], ["PL", "Platina", "#c7c9d1"],
];
export const DND_SPELL_LEVELS = ["Truques", "1º círculo", "2º círculo", "3º círculo", "4º círculo", "5º círculo", "6º círculo", "7º círculo", "8º círculo", "9º círculo"];

export type DndText =
  | "nome" | "classe" | "antecedente" | "jogador" | "raca" | "tendencia" | "xp" | "proficiencias"
  | "deslocamento" | "dvTotal" | "dv" | "ataquesTexto" | "equipamento" | "tesouro" | "tracos" | "ideais"
  | "vinculos" | "defeitos" | "caracteristicas" | "idade" | "altura" | "peso" | "olhos" | "pele" | "cabelo"
  | "aliados" | "faccao" | "historia" | "extras" | "classeMagia" | "notas";

export interface DndSheet {
  t: Record<DndText, string>;
  ca: number;
  level: number;
  sc: Record<DndAb, number>;
  saveProf: Partial<Record<DndAb, boolean>>;
  skillProf: Record<string, boolean>;
  insp: boolean;
  hp: number;
  hpMax: number;
  temp: number;
  ok: boolean[];
  fail: boolean[];
  weapons: { n: string; b: string; d: string }[];
  coins: Record<string, number>;
  spellAb: DndAb;
  slots: number[];
  used: number[];
  spells: { name: string; prep: boolean }[][];
  conditions: string[];
  portrait?: string | null;
}

export function dndDefault(player: string): DndSheet {
  const t = {} as Record<DndText, string>;
  ([
    "nome", "classe", "antecedente", "jogador", "raca", "tendencia", "xp", "proficiencias", "deslocamento", "dvTotal", "dv",
    "ataquesTexto", "equipamento", "tesouro", "tracos", "ideais", "vinculos", "defeitos", "caracteristicas", "idade", "altura",
    "peso", "olhos", "pele", "cabelo", "aliados", "faccao", "historia", "extras", "classeMagia", "notas",
  ] as DndText[]).forEach((k) => (t[k] = ""));
  t.jogador = player;
  t.xp = "0";
  t.deslocamento = "9 m";
  return {
    t, ca: 10, level: 1,
    sc: { for: 10, des: 10, con: 10, int: 10, sab: 10, car: 10 },
    saveProf: {}, skillProf: {}, insp: false, hp: 10, hpMax: 10, temp: 0,
    ok: [false, false, false], fail: [false, false, false], weapons: [],
    coins: { PC: 0, PP: 0, PE: 0, PO: 0, PL: 0 }, spellAb: "sab",
    slots: Array(10).fill(0), used: Array(10).fill(0), spells: Array.from({ length: 10 }, () => []),
    conditions: [],
  };
}

export const dndMod = (s: DndSheet, k: DndAb) => Math.floor(((Number(s.sc[k]) || 0) - 10) / 2);
export const dndProf = (s: DndSheet) => Math.ceil((Number(s.level) || 1) / 4) + 1;
export const dndSkillBonus = (s: DndSheet, k: string, at: DndAb) => dndMod(s, at) + (s.skillProf[k] ? dndProf(s) : 0);

export function dndStatus(s: DndSheet): { name: string; role_line: string; defense: number; resources: ResourceStatus[] } {
  return {
    name: s.t.nome || "Aventureiro sem nome",
    role_line: `${s.t.classe || "Sem classe"} · Nível ${s.level}`,
    defense: Number(s.ca) || 10,
    resources: [{ key: "pv", label: "PV", cur: s.hp + (s.temp || 0), max: s.hpMax, color: "#c2412d" }],
  };
}

export function d20(label: string, bonus: number) {
  const r = 1 + Math.floor(Math.random() * 20);
  return {
    total: r + bonus,
    text: `${label}: d20 → ${r} ${bonus >= 0 ? "+" : "−"} ${Math.abs(bonus)}${r === 20 ? " · crítico!" : r === 1 ? " · falha crítica" : ""}`,
  };
}
