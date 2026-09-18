import React, { useState } from "react";
import { useCampaign } from "../../../state/CampaignContext";
import { SealBadge } from "../../common/SealBadge";
import { PlusIcon, TrashIcon } from "../../common/icons";
import styles from "./CharactersWidget.module.scss";

export function CharactersWidget() {
  const { activeCampaign, dispatch } = useCampaign();
  const [name, setName] = useState("");
  const [health, setHealth] = useState("");

  const addCharacter = () => {
    if (!name.trim()) return;
    dispatch({ type: "ADD_CHARACTER", name, health: parseInt(health, 10) || 0 });
    setName("");
    setHealth("");
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") addCharacter();
  };

  return (
    <div>
      <div className={styles.addRow}>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Nome"
          className={styles.input}
        />
        <input
          type="number"
          value={health}
          onChange={(e) => setHealth(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Vida inicial"
          className={styles.input}
        />
        <button type="button" onClick={addCharacter} className={`${styles.submit} gm-btn`} aria-label="Adicionar">
          <PlusIcon />
        </button>
      </div>

      <ul className={styles.list}>
        {activeCampaign.characters.map((ch) => (
          <li key={ch.id} className={styles.card}>
            <div className={styles.info}>
              <SealBadge type="characters" color="#8b3a3a" size={26} />
              <div>
                <div className={styles.name}>{ch.name}</div>
                <div className={styles.health}>Vida: {ch.health}</div>
              </div>
            </div>
            <div className={styles.actions}>
              <div className={styles.actionCol}>
                <div className={styles.actionRow}>
                  <button type="button" onClick={() => dispatch({ type: "ADJUST_HEALTH", id: ch.id, amount: 1 })} className={`${styles.smallBtn} gm-btn`}>
                    ＋1
                  </button>
                  <button type="button" onClick={() => dispatch({ type: "ADJUST_HEALTH", id: ch.id, amount: 10 })} className={`${styles.smallBtn} gm-btn`}>
                    ＋10
                  </button>
                </div>
                <div className={styles.actionRow}>
                  <button type="button" onClick={() => dispatch({ type: "ADJUST_HEALTH", id: ch.id, amount: -1 })} className={`${styles.smallBtn} gm-btn`}>
                    －1
                  </button>
                  <button type="button" onClick={() => dispatch({ type: "ADJUST_HEALTH", id: ch.id, amount: -10 })} className={`${styles.smallBtn} gm-btn`}>
                    －10
                  </button>
                </div>
              </div>
              <button
                type="button"
                onClick={() => dispatch({ type: "REMOVE_CHARACTER", id: ch.id })}
                className={`${styles.trashBtn} gm-btn`}
                aria-label="Remover personagem"
              >
                <TrashIcon />
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
