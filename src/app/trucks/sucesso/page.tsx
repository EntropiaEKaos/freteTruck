import Link from "next/link";
import { IcCheck } from "@/components/Icons";

export default function SuccessPage() {
  return (
    <div className="max-w-md mx-auto px-4 py-24 text-center">
      <div className="w-20 h-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto">
        <IcCheck className="w-10 h-10 text-emerald-600" />
      </div>
      <h1 className="mt-6 text-2xl font-extrabold text-slate-900 dark:text-white">Pagamento aprovado!</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Seus Trucks foram creditados na sua carteira. Você já pode usar para destacar fretes e acessar recursos premium.</p>
      <div className="mt-8 flex gap-3 justify-center">
        <Link href="/trucks" className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-6 py-3 rounded-xl text-sm">Ver minha carteira</Link>
        <Link href="/publicar" className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold px-6 py-3 rounded-xl text-sm">Publicar frete</Link>
      </div>
    </div>
  );
}
