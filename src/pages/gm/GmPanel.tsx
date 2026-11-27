import React, { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "auth/AuthProvider";
import { setConditions, setSession, useFiles, useGmState, usePresence, useStatuses } from "data/api";
import { errorMessage } from "lib/supabase";
import type { CharacterStatus, Member, Mesa } from "lib/types";
import { SYSTEMS } from "systems";
import { useIsMobile } from "hooks/useIsMobile";
import { BellButton, NotificationsCard } from "components/AccountCards";
import { PopoverCard } from "ui/Popover";
import { IconBack, IconBook, IconChest, IconDie, IconList, IconLock, IconMusic, IconNote, IconShield, IconUserPlus } from "ui/Icons";
import { ResourceRow, Seal } from "ui/bits";
import { ChestCard, InviteCard, MusicCard, ScheduleCard } from "./GmCards";
import { CreaturesPanel, DicePanel, InitiativePanel, MorePanel } from "./GmTools";
import styles from "./GmPanel.module.scss";

const CONDITION_PRESETS = ["Abalado", "Sangrando", "Morrendo", "Inconsciente", "Caído", "Cego", "Envenenado", "Atordoado", "Apavorado", "Enfeitiçado", "Paralisado", "Enlouquecendo"];

type Card = null | "invite" | "music" | "chest" | "notif" | "schedule";
type MobileTab = "group" | "ini" | "dice" | "notes";

export function GmPanel({ mesa, members, reloadMembers }: { mesa: Mesa; members: Member[]; reloadMembers(): void }) {
  const { profile } = useAuth();
  const isMobile = useIsMobile();
  const statuses = useStatuses(mesa.id);
  const files = useFiles(mesa.id);
  const gm = useGmState(mesa.id, true);
  const online = usePresence(mesa.id, profile?.id);
  const [card, setCard] = useState<Card>(null);
  const [mTab, setMTab] = useState<MobileTab>("group");
  const [err, setErr] = useState("");
  const sys = SYSTEMS[mesa.system];

  const players = members.filter((m) => m.role === "player");
  const party = useMemo(
    () =>
      players.map((p) => ({
        member: p,
        status: statuses.data.find((s) => s.user_id === p.user_id) || null,
        online: online.has(p.user_id),
      })),
    [players, statuses.data, online]
  );
  const connected = party.filter((p) => p.online).length;
  const partyNames = party.map((p) => p.status?.name).filter(Boolean) as string[];
  const partyPieces = party.map((p) => ({ label: p.status?.name || p.member.profile?.display_name || "Jogador", color: p.member.profile?.color || "#7a4fc0" }));
  const track = (gm.data.tracks || []).find((t) => t.id === gm.data.currentTrack);

  const elapsed = useSessionTimer(mesa.id, mesa.status === "em_sessao");

  async function toggleSession() {
    const starting = mesa.status !== "em_sessao";
    try {
      await setSession(mesa.id, starting ? "em_sessao" : "proxima");
      sessionClock(mesa.id, starting);
    } catch (e) {
      setErr(errorMessage(e));
    }
  }
  const editNext = () => setCard("schedule");

  const statusLine =
    mesa.status === "em_sessao"
      ? `Sessão ${mesa.session_number} em andamento · ${connected} de ${players.length} jogadores conectados`
      : `Próxima sessão: ${mesa.next_session} · ${players.length} de ${mesa.seats} jogadores`;

  const group = (
    <section aria-labelledby="grupo" className={styles.group}>
      <div className={styles.groupHead}>
        <h2 id="grupo" className="gm-h">
          <IconShield size={24} color={sys.color} />O grupo
        </h2>
        <span className={styles.privacy}>
          <IconLock size={16} />
          {isMobile ? "só status" : "Você vê só o status. Ficha, inventário e anotações são privados de cada jogador."}
        </span>
      </div>
      {party.length === 0 && (
        <div className={styles.emptyParty}>
          Ninguém na mesa ainda.{" "}
          <button type="button" className="gm-btn" onClick={() => setCard("invite")} style={{ background: "none", color: "#e0a040", padding: 0 }}>
            Convidar jogadores
          </button>
        </div>
      )}
      <div className={styles.partyGrid}>
        {party.map(({ member, status, online: on }) => (
          <PartyCard key={member.user_id} member={member} status={status} online={on} compact={isMobile} showStatus={mesa.show_status} onError={setErr} />
        ))}
      </div>
    </section>
  );

  const notesPanel = <MorePanel data={gm.data} update={gm.update} mesa={mesa} userId={profile!.id} files={files.data} partyPieces={partyPieces} />;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/mesas" className="gm-btn gm-ib gm-ib--round" aria-label="Voltar para minhas mesas"><IconBack /></Link>
        <div className={styles.titleBox}>
          <div className={styles.titleRow}>
            <span className="gm-display" style={{ fontSize: isMobile ? 21 : 28, lineHeight: 1.1 }}>{mesa.name}</span>
            {!isMobile && <span className={styles.sysBadge} style={{ background: sys.color }}>{sys.label}</span>}
          </div>
          <div className={styles.statusLine}>
            <span className={styles.dot} style={{ background: mesa.status === "em_sessao" ? "#7cc46a" : "#9a8a74" }} />
            <span>{statusLine}{!isMobile && " · você é o mestre"}</span>
          </div>
        </div>
        <div className={styles.headerTools}>
          <Link to={`/mesa/${mesa.id}/livro`} className="gm-btn gm-btn--tool" aria-label="Livro de regras">
            <IconBook size={22} />
            {!isMobile && "Livro de regras"}
          </Link>
          {!isMobile && (
            <>
              <SessionButton live={mesa.status === "em_sessao"} elapsed={elapsed} onClick={toggleSession} />
              <button type="button" className="gm-btn gm-ib" onClick={editNext} aria-label="Marcar próxima sessão" title="Marcar próxima sessão">
                <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" fill="none" stroke="currentColor" strokeWidth="2" /><path d="M3 10h18M8 3v4M16 3v4" stroke="currentColor" strokeWidth="2" /></svg>
              </button>
            </>
          )}
          <button type="button" className="gm-btn gm-ib" onClick={() => setCard("invite")} aria-label="Adicionar jogadores"><IconUserPlus /></button>
          <button type="button" className={`gm-btn gm-ib ${track ? styles.playing : ""}`} onClick={() => setCard("music")} aria-label="Música da sessão"><IconMusic /></button>
          <button type="button" className="gm-btn gm-ib" onClick={() => setCard("chest")} aria-label="Baú do mestre"><IconChest /></button>
          <BellButton onClick={() => setCard("notif")} />
        </div>
      </header>

      {err && (
        <div className="gm-error gm-error--dark" role="alert" style={{ margin: "12px 16px 0" }}>
          {err} <button type="button" className="gm-btn" style={{ background: "none", color: "inherit" }} onClick={() => setErr("")}>✕</button>
        </div>
      )}

      {isMobile ? (
        <main className={styles.mobileMain}>
          {mTab === "group" && (
            <>
              {group}
              <div style={{ display: "flex", gap: 8 }}>
                <SessionButton live={mesa.status === "em_sessao"} elapsed={elapsed} onClick={toggleSession} grow />
                <button type="button" className="gm-btn gm-btn--ghost-dark" onClick={editNext}>Agendar</button>
              </div>
            </>
          )}
          {mTab === "ini" && (
            <>
              <InitiativePanel data={gm.data} update={gm.update} partyNames={partyNames} />
              <CreaturesPanel data={gm.data} update={gm.update} />
            </>
          )}
          {mTab === "dice" && <DicePanel animate={profile?.dice_anim ?? true} />}
          {mTab === "notes" && notesPanel}
        </main>
      ) : (
        <main className={styles.main}>
          {group}
          <div className={styles.row}>
            <InitiativePanel data={gm.data} update={gm.update} partyNames={partyNames} />
            <DicePanel animate={profile?.dice_anim ?? true} />
          </div>
          <div className={styles.row}>
            <CreaturesPanel data={gm.data} update={gm.update} />
            {notesPanel}
          </div>
        </main>
      )}

      {isMobile && (
        <nav aria-label="Ferramentas do mestre" className={styles.bottomNav}>
          {([
            ["group", "Grupo", <IconShield key="a" size={22} />],
            ["ini", "Iniciativa", <IconList key="b" size={22} />],
            ["dice", "Dados", <IconDie key="c" size={22} />],
            ["notes", "Notas", <IconNote key="d" size={22} />],
          ] as [MobileTab, string, React.ReactNode][]).map(([k, l, icon]) => (
            <button key={k} type="button" className={`gm-btn ${mTab === k ? styles.navOn : ""}`} aria-current={mTab === k ? "page" : undefined} onClick={() => setMTab(k)}>
              {icon}
              {l}
            </button>
          ))}
        </nav>
      )}

      {track && (
        <div className={styles.player}>
          <iframe title={`Música: ${track.label}`} src={track.embedUrl} width="100%" height="80" frameBorder={0} allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" />
        </div>
      )}

      <PopoverCard open={card === "invite"} onClose={() => setCard(null)}>
        <InviteCard mesa={mesa} members={members} statuses={statuses.data} onClose={() => setCard(null)} onChanged={reloadMembers} />
      </PopoverCard>
      <PopoverCard open={card === "music"} onClose={() => setCard(null)}>
        <MusicCard data={gm.data} update={gm.update} onClose={() => setCard(null)} />
      </PopoverCard>
      <PopoverCard open={card === "chest"} onClose={() => setCard(null)}>
        <ChestCard mesa={mesa} userId={profile!.id} members={members} files={files.data} onClose={() => setCard(null)} />
      </PopoverCard>
      <PopoverCard open={card === "schedule"} onClose={() => setCard(null)}>
        <ScheduleCard
          current={mesa.next_session}
          onClose={() => setCard(null)}
          onSave={async (v) => {
            try {
              await setSession(mesa.id, mesa.status === "em_sessao" ? "em_sessao" : "proxima", v);
              setCard(null);
            } catch (e) {
              setErr(errorMessage(e));
            }
          }}
        />
      </PopoverCard>
      <PopoverCard open={card === "notif"} onClose={() => setCard(null)}>
        <NotificationsCard onClose={() => setCard(null)} />
      </PopoverCard>
    </div>
  );
}

function PartyCard({
  member,
  status,
  online,
  compact,
  showStatus,
  onError,
}: {
  member: Member;
  status: CharacterStatus | null;
  online: boolean;
  compact: boolean;
  showStatus: boolean;
  onError(m: string): void;
}) {
  const [editing, setEditing] = useState(false);
  const [custom, setCustom] = useState("");
  const name = status?.name || "Ficha em branco";
  const player = member.profile?.display_name || "Jogador";
  const color = member.profile?.color || "#8a6a2e";
  const hp = status?.resources?.[0];
  const critical = !!hp && hp.max > 0 && hp.cur / hp.max <= 0.25;
  const conds = status?.conditions || [];

  async function toggle(c: string) {
    if (!status) return;
    const next = conds.includes(c) ? conds.filter((x) => x !== c) : [...conds, c];
    try {
      await setConditions(status.character_id, next);
    } catch (e) {
      onError(errorMessage(e));
    }
  }

  return (
    <article className={`${styles.partyCard} ${critical ? styles.critical : ""} ${compact ? styles.partyCompact : ""}`}>
      <div className={styles.partyTop}>
        <Seal name={name} color={color} size={compact ? 38 : 48} display grayscale={!online} img={status?.portrait_url} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="gm-display" style={{ fontSize: compact ? 17 : 21, lineHeight: 1.1, fontWeight: compact ? 800 : 400 }}>{name}</div>
          <div style={{ fontSize: compact ? 13 : 14, color: "#5a4430" }}>
            {status?.role_line ? `${status.role_line} · ` : ""}jogador: {player}
          </div>
        </div>
        {status?.defense != null && (
          <div className={styles.def} title="Defesa">
            <span className="gm-num" style={{ fontSize: compact ? 16 : 20, lineHeight: 1 }}>{status.defense}</span>
            <span style={{ fontSize: 10, fontWeight: 800 }}>DEF</span>
          </div>
        )}
      </div>
      {showStatus && status && status.resources.length > 0 && (
        <div style={{ display: "flex", flexDirection: "column", gap: compact ? 7 : 8 }}>
          {status.resources.map((r) => <ResourceRow key={r.key} r={r} compact={compact} />)}
        </div>
      )}
      {!status && <div style={{ fontSize: 14, color: "#6b5640" }}>O jogador ainda não abriu a ficha.</div>}
      <div className={styles.condRow}>
        {conds.map((c) => (
          <button key={c} type="button" className={`gm-btn gm-badge gm-badge--dark ${styles.cond}`} onClick={() => toggle(c)} aria-label={`Remover condição ${c}`} title="Remover">
            {c}
          </button>
        ))}
        {status && (
          <button type="button" className={`gm-btn ${styles.condAdd}`} onClick={() => setEditing((v) => !v)} aria-expanded={editing}>
            + condição
          </button>
        )}
        <span className={styles.online}>
          <span className={styles.dot} style={{ background: online ? "#4f8f3c" : "#9a8a74" }} />
          {online ? "conectado" : "offline"}
        </span>
      </div>
      {editing && status && (
        <div className={styles.condPicker}>
          {CONDITION_PRESETS.filter((c) => !conds.includes(c)).map((c) => (
            <button key={c} type="button" className="gm-btn" onClick={() => toggle(c)}>{c}</button>
          ))}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (custom.trim()) toggle(custom.trim());
              setCustom("");
            }}
            style={{ display: "flex", gap: 6, width: "100%" }}
          >
            <input className="gm-in" style={{ height: 34, flex: 1 }} value={custom} onChange={(e) => setCustom(e.target.value)} placeholder="Outra condição" aria-label="Outra condição" />
            <button type="submit" className="gm-btn gm-btn--ink" style={{ height: 34, padding: "0 10px" }}>Aplicar</button>
          </form>
        </div>
      )}
    </article>
  );
}


const CLOCK_KEY = (id: string) => `gm_session_start_${id}`;

/** Guarda só no navegador do mestre quando a sessão começou. */
function sessionClock(mesaId: string, start: boolean) {
  try {
    if (start) localStorage.setItem(CLOCK_KEY(mesaId), String(Date.now()));
    else localStorage.removeItem(CLOCK_KEY(mesaId));
  } catch {
    /* armazenamento indisponível: o cronômetro conta a partir de agora */
  }
}

function useSessionTimer(mesaId: string, live: boolean): number {
  const [start, setStart] = useState<number | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!live) {
      setStart(null);
      return;
    }
    let s = Date.now();
    try {
      const saved = Number(localStorage.getItem(CLOCK_KEY(mesaId)));
      if (saved > 0) s = saved;
      else localStorage.setItem(CLOCK_KEY(mesaId), String(s));
    } catch {
      /* ignora */
    }
    setStart(s);
    const t = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(t);
  }, [mesaId, live]);

  return start ? Math.max(0, now - start) : 0;
}

function fmtElapsed(ms: number) {
  const s = Math.floor(ms / 1000);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${h}:${pad(m)}:${pad(sec)}`;
}

function SessionButton({ live, elapsed, onClick, grow }: { live: boolean; elapsed: number; onClick(): void; grow?: boolean }) {
  if (!live) {
    return (
      <button type="button" className="gm-btn gm-btn--gold" style={grow ? { flex: 1 } : undefined} onClick={onClick}>
        Iniciar sessão
      </button>
    );
  }
  return (
    <span className={styles.live} style={grow ? { flex: 1 } : undefined}>
      <span className={styles.clock} role="timer" aria-label={`Sessão rolando há ${fmtElapsed(elapsed)}`}>
        <span className={styles.liveDot} aria-hidden="true" />
        <span className="gm-num">{fmtElapsed(elapsed)}</span>
      </span>
      <button type="button" className="gm-btn" onClick={onClick}>Encerrar sessão</button>
    </span>
  );
}
