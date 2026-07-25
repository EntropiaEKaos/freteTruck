"use client";

import { useState } from "react";

export default function ShareButton({ freightId, title }: { freightId: number; title: string }) {
  const [copied, setCopied] = useState(false);

  async function share() {
    const url = `${window.location.origin}/fretes/${freightId}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: `FreteTruck: ${title}`, url });
        return;
      } catch { /* user cancelled */ }
    }
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  return (
    <button
      onClick={share}
      className="inline-flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
    >
      {copied ? "✅ Link copiado!" : "📋 Compartilhar"}
    </button>
  );
}
