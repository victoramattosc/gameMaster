// Schemas das coleções locais (RxDB). Cada coleção espelha uma tabela/RPC do Supabase.
// Só os campos listados aqui são guardados (ver `pickFields`), então colunas novas no
// banco não quebram o cache: basta adicioná-las aqui e subir a `version` do schema.
import type { RxJsonSchema } from "rxdb/plugins/core";
import type { PendingInvite } from "data/api";
import type {
  AppNotification,
  CharacterStatus,
  ChestItem,
  GmData,
  Invite,
  LobbyMesa,
  Member,
  Mesa,
  MesaFile,
  Profile,
} from "lib/types";

const id = { type: "string", maxLength: 64 } as const;
const str = { type: "string" } as const;
const nstr = { type: ["string", "null"] } as const;
const int = { type: "integer" } as const;
const bool = { type: "boolean" } as const;
const obj = { type: "object" } as const;
const arr = { type: "array" } as const;
/** Campo usado em índice: precisa ter tamanho máximo. */
const key = { type: "string", maxLength: 64 } as const;
const isoDate = { type: "string", maxLength: 40 } as const;

/** Campos locais de documentos editáveis offline (fila de envio). */
export interface Dirty {
  /** true = alteração local ainda não confirmada pelo servidor. */
  dirty: boolean;
}

export type ProfileDoc = Profile;
export type MesaDoc = Mesa;
export type LobbyMesaDoc = LobbyMesa & { position: number };
export type PendingInviteDoc = PendingInvite & { position: number };
export type InviteDoc = Invite;
export type MemberDoc = Member & { id: string };
export type CharacterStatusDoc = CharacterStatus;
export type CharacterDoc = { id: string; mesa_id: string; user_id: string; sheet: unknown; updated_at: string } & Dirty;
export type GmStateDoc = { mesa_id: string; data: GmData; updated_at: string } & Dirty;
export type ChestItemDoc = ChestItem;
export type MesaFileDoc = MesaFile;
export type NotificationDoc = AppNotification;
export type SyncMetaDoc = { id: string; synced_at: number };

const profiles: RxJsonSchema<ProfileDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id,
    display_name: str,
    username: nstr,
    email: nstr,
    color: str,
    dice_anim: bool,
  },
  required: ["id"],
};

const mesas: RxJsonSchema<MesaDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id,
    owner_id: str,
    name: str,
    system: str,
    invite_code: str,
    seats: int,
    status: str,
    next_session: str,
    session_number: int,
    show_status: bool,
    custom_schema: obj,
    created_at: str,
  },
  required: ["id"],
};

const lobby_mesas: RxJsonSchema<LobbyMesaDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id,
    name: str,
    system: str,
    role: str,
    status: str,
    next_session: str,
    seats: int,
    player_count: int,
    players: arr,
    invite_code: nstr,
    session_number: int,
    position: { type: "number", minimum: 0, maximum: 1e9, multipleOf: 1 },
  },
  required: ["id", "position"],
  indexes: ["position"],
};

const pending_invites: RxJsonSchema<PendingInviteDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id,
    mesa_id: str,
    mesa_name: str,
    system: str,
    gm_name: str,
    player_count: int,
    seats: int,
    created_at: str,
    position: { type: "number", minimum: 0, maximum: 1e9, multipleOf: 1 },
  },
  required: ["id", "position"],
  indexes: ["position"],
};

const invites: RxJsonSchema<InviteDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id,
    mesa_id: key,
    invited_by: str,
    invitee_label: str,
    invitee_id: nstr,
    status: str,
    created_at: isoDate,
  },
  required: ["id", "mesa_id", "created_at"],
  indexes: [["mesa_id", "created_at"]],
};

const members: RxJsonSchema<MemberDoc> = {
  version: 0,
  primaryKey: { key: "id", fields: ["mesa_id", "user_id"], separator: "|" },
  type: "object",
  properties: {
    id: { type: "string", maxLength: 130 },
    mesa_id: key,
    user_id: key,
    role: str,
    joined_at: isoDate,
    profile: { type: ["object", "null"] },
  },
  required: ["id", "mesa_id", "user_id", "joined_at"],
  indexes: [["mesa_id", "joined_at"]],
};

const character_status: RxJsonSchema<CharacterStatusDoc> = {
  version: 0,
  primaryKey: "character_id",
  type: "object",
  properties: {
    character_id: id,
    mesa_id: key,
    user_id: key,
    name: str,
    role_line: str,
    color: str,
    portrait_url: nstr,
    defense: { type: ["integer", "null"] },
    resources: arr,
    conditions: arr,
    updated_at: str,
  },
  required: ["character_id", "mesa_id", "user_id"],
  indexes: ["mesa_id", "user_id"],
};

const characters: RxJsonSchema<CharacterDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id,
    mesa_id: key,
    user_id: key,
    sheet: obj,
    updated_at: str,
    dirty: bool,
  },
  required: ["id", "mesa_id", "user_id", "dirty"],
  indexes: [["mesa_id", "user_id"]],
};

const gm_state: RxJsonSchema<GmStateDoc> = {
  version: 0,
  primaryKey: "mesa_id",
  type: "object",
  properties: {
    mesa_id: id,
    data: obj,
    updated_at: str,
    dirty: bool,
  },
  required: ["mesa_id", "dirty"],
};

const chest_items: RxJsonSchema<ChestItemDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id,
    mesa_id: key,
    name: str,
    category: str,
    note: str,
    given_to: nstr,
    claimed: bool,
    created_at: isoDate,
  },
  required: ["id", "mesa_id", "created_at"],
  indexes: [["mesa_id", "created_at"]],
};

const mesa_files: RxJsonSchema<MesaFileDoc> = {
  version: 1,
  primaryKey: "id",
  type: "object",
  properties: {
    id,
    mesa_id: key,
    uploaded_by: str,
    name: str,
    mime: str,
    path: str,
    kind: str,
    shared: bool,
    given_to: arr,
    meta: obj,
    created_at: isoDate,
  },
  required: ["id", "mesa_id", "created_at"],
  indexes: [["mesa_id", "created_at"]],
};

const notifications: RxJsonSchema<NotificationDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id,
    user_id: key,
    kind: str,
    title: str,
    body: str,
    data: obj,
    read: bool,
    created_at: isoDate,
  },
  required: ["id", "user_id", "created_at"],
  indexes: [["user_id", "created_at"]],
};

/** Quando cada "escopo" (ex.: arquivos da mesa X) foi confirmado com o servidor pela última vez. */
const sync_meta: RxJsonSchema<SyncMetaDoc> = {
  version: 0,
  primaryKey: "id",
  type: "object",
  properties: {
    id: { type: "string", maxLength: 200 },
    synced_at: { type: "number" },
  },
  required: ["id", "synced_at"],
};

export const schemas = {
  profiles,
  mesas,
  lobby_mesas,
  pending_invites,
  invites,
  members,
  character_status,
  characters,
  gm_state,
  chest_items,
  mesa_files,
  notifications,
  sync_meta,
};

export type CollectionName = keyof typeof schemas;

/**
 * Migrações do cache local quando um schema sobe de versão (uma função por versão nova).
 * Como é só cache, basta deixar o documento válido: a próxima sincronização traz o resto.
 */
export const migrations: Partial<Record<CollectionName, Record<number, (doc: any) => any>>> = {
  mesa_files: { 1: (doc) => ({ ...doc, given_to: [] }) },
};

/** Mantém só os campos que o schema conhece (o Supabase pode devolver colunas extras). */
export function pickFields<T>(name: CollectionName, row: unknown): T {
  const props = schemas[name].properties as Record<string, unknown>;
  const src = (row || {}) as Record<string, unknown>;
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(props)) if (src[k] !== undefined) out[k] = src[k];
  return out as T;
}
