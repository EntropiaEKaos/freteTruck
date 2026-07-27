"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IcX } from "./Icons";

type Announcement = {
  id: number;
  title: string;
  message: string;
  variant: "info" | "success" | "warning" | "danger";
  linkLabel: string | null;
  linkUrl: string | null;
};

const variants: Record<string, string> = {
  info: "bg-blue-600 text-white",
  success: "bg-emerald-600 text-white",
  warning: "bg-amber-500 text-amber-950",
  danger: "bg-red-600 text-white",
};

export default function AnnouncementBar() {
  const [items, setItems] = useState<Announcement[]>([]);
  const [dismissed, setDismissed] = useState<number[]>([]);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("ft_dismissed_announcements");
      if (raw) setDismissed(JSON.parse(raw));
    } catch {}
    fetch("/api/announcements")
      .then((r) => r.json())
      .then((d) => setItems(d.announcements || []))
      .catch(() => {});
  }, []);

  const visible = items.find((i) => !dismissed.includes(i.id));
  if (!visible) return null;

  function close() {
    const next = [...dismissed, visible!.id];
    setDismissed(next);
    try { localStorage.setItem("ft_dismissed_announcements", JSON.stringify(next)); } catch {}
  }

  return (
    <div className={`${variants[visible.variant] || variants.info} text-center text-sm font-medium py-2 px-4 relative`}>
      <span className="font-bold">{visible.title}</span>
      <span className="mx-1">—</span>
      <span>{visible.message}</span>
      {visible.linkUrl && visible.linkLabel && (
        <Link href={visible.linkUrl} className="underline font-bold ml-2 hover:opacity-80">
          {visible.linkLabel}
        </Link>
      )}
      <button onClick={close} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-black/10 transition-colors" aria-label="Fechar">
        <IcX className="w-4 h-4" />
      </button>
    </div>
  );
}
