import React, { useState } from "react";
import {
  addChestItem,
  cancelInvite,
  deleteChestItem,
  deleteMesaFile,
  giveChestItem,
  giveFile,
  invitePlayer,
  inviteLink,
  removeMember,
  uploadMesaFile,
  useChest,
  useInvites,
} from "data/api";
import { errorMessage } from "lib/supabase";
import type { CharacterStatus, GmData, Member, Mesa, MesaFile, SavedTrack } from "lib/types";
import { CardShell } from "ui/Popover";
import { IconCalendar, IconChest, IconMusic, IconUserPlus } from "ui/Icons";
import { Seal, uid } from "ui/bits";
import { useConfirm } from "ui/Confirm";
import { useUploadGuard } from "ui/Toast";
import { QrCode } from "ui/Qr";
import { parseSpotifyUrl } from "utils/spotify";
import styles from "./GmCards.module.scss";

export function InviteCard({
  mesa,
  members,
  statuses,
  onClose,
  onChanged,
}: {
  mesa: Mesa;
  members: Member[];
  statuses: CharacterStatus[];
  onClose(): void;
  onChanged(): void;
}) {
  const invites = useInvites(mesa.id, true);
  const confirm = useConfirm();
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [err, setErr] = useState("");
  const players = members.filter((m) => m.role === "player");

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.trim()) return;
    setErr("");
    try {
      await invitePlayer(mesa.id, draft.trim());
      setDraft("");
      invites.reload();
    } catch (e2) {
      setErr(errorMessage(e2));
    }
  }

  async function remove(userId: string, name: string) {
    if (!(await confirm({ title: `Remover ${name}?`, message: "A ficha dele nesta mesa será apagada.", confirmLabel: "Remover", danger: true }))) return;
    try {
      await removeMember(mesa.id, userId);
      onChanged();
    } catch (e) {
      setErr(errorMessage(e));
    }
  }

  return (
    <CardShell
      width={400}
      title="Adicionar jogadores"
      icon={<IconUserPlus />}
      onClose={onClose}
      extra={<span style={{ fontSize: 14, fontWeight: 800, color: "#f3c477" }}>{players.length} de {mesa.seats} vagas</span>}
    >
      <div className={styles.body}>
        <div className={styles.code}>
          <QrCode value={inviteLink(mesa.invite_code)} size={112} label={`QR code do convite para ${mesa.name}`} />
          <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="gm-eyebrow" style={{ color: "#c9b48a" }}>Código da mesa</div>
            <div className="gm-num" style={{ fontSize: 24, letterSpacing: 3, color: "#e0a040" }}>{mesa.invite_code}</div>
            <button
              type="button"
              className="gm-btn gm-btn--gold"
              style={{ height: 40, fontSize: 14, alignSelf: "flex-start" }}
              onClick={async () => {
                await navigator.clipboard?.writeText(inviteLink(mesa.invite_code)).catch(() => undefined);
                setCopied(true);
              }}
            >
              {copied ? "Link copiado!" : "Copiar link"}
            </button>
            <span style={{ fontSize: 12, color: "#c9b48a" }}>Escaneie, digite o código ou use o link.</span>
          </div>
        </div>
        <form onSubmit={invite}>
          <label className="gm-lbl gm-lbl--plain">
            Convidar por e-mail ou usuário
            <span style={{ display: "flex", gap: 8 }}>
              <input className="gm-in" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="nome@exemplo.com" style={{ flex: 1 }} />
              <button type="submit" className="gm-btn gm-btn--primary" style={{ height: 44, fontSize: 14 }}>Convidar</button>
            </span>
          </label>
        </form>
        {err && <div className="gm-error">{err}</div>}
        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <div className="gm-eyebrow" style={{ color: "#5a4430" }}>Na mesa</div>
          {players.length === 0 && invites.data.length === 0 && <div className="gm-hint">Ninguém ainda. Mande o link para o grupo!</div>}
          {players.map((p) => {
            const st = statuses.find((s) => s.user_id === p.user_id);
            const name = p.profile?.display_name || "Jogador";
            return (
              <div key={p.user_id} className={styles.person}>
                <Seal name={name} color={p.profile?.color || "#8a6a2e"} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>{name}</div>
                  <div style={{ fontSize: 13, color: "#5a4430" }}>{st?.name || "Montando a ficha"}</div>
                </div>
                <span className="gm-badge gm-badge--ok">Na mesa</span>
                <button type="button" className="gm-btn gm-del" style={{ height: 32, minWidth: 32 }} onClick={() => remove(p.user_id, name)} aria-label={`Remover ${name}`}>✕</button>
              </div>
            );
          })}
          {invites.data.map((i) => (
            <div key={i.id} className={styles.person}>
              <Seal name={i.invitee_label} color="#5a4430" />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis" }}>{i.invitee_label}</div>
                <div style={{ fontSize: 13, color: "#5a4430" }}>{i.invitee_id ? "Convite enviado" : "Ainda sem conta — recebe ao se cadastrar"}</div>
              </div>
              <span className="gm-badge gm-badge--wait">Pendente</span>
              <button type="button" className="gm-btn gm-del" style={{ height: 32, minWidth: 32 }} onClick={() => cancelInvite(i.id).then(invites.reload)} aria-label={`Cancelar convite de ${i.invitee_label}`}>✕</button>
            </div>
          ))}
        </div>
      </div>
    </CardShell>
  );
}

const MOOD_COLORS = ["#2a8a80", "#7a4fc0", "#b23a2c", "#8a6a2e", "#4a3566", "#c2412d"];

export function MusicCard({
  data,
  update,
  onClose,
}: {
  data: GmData;
  update(fn: (d: GmData) => GmData): void;
  onClose(): void;
}) {
  const [link, setLink] = useState("");
  const [label, setLabel] = useState("");
  const [err, setErr] = useState("");
  const tracks = data.tracks || [];
  const current = tracks.find((t) => t.id === data.currentTrack);

  function add(e: React.FormEvent) {
    e.preventDefault();
    const parsed = parseSpotifyUrl(link);
    if (!parsed) return setErr("Cole um link do Spotify (faixa, álbum ou playlist).");
    const t: SavedTrack = { id: uid(), label: label.trim() || `Clima ${tracks.length + 1}`, embedUrl: parsed.embedUrl, color: MOOD_COLORS[tracks.length % MOOD_COLORS.length] };
    update((d) => ({ ...d, tracks: [...(d.tracks || []), t], currentTrack: t.id }));
    setLink("");
    setLabel("");
    setErr("");
  }

  return (
    <CardShell width={380} title="Música da sessão" icon={<IconMusic />} onClose={onClose}>
      <div className={styles.body}>
        <div className={styles.now}>
          <span className={styles.cover} style={{ background: current?.color || "#5a4430" }}><IconMusic color="#f1e6cc" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 800 }}>{current ? `Ambiente — ${current.label}` : "Nada tocando"}</div>
            <div style={{ fontSize: 13, color: "#c9b48a" }}>{current ? "Toque/pause no player do canto da tela" : "Escolha um clima ou adicione um link"}</div>
          </div>
          {current && (
            <button type="button" className="gm-btn gm-x" onClick={() => update((d) => ({ ...d, currentTrack: null }))} aria-label="Parar música" style={{ width: 40, height: 40 }}>■</button>
          )}
        </div>
        {tracks.length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <div className="gm-eyebrow" style={{ color: "#5a4430" }}>Climas da campanha</div>
            <div className={styles.moods}>
              {tracks.map((t) => (
                <span key={t.id} className={`${styles.mood} ${t.id === data.currentTrack ? styles.moodOn : ""}`}>
                  <button type="button" className="gm-btn" onClick={() => update((d) => ({ ...d, currentTrack: t.id }))}>
                    <span className={styles.moodDot} style={{ background: t.color }} />
                    {t.label}
                  </button>
                  <button type="button" className="gm-btn" aria-label={`Remover ${t.label}`} onClick={() => update((d) => ({ ...d, tracks: (d.tracks || []).filter((x) => x.id !== t.id), currentTrack: d.currentTrack === t.id ? null : d.currentTrack }))}>×</button>
                </span>
              ))}
            </div>
          </div>
        )}
        <form onSubmit={add} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          <label className="gm-lbl gm-lbl--plain">
            Adicionar do Spotify
            <input className="gm-in" value={link} onChange={(e) => setLink(e.target.value)} placeholder="Link de faixa, álbum ou playlist" />
          </label>
          <span style={{ display: "flex", gap: 8 }}>
            <input className="gm-in" value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Nome do clima (ex.: Combate)" style={{ flex: 1 }} aria-label="Nome do clima" />
            <button type="submit" className="gm-btn gm-btn--ink">Salvar</button>
          </span>
        </form>
        {err && <div className="gm-error">{err}</div>}
        <div style={{ fontSize: 13, color: "#6b5640" }}>A música toca no dispositivo do mestre.</div>
      </div>
    </CardShell>
  );
}

/** Cor da etiqueta de cada categoria de item (usada também no baú do jogador). */
export const CATS: Record<string, string> = { Paranormal: "#7a4fc0", Pista: "#8a6a2e", Arma: "#b23a2c", Tesouro: "#5c7a2e", Item: "#5a4430", Mágico: "#2a8a80" };

export function ChestCard({
  mesa,
  userId,
  members,
  files,
  onClose,
}: {
  mesa: Mesa;
  userId: string;
  members: Member[];
  files: MesaFile[];
  onClose(): void;
}) {
  const [tab, setTab] = useState<"items" | "files">("items");
  const chest = useChest(mesa.id, true);
  const confirm = useConfirm();
  const guard = useUploadGuard();
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({ name: "", category: "Item", note: "" });
  const [err, setErr] = useState("");
  const [uploading, setUploading] = useState(false);
  const players = members.filter((m) => m.role === "player");
  const nameOf = (id: string | null) => players.find((p) => p.user_id === id)?.profile?.display_name || "jogador";
  // Mapas ficam na ferramenta de mapa; livros, na página do livro.
  const handouts = files.filter((f) => f.kind === "file");

  async function save(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) return;
    try {
      await addChestItem(mesa.id, { ...form, name: form.name.trim() });
      setForm({ name: "", category: "Item", note: "" });
      setAdding(false);
      chest.reload();
    } catch (e2) {
      setErr(errorMessage(e2));
    }
  }

  async function upload(list: File[]) {
    if (!list.length) return;
    setUploading(true);
    setErr("");
    try {
      const problems: string[] = [];
      for (const f of list) {
        try {
          await uploadMesaFile(mesa.id, userId, f, "file");
        } catch (e) {
          problems.push(errorMessage(e));
        }
      }
      if (problems.length) setErr(problems.join(" "));
    } finally {
      setUploading(false);
    }
  }

  return (
    <CardShell width={440} title="Baú do mestre" icon={<IconChest />} onClose={onClose}>
      <div className={styles.body}>
        <div className="gm-seg" role="tablist">
          <button type="button" role="tab" aria-selected={tab === "items"} className="gm-btn" onClick={() => setTab("items")}>Itens e tesouros</button>
          <button type="button" role="tab" aria-selected={tab === "files"} className="gm-btn" onClick={() => setTab("files")}>Arquivos</button>
        </div>
        {err && <div className="gm-error">{err}</div>}

        {tab === "items" && (
          <>
            <div style={{ fontSize: 13, color: "#6b5640" }}>Itens guardados para a campanha. Entregue a um jogador e o item vai para o inventário da ficha dele.</div>
            {chest.data.map((it) => (
              <div key={it.id} className={styles.item}>
                <span className={styles.cat} style={{ background: CATS[it.category] || "#5a4430" }}>{it.category}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 800 }}>{it.name}</div>
                  {it.note && <div style={{ fontSize: 13, color: "#5a4430" }}>{it.note}</div>}
                </div>
                {it.given_to ? (
                  <span style={{ fontSize: 13, fontWeight: 800, color: "#33501f" }}>Com {nameOf(it.given_to)}</span>
                ) : (
                  <select
                    className="gm-in"
                    aria-label={`Entregar ${it.name} para`}
                    style={{ height: 36, width: 120, fontSize: 13 }}
                    value=""
                    onChange={(e) => e.target.value && giveChestItem(it.id, e.target.value).then(chest.reload).catch((x) => setErr(errorMessage(x)))}
                  >
                    <option value="">Entregar…</option>
                    {players.map((p) => <option key={p.user_id} value={p.user_id}>{p.profile?.display_name}</option>)}
                  </select>
                )}
                <button type="button" className="gm-btn gm-del" style={{ height: 32, minWidth: 32 }} aria-label={`Apagar ${it.name}`} onClick={() => deleteChestItem(it.id).then(chest.reload)}>✕</button>
              </div>
            ))}
            {adding ? (
              <form onSubmit={save} className={styles.addForm}>
                <input className="gm-in" placeholder="Nome do item" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} autoFocus aria-label="Nome do item" />
                <div style={{ display: "flex", gap: 8 }}>
                  <select className="gm-in" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} aria-label="Categoria">
                    {Object.keys(CATS).map((c) => <option key={c}>{c}</option>)}
                  </select>
                  <input className="gm-in" style={{ flex: 1 }} placeholder="Nota (onde foi achado…)" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} aria-label="Nota" />
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" className="gm-btn gm-btn--ink">Guardar</button>
                  <button type="button" className="gm-btn gm-btn--ghost" onClick={() => setAdding(false)}>Cancelar</button>
                </div>
              </form>
            ) : (
              <button type="button" className="gm-btn gm-btn--dashed" onClick={() => setAdding(true)}>+ Guardar item</button>
            )}
          </>
        )}

        {tab === "files" && (
          <>
            <div style={{ fontSize: 13, color: "#6b5640" }}>Handouts e documentos da campanha. Entregue a um jogador e o arquivo aparece na ficha dele.</div>
            <label className={styles.drop}>
              <span style={{ fontWeight: 800, color: "#2b1f16" }}>{uploading ? "Enviando…" : "Toque para escolher arquivos"}</span>
              Handouts, imagens, PDFs · até 50 MB cada
              <input type="file" multiple className="gm-sr" onChange={(e) => upload(guard(e.target))} />
            </label>
            {handouts.map((f) => {
              const given = f.given_to || [];
              const type = (f.mime.split("/")[1] || "arq").replace(/^vnd\..*|^x-/, "").slice(0, 4) || "arq";
              return (
                <div key={f.id} className={styles.item}>
                  <span className={styles.cat} style={{ background: "#2b1f16" }}>{type}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis" }}>{f.name}</div>
                  </div>
                  {given.length ? (
                    <span style={{ fontSize: 13, fontWeight: 800, color: "#33501f" }}>Com {given.map(nameOf).join(", ")}</span>
                  ) : (
                    <select
                      className="gm-in"
                      aria-label={`Entregar ${f.name} para`}
                      style={{ height: 36, width: 120, fontSize: 13 }}
                      value=""
                      onChange={(e) => e.target.value && giveFile(f.id, e.target.value).catch((x) => setErr(errorMessage(x)))}
                    >
                      <option value="">Entregar…</option>
                      {players.map((p) => <option key={p.user_id} value={p.user_id}>{p.profile?.display_name}</option>)}
                    </select>
                  )}
                  <button type="button" className="gm-btn gm-del" style={{ height: 32, minWidth: 32 }} aria-label={`Apagar ${f.name}`} onClick={async () => (await confirm({ title: `Apagar “${f.name}”?`, message: "O arquivo sai do baú e de quem tinha acesso.", confirmLabel: "Apagar", danger: true })) && deleteMesaFile(f)}>✕</button>
                </div>
              );
            })}
          </>
        )}
      </div>
    </CardShell>
  );
}

const WEEKDAYS = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

/** Monta "Sábado, 29/11 · 20h" a partir de data e hora escolhidas. */
function formatSession(date: string, time: string): string {
  const parts: string[] = [];
  if (date) {
    const [y, m, d] = date.split("-").map(Number);
    const dt = new Date(y, m - 1, d);
    parts.push(`${WEEKDAYS[dt.getDay()]}, ${String(d).padStart(2, "0")}/${String(m).padStart(2, "0")}`);
  }
  if (time) {
    const [h, min] = time.split(":");
    parts.push(min === "00" ? `${Number(h)}h` : `${Number(h)}h${min}`);
  }
  return parts.join(" · ");
}

function nextWeekday(target: number): string {
  const d = new Date();
  const diff = (target - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + diff);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function ScheduleCard({ current, onSave, onClose }: { current: string; onSave(v: string): Promise<void> | void; onClose(): void }) {
  const [date, setDate] = useState("");
  const [time, setTime] = useState("20:00");
  const [text, setText] = useState(current === "A combinar" ? "" : current);
  const [busy, setBusy] = useState(false);
  const preview = (date || time !== "20:00" ? formatSession(date, time) : "") || text.trim() || "A combinar";

  function pickDate(v: string) {
    setDate(v);
    setText(formatSession(v, time));
  }
  function pickTime(v: string) {
    setTime(v);
    if (date) setText(formatSession(date, v));
  }

  async function save(value: string) {
    setBusy(true);
    await onSave(value);
    setBusy(false);
  }

  return (
    <CardShell width={380} title="Próxima sessão" icon={<IconCalendar />} onClose={onClose}>
      <form
        className={styles.body}
        onSubmit={(e) => {
          e.preventDefault();
          save(text.trim() || preview);
        }}
      >
        <div className={styles.now}>
          <span className={styles.cover} style={{ background: "#2a8a80" }}><IconCalendar color="#f1e6cc" /></span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 12, color: "#c9b48a", fontWeight: 800, letterSpacing: 1.2 }}>OS JOGADORES VÃO VER</div>
            <div style={{ fontWeight: 800, fontSize: 17 }}>{text.trim() || preview}</div>
          </div>
        </div>
        <div className="gm-eyebrow" style={{ color: "#5a4430" }}>Atalhos</div>
        <div className={styles.moods}>
          {[5, 6, 0].map((wd) => (
            <span key={wd} className={styles.mood}>
              <button type="button" className="gm-btn" onClick={() => pickDate(nextWeekday(wd))}>
                <span className={styles.moodDot} style={{ background: "#2a8a80" }} />
                Próximo {WEEKDAYS[wd].toLowerCase()}
              </button>
            </span>
          ))}
          <span className={styles.mood}>
            <button type="button" className="gm-btn" onClick={() => { setDate(""); setText(""); }}>
              <span className={styles.moodDot} style={{ background: "#8a6a2e" }} />
              A combinar
            </button>
          </span>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1.4fr 1fr", gap: 8 }}>
          <label className="gm-lbl">
            Dia
            <input className="gm-in" type="date" value={date} onChange={(e) => pickDate(e.target.value)} />
          </label>
          <label className="gm-lbl">
            Hora
            <input className="gm-in" type="time" value={time} onChange={(e) => pickTime(e.target.value)} />
          </label>
        </div>
        <label className="gm-lbl">
          Ou escreva do seu jeito
          <input className="gm-in" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ex.: Sábado, 20h · no Discord" maxLength={80} />
        </label>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
          <button type="button" className="gm-btn gm-btn--ghost" onClick={onClose}>Cancelar</button>
          <button type="submit" className="gm-btn gm-btn--ink" disabled={busy}>{busy ? "Salvando…" : "Salvar e avisar o grupo"}</button>
        </div>
      </form>
    </CardShell>
  );
}
