"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { UFS, VEHICLE_TYPES, BODY_TYPES } from "@/lib/constants";

export default function ConfigPage() {
  const [me, setMe] = useState<any>(null);
  const [form, setForm] = useState({ name: "", phone: "", city: "", state: "", company: "", bio: "", vehicleType: "", bodyType: "", plateNumber: "" });
  const [pwForm, setPwForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingPw, setSavingPw] = useState(false);
  const [msg, setMsg] = useState("");
  const [pwMsg, setPwMsg] = useState("");
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleteBusy, setDeleteBusy] = useState(false);
  const [deleteError, setDeleteError] = useState("");
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      if (!d.user) { setLoading(false); return; }
      setMe(d.user);
      setForm({
        name: d.user.name || "", phone: d.user.phone || "", city: d.user.city || "",
        state: d.user.state || "", company: d.user.company || "", bio: d.user.bio || "",
        vehicleType: d.user.vehicleType || "", bodyType: d.user.bodyType || "", plateNumber: d.user.plateNumber || "",
      });
      setLoading(false);
    });
  }, []);

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })); }

  async function saveProfile(e: React.FormEvent) {
    e.preventDefault();
    setError(""); setMsg("");
    setSaving(true);
    try {
      const res = await fetch("/api/auth/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setMsg("Perfil atualizado com sucesso!");
      setTimeout(() => setMsg(""), 3000);
    } finally { setSaving(false); }
  }

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError(""); setPwMsg("");
    if (pwForm.newPassword !== pwForm.confirmPassword) { setPwError("As senhas não coincidem."); return; }
    setSavingPw(true);
    try {
      const res = await fetch("/api/auth/profile", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ currentPassword: pwForm.currentPassword, newPassword: pwForm.newPassword }) });
      const data = await res.json();
      if (!res.ok) { setPwError(data.error); return; }
      setPwMsg("Senha alterada com sucesso!");
      setPwForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setTimeout(() => setPwMsg(""), 3000);
    } finally { setSavingPw(false); }
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-24 text-center text-slate-500">Carregando...</div>;
  if (!me) return <div className="max-w-md mx-auto px-4 py-24 text-center"><h1 className="text-xl font-bold text-slate-900 dark:text-white">Faça login</h1><Link href="/entrar" className="mt-4 inline-block text-orange-600 font-semibold hover:underline">Entrar</Link></div>;

  const inputCls = "mt-1 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white";
  const labelCls = "text-sm font-semibold text-slate-700 dark:text-slate-300";

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Configurações</h1>
      <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Edite seu perfil e altere sua senha.</p>

      {/* Profile form */}
      <form onSubmit={saveProfile} className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white">Dados do perfil</h2>
        {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{error}</div>}
        {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-2 text-sm">{msg}</div>}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={labelCls}>Nome completo</label><input value={form.name} onChange={e => set("name", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>WhatsApp</label><input value={form.phone} onChange={e => set("phone", e.target.value)} className={inputCls} /></div>
        </div>
        <div><label className={labelCls}>Bio</label><textarea value={form.bio} onChange={e => set("bio", e.target.value)} rows={2} className={inputCls} placeholder="Fale um pouco sobre você ou sua empresa..." /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={labelCls}>Empresa</label><input value={form.company} onChange={e => set("company", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>Placa do veículo</label><input value={form.plateNumber} onChange={e => set("plateNumber", e.target.value)} className={inputCls} placeholder="ABC-1234" /></div>
        </div>
        <div className="grid grid-cols-[1fr_100px] gap-4">
          <div><label className={labelCls}>Cidade</label><input value={form.city} onChange={e => set("city", e.target.value)} className={inputCls} /></div>
          <div><label className={labelCls}>UF</label><select value={form.state} onChange={e => set("state", e.target.value)} className={inputCls}><option value="">--</option>{UFS.map(uf => <option key={uf} value={uf}>{uf}</option>)}</select></div>
        </div>
        {me.role === "motorista" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div><label className={labelCls}>Tipo de caminhão</label><select value={form.vehicleType} onChange={e => set("vehicleType", e.target.value)} className={inputCls}><option value="">--</option>{VEHICLE_TYPES.map(v => <option key={v} value={v}>{v}</option>)}</select></div>
            <div><label className={labelCls}>Carroceria</label><select value={form.bodyType} onChange={e => set("bodyType", e.target.value)} className={inputCls}><option value="">--</option>{BODY_TYPES.map(b => <option key={b} value={b}>{b}</option>)}</select></div>
          </div>
        )}
        <button type="submit" disabled={saving} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </form>

      {/* Password form */}
      <form onSubmit={changePassword} className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6 space-y-4">
        <h2 className="font-bold text-slate-900 dark:text-white">Alterar senha</h2>
        {pwError && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-4 py-2 text-sm">{pwError}</div>}
        {pwMsg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-lg px-4 py-2 text-sm">{pwMsg}</div>}
        <div><label className={labelCls}>Senha atual</label><input type="password" required value={pwForm.currentPassword} onChange={e => setPwForm(f => ({ ...f, currentPassword: e.target.value }))} className={inputCls} /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className={labelCls}>Nova senha</label><input type="password" required minLength={6} value={pwForm.newPassword} onChange={e => setPwForm(f => ({ ...f, newPassword: e.target.value }))} className={inputCls} /></div>
          <div><label className={labelCls}>Confirmar</label><input type="password" required minLength={6} value={pwForm.confirmPassword} onChange={e => setPwForm(f => ({ ...f, confirmPassword: e.target.value }))} className={inputCls} /></div>
        </div>
        <button type="submit" disabled={savingPw} className="bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 disabled:opacity-60 text-white font-bold px-6 py-2.5 rounded-xl transition-colors text-sm">
          {savingPw ? "Alterando..." : "Alterar senha"}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-slate-400">E-mail: <strong>{me.email}</strong> (não editável)</p>

      {/* LGPD — Meus dados */}
      <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-bold text-slate-900 dark:text-white">Meus dados (LGPD)</h2>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Conforme a lei 13.709/2018, você pode exportar todos os seus dados a qualquer momento.</p>
        <button
          onClick={async () => {
            setExporting(true);
            try {
              const res = await fetch("/api/account/export");
              const data = await res.json();
              const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
              const url = URL.createObjectURL(blob);
              const a = document.createElement("a");
              a.href = url;
              a.download = `fretetruck_meus_dados_${new Date().toISOString().split("T")[0]}.json`;
              a.click();
              URL.revokeObjectURL(url);
            } catch {
              alert("Erro ao exportar dados.");
            }
            setExporting(false);
          }}
          disabled={exporting}
          className="mt-4 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white font-bold px-5 py-2.5 rounded-xl transition-colors text-sm disabled:opacity-60"
        >
          {exporting ? "Preparando..." : "Exportar meus dados (JSON)"}
        </button>
      </div>

      {/* Danger zone */}
      <div className="mt-6 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-200 dark:border-red-800 p-6">
        <h2 className="font-bold text-red-700 dark:text-red-400">Zona de perigo</h2>
        <p className="mt-1 text-xs text-red-600/80 dark:text-red-300/80">
          A exclusão é <strong>irreversível</strong>: seus dados pessoais serão anonimizados e sua conta encerrada, conforme a LGPD (direito ao esquecimento).
        </p>
        {!deleteOpen ? (
          <button onClick={() => setDeleteOpen(true)} className="mt-4 border border-red-300 dark:border-red-700 text-red-600 dark:text-red-400 font-bold px-5 py-2.5 rounded-xl text-sm hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors">
            Excluir minha conta
          </button>
        ) : (
          <div className="mt-4 space-y-3">
            {deleteError && <div className="bg-red-100 border border-red-300 text-red-700 rounded-lg px-3 py-2 text-sm">{deleteError}</div>}
            <div>
              <label className="text-xs font-bold text-red-700 dark:text-red-300">Digite EXCLUIR MINHA CONTA para confirmar</label>
              <input
                value={deleteConfirm}
                onChange={(e) => setDeleteConfirm(e.target.value)}
                placeholder="EXCLUIR MINHA CONTA"
                className="mt-1 w-full rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm font-mono"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-red-700 dark:text-red-300">Senha da conta</label>
              <input
                type="password"
                value={deletePassword}
                onChange={(e) => setDeletePassword(e.target.value)}
                className="mt-1 w-full rounded-lg border border-red-300 dark:border-red-700 bg-white dark:bg-slate-800 px-3 py-2.5 text-sm"
              />
            </div>
            <div className="flex gap-2">
              <button
                disabled={deleteBusy || deleteConfirm !== "EXCLUIR MINHA CONTA"}
                onClick={async () => {
                  setDeleteBusy(true);
                  setDeleteError("");
                  const res = await fetch("/api/account/delete", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ password: deletePassword, confirmation: deleteConfirm }),
                  });
                  const data = await res.json();
                  if (!res.ok) {
                    setDeleteError(data.error || "Erro ao excluir.");
                    setDeleteBusy(false);
                    return;
                  }
                  window.location.href = "/";
                }}
                className="bg-red-600 hover:bg-red-700 disabled:opacity-40 text-white font-bold px-5 py-2.5 rounded-xl text-sm"
              >
                {deleteBusy ? "Excluindo..." : "Confirmar exclusão definitiva"}
              </button>
              <button onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); setDeletePassword(""); setDeleteError(""); }}
                className="border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold px-4 py-2.5 rounded-xl text-sm">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
