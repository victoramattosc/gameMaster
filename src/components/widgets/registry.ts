import { ComponentType } from "react";
import { WidgetType } from "../../state/types";
import { CharactersWidget } from "./CharactersWidget";
import { DiceWidget } from "./DiceWidget";
import { ItemGenWidget } from "./ItemGenWidget";
import { MapWidget } from "./MapWidget";
import { NameGenWidget } from "./NameGenWidget";
import { NotesWidget } from "./NotesWidget";
import { PlayersWidget } from "./PlayersWidget";

export const WIDGET_REGISTRY: Record<WidgetType, ComponentType> = {
  players: PlayersWidget,
  dice: DiceWidget,
  notes: NotesWidget,
  characters: CharactersWidget,
  nameGen: NameGenWidget,
  itemGen: ItemGenWidget,
  map: MapWidget,
};
