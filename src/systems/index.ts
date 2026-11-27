import type { CustomSchema, ResourceStatus, SystemKey } from "lib/types";
import { dndDefault, dndStatus, DndSheet } from "./dnd";
import { opDefault, opStatus, OpSheet } from "./op";
import { op2Default, op2Status, Op2Sheet } from "./op2";
import { customDefault, customStatus, CustomSheet } from "./custom";

export interface SystemMeta {
  key: SystemKey;
  label: string;
  short: string;
  color: string;
  mark: string;
  desc: string;
  ships: string;
  bookHint: string;
  summary: string;
  sheetTitle: string;
  importFields: string[];
}

export const SYSTEMS: Record<SystemKey, SystemMeta> = {
  dnd: {
    key: "dnd", label: "D&D 5e", short: "D&D 5e", color: "#b23a2c", mark: "d20",
    desc: "Fantasia heroica. Ficha completa com perícias, salvaguardas e magias.",
    ships: "Ficha + Livro do Jogador", bookHint: "Livro do Jogador — D&D 5e (PDF)",
    summary: "Atributos e modificadores, bônus de proficiência por nível, salvaguardas, 18 perícias, CA, iniciativa, PV e dados de vida, testes contra a morte, ataques, magias por círculo com espaços, moedas, equipamento e história. Modificadores, perícias, percepção passiva e CD de magia são calculados sozinhos.",
    sheetTitle: "Ficha de Aventureiro",
    importFields: ["Nome", "Classe e nível", "Raça", "Antecedente", "6 atributos", "Salvaguardas", "Perícias", "CA", "PV", "Ataques", "Equipamento", "Moedas", "Traços", "História", "Magias"],
  },
  op: {
    key: "op", label: "Ordem Paranormal", short: "Ordem", color: "#7a4fc0", mark: "OP",
    desc: "Investigação e horror. Agentes da Ordo Realitas.",
    ships: "Ficha automática + Livro de Regras", bookHint: "Ordem Paranormal RPG — Livro de Regras (PDF)",
    summary: "Cinco atributos, origem, classe e trilha, NEX, PV, PE e Sanidade calculados pela classe, Defesa, Esquiva e Bloqueio, 28 perícias com treino, ataques, habilidades e rituais com DT, inventário com carga e patente.",
    sheetTitle: "Ficha de Agente",
    importFields: ["Nome", "Origem", "Classe", "Trilha", "NEX", "5 atributos", "Perícias e treino", "PV / PE / SAN", "Defesa", "Ataques", "Rituais", "Inventário", "Descrição"],
  },
  op2: {
    key: "op2", label: "Ordem Paranormal II", short: "Ordem II", color: "#2a8a80", mark: "II",
    desc: "Versão comunitária com atributos em dados (d4 a d20).",
    ships: "Ficha + Livro de Regras", bookHint: "Ordem Paranormal II — Regras (PDF)",
    summary: "Físico, Mente e Emoção de 1 a 6 viram dados (d4 a d20), 19 perícias + aptidão somando dado do atributo e dado da perícia, perfil, ocupação, nível, NEX, PV, PD e cinco espaços de habilidades.",
    sheetTitle: "Ficha de Agente",
    importFields: ["Nome", "Perfil", "Ocupação", "Nível", "NEX", "Físico / Mente / Emoção", "19 perícias", "Aptidão", "PV", "PD", "Habilidades"],
  },
  custom: {
    key: "custom", label: "Personalizado", short: "Personalizado", color: "#8a6a2e", mark: "+",
    desc: "Seu sistema caseiro: defina atributos, recursos e campos.",
    ships: "Você monta a ficha", bookHint: "Nenhum livro enviado ainda",
    summary: "",
    sheetTitle: "Ficha",
    importFields: ["Nome", "Conceito", "Atributos", "Recursos", "Campos", "Inventário"],
  },
};

export const SYSTEM_LIST: SystemMeta[] = [SYSTEMS.dnd, SYSTEMS.op, SYSTEMS.op2, SYSTEMS.custom];

export type AnySheet = DndSheet | OpSheet | Op2Sheet | CustomSheet;

export function defaultSheet(system: SystemKey, player: string, schema: CustomSchema): AnySheet {
  switch (system) {
    case "dnd":
      return dndDefault(player);
    case "op":
      return opDefault(player);
    case "op2":
      return op2Default();
    default:
      return customDefault(schema);
  }
}

export function sheetStatus(
  system: SystemKey,
  sheet: AnySheet
): { name: string; role_line: string; defense: number | null; resources: ResourceStatus[]; conditions: string[]; portrait: string | null } {
  const base =
    system === "dnd"
      ? dndStatus(sheet as DndSheet)
      : system === "op"
      ? opStatus(sheet as OpSheet)
      : system === "op2"
      ? op2Status(sheet as Op2Sheet)
      : customStatus(sheet as CustomSheet);
  return { ...base, conditions: sheet.conditions || [], portrait: sheet.portrait ?? null };
}

/** Mescla uma ficha importada sobre o padrão, para tolerar arquivos antigos/incompletos. */
export function normalizeSheet<T extends AnySheet>(system: SystemKey, raw: unknown, player: string, schema: CustomSchema): T {
  const base = defaultSheet(system, player, schema) as unknown as Record<string, unknown>;
  if (!raw || typeof raw !== "object") return base as unknown as T;
  const out: Record<string, unknown> = { ...base };
  Object.entries(raw as Record<string, unknown>).forEach(([k, v]) => {
    const b = base[k];
    if (b && typeof b === "object" && !Array.isArray(b) && v && typeof v === "object" && !Array.isArray(v)) {
      out[k] = { ...(b as object), ...(v as object) };
    } else if (v !== undefined && v !== null) {
      out[k] = v;
    }
  });
  return out as unknown as T;
}
