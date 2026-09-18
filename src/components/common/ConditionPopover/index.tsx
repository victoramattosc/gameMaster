import React, { useState } from "react";
import { CONDITION_PRESETS } from "../../../data/generators";
import { useCampaign } from "../../../state/CampaignContext";
import { PlusIcon } from "../icons";
import styles from "./ConditionPopover.module.scss";

interface ConditionPopoverProps {
  playerId: string;
}

export function ConditionPopover({ playerId }: ConditionPopoverProps) {
  const { dispatch } = useCampaign();
  const [isOpen, setIsOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [color, setColor] = useState("#65b8a6");

  const toggle = () => setIsOpen((v) => !v);

  const addPreset = (presetLabel: string, presetColor: string) =>
    dispatch({ type: "ADD_CONDITION", playerId, label: presetLabel, color: presetColor });

  const addCustom = () => {
    if (!label.trim()) return;
    dispatch({ type: "ADD_CONDITION", playerId, label, color });
    setLabel("");
  };

  return (
    <div className={styles.wrap}>
      <button type="button" onClick={toggle} className={`${styles.trigger} gm-btn`}>
        <PlusIcon size={10} /> Condição
      </button>
      {isOpen && (
        <div className={styles.popover}>
          <div className={styles.header}>
            <span className={styles.title}>Condições</span>
            <button type="button" onClick={toggle} className={styles.close} aria-label="Fechar">
              ×
            </button>
          </div>
          <div className={styles.presets}>
            {CONDITION_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                onClick={() => addPreset(preset.label, preset.color)}
                className={styles.presetChip}
                style={{ borderColor: preset.color, color: preset.color }}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <div className={styles.customRow}>
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Nova condição"
              className={styles.customInput}
            />
            <input
              type="color"
              value={color}
              onChange={(e) => setColor(e.target.value)}
              className={styles.customColor}
            />
            <button type="button" onClick={addCustom} className={styles.addBtn}>
              ＋
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
