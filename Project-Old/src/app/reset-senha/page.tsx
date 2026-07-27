import { Suspense } from "react";
import ResetContent from "./ResetContent";

export default function ResetPage() {
  return (
    <Suspense fallback={<div className="max-w-md mx-auto px-4 py-24 text-center text-slate-500">Carregando...</div>}>
      <ResetContent />
    </Suspense>
  );
}
