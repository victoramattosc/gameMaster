// Banco local (RxDB) + sincronização com o Supabase.
//
//  database.ts  abre/fecha o banco do usuário (IndexedDB)
//  schemas.ts   coleções e seus campos
//  sync.ts      escopos: lê local, revalida pelo prazo e mantém em dia pelo Realtime
//  outbox.ts    fila de envio da ficha e das anotações do mestre (funciona offline)
//  hooks.ts     hooks React (`useScope`, `useScopeOne`, `useOnline`)
import { closeUserDb, openUserDb } from "./database";
import { flushOutbox } from "./outbox";
import { revalidateActive } from "./sync";

export { getDb, closeUserDb } from "./database";
export type { GmDatabase } from "./database";
export * from "./schemas";
export { STALE, reloadScope } from "./sync";
export type { ScopeDef } from "./sync";
export { now, pushCharacter, pushGmState, saveCharacterLocal, saveGmStateLocal, writeStatus, flushOutbox } from "./outbox";
export { useScope, useScopeOne, useOnline } from "./hooks";
export type { LiveResult } from "./hooks";

let listening = false;
function listenConnection() {
  if (listening) return;
  listening = true;
  window.addEventListener("online", () => {
    void flushOutbox();
    revalidateActive();
  });
}

/** Abre o banco local do usuário logado e envia o que ficou pendente de outra sessão. */
export async function startLocalData(userId: string) {
  listenConnection();
  await openUserDb(userId);
  void flushOutbox();
}

/** Fecha o banco local; `remove` apaga os dados do aparelho (ao sair da conta). */
export function stopLocalData(remove = false) {
  return closeUserDb({ remove });
}
