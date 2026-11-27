// Camada de dados: chamadas ao Supabase + hooks com Realtime.
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { RealtimeChannel } from "@supabase/supabase-js";
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
import { AnySheet, normalizeSheet, sheetStatus } from "systems";

function check<T>(res: { data: T; error: unknown }): T {
  if (res.error) throw res.error;
  return res.data;
}

let channelSeq = 0;
/** Assina mudanças de uma ou mais tabelas e chama `onChange`. */
function subscribe(
  name: string,
  specs: { table: string; filter?: string }[],
  onChange: (payload: { eventType: string; new: unknown; old: unknown; table: string }) => void
): RealtimeChannel {
  let ch = supabase.channel(`${name}:${++channelSeq}`);
  specs.forEach((s) => {
    ch = ch.on(
      "postgres_changes" as never,
      { event: "*", schema: "public", table: s.table, ...(s.filter ? { filter: s.filter } : {}) } as never,
      ((p: { eventType: string; new: unknown; old: unknown; table: string }) => onChange(p)) as never
    );
  });
  ch.subscribe();
  return ch;
}

/** Busca + refaz a busca quando alguma tabela assinada muda. */
function useLive<T>(
  key: string | null,
  fetcher: () => Promise<T>,
  specs: { table: string; filter?: string }[],
  initial: T
) {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<unknown>(null);
  const fetchRef = useRef(fetcher);
  fetchRef.current = fetcher;

  const reload = useCallback(async () => {
    try {
      const d = await fetchRef.current();
      setData(d);
      setError(null);
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const specKey = JSON.stringify(specs);
  useEffect(() => {
    if (!key) return;
    setLoading(true);
    reload();
    const ch = subscribe(key, JSON.parse(specKey), () => reload());
    return () => {
      supabase.removeChannel(ch);
    };
  }, [key, specKey, reload]);

  return { data, setData, loading, error, reload };
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
  const mesas = useLive<LobbyMesa[]>(
    userId ? "lobby" : null,
    async () => check(await supabase.rpc("my_mesas")) as LobbyMesa[],
    [{ table: "mesa_members" }, { table: "mesas" }, { table: "character_status", filter: `user_id=eq.${userId}` }],
    []
  );
  const invites = useLive<PendingInvite[]>(
    userId ? "lobby-invites" : null,
    async () => check(await supabase.rpc("my_invites")) as PendingInvite[],
    [{ table: "invites", filter: `invitee_id=eq.${userId}` }],
    []
  );
  return { mesas, invites };
}

/** Status das minhas fichas (para o card "Mesas em que eu jogo"). */
export function useMyStatuses(userId: string | undefined) {
  return useLive<CharacterStatus[]>(
    userId ? "my-status" : null,
    async () => check(await supabase.from("character_status").select("*").eq("user_id", userId)) as CharacterStatus[],
    [{ table: "character_status", filter: `user_id=eq.${userId}` }],
    []
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
  const mesa = useLive<Mesa | null>(
    mesaId ? `mesa-${mesaId}` : null,
    async () => check(await supabase.from("mesas").select("*").eq("id", mesaId).maybeSingle()) as Mesa | null,
    [{ table: "mesas", filter: `id=eq.${mesaId}` }],
    null
  );
  const members = useLive<Member[]>(
    mesaId ? `members-${mesaId}` : null,
    async () =>
      check(
        await supabase.from("mesa_members").select("*, profile:profiles(*)").eq("mesa_id", mesaId).order("joined_at")
      ) as Member[],
    [{ table: "mesa_members", filter: `mesa_id=eq.${mesaId}` }],
    []
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
  return useLive<Invite[]>(
    mesaId && enabled ? `invites-${mesaId}` : null,
    async () =>
      check(
        await supabase.from("invites").select("*").eq("mesa_id", mesaId).eq("status", "pending").order("created_at")
      ) as Invite[],
    [{ table: "invites", filter: `mesa_id=eq.${mesaId}` }],
    []
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
  return useLive<CharacterStatus[]>(
    mesaId ? `status-${mesaId}` : null,
    async () => check(await supabase.from("character_status").select("*").eq("mesa_id", mesaId)) as CharacterStatus[],
    [{ table: "character_status", filter: `mesa_id=eq.${mesaId}` }],
    []
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

export function useGmState(mesaId: string | undefined, enabled: boolean) {
  const [data, setDataState] = useState<GmData>({});
  const [loading, setLoading] = useState(true);
  const timer = useRef<number | undefined>(undefined);
  const pending = useRef<GmData | null>(null);
  const lastWrite = useRef(0);

  useEffect(() => {
    if (!mesaId || !enabled) return;
    let alive = true;
    supabase
      .from("gm_state")
      .select("data")
      .eq("mesa_id", mesaId)
      .maybeSingle()
      .then(({ data: row }) => {
        if (!alive) return;
        setDataState(((row?.data as GmData) || {}) as GmData);
        setLoading(false);
      });
    const ch = subscribe(`gm-${mesaId}`, [{ table: "gm_state", filter: `mesa_id=eq.${mesaId}` }], (p) => {
      // Ignora o eco das próprias gravações; aplica alterações vindas de outro dispositivo.
      if (Date.now() - lastWrite.current < 1500 || pending.current) return;
      const row = p.new as { data?: GmData };
      if (row?.data) setDataState(row.data);
    });
    return () => {
      alive = false;
      supabase.removeChannel(ch);
    };
  }, [mesaId, enabled]);

  const flush = useCallback(async () => {
    if (!mesaId || !pending.current) return;
    const d = pending.current;
    pending.current = null;
    lastWrite.current = Date.now();
    await supabase.from("gm_state").upsert({ mesa_id: mesaId, data: d, updated_at: new Date().toISOString() });
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

  return { data, update, loading };
}

export function useChest(mesaId: string | undefined, enabled: boolean) {
  return useLive<ChestItem[]>(
    mesaId && enabled ? `chest-${mesaId}` : null,
    async () => check(await supabase.from("chest_items").select("*").eq("mesa_id", mesaId).order("created_at")) as ChestItem[],
    [{ table: "chest_items", filter: `mesa_id=eq.${mesaId}` }],
    []
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
  return useLive<ChestItem[]>(
    mesaId && userId ? `received-${mesaId}` : null,
    async () =>
      check(
        await supabase.from("chest_items").select("*").eq("mesa_id", mesaId).eq("given_to", userId).eq("claimed", false)
      ) as ChestItem[],
    [{ table: "chest_items", filter: `given_to=eq.${userId}` }],
    []
  );
}
export async function claimItem(id: string) {
  check(await supabase.from("chest_items").update({ claimed: true }).eq("id", id));
}

// ───────────────────────── Arquivos ─────────────────────────

export function useFiles(mesaId: string | undefined) {
  return useLive<MesaFile[]>(
    mesaId ? `files-${mesaId}` : null,
    async () => check(await supabase.from("mesa_files").select("*").eq("mesa_id", mesaId).order("created_at")) as MesaFile[],
    [{ table: "mesa_files", filter: `mesa_id=eq.${mesaId}` }],
    []
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
  const up = await supabase.storage.from("portraits").upload(path, file, { contentType: file.type || undefined, upsert: true });
  if (up.error) throw up.error;
  return supabase.storage.from("portraits").getPublicUrl(path).data.publicUrl;
}

// ───────────────────────── Notificações ─────────────────────────

export function useNotifications(userId: string | undefined) {
  const live = useLive<AppNotification[]>(
    userId ? "notifications" : null,
    async () =>
      check(
        await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(40)
      ) as AppNotification[],
    [{ table: "notifications", filter: `user_id=eq.${userId}` }],
    []
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

/**
 * Carrega (ou cria) a ficha do usuário nesta mesa e grava automaticamente,
 * mantendo `character_status` (o que o mestre vê) em sincronia.
 */
export function useMyCharacter<S extends AnySheet>(mesa: Mesa | null, profile: Profile | null) {
  const [sheet, setSheet] = useState<S | null>(null);
  const [characterId, setCharacterId] = useState<string | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const timer = useRef<number | undefined>(undefined);
  const latest = useRef<S | null>(null);
  const charIdRef = useRef<string | null>(null);

  const mesaId = mesa?.id;
  const system = mesa?.system;
  const userId = profile?.id;

  useEffect(() => {
    if (!mesa || !profile) return;
    let alive = true;
    (async () => {
      const { data: existing } = await supabase
        .from("characters")
        .select("*")
        .eq("mesa_id", mesa.id)
        .eq("user_id", profile.id)
        .maybeSingle();
      let row = existing as { id: string; sheet: unknown } | null;
      if (!row) {
        const fresh = normalizeSheet<S>(mesa.system, {}, profile.display_name, mesa.custom_schema);
        const ins = await supabase
          .from("characters")
          .insert({ mesa_id: mesa.id, user_id: profile.id, sheet: fresh })
          .select()
          .single();
        if (ins.error) {
          setSaveState("error");
          return;
        }
        row = ins.data as { id: string; sheet: unknown };
      }
      if (!alive || !row) return;
      const s = normalizeSheet<S>(mesa.system, row.sheet, profile.display_name, mesa.custom_schema);
      charIdRef.current = row.id;
      setCharacterId(row.id);
      latest.current = s;
      setSheet(s);
      await writeStatus(row.id, mesa, profile, s);
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mesaId, userId]);

  // Condições aplicadas pelo mestre chegam pelo status.
  useEffect(() => {
    if (!characterId) return;
    const ch = subscribe(`mystatus-${characterId}`, [{ table: "character_status", filter: `character_id=eq.${characterId}` }], (p) => {
      const row = p.new as CharacterStatus | undefined;
      if (!row || !latest.current) return;
      const cur = latest.current.conditions || [];
      if (JSON.stringify(cur) !== JSON.stringify(row.conditions || [])) {
        const next = { ...latest.current, conditions: row.conditions || [] } as S;
        latest.current = next;
        setSheet(next);
        persist(next, false);
      }
    });
    return () => {
      supabase.removeChannel(ch);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [characterId]);

  const persist = useCallback(
    (next: S, withStatus = true) => {
      window.clearTimeout(timer.current);
      setSaveState("saving");
      timer.current = window.setTimeout(async () => {
        const id = charIdRef.current;
        if (!id || !mesa || !profile) return;
        const { error } = await supabase
          .from("characters")
          .update({ sheet: next, updated_at: new Date().toISOString() })
          .eq("id", id);
        if (!error && withStatus) await writeStatus(id, mesa, profile, next);
        setSaveState(error ? "error" : "saved");
      }, 700);
    },
    [mesa, profile]
  );

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
      if (!mesa || !profile) return;
      const next = normalizeSheet<S>(mesa.system, raw, profile.display_name, mesa.custom_schema);
      latest.current = next;
      setSheet(next);
      persist(next);
    },
    [mesa, profile, persist]
  );

  return { sheet, update, replace, characterId, saveState, system };
}

async function writeStatus(characterId: string, mesa: Mesa, profile: Profile, sheet: AnySheet) {
  const st = sheetStatus(mesa.system, sheet);
  if (!mesa.show_status) {
    // A mesa escolheu não mostrar vida/recursos ao mestre: só nome e condições.
    st.resources = [];
    st.defense = null;
  }
  await supabase.from("character_status").upsert({
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
    updated_at: new Date().toISOString(),
  });
}
