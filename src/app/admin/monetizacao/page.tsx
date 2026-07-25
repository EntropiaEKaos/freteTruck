"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/constants";

type Setting = { id: number; key: string; value: unknown; label: string; description: string | null };
type Product = { id: number; code: string; name: string; description: string | null; trucks: number; priceCents: number; active: boolean };
type Order = { order: { id: number; status: string; trucks: number; amountCents: number; createdAt: string }; userName: string; userEmail: string; productName: string };

export default function MonetizacaoPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"config" | "products" | "orders" | "grant" | "pagamentos">("config");
  const [grantForm, setGrantForm] = useState({ userId: "", trucks: "", description: "" });
  const [grantMsg, setGrantMsg] = useState("");
  const [newProduct, setNewProduct] = useState({ code: "", name: "", description: "", trucks: "", priceCents: "" });

  async function load() {
    const me = await fetch("/api/auth/me").then((r) => r.json());
    if (me.user?.role !== "admin") { setLoading(false); return; }
    const data = await fetch("/api/admin/monetization").then((r) => r.json());
    setSettings(data.settings || []);
    setProducts(data.products || []);
    setOrders(data.orders || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function updateSetting(s: Setting, value: string) {
    const parsed = /^\d+(\.\d+)?$/.test(value) ? Number(value) : value === "true" ? true : value === "false" ? false : value;
    await fetch("/api/admin/monetization", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "setting", key: s.key, value: parsed }) });
    await load();
  }

  async function updateProduct(p: Product, field: string, value: string | boolean) {
    const body: Record<string, unknown> = { kind: "product", id: p.id, [field]: field === "priceCents" || field === "trucks" ? Number(value) : value };
    await fetch("/api/admin/monetization", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    await load();
  }

  async function grant() {
    const res = await fetch("/api/admin/monetization", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "grant", ...grantForm }) });
    const data = await res.json();
    setGrantMsg(res.ok ? `${grantForm.trucks} Trucks concedidos.` : data.error || "Erro");
    if (res.ok) setGrantForm({ userId: "", trucks: "", description: "" });
  }

  async function createProduct() {
    const res = await fetch("/api/admin/monetization", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ kind: "product", ...newProduct }) });
    if (res.ok) { setNewProduct({ code: "", name: "", description: "", trucks: "", priceCents: "" }); await load(); }
    else alert((await res.json()).error || "Erro");
  }

  if (loading) return <div className="max-w-6xl mx-auto px-4 py-24 text-center text-slate-500">Carregando monetização…</div>;

  const input = "rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm";

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-orange-600 font-semibold hover:underline">← Painel admin</Link>
      <h1 className="mt-3 text-2xl font-extrabold text-slate-900 dark:text-white">Monetização & Trucks</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Controle preços, custos, pacotes, bônus, planos e pedidos sem alterar código.</p>

      <div className="mt-6 flex gap-2 flex-wrap">
        {([["config", "Configurações"], ["products", "Pacotes"], ["orders", "Pedidos"], ["pagamentos", "Mercado Pago"], ["grant", "Conceder Trucks"]] as const).map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)} className={`px-4 py-2.5 rounded-lg text-sm font-semibold ${tab === key ? "bg-slate-900 dark:bg-orange-500 text-white" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"}`}>{label}</button>
        ))}
      </div>

      {tab === "config" && (
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
          {settings.map((s) => (
            <div key={s.key} className="p-5 flex items-center justify-between gap-4 flex-wrap">
              <div className="flex-1 min-w-[240px]"><p className="font-bold text-sm text-slate-900 dark:text-white">{s.label}</p><p className="text-xs text-slate-500 mt-1">{s.description}</p><p className="text-[10px] font-mono text-slate-400 mt-1">{s.key}</p></div>
              <SettingInput setting={s} onSave={updateSetting} />
            </div>
          ))}
        </div>
      )}

      {tab === "products" && (
        <div className="mt-6 space-y-5">
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <p className="font-bold text-sm text-slate-900 dark:text-white">Novo pacote</p>
            <div className="mt-3 grid grid-cols-2 md:grid-cols-5 gap-2">
              <input className={input} placeholder="Código" value={newProduct.code} onChange={(e) => setNewProduct((p) => ({ ...p, code: e.target.value }))} />
              <input className={input} placeholder="Nome" value={newProduct.name} onChange={(e) => setNewProduct((p) => ({ ...p, name: e.target.value }))} />
              <input className={input} placeholder="Trucks" type="number" value={newProduct.trucks} onChange={(e) => setNewProduct((p) => ({ ...p, trucks: e.target.value }))} />
              <input className={input} placeholder="Preço centavos" type="number" value={newProduct.priceCents} onChange={(e) => setNewProduct((p) => ({ ...p, priceCents: e.target.value }))} />
              <button onClick={createProduct} className="bg-orange-500 hover:bg-orange-600 text-white font-bold rounded-lg text-sm">Criar pacote</button>
            </div>
          </div>
          <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
            <div className="divide-y divide-slate-100 dark:divide-slate-700">
              {products.map((p) => <div key={p.id} className="p-5 flex items-center gap-3 flex-wrap"><div className="flex-1"><p className="font-bold text-slate-900 dark:text-white">{p.name}</p><p className="text-xs text-slate-500">{p.code} · {p.trucks} Trucks · {formatBRL(p.priceCents / 100)}</p></div><input className={`${input} w-24`} type="number" value={p.trucks} onChange={(e) => updateProduct(p, "trucks", e.target.value)} /><input className={`${input} w-28`} type="number" value={p.priceCents} onChange={(e) => updateProduct(p, "priceCents", e.target.value)} /><button onClick={() => updateProduct(p, "active", !p.active)} className={`text-xs font-bold px-3 py-2 rounded-lg ${p.active ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-500"}`}>{p.active ? "Ativo" : "Inativo"}</button></div>)}
            </div>
          </div>
        </div>
      )}

      {tab === "orders" && (
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-sm"><thead className="text-xs uppercase text-slate-400 border-b border-slate-200 dark:border-slate-700"><tr><th className="text-left px-5 py-3">Pedido</th><th className="text-left px-5 py-3">Usuário</th><th className="text-left px-5 py-3">Produto</th><th className="text-right px-5 py-3">Valor</th><th className="text-right px-5 py-3">Status</th></tr></thead><tbody className="divide-y divide-slate-100 dark:divide-slate-700">{orders.map((o) => <tr key={o.order.id}><td className="px-5 py-3 font-mono">#{o.order.id}</td><td className="px-5 py-3">{o.userName}<br /><span className="text-xs text-slate-400">{o.userEmail}</span></td><td className="px-5 py-3">{o.productName} · {o.order.trucks} Trucks</td><td className="px-5 py-3 text-right">{formatBRL(o.order.amountCents / 100)}</td><td className="px-5 py-3 text-right"><span className={`text-xs font-bold px-2 py-1 rounded-full ${o.order.status === "paid" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"}`}>{o.order.status}</span></td></tr>)}</tbody></table></div></div>
      )}

      {tab === "grant" && (
        <div className="mt-6 max-w-xl bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6"><p className="font-bold text-slate-900 dark:text-white">Conceder Trucks manualmente</p><p className="mt-1 text-xs text-slate-500">Use para suporte, campanhas, compensações e parceiros.</p>{grantMsg && <div className="mt-3 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-lg px-3 py-2 text-sm">{grantMsg}</div>}<div className="mt-4 space-y-3"><input className={`${input} w-full`} type="number" placeholder="ID do usuário" value={grantForm.userId} onChange={(e) => setGrantForm((f) => ({ ...f, userId: e.target.value }))} /><input className={`${input} w-full`} type="number" placeholder="Quantidade de Trucks" value={grantForm.trucks} onChange={(e) => setGrantForm((f) => ({ ...f, trucks: e.target.value }))} /><input className={`${input} w-full`} placeholder="Motivo" value={grantForm.description} onChange={(e) => setGrantForm((f) => ({ ...f, description: e.target.value }))} /><button onClick={grant} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm">Conceder</button></div></div>
      )}

      {tab === "pagamentos" && <PagamentosTab settings={settings} onUpdate={updateSetting} />}
    </div>
  );
}

function PagamentosTab({ settings, onUpdate }: { settings: Setting[]; onUpdate: (s: Setting, v: string) => void }) {
  const mpSettings = [
    { key: "mp_access_token", label: "Access Token", description: "Token de acesso da sua aplicação Mercado Pago (APP_USR-...).", type: "password" },
    { key: "mp_public_key", label: "Public Key", description: "Chave pública para o frontend (TEST-... ou APP_USR-...).", type: "text" },
    { key: "mp_enabled", label: "Mercado Pago Ativo", description: "Ativa checkout real com PIX, cartão e boleto.", type: "boolean" },
    { key: "mp_installments", label: "Máx. Parcelas", description: "Número máximo de parcelas no cartão.", type: "number" },
    { key: "mp_exclude_boleto", label: "Excluir Boleto", description: "Remove boleto das opções de pagamento.", type: "boolean" },
  ];

  const getVal = (key: string) => {
    const found = settings.find((s) => s.key === key);
    if (found) {
      // value is stored as JSON string: "\"token\"" or "true" or "12"
      const raw = found.value;
      if (typeof raw === "string") {
        try { return JSON.parse(raw); } catch { return raw; }
      }
      return String(raw);
    }
    if (key === "mp_installments") return "12";
    if (key === "mp_enabled") return "false";
    if (key === "mp_exclude_boleto") return "false";
    return "";
  };

  return (
    <div className="mt-6 space-y-4">
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl p-4 text-sm text-blue-800 dark:text-blue-300">
        <strong>Mercado Pago ativo:</strong> PIX (instantâneo), Cartão de crédito (até 12x) e Boleto. Configure suas credenciais abaixo.
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
        {mpSettings.map((s) => (
          <div key={s.key} className="p-5 flex items-center justify-between gap-4 flex-wrap">
            <div className="flex-1 min-w-[240px]">
              <p className="font-bold text-sm text-slate-900 dark:text-white">{s.label}</p>
              <p className="text-xs text-slate-500 mt-1">{s.description}</p>
            </div>
            {s.type === "boolean" ? (
              <button
                onClick={() => onUpdate({ key: s.key, value: getVal(s.key), label: s.label, description: s.description } as Setting, getVal(s.key) === "true" ? "false" : "true")}
                className={`text-xs font-bold px-4 py-2 rounded-lg transition-colors ${getVal(s.key) === "true" ? "bg-emerald-500 text-white" : "bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300"}`}
              >
                {getVal(s.key) === "true" ? "Ativo" : "Inativo"}
              </button>
            ) : (
              <div className="flex gap-2 shrink-0">
                <input
                  className="w-64 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
                  type={s.type}
                  value={getVal(s.key)}
                  onChange={() => {}}
                  placeholder={s.type === "password" ? "••••••••" : "Cole aqui..."}
                  onBlur={(e) => onUpdate({ key: s.key, value: getVal(s.key), label: s.label, description: s.description } as Setting, e.target.value)}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
        <p className="font-bold text-sm text-slate-900 dark:text-white">Webhook de notificações (IPN)</p>
        <p className="text-xs text-slate-500 mt-1">Configure esta URL no painel do Mercado Pago para receber confirmações automáticas:</p>
        <code className="block mt-2 p-2 bg-slate-100 dark:bg-slate-700 rounded text-xs font-mono break-all">
          {process.env.NEXT_PUBLIC_APP_URL || "https://seudominio.com"}/api/webhooks/mercadopago
        </code>
      </div>
    </div>
  );
}

function SettingInput({ setting, onSave }: { setting: Setting; onSave: (s: Setting, value: string) => void }) {
  const initial = typeof setting.value === "string" ? setting.value : JSON.stringify(setting.value).replace(/^"|"$/g, "");
  const [value, setValue] = useState(initial);
  return <div className="flex gap-2 shrink-0"><input className="w-32 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-right" value={value} onChange={(e) => setValue(e.target.value)} /><button onClick={() => onSave(setting, value)} className="text-xs font-bold px-3 py-2 rounded-lg bg-slate-900 dark:bg-slate-700 text-white">Salvar</button></div>;
}
