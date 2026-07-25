import Link from "next/link";

export default function FailurePage() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="w-20 h-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto">
        <span className="text-4xl">❌</span>
      </div>
      <h1 className="mt-6 text-2xl font-extrabold text-slate-900 dark:text-white">Pagamento não aprovado</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Não conseguimos processar seu pagamento. Você pode tentar novamente com outro método.</p>
      <div className="mt-8 flex gap-3 justify-center">
        <Link href="/trucks" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm">Voltar à carteira</Link>
        <Link href="/ajuda" className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold px-6 py-3 rounded-xl text-sm">Ajuda</Link>
      </div>
    </div>
  );
}
