import React from "react";
import { WidgetType } from "../../state/types";

type IconProps = { size?: number };

export function GripIcon({ size = 16 }: IconProps) {
  return (
    <svg viewBox="0 0 24 12" width={size} height={size * 0.56}>
      <circle cx="3" cy="3" r="1.4" fill="currentColor" />
      <circle cx="12" cy="3" r="1.4" fill="currentColor" />
      <circle cx="21" cy="3" r="1.4" fill="currentColor" />
      <circle cx="3" cy="9" r="1.4" fill="currentColor" />
      <circle cx="12" cy="9" r="1.4" fill="currentColor" />
      <circle cx="21" cy="9" r="1.4" fill="currentColor" />
    </svg>
  );
}

export function ClearIcon({ size = 14 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <g transform="rotate(45 12 12)">
        <rect x="5" y="7" width="14" height="10" rx="2.5" fill="currentColor" />
        <rect x="5" y="7" width="14" height="4.2" rx="2.5" fill="currentColor" opacity="0.55" />
        <rect x="5" y="7" width="14" height="10" rx="2.5" fill="none" stroke="currentColor" strokeOpacity="0.3" />
      </g>
      <path d="M3.5 20h9" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.4" />
    </svg>
  );
}

export function PlusIcon({ size = 17 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function TrashIcon({ size = 12 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function XIcon({ size = 12 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M6 6l12 12M18 6L6 18" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
    </svg>
  );
}

export function CheckIcon({ size = 12 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M4 12l5 5 11-11" stroke="currentColor" strokeWidth="2.4" fill="none" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function EditIcon({ size = 12 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M4 20l3-1 11-11-2-2L5 17l-1 3z" fill="currentColor" />
    </svg>
  );
}

export function ChevronIcon({ size = 11, flip = false }: IconProps & { flip?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} style={flip ? { transform: "rotate(180deg)" } : undefined}>
      <polygon points="12,4 20,18 4,18" fill="currentColor" />
    </svg>
  );
}

export function MusicIcon({ size = 17 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <circle cx="7" cy="17" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <circle cx="17" cy="14" r="3" fill="none" stroke="currentColor" strokeWidth="1.7" />
      <path d="M10 17V5l10-2v9" fill="none" stroke="currentColor" strokeWidth="1.7" />
    </svg>
  );
}

export function FilesIcon({ size = 17 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <rect x="3" y="9" width="18" height="10" rx="1" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <path d="M3 9c0-3 4-5 9-5s9 2 9 5" fill="none" stroke="currentColor" strokeWidth="1.6" />
      <rect x="10" y="9" width="4" height="3" fill="currentColor" />
    </svg>
  );
}

export function DocumentIcon({ size = 15 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <rect x="4" y="3" width="16" height="18" rx="2" fill="none" stroke="currentColor" strokeWidth="1.4" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function MapPinIcon({ size = 12 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M6 3v18" stroke="currentColor" strokeWidth="1.8" />
      <path d="M6 4l12 3-12 5z" fill="currentColor" />
    </svg>
  );
}

export function UploadIcon({ size = 44 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M9 3L3 5v16l6-2 6 2 6-2V3l-6 2-6-2z" fill="none" stroke="currentColor" strokeWidth="1.3" />
      <path d="M9 3v16M15 5v16" stroke="currentColor" strokeWidth="1.1" />
    </svg>
  );
}

export function HamburgerIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

export function ResetZoomIcon({ size = 13 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path
        d="M4 12a8 8 0 1 1 2.6 5.9M4 12V6M4 12h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ResizeHandleIcon({ size = 12 }: IconProps) {
  return (
    <svg viewBox="0 0 16 16" width={size} height={size}>
      <path d="M2 14L14 2M7 14L14 7M12 14L14 12" stroke="currentColor" strokeWidth="1.3" />
    </svg>
  );
}

export function WarningIcon({ size = 18 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M9 9l6 6M15 9l-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function PlayersSealIcon({ size = 13 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M6 2h12v14l-6 4-6-4V2z" fill="#1f192f" />
    </svg>
  );
}

function DiceSealIcon({ size = 13 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <polygon points="12,2 21,7 21,17 12,22 3,17 3,7" fill="#1f192f" />
    </svg>
  );
}

function CharactersSealIcon({ size = 13 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M12 2l8 4v6c0 5-4 8-8 10-4-2-8-5-8-10V6l8-4z" fill="#1f192f" />
    </svg>
  );
}

function NotesSealIcon({ size = 13 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M20 4c-6 0-14 4-14 14 0 1 1 2 2 2 10 0 14-8 14-14 0-1-1-2-2-2z" fill="#1f192f" />
    </svg>
  );
}

function NameGenSealIcon({ size = 13 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M12 2l2 7 7 2-7 2-2 7-2-7-7-2 7-2z" fill="#1f192f" />
    </svg>
  );
}

function ItemGenSealIcon({ size = 13 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <polygon points="12,2 20,9 12,22 4,9" fill="#1f192f" />
    </svg>
  );
}

function MapSealIcon({ size = 13 }: IconProps) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size}>
      <path d="M6 3v18" stroke="#1f192f" strokeWidth="1.8" />
      <path d="M6 4l12 3-12 5z" fill="#1f192f" />
    </svg>
  );
}

export const WIDGET_SEAL_ICON: Record<WidgetType, React.ComponentType<IconProps>> = {
  players: PlayersSealIcon,
  dice: DiceSealIcon,
  characters: CharactersSealIcon,
  notes: NotesSealIcon,
  nameGen: NameGenSealIcon,
  itemGen: ItemGenSealIcon,
  map: MapSealIcon,
};
