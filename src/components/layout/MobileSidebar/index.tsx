import React from "react";
import { useCampaign } from "../../../state/CampaignContext";
import { ClearIcon, FilesIcon, MusicIcon } from "../../common/icons";
import { CampaignTabs } from "../CampaignTabs";
import styles from "./MobileSidebar.module.scss";

interface MobileSidebarProps {
  open: boolean;
  onClose: () => void;
}

export function MobileSidebar({ open, onClose }: MobileSidebarProps) {
  const { dispatch } = useCampaign();

  const runAndClose = (action: () => void) => {
    action();
    onClose();
  };

  return (
    <>
      <div
        className={[styles.backdrop, open ? styles.backdropOpen : ""].join(" ")}
        onClick={onClose}
        aria-hidden={!open}
      />
      <aside
        className={[styles.panel, open ? styles.panelOpen : ""].join(" ")}
        aria-hidden={!open}
      >
        <div className={styles.actions}>
          <button
            type="button"
            onClick={() => runAndClose(() => dispatch({ type: "TOGGLE_MUSIC_MODAL" }))}
            className={`${styles.actionRow} gm-btn`}
          >
            <span className={styles.actionIcon}>
              <MusicIcon size={16} />
            </span>
            Música
          </button>
          <button
            type="button"
            onClick={() => runAndClose(() => dispatch({ type: "TOGGLE_FILES_MODAL" }))}
            className={`${styles.actionRow} gm-btn`}
          >
            <span className={styles.actionIcon}>
              <FilesIcon size={16} />
            </span>
            Baú de Arquivos
          </button>
          <button
            type="button"
            onClick={() => runAndClose(() => dispatch({ type: "REQUEST_CLEAR_ALL" }))}
            className={`${styles.actionRow} ${styles.actionRowDanger} gm-btn`}
          >
            <span className={`${styles.actionIcon} ${styles.actionIconDanger}`}>
              <ClearIcon size={14} />
            </span>
            Limpar tudo
          </button>
        </div>

        <div className={styles.divider} />

        <div className={styles.campaignsHeader}>Mesas</div>
        <div className={styles.campaignsList}>
          <CampaignTabs orientation="vertical" onSelect={onClose} />
        </div>
      </aside>
    </>
  );
}
