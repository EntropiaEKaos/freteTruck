import type { Metadata } from "next";
import type { ReactNode } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import BetaBanner from "@/components/BetaBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "FreteTruck — Encontre cargas e fretes em todo o Brasil",
  description: "Marketplace de fretes que conecta caminhoneiros e embarcadores. Busque cargas, publique fretes, negocie direto. Grátis.",
  manifest: "/manifest.json",
  icons: [
    { rel: "icon", url: "/icon-192.png", sizes: "192x192" },
    { rel: "apple-touch-icon", url: "/icon-512.png" },
  ],
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    locale: "pt_BR",
    url: "https://fretetruck.app",
    siteName: "FreteTruck",
    title: "FreteTruck — Marketplace de Fretes Brasileiro",
    description: "Conectamos caminhoneiros e embarcadores em todo o Brasil. Grátis para motoristas.",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
  },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebApplication",
              "name": "FreteTruck",
              "description": "Marketplace de fretes que conecta caminhoneiros e embarcadores no Brasil.",
              "applicationCategory": "BusinessApplication",
              "operatingSystem": "Web",
              "url": "https://fretetruck.app",
              "offers": {
                "@type": "Offer",
                "price": "0",
                "priceCurrency": "BRL",
                "description": "Gratuito para motoristas",
              },
            }),
          }}
        />
      </head>
      <body className="bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 antialiased min-h-screen flex flex-col transition-colors">
        <BetaBanner />
        <Header />
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-900 dark:bg-black text-slate-400 mt-16 border-t border-slate-800">
          <div className="max-w-6xl mx-auto px-4 py-10 grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <p className="text-lg font-bold text-white">FreteTruck</p>
              <p className="mt-2 text-sm leading-relaxed">
                Conectando caminhoneiros e embarcadores em todo o Brasil. Encontre a carga certa para o seu caminhão.
              </p>
            </div>
            <div>
              <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Plataforma</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/fretes" className="hover:text-white transition-colors">Buscar fretes</Link></li>
                <li><Link href="/publicar" className="hover:text-white transition-colors">Publicar frete</Link></li>
                <li><Link href="/calculadora" className="hover:text-white transition-colors">Calculadora de frete</Link></li>
                <li><Link href="/mapa" className="hover:text-white transition-colors">Mapa de fretes</Link></li>
                <li><Link href="/precos" className="hover:text-white transition-colors">Tabela de preços</Link></li>
                <li><Link href="/ia" className="hover:text-white transition-colors">IA de precificação</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Recursos</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/cadastro" className="hover:text-white transition-colors">Cadastre-se grátis</Link></li>
                <li><Link href="/comunidade" className="hover:text-white transition-colors">Comunidade</Link></li>
                <li><Link href="/rankings" className="hover:text-white transition-colors">Rankings</Link></li>
                <li><Link href="/seguro" className="hover:text-white transition-colors">Cotação de seguro</Link></li>
                <li><Link href="/convite" className="hover:text-white transition-colors">Programa de convites</Link></li>
              </ul>
            </div>
            <div>
              <p className="text-white font-semibold mb-3 text-sm uppercase tracking-wider">Suporte</p>
              <ul className="space-y-2 text-sm">
                <li><Link href="/ajuda" className="hover:text-white transition-colors">Central de ajuda</Link></li>
                <li><Link href="/sobre" className="hover:text-white transition-colors">Sobre o FreteTruck</Link></li>
                <li><Link href="/status" className="hover:text-white transition-colors">Status do sistema</Link></li>
                <li><Link href="/documentos" className="hover:text-white transition-colors">Verificação de documentos</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 py-4 flex flex-col sm:flex-row items-center justify-center gap-2 text-xs text-slate-500">
            <span>&copy; {new Date().getFullYear()} FreteTruck. Todos os direitos reservados.</span>
            <span className="hidden sm:inline">·</span>
            <div className="flex gap-3">
              <Link href="/termos" className="hover:text-white transition-colors">Termos de uso</Link>
              <Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link>
              <Link href="/status" className="hover:text-white transition-colors">Status</Link>
            </div>
            <span className="hidden sm:inline">·</span>
            <span className="font-mono">v1.0.0-beta</span>
          </div>
        </footer>
      </body>
    </html>
  );
}
