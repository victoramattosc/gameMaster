import React, { useEffect, useState } from "react";
import { myOtherCharacters, OtherCharacter } from "data/api";
import { errorMessage } from "lib/supabase";
import type { Mesa } from "lib/types";
import { AnySheet, SYSTEMS } from "systems";
import { mapPdfSheet, readPdfFields } from "systems/pdfImport";
import { CardShell } from "ui/Popover";
import { IconCheck, IconExport, IconFile, IconImport } from "ui/Icons";
import styles from "./Import.module.scss";

type Step = "choose" | "review" | "done";

export function ImportModal({
  mesa,
  current,
  playerName,
  onImport,
  onClose,
}: {
  mesa: Mesa;
  current: AnySheet;
  playerName: string;
  onImport(sheet: unknown): void;
  onClose(): void;
}) {
  const sys = SYSTEMS[mesa.system];
  const [step, setStep] = useState<Step>("choose");
  const [source, setSource] = useState("");
  const [parsed, setParsed] = useState<unknown>(null);
  const [found, setFound] = useState<string[]>([]);
  const [others, setOthers] = useState<OtherCharacter[] | null>(null);
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    myOtherCharacters(mesa.system, mesa.id).then(setOthers).catch(() => setOthers([]));
  }, [mesa.system, mesa.id]);

  async function fromJson(f: File) {
    const data = JSON.parse(await f.text());
    if (data?.app !== "gamemaster" || !data.sheet) throw new Error("Esse arquivo não é uma ficha exportada do Game Master.");
    if (data.system !== mesa.system) throw new Error(`Essa ficha é de ${SYSTEMS[data.system as keyof typeof SYSTEMS]?.label || data.system}, mas a mesa usa ${sys.label}.`);
    return { sheet: data.sheet, found: sys.importFields };
  }

  async function fromPdf(f: File) {
    const fields = await readPdfFields(await f.arrayBuffer());
    if (!Object.keys(fields).length) throw new Error("Não achamos campos preenchidos nesse PDF. Ele precisa ser a ficha preenchível (com campos de formulário).");
    const r = mapPdfSheet(mesa.system, fields, playerName);
    if (!r) throw new Error(`Importação de PDF ainda não tem mapeamento para ${sys.label}. Use um arquivo exportado do Game Master.`);
    return r;
  }


  async function pickFile(f: File | undefined, kind: "pdf" | "json") {
    if (!f) return;
    setErr("");
    setBusy(true);
    try {
      const r = kind === "pdf" ? await fromPdf(f) : await fromJson(f);
      if (!r.found.length) throw new Error("Nenhum campo reconhecido nesse arquivo.");
      setParsed(r.sheet);
      setFound(r.found);
      setSource(f.name);
      setStep("review");
    } catch (e) {
      setErr(errorMessage(e));
    } finally {
      setBusy(false);
    }
  }

  function exportJson() {
    const blob = new Blob([JSON.stringify({ app: "gamemaster", v: 1, system: mesa.system, sheet: current }, null, 2)], { type: "application/json" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    const name = ("name" in current && current.name) || ("t" in current && (current.t as { nome?: string }).nome) || "ficha";
    a.download = `${String(name).replace(/[^\w\- ]+/g, "").trim() || "ficha"}.gamemaster.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <CardShell
      title={<>Importar ficha<div style={{ fontFamily: "Alegreya Sans, sans-serif", fontSize: 13, color: "#c9b48a" }}>Sistema da mesa: {sys.label}</div></>}
      icon={<IconImport size={22} />}
      onClose={onClose}
    >
      <div className={styles.body}>
        {step === "choose" && (
          <>
            <div style={{ fontSize: 15, color: "#5a4430" }}>Já tem a ficha pronta? Traga ela inteira de uma vez.</div>
            {mesa.system !== "custom" && (
              <label className={styles.opt}>
                <span className={styles.mark}>PDF</span>
                <span style={{ flex: 1, minWidth: 0 }}>
                  <b>PDF da ficha preenchida</b>
                  <span>A ficha oficial preenchível do sistema (com campos de formulário).</span>
                </span>
                <input type="file" accept=".pdf,application/pdf" className={styles.cover} aria-label="Escolher PDF da ficha" onChange={(e) => pickFile(e.target.files?.[0], "pdf")} />
              </label>
            )}
            <label className={styles.opt}>
              <span className={styles.mark}>GM</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>Arquivo exportado do Game Master</b>
                <span>Um .json baixado de outra mesa ou de um amigo.</span>
              </span>
              <input type="file" accept=".json,application/json" className={styles.cover} aria-label="Escolher arquivo exportado" onChange={(e) => pickFile(e.target.files?.[0], "json")} />
            </label>
            <div className={styles.opt} style={{ cursor: "default", alignItems: "flex-start" }}>
              <span className={styles.mark}>⇄</span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <b>Copiar de outra mesa minha</b>
                <span>Usa um personagem que você já tem em outra mesa de {sys.label}.</span>
                {others === null && <span>Procurando…</span>}
                {others?.length === 0 && <span style={{ fontStyle: "italic" }}>Nenhum personagem seu em outras mesas deste sistema.</span>}
                <span style={{ display: "flex", flexDirection: "column", gap: 6, marginTop: 6 }}>
                  {others?.map((o) => (
                    <button
                      key={o.id}
                      type="button"
                      className="gm-btn gm-btn--ghost"
                      style={{ justifyContent: "flex-start", height: 38 }}
                      onClick={() => {
                        setParsed(o.sheet);
                        setFound(sys.importFields);
                        setSource(`${o.name || "Personagem"} de “${o.mesa_name}”`);
                        setStep("review");
                      }}
                    >
                      {o.name || "Sem nome"} · {o.mesa_name}
                    </button>
                  ))}
                </span>
              </span>
            </div>
            <button type="button" className="gm-btn gm-btn--ghost" onClick={exportJson} style={{ alignSelf: "flex-start" }}>
              <IconExport size={18} />
              Exportar esta ficha (.json)
            </button>
            {busy && <div className="gm-hint">Lendo arquivo…</div>}
          </>
        )}

        {step === "review" && (
          <>
            <div className={styles.fileRow}>
              <IconFile color="#8a5a12" />
              <span style={{ flex: 1, minWidth: 0, fontWeight: 800, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{source}</span>
              <button type="button" className="gm-btn gm-btn--ghost" style={{ height: 32, fontSize: 13 }} onClick={() => setStep("choose")}>Trocar</button>
            </div>
            <div style={{ fontWeight: 800 }}>Dados encontrados:</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {found.map((f) => <span key={f} className="gm-badge gm-badge--ok" style={{ fontSize: 13 }}>✓ {f}</span>)}
            </div>
            <div className={styles.warn}>Os campos importados substituem os atuais. Valores automáticos (modificadores, PV máximo, Defesa…) são recalculados.</div>
            <button
              type="button"
              className="gm-btn gm-btn--primary"
              onClick={() => {
                onImport(parsed);
                setStep("done");
              }}
            >
              Importar ficha
            </button>
          </>
        )}

        {step === "done" && (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: "18px 8px", textAlign: "center" }}>
            <span style={{ width: 60, height: 60, borderRadius: "50%", background: "#5c8a3a", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconCheck size={30} color="#fff" />
            </span>
            <div className="gm-display" style={{ fontSize: 24 }}>Ficha importada!</div>
            <div style={{ fontSize: 15, color: "#5a4430" }}>Confira os campos e ajuste o que for preciso.</div>
            <button type="button" className="gm-btn gm-btn--ink" onClick={onClose}>Ver ficha</button>
          </div>
        )}

        {err && <div className="gm-error" role="alert">{err}</div>}
      </div>
    </CardShell>
  );
}
