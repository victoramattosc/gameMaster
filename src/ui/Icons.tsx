import React from "react";

type P = { size?: number; className?: string; color?: string };

function S({ size = 20, className, children, color }: P & { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      className={className}
      fill="none"
      stroke={color || "currentColor"}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </svg>
  );
}

export const IconBack = (p: P) => <S {...p}><path d="M15 5l-7 7 7 7" strokeWidth={2.4} /></S>;
export const IconArrow = (p: P) => <S {...p}><path d="M5 12h14M13 6l6 6-6 6" strokeWidth={2.4} /></S>;
export const IconChevronDown = (p: P) => <S {...p}><path d="M6 9l6 6 6-6" strokeWidth={2.4} /></S>;
export const IconBell = (p: P) => <S {...p}><path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4zM10 20h4" /></S>;
export const IconMail = (p: P) => <S {...p}><path d="M4 7h16v10H4zM4 7l8 6 8-6" /></S>;
export const IconBook = (p: P) => <S {...p}><path d="M4 5h6c1 0 2 1 2 2v13c0-1-1-2-2-2H4zM20 5h-6c-1 0-2 1-2 2v13c0-1 1-2 2-2h6z" /></S>;
export const IconUserPlus = (p: P) => <S {...p}><circle cx="9" cy="8" r="4" /><path d="M2 20c1-4 4-6 7-6s6 2 7 6M19 8v6M16 11h6" /></S>;
export const IconUsers = (p: P) => <S {...p}><circle cx="9" cy="8" r="4" /><path d="M2 20c1-4 4-6 7-6s6 2 7 6M16 4a4 4 0 0 1 0 8M18 14c2 1 3 3 4 6" /></S>;
export const IconUser = (p: P) => <S {...p}><circle cx="12" cy="8" r="4" /><path d="M4 21c1-5 4-7 8-7s7 2 8 7" /></S>;
export const IconMusic = (p: P) => <S {...p}><circle cx="7" cy="17" r="3" /><circle cx="17" cy="14" r="3" /><path d="M10 17V5l10-2v11" /></S>;
export const IconChest = (p: P) => <S {...p}><rect x="3" y="9" width="18" height="11" rx="1.5" /><path d="M3 9c0-3 4-5 9-5s9 2 9 5M10 9v3h4V9" /></S>;
export const IconShield = (p: P) => <S {...p}><path d="M12 3l8 3v6c0 5-4 8-8 9-4-1-8-4-8-9V6z" /></S>;
export const IconList = (p: P) => <S {...p}><path d="M5 6h14M5 12h10M5 18h6" /></S>;
export const IconDie = (p: P) => <S {...p}><path d="M12 2l9 5v10l-9 5-9-5V7z" /></S>;
export const IconD20 = (p: P) => <S {...p} ><path d="M12 2l9 5v10l-9 5-9-5V7z M12 2v20M3 7l18 10M21 7L3 17" strokeWidth={1.6} /></S>;
export const IconNote = (p: P) => <S {...p}><path d="M6 3h9l3 3v15H6z M9 10h6M9 14h6" /></S>;
export const IconMap = (p: P) => <S {...p}><path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z M9 4v14M15 6v14" strokeWidth={1.8} /></S>;
export const IconImport = (p: P) => <S {...p}><path d="M12 3v12M7 10l5 5 5-5M4 17v3h16v-3" /></S>;
export const IconExport = (p: P) => <S {...p}><path d="M12 15V3M7 8l5-5 5 5M4 17v3h16v-3" /></S>;
export const IconPlus = (p: P) => <S {...p}><path d="M12 5v14M5 12h14" strokeWidth={2.6} /></S>;
export const IconClose = (p: P) => <S {...p}><path d="M6 6l12 12M18 6L6 18" strokeWidth={2.2} /></S>;
export const IconCalendar = (p: P) => <S {...p}><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18M8 3v4M16 3v4" /></S>;
export const IconLock = (p: P) => <S {...p}><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></S>;
export const IconSearch = (p: P) => <S {...p}><circle cx="11" cy="11" r="7" /><path d="M16 16l5 5" /></S>;
export const IconLogout = (p: P) => <S {...p}><path d="M10 5H5v14h5M14 8l4 4-4 4M18 12H9" /></S>;
export const IconFile = (p: P) => <S {...p}><path d="M6 3h9l3 3v15H6z" /></S>;
export const IconEye = (p: P) => <S {...p}><path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" fill="currentColor" /></S>;
export const IconCheck = (p: P) => <S {...p}><path d="M5 12l5 5 9-10" strokeWidth={3} /></S>;
export const IconPlay = (p: P) => <S {...p}><path d="M8 5v14l11-7z" fill="currentColor" stroke="none" /></S>;
export const IconPause = (p: P) => <S {...p}><path d="M7 5h4v14H7zM13 5h4v14h-4z" fill="currentColor" stroke="none" /></S>;
export const IconTrash = (p: P) => <S {...p}><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13" /></S>;
export const IconCrown = ({ size = 22, color = "#e0a040" }: P) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path d="M3 18l3-10 6 5 6-5 3 10z" fill={color} />
  </svg>
);
export const IconScroll = ({ size = 22 }: P) => (
  <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true">
    <path d="M6 3h10l3 3v15H6z" fill="#c9b48a" />
    <path d="M9 10h7M9 14h7M9 18h4" stroke="#2b1f16" strokeWidth={1.8} />
  </svg>
);

export function Logo({ size = 40 }: { size?: number }) {
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
      <circle cx="32" cy="32" r="29" fill="#241b16" stroke="#e0a040" strokeWidth="2" />
      <path d="M14 12l36 40M50 12L14 52" stroke="#c9b48a" strokeWidth="4" strokeLinecap="round" />
      <path d="M32 14l14 5v12c0 10-6 16-14 20-8-4-14-10-14-20V19z" fill="#b23a2c" stroke="#f1e6cc" strokeWidth="2" />
      <path d="M32 22v20M25 30h14" stroke="#f1e6cc" strokeWidth="2.4" strokeLinecap="round" />
    </svg>
  );
}

export function Silhouette({ width = 54, height = 66 }: { width?: number; height?: number }) {
  return (
    <svg viewBox="0 0 100 120" width={width} height={height} aria-hidden="true">
      <circle cx="50" cy="42" r="22" fill="rgba(255,247,232,.85)" />
      <path d="M8 120c4-30 22-46 42-46s38 16 42 46z" fill="rgba(255,247,232,.85)" />
    </svg>
  );
}

export function QrIcon({ size = 20 }: { size?: number }) {
  return (
    <svg viewBox="0 0 24 24" width={size} height={size} aria-hidden="true" fill="none" stroke="currentColor" strokeWidth="2" strokeLinejoin="round">
      <path d="M4 4h6v6H4zM14 4h6v6h-6zM4 14h6v6H4z" />
      <path d="M14 14h2v2h-2zM18 14h2M14 18v2M18 18h2v2h-2z" strokeLinecap="round" />
    </svg>
  );
}
