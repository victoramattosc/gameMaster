// Ordem Paranormal RPG — ficha automática.
import type { ResourceStatus } from "lib/types";

export const OP_ORIGENS: [string, string][] = [
  ["0", "—"], ["academico", "Acadêmico"], ["agente_saude", "Agente de Saúde"], ["amnesico", "Amnésico"],
  ["artista", "Artista"], ["atleta", "Atleta"], ["chef", "Chef"], ["criminoso", "Criminoso"],
  ["cultista_arrependido", "Cultista Arrependido"], ["desgarrado", "Desgarrado"], ["engenheiro", "Engenheiro"],
  ["executivo", "Executivo"], ["investigador", "Investigador"], ["lutador", "Lutador"], ["magnata", "Magnata"],
  ["mercenario", "Mercenário"], ["militar", "Militar"], ["operario", "Operário"], ["policial", "Policial"],
  ["religioso", "Religioso"], ["servidor_publico", "Servidor Público"], ["ti", "T.I."],
  ["teorico", "Teórico da Conspiração"], ["trabalhador_rural", "Trabalhador Rural"],
  ["trambiqueiro", "Trambiqueiro"], ["universitario", "Universitário"], ["vitima", "Vítima"],
];

export const OP_CLASSES: Record<string, string> = { "0": "—", "1": "Combatente", "2": "Especialista", "3": "Ocultista" };

export const OP_TRILHAS: Record<string, string[]> = {
  "0": ["—"],
  "1": ["—", "Aniquilador", "Comandante de Campo", "Guerreiro", "Operações Especiais", "Tropa de Choque"],
  "2": ["—", "Atirador de Elite", "Infiltrador", "Médico de Campo", "Negociador", "Técnico"],
  "3": ["—", "Conduíte", "Flagelador", "Graduado", "Intuitivo", "Lâmina Paranormal"],
};

export const OP_NEX = [5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55, 60, 65, 70, 75, 80, 85, 90, 95, 99];

export type OpAttr = "agi" | "for" | "int" | "pre" | "vig";
export const OP_ATTRS: [OpAttr, string, string][] = [
  ["agi", "AGI", "Agilidade"], ["for", "FOR", "Força"], ["int", "INT", "Intelecto"], ["pre", "PRE", "Presença"], ["vig", "VIG", "Vigor"],
];

export const OP_SKILLS: [string, string, OpAttr][] = [
  ["acrobacia", "Acrobacia +", "agi"], ["adestramento", "Adestramento *", "pre"], ["artes", "Artes *", "pre"],
  ["atletismo", "Atletismo", "for"], ["atualidades", "Atualidades", "int"], ["ciencias", "Ciências *", "int"],
  ["crime", "Crime * +", "agi"], ["diplomacia", "Diplomacia", "pre"], ["enganacao", "Enganação", "pre"],
  ["fortitude", "Fortitude", "vig"], ["furtividade", "Furtividade +", "agi"], ["iniciativa", "Iniciativa", "agi"],
  ["intimidacao", "Intimidação", "pre"], ["intuicao", "Intuição", "pre"], ["investigacao", "Investigação", "int"],
  ["luta", "Luta", "for"], ["medicina", "Medicina", "int"], ["ocultismo", "Ocultismo *", "int"],
  ["percepcao", "Percepção", "pre"], ["pilotagem", "Pilotagem *", "agi"], ["pontaria", "Pontaria", "agi"],
  ["profissao", "Profissão *", "int"], ["reflexos", "Reflexos", "agi"], ["religiao", "Religião *", "pre"],
  ["sobrevivencia", "Sobrevivência", "int"], ["tatica", "Tática *", "int"], ["tecnologia", "Tecnologia *", "int"],
  ["vontade", "Vontade", "pre"],
];

export interface OpSheet {
  name: string;
  player: string;
  origem: string;
  classe: string;
  trilha: string;
  nex: number;
  desl: string;
  a: Record<OpAttr, number>;
  cur: { pv: number; pe: number; san: number };
  mod: { pv: number; pe: number; san: number };
  modDt: number;
  defEquip: number;
  defOutros: number;
  protecoes: string;
  resist: string;
  sk: Record<string, { t: number; o: number }>;
  attacks: { n: string; t: string; d: string; e: string }[];
  abilities: { n: string; c: string; p: string; d: string; src?: string }[];
  items: { n: string; c: string; e: number }[];
  prestigio: number;
  patente: string;
  credito: string;
  lim: [number, number, number, number];
  aparencia: string;
  personalidade: string;
  historico: string;
  objetivo: string;
  notas: string;
  conditions: string[];
  portrait?: string | null;
  /** Escolhas da progressão (poder, atributo…) por id do passo. */
  choices?: Record<string, string>;
  /** Perícias treinadas automaticamente pela origem. */
  autoSk?: string[];
}

export function opDefault(player: string): OpSheet {
  const sk: OpSheet["sk"] = {};
  OP_SKILLS.forEach(([k]) => (sk[k] = { t: 0, o: 0 }));
  return {
    name: "", player, origem: "0", classe: "0", trilha: "—", nex: 5, desl: "9m",
    a: { agi: 1, for: 1, int: 1, pre: 1, vig: 1 },
    cur: { pv: 0, pe: 0, san: 0 }, mod: { pv: 0, pe: 0, san: 0 }, modDt: 0,
    defEquip: 0, defOutros: 0, protecoes: "", resist: "", sk,
    attacks: [], abilities: [], items: [],
    prestigio: 0, patente: "Recruta", credito: "Baixo", lim: [2, 0, 0, 0],
    aparencia: "", personalidade: "", historico: "", objetivo: "", notas: "", conditions: [],
  };
}

const num = (v: unknown) => Number(v) || 0;

export interface OpCalc {
  steps: number;
  pvMax: number;
  peMax: number;
  sanMax: number;
  fPv: string;
  fPe: string;
  fSan: string;
  defesa: number;
  esquiva: number;
  bloqueio: number;
  dt: number;
  peRodada: number;
  carga: number;
  cargaMax: number;
  bonus(k: string): number;
}

export function opCalc(s: OpSheet): OpCalc {
  const a = s.a;
  const steps = Math.ceil(s.nex / 5);
  const or = s.origem;
  const base = ({
    "1": { pv: [20, 4], pe: [2, 2], san: [12, 3, 6] },
    "2": { pv: [16, 3], pe: [3, 3], san: [16, 4, 8] },
    "3": { pv: [12, 2], pe: [4, 4], san: [20, 5, 10] },
  } as Record<string, { pv: number[]; pe: number[]; san: number[] }>)[s.classe];
  const cl = OP_CLASSES[s.classe] && s.classe !== "0" ? OP_CLASSES[s.classe] : "sem classe";
  let pvMax = 0, peMax = 0, sanMax = 0;
  let fPv = "Escolha uma classe", fPe = fPv, fSan = fPv;
  if (base) {
    const more = s.nex <= 5 ? 0 : steps - 1;
    const desg = or === "desgarrado" ? steps : 0;
    const casca = s.trilha === "Tropa de Choque" && s.nex >= 10 ? steps : 0;
    pvMax = base.pv[0] + a.vig + more * (base.pv[1] + a.vig) + num(s.mod.pv) + desg + casca;
    fPv = `${cl}: ${base.pv[0]} + VIG ${a.vig} + ${more} × (${base.pv[1]} + VIG)${desg ? " + Desgarrado " + desg : ""}${casca ? " + Casca Grossa " + casca : ""} + mod`;
    const uni = or === "universitario" ? Math.min(10, Math.floor((s.nex + 5) / 10)) : 0;
    peMax = base.pe[0] + a.pre + more * (base.pe[1] + a.pre) + num(s.mod.pe) + uni;
    fPe = `${cl}: ${base.pe[0]} + PRE ${a.pre} + ${more} × (${base.pe[1]} + PRE)${uni ? " + Universitário " + uni : ""} + mod`;
    const sb = or === "cultista_arrependido" ? base.san[2] : base.san[0];
    const vit = or === "vitima" ? steps : 0;
    sanMax = sb + more * base.san[1] + num(s.mod.san) + vit;
    fSan = `${cl}: ${sb} + ${more} × ${base.san[1]}${vit ? " + Vítima " + vit : ""} + mod`;
  }
  const bonus = (k: string) => [0, 5, 10, 15][num(s.sk[k]?.t)] + num(s.sk[k]?.o);
  const defesa = 10 + a.agi + num(s.defEquip) + num(s.defOutros) + (or === "policial" ? 2 : 0);
  const carga = s.items.reduce((t, i) => t + num(i.e), 0);
  return {
    steps, pvMax, peMax, sanMax, fPv, fPe, fSan, defesa,
    esquiva: defesa + bonus("reflexos"),
    bloqueio: bonus("fortitude"),
    dt: 10 + steps + a.pre + num(s.modDt) + (or === "universitario" ? 1 : 0),
    peRodada: Math.round(s.nex / 5) + (or === "universitario" ? 1 : 0),
    carga,
    cargaMax: Math.max(2, 5 * (a.for + (s.trilha === "Técnico" && s.nex >= 10 ? a.int : 0))),
    bonus,
  };
}

export function opStatus(s: OpSheet): { name: string; role_line: string; defense: number; resources: ResourceStatus[] } {
  const c = opCalc(s);
  return {
    name: s.name || "Agente sem nome",
    role_line: `${s.classe !== "0" ? OP_CLASSES[s.classe] : "Sem classe"} · NEX ${s.nex}%`,
    defense: c.defesa,
    resources: [
      { key: "pv", label: "PV", cur: s.cur.pv, max: c.pvMax, color: "#c2412d" },
      { key: "pe", label: "PE", cur: s.cur.pe, max: c.peMax, color: "#3f7cc4" },
      { key: "san", label: "SAN", cur: s.cur.san, max: c.sanMax, color: "#8a5cc7" },
    ],
  };
}

/** Rola N d20 (N = atributo) e fica com o maior; com atributo 0 rola 2 e fica com o menor. */
export function opSkillRoll(label: string, attr: number, bonus: number) {
  const q = Math.max(attr, 2);
  const r = Array.from({ length: q }, () => 1 + Math.floor(Math.random() * 20));
  const best = attr > 0 ? Math.max(...r) : Math.min(...r);
  return {
    total: best + bonus,
    text: `${label.replace(/[*+ ]+$/, "")}: ${attr > 0 ? attr + "d20 (maior)" : "2d20 (menor, atributo 0)"} → ${r.join(", ")} · ${best} + ${bonus}`,
  };
}
