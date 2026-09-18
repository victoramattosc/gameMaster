import React, { KeyboardEvent } from "react";
import { PlusIcon } from "../icons";
import styles from "./AddRow.module.scss";

interface AddRowProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
  className?: string;
}

export function AddRow({ value, onChange, onSubmit, placeholder, className }: AddRowProps) {
  const onKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") onSubmit();
  };

  return (
    <div className={[styles.row, className].filter(Boolean).join(" ")}>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        placeholder={placeholder}
        className={styles.input}
      />
      <button type="button" onClick={onSubmit} className={`${styles.submit} gm-btn`} aria-label="Adicionar">
        <PlusIcon />
      </button>
    </div>
  );
}
