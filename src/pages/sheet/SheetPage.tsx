import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "auth/AuthProvider";
import { claimItem, signedUrl, useFiles, useMyCharacter, usePresence, useReceivedItems } from "data/api";
import type { ChestItem, Mesa } from "lib/types";
import { AnySheet, SYSTEMS } from "systems";
import type { DndSheet as DndS } from "systems/dnd";
import type { OpSheet as OpS } from "systems/op";
import type { Op2Sheet as Op2S } from "systems/op2";
import type { CustomSheet as CustomS } from "systems/custom";
import { BellButton, NotificationsCard } from "components/AccountCards";
import { MapViewer } from "components/MapViewer";
import { Modal, PopoverCard } from "ui/Popover";
import { IconBack, IconBook, IconChest, IconImport, IconMap, IconNote, IconShield } from "ui/Icons";
import { Spinner } from "ui/bits";
import type { RollResult } from "./common";
import { DND_SECTIONS, DndSheet } from "./DndSheet";
import { OP_SECTIONS, OpSheet } from "./OpSheet";
import { OP2_SECTIONS, Op2Sheet } from "./Op2Sheet";
import { CUSTOM_SECTIONS, CustomSheet } from "./CustomSheet";
import { ImportModal } from "./ImportModal";
import styles from "./Sheet.module.scss";

type Tab = "status" | "skills" | "items" | "notes";

export function SheetPage({ mesa }: { mesa: Mesa }) {
  const { profile } = useAuth();
  const ch = useMyCharacter<AnySheet>(mesa, profile);
  const files = useFiles(mesa.id);
  const received = useReceivedItems(mesa.id, profile?.id);
  usePresence(mesa.id, profile?.id); // avisa o mestre que estou conectado
  const [modal, setModal] = useState<null | "map" | "import" | "notif">(null);
  const [rollRes, setRollRes] = useState<(RollResult & { k: number }) | null>(null);
  const [tab, setTab] = useState<Tab>("status");
  const sys = SYSTEMS[mesa.system];
  const maps = files.data.filter((f) => f.kind === "map" && f.shared);
  const handouts = files.data.filter((f) => f.kind === "file" && f.shared);

  if (!ch.sheet || !profile) return <Spinner label="Abrindo sua ficha…" />;
  const sheet = ch.sheet;
  const roll = (r: RollResult) => setRollRes({ ...r, k: Date.now() });
  // Cada ficha recebe o mesmo update tipado para o seu formato.
  const up = ch.update as unknown as <S>(fn: (s: S) => S) => void;

  const sections =
    mesa.system === "dnd" ? DND_SECTIONS : mesa.system === "op" ? OP_SECTIONS : mesa.system === "op2" ? OP2_SECTIONS : CUSTOM_SECTIONS;

  function takeItem(it: ChestItem) {
    ch.update((s) => addToInventory(mesa.system, s, it));
    claimItem(it.id).then(received.reload);
  }

  return (
    <div className={styles.page} style={{ ["--sys" as string]: sys.color }}>
      <header className={styles.header}>
        <Link to="/mesas" className="gm-btn gm-ib gm-ib--round" aria-label="Voltar para minhas mesas"><IconBack /></Link>
        <div className={styles.titleBox}>
          <div className="gm-eyebrow" style={{ color: "#c9b48a", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{mesa.name} · {sys.label}</div>
          <div style={{ display: "flex", alignItems: "baseline", gap: 10 }}>
            <span className="gm-display" style={{ fontSize: 26, lineHeight: 1.1 }}>{sys.sheetTitle}</span>
            <span className={styles.save} aria-live="polite">
              {ch.saveState === "saving" ? "salvando…" : ch.saveState === "saved" ? "salvo" : ch.saveState === "error" ? "erro ao salvar" : ""}
            </span>
          </div>
        </div>
        <div className={styles.tools}>
          <button type="button" className="gm-btn gm-btn--tool" onClick={() => setModal("map")} aria-label="Mapa">
            <IconMap size={22} /><span className={styles.toolLabel}>Mapa{maps.length ? ` (${maps.length})` : ""}</span>
          </button>
          <Link to={`/mesa/${mesa.id}/livro`} className="gm-btn gm-btn--tool" aria-label="Livro de regras">
            <IconBook size={22} /><span className={styles.toolLabel}>Livro</span>
          </Link>
          <button type="button" className="gm-btn gm-btn--tool" onClick={() => setModal("import")} aria-label="Importar ou exportar ficha">
            <IconImport size={22} /><span className={styles.toolLabel}>Importar</span>
          </button>
          <BellButton onClick={() => setModal("notif")} />
        </div>
      </header>

      <nav aria-label="Seções da ficha" className={styles.secNav}>
        {sections.map(([id, label]) => <a key={id} href={`#${id}`}>{label}</a>)}
      </nav>

      <main className={`${styles.main} ${styles["m-" + tab]}`}>
        {rollRes && (
          <div role="status" className={styles.roll}>
            <span key={rollRes.k} className={`gm-num ${styles.rollTotal}`} style={profile.dice_anim ? { animation: "gm-spin .5s ease-out" } : undefined}>{rollRes.total}</span>
            <span style={{ flex: 1, color: "#f1e6cc" }}>{rollRes.text}</span>
            <button type="button" className="gm-btn gm-x" onClick={() => setRollRes(null)} aria-label="Fechar resultado">✕</button>
          </div>
        )}

        {received.data.length > 0 && (
          <div className={styles.received} data-g="status items">
            <IconChest color="#a9d69a" />
            <div style={{ flex: "1 1 240px" }}>
              <div style={{ fontWeight: 800 }}>O mestre te entregou {received.data.length === 1 ? "um item" : `${received.data.length} itens`}</div>
              <div style={{ fontSize: 14, color: "#cfe0c0" }}>{received.data.map((i) => i.name).join(" · ")}</div>
            </div>
            {received.data.map((it) => (
              <button key={it.id} type="button" className="gm-btn gm-btn--gold" onClick={() => takeItem(it)}>Guardar “{it.name}”</button>
            ))}
          </div>
        )}

        {handouts.length > 0 && <Handouts files={handouts} />}

        {mesa.system === "dnd" && <DndSheet sheet={sheet as DndS} update={up<DndS>} roll={roll} mesa={mesa} />}
        {mesa.system === "op" && <OpSheet sheet={sheet as OpS} update={up<OpS>} roll={roll} mesa={mesa} />}
        {mesa.system === "op2" && <Op2Sheet sheet={sheet as Op2S} update={up<Op2S>} roll={roll} mesa={mesa} />}
        {mesa.system === "custom" && <CustomSheet sheet={sheet as CustomS} update={up<CustomS>} roll={roll} mesa={mesa} />}
      </main>

      <nav aria-label="Abas da ficha" className={styles.bottomNav}>
        {([
          ["status", "Status", <IconShield key="a" size={22} />],
          ["skills", "Perícias", <svg key="b" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M12 3l9 5v8l-9 5-9-5V8z M12 3v18" fill="none" stroke="currentColor" strokeWidth="2" /></svg>],
          ["items", "Itens", <svg key="c" viewBox="0 0 24 24" width="22" height="22" aria-hidden="true"><path d="M4 8h16v12H4z M9 8V5h6v3" fill="none" stroke="currentColor" strokeWidth="2" /></svg>],
          ["notes", "Notas", <IconNote key="d" size={22} />],
        ] as [Tab, string, React.ReactNode][]).map(([k, l, icon]) => (
          <button key={k} type="button" className={`gm-btn ${tab === k ? styles.navOn : ""}`} aria-current={tab === k ? "page" : undefined} onClick={() => { setTab(k); window.scrollTo({ top: 0 }); }}>
            {icon}
            {l}
          </button>
        ))}
      </nav>

      <Modal open={modal === "map"} onClose={() => setModal(null)} maxWidth={900}>
        <MapViewer maps={maps} onClose={() => setModal(null)} />
      </Modal>
      <Modal open={modal === "import"} onClose={() => setModal(null)} maxWidth={480}>
        <ImportModal mesa={mesa} current={sheet} playerName={profile.display_name} onImport={(s) => ch.replace(s)} onClose={() => setModal(null)} />
      </Modal>
      <PopoverCard open={modal === "notif"} onClose={() => setModal(null)}>
        <NotificationsCard onClose={() => setModal(null)} />
      </PopoverCard>
    </div>
  );
}

function Handouts({ files }: { files: { id: string; name: string; path: string; mime: string }[] }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="gm-panel" data-g="notes" style={{ padding: 14 }}>
      <button type="button" className="gm-btn" style={{ background: "none", color: "#f3c477", justifyContent: "flex-start", padding: 0 }} onClick={() => setOpen(!open)} aria-expanded={open}>
        <IconChest size={18} /> Arquivos compartilhados pelo mestre ({files.length})
      </button>
      {open && (
        <ul style={{ display: "flex", flexDirection: "column", gap: 6 }}>
          {files.map((f) => <HandoutLink key={f.id} path={f.path} name={f.name} />)}
        </ul>
      )}
    </div>
  );
}

function HandoutLink({ path, name }: { path: string; name: string }) {
  const [busy, setBusy] = useState(false);
  return (
    <li>
      <button
        type="button"
        className="gm-btn gm-btn--ghost-dark"
        style={{ width: "100%", justifyContent: "flex-start" }}
        disabled={busy}
        onClick={async () => {
          setBusy(true);
          const url = await signedUrl(path).catch(() => null);
          setBusy(false);
          if (url) window.open(url, "_blank", "noopener");
        }}
      >
        {name}
      </button>
    </li>
  );
}

function addToInventory(system: Mesa["system"], s: AnySheet, it: ChestItem): AnySheet {
  const label = it.note ? `${it.name} (${it.note})` : it.name;
  if (system === "op") {
    const o = s as OpS;
    return { ...o, items: [...o.items, { n: it.name, c: it.category, e: 1 }] };
  }
  if (system === "dnd") {
    const d = s as DndS;
    return { ...d, t: { ...d.t, equipamento: (d.t.equipamento ? d.t.equipamento + "\n" : "") + label } };
  }
  const x = s as Op2S | CustomS;
  return { ...x, items: [...(x.items || []), { n: label, e: 1 }] } as AnySheet;
}
