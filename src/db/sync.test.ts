/**
 * @jest-environment node
 */
import { addRxPlugin, createRxDatabase } from "rxdb/plugins/core";
import { RxDBDevModePlugin, disableWarnings } from "rxdb/plugins/dev-mode";
import { getRxStorageMemory } from "rxdb/plugins/storage-memory";
import { wrappedValidateAjvStorage } from "rxdb/plugins/validate-ajv";
import { RxDBUpdatePlugin } from "rxdb/plugins/update";
import { RxDBMigrationSchemaPlugin } from "rxdb/plugins/migration-schema";
import type { GmCollections, GmDatabase } from "./database";
import { migrations, schemas } from "./schemas";
import { applyChange, replaceScope } from "./sync";

jest.mock("lib/supabase", () => ({ supabase: {} }));

// O Jest 27 do CRA não expõe a Web Crypto no ambiente node.
if (!(globalThis as { crypto?: unknown }).crypto) (globalThis as { crypto?: unknown }).crypto = require("crypto").webcrypto;

disableWarnings();
addRxPlugin(RxDBDevModePlugin);
addRxPlugin(RxDBUpdatePlugin);
addRxPlugin(RxDBMigrationSchemaPlugin);

let db: GmDatabase;
let n = 0;

beforeEach(async () => {
  db = await createRxDatabase<GmCollections>({
    name: `test${++n}`,
    storage: wrappedValidateAjvStorage({ storage: getRxStorageMemory() }),
  });
  await db.addCollections(
    Object.fromEntries(Object.entries(schemas).map(([k, schema]) => [k, { schema, migrationStrategies: migrations[k as keyof typeof schemas] ?? {} }])) as never
  );
});
afterEach(() => db.remove());

const file = (id: string, mesa = "m1", extra = {}) => ({
  id,
  mesa_id: mesa,
  uploaded_by: "u1",
  name: id,
  mime: "",
  path: `${mesa}/${id}`,
  kind: "file",
  shared: false,
  meta: {},
  created_at: `2026-01-0${id.slice(-1)}T00:00:00Z`,
  ...extra,
});

test("replaceScope grava o escopo, ignora colunas extras e apaga o que sumiu só dentro do escopo", async () => {
  const sel = { collection: "mesa_files" as const, selector: { mesa_id: "m1" } };
  await replaceScope(db, sel, [file("f1", "m1", { coluna_nova: 1 }), file("f2")]);
  await replaceScope(db, { ...sel, selector: { mesa_id: "m2" } }, [file("f3", "m2")]);
  await replaceScope(db, sel, [file("f2")]);
  const ids = (await db.mesa_files.find().exec()).map((d) => d.id).sort();
  expect(ids).toEqual(["f2", "f3"]);
});

test("membros usam chave composta e aceitam perfil do join", async () => {
  const row = { mesa_id: "m1", user_id: "u1", role: "gm", joined_at: "2026-01-01T00:00:00Z", profile: { id: "u1", display_name: "A" } };
  await replaceScope(db, { collection: "members", selector: { mesa_id: "m1" } }, [row]);
  await applyChange(db, "members", { eventType: "DELETE", new: {}, old: { mesa_id: "m1", user_id: "u1" } });
  expect(await db.members.count().exec()).toBe(0);
});

test("ordem de RPC é preservada pela posição", async () => {
  const rows = [{ id: "b", name: "B" }, { id: "a", name: "A" }].map((r) => ({
    ...r, system: "dnd", role: "gm", status: "montando", next_session: "", seats: 5, player_count: 0, players: [], invite_code: null, session_number: 0,
  }));
  await replaceScope(db, { collection: "lobby_mesas", selector: {}, map: (r, i) => ({ ...r, position: i }) }, rows);
  const docs = await db.lobby_mesas.find({ sort: [{ position: "asc" }] }).exec();
  expect(docs.map((d) => d.id)).toEqual(["b", "a"]);
});

test("Realtime: UPDATE parcial mescla e DELETE remove", async () => {
  await replaceScope(db, { collection: "mesa_files", selector: { mesa_id: "m1" } }, [file("f1")]);
  await applyChange(db, "mesa_files", { eventType: "UPDATE", new: { id: "f1", mesa_id: "m1", shared: true }, old: {} });
  const doc = await db.mesa_files.findOne("f1").exec();
  expect(doc?.shared).toBe(true);
  expect(doc?.path).toBe("m1/f1");
  await applyChange(db, "mesa_files", { eventType: "DELETE", new: {}, old: { id: "f1" } });
  expect(await db.mesa_files.count().exec()).toBe(0);
});

test("alteração local pendente (dirty) não é sobrescrita nem apagada pelo servidor", async () => {
  const local = { mesa_id: "m1", data: { notes: "local" }, updated_at: "2026-01-01T00:00:02.000Z", dirty: true };
  await db.gm_state.insert(local);
  const server = { mesa_id: "m1", data: { notes: "server" }, updated_at: "2026-01-01T00:00:05+00:00" };
  await applyChange(db, "gm_state", { eventType: "UPDATE", new: server, old: {} });
  await replaceScope(db, { collection: "gm_state", selector: { mesa_id: "m1" } }, []);
  expect((await db.gm_state.findOne("m1").exec())?.data).toEqual({ notes: "local" });

  // Já enviado: o eco da própria gravação é ignorado, versão mais nova vence.
  await db.gm_state.upsert({ ...local, dirty: false });
  await applyChange(db, "gm_state", { eventType: "UPDATE", new: { ...server, updated_at: "2026-01-01T00:00:02+00:00" }, old: {} });
  expect((await db.gm_state.findOne("m1").exec())?.data).toEqual({ notes: "local" });
  await applyChange(db, "gm_state", { eventType: "UPDATE", new: server, old: {} });
  const doc = await db.gm_state.findOne("m1").exec();
  expect(doc?.data).toEqual({ notes: "server" });
  expect(doc?.dirty).toBe(false);
});
