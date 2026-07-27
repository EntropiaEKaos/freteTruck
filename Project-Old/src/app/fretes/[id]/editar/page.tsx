"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { UFS, VEHICLE_TYPES, BODY_TYPES, CARGO_TYPES } from "@/lib/constants";
import type { Freight } from "@/db/schema";

export default function EditFreightPage() {
  const params = useParams();
  const router = useRouter();
  const id = String(params.id);
  const [freight, setFreight] = useState<Freight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [forbidden, setForbidden] = useState(false);
  const [saving, setSaving] = useState(false);
  const [vehicles, setVehicles] = useState<string[]>([]);
  const [bodies, setBodies] = useState<string[]>([]);
  const [form, setForm] = useState({
    cargoType: "", description: "", originCity: "", originState: "",
    destCity: "", destState: "", distanceKm: "", weightKg: "",
    price: "", priceType: "total", loadDate: "", contactName: "", contactPhone: "",
  });
  const [needsTracker, setNeedsTracker] = useState(false);
  const [needsTarp, setNeedsTarp] = useState(false);
  const [toll, setToll] = useState(false);

  useEffect(() => {
    (async () => {
      const [meRes, frRes] = await Promise.all([
        fetch("/api/auth/me").then((r) => r.json()),
        fetch(`/api/freights/${id}`).then((r) => r.json()),
      ]);
      if (!meRes.user || frRes.freight?.userId !== meRes.user.id) {
        setForbidden(true);
        setLoading(false);
        return;
      }
      const f = frRes.freight as Freight;
      setFreight(f);
      setForm({
        cargoType: f.cargoType, description: f.description || "",
        originCity: f.originCity, originState: f.originState,
        destCity: f.destCity, destState: f.destState,
        distanceKm: f.distanceKm ? String(f.distanceKm) : "",
        weightKg: f.weightKg ? String(f.weightKg / 1000) : "",
        price: f.price ? String(f.price) : "", priceType: f.priceType,
        loadDate: f.loadDate || "", contactName: f.contactName, contactPhone: f.contactPhone,
      });
      setVehicles(f.vehicleTypes.split(","));
      setBodies(f.bodyTypes.split(","));
      setNeedsTracker(f.needsTracker);
      setNeedsTarp(f.needsTarp);
      setToll(f.toll);
      setLoading(false);
    })();
  }, [id]);

  function set(field: string, value: string) { setForm((f) => ({ ...f, [field]: value })); }
  function toggle(list: string[], setList: (v: string[]) => void, item: string) {
    setList(list.includes(item) ? list.filter((i) => i !== item) : [...list, item]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (vehicles.length === 0) return setError("Selecione ao menos um tipo de caminhão.");
    if (bodies.length === 0) return setError("Selecione ao menos uma carroceria.");
    setSaving(true);
    try {
      const res = await fetch(`/api/freights/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          weightKg: Math.round(parseFloat(form.weightKg) * 1000),
          vehicleTypes: vehicles,
          bodyTypes: bodies,
          needsTracker, needsTarp, toll,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Erro ao salvar."); return; }
      router.push(`/fretes/${id}`);
      router.refresh();
    } finally { setSaving(false); }
  }

  const inputCls = "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white";
  const labelCls = "text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase";
  const chipCls = (active: boolean) =>
    `px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer ${active ? "bg-orange-500 border-orange-500 text-white" : "bg-white dark:bg-slate-700 border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300 hover:border-orange-400"}`;

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-24 text-center text-slate-500">Carregando…</div>;
  if (forbidden) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Sem permissão</h1>
        <p className="mt-2 text-sm text-slate-500">Apenas o dono pode editar este frete.</p>
        <Link href="/painel" className="mt-4 inline-block text-orange-600 font-semibold hover:underline">Voltar ao painel</Link>
      </div>
    );
  }
  if (freight?.isAuction) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <h1 className="text-xl font-bold text-slate-900 dark:text-white">Leilão em andamento</h1>
        <p className="mt-2 text-sm text-slate-500">Fretes em leilão não podem ser editados após publicados.</p>
        <Link href={`/fretes/${id}`} className="mt-4 inline-block text-orange-600 font-semibold hover:underline">Voltar ao frete</Link>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <Link href={`/fretes/${id}`} className="text-sm text-orange-600 font-semibold hover:underline">← Voltar ao frete</Link>
      <h1 className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white">Editar frete #{id}</h1>

      <form onSubmit={handleSubmit} className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 space-y-6">
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2.5 text-sm">{error}</div>}

        <div>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Rota</h2>
          <div className="grid grid-cols-[1fr_90px] sm:grid-cols-[1fr_90px_1fr_90px] gap-3">
            <div><label className={labelCls}>Cidade origem *</label><input required value={form.originCity} onChange={(e) => set("originCity", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>UF *</label><select required value={form.originState} onChange={(e) => set("originState", e.target.value)} className={inputCls}><option value="">--</option>{UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}</select></div>
            <div><label className={labelCls}>Cidade destino *</label><input required value={form.destCity} onChange={(e) => set("destCity", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>UF *</label><select required value={form.destState} onChange={(e) => set("destState", e.target.value)} className={inputCls}><option value="">--</option>{UFS.map((uf) => <option key={uf} value={uf}>{uf}</option>)}</select></div>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Distância (km)</label><input type="number" min="1" value={form.distanceKm} onChange={(e) => set("distanceKm", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>Data de carregamento</label><input type="date" value={form.loadDate} onChange={(e) => set("loadDate", e.target.value)} className={inputCls} /></div>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Carga</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelCls}>Tipo de carga *</label><select required value={form.cargoType} onChange={(e) => set("cargoType", e.target.value)} className={inputCls}><option value="">Selecione</option>{CARGO_TYPES.map((c) => <option key={c} value={c}>{c}</option>)}</select></div>
            <div><label className={labelCls}>Peso (toneladas) *</label><input type="number" required min="0.1" step="0.1" value={form.weightKg} onChange={(e) => set("weightKg", e.target.value)} className={inputCls} /></div>
          </div>
          <div className="mt-3"><label className={labelCls}>Observações</label><textarea value={form.description} onChange={(e) => set("description", e.target.value)} rows={3} className={inputCls} /></div>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Valor</h2>
          <div className="grid grid-cols-2 gap-3">
            <div><label className={labelCls}>Tipo de valor</label><select value={form.priceType} onChange={(e) => set("priceType", e.target.value)} className={inputCls}><option value="total">Valor total</option><option value="tonelada">Por tonelada</option><option value="combinar">A combinar</option></select></div>
            {form.priceType !== "combinar" && (
              <div><label className={labelCls}>Valor (R$)</label><input type="number" min="0" step="0.01" value={form.price} onChange={(e) => set("price", e.target.value)} className={inputCls} /></div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap gap-5">
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={toll} onChange={(e) => setToll(e.target.checked)} className="w-4 h-4 accent-orange-500" /> Pedágio incluso</label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={needsTracker} onChange={(e) => setNeedsTracker(e.target.checked)} className="w-4 h-4 accent-orange-500" /> Exige rastreador</label>
            <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300"><input type="checkbox" checked={needsTarp} onChange={(e) => setNeedsTarp(e.target.checked)} className="w-4 h-4 accent-orange-500" /> Exige lona</label>
          </div>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Caminhões aceitos *</h2>
          <div className="flex flex-wrap gap-2">
            {VEHICLE_TYPES.map((v) => (
              <button key={v} type="button" onClick={() => toggle(vehicles, setVehicles, v)} className={chipCls(vehicles.includes(v))}>{v}</button>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white mb-2 text-sm">Carrocerias aceitas *</h2>
          <div className="flex flex-wrap gap-2">
            {BODY_TYPES.map((b) => (
              <button key={b} type="button" onClick={() => toggle(bodies, setBodies, b)} className={chipCls(bodies.includes(b))}>{b}</button>
            ))}
          </div>
        </div>

        <div>
          <h2 className="font-bold text-slate-900 dark:text-white mb-3 text-sm">Contato</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><label className={labelCls}>Responsável</label><input value={form.contactName} onChange={(e) => set("contactName", e.target.value)} className={inputCls} /></div>
            <div><label className={labelCls}>WhatsApp *</label><input required value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} className={inputCls} /></div>
          </div>
        </div>

        <button type="submit" disabled={saving} className="w-full bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-3.5 rounded-xl transition-colors">
          {saving ? "Salvando…" : "Salvar alterações"}
        </button>
      </form>
    </div>
  );
}
