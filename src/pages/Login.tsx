import React, { useCallback, useEffect, useState } from "react";
import { Navigate, useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "auth/AuthProvider";
import { errorMessage } from "lib/supabase";
import { joinByCode } from "data/api";
import { SYSTEM_LIST } from "systems";
import { IconArrow, IconMail, Logo, QrIcon } from "ui/Icons";
import { Modal } from "ui/Popover";
import { QrScanner } from "ui/Qr";
import styles from "./Login.module.scss";

export const PENDING_INVITE_KEY = "gm_pending_invite";

export function LoginPage() {
  const { session, loading, signIn, signUp } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const urlCode = params.get("convite") || "";
  const back = params.get("voltar") || "/mesas";

  const [mode, setMode] = useState<"login" | "signup">(urlCode ? "signup" : "login");
  const [showInvite, setShowInvite] = useState(!!urlCode);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState(urlCode);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState("");
  const [scanning, setScanning] = useState(false);
  const onScan = useCallback((c: string) => {
    setScanning(false);
    setCode(c);
    setShowInvite(true);
  }, []);

  useEffect(() => {
    if (urlCode) setCode(urlCode);
  }, [urlCode]);

  // Já logado e chegou por link de convite: entra direto na mesa.
  useEffect(() => {
    if (!session || !urlCode) return;
    joinByCode(urlCode)
      .then((id) => navigate(`/mesa/${id}`, { replace: true }))
      .catch((e) => setError(errorMessage(e)));
  }, [session, urlCode, navigate]);

  if (!loading && session && !urlCode) return <Navigate to={back} replace />;

  const signup = mode === "signup";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setInfo("");
    setBusy(true);
    try {
      const trimmedCode = code.trim();
      if (signup) {
        if (!name.trim()) throw new Error("Diga como o grupo te chama.");
        const { needsConfirmation } = await signUp(email, password, name);
        if (needsConfirmation) {
          if (trimmedCode) localStorage.setItem(PENDING_INVITE_KEY, trimmedCode);
          setInfo("Conta criada! Enviamos um link de confirmação para o seu e-mail. Depois de confirmar, é só entrar.");
          setMode("login");
          return;
        }
      } else {
        await signIn(email, password);
      }
      if (trimmedCode) {
        const id = await joinByCode(trimmedCode);
        navigate(`/mesa/${id}`, { replace: true });
      } else {
        navigate(back, { replace: true });
      }
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.brand}>
          <Logo size={52} />
          <div>
            <div className={`gm-display ${styles.brandName}`}>Game Master</div>
            <div className={styles.brandTag}>A mesa inteira num só lugar</div>
          </div>
        </div>

        <div className={styles.pitch}>
          <h1 className="gm-display">
            Mestre conduz.
            <br />
            Jogadores vivem a ficha.
          </h1>
          <p>
            Crie sua mesa, convide o grupo e cada jogador abre a própria ficha no celular — com cálculos automáticos e o
            livro de regras a um toque. O mestre acompanha a vida e os recursos de todos em tempo real.
          </p>
        </div>

        <div className={styles.systems}>
          <div className="gm-eyebrow" style={{ color: "#c9b48a" }}>Sistemas prontos</div>
          <div className={styles.pills}>
            {SYSTEM_LIST.map((s) => (
              <span key={s.key} className={`${styles.pill} ${s.key === "custom" ? styles.pillCustom : ""}`} style={{ ["--c" as string]: s.color }}>
                <span className={styles.dot} />
                {s.label}
              </span>
            ))}
          </div>
        </div>
      </section>

      <section className={styles.formSide}>
        <form className={styles.card} onSubmit={submit}>
          <div className="gm-seg" role="tablist" style={{ marginBottom: 26 }}>
            <button type="button" role="tab" aria-selected={!signup} className="gm-btn" onClick={() => setMode("login")}>Entrar</button>
            <button type="button" role="tab" aria-selected={signup} className="gm-btn" onClick={() => setMode("signup")}>Criar conta</button>
          </div>

          <h2 className={`gm-display ${styles.heading}`}>{signup ? "Junte-se à mesa" : "Bem-vindo de volta"}</h2>
          <p className={styles.sub}>{signup ? "Crie sua conta para mestrar ou jogar." : "Entre para ver suas mesas e fichas."}</p>

          <div className={styles.fields}>
            {signup && (
              <label className="gm-lbl gm-lbl--plain">
                Nome de aventureiro
                <input className="gm-in" value={name} onChange={(e) => setName(e.target.value)} placeholder="Como o grupo te chama" autoComplete="nickname" required />
              </label>
            )}
            <label className="gm-lbl gm-lbl--plain">
              E-mail
              <input className="gm-in" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@exemplo.com" autoComplete="email" required />
            </label>
            <label className="gm-lbl gm-lbl--plain">
              Senha
              <input
                className="gm-in"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                autoComplete={signup ? "new-password" : "current-password"}
                minLength={6}
                required
              />
            </label>

            {showInvite && (
              <label className="gm-lbl gm-lbl--plain">
                Código de convite da mesa
                <span style={{ display: "flex", gap: 8 }}>
                  <input className={`gm-in ${styles.code}`} style={{ flex: 1 }} value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} placeholder="Ex.: DRAGA-7K2Q" />
                  <button type="button" className={`gm-btn ${styles.scan}`} onClick={() => setScanning(true)} aria-label="Escanear QR code do convite">
                    <QrIcon size={22} />
                  </button>
                </span>
              </label>
            )}

            {error && <div className="gm-error" role="alert">{error}</div>}
            {info && <div className={styles.info} role="status">{info}</div>}

            <button type="submit" className="gm-btn gm-btn--primary" disabled={busy} style={{ marginTop: 6, height: 52, fontSize: 17 }}>
              {busy ? "Aguarde…" : signup ? "Criar conta" : "Entrar"}
              <IconArrow size={18} />
            </button>

            <button type="button" className={`gm-btn ${styles.inviteToggle}`} onClick={() => setShowInvite((v) => !v)}>
              <IconMail size={18} />
              {showInvite ? "Esconder código de convite" : "Recebi um convite para uma mesa"}
            </button>
          </div>

          <div className={styles.foot}>Uma conta serve para tudo: você pode ser mestre em uma mesa e jogador em outra.</div>
        </form>
      </section>
      <Modal open={scanning} onClose={() => setScanning(false)} maxWidth={420}>
        <QrScanner onResult={onScan} onClose={() => setScanning(false)} />
      </Modal>
    </div>
  );
}
