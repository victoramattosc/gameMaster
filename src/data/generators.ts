export type RaceKey = "humano" | "elfo" | "anao" | "orc" | "halfling" | "tiefling" | "generico";
export type Gender = "m" | "f";
export type ItemCategoryKey = "armas" | "armaduras" | "pocoes" | "magicos" | "tesouro";

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
