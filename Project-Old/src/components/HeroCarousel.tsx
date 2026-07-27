"use client";

import React, { useState, useEffect } from "react";
import { UFS } from "@/lib/constants";
import { IcSearch, IcArrow } from "@/components/Icons";

interface HeroCarouselProps {
  freightCount: number;
  userCount: number;
}

const SLIDES = [
  {
    image: "https://images.pexels.com/photos/35164039/pexels-photo-35164039.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1600",
    badge: "O maior parceiro do caminhoneiro",
    title: "Encontre a carga certa para o seu caminhão",
    highlight: "em qualquer lugar do Brasil",
    desc: "Milhares de fretes publicados diariamente por embarcadores verificados. Negocie direto pelo WhatsApp ou chat interno, sem taxas ou comissões.",
  },
  {
    image: "https://images.pexels.com/photos/29950614/pexels-photo-29950614.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1600",
    badge: "0% de Comissão no Marketplace",
    title: "Negociação Direta sem Intermediários",
    highlight: "+ Mais Lucro para Você",
    desc: "O valor do frete vai 100% para quem transporta. Conectamos autônomos, transportadoras e indústrias com transparência e agilidade.",
  },
  {
    image: "https://images.pexels.com/photos/32956106/pexels-photo-32956106.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1600",
    badge: "Conformidade Legal & Segurança",
    title: "Conformidade com o Piso Mínimo ANTT",
    highlight: "& Comprovante Digital POD",
    desc: "Todas as cargas são auditadas com os coeficientes da Lei 13.703/2018. Gere comprovantes de entrega digitais (POD) com QR Code instantâneo.",
  },
  {
    image: "https://images.pexels.com/photos/6194882/pexels-photo-6194882.jpeg?auto=compress&cs=tinysrgb&fit=crop&h=800&w=1600",
    badge: "Tecnologia de Ponta",
    title: "IA de Precificação & Rastreamento GPS",
    highlight: "em Tempo Real",
    desc: "Saiba exatamente quanto cobrar por quilômetro rodado com nossa IA preditiva e ofereça rastreamento em tempo real para seus embarcadores.",
  },
];

export default function HeroCarousel({ freightCount, userCount }: HeroCarouselProps) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % SLIDES.length);
    }, 6000);
    return () => clearInterval(timer);
  }, []);

  const slide = SLIDES[current];

  return (
    <section className="relative bg-slate-950 text-white min-h-[620px] flex flex-col justify-between overflow-hidden">
      {/* Background Images with smooth transitions */}
      {SLIDES.map((s, idx) => (
        <div
          key={idx}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === current ? "opacity-100 z-10" : "opacity-0 z-0 pointer-events-none"
          }`}
          style={{
            backgroundImage: `linear-gradient(to right, rgba(15,23,42,0.95) 0%, rgba(15,23,42,0.75) 50%, rgba(15,23,42,0.40) 100%), url(${s.image})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        />
      ))}

      {/* Content Container */}
      <div className="relative z-20 max-w-6xl mx-auto px-4 pt-16 pb-10 md:pt-24 md:pb-14 flex-1 flex flex-col justify-between w-full">
        <div className="max-w-3xl min-h-[220px]">
          <span className="inline-block px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/40 text-orange-400 font-bold text-xs uppercase tracking-widest mb-4 animate-fade-in">
            {slide.badge}
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold leading-tight tracking-tight drop-shadow-sm">
            {slide.title} <span className="text-orange-500 block sm:inline">{slide.highlight}</span>
          </h1>
          <p className="mt-4 text-base md:text-lg text-slate-300 max-w-2xl leading-relaxed drop-shadow">
            {slide.desc}
          </p>
        </div>

        {/* Search Form Box */}
        <div className="mt-8 bg-slate-900/90 dark:bg-slate-900/95 backdrop-blur-md rounded-3xl p-5 md:p-6 border border-slate-700/80 shadow-2xl">
          <form action="/fretes" method="GET" className="grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-4 items-end">
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Origem (Estado / UF)
              </label>
              <select
                name="originState"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              >
                <option value="">Todo o Brasil (Qualquer Origem)</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf} — Brasil
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                Destino (Estado / UF)
              </label>
              <select
                name="destState"
                className="w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white text-sm font-medium focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
              >
                <option value="">Todo o Brasil (Qualquer Destino)</option>
                {UFS.map((uf) => (
                  <option key={uf} value={uf}>
                    {uf} — Brasil
                  </option>
                ))}
              </select>
            </div>
            <div>
              <button
                type="submit"
                className="w-full md:w-auto bg-orange-500 hover:bg-orange-600 active:scale-[0.98] text-white font-extrabold px-8 py-3 rounded-xl transition-all flex items-center justify-center gap-2 shadow-lg shadow-orange-500/25"
              >
                <IcSearch className="w-5 h-5" /> Buscar fretes
              </button>
            </div>
          </form>
        </div>

        {/* Carousel Controls & Stats Footer */}
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-between gap-6 pt-6 border-t border-slate-800/80">
          {/* Dots & Navigation */}
          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              {SLIDES.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setCurrent(idx)}
                  className={`h-2.5 rounded-full transition-all duration-300 ${
                    idx === current ? "w-8 bg-orange-500" : "w-2.5 bg-slate-700 hover:bg-slate-600"
                  }`}
                  aria-label={`Slide ${idx + 1}`}
                />
              ))}
            </div>
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => setCurrent((prev) => (prev - 1 + SLIDES.length) % SLIDES.length)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                aria-label="Anterior"
              >
                <span className="inline-block rotate-180 font-bold text-sm leading-none px-1">➜</span>
              </button>
              <button
                onClick={() => setCurrent((prev) => (prev + 1) % SLIDES.length)}
                className="p-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 transition-colors border border-slate-700"
                aria-label="Próximo"
              >
                <span className="inline-block font-bold text-sm leading-none px-1">➜</span>
              </button>
            </div>
          </div>

          {/* Live Stats */}
          <div className="flex flex-wrap items-center justify-center sm:justify-end gap-6 md:gap-10">
            <div className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <p className="text-xl md:text-2xl font-black text-white leading-none">
                  {freightCount.toLocaleString("pt-BR")}
                </p>
                <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
                  Fretes Ativos
                </p>
              </div>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div>
              <p className="text-xl md:text-2xl font-black text-white leading-none">
                {userCount.toLocaleString("pt-BR")}
              </p>
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
                Membros Cadastrados
              </p>
            </div>
            <div className="h-8 w-px bg-slate-800 hidden sm:block" />
            <div>
              <p className="text-xl md:text-2xl font-black text-orange-400 leading-none">27</p>
              <p className="text-[11px] uppercase tracking-wider font-bold text-slate-400 mt-0.5">
                UFs Cobertas
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
