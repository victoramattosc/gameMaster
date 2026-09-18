export const GRID_COLUMNS = 12;

export interface GridSteps {
  colStep: number;
  rowStep: number;
}

/**
 * Derives the pixel size of one grid column/row (track + gap) from the live
 * grid element instead of hardcoding it, so drag/resize math never drifts
 * out of sync with the actual CSS (grid-auto-rows / gap can change without
 * this file needing an update).
 */
export function getGridSteps(gridEl: HTMLElement): GridSteps {
  const rect = gridEl.getBoundingClientRect();
  const computed = window.getComputedStyle(gridEl);
  const gap = parseFloat(computed.columnGap || computed.gap || "0") || 0;
  const rowGap = parseFloat(computed.rowGap || computed.gap || "0") || 0;
  const rowHeight = parseFloat(computed.gridAutoRows) || 32;

  const colStep = (rect.width - (GRID_COLUMNS - 1) * gap) / GRID_COLUMNS + gap;
  const rowStep = rowHeight + rowGap;

  return { colStep, rowStep };
}
