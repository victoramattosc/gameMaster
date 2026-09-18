import React, { useState } from "react";
import { useCampaign } from "../../../state/CampaignContext";
import { AddRow } from "../../common/AddRow";
import styles from "./NotesWidget.module.scss";

export function NotesWidget() {
  const { activeCampaign, dispatch } = useCampaign();
  const [text, setText] = useState("");

  const addNote = () => {
    dispatch({ type: "ADD_NOTE", text });
    setText("");
  };

  return (
    <div>
      <AddRow value={text} onChange={setText} onSubmit={addNote} placeholder="Faça suas anotações aqui" />

      <div className={styles.notepad}>
        <ul className={styles.list}>
          {activeCampaign.notes.map((n) => (
            <li key={n.id} className={styles.line}>
              <span className={styles.text}>{n.text}</span>
              <button
                type="button"
                onClick={() => dispatch({ type: "REMOVE_NOTE", id: n.id })}
                className={styles.remove}
                aria-label="Remover anotação"
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
