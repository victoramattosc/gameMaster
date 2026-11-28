import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "auth/AuthProvider";
import { joinByCode, respondInvite, useLobby, useMyStatuses } from "data/api";
import { errorMessage } from "lib/supabase";
import type { SystemKey } from "lib/types";
import { SYSTEMS } from "systems";
import { BellButton, NotificationsCard, ProfileButton, ProfileCard } from "components/AccountCards";
import { Modal, PopoverCard } from "ui/Popover";
import { QrScanner } from "ui/Qr";
import { IconCalendar, IconCrown, IconMail, IconPlus, IconScroll, Logo, QrIcon, Silhouette } from "ui/Icons";
import { Bar } from "ui/bits";
import { PENDING_INVITE_KEY } from "./Login";
import styles from "./Lobby.module.scss";

const STATUS_LABEL = { montando: "Montando", proxima: "Próxima", em_sessao: "Em sessão" } as const;
const TINT = ["#e0a040", "#7fb0e0", "#d98a8a", "#9fd08a", "#c7a3f0"];

export function AppHeader({ children }: { children?: React.ReactNode }) {
  const [card, setCard] = useState<null | "notif" | "profile">(null);
  return (
    <>
      <header className={styles.header}>
        <Link to="/mesas" className={styles.brand}>
          <Logo size={44} />
          <span className="gm-display">Game Master</span>
        </Link>
        <div className={styles.headerRight}>
          {children}
          <BellButton onClick={() => setCard("notif")} />
          <ProfileButton onClick={() => setCard("profile")} />
        </div>
      </header>
      <PopoverCard open={card === "notif"} onClose={() => setCard(null)}>
        <NotificationsCard onClose={() => setCard(null)} />
      </PopoverCard>
      <PopoverCard open={card === "profile"} onClose={() => setCard(null)}>
        <ProfileCard onClose={() => setCard(null)} />
      </PopoverCard>
    </>
  );
}

export function LobbyPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const { mesas, invites } = useLobby(profile?.id);
  const statuses = useMyStatuses(profile?.id);
  const [filter, setFilter] = useState<"all" | SystemKey>("all");
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [scanning, setScanning] = useState(false);

  const onScan = useCallback(
    (c: string) => {
      setScanning(false);
      joinByCode(c)
        .then((id) => navigate(`/mesa/${id}`))
        .catch((e) => setErr(errorMessage(e)));
    },
    [navigate]
  );

  // Convite digitado no cadastro antes de confirmar o e-mail.
  useEffect(() => {
    const pending = localStorage.getItem(PENDING_INVITE_KEY);
    if (!pending || !profile) return;
    localStorage.removeItem(PENDING_INVITE_KEY);
    joinByCode(pending)
      .then((id) => navigate(`/mesa/${id}`))
      .catch((e) => setErr(errorMessage(e)));
  }, [profile, navigate]);

  const keep = (s: SystemKey) => filter === "all" || filter === s;
  const gm = mesas.data.filter((m) => m.role === "gm" && keep(m.system));
  const play = mesas.data.filter((m) => m.role === "player" && keep(m.system));
  const statusByMesa = useMemo(() => new Map(statuses.data.map((s) => [s.mesa_id, s])), [statuses.data]);

  async function answer(id: string, accept: boolean) {
    try {
      const mesaId = await respondInvite(id, accept);
      invites.reload();
      mesas.reload();
      if (accept) navigate(`/mesa/${mesaId}`);
    } catch (e) {
      setErr(errorMessage(e));
    }
  }

  async function join(e: React.FormEvent) {
    e.preventDefault();
    if (!code.trim()) return;
    try {
      const id = await joinByCode(code);
      navigate(`/mesa/${id}`);
    } catch (e2) {
      setErr(errorMessage(e2));
    }
  }

  const chips: ["all" | SystemKey, string][] = [["all", "Todos"], ["dnd", "D&D 5e"], ["op", "Ordem"], ["op2", "Ordem II"], ["custom", "Personalizado"]];

  return (
    <div className={styles.page}>
      <AppHeader />
      <main className={styles.main}>
        {invites.data.map((inv) => (
          <div key={inv.id} className={styles.invite}>
            <span className={styles.inviteIcon}><IconMail size={22} color="#fff7e8" /></span>
            <div style={{ flex: "1 1 320px", minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 17 }}>Convite para “{inv.mesa_name}”</div>
              <div style={{ color: "#d9c8a6", fontSize: 15 }}>
                {inv.gm_name} (mestre) te convidou para jogar · {SYSTEMS[inv.system].label} · {inv.player_count} de {inv.seats} vagas ocupadas
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="button" className="gm-btn gm-btn--ghost-dark" onClick={() => answer(inv.id, false)}>Recusar</button>
              <button type="button" className="gm-btn gm-btn--gold" onClick={() => answer(inv.id, true)}>Aceitar e criar ficha</button>
            </div>
          </div>
        ))}

        {err && <div className="gm-error gm-error--dark" role="alert">{err}</div>}

        <div className={styles.titleRow}>
          <div>
            <h1 className="gm-display" style={{ fontSize: 44 }}>Suas mesas</h1>
            <p style={{ marginTop: 4, color: "#c9b48a", fontSize: 17 }}>Onde você mestra e onde você joga.</p>
          </div>
          <div className={styles.chips} aria-label="Filtrar por sistema">
            {chips.map(([k, l]) => (
              <button key={k} type="button" className="gm-btn gm-chip" aria-pressed={filter === k} onClick={() => setFilter(k)}>{l}</button>
            ))}
          </div>
        </div>

        <section className={styles.section}>
          <div className={styles.sectionHead}>
            <IconCrown />
            <h2 style={{ color: "#e0a040" }}>Mesas que eu mestro</h2>
          </div>
          <div className={styles.gridGm}>
            {gm.map((t) => {
              const sys = SYSTEMS[t.system];
              return (
                <Link key={t.id} to={`/mesa/${t.id}`} className={styles.gmCard}>
                  <div className={styles.band} style={{ background: sys.color }}>
                    <span>{sys.label}</span>
                    <span className={styles.bandStatus}>{STATUS_LABEL[t.status]}</span>
                  </div>
                  <div className={styles.gmBody}>
                    <div className="gm-display" style={{ fontSize: 25, lineHeight: 1.1 }}>{t.name}</div>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <div style={{ display: "flex" }}>
                        {t.players.slice(0, 6).map((p, i) => (
                          <span key={p.id} className={styles.stack} style={{ background: p.color || TINT[i % 5], marginLeft: i ? -8 : 0 }}>
                            {p.name[0]?.toUpperCase()}
                          </span>
                        ))}
                      </div>
                      <span style={{ fontSize: 15, color: "#6b5640", fontWeight: 700 }}>{t.player_count} de {t.seats} jogadores</span>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 15, color: "#5a4430" }}>
                      <IconCalendar size={16} />
                      {t.next_session}
                    </div>
                    <div className={styles.cta}>Abrir painel do mestre →</div>
                  </div>
                </Link>
              );
            })}
            <Link to="/mesas/nova" className={styles.newCard}>
              <span className={styles.plus}><IconPlus size={28} /></span>
              <span style={{ fontWeight: 800, fontSize: 18 }}>Criar nova mesa</span>
              <span style={{ color: "#c9b48a", fontSize: 14 }}>Escolha o sistema e convide o grupo</span>
            </Link>
          </div>
        </section>

        <section className={styles.section} id="jogando">
          <div className={styles.sectionHead}>
            <IconScroll />
            <h2 style={{ color: "#c9b48a" }}>Mesas em que eu jogo</h2>
          </div>
          <div className={styles.gridPlay}>
            {play.map((t) => {
              const sys = SYSTEMS[t.system];
              const st = statusByMesa.get(t.id);
              const hp = st?.resources?.[0];
              return (
                <Link key={t.id} to={`/mesa/${t.id}`} className={styles.playCard}>
                  <span className={styles.portrait} style={{ background: sys.color }}>
                    {st?.portrait_url ? <img src={st.portrait_url} alt="" /> : <Silhouette />}
                  </span>
                  <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column", gap: 8 }}>
                    <div className="gm-eyebrow" style={{ color: "#c9b48a" }}>{sys.label} · {t.name}</div>
                    <div className="gm-display" style={{ fontSize: 23, lineHeight: 1.1 }}>{st?.name || "Ficha nova"}</div>
                    <div style={{ fontSize: 15, color: "#d9c8a6" }}>{st?.role_line || "Toque para montar sua ficha"}</div>
                    {hp && (
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span style={{ fontSize: 12, fontWeight: 800, color: "#e8a093", width: 22 }}>{hp.label}</span>
                        <Bar cur={hp.cur} max={hp.max} color={hp.color} dark />
                        <span style={{ fontSize: 13, fontWeight: 700, color: "#d9c8a6" }}>{hp.cur}/{hp.max}</span>
                      </div>
                    )}
                    <div style={{ fontWeight: 800, color: "#e0a040", fontSize: 15 }}>Abrir minha ficha →</div>
                  </div>
                </Link>
              );
            })}
            <form className={styles.joinCard} onSubmit={join}>
              <label className="gm-lbl gm-lbl--plain" style={{ color: "#f1e6cc" }}>
                Tenho um código de convite
                <span style={{ display: "flex", gap: 8 }}>
                  <input className="gm-in gm-in--dark" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex.: SINAL-4QX9" style={{ flex: 1, letterSpacing: 1.5, fontWeight: 700 }} />
                  <button type="submit" className="gm-btn gm-btn--gold">Entrar</button>
                </span>
              </label>
              <button type="button" className="gm-btn gm-btn--tool" onClick={() => setScanning(true)}>
                <QrIcon />
                Escanear QR code
              </button>
              <span style={{ fontSize: 13, color: "#9c8768" }}>Ou abra o link que o mestre mandou.</span>
            </form>
          </div>
        </section>
        {mesas.loading && <div style={{ color: "#9c8768" }}>Carregando mesas…</div>}
      </main>
      <Modal open={scanning} onClose={() => setScanning(false)} maxWidth={420}>
        <QrScanner onResult={onScan} onClose={() => setScanning(false)} />
      </Modal>
    </div>
  );
}

