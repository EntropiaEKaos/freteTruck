const D = { fill: "none", stroke: "currentColor", strokeWidth: 1.5, strokeLinecap: "round" as const, strokeLinejoin: "round" as const };

export function IcTruck({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M1 3h15v13H1z" /><path d="M16 8h4l3 4v5h-7V8z" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></svg>;
}
export function IcSearch({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></svg>;
}
export function IcPlus({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M12 5v14M5 12h14" /></svg>;
}
export function IcMap({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="m1 6 8-4 6 4 8-4v16l-8 4-6-4-8 4z" /><path d="M9 2v16M15 6v16" /></svg>;
}
export function IcChart({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M18 20V10M12 20V4M6 20v-6" /></svg>;
}
export function IcCalc({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M8 6h8M8 10h8M8 14h4M8 18h4" /></svg>;
}
export function IcBell({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>;
}
export function IcMsg({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" /></svg>;
}
export function IcGrid({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}
export function IcUser({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>;
}
export function IcHeart({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1 1.1L12 21.3l7.8-7.8 1-1.1a5.5 5.5 0 0 0 0-7.8z" /></svg>;
}
export function IcStar({ className = "w-4 h-4", filled = true }: { className?: string; filled?: boolean }) {
  return filled
    ? <svg className={className} viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>
    : <svg className={className} viewBox="0 0 24 24" {...D}><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" /></svg>;
}
export function IcDoc({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" /></svg>;
}
export function IcWallet({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>;
}
export function IcGift({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><rect x="3" y="8" width="18" height="4" rx="1" /><path d="M12 8v13M19 12v7a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2v-7" /></svg>;
}
export function IcShield({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}
export function IcBuilding({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><rect x="4" y="2" width="16" height="20" rx="2" /><path d="M9 22v-4h6v4M8 6h.01M16 6h.01M12 6h.01M12 10h.01M8 10h.01M16 10h.01" /></svg>;
}
export function IcBrain({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M9.5 2A5.5 5.5 0 0 0 5 9.23a3.5 3.5 0 0 0 .87 6.88A4 4 0 0 0 12 20" /><path d="M14.5 2A5.5 5.5 0 0 1 19 9.23a3.5 3.5 0 0 1-.87 6.88A4 4 0 0 1 12 20" /><path d="M12 2v18" /></svg>;
}
export function IcTrophy({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6M18 9h1.5a2.5 2.5 0 0 0 0-5H18" /><path d="M4 22h16M10 14.7V22M14 14.7V22" /><path d="M6 4h12v5c0 3.3-2.7 6-6 6s-6-2.7-6-6V4z" /></svg>;
}
export function IcUsers({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></svg>;
}
export function IcTarget({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /></svg>;
}
export function IcArrow({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M5 12h14M12 5l7 7-7 7" /></svg>;
}
export function IcCheck({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M20 6 9 17l-5-5" /></svg>;
}
export function IcX({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M18 6 6 18M6 6l12 12" /></svg>;
}
export function IcMenu({ className = "w-6 h-6" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M3 12h18M3 6h18M3 18h18" /></svg>;
}
export function IcSun({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><circle cx="12" cy="12" r="5" /><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" /></svg>;
}
export function IcMoon({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" /></svg>;
}
export function IcLogout({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
}
export function IcEye({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
}
export function IcWeight({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M12 3a4 4 0 0 0-4 4M12 3a4 4 0 0 1 4 4M5 7h14l-1.5 14h-11z" /></svg>;
}
export function IcPin({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" /><circle cx="12" cy="10" r="3" /></svg>;
}
export function IcShare({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" /><path d="m8.59 13.51 6.83 3.98M15.41 6.51l-6.82 3.98" /></svg>;
}
export function IcClock({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>;
}
export function IcRefresh({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M23 4v6h-6M1 20v-6h6" /><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" /></svg>;
}
export function IcHome({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><path d="M9 22V12h6v10" /></svg>;
}
export function IcRadar({ className = "w-4 h-4" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" {...D}><circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="6" /><circle cx="12" cy="12" r="2" /><path d="M12 2v4M12 18v4" /></svg>;
}
export function IcWhatsapp({ className = "w-5 h-5" }: { className?: string }) {
  return <svg className={className} viewBox="0 0 24 24" fill="currentColor"><path d="M17.47 14.38c-.29-.15-1.7-.84-1.96-.93-.27-.1-.46-.15-.65.14-.2.29-.75.93-.92 1.13-.17.19-.34.22-.63.07-.29-.14-1.23-.45-2.35-1.44-.87-.77-1.45-1.72-1.62-2.01-.17-.29-.02-.45.13-.6.13-.13.29-.34.44-.51.14-.17.2-.29.29-.48.1-.2.05-.36-.02-.51-.07-.15-.65-1.56-.89-2.14-.24-.56-.48-.49-.65-.5h-.56c-.2 0-.51.07-.78.36-.27.29-1.02 1-1.02 2.44 0 1.44 1.05 2.83 1.2 3.02.14.2 2.06 3.14 4.98 4.41.7.3 1.24.48 1.66.61.7.22 1.33.19 1.83.12.56-.08 1.7-.7 1.94-1.37.24-.68.24-1.26.17-1.38-.07-.12-.27-.19-.56-.34zm-5.42 7.4A9.87 9.87 0 0 1 7 20.14l-.36-.21-3.73.98.99-3.63-.24-.37a9.87 9.87 0 0 1-1.51-5.26C2.15 6.24 6.39 2 11.81 2c2.62 0 5.08 1.02 6.93 2.87A9.72 9.72 0 0 1 21.61 11.81c0 5.42-4.24 9.83-9.56 9.97zm8.14-18.55A11.82 11.82 0 0 0 12.05 0C5.49 0 .16 5.33.16 11.88c0 2.1.55 4.14 1.58 5.95L0 24l6.33-1.66a11.82 11.82 0 0 0 5.72 1.46c6.56 0 11.89-5.33 11.89-11.88 0-3.18-1.24-6.16-3.48-8.4z" /></svg>;
}
