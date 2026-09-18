export type WidgetType =
  | "players"
  | "dice"
  | "notes"
  | "characters"
  | "nameGen"
  | "itemGen"
  | "map";

export type DiceMode = "somar" | "maior" | "menor";

export type RaceKey =
  | "humano"
  | "elfo"
  | "anao"
  | "orc"
  | "halfling"
  | "tiefling"
  | "generico";

export type Gender = "m" | "f";

export type ItemCategoryKey =
  | "armas"
  | "armaduras"
  | "pocoes"
  | "magicos"
  | "tesouro";

export interface Widget {
  id: string;
  type: WidgetType;
  col: number;
  row: number;
  colSpan: number;
  rowSpan: number;
}

export interface Condition {
  id: string;
  label: string;
  color: string;
}

export interface Player {
  id: string;
  name: string;
  conditions: Condition[];
}

export interface Character {
  id: string;
  name: string;
  health: number;
}

export interface Note {
  id: string;
  text: string;
}

export interface MapPointer {
  id: string;
  x: number;
  y: number;
  label: string;
  color: string;
}

export interface MapState {
  imageUrl: string | null;
  pointers: MapPointer[];
}

export interface DiceState {
  tipo: DiceMode;
  qtde: number;
  adicional: number;
  resultText: string;
  rolling: boolean;
  rollFaces: number;
}

export interface NameGenState {
  race: RaceKey;
  gender: Gender;
  current: string;
  history: string[];
}

export interface ItemGenState {
  cat: ItemCategoryKey;
  current: string;
  history: string[];
}

export interface SavedTrack {
  id: string;
  embedUrl: string;
  label: string;
}

export interface MusicState {
  url: string;
  currentEmbedUrl: string;
  saved: SavedTrack[];
}

export interface FileAsset {
  id: string;
  name: string;
  type: string;
  dataUrl: string;
}

export interface Campaign {
  id: string;
  name: string;
  widgets: Widget[];
  players: Player[];
  characters: Character[];
  notes: Note[];
  files: FileAsset[];
  diceState: DiceState;
  nameGen: NameGenState;
  itemGen: ItemGenState;
  music: MusicState;
  map: MapState;
}

export type ConfirmType =
  | "all"
  | "deleteCampaign"
  | WidgetType
  | null;

export interface UiState {
  renamingOpen: boolean;
  renameValue: string;
  musicModalOpen: boolean;
  filesModalOpen: boolean;
  previewFileId: string | null;
  confirmOpen: boolean;
  confirmType: ConfirmType;
  confirmMessage: string;
  mapPlacing: boolean;
  mapPlaceSource: string;
  mapPlaceLabel: string;
  mapPlaceColor: string;
}

export interface AppState {
  campaigns: Campaign[];
  activeId: string | null;
  ui: UiState;
}
