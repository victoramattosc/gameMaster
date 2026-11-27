// Ordem Paranormal II (comunitário) — atributos 1..6 viram dados d4..d20.
import type { ResourceStatus } from "lib/types";

export const OP2_DIE = ["d4", "d4", "d6", "d8", "d10", "d12", "d20"];
export const OP2_FACES = [4, 4, 6, 8, 10, 12, 20];
export type Op2Attr = "fisico" | "mente" | "emocao";
export const OP2_ATTR: [Op2Attr, string][] = [["fisico", "Físico"], ["mente", "Mente"], ["emocao", "Emoção"]];
export const OP2_SK: [string, Op2Attr][] = [
  ["Acrobacia", "fisico"], ["Atletismo", "fisico"], ["Crime", "fisico"], ["Disciplina", "emocao"], ["Enganação", "emocao"],
  ["Furtividade", "fisico"], ["Intimidar", "emocao"], ["Intuição", "emocao"], ["Luta", "fisico"], ["Máquinas", "mente"],
  ["Medicina", "mente"], ["Ocultismo", "mente"], ["Percepção", "mente"], ["Persuasão", "emocao"], ["Pesquisar", "mente"],
  ["Pontaria", "fisico"], ["Sobrevivência", "mente"], ["Tecnologia", "mente"], ["Vigor", "fisico"],
];

export interface Op2Sheet {
  t: { nome: string; perfil: string; ocupacao: string; nivel: string; nex: string; aptidao: string; aptidaoDesc: string; notas: string };
  a: Record<Op2Attr, number>;
  sk: number[];
  apt: number;
  pv: { total: number; lost: number };
  pd: { total: number; lost: number };
  habs: string[];
  items: { n: string; e: number }[];
  conditions: string[];
  portrait?: string | null;
}

export function op2Default(): Op2Sheet {
  return {
    t: { nome: "", perfil: "", ocupacao: "", nivel: "1", nex: "5%", aptidao: "", aptidaoDesc: "", notas: "" },
    a: { fisico: 1, mente: 1, emocao: 1 },
    sk: OP2_SK.map(() => 1),
    apt: 1,
    pv: { total: 6, lost: 0 },
    pd: { total: 4, lost: 0 },
    habs: ["", "", "", "", ""],
    items: [],
    conditions: [],
  };
}

export function op2Status(s: Op2Sheet): { name: string; role_line: string; defense: number | null; resources: ResourceStatus[] } {
  return {
    name: s.t.nome || "Agente sem nome",
    role_line: `${s.t.perfil || "Sem perfil"} · NEX ${s.t.nex || "—"}`,
    defense: null,
    resources: [
      { key: "pv", label: "PV", cur: Math.max(0, s.pv.total - s.pv.lost), max: s.pv.total, color: "#c2412d" },
      { key: "pd", label: "PD", cur: Math.max(0, s.pd.total - s.pd.lost), max: s.pd.total, color: "#3f7cc4" },
    ],
  };
}

export const rollFace = (f: number) => 1 + Math.floor(Math.random() * f);
