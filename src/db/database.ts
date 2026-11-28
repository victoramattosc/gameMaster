// Banco local (RxDB sobre IndexedDB). Um banco por usuário, para que trocar de conta
// nunca misture dados; ele é apagado no "Sair".
import { addRxPlugin, createRxDatabase, removeRxDatabase, RxCollection, RxDatabase, RxStorage } from "rxdb/plugins/core";
import { getRxStorageDexie } from "rxdb/plugins/storage-dexie";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { migrations, schemas } from "./schemas";
import type {
  CharacterDoc,
  CharacterStatusDoc,
  ChestItemDoc,
  GmStateDoc,
  InviteDoc,
  LobbyMesaDoc,
  MemberDoc,
  MesaDoc,
  MesaFileDoc,
  NotificationDoc,
  PendingInviteDoc,
  ProfileDoc,
  SyncMetaDoc,
} from "./schemas";

addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);

export type GmCollections = {
  profiles: RxCollection<ProfileDoc>;
  mesas: RxCollection<MesaDoc>;
  lobby_mesas: RxCollection<LobbyMesaDoc>;
  pending_invites: RxCollection<PendingInviteDoc>;
  invites: RxCollection<InviteDoc>;
  members: RxCollection<MemberDoc>;
  character_status: RxCollection<CharacterStatusDoc>;
  characters: RxCollection<CharacterDoc>;
  gm_state: RxCollection<GmStateDoc>;
  chest_items: RxCollection<ChestItemDoc>;
  mesa_files: RxCollection<MesaFileDoc>;
  notifications: RxCollection<NotificationDoc>;
  sync_meta: RxCollection<SyncMetaDoc>;
};
export type GmDatabase = RxDatabase<GmCollections>;

const isDev = process.env.NODE_ENV !== "production";

function dbName(userId: string) {
  // Nome precisa casar com /^[a-z][_$a-z0-9\-]*$/.
  return `gm_${userId.toLowerCase().replace(/[^a-z0-9]/g, "")}`;
}

let storagePromise: Promise<RxStorage<any, any>> | null = null;
function getStorage() {
  if (!storagePromise) {
    storagePromise = (async () => {
      const base = getRxStorageDexie();
      if (!isDev) return base;
      // Em desenvolvimento: validação de schema e checagens extras (não vão para o build).
      const [{ RxDBDevModePlugin, disableWarnings }, { wrappedValidateAjvStorage }] = await Promise.all([
        import("rxdb/plugins/dev-mode"),
        import("rxdb/plugins/validate-ajv"),
      ]);
      disableWarnings();
      addRxPlugin(RxDBDevModePlugin);
      return wrappedValidateAjvStorage({ storage: base });
    })();
  }
  return storagePromise;
}

async function create(userId: string): Promise<GmDatabase> {
  const storage = await getStorage();
  const name = dbName(userId);
  const open = async (st: RxStorage<any, any>) => {
    const db = await createRxDatabase<GmCollections>({ name, storage: st, multiInstance: true, ignoreDuplicate: isDev });
    await db.addCollections(
      Object.fromEntries(
        Object.entries(schemas).map(([k, schema]) => [k, { schema, migrationStrategies: migrations[k as keyof typeof schemas] ?? {} }])
      ) as never
    );
    return db;
  };
  try {
    return await open(storage);
  } catch (e) {
    // O banco local é só cache: se o formato salvo não bate com o schema atual
    // (ex.: schema mudou sem migração), recomeçamos do zero em vez de travar o app.
    console.warn("[db] recriando banco local", e);
    try {
      await removeRxDatabase(name, storage);
      return await open(storage);
    } catch (e2) {
      // Sem IndexedDB (ex.: navegação privada em alguns navegadores): cache só em memória.
      console.warn("[db] IndexedDB indisponível, usando memória", e2);
      const { getRxStorageMemory } = await import("rxdb/plugins/storage-memory");
      return open(getRxStorageMemory());
    }
  }
}

// ── Banco do usuário atual ──
// Os hooks pedem `getDb()` antes mesmo do login terminar; a promessa só resolve
// quando `openUserDb` é chamado pelo AuthProvider.

let currentUser: string | null = null;
let current: Promise<GmDatabase> | null = null;
let waiters: ((db: Promise<GmDatabase>) => void)[] = [];

export function openUserDb(userId: string): Promise<GmDatabase> {
  if (currentUser === userId && current) return current;
  if (current) void closeUserDb();
  currentUser = userId;
  current = create(userId);
  waiters.forEach((w) => w(current as Promise<GmDatabase>));
  waiters = [];
  return current;
}

export function getDb(): Promise<GmDatabase> {
  if (current) return current;
  return new Promise<GmDatabase>((resolve, reject) => waiters.push((p) => p.then(resolve, reject)));
}

/** Fecha o banco atual. Com `remove`, apaga os dados locais (usado ao sair da conta). */
export async function closeUserDb(opts: { remove?: boolean } = {}) {
  const p = current;
  const user = currentUser;
  current = null;
  currentUser = null;
  listeners.forEach((l) => l());
  if (!p) return;
  try {
    const db = await p;
    if (opts.remove) await db.remove();
    else await db.close();
  } catch (e) {
    if (opts.remove && user) await removeRxDatabase(dbName(user), await getStorage()).catch(() => undefined);
  }
}

const listeners = new Set<() => void>();
/** Avisa quando o banco é fechado (troca de usuário/saída), para a camada de sync limpar o estado. */
export function onDbClosed(fn: () => void) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
