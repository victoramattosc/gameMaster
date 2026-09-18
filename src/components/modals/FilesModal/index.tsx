import React, { useRef } from "react";
import { useCampaign } from "../../../state/CampaignContext";
import { readFileAsDataUrl } from "../../../utils/files";
import { DocumentIcon, FilesIcon, TrashIcon } from "../../common/icons";
import { Modal } from "../Modal";
import styles from "./FilesModal.module.scss";

export function FilesModal() {
  const { activeCampaign, dispatch } = useCampaign();
  const inputRef = useRef<HTMLInputElement>(null);

  const close = () => dispatch({ type: "TOGGLE_FILES_MODAL" });

  const ingest = async (fileList: FileList | null) => {
    if (!fileList) return;
    for (const file of Array.from(fileList)) {
      const dataUrl = await readFileAsDataUrl(file);
      dispatch({ type: "ADD_FILE", name: file.name, fileType: file.type, dataUrl });
    }
  };

  return (
    <Modal
      onClose={close}
      width={520}
      title={
        <>
          <FilesIcon size={18} /> Baú de Arquivos
        </>
      }
    >
      <label
        className={`${styles.dropZone} gm-btn`}
        onDrop={(e) => {
          e.preventDefault();
          ingest(e.dataTransfer.files);
        }}
        onDragOver={(e) => e.preventDefault()}
      >
        Arraste arquivos aqui ou clique para escolher
        <input
          ref={inputRef}
          type="file"
          multiple
          onChange={(e) => ingest(e.target.files)}
          className={styles.hiddenInput}
        />
      </label>

      <ul className={styles.list}>
        {activeCampaign.files.map((f) => (
          <li key={f.id} className={styles.row}>
            <button
              type="button"
              onClick={() => dispatch({ type: "OPEN_FILE_PREVIEW", id: f.id })}
              className={`${styles.link} gm-btn`}
            >
              <DocumentIcon />
              <span className={styles.name}>{f.name}</span>
            </button>
            <button
              type="button"
              onClick={() => dispatch({ type: "REMOVE_FILE", id: f.id })}
              className={`${styles.trash} gm-btn`}
              aria-label="Remover arquivo"
            >
              <TrashIcon />
            </button>
          </li>
        ))}
      </ul>
    </Modal>
  );
}
