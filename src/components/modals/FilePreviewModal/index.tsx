import React from "react";
import { useCampaign } from "../../../state/CampaignContext";
import { DocumentIcon } from "../../common/icons";
import { Modal } from "../Modal";
import styles from "./FilePreviewModal.module.scss";

export function FilePreviewModal() {
  const { state, activeCampaign, dispatch } = useCampaign();
  const file = activeCampaign.files.find((f) => f.id === state.ui.previewFileId);
  if (!file) return null;

  const close = () => dispatch({ type: "CLOSE_FILE_PREVIEW" });
  const isImage = file.type.startsWith("image/");

  return (
    <Modal onClose={close} width={520} title={file.name}>
      <div className={styles.body}>
        {isImage ? (
          <img src={file.dataUrl} alt={file.name} className={styles.image} />
        ) : (
          <div className={styles.placeholder}>
            <DocumentIcon size={48} />
            <span>Pré-visualização do documento</span>
          </div>
        )}
      </div>
    </Modal>
  );
}
