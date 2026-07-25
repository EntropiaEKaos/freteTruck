import Link from "next/link";
import { IcTruck, IcSearch, IcHome } from "@/components/Icons";

export default function NotFound() {
  return (
    <div className="max-w-lg mx-auto px-4 py-24 text-center">
      <div className="relative">
        <p className="text-[120px] font-extrabold text-slate-100 dark:text-slate-800 leading-none select-none">404</p>
        <div className="absolute inset-0 flex items-center justify-center">
          <IcTruck className="w-20 h-20 text-orange-500/30" />
        </div>
      </div>
      <h1 className="mt-2 text-2xl font-bold text-slate-900 dark:text-white">Página não encontrada</h1>
      <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
        A página que você está procurando não existe, foi removida ou está temporariamente indisponível.
      </p>
      <div className="mt-8 flex gap-3 justify-center">
        <Link href="/" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-semibold px-6 py-2.5 rounded-xl transition-colors text-sm">
          <IcHome className="w-4 h-4" /> Página inicial
        </Link>
        <Link href="/fretes" className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold px-6 py-2.5 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm">
          <IcSearch className="w-4 h-4" /> Buscar fretes
        </Link>
      </div>
    </div>
  );
}
