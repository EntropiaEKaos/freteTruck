"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UFS, VEHICLE_TYPES, BODY_TYPES, CARGO_TYPES } from "@/lib/constants";

export default function PublishPage() {
  const router = useRouter();
  const [authState, setAuthState] = useState<"loading" | "ok" | "guest">("loading");
  const [trucks, setTrucks] = useState(0);
  const [form, setForm] = useState({
    cargoType: "", description: "", originCity: "", originState: "",
    destCity: "", destState: "", distanceKm: "", weightKg: "",
    price: "", priceType: "total", loadDate: "", contactName: "", contactPhone: "",
    minPrice: "",
  });
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [bodies, setBodies] = useState<string[]>([]);
  const [needsTracker, setNeedsTracker] = useState(false);
  const [needsTarp, setNeedsTarp] = useState(false);
  const [toll, setToll] = useState(false);
  const [isAuction, setIsAuction] = useState(false);
  const [isRecurring, setIsRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState("semanal");
  const [featured, setFeatured] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => r.json()).then((d) => {
      if (d.user) {
        setAuthState("ok");
        setForm((f) => ({ ...f, contactName: d.user.name, contactPhone: d.user.phone || "" }));
        fetch("/api/trucks/wallet").then((r) => r.json()).then((w) => setTrucks(w.wallet?.balance || 0));
      } else { setAuthState("guest"); }
    }).catch(() => setAuthState("guest"));
  }, []);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }
  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (vehicles.length === 0) return setError("Selecione ao menos um tipo de caminhão.");
    if (bodies.length === 0) return setError("Selecione ao menos um tipo de carroceria.");
    if (isAuction && !form.minPrice) return setError("Defina o preço mínimo para o leilão.");
    if (featured && trucks < 15) return setError(`Saldo insuficiente para destacar. Você tem ${trucks} Trucks e precisa de 15.`);
    setLoading(true);
    try {
      const res = await fetch("/api/freights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          weightKg: Math.round(parseFloat(form.weightKg) * 1000),
          vehicleTypes: vehicles, bodyTypes: bodies,
          needsTracker, needsTarp, toll,
          isAuction, minPrice: isAuction ? form.minPrice : null,
          featured,
          isRecurring, recurringFrequency: isRecurring ? recurringFreq : null,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao publicar frete."); return; }
      router.push(`/fretes/${data.freight.id}`);
      router.refresh();
    } finally { setLoading(false); }
  }

  if (authState === "loading") return <div className="max-w-2xl mx-auto px-4 py-24 text-center text-slate-500 dark:text-slate-400">Carregando...</div>;
  if (authState === "guest") {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="text-5xl">🔒</p>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">Faça login para publicar</h1>
        <p className="mt-2 text-slate-500 text-sm">Você precisa de uma conta (grátis) para publicar fretes.</p>
        <div className="mt-6 flex gap-3 justify-center">
          <Link href="/entrar" className="px-6 py-2.5 rounded-xl border border-slate-300 font-semibold text-slate-700 dark:text-white hover:bg-slate-50 dark:hover:bg-slate-800">Entrar</Link>
          <Link href="/cadastro" className="px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold">Cadastre-se grátis</Link>
        </div>
      </div>
    );
  }

  const inputCls = "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white";
  const labelCls = "text-sm font-semibold text-slate-700 dark:text-slate-300";
  const chipCls = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${active ? "bg-orange-500 border-orange-500 text-white" : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-orange-400"}`;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">Publicar frete</h1>
      <p className="mt-1 text-slate-500 dark:text-slate-400">Preencha os dados da carga e receba propostas e contatos de motoristas.</p>

      <form onSubmit={handleSubmit} className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{error}</div>}

        {/* Rota */}
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">📍 Rota</h2>
          <div className="grid grid-cols-[1fr_90px] sm:grid-cols-[1fr_90px_1fr_90px] gap-3">
            <div><label className={labelCls}>Cidade origem *</label><input required value={form.originCity} onChange={(e) => set("originCity", e.target.value)} className={inputCls} placeholder="Ex: Sorriso" /></div>
            <div><label className={labelCls}>UF *</label><select required value={form.originState} onChange={(e) => set("originState", e.target.value)} className={inputCls}><option value="">--</option>{UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}</select></div>
            <div><label className={labelCls}>Cidade destino *</label><input required value={form.destCity} onChange={(e) => set("destCity", e.target.value)} className={inputCls} placeholder="Ex: Santos" /></div>
            <div><label className={labelCls}>UF *</label><select required value={form.destState} onChange={(e) => set("destState", e.target.value)} className={inputCls}><option value="">--</option>{UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}</select></div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Distância (km)</label><input type="number" min="1" value={form.distanceKm} onChange={(e) => set("distanceKm", e.target.value)} className={inputCls} placeholder="Opcional" /></div>
            <div><label className={labelCls}>Data de carregamento</label><input type="date" value={form.loadDate} onChange={(e) => set("loadDate", e.target.value)} className={inputCls} /></div>
          </div>
        </div>

        {/* Carga */}
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">📦 Carga</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelCls}>Tipo de carga *</label><select required value={form.cargoType} onChange={(e) => set("cargoType", e.target.value)} className={inputCls}><option value="">Selecione</option>{CARGO_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className={labelCls}>Peso (toneladas) *</label><input type="number" required min="0.1" step="0.1" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} className={inputCls} placeholder="Ex: 32" /></div>
          </div>
          <div className="mt-3"><label className={labelCls}>Observações</label><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputCls} placeholder="Detalhes adicionais..." /></div>
        </div>

        {/* Modo: Normal vs Leilão */}
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">🎯 Modo de negociação</h2>
          <div className="grid grid-cols-2 gap-3">
            <button type="button" onClick={() => setIsAuction(false)}
              className={`rounded-xl border-2 p-4 text-center transition-colors ${!isAuction ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-slate-200 dark:border-slate-600"}`}>
              <div className="text-2xl">📢</div>
              <p className="mt-1 font-bold text-sm text-slate-900 dark:text-white">Frete normal</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Você define o preço</p>
            </button>
            <button type="button" onClick={() => setIsAuction(true)}
              className={`rounded-xl border-2 p-4 text-center transition-colors ${isAuction ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20" : "border-slate-200 dark:border-slate-600"}`}>
              <div className="text-2xl">🎰</div>
              <p className="mt-1 font-bold text-sm text-slate-900 dark:text-white">Leilão reverso</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Motoristas dão lances</p>
            </button>
          </div>
        </div>

        {/* Valor */}
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">💰 {isAuction ? "Configuração do leilão" : "Valor do frete"}</h2>
          {isAuction ? (
            <div>
              <label className={labelCls}>Preço mínimo aceitável (R$) *</label>
              <input type="number" min="1" step="0.01" value={form.minPrice} onChange={(e) => set("minPrice", e.target.value)} className={inputCls} placeholder="Motoristas não verão este valor" />
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Motoristas enviam lances. Você aceita o melhor acima do mínimo.</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div><label className={labelCls}>Tipo de valor</label><select value={form.priceType} onChange={(e) => set("priceType", e.target.value)} className={inputCls}><option value="total">Valor total</option><option value="tonelada">Por tonelada</option><option value="combinar">A combinar</option></select></div>
                {form.priceType !== "combinar" && <div><label className={labelCls}>Valor (R$)</label><input type="number" min="1" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className={inputCls} placeholder="Ex: 8500" /></div>}
              </div>
              <label className="mt-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
                <input type="checkbox" checked={toll} onChange={(e) => setToll(e.target.checked)} className="w-4 h-4 accent-orange-500" /> Pedágio incluso no valor
              </label>
            </>
          )}
        </div>

        {/* Veículos */}
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white mb-1">🚚 Caminhões aceitos *</h2>
          <div className="flex flex-wrap gap-2 mt-2">{VEHICLE_TYPES.map((v) => (<button key={v} type="button" onClick={() => toggle(vehicles, setVehicles, v)} className={chipCls(vehicles.includes(v))}>{v}</button>))}</div>
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white mb-1">🛻 Carrocerias aceitas *</h2>
          <div className="flex flex-wrap gap-2 mt-2">{BODY_TYPES.map((b) => (<button key={b} type="button" onClick={() => toggle(bodies, setBodies, b)} className={chipCls(bodies.includes(b))}>{b}</button>))}</div>
        </div>

        {/* Exigências */}
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={needsTracker} onChange={(e) => setNeedsTracker(e.target.checked)} className="w-4 h-4 accent-orange-500" /> 📡 Exige rastreador</label>
          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={needsTarp} onChange={(e) => setNeedsTarp(e.target.checked)} className="w-4 h-4 accent-orange-500" /> 🛡️ Exige lona</label>
        </div>

        {/* Contato */}
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3">📞 Contato</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelCls}>Nome do responsável</label><input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>WhatsApp *</label><input required value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className={inputCls} placeholder="(65) 99999-9999" /></div>
          </div>
        </div>

        {/* Destacar */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl p-4">
          <label className="flex items-center gap-3 cursor-pointer">
            <input type="checkbox" checked={featured} onChange={(e) => setFeatured(e.target.checked)} className="w-5 h-5 accent-orange-500" />
            <div>
              <p className="font-bold text-sm text-slate-900 dark:text-white">⭐ Destacar frete no topo da busca</p>
              <p className="text-xs text-slate-500 dark:text-slate-400">Custa 15 Trucks. Seu saldo: <b>{trucks} Trucks</b></p>
            </div>
          </label>
        </div>

        <button type="submit" disabled={loading} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors text-lg">
          {loading ? "Publicando..." : isAuction ? "🎰 Publicar leilão" : featured ? "⭐ Publicar frete destacado" : "🚀 Publicar frete grátis"}
        </button>
      </form>
    </div>
  );
}
