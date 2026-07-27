"use client";

import { useEffect, useState } from "react";
import { formatBRL } from "@/lib/constants";

type RefRow = { referral: { id: number; status: string; bonusAmount: string | null; createdAt: string }; invitedName: string };
type Data = { code: string; invitedCount: number; link: string; totalBonusEarned: number; referrals: RefRow[] };

export default function ConvitePage() {
  const [data, setData] = useState<Data | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    fetch("/api/referral").then((r) => r.json()).then(setData);
  }, []);

  async function copyLink() {
    if (!data?.link) return;
    await navigator.clipboard.writeText(data.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  async function generateNewCode() {
    await fetch("/api/referral", { method: "POST" });
    const res = await fetch("/api/referral").then((r) => r.json());
    setData(res);
  }

  const shareText = encodeURIComponent(
    `Crie seu conta grátis no FreteTruck — o maior marketplace de fretes do Brasil! Use meu link: ${data?.link}`
  );

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">🎁 Programa de Convites</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">
        Convide amigos para o FreteTruck e ganhe R$ 25 em créditos por cada cadastro confirmado!
      </p>

      {/* Ref link card */}
      <div className="mt-6 bg-gradient-to-br from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20 rounded-2xl border border-emerald-200 dark:border-emerald-800 p-6">
        <div className="flex items-center justify-between flex-wrap gap-3 mb-4">
          <div>
            <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold">Seu código de convite</p>
            <p className="text-3xl font-mono font-extrabold text-emerald-800 dark:text-emerald-200 mt-1">{data?.code || "..."}</p>
          </div>
          <button onClick={generateNewCode} className="text-sm font-semibold text-emerald-700 underline">Gerar novo</button>
        </div>

        <p className="text-sm text-emerald-700 dark:text-emerald-300 font-semibold mb-2">Seu link de convite</p>
        <div className="flex gap-2">
          <input readOnly value={data?.link || ""} className="flex-1 rounded-lg border border-emerald-300 bg-white px-3 py-2.5 text-sm text-slate-700" />
          <button onClick={copyLink} className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2.5 rounded-lg transition-colors">
            {copied ? "✅ Copiado!" : "📋 Copiar"}
          </button>
        </div>

        <div className="mt-4 flex gap-2 flex-wrap">
          <a
            href={`https://wa.me/?text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-green-500 hover:bg-green-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm"
          >
            WhatsApp →
          </a>
          <a
            href={`https://t.me/share/url?url=${encodeURIComponent(data?.link || "")}&text=${shareText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-blue-500 hover:bg-blue-600 text-white font-bold px-5 py-2.5 rounded-lg text-sm"
          >
            Telegram →
          </a>
        </div>
      </div>

      {/* Stats */}
      <div className="mt-6 grid grid-cols-3 gap-4">
        {[
          { label: "Convidados", value: String(data?.invitedCount || 0), icon: "👥" },
          { label: "Bonus total", value: formatBRL(data?.totalBonusEarned || 0), icon: "💰" },
          { label: "Por convite", value: "R$ 25,00", icon: "🎯" },
        ].map((s) => (
          <div key={s.label} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 text-center">
            <p className="text-2xl">{s.icon}</p>
            <p className="text-xl font-extrabold text-slate-900 dark:text-white mt-1">{s.value}</p>
            <p className="text-xs text-slate-500 dark:text-slate-400">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Invited list */}
      <h2 className="mt-8 text-xl font-bold text-slate-900 dark:text-white">Convites enviados</h2>
      <div className="mt-4 space-y-2">
        {(!data?.referrals || data.referrals.length === 0) ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Nenhum convite ainda. Compartilhe seu link acima!
          </div>
        ) : (
          data.referrals.map((r) => (
            <div key={r.referral.id} className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-4 flex items-center justify-between">
              <div>
                <p className="font-semibold text-sm text-slate-900 dark:text-white">{r.invitedName}</p>
                <p className="text-xs text-slate-500">{new Date(r.referral.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
              <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                r.referral.status === "confirmed"
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-amber-100 text-amber-700"
              }`}>
                {r.referral.status === "confirmed" ? `✅ +${formatBRL(r.referral.bonusAmount || 25)}` : "⏳ Aguardando"}
              </span>
            </div>
          ))
        )}
      </div>

      {/* Rules */}
      <div className="mt-8 bg-slate-50 dark:bg-slate-800/50 rounded-xl p-5 border border-slate-200 dark:border-slate-700">
        <p className="font-bold text-sm text-slate-900 dark:text-white mb-2">📜 Regras do programa:</p>
        <ul className="space-y-1 text-xs text-slate-600 dark:text-slate-400 list-disc pl-4">
          <li>O convidado deve se cadastrar pelo seu link e completar o perfil</li>
          <li>O bônus de R$ 25 é creditado quando o convidado publicar seu primeiro frete ou enviar a primeira proposta</li>
          <li>Créditos podem ser usados para destaque de fretes na busca</li>
          <li>Não há limite de convites — quanto mais, melhor!</li>
        </ul>
      </div>
    </div>
  );
}
