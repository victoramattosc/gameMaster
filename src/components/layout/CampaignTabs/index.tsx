import React from "react";
import { useCampaign } from "../../../state/CampaignContext";
import { CheckIcon, EditIcon, PlusIcon, XIcon } from "../../common/icons";
import styles from "./CampaignTabs.module.scss";

interface CampaignTabsProps {
  orientation?: "horizontal" | "vertical";
  onSelect?: () => void;
}

export function CampaignTabs({ orientation = "horizontal", onSelect }: CampaignTabsProps) {
  const { state, dispatch } = useCampaign();
  const { campaigns, activeId, ui } = state;
  const canDelete = campaigns.length > 1;
  const isVertical = orientation === "vertical";

  const selectCampaign = (id: string) => {
    dispatch({ type: "SELECT_CAMPAIGN", id });
    onSelect?.();
  };

  return (
    <div className={[styles.bar, isVertical ? styles.barVertical : "", isVertical ? "" : "gm-scroll-x"].join(" ")}>
      {campaigns.map((c) => {
        const isActive = c.id === activeId;
        const isRenaming = isActive && ui.renamingOpen;

        return (
          <div key={c.id} className={[styles.tab, isVertical ? styles.tabVertical : "", "gm-tab"].join(" ")}>
            {isRenaming ? (
              <>
                <input
                  value={ui.renameValue}
                  onChange={(e) => dispatch({ type: "CHANGE_RENAME_VALUE", value: e.target.value })}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") dispatch({ type: "CONFIRM_RENAME" });
                    else if (e.key === "Escape") dispatch({ type: "CANCEL_RENAME" });
                  }}
                  autoFocus
                  className={[styles.renameInput, isVertical ? styles.renameInputVertical : ""].join(" ")}
                />
                <button
                  type="button"
                  onClick={() => dispatch({ type: "CONFIRM_RENAME" })}
                  className={`${styles.renameConfirm} gm-btn`}
                  title="Confirmar"
                >
                  <CheckIcon />
                </button>
                <button
                  type="button"
                  onClick={() => dispatch({ type: "CANCEL_RENAME" })}
                  className={`${styles.renameCancel} gm-btn`}
                  title="Cancelar"
                >
                  <XIcon />
                </button>
              </>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => selectCampaign(c.id)}
                  className={[
                    styles.tabBtn,
                    isActive ? styles.tabBtnActive : "",
                    isVertical ? styles.tabBtnVertical : "",
                  ].join(" ")}
                >
                  {c.name}
                </button>
                {isActive && (
                  <>
                    <button
                      type="button"
                      onClick={() => dispatch({ type: "OPEN_RENAME" })}
                      className={`${styles.iconBtn} gm-btn`}
                      title="Renomear mesa"
                    >
                      <EditIcon />
                    </button>
                    {canDelete && (
                      <button
                        type="button"
                        onClick={() => dispatch({ type: "REQUEST_DELETE_CAMPAIGN" })}
                        className={`${styles.iconBtnDanger} gm-btn`}
                        title="Excluir mesa"
                      >
                        <XIcon />
                      </button>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => dispatch({ type: "ADD_CAMPAIGN" })}
        className={[styles.addTab, isVertical ? styles.addTabVertical : ""].join(" ")}
        title="Nova mesa"
      >
        <PlusIcon size={13} />
        {isVertical && <span>Nova mesa</span>}
      </button>
    </div>
  );
}
