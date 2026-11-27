// Sistema personalizado: o mestre define atributos e recursos ao criar a mesa.
import type { CustomSchema, ResourceStatus } from "lib/types";

export interface CustomField {
  id: string;
  label: string;
  type: "text" | "number" | "check" | "list" | "formula";
  value: string;
  checked?: boolean;
  items?: string[];
}

export interface CustomSheet {
  name: string;
  concept: string;
  attrs: Record<string, number>;
  resources: { label: string; color: string; cur: number; max: number }[];
  fields: CustomField[];
  items: { n: string; e: number }[];
  notas: string;
  conditions: string[];
  portrait?: string | null;
}

export const DEFAULT_CUSTOM_SCHEMA: Required<CustomSchema> = {
  attrs: ["Força", "Astúcia", "Engenho", "Coragem"],
  resources: [
    { label: "Vida", color: "#c2412d" },
    { label: "Éter", color: "#3f7cc4" },
  ],
};

export function customDefault(schema: CustomSchema): CustomSheet {
  const attrs: Record<string, number> = {};
  (schema.attrs?.length ? schema.attrs : DEFAULT_CUSTOM_SCHEMA.attrs).forEach((a) => (attrs[a] = 0));
  return {
    name: "",
    concept: "",
    attrs,
    resources: (schema.resources?.length ? schema.resources : DEFAULT_CUSTOM_SCHEMA.resources).map((r) => ({ ...r, cur: 10, max: 10 })),
    fields: [],
    items: [],
    notas: "",
    conditions: [],
  };
}

/** Avalia fórmulas simples como "10 + Agilidade" usando os atributos da ficha. */
export function evalFormula(expr: string, attrs: Record<string, number>): string {
  let e = expr;
  Object.keys(attrs)
    .sort((a, b) => b.length - a.length)
    .forEach((k) => {
      e = e.split(k).join(String(attrs[k] || 0));
    });
  if (!/^[\d\s+\-*/().]+$/.test(e)) return "?";
  try {
    // eslint-disable-next-line no-new-func
    const v = Function(`"use strict";return (${e})`)();
    return Number.isFinite(v) ? String(Math.floor(v)) : "?";
  } catch {
    return "?";
  }
}

export function customStatus(s: CustomSheet): { name: string; role_line: string; defense: number | null; resources: ResourceStatus[] } {
  return {
    name: s.name || "Personagem sem nome",
    role_line: s.concept || "Sistema próprio",
    defense: null,
    resources: s.resources.map((r, i) => ({
      key: "r" + i,
      label: r.label.slice(0, 4).toUpperCase(),
      cur: r.cur,
      max: r.max,
      color: r.color,
    })),
  };
}
