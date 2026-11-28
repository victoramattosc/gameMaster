// Ordem Paranormal II (comunitário) — atributos 1..6 viram dados d4..d20.
import type { ResourceStatus } from "lib/types";

export const OP2_DIE = ["d4", "d4", "d6", "d8", "d10", "d12", "d20"];
export const OP2_FACES = [4, 4, 6, 8, 10, 12, 20];
export type Op2Attr = "fisico" | "mente" | "emocao";
export const OP2_ATTR: [Op2Attr, string][] = [["fisico", "Físico"], ["mente", "Mente"], ["emocao", "Emoção"]];
// Playtest 1.2: 20 perícias em ordem alfabética (a mesma ordem dos campos 1–20 da ficha em PDF).
export const OP2_SK: [string, Op2Attr][] = [
  ["Acrobacia", "fisico"], ["Animais", "emocao"], ["Aptidão", "mente"], ["Atletismo", "fisico"], ["Bruxaria", "mente"],
  ["Crime", "fisico"], ["Disciplina", "emocao"], ["Enganação", "emocao"], ["Furtividade", "fisico"], ["Inspecionar", "mente"],
  ["Intimidar", "emocao"], ["Intuição", "emocao"], ["Luta", "fisico"], ["Medicina", "mente"], ["Ofício", "mente"],
  ["Percepção", "mente"], ["Persuasão", "emocao"], ["Pontaria", "fisico"], ["Sobrevivência", "mente"], ["Vigor", "fisico"],
];
// Lista do playtest anterior (19 perícias + aptidão separada), para migrar fichas antigas.
const OP2_SK_OLD = ["Acrobacia", "Atletismo", "Crime", "Disciplina", "Enganação", "Furtividade", "Intimidar", "Intuição", "Luta", "Máquinas", "Medicina", "Ocultismo", "Percepção", "Persuasão", "Pesquisar", "Pontaria", "Sobrevivência", "Tecnologia", "Vigor"];

/** Converte a lista de perícias de uma ficha antiga (19 perícias) para a atual. */
export function migrateOp2Skills(sk: number[], apt: number): number[] {
  if (sk.length === OP2_SK.length) return sk;
  return OP2_SK.map(([name]) => {
    if (name === "Aptidão") return apt || 1;
    if (name === "Bruxaria") return sk[OP2_SK_OLD.indexOf("Ocultismo")] || 1;
    if (name === "Inspecionar") return sk[OP2_SK_OLD.indexOf("Pesquisar")] || 1;
    if (name === "Ofício") return sk[OP2_SK_OLD.indexOf("Máquinas")] || 1;
    const i = OP2_SK_OLD.indexOf(name);
    return i >= 0 ? sk[i] || 1 : 1;
  });
}

/** Lê "d8", "8" (faces) ou "3" (passo) e devolve o passo 1–6. */
export function op2Step(v: string | undefined): number | undefined {
  if (!v) return undefined;
  const t = v.trim().toLowerCase();
  const m = t.match(/d?\s*(\d+)/);
  if (!m) return undefined;
  const n = Number(m[1]);
  const byFaces: Record<number, number> = { 4: 1, 6: 2, 8: 3, 10: 4, 12: 5, 20: 6 };
  if (t.includes("d") || n > 6) return byFaces[n];
  return Math.max(1, Math.min(6, n));
}

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
    a: { fisico: 2, mente: 2, emocao: 2 },
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
