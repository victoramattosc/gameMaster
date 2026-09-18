import { DiceMode } from "../state/types";

export interface DiceRollResult {
  rolls: number[];
  base: number;
  total: number;
  text: string;
}

export function rollDice(
  qtde: number,
  faces: number,
  tipo: DiceMode,
  adicional: number
): DiceRollResult {
  const rolls: number[] = [];
  for (let i = 0; i < qtde; i++) {
    rolls.push(Math.floor(Math.random() * faces) + 1);
  }

  let base: number;
  let joiner: string;
  if (tipo === "somar") {
    base = rolls.reduce((a, b) => a + b, 0);
    joiner = " + ";
  } else if (tipo === "maior") {
    base = Math.max(...rolls);
    joiner = " ; ";
  } else {
    base = Math.min(...rolls);
    joiner = " ; ";
  }

  const total = base + adicional;
  const text = `${rolls.join(joiner)} + ${adicional} = ${total}`;
  return { rolls, base, total, text };
}
