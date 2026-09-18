import React from "react";
import { ConsentBanner } from "../components/common/ConsentBanner";
import { WidgetGrid } from "../components/layout/WidgetGrid";
import { TopBar } from "../components/layout/TopBar";
import { ConfirmModal } from "../components/modals/ConfirmModal";
import { FilePreviewModal } from "../components/modals/FilePreviewModal";
import { FilesModal } from "../components/modals/FilesModal";
import { MusicModal } from "../components/modals/MusicModal";
import { CampaignProvider, useCampaign } from "../state/CampaignContext";
import styles from "./GameMasterApp.module.scss";

function Dashboard() {
  const { state } = useCampaign();
  const { ui } = state;

  return (
    <div className={styles.page}>
      <TopBar />
      <WidgetGrid />
      {ui.musicModalOpen && <MusicModal />}
      {ui.filesModalOpen && <FilesModal />}
      {ui.previewFileId && <FilePreviewModal />}
      {ui.confirmOpen && <ConfirmModal />}
      <ConsentBanner />
    </div>
  );
}

export function GameMasterApp() {
  return (
    <CampaignProvider>
      <Dashboard />
    </CampaignProvider>
  );
}
