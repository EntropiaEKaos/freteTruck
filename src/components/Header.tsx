"use client";

import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { timeAgo } from "@/lib/constants";
import { IcTruck, IcSearch, IcPlus, IcMap, IcChart, IcCalc, IcBell, IcMsg, IcGrid, IcUser, IcDoc, IcWallet, IcGift, IcShield, IcBrain, IcTrophy, IcUsers, IcBuilding, IcSun, IcMoon, IcLogout, IcMenu, IcHome } from "./Icons";

type Me = { id: number; name: string; role: string } | null;
type Notif = { id: number; title: string; body: string | null; link: string | null; read: boolean; createdAt: string };

function NL({ href, icon, label, path, onClick }: { href: string; icon: React.ReactNode; label: string; path: string; onClick?: () => void }) {
  return (
    <Link href={href} onClick={onClick} title={label}
      className={`flex items-center gap-1.5 px-2.5 py-2 rounded-lg text-sm font-medium transition-colors ${path === href ? "text-orange-400" : "text-slate-300 hover:text-white"}`}>
      {icon}<span className="hidden 2xl:inline">{label}</span>
    </Link>
  );
}

export default function Header() {
  const [me, setMe] = useState<Me>(null);
  const [loaded, setLoaded] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifs, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const nRef = useRef<HTMLDivElement>(null);
  const p = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined") return;
    const s = localStorage.getItem("ft_dark");
    if (s === "1" || (!s && matchMedia("(prefers-color-scheme: dark)").matches)) {
      document.documentElement.classList.add("dark"); setDark(true);
    }
  }, []);

  const toggleDark = useCallback(() => {
    const n = !dark; setDark(n);
    document.documentElement.classList.toggle("dark", n);
    localStorage.setItem("ft_dark", n ? "1" : "0");
  }, [dark]);

  useEffect(() => {
    fetch("/api/auth/me").then(r => r.json()).then(d => {
      setMe(d.user); setLoaded(true);
      if (d.user) fetch("/api/notifications?count=1").then(r => r.json()).then(n => setUnread(n.count || 0));
    }).catch(() => { setMe(null); setLoaded(true); });
  }, [p]);

  useEffect(() => { if (!me) return; const iv = setInterval(() => fetch("/api/notifications?count=1").then(r => r.json()).then(n => setUnread(n.count || 0)), 15000); return () => clearInterval(iv); }, [me]);
  useEffect(() => { const h = (e: MouseEvent) => { if (nRef.current && !nRef.current.contains(e.target as Node)) setNotifOpen(false); }; document.addEventListener("mousedown", h); return () => document.removeEventListener("mousedown", h); }, []);

  // Admin shortcut: Ctrl+Shift+A
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.shiftKey && e.key === "A") {
        e.preventDefault();
        router.push("/admin");
      }
    };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [router]);

  async function openNotifs() {
    if (notifOpen) { setNotifOpen(false); return; }
    const d = await fetch("/api/notifications").then(r => r.json());
    setNotifs(d.notifications || []); setNotifOpen(true);
  }
  async function markAllRead() {
    await fetch("/api/notifications", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ readAll: true }) });
    setUnread(0); setNotifs(pv => pv.map(n => ({ ...n, read: true })));
  }
  async function logout() { await fetch("/api/auth/logout", { method: "POST" }); setMe(null); router.push("/"); router.refresh(); }

  const close = () => setMenuOpen(false);

  return (
    <header className="sticky top-0 z-50 bg-slate-900 border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <IcTruck className="w-7 h-7 text-orange-500" />
          <span className="text-lg font-bold tracking-tight"><span className="text-white">Frete</span><span className="text-orange-500">Truck</span></span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden xl:flex items-center">
          <NL href="/" icon={<IcHome className="w-4 h-4" />} label="Início" path={p} />
          <NL href="/fretes" icon={<IcSearch className="w-4 h-4" />} label="Fretes" path={p} />
          <NL href="/publicar" icon={<IcPlus className="w-4 h-4" />} label="Publicar" path={p} />
          <NL href="/mapa" icon={<IcMap className="w-4 h-4" />} label="Mapa" path={p} />
          <NL href="/precos" icon={<IcChart className="w-4 h-4" />} label="Preços" path={p} />
          <NL href="/ia" icon={<IcBrain className="w-4 h-4" />} label="IA" path={p} />
          <NL href="/antt" icon={<IcShield className="w-4 h-4" />} label="ANTT" path={p} />
          {me && <NL href="/fiscal" icon={<IcDoc className="w-4 h-4" />} label="Fiscal" path={p} />}
          <NL href="/calculadora" icon={<IcCalc className="w-4 h-4" />} label="Calculadora" path={p} />
          <NL href="/comunidade" icon={<IcUsers className="w-4 h-4" />} label="Comunidade" path={p} />
          <NL href="/rankings" icon={<IcTrophy className="w-4 h-4" />} label="Rankings" path={p} />
          <NL href="/checklist" icon={<IcDoc className="w-4 h-4" />} label="Checklist" path={p} />
          {me && <NL href="/chat" icon={<IcMsg className="w-4 h-4" />} label="Chat" path={p} />}
          {me && <NL href="/painel" icon={<IcGrid className="w-4 h-4" />} label="Painel" path={p} />}
          {me && <NL href="/analytics" icon={<IcChart className="w-4 h-4" />} label="Analytics" path={p} />}
          {me && <NL href="/trucks" icon={<IcTruck className="w-4 h-4" />} label="Trucks" path={p} />}
          {me?.role === "admin" && <NL href="/admin/monetizacao" icon={<IcShield className="w-4 h-4" />} label="Monetização" path={p} />}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-1">
          <button onClick={toggleDark} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Alternar tema">
            {dark ? <IcSun className="w-4 h-4" /> : <IcMoon className="w-4 h-4" />}
          </button>

          {me && (
            <div ref={nRef} className="relative">
              <button onClick={openNotifs} className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Notificações">
                <IcBell className="w-4 h-4" />
                {unread > 0 && <span className="absolute top-0.5 right-0.5 bg-red-500 text-white text-[9px] font-bold min-w-[16px] h-[16px] flex items-center justify-center rounded-full leading-none px-0.5">{unread > 99 ? "99+" : unread}</span>}
              </button>
              {notifOpen && (
                <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 shadow-2xl z-50 max-h-96 overflow-hidden flex flex-col">
                  <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                    <p className="font-semibold text-sm text-slate-900 dark:text-white">Notificações</p>
                    {unread > 0 && <button onClick={markAllRead} className="text-xs text-orange-600 font-medium hover:underline">Marcar como lido</button>}
                  </div>
                  <div className="overflow-y-auto flex-1">
                    {notifs.length === 0 ? <div className="p-8 text-center text-sm text-slate-400">Sem notificações.</div> :
                      notifs.map(n => (
                        <Link key={n.id} href={n.link || "#"} onClick={() => setNotifOpen(false)}
                          className={`block px-4 py-3 border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors${!n.read ? " bg-orange-50/50 dark:bg-orange-900/10" : ""}`}>
                          <p className="text-sm font-medium text-slate-900 dark:text-white flex items-center gap-1.5">
                            {!n.read && <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shrink-0" />}{n.title}
                          </p>
                          {n.body && <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-0.5">{n.body}</p>}
                          <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                        </Link>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Desktop auth */}
          <div className="hidden md:flex items-center gap-1.5 ml-1">
            {!loaded ? null : me ? (
              <>
                <Link href={`/perfil/${me.id}`} className="text-sm text-slate-300 hover:text-white px-2 transition-colors">
                  <span className="font-medium text-white">{me.name.split(" ")[0]}</span>
                </Link>
                <button onClick={logout} className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors" title="Sair">
                  <IcLogout className="w-4 h-4" />
                </button>
              </>
            ) : (
              <>
                <Link href="/entrar" className="text-sm px-3 py-1.5 rounded-lg text-slate-300 hover:text-white transition-colors font-medium">Entrar</Link>
                <Link href="/cadastro" className="text-sm px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold transition-colors">Cadastre-se</Link>
              </>
            )}
          </div>

          {/* Mobile menu button */}
          <button className="xl:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 transition-colors" onClick={() => setMenuOpen(o => !o)}>
            <IcMenu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="xl:hidden border-t border-slate-800 bg-slate-900 max-h-[75vh] overflow-y-auto">
          <div className="px-4 py-3 space-y-0.5">
            {[
              ["/", "Início"], ["/fretes", "Buscar Fretes"], ["/publicar", "Publicar Frete"],
              ["/mapa", "Mapa"], ["/precos", "Preços"], ["/ia", "IA de Preço"],
              ["/antt", "Piso ANTT"], ["/fiscal", "CT-e / MDF-e"], ["/calculadora", "Calculadora"], ["/comunidade", "Comunidade"], ["/rankings", "Rankings"],
              ["/seguro", "Seguros"], ["/frota", "Gestão de Frota"],
            ].map(([h, l]) => (
              <Link key={h} href={h} onClick={close} className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${p === h ? "text-orange-400 bg-slate-800" : "text-slate-300 hover:text-white hover:bg-slate-800/50"}`}>{l}</Link>
            ))}
            {me && <>
              <div className="border-t border-slate-800 my-2" />
              {[["/chat", "Chat"], ["/painel", "Meu Painel"], ["/analytics", "Analytics"],
                ["/documentos", "Documentos"], ["/trucks", "Trucks"], ["/fiscal", "CT-e / MDF-e"], ["/convite", "Convites"],
                ...(me.role === "admin" ? [["/admin/monetizacao", "Monetização"] as [string, string]] : []),
                [`/perfil/${me.id}`, "Meu Perfil"],
              ].map(([h, l]) => (
                <Link key={h} href={h} onClick={close} className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors ${p === h ? "text-orange-400 bg-slate-800" : "text-slate-300 hover:text-white hover:bg-slate-800/50"}`}>{l}</Link>
              ))}
              <button onClick={() => { logout(); close(); }} className="block w-full text-left px-3 py-2 rounded-lg text-sm font-medium text-slate-400 hover:text-white">Sair</button>
            </>}
            {!me && <>
              <div className="border-t border-slate-800 my-2" />
              <Link href="/entrar" onClick={close} className="block px-3 py-2 text-sm font-medium text-slate-300">Entrar</Link>
              <Link href="/cadastro" onClick={close} className="block px-3 py-2 text-sm font-medium text-orange-400">Cadastre-se grátis</Link>
            </>}
            <div className="border-t border-slate-800 my-2" />
            <Link href="/ajuda" onClick={close} className="block px-3 py-2 text-xs text-slate-500">Ajuda</Link>
            <Link href="/sobre" onClick={close} className="block px-3 py-2 text-xs text-slate-500">Sobre o FreteTruck</Link>
          </div>
        </div>
      )}
    </header>
  );
}
