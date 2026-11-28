// Camada de dados: leitura via banco local (RxDB, ver src/db) sincronizado com o Supabase,
// e escritas direto no Supabase (o Realtime devolve a mudança para o banco local).
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "lib/supabase";
import type {
  AppNotification,
  CharacterStatus,
  ChestItem,
  CustomSchema,
  GmData,
  Invite,
  LobbyMesa,
  Member,
  Mesa,
  MesaFile,
  MesaStatus,
  Profile,
  SystemKey,
} from "lib/types";
import { AnySheet, normalizeSheet } from "systems";
import { now, pushCharacter, pushGmState, saveCharacterLocal, saveGmStateLocal, STALE, useScope, useScopeOne, writeStatus } from "db";
import type { CharacterDoc, GmStateDoc } from "db";

function check<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

function one<T>(row: T | null): T[] {
  return row ? [row] : [];
}

// ───────────────────────── Lobby ─────────────────────────

export interface PendingInvite {
  id: string;
  mesa_id: string;
  mesa_name: string;
  system: SystemKey;
  gm_name: string;
  player_count: number;
  seats: number;
  created_at: string;
}

export function useLobby(userId: string | undefined) {
  const mesas = useScope<LobbyMesa>(
    userId
      ? {
          key: "lobby",
          collection: "lobby_mesas",
          selector: {},
          sort: [{ position: "asc" }],
          fetch: async () => check(await supabase.rpc("my_mesas")) as LobbyMesa[],
          map: (r, i) => ({ ...r, position: i }),
          // RPC com joins: qualquer mudança refaz a busca.
          realtime: [{ table: "mesa_members" }, { table: "mesas" }, { table: "character_status", filter: `user_id=eq.${userId}` }],
          staleMs: STALE.short,
        }
      : null
  );
  const invites = useScope<PendingInvite>(
    userId
      ? {
          key: "lobby-invites",
          collection: "pending_invites",
          selector: {},
          sort: [{ position: "asc" }],
          fetch: async () => check(await supabase.rpc("my_invites")) as PendingInvite[],
          map: (r, i) => ({ ...r, position: i }),
          realtime: [{ table: "invites", filter: `invitee_id=eq.${userId}` }],
          staleMs: STALE.short,
        }
      : null
  );
  return { mesas, invites };
}

/** Status das minhas fichas (para o card "Mesas em que eu jogo"). */
export function useMyStatuses(userId: string | undefined) {
  return useScope<CharacterStatus>(
    userId
      ? {
          key: "my-status",
          collection: "character_status",
          selector: { user_id: userId },
          fetch: async () => check(await supabase.from("character_status").select("*").eq("user_id", userId)) as CharacterStatus[],
          realtime: [{ table: "character_status", filter: `user_id=eq.${userId}`, apply: "character_status" }],
          staleMs: STALE.short,
        }
      : null
  );
}

export async function createMesa(input: {
  name: string;
  system: SystemKey;
  seats: number;
  showStatus: boolean;
  customSchema: CustomSchema;
}): Promise<Mesa> {
  return check(
    await supabase.rpc("create_mesa", {
      p_name: input.name,
      p_system: input.system,
      p_seats: input.seats,
      p_show_status: input.showStatus,
      p_custom_schema: input.customSchema,
    })
  ) as Mesa;
}

export async function joinByCode(code: string): Promise<string> {
  return check(await supabase.rpc("join_by_code", { p_code: code })) as string;
}

export async function respondInvite(id: string, accept: boolean): Promise<string> {
  return check(await supabase.rpc("respond_invite", { p_invite: id, p_accept: accept })) as string;
}

// ───────────────────────── Mesa ─────────────────────────

export function useMesa(mesaId: string | undefined) {
  const mesa = useScopeOne<Mesa>(
    mesaId
      ? {
          key: `mesa:${mesaId}`,
          collection: "mesas",
          selector: { id: mesaId },
          fetch: async () => one(check(await supabase.from("mesas").select("*").eq("id", mesaId).maybeSingle()) as Mesa | null),
          realtime: [{ table: "mesas", filter: `id=eq.${mesaId}`, apply: "mesas" }],
          staleMs: STALE.medium,
        }
      : null
  );
  const members = useScope<Member>(
    mesaId
      ? {
          key: `members:${mesaId}`,
          collection: "members",
          selector: { mesa_id: mesaId },
          sort: [{ joined_at: "asc" }],
          fetch: async () =>
            check(
              await supabase.from("mesa_members").select("*, profile:profiles(*)").eq("mesa_id", mesaId).order("joined_at")
            ) as Member[],
          // O join com o perfil não vem no evento: refaz a busca.
          realtime: [{ table: "mesa_members", filter: `mesa_id=eq.${mesaId}` }],
          staleMs: STALE.medium,
        }
      : null
  );
  return { mesa, members };
}

export async function updateMesa(id: string, patch: Partial<Pick<Mesa, "name" | "seats" | "show_status" | "next_session">>) {
  check(await supabase.from("mesas").update(patch).eq("id", id));
}

export async function setSession(mesaId: string, status: MesaStatus, next?: string) {
  check(await supabase.rpc("set_session", { p_mesa: mesaId, p_status: status, p_next: next ?? null }));
}

export async function deleteMesa(id: string) {
  check(await supabase.from("mesas").delete().eq("id", id));
}

export async function removeMember(mesaId: string, userId: string) {
  check(await supabase.from("mesa_members").delete().eq("mesa_id", mesaId).eq("user_id", userId));
}

export function useInvites(mesaId: string | undefined, enabled: boolean) {
  return useScope<Invite>(
    mesaId && enabled
      ? {
          key: `invites:${mesaId}`,
          collection: "invites",
          selector: { mesa_id: mesaId, status: "pending" },
          sort: [{ created_at: "asc" }],
          fetch: async () =>
            check(
              await supabase.from("invites").select("*").eq("mesa_id", mesaId).eq("status", "pending").order("created_at")
            ) as Invite[],
          realtime: [{ table: "invites", filter: `mesa_id=eq.${mesaId}`, apply: "invites" }],
          staleMs: STALE.short,
        }
      : null
  );
}

export async function invitePlayer(mesaId: string, who: string): Promise<Invite> {
  return check(await supabase.rpc("invite_player", { p_mesa: mesaId, p_who: who })) as Invite;
}

export async function cancelInvite(id: string) {
  check(await supabase.from("invites").delete().eq("id", id));
}

export function inviteLink(code: string) {
  return `${window.location.origin}/entrar?convite=${encodeURIComponent(code)}`;
}

// ───────────────────────── Status e presença ─────────────────────────

export function useStatuses(mesaId: string | undefined) {
  return useScope<CharacterStatus>(
    mesaId
      ? {
          key: `status:${mesaId}`,
          collection: "character_status",
          selector: { mesa_id: mesaId },
          fetch: async () => check(await supabase.from("character_status").select("*").eq("mesa_id", mesaId)) as CharacterStatus[],
          realtime: [{ table: "character_status", filter: `mesa_id=eq.${mesaId}`, apply: "character_status" }],
          staleMs: STALE.live,
        }
      : null
  );
}

export async function setConditions(characterId: string, conditions: string[]) {
  check(await supabase.from("character_status").update({ conditions }).eq("character_id", characterId));
}

/** Quem está com a mesa aberta agora (Realtime Presence). */
export function usePresence(mesaId: string | undefined, userId: string | undefined): Set<string> {
  const [online, setOnline] = useState<Set<string>>(new Set());
  useEffect(() => {
    if (!mesaId || !userId) return;
    const ch = supabase.channel(`presence-${mesaId}`, { config: { presence: { key: userId } } });
    ch.on("presence", { event: "sync" }, () => {
      setOnline(new Set(Object.keys(ch.presenceState())));
    });
    ch.subscribe(async (status) => {
      if (status === "SUBSCRIBED") await ch.track({ at: Date.now() });
    });
    return () => {
      supabase.removeChannel(ch);
    };
  }, [mesaId, userId]);
  return online;
}

// ───────────────────────── Mestre ─────────────────────────

/**
 * Anotações do mestre: editadas na tela, gravadas no aparelho e enviadas ao servidor
 * (funciona offline; sobe quando a conexão volta).
 */
export function useGmState(mesaId: string | undefined, enabled: boolean) {
  const scope = useScopeOne<GmStateDoc>(
    mesaId && enabled
      ? {
          key: `gm:${mesaId}`,
          collection: "gm_state",
          selector: { mesa_id: mesaId },
          fetch: async () => one(check(await supabase.from("gm_state").select("*").eq("mesa_id", mesaId).maybeSingle())),
          realtime: [{ table: "gm_state", filter: `mesa_id=eq.${mesaId}`, apply: "gm_state" }],
          staleMs: STALE.long,
        }
      : null
  );
  const [data, setDataState] = useState<GmData>({});
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<GmData | null>(null);
  /** `updated_at` da versão que está na tela. */
  const version = useRef<string | null>(null);

  useEffect(() => {
    version.current = null;
    pending.current = null;
    setDataState({});
  }, [mesaId]);

  // Versão nova no banco local (outro dispositivo/aba): aplica se não houver edição em andamento.
  const doc = scope.data;
  useEffect(() => {
    if (!doc || pending.current || doc.updated_at === version.current) return;
    version.current = doc.updated_at;
    setDataState((doc.data as GmData) || {});
    if (doc.dirty) void pushGmState(doc.mesa_id);
  }, [doc]);

  const flush = useCallback(async () => {
    window.clearTimeout(timer.current);
    if (!mesaId || !pending.current) return;
    const d = pending.current;
    pending.current = null;
    const ts = now();
    version.current = ts;
    await saveGmStateLocal(mesaId, d, ts);
    await pushGmState(mesaId);
  }, [mesaId]);

  useEffect(() => () => void flush(), [flush]);

  const update = useCallback(
    (fn: (d: GmData) => GmData) => {
      setDataState((prev) => {
        const next = fn(prev);
        pending.current = next;
        window.clearTimeout(timer.current);
        timer.current = window.setTimeout(flush, 600);
        return next;
      });
    },
    [flush]
  );

  return { data, update, loading: scope.loading };
}

export function useChest(mesaId: string | undefined, enabled: boolean) {
  return useScope<ChestItem>(
    mesaId && enabled
      ? {
          key: `chest:${mesaId}`,
          collection: "chest_items",
          selector: { mesa_id: mesaId },
          sort: [{ created_at: "asc" }],
          fetch: async () => check(await supabase.from("chest_items").select("*").eq("mesa_id", mesaId).order("created_at")) as ChestItem[],
          realtime: [{ table: "chest_items", filter: `mesa_id=eq.${mesaId}`, apply: "chest_items" }],
          staleMs: STALE.long,
        }
      : null
  );
}

export async function addChestItem(mesaId: string, item: { name: string; category: string; note: string }) {
  check(await supabase.from("chest_items").insert({ mesa_id: mesaId, ...item }));
}
export async function deleteChestItem(id: string) {
  check(await supabase.from("chest_items").delete().eq("id", id));
}
export async function giveChestItem(id: string, userId: string) {
  check(await supabase.rpc("give_chest_item", { p_item: id, p_user: userId }));
}

/** Itens do baú entregues a mim nesta mesa. */
export function useReceivedItems(mesaId: string | undefined, userId: string | undefined) {
  return useScope<ChestItem>(
    mesaId && userId
      ? {
          key: `received:${mesaId}`,
          collection: "chest_items",
          selector: { mesa_id: mesaId, given_to: userId, claimed: false },
          fetch: async () =>
            check(
              await supabase.from("chest_items").select("*").eq("mesa_id", mesaId).eq("given_to", userId).eq("claimed", false)
            ) as ChestItem[],
          realtime: [{ table: "chest_items", filter: `given_to=eq.${userId}`, apply: "chest_items" }],
          staleMs: STALE.medium,
        }
      : null
  );
}
/** Tudo que o mestre já me entregou nesta mesa (guardado na ficha ou não). */
export function useMyItems(mesaId: string | undefined, userId: string | undefined) {
  return useScope<ChestItem>(
    mesaId && userId
      ? {
          key: `my-items:${mesaId}`,
          collection: "chest_items",
          selector: { mesa_id: mesaId, given_to: userId },
          sort: [{ created_at: "asc" }],
          fetch: async () =>
            check(await supabase.from("chest_items").select("*").eq("mesa_id", mesaId).eq("given_to", userId).order("created_at")) as ChestItem[],
          realtime: [{ table: "chest_items", filter: `given_to=eq.${userId}`, apply: "chest_items" }],
          staleMs: STALE.medium,
        }
      : null
  );
}
export async function claimItem(id: string) {
  check(await supabase.from("chest_items").update({ claimed: true }).eq("id", id));
}

// ───────────────────────── Arquivos ─────────────────────────

export function useFiles(mesaId: string | undefined) {
  return useScope<MesaFile>(
    mesaId
      ? {
          key: `files:${mesaId}`,
          collection: "mesa_files",
          selector: { mesa_id: mesaId },
          sort: [{ created_at: "asc" }],
          fetch: async () => check(await supabase.from("mesa_files").select("*").eq("mesa_id", mesaId).order("created_at")) as MesaFile[],
          realtime: [{ table: "mesa_files", filter: `mesa_id=eq.${mesaId}`, apply: "mesa_files" }],
          staleMs: STALE.long,
        }
      : null
  );
}

/** Limite do plano gratuito do Supabase Storage. */
export const MAX_UPLOAD_BYTES = 50 * 1024 * 1024;

export function checkUploadSize(file: File) {
  if (file.size > MAX_UPLOAD_BYTES) {
    const mb = (file.size / 1024 / 1024).toFixed(1).replace(".", ",");
    throw new Error(`“${file.name}” tem ${mb} MB. O limite é 50 MB por arquivo.`);
  }
}

export async function uploadMesaFile(
  mesaId: string,
  userId: string,
  file: File,
  kind: MesaFile["kind"],
  shared = false
): Promise<MesaFile> {
  checkUploadSize(file);
  const safe = file.name.replace(/[^\w.-]+/g, "_").slice(-80);
  const path = `${mesaId}/${crypto.randomUUID()}-${safe}`;
  const up = await supabase.storage.from("mesa-files").upload(path, file, { contentType: file.type || undefined });
  if (up.error) throw up.error;
  const row = await supabase
    .from("mesa_files")
    .insert({ mesa_id: mesaId, uploaded_by: userId, name: file.name.replace(/\.[^.]+$/, ""), mime: file.type, path, kind, shared: false })
    .select()
    .single();
  const created = check(row) as MesaFile;
  if (shared) await shareFile(created.id, true);
  return created;
}

export async function shareFile(id: string, shared: boolean) {
  check(await supabase.rpc("share_file", { p_file: id, p_shared: shared }));
}

/** Entrega (ou retira) um arquivo a um jogador específico. */
export async function giveFile(id: string, userId: string, give = true) {
  check(await supabase.rpc("give_file", { p_file: id, p_user: userId, p_give: give }));
}

export async function updateFileMeta(id: string, meta: MesaFile["meta"]) {
  check(await supabase.from("mesa_files").update({ meta }).eq("id", id));
}

export async function deleteMesaFile(f: MesaFile) {
  await supabase.storage.from("mesa-files").remove([f.path]);
  check(await supabase.from("mesa_files").delete().eq("id", f.id));
}

const signedCache = new Map<string, { url: string; exp: number }>();
export async function signedUrl(path: string): Promise<string> {
  const hit = signedCache.get(path);
  if (hit && hit.exp > Date.now()) return hit.url;
  const { data, error } = await supabase.storage.from("mesa-files").createSignedUrl(path, 60 * 60);
  if (error) throw error;
  signedCache.set(path, { url: data.signedUrl, exp: Date.now() + 55 * 60 * 1000 });
  return data.signedUrl;
}

export function useSignedUrl(path: string | undefined | null) {
  const [url, setUrl] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    setUrl(null);
    if (path) signedUrl(path).then((u) => alive && setUrl(u)).catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [path]);
  return url;
}

export async function uploadPortrait(userId: string, file: File): Promise<string> {
  checkUploadSize(file);
  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const up = await supabase.storage.from("portraits").upload(path, file, { contentType: file.type || undefined });
  if (up.error) throw up.error;
  return supabase.storage.from("portraits").getPublicUrl(path).data.publicUrl;
}

/**
 * Apaga do Storage um retrato que deixou de ser usado. Se o mesmo retrato ainda aparece em
 * outra ficha minha (ex.: ficha copiada de outra mesa), mantém o arquivo.
 */
export async function deletePortrait(userId: string, url: string | null | undefined) {
  const marker = "/object/public/portraits/";
  const i = url ? url.indexOf(marker) : -1;
  if (!url || i < 0) return;
  const path = decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
  if (!path.startsWith(`${userId}/`)) return;
  const { data } = await supabase.from("character_status").select("character_id").eq("user_id", userId).eq("portrait_url", url);
  if ((data?.length ?? 0) > 1) return;
  const { error } = await supabase.storage.from("portraits").remove([path]);
  if (error) throw error;
}

// ───────────────────────── Notificações ─────────────────────────

export function useNotifications(userId: string | undefined) {
  const live = useScope<AppNotification>(
    userId
      ? {
          key: "notifications",
          collection: "notifications",
          selector: { user_id: userId },
          sort: [{ created_at: "desc" }],
          limit: 40,
          fetch: async () =>
            check(
              await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(40)
            ) as AppNotification[],
          realtime: [{ table: "notifications", filter: `user_id=eq.${userId}`, apply: "notifications" }],
          staleMs: STALE.short,
        }
      : null
  );
  const unread = useMemo(() => live.data.filter((x) => !x.read).length, [live.data]);
  return { ...live, unread };
}

export async function markAllRead(userId: string) {
  check(await supabase.from("notifications").update({ read: true }).eq("user_id", userId).eq("read", false));
}
export async function deleteNotification(id: string) {
  check(await supabase.from("notifications").delete().eq("id", id));
}

// ───────────────────────── Ficha do jogador ─────────────────────────

export interface OtherCharacter {
  id: string;
  mesa_name: string;
  name: string;
  sheet: unknown;
}

export async function myOtherCharacters(system: SystemKey, excludeMesa: string): Promise<OtherCharacter[]> {
  return check(await supabase.rpc("my_other_characters", { p_system: system, p_exclude: excludeMesa })) as OtherCharacter[];
}

export type SaveState = "idle" | "saving" | "saved" | "offline" | "error";

/** Fichas criadas nesta sessão que ainda podem não ter chegado ao banco local. */
const creatingIds = new Map<string, string>();

/**
 * Carrega (ou cria) a ficha do usuário nesta mesa e grava automaticamente: primeiro no
 * aparelho (funciona offline), depois no servidor, mantendo `character_status`
 * (o que o mestre vê) em sincronia.
 */
export function useMyCharacter<S extends AnySheet>(mesa: Mesa | null, profile: Profile | null) {
  const mesaId = mesa?.id;
  const system = mesa?.system;
  const userId = profile?.id;

  const scope = useScopeOne<CharacterDoc>(
    mesaId && userId
      ? {
          key: `character:${mesaId}`,
          collection: "characters",
          selector: { mesa_id: mesaId, user_id: userId },
          fetch: async () =>
            one(check(await supabase.from("characters").select("*").eq("mesa_id", mesaId).eq("user_id", userId).maybeSingle())),
          // A tabela de fichas não está no Realtime: revalida pelo prazo.
          realtime: [],
          staleMs: STALE.medium,
        }
      : null
  );

  const [sheet, setSheet] = useState<S | null>(null);
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("idle");
  const timer = useRef<number | undefined>(undefined);
  /** Versão editada esperando o debounce para ser gravada. */
  const pending = useRef<S | null>(null);
  const latest = useRef<S | null>(null);
  const charIdRef = useRef<string | null>(null);
  /** `updated_at` da versão que está na tela. */
  const version = useRef<string | null>(null);
  const ctx = useRef({ mesa, profile });
  ctx.current = { mesa, profile };

  const save = useCallback(async () => {
    window.clearTimeout(timer.current);
    const next = pending.current;
    const id = charIdRef.current;
    const { mesa, profile } = ctx.current;
    pending.current = null;
    if (!next || !id || !mesa || !profile) return;
    const ts = now();
    version.current = ts;
    await saveCharacterLocal({ id, mesa_id: mesa.id, user_id: profile.id, sheet: next, updated_at: ts });
    const ok = await pushCharacter(id);
    setSaveState(ok ? "saved" : navigator.onLine ? "error" : "offline");
  }, []);

  const persist = useCallback(
    (next: S) => {
      pending.current = next;
      setSaveState("saving");
      window.clearTimeout(timer.current);
      timer.current = window.setTimeout(save, 700);
    },
    [save]
  );

  // Trocou de mesa/usuário (ou saiu da tela): grava o pendente e zera o estado.
  useEffect(
    () => () => {
      void save();
      setSheet(null);
      setCharacterId(null);
      latest.current = null;
      charIdRef.current = null;
      version.current = null;
    },
    [save, mesaId, userId]
  );

  // Ficha do banco local → tela.
  const doc = scope.data;
  const scopeLoading = scope.loading;
  useEffect(() => {
    const { mesa, profile } = ctx.current;
    if (!mesa || !profile || scopeLoading || pending.current) return;
    if (!doc) {
      if (charIdRef.current) return; // já criada, esperando o banco local
      // Primeira vez nesta mesa: cria a ficha no aparelho e envia.
      const fresh = normalizeSheet<S>(mesa.system, {}, profile.display_name, mesa.custom_schema);
      const k = `${mesa.id}:${profile.id}`;
      const newId = creatingIds.get(k) ?? crypto.randomUUID();
      creatingIds.set(k, newId); // StrictMode roda o efeito duas vezes: mesma ficha, mesmo id
      charIdRef.current = newId;
      setCharacterId(charIdRef.current);
      latest.current = fresh;
      setSheet(fresh);
      pending.current = fresh;
      void save();
      return;
    }
    if (doc.updated_at === version.current) return;
    version.current = doc.updated_at;
    const s = normalizeSheet<S>(mesa.system, doc.sheet, profile.display_name, mesa.custom_schema);
    charIdRef.current = doc.id;
    setCharacterId(doc.id);
    latest.current = s;
    setSheet(s);
    if (doc.dirty) void pushCharacter(doc.id).then((ok) => setSaveState(ok ? "saved" : "offline"));
    else void writeStatus(doc.id, mesa, profile, s).catch(() => undefined);
  }, [doc, scopeLoading, save]);

  // Condições aplicadas pelo mestre chegam pelo status.
  const status = useScopeOne<CharacterStatus>(
    characterId
      ? {
          key: `mystatus:${characterId}`,
          collection: "character_status",
          selector: { character_id: characterId },
          fetch: async () => check(await supabase.from("character_status").select("*").eq("character_id", characterId)) as CharacterStatus[],
          realtime: [{ table: "character_status", filter: `character_id=eq.${characterId}`, apply: "character_status" }],
          staleMs: STALE.live,
        }
      : null
  );
  const remoteConditions = status.data?.conditions;
  useEffect(() => {
    if (!remoteConditions || !latest.current || pending.current) return;
    const cur = latest.current.conditions || [];
    if (JSON.stringify(cur) === JSON.stringify(remoteConditions)) return;
    const next = { ...latest.current, conditions: remoteConditions } as S;
    latest.current = next;
    setSheet(next);
    persist(next);
  }, [remoteConditions, persist]);

  const update = useCallback(
    (fn: (s: S) => S) => {
      const base = latest.current;
      if (!base) return;
      const next = fn(base);
      latest.current = next;
      setSheet(next);
      persist(next);
    },
    [persist]
  );

  const replace = useCallback(
    (raw: unknown) => {
      const { mesa, profile } = ctx.current;
      if (!mesa || !profile) return;
      const next = normalizeSheet<S>(mesa.system, raw, profile.display_name, mesa.custom_schema);
      latest.current = next;
      setSheet(next);
      persist(next);
    },
    [persist]
  );

  return { sheet, update, replace, characterId, saveState, system };
}
