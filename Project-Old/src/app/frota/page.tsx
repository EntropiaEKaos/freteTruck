"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { VEHICLE_TYPES } from "@/lib/constants";

type DriverEntry = {
  fleet_drivers: { id: number; fleetId: number; driverId: number; plateNumber: string | null; vehicleType: string | null; status: string; joinedAt: string };
  users: { name: string; phone: string; id: number };
};
type FleetData = {
  fleet: { id: number; name: string; ownerId: number; createdAt: string };
  driverCount: number;
  drivers: DriverEntry[];
};

export default function FrotaPage() {
  const [fleets, setFleets] = useState<FleetData[]>([]);
  const [me, setMe] = useState<{ id: number; name: string; role: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [newFleet, setNewFleet] = useState("");
  const [creating, setCreating] = useState(false);
  const [addForm, setAddForm] = useState<{ fleetId: number; email: string; plate: string; vehicle: string } | null>(null);
  const [addError, setAddError] = useState("");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState<number | null>(null);

  async function reload() {
    const d = await fetch("/api/fleet").then(r => r.json());
    setFleets(d.fleets || []);
  }

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => setMe(d.user));
    reload().finally(() => setLoading(false));
  }, []);

  async function createFleet() {
    if (!newFleet.trim()) return;
    setCreating(true);
    await fetch("/api/fleet", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name: newFleet }) });
    setNewFleet("");
    await reload();
    setCreating(false);
  }

  async function addDriver() {
    if (!addForm || !addForm.email.trim()) return;
    setAddError("");
    setAdding(true);
    const res = await fetch("/api/fleet/drivers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fleetId: addForm.fleetId, driverEmail: addForm.email, plateNumber: addForm.plate, vehicleType: addForm.vehicle }),
    });
    const data = await res.json();
    if (!res.ok) { setAddError(data.error || "Erro ao adicionar."); setAdding(false); return; }
    setAddForm(null);
    await reload();
    setAdding(false);
  }

  async function removeDriver(id: number) {
    if (!confirm("Remover motorista da frota?")) return;
    setBusy(id);
    await fetch(`/api/fleet/drivers?id=${id}`, { method: "DELETE" });
    await reload();
    setBusy(null);
  }

  async function changeStatus(id: number, status: string) {
    setBusy(id);
    await fetch("/api/fleet/drivers", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    });
    await reload();
    setBusy(null);
  }

  if (!me) return <div className="max-w-md mx-auto px-4 py-24 text-center"><p className="text-5xl">🏢</p><p className="mt-4 font-bold text-slate-900 dark:text-white">Faça login para gerenciar sua frota.</p></div>;
  if (loading) return <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-500">Carregando...</div>;

  const statusOpts = [
    { value: "disponivel", label: "✅ Disponível", cls: "bg-emerald-100 text-emerald-700" },
    { value: "em_transito", label: "🛣️ Em trânsito", cls: "bg-blue-100 text-blue-700" },
    { value: "manutencao", label: "🔧 Manutenção", cls: "bg-red-100 text-red-700" },
  ];

  const inputCls = "rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white";

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">🏢 Gestão de Frota</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Gerencie seus motoristas e caminhões em um só lugar.</p>

      {/* Create fleet */}
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-bold text-slate-900 dark:text-white mb-3">Criar nova frota</h2>
        <div className="flex gap-3">
          <input value={newFleet} onChange={e => setNewFleet(e.target.value)} className={`flex-1 ${inputCls}`} placeholder="Nome da frota (ex: Frota Norte)" />
          <button onClick={createFleet} disabled={creating} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-lg text-sm">{creating ? "Criando..." : "+ Criar"}</button>
        </div>
      </div>

      {/* Fleet list */}
      {fleets.length === 0 ? (
        <div className="mt-6 text-center py-12 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700">
          <p className="text-5xl">🚛</p>
          <p className="mt-4 font-bold text-slate-900 dark:text-white">Nenhuma frota criada</p>
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {fleets.map(f => (
            <div key={f.fleet.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden">
              <div className="px-6 py-4 bg-slate-50 dark:bg-slate-700/30 flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg text-slate-900 dark:text-white">{f.fleet.name}</h3>
                  <p className="text-xs text-slate-500">{f.driverCount} motorista(s)</p>
                </div>
                <button onClick={() => setAddForm({ fleetId: f.fleet.id, email: "", plate: "", vehicle: "" })}
                  className="text-sm font-bold px-4 py-2 rounded-lg bg-slate-900 dark:bg-orange-500 hover:bg-slate-800 dark:hover:bg-orange-600 text-white transition-colors">
                  + Adicionar motorista
                </button>
              </div>

              {/* Add driver form */}
              {addForm && addForm.fleetId === f.fleet.id && (
                <div className="px-6 py-4 bg-blue-50 dark:bg-blue-900/10 border-b border-slate-200 dark:border-slate-700">
                  {addError && <p className="text-sm text-red-600 mb-2">{addError}</p>}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <input value={addForm.email} onChange={e => setAddForm(f => f && ({ ...f, email: e.target.value }))} className={inputCls} placeholder="Email do motorista *" />
                    <input value={addForm.plate} onChange={e => setAddForm(f => f && ({ ...f, plate: e.target.value }))} className={inputCls} placeholder="Placa (ex: ABC-1234)" />
                    <select value={addForm.vehicle} onChange={e => setAddForm(f => f && ({ ...f, vehicle: e.target.value }))} className={inputCls}>
                      <option value="">Veículo</option>
                      {VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}
                    </select>
                    <div className="flex gap-2">
                      <button onClick={addDriver} disabled={adding} className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-2 rounded-lg text-sm">{adding ? "..." : "Adicionar"}</button>
                      <button onClick={() => { setAddForm(null); setAddError(""); }} className="px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-600">✕</button>
                    </div>
                  </div>
                </div>
              )}

              <div className="divide-y divide-slate-100 dark:divide-slate-700">
                {f.drivers.length === 0 ? (
                  <div className="p-6 text-center text-sm text-slate-400">Nenhum motorista. Clique em &quot;+ Adicionar motorista&quot;.</div>
                ) : f.drivers.map(d => (
                  <div key={d.fleet_drivers.id} className="flex items-center justify-between p-4 hover:bg-slate-50 dark:hover:bg-slate-700/30 flex-wrap gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="text-2xl">🚛</span>
                      <div className="min-w-0">
                        <p className="font-semibold text-sm text-slate-900 dark:text-white">{d.users.name}</p>
                        <p className="text-xs text-slate-500">
                          {d.fleet_drivers.plateNumber ? `🔢 ${d.fleet_drivers.plateNumber}` : "Sem placa"}
                          {d.fleet_drivers.vehicleType ? ` · ${d.fleet_drivers.vehicleType}` : ""}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <select
                        value={d.fleet_drivers.status}
                        onChange={e => changeStatus(d.fleet_drivers.id, e.target.value)}
                        disabled={busy === d.fleet_drivers.id}
                        className={`text-xs font-bold px-2 py-1 rounded-full border-0 cursor-pointer ${statusOpts.find(s => s.value === d.fleet_drivers.status)?.cls || "bg-slate-100"}`}
                      >
                        {statusOpts.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                      </select>
                      <Link href={`/perfil/${d.fleet_drivers.driverId}`} className="text-xs text-orange-600 hover:underline">Perfil</Link>
                      <button onClick={() => removeDriver(d.fleet_drivers.id)} disabled={busy === d.fleet_drivers.id}
                        className="text-xs text-red-500 hover:text-red-700 font-semibold disabled:opacity-50">Remover</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
