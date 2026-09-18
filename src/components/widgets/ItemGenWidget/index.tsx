import React from "react";
import { ITEM_CATS } from "../../../data/generators";
import { useCampaign } from "../../../state/CampaignContext";
import { ItemCategoryKey } from "../../../state/types";
import styles from "./ItemGenWidget.module.scss";

export function ItemGenWidget() {
  const { activeCampaign, dispatch } = useCampaign();
  const { itemGen } = activeCampaign;

  return (
    <div>
      <div className={styles.controls}>
        <select
          value={itemGen.cat}
          onChange={(e) => dispatch({ type: "SET_ITEM_CAT", cat: e.target.value as ItemCategoryKey })}
          className={styles.select}
        >
          {Object.entries(ITEM_CATS).map(([key, def]) => (
            <option key={key} value={key}>
              {def.label}
            </option>
          ))}
        </select>
        <button type="button" onClick={() => dispatch({ type: "GENERATE_ITEM" })} className={`${styles.genBtn} gm-btn`}>
          Gerar item
        </button>
      </div>

      {itemGen.current && <div className={styles.result}>{itemGen.current}</div>}

      <ul className={styles.history}>
        {itemGen.history.slice(1).map((text, i) => (
          <li key={i} className={styles.historyItem}>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
