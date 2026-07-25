"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/constants";
import { IcTruck, IcWallet, IcShield, IcCheck, IcRefresh } from "@/components/Icons";

type Wallet = { balance: number; lifetimeEarned: number; lifetimeSpent: number };
type Product = { id: number; code: string; name: string; description: string | null; trucks: number; priceCents: number; active: boolean };
type Order = { order: { id: number; status: string; trucks: number; amountCents: number; createdAt: string }; product: Product };

export default function TrucksPage() {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);
  const [beta, setBeta] = useState("");

  async function load() {
    const [w, p, o] = await Promise.all([
      fetch("/api/trucks/wallet").then((r) => r.json()),
      fetch("/api/trucks/products").then((r) => r.json()),
      fetch("/api/trucks/orders").then((r) => r.json()),
    ]);
    setWallet(w.wallet || null);
    setProducts(p.products || []);
    setOrders(o.orders || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function buy(productId: number) {
    setBusy(productId);
    setBeta("");
    const res = await fetch("/api/trucks/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ productId }),
    });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Erro ao criar pedido."); setBusy(null); return; }
    setBeta(`Pedido #${data.order.id} criado. No beta, use o botão de confirmação para simular o pagamento.`);
    await load();
    setBusy(null);
  }

  async function pay(orderId: number) {
    setBusy(orderId);
    setBeta("");
    // Tenta checkout Mercado Pago primeiro
    const res = await fetch(`/api/trucks/orders/${orderId}/checkout`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({}) });
    const data = await res.json();
    if (!res.ok) { alert(data.error || "Erro no pagamento."); setBusy(null); return; }

    if (data.provider === "mercadopago" && data.checkoutUrl) {
      // Redireciona para o Mercado Pago (Checkout Pro com PIX, cartão, etc.)
      window.location.href = data.checkoutUrl;
      return;
    }

    // Fallback beta/manual
    const payRes = await fetch(`/api/trucks/orders/${orderId}/pay`, { method: "POST" });
    const payData = await payRes.json();
    if (!payRes.ok) alert(payData.error || "Erro no pagamento.");
    else setBeta(payData.message || "Trucks creditados.");
    await load();
    setBusy(null);
  }

  if (loading) return <div className="max-w-5xl mx-auto px-4 py-24 text-center text-slate-500">Carregando carteira de Trucks…</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex items-center gap-3">
        <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center"><IcTruck className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Minha carteira de Trucks</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">A moeda de utilidade do ecossistema FreteTruck.</p>
        </div>
      </div>

      {beta && <div className="mt-5 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl px-4 py-3 text-sm text-amber-800 dark:text-amber-300">{beta}</div>}

      {/* Balance */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="md:col-span-1 bg-gradient-to-br from-orange-500 to-amber-600 rounded-2xl p-6 text-white">
          <p className="text-xs uppercase tracking-widest opacity-80">Saldo disponível</p>
          <p className="text-5xl font-black mt-2">{wallet?.balance || 0}</p>
          <p className="text-sm font-semibold opacity-90 mt-1">Trucks</p>
          <div className="mt-5 pt-4 border-t border-white/20 flex justify-between text-xs"><span>Ganhos: {wallet?.lifetimeEarned || 0}</span><span>Usos: {wallet?.lifetimeSpent || 0}</span></div>
        </div>
        <div className="md:col-span-2 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <p className="font-bold text-slate-900 dark:text-white">O que são Trucks?</p>
          <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">Trucks são créditos de utilidade, não são dinheiro nem saldo bancário. Use-os para aumentar sua visibilidade e acessar serviços premium. Motoristas têm acesso gratuito às funções essenciais.</p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50"><b className="text-orange-600">15 Trucks</b><p className="text-slate-500 mt-1">Destacar um frete por 24h</p></div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50"><b className="text-orange-600">25 Trucks</b><p className="text-slate-500 mt-1">Bônus por indicação confirmada</p></div>
            <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-700/50"><b className="text-orange-600">0% comissão</b><p className="text-slate-500 mt-1">Sobre o valor do frete</p></div>
          </div>
        </div>
      </div>

      {/* Products */}
      <h2 className="mt-10 text-xl font-bold text-slate-900 dark:text-white">Comprar Trucks</h2>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">No beta, o pagamento é manual/simulado. Em produção, conectaremos PIX, cartão ou gateway fiscal.</p>
      <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
        {products.map((p, index) => (
          <div key={p.id} className={`relative bg-white dark:bg-slate-800 rounded-2xl border p-6 ${index === 1 ? "border-orange-400 ring-2 ring-orange-500/20" : "border-slate-200 dark:border-slate-700"}`}>
            {index === 1 && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-orange-500 text-white text-[10px] font-bold uppercase px-3 py-1 rounded-full">Mais popular</span>}
            <p className="font-bold text-slate-900 dark:text-white">{p.name}</p>
            <p className="text-4xl font-black text-orange-500 mt-3">{p.trucks}</p><p className="text-xs text-slate-500">Trucks</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white mt-4">{formatBRL(p.priceCents / 100)}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 min-h-8">{p.description}</p>
            <button onClick={() => buy(p.id)} disabled={busy === p.id} className="mt-5 w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold py-2.5 rounded-xl text-sm">{busy === p.id ? "Criando pedido…" : "Comprar agora"}</button>
          </div>
        ))}
      </div>

      {/* Orders */}
      <h2 className="mt-10 text-xl font-bold text-slate-900 dark:text-white">Meus pedidos</h2>
      <div className="mt-4 space-y-2">
        {orders.length === 0 ? <p className="text-sm text-slate-400">Nenhum pedido ainda.</p> : orders.map((o) => (
          <div key={o.order.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between gap-3 flex-wrap">
            <div><p className="text-sm font-bold text-slate-900 dark:text-white">Pedido #{o.order.id} · {o.product.name}</p><p className="text-xs text-slate-500">{o.order.trucks} Trucks · {formatBRL(o.order.amountCents / 100)} · {new Date(o.order.createdAt).toLocaleString("pt-BR")}</p></div>
            {o.order.status === "pending" ? <button onClick={() => pay(o.order.id)} disabled={busy === o.order.id} className="text-xs font-bold px-4 py-2 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white disabled:opacity-50">{busy === o.order.id ? "Confirmando…" : "Confirmar pagamento beta"}</button> : <span className="text-xs font-bold text-emerald-600">Pagamento confirmado</span>}
          </div>
        ))}
      </div>

      <p className="mt-6 text-xs text-slate-400"><Link href="/ajuda" className="text-orange-600 hover:underline">Como funcionam os Trucks?</Link> · No ambiente real, pagamentos devem ser processados por provedor autorizado.</p>
    </div>
  );
}
