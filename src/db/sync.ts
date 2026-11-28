// Sincronização Supabase → banco local.
//
// Cada consulta da tela é um "escopo" (ex.: `files:<mesa>` = arquivos da mesa). Para cada escopo:
//  1. a tela lê SEMPRE do banco local (aparece na hora, inclusive offline);
//  2. se o cache estiver velho (mais antigo que `staleMs`), busca no servidor e substitui o escopo;
//  3. enquanto alguém usa o escopo, um canal Realtime mantém o cache atualizado:
//     - `apply`: a linha que chegou é gravada/removida direto no banco local (sem nova request);
//     - sem `apply`: refaz a busca do escopo (para RPCs/joins que não dá para montar com a linha).
//  4. ao deixar de ser usado, o canal fica vivo mais um pouco (`LINGER_MS`) para navegação
//     de ida e volta não abrir/fechar canais nem refazer buscas.
import type { RealtimeChannel } from "@supabase/supabase-js";
import type { MangoQuerySelector, MangoQuerySortPart } from "rxdb/plugins/core";
import { deepEqual } from "rxdb/plugins/utils";
import { supabase } from "lib/supabase";
import { getDb, GmDatabase, onDbClosed } from "./database";
import { CollectionName, pickFields } from "./schemas";

/** Quanto tempo cada tipo de dado pode ficar sem confirmar com o servidor. */
export const STALE = {
  /** Muda a toda hora durante a sessão (vida, condições). */
  live: 30 * 1000,
  /** Lobby, convites, notificações. */
  short: 60 * 1000,
  /** Dados da mesa e membros. */
  medium: 5 * 60 * 1000,
  /** Arquivos, baú, anotações do mestre: mudam pouco. */
  long: 10 * 60 * 1000,
} as const;

const LINGER_MS = 2 * 60 * 1000;
const REFETCH_DEBOUNCE_MS = 250;

export interface RealtimeSpec {
  table: string;
  filter?: string;
  /** Grava a linha recebida direto nesta coleção. Sem isso, o evento refaz a busca do escopo. */
  apply?: CollectionName;
}

export interface ScopeDef {
  /** Identifica o escopo de forma única (inclua os ids usados no filtro). */
  key: string;
  collection: CollectionName;
  /** Seleção local equivalente ao filtro da busca no servidor. */
  selector: MangoQuerySelector<any>;
  sort?: MangoQuerySortPart<any>[];
  limit?: number;
  /** Busca todas as linhas do escopo no servidor. */
  fetch: () => Promise<unknown[]>;
  /** Ajusta a linha antes de gravar (ex.: guardar a posição de um RPC ordenado). */
  map?: (row: any, index: number) => unknown;
  realtime: RealtimeSpec[];
  staleMs: number;
}

export interface ScopeStatus {
  /** Já existe cópia confirmada com o servidor em algum momento. */
  synced: boolean;
  fetching: boolean;
  error: unknown;
}

interface Entry {
  def: ScopeDef;
  refs: number;
  channel: RealtimeChannel | null;
  linger: number | undefined;
  refetchTimer: number | undefined;
  inflight: Promise<void> | null;
  syncedAt: number | null;
  metaLoaded: Promise<void>;
  status: ScopeStatus;
  listeners: Set<(s: ScopeStatus) => void>;
  subscribedBefore: boolean;
}

const entries = new Map<string, Entry>();
let channelSeq = 0;

onDbClosed(() => {
  entries.forEach((e) => {
    window.clearTimeout(e.linger);
    window.clearTimeout(e.refetchTimer);
    if (e.channel) supabase.removeChannel(e.channel);
  });
  entries.clear();
});

function setStatus(e: Entry, patch: Partial<ScopeStatus>) {
  e.status = { ...e.status, ...patch };
  e.listeners.forEach((l) => l(e.status));
}

// ───────────────────────── Escrita no banco local ─────────────────────────

/** Coleções editadas offline (ver outbox): alteração local pendente vence o servidor. */
const LOCAL_FIRST = new Set<CollectionName>(["characters", "gm_state"]);

type Row = Record<string, unknown>;

/** A versão do servidor pode sobrescrever a local? */
function serverWins(collection: CollectionName, local: Row | undefined, server: Row) {
  if (!local || !LOCAL_FIRST.has(collection)) return true;
  if (local.dirty) return false;
  // Eco da nossa própria gravação ou versão mais antiga: ignora.
  const t = (v: unknown) => Date.parse(String(v ?? "")) || 0;
  return t(server.updated_at) > t(local.updated_at);
}

function toDoc(collection: CollectionName, coll: GmDatabase["mesas"], raw: unknown): Row {
  const d = pickFields<Row>(collection, raw);
  if (LOCAL_FIRST.has(collection)) d.dirty = false;
  d[coll.schema.primaryPath as string] = coll.schema.getPrimaryOfDocumentData(d as never);
  return d;
}

/** Substitui o conteúdo do escopo pelo que veio do servidor, regravando só o que mudou. */
export async function replaceScope(db: GmDatabase, def: Pick<ScopeDef, "collection" | "selector" | "map">, rows: unknown[]) {
  const coll = db[def.collection] as GmDatabase["mesas"];
  const pk = coll.schema.primaryPath as string;
  const docs = rows.map((r, i) => toDoc(def.collection, coll, def.map ? def.map(r, i) : r));
  const local = await coll.find({ selector: def.selector }).exec();
  const byId = new Map(local.map((d) => [d.primary, d.toJSON() as Row]));
  const keep = new Set(docs.map((d) => d[pk] as string));
  // Documento com envio pendente ainda não existe no servidor: não apagar.
  const gone = local.filter((d) => !keep.has(d.primary) && !(d.toJSON() as Row).dirty).map((d) => d.primary);
  const changed = docs.filter((d) => {
    const cur = byId.get(d[pk] as string);
    return !cur || (!deepEqual(cur, d) && serverWins(def.collection, cur, d));
  });
  if (gone.length) await coll.bulkRemove(gone);
  if (changed.length) await coll.bulkUpsert(changed as never[]);
}

/** Aplica um evento Realtime numa coleção local. */
export async function applyChange(db: GmDatabase, collection: CollectionName, p: { eventType: string; new: unknown; old: unknown }) {
  const coll = db[collection] as GmDatabase["mesas"];
  const pk = coll.schema.primaryPath as string;
  if (p.eventType === "DELETE") {
    const old = pickFields<Record<string, unknown>>(collection, p.old);
    let id: string;
    try {
      id = coll.schema.getPrimaryOfDocumentData(old as never);
    } catch {
      return;
    }
    const doc = await coll.findOne(id).exec();
    if (doc) await doc.remove();
    return;
  }
  const d = toDoc(collection, coll, p.new);
  const found = await coll.findOne(d[pk] as string).exec();
  const cur = found ? (found.toJSON() as Row) : undefined;
  if (!serverWins(collection, cur, d)) return;
  // UPDATE pode vir só com parte das colunas; mesclamos com o que já temos.
  const merged = cur ? { ...cur, ...d } : d;
  if (cur && deepEqual(cur, merged)) return;
  await coll.upsert(merged as never);
}

// ───────────────────────── Escopos ─────────────────────────

async function writeMeta(key: string, at: number) {
  try {
    const db = await getDb();
    await db.sync_meta.upsert({ id: key, synced_at: at });
  } catch {
    /* banco fechado no meio do caminho */
  }
}

function runFetch(e: Entry): Promise<void> {
  if (e.inflight) return e.inflight;
  setStatus(e, { fetching: true });
  const def = e.def;
  e.inflight = (async () => {
    try {
      const [db, rows] = await Promise.all([getDb(), def.fetch()]);
      await replaceScope(db, def, rows);
      e.syncedAt = Date.now();
      void writeMeta(def.key, e.syncedAt);
      setStatus(e, { synced: true, fetching: false, error: null });
    } catch (err) {
      setStatus(e, { fetching: false, error: err });
    } finally {
      e.inflight = null;
    }
  })();
  return e.inflight;
}

function scheduleRefetch(e: Entry) {
  window.clearTimeout(e.refetchTimer);
  e.refetchTimer = window.setTimeout(() => void runFetch(e), REFETCH_DEBOUNCE_MS);
}

function openChannel(e: Entry) {
  const def = e.def;
  // Sem tabelas para ouvir (ex.: ficha, que não está no Realtime): só o prazo `staleMs` vale.
  if (!def.realtime.length) return;
  let ch = supabase.channel(`sync:${def.key}:${++channelSeq}`);
  def.realtime.forEach((s) => {
    ch = ch.on(
      "postgres_changes" as never,
      { event: "*", schema: "public", table: s.table, ...(s.filter ? { filter: s.filter } : {}) } as never,
      ((p: { eventType: string; new: unknown; old: unknown }) => {
        if (s.apply) {
          getDb()
            .then((db) => applyChange(db, s.apply as CollectionName, p))
            .catch(() => scheduleRefetch(e));
        } else scheduleRefetch(e);
      }) as never
    );
  });
  ch.subscribe((status) => {
    if (status !== "SUBSCRIBED") return;
    // Reconexão: eventos podem ter se perdido enquanto o canal estava fora.
    if (e.subscribedBefore) scheduleRefetch(e);
    e.subscribedBefore = true;
  });
  e.channel = ch;
}

function closeChannel(e: Entry) {
  if (!e.channel) return;
  supabase.removeChannel(e.channel);
  e.channel = null;
  e.subscribedBefore = false;
  // Até agora o canal manteve o cache em dia: ele vale como sincronizado neste instante.
  if (e.status.synced && !e.inflight) {
    e.syncedAt = Date.now();
    void writeMeta(e.def.key, e.syncedAt);
  }
}

function isStale(e: Entry) {
  return e.syncedAt === null || Date.now() - e.syncedAt > e.def.staleMs;
}

/** Começa a usar um escopo. Devolve a função para soltá-lo. */
export function acquireScope(def: ScopeDef): () => void {
  let e = entries.get(def.key);
  if (!e) {
    const created: Entry = {
      def,
      refs: 0,
      channel: null,
      linger: undefined,
      refetchTimer: undefined,
      inflight: null,
      syncedAt: null,
      metaLoaded: Promise.resolve(),
      status: { synced: false, fetching: false, error: null },
      listeners: new Set(),
      subscribedBefore: false,
    };
    created.metaLoaded = getDb()
      .then((db) => db.sync_meta.findOne(def.key).exec())
      .then((m) => {
        if (m && created.syncedAt === null) {
          created.syncedAt = m.synced_at;
          setStatus(created, { synced: true });
        }
      })
      .catch(() => undefined);
    entries.set(def.key, created);
    e = created;
  }
  const entry = e;
  entry.def = def; // usa sempre a versão mais nova das funções
  entry.refs++;
  window.clearTimeout(entry.linger);
  const hadChannel = Boolean(entry.channel);
  if (!hadChannel) openChannel(entry);
  // Com o canal aberto o cache está em dia; senão confere a idade do cache.
  if (!hadChannel) {
    void entry.metaLoaded.then(() => {
      if (isStale(entry)) void runFetch(entry);
    });
  }

  let released = false;
  return () => {
    if (released) return;
    released = true;
    entry.refs--;
    if (entry.refs > 0) return;
    entry.linger = window.setTimeout(() => {
      if (entry.refs > 0) return;
      closeChannel(entry);
    }, LINGER_MS);
  };
}

export function reloadScope(key: string): Promise<void> {
  const e = entries.get(key);
  return e ? runFetch(e) : Promise.resolve();
}

export function watchScope(key: string, fn: (s: ScopeStatus) => void): () => void {
  const e = entries.get(key);
  if (!e) return () => undefined;
  e.listeners.add(fn);
  fn(e.status);
  return () => e.listeners.delete(fn);
}

/** Força revalidar tudo que está em uso (ex.: a conexão voltou). */
export function revalidateActive() {
  entries.forEach((e) => {
    if (e.refs > 0 || e.channel) scheduleRefetch(e);
  });
}
