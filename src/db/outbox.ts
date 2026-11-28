// Fila de envio: ficha do jogador e anotações do mestre são gravadas primeiro no banco local
// (marcadas `dirty`) e depois enviadas ao Supabase. Sem internet, ficam na fila e sobem
// sozinhas quando a conexão volta.
import { deepEqual } from "rxdb/plugins/utils";
import { supabase } from "lib/supabase";
import type { Mesa, Profile } from "lib/types";
import { AnySheet, sheetStatus } from "systems";
import { getDb, GmDatabase } from "./database";
import type { CharacterDoc, GmStateDoc } from "./schemas";

const RETRY_MS = 15 * 1000;

const running = new Map<string, Promise<boolean>>();
const again = new Set<string>();
let retryTimer: number | undefined;

/** Garante um envio por documento por vez; se pedirem de novo durante o envio, repete no fim. */
function serial(key: string, fn: () => Promise<boolean>): Promise<boolean> {
  const cur = running.get(key);
  if (cur) {
    again.add(key);
    return cur;
  }
  const p = (async () => {
    let ok = false;
    try {
      do {
        again.delete(key);
        ok = await fn().catch(() => false);
      } while (again.has(key));
    } finally {
      running.delete(key);
    }
    if (!ok) scheduleRetry();
    return ok;
  })();
  running.set(key, p);
  return p;
}

function scheduleRetry() {
  window.clearTimeout(retryTimer);
  retryTimer = window.setTimeout(() => void flushOutbox(), RETRY_MS);
}

export function now() {
  return new Date().toISOString();
}

/** Marca como enviado, desde que ninguém tenha alterado o documento durante o envio. */
async function markClean(doc: { getLatest(): { updated_at?: string }; incrementalPatch(p: { dirty: boolean }): Promise<unknown> }, sentAt: string) {
  if (doc.getLatest().updated_at === sentAt) await doc.incrementalPatch({ dirty: false });
}

// ───────────────────────── Ficha ─────────────────────────

/** Grava a ficha no aparelho (marcada para envio). `updated_at` identifica esta versão. */
export async function saveCharacterLocal(row: Pick<CharacterDoc, "id" | "mesa_id" | "user_id" | "sheet" | "updated_at">) {
  const db = await getDb();
  await db.characters.upsert({ ...row, dirty: true });
}

export function pushCharacter(id: string): Promise<boolean> {
  return serial(`character:${id}`, async () => {
    const db = await getDb();
    const doc = await db.characters.findOne(id).exec();
    if (!doc || !doc.dirty) return true;
    const sent = doc.toJSON();
    const { error } = await supabase
      .from("characters")
      .upsert({ id: sent.id, mesa_id: sent.mesa_id, user_id: sent.user_id, sheet: sent.sheet, updated_at: sent.updated_at });
    if (error) {
      // Ficha criada offline, mas o servidor já tinha uma para esta mesa: fica a do servidor.
      if ((error as { code?: string }).code === "23505") {
        const { data: server } = await supabase
          .from("characters")
          .select("*")
          .eq("mesa_id", sent.mesa_id)
          .eq("user_id", sent.user_id)
          .maybeSingle();
        if (server) {
          await doc.remove();
          await db.characters.upsert({ ...(server as CharacterDoc), dirty: false });
          return true;
        }
      }
      return false;
    }
    await writeStatusFromLocal(db, sent);
    await markClean(doc, sent.updated_at);
    return true;
  });
}

async function writeStatusFromLocal(db: GmDatabase, ch: CharacterDoc) {
  const [mesa, profile] = await Promise.all([
    db.mesas.findOne(ch.mesa_id).exec(),
    db.profiles.findOne(ch.user_id).exec(),
  ]);
  if (!mesa || !profile) return;
  await writeStatus(ch.id, mesa.toJSON() as Mesa, profile.toJSON() as Profile, ch.sheet as AnySheet);
}

/** Grava o resumo da ficha que o mestre vê; pula a request se nada mudou. */
export async function writeStatus(characterId: string, mesa: Mesa, profile: Profile, sheet: AnySheet) {
  const st = sheetStatus(mesa.system, sheet);
  if (!mesa.show_status) {
    // A mesa escolheu não mostrar vida/recursos ao mestre: só nome e condições.
    st.resources = [];
    st.defense = null;
  }
  const row = {
    character_id: characterId,
    mesa_id: mesa.id,
    user_id: profile.id,
    name: st.name,
    role_line: st.role_line,
    color: profile.color,
    portrait_url: st.portrait,
    defense: st.defense,
    resources: st.resources,
    conditions: st.conditions,
  };
  const db = await getDb();
  const cached = await db.character_status.findOne(characterId).exec();
  if (cached) {
    const { updated_at, ...rest } = cached.toJSON();
    if (deepEqual(rest, row)) return;
  }
  const full = { ...row, updated_at: now() };
  const { error } = await supabase.from("character_status").upsert(full);
  if (error) throw error;
  await db.character_status.upsert(full as never);
}

// ───────────────────────── Mestre ─────────────────────────

/** Grava as anotações do mestre no aparelho (marcadas para envio). */
export async function saveGmStateLocal(mesaId: string, data: GmStateDoc["data"], updated_at: string) {
  const db = await getDb();
  await db.gm_state.upsert({ mesa_id: mesaId, data, updated_at, dirty: true });
}

export function pushGmState(mesaId: string): Promise<boolean> {
  return serial(`gm:${mesaId}`, async () => {
    const db = await getDb();
    const doc = await db.gm_state.findOne(mesaId).exec();
    if (!doc || !doc.dirty) return true;
    const sent = doc.toJSON();
    const { error } = await supabase.from("gm_state").upsert({ mesa_id: sent.mesa_id, data: sent.data, updated_at: sent.updated_at });
    if (error) return false;
    await markClean(doc, sent.updated_at);
    return true;
  });
}

// ───────────────────────── Fila ─────────────────────────

/** Envia tudo o que ficou pendente (ao abrir o app e quando a internet volta). */
export async function flushOutbox() {
  if (typeof navigator !== "undefined" && !navigator.onLine) return;
  let db: GmDatabase;
  try {
    db = await getDb();
  } catch {
    return;
  }
  const [chars, gms] = await Promise.all([
    db.characters.find({ selector: { dirty: true } }).exec(),
    db.gm_state.find({ selector: { dirty: true } }).exec(),
  ]);
  await Promise.all([...chars.map((c) => pushCharacter(c.id)), ...gms.map((g) => pushGmState(g.mesa_id))]);
}
