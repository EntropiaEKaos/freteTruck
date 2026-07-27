import { Suspense } from "react";
import CadastroContent from "./CadastroContent";

export default function CadastroPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto px-4 py-24 text-center text-slate-500">Carregando...</div>}>
      <CadastroContent />
    </Suspense>
  );
}
