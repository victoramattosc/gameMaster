// Hooks React sobre o banco local.
import { useCallback, useEffect, useRef, useState } from "react";
import type { RxDocument } from "rxdb/plugins/core";
import { getDb, GmDatabase } from "./database";
import { acquireScope, reloadScope, ScopeDef, ScopeStatus, watchScope } from "./sync";

export interface LiveResult<T> {
  data: T;
  /** true só enquanto não há nada para mostrar (sem cache e sem resposta do servidor). */
  loading: boolean;
  /** Está conferindo com o servidor em segundo plano. */
  refreshing: boolean;
  error: unknown;
  reload: () => Promise<void>;
}

/**
 * Lista reativa de um escopo: lê do banco local na hora e mantém sincronizado com o servidor.
 * Passe `null` para desligar (ex.: usuário ainda não carregou).
 */
export function useScope<T>(def: ScopeDef | null): LiveResult<T[]> {
  const [data, setData] = useState<T[]>([]);
  const [localReady, setLocalReady] = useState(false);
  const [status, setStatus] = useState<ScopeStatus>({ synced: false, fetching: false, error: null });
  const defRef = useRef(def);
  defRef.current = def;
  const key = def?.key ?? null;

  useEffect(() => {
    setLocalReady(false);
    setData([]);
    const d = defRef.current;
    if (!d) return;
    let alive = true;
    const release = acquireScope(d);
    const unwatch = watchScope(d.key, (s) => alive && setStatus(s));
    let sub: { unsubscribe(): void } | undefined;
    getDb()
      .then((db) => {
        if (!alive) return;
        const coll = db[d.collection] as GmDatabase["mesas"];
        // O RxDB recusa campos `undefined` na query: só manda sort/limit quando existem.
        const query: Record<string, unknown> = { selector: d.selector };
        if (d.sort) query.sort = d.sort;
        if (d.limit !== undefined) query.limit = d.limit;
        sub = coll
          .find(query as never)
          .$.subscribe((docs: RxDocument<any>[]) => {
            if (!alive) return;
            setData(docs.map((x) => x.toJSON() as unknown as T));
            setLocalReady(true);
          });
      })
      .catch(() => undefined);
    return () => {
      alive = false;
      sub?.unsubscribe();
      unwatch();
      release();
    };
  }, [key]);

  const reload = useCallback(() => (key ? reloadScope(key) : Promise.resolve()), [key]);
  const hasData = data.length > 0;
  return {
    data,
    loading: Boolean(key) && (!localReady || (!status.synced && !hasData && !status.error)),
    refreshing: status.fetching,
    error: status.error,
    reload,
  };
}

/** Escopo de um documento só (ex.: a mesa aberta). */
export function useScopeOne<T>(def: ScopeDef | null): LiveResult<T | null> {
  const r = useScope<T>(def);
  return { ...r, data: r.data[0] ?? null };
}

/** true quando o navegador está sem internet. */
export function useOnline(): boolean {
  const [online, setOnline] = useState(() => (typeof navigator === "undefined" ? true : navigator.onLine));
  useEffect(() => {
    const on = () => setOnline(true);
    const off = () => setOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);
  return online;
}
