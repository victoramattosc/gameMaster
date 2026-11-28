import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "auth/AuthProvider";
import { deleteNotification, markAllRead, respondInvite, useNotifications } from "data/api";
import { errorMessage } from "lib/supabase";
import type { AppNotification } from "lib/types";
import { CardShell } from "ui/Popover";
import { IconBell, IconDie, IconLogout, IconNote, IconUser } from "ui/Icons";
import { Seal, timeAgo } from "ui/bits";
import styles from "./AccountCards.module.scss";

const KIND: Record<string, { mark: string; color: string }> = {
  invite: { mark: "✉", color: "#b23a2c" },
  map: { mark: "⌖", color: "#7a4fc0" },
  session: { mark: "☾", color: "#2a8a80" },
  join: { mark: "+", color: "#8a6a2e" },
  item: { mark: "◆", color: "#5c7a2e" },
  file: { mark: "▤", color: "#5a4430" },
};

export function NotificationsCard({ onClose }: { onClose(): void }) {
  const { profile } = useAuth();
  const { data, reload } = useNotifications(profile?.id);
  const navigate = useNavigate();
  const [err, setErr] = useState("");

  async function answer(n: AppNotification, accept: boolean) {
    if (!n.data.invite_id) return;
    try {
      const mesaId = await respondInvite(n.data.invite_id, accept);
      await deleteNotification(n.id);
      reload();
      if (accept) {
        onClose();
        navigate(`/mesa/${mesaId}`);
      }
    } catch (e) {
      setErr(errorMessage(e));
    }
  }

  return (
    <CardShell
      width={360}
      title="Notificações"
      icon={<IconBell />}
      onClose={onClose}
      extra={
        <button type="button" className={`gm-btn ${styles.readAll}`} onClick={() => profile && markAllRead(profile.id).then(reload)}>
          Marcar como lidas
        </button>
      }
    >
      {err && <div className="gm-error" style={{ margin: 8 }}>{err}</div>}
      <ul className={styles.list}>
        {data.length === 0 && <li className={styles.empty}>Nada por aqui ainda.</li>}
        {data.map((n) => {
          const k = KIND[n.kind] || KIND.file;
          const actionable = n.kind === "invite" && n.data.invite_id && !n.read;
          return (
            <li key={n.id} className={`${styles.row} ${n.read ? "" : styles.unread}`}>
              <span className={styles.icon} style={{ background: k.color }} aria-hidden="true">{k.mark}</span>
              <div style={{ flex: 1, minWidth: 0 }}>
                {n.data.mesa_id && n.kind !== "invite" ? (
                  <Link to={`/mesa/${n.data.mesa_id}`} onClick={onClose} className={styles.title}>{n.title}</Link>
                ) : (
                  <div className={styles.title}>{n.title}</div>
                )}
                <div className={styles.body}>{n.body}</div>
                <div className={styles.when}>{timeAgo(n.created_at)}</div>
                {actionable && (
                  <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
                    <button type="button" className="gm-btn gm-btn--primary" style={{ height: 36, fontSize: 14, padding: "0 12px" }} onClick={() => answer(n, true)}>Aceitar</button>
                    <button type="button" className="gm-btn gm-btn--ghost" style={{ height: 36, fontSize: 14, padding: "0 12px" }} onClick={() => answer(n, false)}>Recusar</button>
                  </div>
                )}
              </div>
              {!n.read && <span className={styles.badge} aria-label="Não lida" />}
            </li>
          );
        })}
      </ul>
      <div className={styles.foot}>Você recebe avisos de convites, sessões e do que o mestre compartilhar.</div>
    </CardShell>
  );
}

export function ProfileCard({ onClose, gmCount, playCount }: { onClose(): void; gmCount?: number; playCount?: number }) {
  const { profile, user, signOut, updateProfile } = useAuth();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(profile?.display_name || "");
  const [color, setColor] = useState(profile?.color || "#e0a040");
  const [err, setErr] = useState("");
  if (!profile) return null;

  async function save() {
    try {
      await updateProfile({ display_name: name.trim() || profile!.display_name, color });
      setEditing(false);
    } catch (e) {
      setErr(errorMessage(e));
    }
  }

  return (
    <section className={styles.profile}>
      <header className={styles.profileHead}>
        <span className={styles.bigAvatar} style={{ background: profile.color }}>{profile.display_name[0]?.toUpperCase()}</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="gm-display" style={{ fontSize: 22, lineHeight: 1.1 }}>{profile.display_name}</div>
          <div style={{ fontSize: 14, color: "#c9b48a", overflow: "hidden", textOverflow: "ellipsis" }}>{user?.email}</div>
        </div>
        <button type="button" className="gm-x gm-btn" onClick={onClose} aria-label="Fechar perfil" style={{ alignSelf: "flex-start" }}>✕</button>
      </header>
      {(gmCount !== undefined || playCount !== undefined) && (
        <div className={styles.stats}>
          <div><b className="gm-num">{gmCount ?? 0}</b><span>MESTRANDO</span></div>
          <div><b className="gm-num">{playCount ?? 0}</b><span>JOGANDO</span></div>
        </div>
      )}
      {editing ? (
        <div style={{ padding: 16, display: "flex", flexDirection: "column", gap: 10 }}>
          <label className="gm-lbl">Nome<input className="gm-in" value={name} onChange={(e) => setName(e.target.value)} /></label>
          <label className="gm-lbl" style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
            Cor do seu selo
            <input type="color" value={color} onChange={(e) => setColor(e.target.value)} style={{ width: 44, height: 32, border: "none", background: "none" }} />
          </label>
          {err && <div className="gm-error">{err}</div>}
          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" className="gm-btn gm-btn--ink" onClick={save}>Salvar</button>
            <button type="button" className="gm-btn gm-btn--ghost" onClick={() => setEditing(false)}>Cancelar</button>
          </div>
        </div>
      ) : (
        <nav aria-label="Opções da conta" className={styles.menu}>
          <button type="button" className="gm-btn" onClick={() => setEditing(true)}><IconUser color="#8a5a12" />Editar nome e cor</button>
          <button type="button" className="gm-btn" onClick={() => { onClose(); navigate("/mesas#jogando"); }}><IconNote color="#8a5a12" />Meus personagens</button>
          <label>
            <IconDie color="#8a5a12" />
            <span style={{ flex: 1 }}>Animação de dados</span>
            <input type="checkbox" checked={profile.dice_anim} onChange={(e) => updateProfile({ dice_anim: e.target.checked })} />
          </label>
          <button type="button" className={`gm-btn ${styles.logout}`} onClick={async () => { await signOut(); navigate("/entrar"); }}>
            <IconLogout />Sair
          </button>
        </nav>
      )}
    </section>
  );
}

export function ProfileButton({ onClick }: { onClick(): void }) {
  const { profile } = useAuth();
  if (!profile) return null;
  return (
    <button type="button" className={`gm-btn ${styles.profileBtn}`} onClick={onClick} aria-label="Abrir perfil">
      <Seal name={profile.display_name} color={profile.color} size={36} />
      <span className={styles.profileName}>{profile.display_name}</span>
      <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
    </button>
  );
}

export function BellButton({ onClick }: { onClick(): void }) {
  const { profile } = useAuth();
  const { unread } = useNotifications(profile?.id);
  return (
    <button type="button" className={`gm-btn gm-ib gm-ib--round ${styles.bell}`} onClick={onClick} aria-label={unread ? `Notificações (${unread} novas)` : "Notificações"}>
      <IconBell />
      {unread > 0 && <span className={styles.bellDot} />}
    </button>
  );
}
