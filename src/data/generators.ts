import { Gender, ItemCategoryKey, RaceKey, WidgetType } from "../state/types";

interface RaceDefinition {
  label: string;
  m: string[];
  f: string[];
}

export const RACES: Record<RaceKey, RaceDefinition> = {
  humano: {
    label: "Humano",
    m: ["Aldric", "Bram", "Cedric", "Duncan", "Edmund", "Gareth", "Harlan", "Ivo"],
    f: ["Alara", "Brenna", "Cora", "Delia", "Elena", "Fiora", "Greta", "Ilsa"],
  },
  elfo: {
    label: "Elfo",
    m: ["Aelar", "Berrian", "Caelum", "Drannor", "Elros", "Faelar", "Galinndan", "Immeral"],
    f: ["Aravae", "Bethrynna", "Caelynn", "Drusilia", "Enna", "Faelyn", "Ielenia", "Silaqui"],
  },
  anao: {
    label: "Anão",
    m: ["Adrik", "Baern", "Darrak", "Eberk", "Fargrim", "Gardain", "Harbek", "Kildrak"],
    f: ["Amber", "Bardryn", "Diesa", "Eldeth", "Falkrunn", "Gunnloda", "Helja", "Kathra"],
  },
  orc: {
    label: "Orc/Meio-orc",
    m: ["Bakar", "Dorn", "Grukk", "Hrothgar", "Karg", "Morg", "Ragnok", "Thok"],
    f: ["Baggi", "Emen", "Engong", "Kansif", "Myev", "Neega", "Ovak", "Shautha"],
  },
  halfling: {
    label: "Halfling",
    m: ["Alton", "Beau", "Cade", "Eldon", "Finn", "Garret", "Lindal", "Milo"],
    f: ["Andry", "Bree", "Callie", "Doria", "Euphemia", "Jillian", "Lidda", "Seraphina"],
  },
  tiefling: {
    label: "Tiefling/Draconato",
    m: ["Akmenos", "Damakos", "Ekemon", "Iados", "Kairon", "Mordai", "Rakis", "Therai"],
    f: ["Akta", "Bryseis", "Damaia", "Ea", "Kallista", "Lerissa", "Makaria", "Nemeia"],
  },
  generico: {
    label: "Genérico fantasia",
    m: ["Arden", "Corvin", "Deverell", "Kellan", "Lorric", "Sable", "Thane", "Varek"],
    f: ["Arwen", "Calyx", "Delphine", "Ianthe", "Kestrel", "Lyra", "Sable", "Wren"],
  },
};

export const SURNAMES = [
  "do Vale Sombrio",
  "Punho de Ferro",
  "Filho da Tempestade",
  "das Terras Altas",
  "Lâmina Silenciosa",
  "Coração de Pedra",
  "da Floresta Negra",
  "Olho de Corvo",
  "Sangue Antigo",
  "Lua Cinzenta",
];

interface ItemCategoryDefinition {
  label: string;
  bases: string[];
  adjs: string[];
}

export const ITEM_CATS: Record<ItemCategoryKey, ItemCategoryDefinition> = {
  armas: {
    label: "Armas",
    bases: ["Espada Longa", "Machado de Batalha", "Adaga", "Arco Curto", "Lança", "Maça", "Cimitarra", "Besta Leve"],
    adjs: ["Élfica", "Rúnica", "das Sombras", "do Dragão", "Ancestral", "Amaldiçoada", "Encantada", "do Herói Esquecido"],
  },
  armaduras: {
    label: "Armaduras",
    bases: ["Armadura de Couro", "Cota de Malha", "Placas Completas", "Brigantina", "Escudo Redondo", "Elmo", "Manoplas", "Bracelete"],
    adjs: ["Reforçada", "Élfica", "Anã", "das Sombras", "Sagrada", "Amaldiçoada", "do Guardião", "Rúnica"],
  },
  pocoes: {
    label: "Poções/Consumíveis",
    bases: ["Poção de Cura", "Poção de Veneno", "Elixir de Força", "Óleo Alquímico", "Antídoto", "Poção de Invisibilidade", "Tônico de Resistência", "Fumo Cegante"],
    adjs: ["Menor", "Maior", "Superior", "Instável", "Raro", "Concentrado", "Diluído", "Lendário"],
  },
  magicos: {
    label: "Itens mágicos",
    bases: ["Anel", "Amuleto", "Cajado", "Grimório", "Orbe", "Talismã", "Capa", "Botas"],
    adjs: ["de Teletransporte", "da Invisibilidade", "do Vigor", "das Sombras", "da Tempestade", "Arcano", "Amaldiçoado", "Élfico"],
  },
  tesouro: {
    label: "Tesouro/diversos",
    bases: ["Moedas Antigas", "Gema Lapidada", "Estatueta de Jade", "Colar de Pérolas", "Mapa Rasgado", "Selo de Cera", "Frasco Vazio", "Chave Enferrujada"],
    adjs: ["Valioso", "Misterioso", "Desgastado", "Reluzente", "Amaldiçoado", "Real", "Perdido", "Sagrado"],
  },
};

export interface ConditionPreset {
  label: string;
  color: string;
}

export const CONDITION_PRESETS: ConditionPreset[] = [
  { label: "Cego", color: "#5c6bc0" },
  { label: "Surdo", color: "#8d6e63" },
  { label: "Envenenado", color: "#7cb342" },
  { label: "Atordoado", color: "#fbc02d" },
  { label: "Caído", color: "#8e24aa" },
  { label: "Apavorado", color: "#6d4c41" },
  { label: "Enfeitiçado", color: "#ec407a" },
  { label: "Inconsciente", color: "#455a64" },
];

export interface DiceVisual {
  faces: number;
  clip: string;
  bg: string;
  rim: string;
}

export const DICE_FACES = [4, 6, 8, 10, 12, 20, 100] as const;

export const DICE_VISUALS: Record<number, DiceVisual> = {
  4: { faces: 4, clip: "polygon(50% 4%, 6% 96%, 94% 96%)", bg: "linear-gradient(150deg,#8fd0c1 0%,#65b8a6 45%,#1f6e5c 100%)", rim: "#12463b" },
  6: { faces: 6, clip: "none", bg: "linear-gradient(150deg,#f0c785 0%,#d4a24c 45%,#8a611f 100%)", rim: "#5e4315" },
  8: { faces: 8, clip: "polygon(50% 2%, 96% 50%, 50% 98%, 4% 50%)", bg: "linear-gradient(150deg,#c96b6b 0%,#8b3a3a 45%,#4a1c1c 100%)", rim: "#2e1010" },
  10: { faces: 10, clip: "polygon(50% 2%, 92% 38%, 68% 98%, 32% 98%, 8% 38%)", bg: "linear-gradient(150deg,#8fd0c1 0%,#4a92a1 45%,#1c4a56 100%)", rim: "#0f2d34" },
  12: { faces: 12, clip: "polygon(50% 2%, 95% 33%, 80% 98%, 20% 98%, 5% 33%)", bg: "linear-gradient(150deg,#f0c785 0%,#c98a4a 45%,#7a4a1f 100%)", rim: "#4a2c10" },
  20: { faces: 20, clip: "polygon(25% 3%, 75% 3%, 97% 50%, 75% 97%, 25% 97%, 3% 50%)", bg: "linear-gradient(150deg,#5aa8c9 0%,#2d6073 45%,#12303a 100%)", rim: "#0a1e24" },
  100: { faces: 100, clip: "none", bg: "linear-gradient(150deg,#c96b6b 0%,#8b3a3a 40%,#d4a24c 100%)", rim: "#4a1c1c" },
};

export const WIDGET_TYPES: WidgetType[] = [
  "players",
  "dice",
  "notes",
  "characters",
  "nameGen",
  "itemGen",
  "map",
];

export const WIDGET_LABEL: Record<WidgetType, string> = {
  players: "Ordem de Jogadores",
  dice: "Rolagem de Dados",
  notes: "Anotações",
  characters: "Personagens e Criaturas",
  nameGen: "Criador de Nomes",
  itemGen: "Criador de Itens",
  map: "Mapa",
};

export const WIDGET_SEAL_COLOR: Record<WidgetType, string> = {
  players: "#d4a24c",
  dice: "#65b8a6",
  characters: "#8b3a3a",
  notes: "#65b8a6",
  nameGen: "#d4a24c",
  itemGen: "#8b3a3a",
  map: "#65b8a6",
};

function pick<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function generateRandomName(race: RaceKey, gender: Gender): string {
  const def = RACES[race] || RACES.generico;
  const first = pick(gender === "f" ? def.f : def.m);
  return `${first} ${pick(SURNAMES)}`;
}

export function generateRandomItem(cat: ItemCategoryKey): string {
  const def = ITEM_CATS[cat] || ITEM_CATS.armas;
  return `${pick(def.bases)} ${pick(def.adjs)}`;
}
