"use client";

import { useEffect, useState } from "react";

export function WeatherWidget({ city, state, type }: { city: string; state: string; type: "origin" | "dest" }) {
  const [weather, setWeather] = useState<{ temp: number; desc: string; icon: string } | null>(null);

  useEffect(() => {
    // Simulação inteligente de clima por região para o beta público
    // Em produção seria algo como `fetch('https://api.openweathermap.org/data/2.5/weather?q=${city},BR')`
    const isNorth = ["AM", "PA", "RR", "AP", "AC", "RO", "TO"].includes(state);
    const isNortheast = ["MA", "PI", "CE", "RN", "PB", "PE", "AL", "SE", "BA"].includes(state);
    const isSouth = ["PR", "SC", "RS"].includes(state);

    let baseTemp = 25;
    let icon = "☀️";
    let desc = "Ensolarado";

    if (isNorth) { baseTemp = 32; icon = "⛈️"; desc = "Pancadas de chuva"; }
    else if (isNortheast) { baseTemp = 30; icon = "☀️"; desc = "Céu limpo"; }
    else if (isSouth) { baseTemp = 18; icon = "☁️"; desc = "Nublado"; }
    else { baseTemp = 24; icon = "⛅"; desc = "Parcialmente nublado"; }

    // Randomize slightly based on city length to look dynamic
    const mod = (city.length % 5) - 2; 
    setWeather({ temp: baseTemp + mod, desc, icon });
  }, [city, state]);

  if (!weather) return <div className="h-10 animate-pulse bg-slate-100 dark:bg-slate-800 rounded-lg" />;

  return (
    <div className="flex items-center gap-3 p-2 rounded-xl bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 border border-slate-200 dark:border-slate-700 shadow-sm">
      <div className="text-2xl drop-shadow-md">{weather.icon}</div>
      <div>
        <p className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
          {type === "origin" ? "Clima na Origem" : "Clima no Destino"}
        </p>
        <p className="text-sm font-extrabold text-slate-800 dark:text-white mt-0.5">
          {weather.temp}°C <span className="font-normal text-slate-500 text-xs ml-1">{weather.desc}</span>
        </p>
      </div>
    </div>
  );
}
