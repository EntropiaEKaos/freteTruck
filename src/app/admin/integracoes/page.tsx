"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { IcShield, IcMap, IcCheck, IcRefresh, IcTruck } from "@/components/Icons";

type Setting = {
  id: number;
  key: string;
  value: string | null;
  category: string;
  label: string;
  description: string | null;
  isSecret: boolean;
  isPublic: boolean;
  hasValue: boolean;
};

const CATEGORY_INFO: Record<string, { title: string; desc: string; icon: React.ReactNode }> = {
  mapas: {
    title: "Mapas & Geolocalização",
    desc: "Configure o provedor de mapas usado em /mapa e /rastrear. O OpenStreetMap funciona sem chave.",
    icon: <IcMap className="w-5 h-5" />,
  },
  rastreamento: {
    title: "Rastreamento GPS",
    desc: "Ative o GPS real do celular ou conecte um provedor de telemetria (Sascar, Omnilink, Autotrac).",
    icon: <IcTruck className="w-5 h-5" />,
  },
  geral: { title: "Geral", desc: "Outras integrações.", icon: <IcShield className="w-5 h-5" /> },
};

const SELECT_OPTIONS: Record<string, { value: string; label: string }[]> = {
  map_provider: [
    { value: "openstreetmap", label: "OpenStreetMap / CARTO (grátis, sem chave)" },
    { value: "google", label: "Google Maps (requer API Key)" },
    { value: "mapbox", label: "Mapbox (requer Access Token)" },
  ],
  geocoding_provider: [
    { value: "nominatim", label: "Nominatim / OSM (grátis)" },
    { value: "google", label: "Google Geocoding API" },
    { value: "mapbox", label: "Mapbox Geocoding" },
  ],
  tracking_mode: [
    { value: "browser", label: "GPS do navegador/celular (recomendado)" },
    { value: "api", label: "API externa de telemetria" },
    { value: "simulado", label: "Simulado (demonstração)" },
  ],
  tracking_enabled: [
    { value: "true", label: "Ativado" },
    { value: "false", label: "Desativado" },
  ],
};

export default function IntegracoesPage() {
  const [settings, setSettings] = useState<Setting[]>([]);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);
  const [saved, setSaved] = useState<string>("");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  async function load() {
    const res = await fetch("/api/admin/integrations");
    if (res.status === 403) { setForbidden(true); setLoading(false); return; }
    const data = await res.json();
    setSettings(data.settings || []);
    const initial: Record<string, string> = {};
    (data.settings || []).forEach((s: Setting) => { initial[s.key] = s.value || ""; });
    setDrafts(initial);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function save(key: string) {
    const res = await fetch("/api/admin/integrations", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key, value: drafts[key] ?? "" }),
    });
    if (res.ok) {
      setSaved(key);
      setTimeout(() => setSaved(""), 2500);
      await load();
    } else {
      alert("Erro ao salvar configuração.");
    }
  }

  if (loading) return <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-500">Carregando integrações...</div>;

  if (forbidden) {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <IcShield className="w-14 h-14 text-slate-300 dark:text-slate-600 mx-auto" />
        <h1 className="mt-4 text-xl font-bold text-slate-900 dark:text-white">Acesso restrito</h1>
        <p className="mt-2 text-sm text-slate-500">Somente administradores podem configurar integrações.</p>
        <Link href="/" className="mt-6 inline-block text-orange-600 font-semibold hover:underline text-sm">Voltar ao início</Link>
      </div>
    );
  }

  const categories = Array.from(new Set(settings.map((s) => s.category)));
  const inputCls = "w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm text-slate-900 dark:text-white focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none";

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <Link href="/admin" className="text-sm text-orange-600 font-semibold hover:underline">← Painel admin</Link>

      <div className="mt-3 flex items-center gap-3">
        <div className="w-12 h-12 rounded-2xl bg-orange-500/10 dark:bg-orange-500/20 flex items-center justify-center text-orange-500">
          <IcMap className="w-7 h-7" />
        </div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Integrações: Mapas & GPS</h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">Configure as chaves de API e o comportamento do mapa e do rastreamento.</p>
        </div>
      </div>

      {/* Status atual */}
      <div className="mt-6 bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 rounded-xl p-4 text-sm text-emerald-800 dark:text-emerald-300">
        <strong>Funciona sem configurar nada.</strong> O mapa usa OpenStreetMap/CARTO por padrão (gratuito e sem chave).
        Configure Google Maps ou Mapbox abaixo apenas se quiser recursos avançados como Street View ou estilos customizados.
      </div>

      {categories.map((cat) => {
        const info = CATEGORY_INFO[cat] || CATEGORY_INFO.geral;
        const items = settings.filter((s) => s.category === cat);
        return (
          <div key={cat} className="mt-8">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-orange-500">{info.icon}</span>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">{info.title}</h2>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mb-4">{info.desc}</p>

            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 divide-y divide-slate-100 dark:divide-slate-700">
              {items.map((s) => {
                const options = SELECT_OPTIONS[s.key];
                return (
                  <div key={s.key} className="p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1 min-w-[220px]">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-sm text-slate-900 dark:text-white">{s.label}</p>
                          {s.isSecret && (
                            <span className="text-[10px] font-bold uppercase bg-slate-100 dark:bg-slate-700 text-slate-500 dark:text-slate-400 px-1.5 py-0.5 rounded">Secreto</span>
                          )}
                          {s.hasValue && (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-1.5 py-0.5 rounded">
                              <IcCheck className="w-3 h-3" /> Configurado
                            </span>
                          )}
                        </div>
                        {s.description && <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{s.description}</p>}
                        <p className="text-[10px] font-mono text-slate-400 mt-1">{s.key}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex gap-2">
                      {options ? (
                        <select
                          value={drafts[s.key] ?? ""}
                          onChange={(e) => setDrafts((d) => ({ ...d, [s.key]: e.target.value }))}
                          className={inputCls}
                        >
                          {options.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                        </select>
                      ) : (
                        <input
                          type={s.isSecret ? "password" : "text"}
                          value={drafts[s.key] ?? ""}
                          onChange={(e) => setDrafts((d) => ({ ...d, [s.key]: e.target.value }))}
                          placeholder={s.isSecret && s.hasValue ? "•••••••• (preenchido — digite para substituir)" : "Cole o valor aqui..."}
                          className={inputCls}
                        />
                      )}
                      <button
                        onClick={() => save(s.key)}
                        className="shrink-0 bg-slate-900 dark:bg-orange-500 hover:bg-slate-800 dark:hover:bg-orange-600 text-white font-bold text-xs px-4 rounded-lg transition-colors"
                      >
                        {saved === s.key ? "Salvo!" : "Salvar"}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Guia */}
      <div className="mt-10 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
        <h2 className="font-bold text-slate-900 dark:text-white">Como obter as chaves</h2>
        <div className="mt-4 space-y-4 text-sm text-slate-600 dark:text-slate-300">
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Google Maps API Key</p>
            <ol className="mt-1 list-decimal pl-5 space-y-0.5 text-xs">
              <li>Acesse <a href="https://console.cloud.google.com/google/maps-apis" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Google Cloud Console → Maps Platform</a></li>
              <li>Crie um projeto e ative <strong>Maps JavaScript API</strong> + <strong>Geocoding API</strong></li>
              <li>Vá em Credenciais → Criar credencial → Chave de API</li>
              <li>Restrinja a chave ao seu domínio (recomendado)</li>
              <li>Cole a chave no campo acima e selecione o provedor &quot;Google Maps&quot;</li>
            </ol>
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Mapbox Access Token</p>
            <ol className="mt-1 list-decimal pl-5 space-y-0.5 text-xs">
              <li>Acesse <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noopener noreferrer" className="text-orange-600 hover:underline">Mapbox → Access Tokens</a></li>
              <li>Copie o token público (começa com <code className="font-mono">pk.</code>)</li>
              <li>Cole acima e selecione o provedor &quot;Mapbox&quot;</li>
              <li>Plano grátis: 50.000 carregamentos/mês</li>
            </ol>
          </div>
          <div>
            <p className="font-bold text-slate-900 dark:text-white">Rastreamento GPS por telemetria</p>
            <p className="mt-1 text-xs">
              Para integrar rastreadores instalados nos caminhões (Sascar, Omnilink, Autotrac, Positron),
              selecione o modo <strong>&quot;API externa&quot;</strong>, informe a URL do endpoint e a chave de autenticação do provedor.
              No modo <strong>&quot;GPS do navegador&quot;</strong>, o próprio motorista compartilha a localização pelo celular — funciona sem custo adicional.
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3 flex-wrap">
        <Link href="/mapa" className="inline-flex items-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors">
          <IcMap className="w-4 h-4" /> Testar mapa
        </Link>
        <Link href="/rastrear/1" className="inline-flex items-center gap-2 border border-slate-300 dark:border-slate-600 text-slate-700 dark:text-slate-300 font-semibold px-5 py-2.5 rounded-xl text-sm hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors">
          <IcTruck className="w-4 h-4" /> Testar rastreamento
        </Link>
      </div>
    </div>
  );
}
