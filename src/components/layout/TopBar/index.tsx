import React, { useState } from "react";
import logo from "../../../assets/GM.png";
import { useIsMobile } from "../../../hooks/useIsMobile";
import { useCampaign } from "../../../state/CampaignContext";
import { ClearIcon, FilesIcon, HamburgerIcon, MusicIcon } from "../../common/icons";
import { CampaignTabs } from "../CampaignTabs";
import { MobileSidebar } from "../MobileSidebar";
import styles from "./TopBar.module.scss";

export function TopBar() {
  const { dispatch } = useCampaign();
  const isMobile = useIsMobile();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <header className={styles.bar}>
      <div className={styles.brand}>
        <img src={logo} alt="Game Master" className={styles.logo} />
        <div>
          <div className={styles.title}>GAME MASTER</div>
          <div className={styles.subtitle}>to GM by GM</div>
        </div>
      </div>

      {isMobile ? (
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className={`${styles.hamburger} gm-btn`}
          title="Menu"
          aria-label="Abrir menu"
        >
          <HamburgerIcon />
        </button>
      ) : (
        <>
          <CampaignTabs />

          <div className={styles.rightBar}>
            <button
              type="button"
              onClick={() => dispatch({ type: "TOGGLE_MUSIC_MODAL" })}
              className={`${styles.iconCircle} gm-btn`}
              title="Música"
            >
              <MusicIcon />
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "TOGGLE_FILES_MODAL" })}
              className={`${styles.iconCircle} gm-btn`}
              title="Arquivos"
            >
              <FilesIcon />
            </button>
            <span className={styles.divider} />
            <button
              type="button"
              onClick={() => dispatch({ type: "REQUEST_CLEAR_ALL" })}
              className={`${styles.clearAll} gm-btn`}
              title="Limpar tudo"
            >
              <ClearIcon size={15} />
            </button>
          </div>
        </>
      )}

      {isMobile && <MobileSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />}
    </header>
  );
}
