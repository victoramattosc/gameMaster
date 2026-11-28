import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "auth/AuthProvider";
import { createMesa, invitePlayer, inviteLink, updateMesa, uploadMesaFile, useInvites } from "data/api";
import { errorMessage } from "lib/supabase";
import type { Mesa, SystemKey } from "lib/types";
import { SYSTEM_LIST, SYSTEMS } from "systems";
import { DEFAULT_CUSTOM_SCHEMA } from "systems/custom";
import { IconBack, IconBook, IconCrown, IconUsers } from "ui/Icons";
import { QrCode } from "ui/Qr";
import { useUploadGuard } from "ui/Toast";
import styles from "./NewMesa.module.scss";

const RES_COLORS = ["#c2412d", "#3f7cc4", "#e0a040", "#8a5cc7", "#2a8a80", "#5c8a3a"];

export function NewMesaPage() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const guard = useUploadGuard();
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [sys, setSys] = useState<SystemKey>("op");
  const [showStatus, setShowStatus] = useState(true);
  const [attrs, setAttrs] = useState<string[]>(DEFAULT_CUSTOM_SCHEMA.attrs);
  const [resources, setResources] = useState(DEFAULT_CUSTOM_SCHEMA.resources);
  const [book, setBook] = useState<File | null>(null);
  const [seats, setSeats] = useState(5);
  const [mesa, setMesa] = useState<Mesa | null>(null);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const invites = useInvites(mesa?.id, !!mesa);

  const meta = SYSTEMS[sys];
  const labels = ["Sistema", "Regras e ficha", "Convidar jogadores"];

  async function next() {
    setErr("");
    if (step === 1) {
      if (!name.trim()) return setErr("Dê um nome para a mesa.");
      return setStep(2);
    }
    if (step === 2 && !mesa) {
      setBusy(true);
      try {
        const m = await createMesa({
          name: name.trim(),
          system: sys,
          seats,
          showStatus,
          customSchema: sys === "custom" ? { attrs: attrs.filter(Boolean), resources: resources.filter((r) => r.label) } : {},
        });
        if (book && profile) await uploadMesaFile(m.id, profile.id, book, "book");
        setMesa(m);
        setStep(3);
      } catch (e) {
        setErr(errorMessage(e));
      } finally {
        setBusy(false);
      }
      return;
    }
    setStep(Math.min(3, step + 1));
  }

  async function invite() {
    if (!mesa || !draft.trim()) return;
    setErr("");
    try {
      await invitePlayer(mesa.id, draft.trim());
      setDraft("");
      invites.reload();
    } catch (e) {
      setErr(errorMessage(e));
    }
  }

  async function changeSeats(v: number) {
    setSeats(v);
    if (mesa) await updateMesa(mesa.id, { seats: v }).catch((e) => setErr(errorMessage(e)));
  }

  async function copy() {
    if (!mesa) return;
    await navigator.clipboard?.writeText(inviteLink(mesa.invite_code)).catch(() => undefined);
    setCopied(true);
  }

  const canGoTo = (i: number) => i <= step || (i === 2 && !!name.trim()) || (i === 3 && !!mesa);

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <Link to="/mesas" className="gm-btn gm-ib gm-ib--round" aria-label="Voltar para minhas mesas"><IconBack /></Link>
        <span className="gm-display" style={{ fontSize: 26 }}>Nova mesa</span>
      </header>

      <div className={styles.wrap}>
        <div className={styles.mainCol}>
          <ol className={styles.steps}>
            {labels.map((l, i) => {
              const k = i + 1;
              return (
                <li key={l}>
                  <button
                    type="button"
                    className={`gm-btn ${styles.step}`}
                    aria-current={step === k ? "step" : undefined}
                    disabled={!canGoTo(k) || (!!mesa && k < 3)}
                    onClick={() => setStep(k)}
                  >
                    <span className={`${styles.num} ${step > k ? styles.numDone : ""}`}>{k}</span>
                    {l}
                  </button>
                </li>
              );
            })}
          </ol>

          <div className={styles.paper}>
            {step === 1 && (
              <div className={styles.stack}>
                <label className="gm-lbl gm-lbl--plain" style={{ fontSize: 15 }}>
                  Nome da mesa
                  <input className={`gm-in ${styles.nameIn}`} value={name} onChange={(e) => setName(e.target.value)} placeholder="Ex.: Sinais do Outro Lado" maxLength={120} autoFocus />
                </label>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 10 }}>Sistema de jogo</div>
                  <div className={styles.systems}>
                    {SYSTEM_LIST.map((s) => (
                      <button
                        key={s.key}
                        type="button"
                        className={`gm-btn ${styles.sysCard} ${sys === s.key ? styles.sysOn : ""} ${s.key === "custom" ? styles.sysCustom : ""}`}
                        style={{ ["--c" as string]: s.color }}
                        aria-pressed={sys === s.key}
                        onClick={() => setSys(s.key)}
                      >
                        <span className={styles.seal}>{s.mark}</span>
                        <span className="gm-display" style={{ fontSize: 22, color: "#2b1f16" }}>{s.label}</span>
                        <span style={{ fontSize: 14, color: "#5a4430", lineHeight: 1.4, fontWeight: 500 }}>{s.desc}</span>
                        <span style={{ fontSize: 13, color: "#6b5640" }}>{s.ships}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {step === 2 && (
              <div className={styles.stack}>
                <div>
                  <div style={{ fontWeight: 800, fontSize: 15, marginBottom: 8 }}>Livro de regras da mesa</div>
                  <div className={styles.book}>
                    <IconBook size={40} color="#8a5a12" />
                    <div style={{ flex: "1 1 220px" }}>
                      <div style={{ fontWeight: 800 }}>{book ? book.name : meta.bookHint}</div>
                      <div style={{ fontSize: 14, color: "#6b5640" }}>
                        PDF visível para mestre e jogadores pelo ícone de livro. Até 50 MB; dá para adicionar suplementos depois.
                      </div>
                    </div>
                    <label className="gm-btn gm-btn--ghost" style={{ borderColor: "#8a5a12", color: "#8a5a12", cursor: "pointer" }}>
                      {book ? "Trocar PDF" : "Enviar PDF"}
                      <input type="file" accept="application/pdf" className="gm-sr" onChange={(e) => {
                        const f = guard(e.target)[0];
                        if (f) setBook(f);
                      }} />
                    </label>
                  </div>
                </div>

                {sys === "custom" ? (
                  <div className={styles.stack} style={{ gap: 14 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>Monte a ficha do seu sistema</div>
                    <div className={styles.row}>
                      <span className={styles.rowLabel}>Atributos:</span>
                      {attrs.map((a, i) => (
                        <span key={i} className={styles.tag}>
                          <input aria-label={`Atributo ${i + 1}`} value={a} onChange={(e) => setAttrs(attrs.map((x, j) => (j === i ? e.target.value : x)))} />
                          <button type="button" aria-label={`Remover ${a}`} onClick={() => setAttrs(attrs.filter((_, j) => j !== i))}>×</button>
                        </span>
                      ))}
                      <button type="button" className="gm-btn gm-btn--dashed" style={{ height: 36, borderRadius: 999 }} onClick={() => setAttrs([...attrs, "Novo atributo"])}>+ atributo</button>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      <span className={styles.rowLabel}>Recursos que o mestre acompanha (barras de status):</span>
                      <div className={styles.row}>
                        {resources.map((r, i) => (
                          <span key={i} className={styles.res}>
                            <input type="color" aria-label={`Cor de ${r.label}`} value={r.color} onChange={(e) => setResources(resources.map((x, j) => (j === i ? { ...x, color: e.target.value } : x)))} />
                            <input aria-label={`Recurso ${i + 1}`} value={r.label} onChange={(e) => setResources(resources.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} />
                            <button type="button" aria-label={`Remover ${r.label}`} onClick={() => setResources(resources.filter((_, j) => j !== i))}>×</button>
                          </span>
                        ))}
                        <button type="button" className="gm-btn gm-btn--dashed" onClick={() => setResources([...resources, { label: "Recurso", color: RES_COLORS[resources.length % RES_COLORS.length] }])}>+ recurso</button>
                      </div>
                    </div>
                    <div style={{ fontSize: 14, color: "#6b5640" }}>
                      Na ficha, cada jogador pode adicionar campos de texto livre, número, lista de itens, caixa de seleção e fórmula (ex.: <b style={{ color: "#2b1f16" }}>Defesa = 10 + {attrs[0] || "Atributo"}</b>).
                    </div>
                  </div>
                ) : (
                  <div className={styles.stack} style={{ gap: 10 }}>
                    <div style={{ fontWeight: 800, fontSize: 15 }}>Ficha incluída: {meta.label}</div>
                    <div style={{ fontSize: 15, color: "#5a4430", lineHeight: 1.5 }}>{meta.summary}</div>
                  </div>
                )}
                <label className={styles.check}>
                  <input type="checkbox" checked={showStatus} onChange={(e) => setShowStatus(e.target.checked)} />
                  Mostrar ao mestre os status (vida, recursos, defesa e condições)
                </label>
                <label className={styles.check}>
                  <input type="checkbox" checked disabled />
                  Anotações e inventário dos jogadores ficam sempre privados
                </label>
              </div>
            )}

            {step === 3 && mesa && (
              <div className={styles.stack}>
                <div className={styles.row} style={{ alignItems: "stretch", gap: 12 }}>
                  <div className={styles.codeBox}>
                    <QrCode value={inviteLink(mesa.invite_code)} size={120} label={`QR code do convite para ${mesa.name}`} />
                    <div style={{ minWidth: 0 }}>
                      <div className="gm-eyebrow" style={{ color: "#c9b48a" }}>Código da mesa</div>
                      <div className="gm-num" style={{ fontSize: 30, letterSpacing: 3, margin: "6px 0 10px", color: "#e0a040" }}>{mesa.invite_code}</div>
                      <button type="button" className="gm-btn gm-btn--gold" style={{ height: 40, fontSize: 14 }} onClick={copy}>
                        {copied ? "Link copiado!" : "Copiar link de convite"}
                      </button>
                      <div style={{ fontSize: 12, color: "#c9b48a", marginTop: 8 }}>O grupo pode escanear, digitar o código ou abrir o link.</div>
                    </div>
                  </div>
                  <div style={{ flex: "2 1 320px", display: "flex", flexDirection: "column", gap: 8 }}>
                    <form onSubmit={(e) => { e.preventDefault(); invite(); }}>
                      <label className="gm-lbl gm-lbl--plain" style={{ fontSize: 15 }}>
                        Convidar por e-mail ou usuário
                        <span style={{ display: "flex", gap: 8 }}>
                          <input className="gm-in" value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="nome@exemplo.com" style={{ flex: 1, height: 48 }} />
                          <button type="submit" className="gm-btn gm-btn--primary">Convidar</button>
                        </span>
                      </label>
                    </form>
                    <label className={styles.check} style={{ marginTop: 4 }}>
                      Vagas na mesa
                      <select className="gm-in" value={seats} onChange={(e) => changeSeats(Number(e.target.value))} style={{ height: 40, width: 80 }}>
                        {[2, 3, 4, 5, 6, 8, 10].map((v) => <option key={v} value={v}>{v}</option>)}
                      </select>
                    </label>
                    <div style={{ fontSize: 13, color: "#6b5640" }}>
                      Quem ainda não tem conta recebe o convite ao se cadastrar com esse e-mail — ou use o link/código.
                    </div>
                  </div>
                </div>
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {invites.data.map((i) => (
                    <div key={i.id} className={styles.inviteRow}>
                      <span className={styles.avatar}>{i.invitee_label[0]?.toUpperCase()}</span>
                      <span style={{ flex: 1, fontWeight: 700, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis" }}>{i.invitee_label}</span>
                      <span className="gm-badge gm-badge--wait">{i.invitee_id ? "Pendente" : "Sem conta ainda"}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {err && <div className="gm-error" role="alert" style={{ marginTop: 16 }}>{err}</div>}

            <div className={styles.footer}>
              <button type="button" className="gm-btn gm-btn--ghost" onClick={() => (step === 1 ? navigate("/mesas") : setStep(step - 1))} disabled={step === 3}>
                Voltar
              </button>
              {step < 3 ? (
                <button type="button" className="gm-btn gm-btn--ink" style={{ height: 48 }} onClick={next} disabled={busy}>
                  {busy ? "Criando mesa…" : step === 2 ? "Criar mesa e continuar" : "Continuar"}
                </button>
              ) : (
                <Link to={`/mesa/${mesa?.id}`} className="gm-btn gm-btn--primary">Abrir a mesa</Link>
              )}
            </div>
          </div>
        </div>

        <aside className={styles.aside}>
          <div className="gm-eyebrow" style={{ color: "#c9b48a" }}>Prévia da mesa</div>
          <div className={styles.preview}>
            <div className={styles.previewBand} style={{ background: meta.color }}>{meta.label}</div>
            <div style={{ padding: 18, display: "flex", flexDirection: "column", gap: 12 }}>
              <div className="gm-display" style={{ fontSize: 26, lineHeight: 1.1 }}>{name || "Sua nova mesa"}</div>
              <div className={styles.previewLine}><IconCrown size={18} />1 mestre (você)</div>
              <div className={styles.previewLine}><IconUsers size={18} color="#c9b48a" />{invites.data.length} convidados · {seats} vagas</div>
              <div className={styles.previewLine}><IconBook size={18} color="#c9b48a" />{book ? book.name : meta.bookHint}</div>
            </div>
          </div>
          <div className={styles.note}>
            Cada jogador entra com a própria conta e preenche a ficha do sistema. Você vê só o status deles; anotações e detalhes da ficha continuam privados.
          </div>
        </aside>
      </div>
    </div>
  );
}
