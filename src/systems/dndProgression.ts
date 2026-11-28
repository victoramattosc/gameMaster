// Progressão automática da ficha de D&D (regras de 2024).
import { DND_AB, DND_SK, dndMod, DndAb, DndSheet } from "./dnd";
import { DND_BACKGROUNDS, DND_CLASSES, DndClassData, DndFeature } from "./dndData";

const norm = (s: string) => s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z]/g, "");

/** Acha a classe pelo texto digitado ("bárbaro", "Barbaro nv 3"…). */
export function findClass(text: string): string | null {
  const t = norm(text);
  if (!t) return null;
  return Object.keys(DND_CLASSES).find((c) => t.startsWith(norm(c))) || null;
}
export const findBackground = (text: string) => DND_BACKGROUNDS.find((b) => norm(b.name) === norm(text)) || null;

// ───────────────────────── Conjuração ─────────────────────────

type Caster = "full" | "half" | "pact" | "third" | null;
const CASTER: Record<string, Caster> = {
  Bardo: "full", "Clérigo": "full", Druida: "full", Feiticeiro: "full", Mago: "full",
  Paladino: "half", "Guardião": "half", Bruxo: "pact",
};
const THIRD_SUB: Record<string, string> = { "Cavaleiro Místico": "int", "Trapaceiro Arcano": "int" };
export const SPELL_AB: Record<string, DndAb> = {
  Bardo: "car", Bruxo: "car", "Clérigo": "sab", Druida: "sab", Feiticeiro: "car", "Guardião": "sab", Mago: "int", Paladino: "car",
};

// Espaços por nível do personagem (índice 0 = nível 1); cada linha = 1º…9º círculo.
const FULL = [
  [2], [3], [4, 2], [4, 3], [4, 3, 2], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2],
  [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 2, 1, 1, 1],
  [4, 3, 3, 3, 2, 1, 1, 1, 1], [4, 3, 3, 3, 3, 1, 1, 1, 1], [4, 3, 3, 3, 3, 2, 1, 1, 1], [4, 3, 3, 3, 3, 2, 2, 1, 1],
];
const HALF = [
  [2], [2], [3], [3], [4, 2], [4, 2], [4, 3], [4, 3], [4, 3, 2], [4, 3, 2],
  [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1], [4, 3, 3, 2], [4, 3, 3, 2], [4, 3, 3, 3, 1], [4, 3, 3, 3, 1], [4, 3, 3, 3, 2], [4, 3, 3, 3, 2],
];
const THIRD = [
  [], [], [2], [3], [3], [3], [4, 2], [4, 2], [4, 2], [4, 3],
  [4, 3], [4, 3], [4, 3, 2], [4, 3, 2], [4, 3, 2], [4, 3, 3], [4, 3, 3], [4, 3, 3], [4, 3, 3, 1], [4, 3, 3, 1],
];

/** Espaços de magia [truques=0, 1º…9º] para classe/subclasse/nível. */
export function dndSlots(cls: string | null, sub: string | undefined, level: number): number[] | null {
  const lv = Math.max(1, Math.min(20, level));
  const out = Array(10).fill(0);
  const kind: Caster = cls ? CASTER[cls] ?? (sub && THIRD_SUB[sub] ? "third" : null) : null;
  if (!kind) return null;
  if (kind === "pact") {
    const n = lv >= 17 ? 4 : lv >= 11 ? 3 : lv >= 2 ? 2 : 1;
    const circle = Math.min(5, Math.ceil(lv / 2));
    out[circle] = n;
    return out;
  }
  const row = (kind === "full" ? FULL : kind === "half" ? HALF : THIRD)[lv - 1];
  row.forEach((v, i) => (out[i + 1] = v));
  return out;
}

export function spellAbility(cls: string | null, sub?: string): DndAb | null {
  if (!cls) return null;
  if (SPELL_AB[cls]) return SPELL_AB[cls];
  return sub && THIRD_SUB[sub] ? (THIRD_SUB[sub] as DndAb) : null;
}

// ───────────────────────── PV e aumentos ─────────────────────────

/** PV máximo usando o valor fixo por nível (média arredondada para cima). */
export function dndHpMax(c: DndClassData, level: number, conMod: number): number {
  const lv = Math.max(1, level);
  return Math.max(1, c.hd + conMod + (lv - 1) * (c.hd / 2 + 1 + conMod));
}

const ASI: Record<string, number[]> = { Guerreiro: [4, 6, 8, 12, 14, 16], Ladino: [4, 8, 10, 12, 16] };
export const asiLevels = (cls: string) => ASI[cls] || [4, 8, 12, 16];

/** Escolha de um aumento: "attr:for,des" (+1/+1), "attr:for,for" (+2) ou "feat:Nome". */
function attrDelta(choice: string | undefined): Partial<Record<DndAb, number>> {
  const out: Partial<Record<DndAb, number>> = {};
  if (!choice?.startsWith("attr:")) return out;
  choice.slice(5).split(",").forEach((k) => {
    if (DND_AB.some(([x]) => x === k)) out[k as DndAb] = (out[k as DndAb] || 0) + 1;
  });
  return out;
}

// ───────────────────────── Linha do tempo ─────────────────────────

export interface DndStep {
  id: string;
  level: number;
  name: string;
  page?: number;
  kind: "auto" | "subclass" | "asi" | "boon";
  source: string;
}

export function dndSteps(s: DndSheet): DndStep[] {
  const cls = findClass(s.t.classe);
  if (!cls) return [];
  const c = DND_CLASSES[cls];
  const lv = s.level;
  const out: DndStep[] = [];
  const asi = asiLevels(cls);
  c.features.forEach((f: DndFeature, i) => {
    if (f.level > lv) return;
    if (/^Subclasse de/.test(f.name)) {
      out.push({ id: "subclasse", level: f.level, name: f.name, page: f.page, kind: "subclass", source: cls });
    } else if (/Aumento no Valor de Atributo/.test(f.name)) {
      // o livro lista uma vez; os outros níveis vêm da tabela da classe
    } else if (/Dádiva Épica/.test(f.name)) {
      out.push({ id: "dadiva-19", level: f.level, name: f.name, page: f.page, kind: "boon", source: cls });
    } else {
      out.push({ id: `f${i}`, level: f.level, name: f.name, page: f.page, kind: "auto", source: cls });
    }
  });
  const asiPage = c.features.find((f) => /Aumento no Valor/.test(f.name))?.page;
  asi.forEach((n) => n <= lv && out.push({ id: `asi-${n}`, level: n, name: "Aumento no Valor de Atributo", page: asiPage, kind: "asi", source: cls }));
  const sub = c.subclasses.find((x) => x.name === s.subclass);
  sub?.features.forEach((f, i) => f.level <= lv && out.push({ id: `s${i}`, level: f.level, name: f.name, page: f.page, kind: "auto", source: sub.name }));
  return out.sort((a, b) => a.level - b.level || (a.source === b.source ? 0 : a.source === cls ? -1 : 1));
}

// ───────────────────────── Automação ─────────────────────────

const skillKey = (label: string) => {
  const n = norm(label);
  if (n === "lidarcomanimais") return "adestrar";
  return DND_SK.find(([, l]) => norm(l) === n)?.[0] || null;
};

export function applyDndAutomation(prev: DndSheet, next: DndSheet): DndSheet {
  const s: DndSheet = { ...next, choices: { ...(next.choices || {}) }, auto: next.auto || { hp: false, slots: false, saves: false } };
  const cls = findClass(s.t.classe);
  const c = cls ? DND_CLASSES[cls] : null;

  // Troca de classe zera subclasse e escolhas de aumento.
  if (findClass(prev.t.classe) !== cls) {
    s.subclass = undefined;
    Object.keys(s.choices!).forEach((k) => (k.startsWith("asi-") || k === "dadiva-19") && delete s.choices![k]);
  }
  if (s.subclass && c && !c.subclasses.some((x) => x.name === s.subclass)) s.subclass = undefined;

  // Aumentos de atributo: aplica a diferença entre a escolha anterior e a nova.
  const sc = { ...s.sc };
  const levels = cls ? asiLevels(cls) : [];
  const ids = new Set([...Object.keys(prev.choices || {}), ...Object.keys(s.choices!)].filter((k) => k.startsWith("asi-")));
  ids.forEach((id) => {
    const lvl = Number(id.slice(4));
    if (!levels.includes(lvl) || s.level < lvl) delete s.choices![id];
    const before = attrDelta(prev.choices?.[id]);
    const after = attrDelta(s.choices![id]);
    DND_AB.forEach(([k]) => {
      const d = (after[k] || 0) - (before[k] || 0);
      if (d) sc[k] = Math.max(1, Math.min(30, sc[k] + d));
    });
  });
  s.sc = sc;

  // Perícias do antecedente.
  if (prev.t.antecedente !== s.t.antecedente || !next.autoSk) {
    const prof = { ...s.skillProf };
    (s.autoSk || []).forEach((k) => delete prof[k]);
    const gained: string[] = [];
    (findBackground(s.t.antecedente)?.skills || []).forEach((label) => {
      const k = skillKey(label);
      if (k && !prof[k]) {
        prof[k] = true;
        gained.push(k);
      }
    });
    s.skillProf = prof;
    s.autoSk = gained;
  }

  if (c && cls) {
    if (s.auto!.saves) {
      const sp: DndSheet["saveProf"] = {};
      c.saves.forEach((k) => (sp[k] = true));
      s.saveProf = sp;
    }
    if (s.auto!.hp) {
      const max = dndHpMax(c, s.level, dndMod(s, "con"));
      if (max !== s.hpMax) {
        // Mantém o dano sofrido ao subir/descer o máximo.
        const lost = Math.max(0, prev.hpMax - prev.hp);
        s.hpMax = max;
        s.hp = Math.max(0, Math.min(max, max - lost));
      }
      s.t = { ...s.t, dvTotal: `${s.level}d${c.hd}` };
    }
    const ab = spellAbility(cls, s.subclass);
    if (ab && (findClass(prev.t.classe) !== cls || prev.subclass !== s.subclass)) s.spellAb = ab;
    if (s.auto!.slots) {
      const slots = dndSlots(cls, s.subclass, s.level);
      if (slots) {
        s.slots = slots;
        s.used = s.used.map((u, i) => Math.min(u, slots[i]));
        if (!s.t.classeMagia) s.t = { ...s.t, classeMagia: s.subclass && !SPELL_AB[cls] ? s.subclass : cls };
      }
    }
  }
  return s;
}

export function asiLabel(choice?: string): string {
  if (!choice) return "";
  if (choice === "importado") return "Já incluído nos atributos importados";
  if (choice.startsWith("feat:")) return `Talento: ${choice.slice(5)}`;
  const d = attrDelta(choice);
  return Object.entries(d)
    .map(([k, v]) => `+${v} ${DND_AB.find(([x]) => x === k)?.[1].slice(0, 3)}`)
    .join(" · ");
}
