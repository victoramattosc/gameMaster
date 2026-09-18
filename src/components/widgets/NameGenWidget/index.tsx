import React from "react";
import { RACES } from "../../../data/generators";
import { useCampaign } from "../../../state/CampaignContext";
import { Gender, RaceKey } from "../../../state/types";
import styles from "./NameGenWidget.module.scss";

export function NameGenWidget() {
  const { activeCampaign, dispatch } = useCampaign();
  const { nameGen } = activeCampaign;

  return (
    <div>
      <div className={styles.controls}>
        <select
          value={nameGen.race}
          onChange={(e) => dispatch({ type: "SET_NAME_RACE", race: e.target.value as RaceKey })}
          className={styles.select}
        >
          {Object.entries(RACES).map(([key, def]) => (
            <option key={key} value={key}>
              {def.label}
            </option>
          ))}
        </select>
        <select
          value={nameGen.gender}
          onChange={(e) => dispatch({ type: "SET_NAME_GENDER", gender: e.target.value as Gender })}
          className={styles.select}
        >
          <option value="m">Masculino</option>
          <option value="f">Feminino</option>
        </select>
        <button type="button" onClick={() => dispatch({ type: "GENERATE_NAME" })} className={`${styles.genBtn} gm-btn`}>
          Gerar nome
        </button>
      </div>

      {nameGen.current && <div className={styles.result}>{nameGen.current}</div>}

      <ul className={styles.history}>
        {nameGen.history.slice(1).map((text, i) => (
          <li key={i} className={styles.historyItem}>
            {text}
          </li>
        ))}
      </ul>
    </div>
  );
}
