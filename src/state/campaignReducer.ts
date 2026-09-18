import { generateRandomItem, generateRandomName } from "../data/generators";
import { uid } from "../utils/id";
import { defaultCampaign, freshCampaignData, initialUiState } from "./defaults";
import {
  AppState,
  Campaign,
  ConfirmType,
  Gender,
  ItemCategoryKey,
  RaceKey,
  WidgetType,
} from "./types";

export type CampaignAction =
  | { type: "LOAD_STATE"; campaigns: Campaign[]; activeId: string | null }
  | { type: "SELECT_CAMPAIGN"; id: string }
  | { type: "ADD_CAMPAIGN" }
  | { type: "OPEN_RENAME" }
  | { type: "CHANGE_RENAME_VALUE"; value: string }
  | { type: "CANCEL_RENAME" }
  | { type: "CONFIRM_RENAME" }
  | { type: "REQUEST_DELETE_CAMPAIGN" }
  | { type: "REQUEST_CLEAR_ALL" }
  | { type: "REQUEST_CLEAR_WIDGET"; widgetType: WidgetType }
  | { type: "CLOSE_CONFIRM" }
  | { type: "APPLY_CONFIRM" }
  | {
      type: "SET_WIDGET_LAYOUT";
      widgetId: string;
      col?: number;
      row?: number;
      colSpan?: number;
      rowSpan?: number;
    }
  | { type: "ADD_PLAYER"; name: string }
  | { type: "MOVE_PLAYER"; id: string; dir: "up" | "down" }
  | { type: "REMOVE_PLAYER"; id: string }
  | { type: "ADD_CONDITION"; playerId: string; label: string; color: string }
  | { type: "REMOVE_CONDITION"; playerId: string; conditionId: string }
  | { type: "SET_DICE_TIPO"; tipo: Campaign["diceState"]["tipo"] }
  | { type: "ADJUST_DICE_ADICIONAL"; delta: number }
  | { type: "ADJUST_DICE_QTDE"; delta: number }
  | { type: "ROLL_DICE_START"; faces: number }
  | { type: "ROLL_DICE_FINISH"; resultText: string }
  | { type: "ADD_NOTE"; text: string }
  | { type: "REMOVE_NOTE"; id: string }
  | { type: "ADD_CHARACTER"; name: string; health: number }
  | { type: "ADJUST_HEALTH"; id: string; amount: number }
  | { type: "REMOVE_CHARACTER"; id: string }
  | { type: "SET_NAME_RACE"; race: RaceKey }
  | { type: "SET_NAME_GENDER"; gender: Gender }
  | { type: "GENERATE_NAME" }
  | { type: "SET_ITEM_CAT"; cat: ItemCategoryKey }
  | { type: "GENERATE_ITEM" }
  | { type: "TOGGLE_MUSIC_MODAL" }
  | { type: "SET_MUSIC_URL"; url: string }
  | { type: "ADD_MUSIC"; embedUrl: string; label: string }
  | { type: "SELECT_MUSIC"; embedUrl: string }
  | { type: "REMOVE_MUSIC"; id: string }
  | { type: "SET_MAP_IMAGE"; imageUrl: string }
  | { type: "TOGGLE_MAP_PLACING" }
  | { type: "SET_MAP_PLACE_SOURCE"; value: string }
  | { type: "SET_MAP_PLACE_LABEL"; value: string }
  | { type: "SET_MAP_PLACE_COLOR"; value: string }
  | { type: "ADD_MAP_POINTER"; x: number; y: number; label: string; color: string }
  | { type: "MOVE_MAP_POINTER"; id: string; x: number; y: number }
  | { type: "REMOVE_MAP_POINTER"; id: string }
  | { type: "TOGGLE_FILES_MODAL" }
  | { type: "ADD_FILE"; name: string; fileType: string; dataUrl: string }
  | { type: "REMOVE_FILE"; id: string }
  | { type: "OPEN_FILE_PREVIEW"; id: string }
  | { type: "CLOSE_FILE_PREVIEW" };

function mapActiveCampaign(
  state: AppState,
  fn: (campaign: Campaign) => Campaign
): Campaign[] {
  return state.campaigns.map((c) => (c.id === state.activeId ? fn(c) : c));
}

function activeCampaign(state: AppState): Campaign | undefined {
  return state.campaigns.find((c) => c.id === state.activeId);
}

const CONFIRM_MESSAGES: Record<string, string> = {
  deleteCampaign: "Excluir esta mesa e todo o seu conteúdo?",
  all: "Limpar todo o conteúdo desta mesa? O layout será mantido.",
};

export function campaignReducer(state: AppState, action: CampaignAction): AppState {
  switch (action.type) {
    case "LOAD_STATE":
      return { ...state, campaigns: action.campaigns, activeId: action.activeId };

    case "SELECT_CAMPAIGN":
      return { ...state, activeId: action.id };

    case "ADD_CAMPAIGN": {
      const campaign = defaultCampaign(`Mesa ${state.campaigns.length + 1}`);
      return {
        ...state,
        campaigns: [...state.campaigns, campaign],
        activeId: campaign.id,
      };
    }

    case "OPEN_RENAME": {
      const camp = activeCampaign(state);
      return {
        ...state,
        ui: { ...state.ui, renamingOpen: true, renameValue: camp ? camp.name : "" },
      };
    }

    case "CHANGE_RENAME_VALUE":
      return { ...state, ui: { ...state.ui, renameValue: action.value } };

    case "CANCEL_RENAME":
      return { ...state, ui: { ...state.ui, renamingOpen: false } };

    case "CONFIRM_RENAME": {
      const camp = activeCampaign(state);
      const name = state.ui.renameValue.trim() || (camp ? camp.name : "Mesa");
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({ ...c, name })),
        ui: { ...state.ui, renamingOpen: false },
      };
    }

    case "REQUEST_DELETE_CAMPAIGN": {
      if (state.campaigns.length <= 1) return state;
      return {
        ...state,
        ui: {
          ...state.ui,
          confirmOpen: true,
          confirmType: "deleteCampaign",
          confirmMessage: CONFIRM_MESSAGES.deleteCampaign,
        },
      };
    }

    case "REQUEST_CLEAR_ALL":
      return {
        ...state,
        ui: {
          ...state.ui,
          confirmOpen: true,
          confirmType: "all",
          confirmMessage: CONFIRM_MESSAGES.all,
        },
      };

    case "REQUEST_CLEAR_WIDGET":
      return {
        ...state,
        ui: {
          ...state.ui,
          confirmOpen: true,
          confirmType: action.widgetType,
          confirmMessage: "Limpar esta seção?",
        },
      };

    case "CLOSE_CONFIRM":
      return { ...state, ui: { ...state.ui, confirmOpen: false, confirmType: null } };

    case "APPLY_CONFIRM": {
      const type: ConfirmType = state.ui.confirmType;
      const closedUi = { ...state.ui, confirmOpen: false, confirmType: null as ConfirmType };

      if (type === "deleteCampaign") {
        const campaigns = state.campaigns.filter((c) => c.id !== state.activeId);
        return { ...state, campaigns, activeId: campaigns[0]?.id ?? null, ui: closedUi };
      }

      if (type === "all") {
        return {
          ...state,
          campaigns: mapActiveCampaign(state, (c) => ({
            ...c,
            ...freshCampaignData(),
          })),
          ui: closedUi,
        };
      }

      if (type) {
        return {
          ...state,
          campaigns: mapActiveCampaign(state, (c) => {
            switch (type) {
              case "players":
                return { ...c, players: [] };
              case "dice":
                return { ...c, diceState: freshCampaignData().diceState };
              case "notes":
                return { ...c, notes: [] };
              case "characters":
                return { ...c, characters: [] };
              case "nameGen":
                return { ...c, nameGen: { ...c.nameGen, current: "", history: [] } };
              case "itemGen":
                return { ...c, itemGen: { ...c.itemGen, current: "", history: [] } };
              case "map":
                return { ...c, map: { imageUrl: null, pointers: [] } };
              default:
                return c;
            }
          }),
          ui: closedUi,
        };
      }

      return { ...state, ui: closedUi };
    }

    case "SET_WIDGET_LAYOUT":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          widgets: c.widgets.map((w) =>
            w.id === action.widgetId
              ? {
                  ...w,
                  col: action.col ?? w.col,
                  row: action.row ?? w.row,
                  colSpan: action.colSpan ?? w.colSpan,
                  rowSpan: action.rowSpan ?? w.rowSpan,
                }
              : w
          ),
        })),
      };

    case "ADD_PLAYER": {
      const name = action.name.trim();
      if (!name) return state;
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          players: [...c.players, { id: uid(), name, conditions: [] }],
        })),
      };
    }

    case "MOVE_PLAYER":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => {
          const i = c.players.findIndex((p) => p.id === action.id);
          const j = action.dir === "up" ? i - 1 : i + 1;
          if (i < 0 || j < 0 || j >= c.players.length) return c;
          const players = [...c.players];
          const [pl] = players.splice(i, 1);
          players.splice(j, 0, pl);
          return { ...c, players };
        }),
      };

    case "REMOVE_PLAYER":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          players: c.players.filter((p) => p.id !== action.id),
        })),
      };

    case "ADD_CONDITION": {
      const label = action.label.trim();
      if (!label) return state;
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          players: c.players.map((p) =>
            p.id === action.playerId
              ? { ...p, conditions: [...p.conditions, { id: uid(), label, color: action.color }] }
              : p
          ),
        })),
      };
    }

    case "REMOVE_CONDITION":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          players: c.players.map((p) =>
            p.id === action.playerId
              ? { ...p, conditions: p.conditions.filter((cond) => cond.id !== action.conditionId) }
              : p
          ),
        })),
      };

    case "SET_DICE_TIPO":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          diceState: { ...c.diceState, tipo: action.tipo },
        })),
      };

    case "ADJUST_DICE_ADICIONAL":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          diceState: {
            ...c.diceState,
            adicional: Math.max(0, c.diceState.adicional + action.delta),
          },
        })),
      };

    case "ADJUST_DICE_QTDE":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          diceState: { ...c.diceState, qtde: Math.max(1, c.diceState.qtde + action.delta) },
        })),
      };

    case "ROLL_DICE_START":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          diceState: { ...c.diceState, rolling: true, rollFaces: action.faces },
        })),
      };

    case "ROLL_DICE_FINISH":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          diceState: { ...c.diceState, rolling: false, resultText: action.resultText },
        })),
      };

    case "ADD_NOTE": {
      const text = action.text.trim();
      if (!text) return state;
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          notes: [...c.notes, { id: uid(), text }],
        })),
      };
    }

    case "REMOVE_NOTE":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          notes: c.notes.filter((n) => n.id !== action.id),
        })),
      };

    case "ADD_CHARACTER": {
      const name = action.name.trim();
      if (!name) return state;
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          characters: [...c.characters, { id: uid(), name, health: action.health }],
        })),
      };
    }

    case "ADJUST_HEALTH":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          characters: c.characters.map((ch) =>
            ch.id === action.id ? { ...ch, health: ch.health + action.amount } : ch
          ),
        })),
      };

    case "REMOVE_CHARACTER":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          characters: c.characters.filter((ch) => ch.id !== action.id),
        })),
      };

    case "SET_NAME_RACE":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          nameGen: { ...c.nameGen, race: action.race },
        })),
      };

    case "SET_NAME_GENDER":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          nameGen: { ...c.nameGen, gender: action.gender },
        })),
      };

    case "GENERATE_NAME":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => {
          const full = generateRandomName(c.nameGen.race, c.nameGen.gender);
          return {
            ...c,
            nameGen: {
              ...c.nameGen,
              current: full,
              history: [full, ...c.nameGen.history].slice(0, 6),
            },
          };
        }),
      };

    case "SET_ITEM_CAT":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          itemGen: { ...c.itemGen, cat: action.cat },
        })),
      };

    case "GENERATE_ITEM":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => {
          const name = generateRandomItem(c.itemGen.cat);
          return {
            ...c,
            itemGen: {
              ...c.itemGen,
              current: name,
              history: [name, ...c.itemGen.history].slice(0, 6),
            },
          };
        }),
      };

    case "TOGGLE_MUSIC_MODAL":
      return { ...state, ui: { ...state.ui, musicModalOpen: !state.ui.musicModalOpen } };

    case "SET_MUSIC_URL":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          music: { ...c.music, url: action.url },
        })),
      };

    case "ADD_MUSIC":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => {
          const alreadySaved = c.music.saved.some((s) => s.embedUrl === action.embedUrl);
          const saved = alreadySaved
            ? c.music.saved
            : [{ id: uid(), embedUrl: action.embedUrl, label: action.label }, ...c.music.saved].slice(0, 6);
          return {
            ...c,
            music: { ...c.music, url: "", currentEmbedUrl: action.embedUrl, saved },
          };
        }),
      };

    case "SELECT_MUSIC":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          music: { ...c.music, currentEmbedUrl: action.embedUrl },
        })),
      };

    case "REMOVE_MUSIC":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => {
          const saved = c.music.saved.filter((s) => s.id !== action.id);
          const stillExists = saved.some((s) => s.embedUrl === c.music.currentEmbedUrl);
          return {
            ...c,
            music: {
              ...c.music,
              saved,
              currentEmbedUrl: stillExists ? c.music.currentEmbedUrl : saved[0]?.embedUrl || "",
            },
          };
        }),
      };

    case "SET_MAP_IMAGE":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          map: { ...c.map, imageUrl: action.imageUrl },
        })),
      };

    case "TOGGLE_MAP_PLACING":
      return { ...state, ui: { ...state.ui, mapPlacing: !state.ui.mapPlacing } };

    case "SET_MAP_PLACE_SOURCE":
      return { ...state, ui: { ...state.ui, mapPlaceSource: action.value } };

    case "SET_MAP_PLACE_LABEL":
      return { ...state, ui: { ...state.ui, mapPlaceLabel: action.value } };

    case "SET_MAP_PLACE_COLOR":
      return { ...state, ui: { ...state.ui, mapPlaceColor: action.value } };

    case "ADD_MAP_POINTER":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          map: {
            ...c.map,
            pointers: [
              ...c.map.pointers,
              { id: uid(), x: action.x, y: action.y, label: action.label, color: action.color },
            ],
          },
        })),
        ui: { ...state.ui, mapPlacing: false, mapPlaceLabel: "" },
      };

    case "MOVE_MAP_POINTER":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          map: {
            ...c.map,
            pointers: c.map.pointers.map((p) =>
              p.id === action.id ? { ...p, x: action.x, y: action.y } : p
            ),
          },
        })),
      };

    case "REMOVE_MAP_POINTER":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          map: { ...c.map, pointers: c.map.pointers.filter((p) => p.id !== action.id) },
        })),
      };

    case "TOGGLE_FILES_MODAL":
      return { ...state, ui: { ...state.ui, filesModalOpen: !state.ui.filesModalOpen } };

    case "ADD_FILE":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          files: [
            ...c.files,
            { id: uid(), name: action.name, type: action.fileType, dataUrl: action.dataUrl },
          ],
        })),
      };

    case "REMOVE_FILE":
      return {
        ...state,
        campaigns: mapActiveCampaign(state, (c) => ({
          ...c,
          files: c.files.filter((f) => f.id !== action.id),
        })),
        ui: state.ui.previewFileId === action.id ? { ...state.ui, previewFileId: null } : state.ui,
      };

    case "OPEN_FILE_PREVIEW":
      return { ...state, ui: { ...state.ui, previewFileId: action.id } };

    case "CLOSE_FILE_PREVIEW":
      return { ...state, ui: { ...state.ui, previewFileId: null } };

    default:
      return state;
  }
}

export function createInitialAppState(): AppState {
  const campaign = defaultCampaign("Mesa 1");
  return { campaigns: [campaign], activeId: campaign.id, ui: initialUiState() };
}
