"use client";

import { useState } from "react";
import { IcShare, IcX } from "./Icons";

export default function FreightQRCode({
  freightId,
  title,
  price,
}: {
  freightId: number;
  title: string;
  price: string;
}) {
  const [open, setOpen] = useState(false);
  const url = typeof window !== "undefined" ? `${window.location.origin}/fretes/${freightId}` : `https://fretetruck.app/fretes/${freightId}`;
  
  // Public Google Charts QR Code API for crisp, reliable QR SVG/PNG generation
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(url)}&margin=10`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-lg border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
        title="Gerar QR Code do Frete"
      >
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="3" y="3" width="7" height="7" rx="1" />
          <rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" />
          <rect x="14" y="14" width="3" height="3" fill="currentColor" />
          <rect x="18" y="14" width="3" height="3" fill="currentColor" />
          <rect x="14" y="18" width="7" height="3" fill="currentColor" />
        </svg>
        QR Code
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-700 shadow-2xl relative text-center">
            <button
              onClick={() => setOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-900 dark:hover:text-white rounded-full hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <IcX className="w-5 h-5" />
            </button>

            <p className="text-xs uppercase font-bold tracking-widest text-orange-500">FreteTruck QR Code</p>
            <h3 className="font-extrabold text-lg text-slate-900 dark:text-white mt-1">{title}</h3>
            <p className="text-sm font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">{price}</p>

            <div className="my-5 p-3 bg-white rounded-2xl shadow-inner inline-block border border-slate-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={qrUrl} alt={`QR Code para Frete #${freightId}`} className="w-52 h-52 mx-auto" />
            </div>

            <p className="text-xs text-slate-500 dark:text-slate-400">
              Aponte a câmera do celular para abrir o frete instantaneamente, sem precisar digitar.
            </p>

            <div className="mt-5 flex gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(url);
                  alert("Link copiado para a área de transferência!");
                }}
                className="flex-1 bg-orange-500 hover:bg-orange-600 text-white font-bold py-2.5 rounded-xl text-xs transition-colors"
              >
                Copiar Link
              </button>
              <button
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-600 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-50"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
