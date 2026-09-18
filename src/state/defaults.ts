import { uid } from "../utils/id";
import { Campaign, UiState, Widget } from "./types";

export function defaultWidgets(): Widget[] {
  return [
    { id: uid(), type: "players", col: 1, row: 1, colSpan: 4, rowSpan: 9 },
    { id: uid(), type: "dice", col: 5, row: 1, colSpan: 4, rowSpan: 9 },
    { id: uid(), type: "characters", col: 9, row: 1, colSpan: 4, rowSpan: 9 },
    { id: uid(), type: "notes", col: 1, row: 10, colSpan: 4, rowSpan: 8 },
    { id: uid(), type: "nameGen", col: 5, row: 10, colSpan: 4, rowSpan: 8 },
    { id: uid(), type: "itemGen", col: 9, row: 10, colSpan: 4, rowSpan: 8 },
    { id: uid(), type: "map", col: 1, row: 18, colSpan: 12, rowSpan: 16 },
  ];
}

export function freshCampaignData(): Omit<Campaign, "id" | "name" | "widgets"> {
  return {
    players: [],
    characters: [],
    notes: [],
    files: [],
    diceState: {
      tipo: "somar",
      qtde: 1,
      adicional: 0,
      resultText: "Resultado",
      rolling: false,
      rollFaces: 20,
    },
    nameGen: { race: "humano", gender: "m", current: "", history: [] },
    itemGen: { cat: "armas", current: "", history: [] },
    music: { url: "", currentEmbedUrl: "", saved: [] },
    map: { imageUrl: null, pointers: [] },
  };
}

export function defaultCampaign(name: string): Campaign {
  return {
    id: uid(),
    name,
    widgets: defaultWidgets(),
    ...freshCampaignData(),
  };
}

export function initialUiState(): UiState {
  return {
    renamingOpen: false,
    renameValue: "",
    musicModalOpen: false,
    filesModalOpen: false,
    previewFileId: null,
    confirmOpen: false,
    confirmType: null,
    confirmMessage: "",
    mapPlacing: false,
    mapPlaceSource: "__custom__",
    mapPlaceLabel: "",
    mapPlaceColor: "#8b3a3a",
  };
}
