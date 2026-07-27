"use client";

export default function PrintButton({ label = "Imprimir / Salvar PDF" }: { label?: string }) {
  return (
    <button
      onClick={() => window.print()}
      className="bg-slate-900 dark:bg-slate-700 text-white font-bold text-xs px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
    >
      {label}
    </button>
  );
}
