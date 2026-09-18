import React from "react";
import { DICE_FACES, DICE_VISUALS } from "../../../data/generators";
import { useCampaign } from "../../../state/CampaignContext";
import { DiceMode } from "../../../state/types";
import { rollDice } from "../../../utils/dice";
import styles from "./DiceWidget.module.scss";

const ROLL_ANIMATION_MS = 650;

export function DiceWidget() {
  const { activeCampaign, dispatch } = useCampaign();
  const { diceState } = activeCampaign;
  const visual = DICE_VISUALS[diceState.rollFaces] || DICE_VISUALS[20];

  const roll = (faces: number) => {
    dispatch({ type: "ROLL_DICE_START", faces });
    setTimeout(() => {
      const { text } = rollDice(diceState.qtde, faces, diceState.tipo, diceState.adicional);
      dispatch({ type: "ROLL_DICE_FINISH", resultText: text });
    }, ROLL_ANIMATION_MS);
  };

  return (
    <div className={styles.wrap}>
      <select
        value={diceState.tipo}
        onChange={(e) => dispatch({ type: "SET_DICE_TIPO", tipo: e.target.value as DiceMode })}
        className={styles.select}
      >
        <option value="somar">Somar</option>
        <option value="maior">Maior</option>
        <option value="menor">Menor</option>
      </select>

      <div className={styles.buttons}>
        {DICE_FACES.map((faces) => {
          const v = DICE_VISUALS[faces];
          return (
            <button key={faces} type="button" onClick={() => roll(faces)} className={`${styles.diceBtn} gm-btn`}>
              <span
                className={styles.diceIcon}
                style={{
                  background: v.bg,
                  borderRadius: v.clip === "none" ? "5px" : "2px",
                  clipPath: v.clip === "none" ? "none" : v.clip,
                  boxShadow: `inset 0 2px 3px rgba(255,255,255,0.4), inset 0 -2px 4px rgba(0,0,0,0.35), 0 0 0 1px ${v.rim}`,
                }}
              />
              D{faces}
            </button>
          );
        })}
      </div>

      <div
        className={[styles.diceVisual, diceState.rolling ? styles.rolling : ""].join(" ")}
        style={{
          borderRadius: visual.clip === "none" ? "18px" : "6px",
          clipPath: visual.clip === "none" ? "none" : visual.clip,
          background: visual.bg,
          boxShadow: `0 8px 18px rgba(0,0,0,0.45), inset 0 3px 6px rgba(255,255,255,0.35), inset 0 -5px 9px rgba(0,0,0,0.4), 0 0 0 2px ${visual.rim}`,
        }}
      >
        {diceState.rolling ? `d${diceState.rollFaces}` : diceState.rollFaces}
      </div>

      <div className={styles.controls}>
        <div className={styles.controlGroup}>
          <button type="button" onClick={() => dispatch({ type: "ADJUST_DICE_ADICIONAL", delta: 1 })} className={`${styles.smallBtn} gm-btn`}>
            ＋
          </button>
          <span className={styles.controlValue}>+{diceState.adicional}</span>
          <button type="button" onClick={() => dispatch({ type: "ADJUST_DICE_ADICIONAL", delta: -1 })} className={`${styles.smallBtn} gm-btn`}>
            －
          </button>
        </div>
        <div className={styles.controlGroup}>
          <button type="button" onClick={() => dispatch({ type: "ADJUST_DICE_QTDE", delta: 1 })} className={`${styles.smallBtn} gm-btn`}>
            ＋
          </button>
          <span className={styles.controlValue}>{diceState.qtde}d</span>
          <button type="button" onClick={() => dispatch({ type: "ADJUST_DICE_QTDE", delta: -1 })} className={`${styles.smallBtn} gm-btn`}>
            －
          </button>
        </div>
      </div>

      <div className={styles.result}>{diceState.resultText}</div>
    </div>
  );
}
