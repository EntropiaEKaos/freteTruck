import React from "react";
import Link from "next/link";
import { IcTruck, IcCheck, IcShield, IcGift, IcBrain, IcMap, IcWallet } from "@/components/Icons";

export const dynamic = "force-dynamic";

const CHANGELOG_ITEMS = [
  {
    version: "v1.5.0",
    date: "Julho 2026",
    badge: "Atualização de Produção",
    title: "Gestão do Banco Admin, Cupons de Trucks & Denúncias",
    items: [
      "🗄️ Painel Admin de Banco de Dados (/admin/banco) com verificação de schema em tempo real e criação de tabelas automáticas com 1 clique.",
      "🎁 Sistema de Cupons de Bônus (ex: BETA50, FRETETRUCK2025) para resgate de Trucks gratuitos na carteira.",
      "🛡️ Ferramenta de Denúncias e Moderação de Conteúdo para reportar postagens ou comentários impróprios na comunidade.",
      "🖼️ Suporte a Uploads de Imagens no PostgreSQL para fotos de perfil, documentos fiscais e comunidade sem depender de CDN externo.",
    ],
  },
  {
    version: "v1.4.0",
    date: "Julho 2026",
    badge: "Experiência Visual",
    title: "Carrossel Hero Interativo & Fotos em Alta Definição",
    items: [
      "✨ Carrossel na Tela Inicial com fotografias reais em HD (Caminhões, rodovias brasileiras e logística) e transição automática.",
      "🔍 Painel Glassmorphism flutuante para consulta rápida de fretes por UF de Origem e Destino.",
      "📊 Contadores de Fretes Ativos, Membros Cadastrados e Cobertura Nacional atualizados ao vivo na Home.",
    ],
  },
  {
    version: "v1.3.0",
    date: "Julho 2026",
    badge: "Monetização & Pagamentos",
    title: "Mercado Pago PIX, Cartão e Moeda Trucks",
    items: [
      "💳 Integração oficial com Checkout Pro do Mercado Pago (PIX instantâneo, Cartão até 12x e Boleto).",
      "💰 Carteira de Trucks com Ledger imutável para histórico completo de créditos e débitos.",
      "🎛️ Painel Admin de Monetização para configurar preços, comissões, bônus de indicação e cotas grátis.",
    ],
  },
  {
    version: "v1.2.0",
    date: "Julho 2026",
    badge: "Conformidade & Logística",
    title: "Piso Mínimo ANTT, QR Code e Rastreamento GPS",
    items: [
      "⚖️ Calculadora e comparador automático do Piso Mínimo ANTT (Lei 13.703/2018) por categoria e eixos.",
      "📱 Gerador de QR Code em todos os fretes e Comprovante Digital de Entrega (POD) imprimível em PDF.",
      "📍 Rastreamento em tempo real com mapa geográfico interativo e compartilhamento via celular do motorista.",
    ],
  },
  {
    version: "v1.1.0",
    date: "Julho 2026",
    badge: "Inteligência & Comunidade",
    title: "IA de Precificação & Mural Comunitário",
    items: [
      "🤖 Motor de Inteligência Artificial para sugestão de preço ideal com base em distância, peso e sazonalidade.",
      "💬 Chat Interno em tempo real com notificações e Mural Comunitário para dicas, alertas de trânsito e preços de diesel.",
    ],
  },
];

export default function ChangelogPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between flex-wrap gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 dark:text-white">
            Changelog & Novidades
          </h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400 text-sm">
            Acompanhe a evolução contínua da plataforma FreteTruck e todas as melhorias publicadas.
          </p>
        </div>
        <Link
          href="/fretes"
          className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
        >
          Buscar Fretes
        </Link>
      </div>

      <div className="space-y-8">
        {CHANGELOG_ITEMS.map((release, idx) => (
          <div
            key={release.version}
            className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-6 md:p-8 shadow-sm"
          >
            <div className="flex items-center justify-between flex-wrap gap-2 pb-4 border-b border-slate-100 dark:border-slate-700">
              <div className="flex items-center gap-3">
                <span className="font-mono text-lg font-black text-orange-500">
                  {release.version}
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-orange-500/10 text-orange-600 dark:text-orange-400 font-bold text-xs uppercase tracking-wider">
                  {release.badge}
                </span>
              </div>
              <span className="text-xs font-semibold text-slate-400">
                {release.date}
              </span>
            </div>

            <h2 className="text-xl font-extrabold text-slate-900 dark:text-white mt-4">
              {release.title}
            </h2>

            <ul className="mt-4 space-y-3">
              {release.items.map((item, itemIdx) => (
                <li
                  key={itemIdx}
                  className="flex items-start gap-3 text-sm text-slate-600 dark:text-slate-300 leading-relaxed"
                >
                  <span className="text-emerald-500 font-bold mt-0.5">•</span>
                  <span>{item}</span>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
