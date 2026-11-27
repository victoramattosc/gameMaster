export type SystemKey = "dnd" | "op" | "op2" | "custom";
export type Role = "gm" | "player";
export type MesaStatus = "montando" | "proxima" | "em_sessao";

export interface Profile {
  id: string;
  display_name: string;
  username: string | null;
  email: string | null;
  color: string;
  dice_anim: boolean;
}

export interface CustomSchema {
  attrs?: string[];
  resources?: { label: string; color: string }[];
}

export interface Mesa {
  id: string;
  owner_id: string;
  name: string;
  system: SystemKey;
  invite_code: string;
  seats: number;
  status: MesaStatus;
  next_session: string;
  session_number: number;
  show_status: boolean;
  custom_schema: CustomSchema;
  created_at: string;
}

export interface LobbyMesa {
  id: string;
  name: string;
  system: SystemKey;
  role: Role;
  status: MesaStatus;
  next_session: string;
  seats: number;
  player_count: number;
  players: { id: string; name: string; color: string }[];
  invite_code: string | null;
  session_number: number;
}

export interface Member {
  mesa_id: string;
  user_id: string;
  role: Role;
  joined_at: string;
  profile?: Profile;
}

export interface Invite {
  id: string;
  mesa_id: string;
  invited_by: string;
  invitee_label: string;
  invitee_id: string | null;
  status: "pending" | "accepted" | "declined";
  created_at: string;
}

export interface ResourceStatus {
  key: string;
  label: string;
  cur: number;
  max: number;
  color: string;
}

export interface CharacterStatus {
  character_id: string;
  mesa_id: string;
  user_id: string;
  name: string;
  role_line: string;
  color: string;
  portrait_url: string | null;
  defense: number | null;
  resources: ResourceStatus[];
  conditions: string[];
  updated_at: string;
}

export interface CharacterRow<S = unknown> {
  id: string;
  mesa_id: string;
  user_id: string;
  sheet: S;
  updated_at: string;
}

export interface ChestItem {
  id: string;
  mesa_id: string;
  name: string;
  category: string;
  note: string;
  given_to: string | null;
  claimed: boolean;
  created_at: string;
}

export interface MapPointer {
  id: string;
  x: number; // 0..1
  y: number; // 0..1
  label: string;
  color: string;
  kind?: "agent" | "marker";
}

export interface MesaFile {
  id: string;
  mesa_id: string;
  uploaded_by: string;
  name: string;
  mime: string;
  path: string;
  kind: "file" | "book" | "map";
  shared: boolean;
  meta: { pointers?: MapPointer[]; toc?: [string, number][]; pages?: number };
  created_at: string;
}

export interface AppNotification {
  id: string;
  user_id: string;
  kind: "invite" | "map" | "session" | "join" | "item" | "file" | string;
  title: string;
  body: string;
  data: { invite_id?: string; mesa_id?: string; file_id?: string; item_id?: string };
  read: boolean;
  created_at: string;
}

export interface InitiativeEntry {
  id: string;
  name: string;
  value: number;
  kind: "Jogador" | "Criatura" | "NPC";
}

export interface Creature {
  id: string;
  name: string;
  hp: number;
  max: number;
}

export interface SavedTrack {
  id: string;
  label: string;
  embedUrl: string;
  color: string;
}

export interface GmData {
  round?: number;
  turn?: number;
  initiative?: InitiativeEntry[];
  creatures?: Creature[];
  notes?: string;
  tracks?: SavedTrack[];
  currentTrack?: string | null;
}
