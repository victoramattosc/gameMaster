import React, { useState } from "react";
import { useCampaign } from "../../../state/CampaignContext";
import { AddRow } from "../../common/AddRow";
import { ConditionPopover } from "../../common/ConditionPopover";
import { Chip } from "../../common/Pill";
import { ChevronIcon, TrashIcon } from "../../common/icons";
import styles from "./PlayersWidget.module.scss";

export function PlayersWidget() {
  const { activeCampaign, dispatch } = useCampaign();
  const [newPlayerName, setNewPlayerName] = useState("");

  const addPlayer = () => {
    dispatch({ type: "ADD_PLAYER", name: newPlayerName });
    setNewPlayerName("");
  };

  return (
    <div>
      <AddRow value={newPlayerName} onChange={setNewPlayerName} onSubmit={addPlayer} placeholder="Insira a ordem" />

      <ul className={styles.list}>
        {activeCampaign.players.map((p, i) => (
          <li key={p.id} className={styles.card}>
            <div className={styles.row}>
              <span className={styles.badge}>{i + 1}</span>
              <span className={styles.name}>{p.name}</span>
              <button
                type="button"
                onClick={() => dispatch({ type: "MOVE_PLAYER", id: p.id, dir: "up" })}
                className={`${styles.chevronBtn} gm-btn`}
                aria-label="Mover para cima"
              >
                <ChevronIcon />
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "MOVE_PLAYER", id: p.id, dir: "down" })}
                className={`${styles.chevronBtn} gm-btn`}
                aria-label="Mover para baixo"
              >
                <ChevronIcon flip />
              </button>
              <button
                type="button"
                onClick={() => dispatch({ type: "REMOVE_PLAYER", id: p.id })}
                className={`${styles.trashBtn} gm-btn`}
                aria-label="Remover jogador"
              >
                <TrashIcon />
              </button>
            </div>
            <div className={styles.conditions}>
              {p.conditions.map((cond) => (
                <Chip
                  key={cond.id}
                  color={cond.color}
                  onRemove={() => dispatch({ type: "REMOVE_CONDITION", playerId: p.id, conditionId: cond.id })}
                >
                  {cond.label}
                </Chip>
              ))}
              <ConditionPopover playerId={p.id} />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
