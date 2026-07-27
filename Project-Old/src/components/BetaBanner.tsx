"use client";

import { useState } from "react";
import { IcX } from "./Icons";

export default function BetaBanner() {
  const [visible, setVisible] = useState(true);
  if (!visible) return null;

  return (
    <div className="bg-amber-500 text-amber-950 text-center text-sm font-medium py-2 px-4 relative">
      <span className="font-bold">BETA PÚBLICO</span> — Estamos em fase de testes. Encontrou um bug?{" "}
      <a href="mailto:contato@fretetruck.app" className="underline font-bold hover:text-amber-800">Envie seu feedback</a>
      <button onClick={() => setVisible(false)} className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-amber-600/20 transition-colors" aria-label="Fechar">
        <IcX className="w-4 h-4" />
      </button>
    </div>
  );
}
