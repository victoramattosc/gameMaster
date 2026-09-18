import React from "react";
import { useCampaign } from "../../../state/CampaignContext";
import { ClearIcon, WarningIcon } from "../../common/icons";
import { Modal } from "../Modal";
import styles from "./ConfirmModal.module.scss";

export function ConfirmModal() {
  const { state, dispatch } = useCampaign();
  const { ui } = state;
  const isDelete = ui.confirmType === "deleteCampaign";

  const cancel = () => dispatch({ type: "CLOSE_CONFIRM" });
  const confirm = () => dispatch({ type: "APPLY_CONFIRM" });

  return (
    <Modal
      onClose={cancel}
      width={360}
      title={
        <>
          {isDelete ? <WarningIcon /> : <ClearIcon size={18} />}
          {isDelete ? "Excluir mesa" : "Limpar conteúdo"}
        </>
      }
    >
      <div className={styles.body}>{ui.confirmMessage}</div>
      <div className={styles.actions}>
        <button type="button" onClick={cancel} className={`${styles.cancel} gm-btn`}>
          Cancelar
        </button>
        <button type="button" onClick={confirm} className={`${styles.danger} gm-btn`}>
          {isDelete ? "Excluir" : "Limpar"}
        </button>
      </div>
    </Modal>
  );
}
