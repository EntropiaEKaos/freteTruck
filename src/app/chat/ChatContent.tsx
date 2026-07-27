"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { timeAgo } from "@/lib/constants";
import { IcSearch, IcUser, IcCheck, IcArrow } from "@/components/Icons";

type Msg = { message: { id: number; senderId: number; content: string; createdAt: string }; senderName: string };
type Conv = {
  other_id: number;
  other_name: string;
  other_company: string | null;
  other_role: string;
  other_verified: boolean;
  content: string;
  created_at: string;
  unread_count: number;
  last_sender_is_me: boolean;
};
type Me = { id: number; name: string; avatarUrl?: string | null } | null;

export default function ChatContent() {
  const sp = useSearchParams();
  const withParam = sp.get("with");

  const [me, setMe] = useState<Me>(null);
  const [state, setState] = useState<"loading" | "guest" | "ok">("loading");
  const [convs, setConvs] = useState<Conv[]>([]);
  const [search, setSearch] = useState("");
  const [activeChat, setActiveChat] = useState<number | null>(withParam ? parseInt(withParam, 10) : null);
  const [activeName, setActiveName] = useState("");
  const [activeRole, setActiveRole] = useState("");
  const [activeCompany, setActiveCompany] = useState("");
  const [activeVerified, setActiveVerified] = useState(false);
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // ===== Carregar conversas =====
  const loadConvs = useCallback(async (q?: string) => {
    const url = q ? `/api/messages?q=${encodeURIComponent(q)}` : "/api/messages";
    try {
      const res = await fetch(url).then((r) => r.json());
      setConvs(res.conversations || []);
    } catch {}
  }, []);

  // ===== Carregar mensagens de um chat =====
  const loadMsgs = useCallback(async (uid: number) => {
    try {
      const res = await fetch(`/api/messages?with=${uid}`).then((r) => r.json());
      setMsgs(res.messages || []);
      setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
    } catch {}
  }, []);

  // ===== Inicialização =====
  useEffect(() => {
    (async () => {
      try {
        const meRes = await fetch("/api/auth/me").then((r) => r.json());
        if (!meRes.user) { setState("guest"); return; }
        setMe(meRes.user);
        await loadConvs();
        if (withParam) {
          const uid = parseInt(withParam, 10);
          const pRes = await fetch(`/api/profile/${uid}`).then((r) => r.json());
          if (pRes.user) {
            setActiveChat(uid);
            setActiveName(pRes.user.name || "Usuário");
            setActiveRole(pRes.user.role || "usuar");
            setActiveCompany(pRes.user.company || "");
            setActiveVerified(!!pRes.user.verified);
            await loadMsgs(uid);
          }
        }
        setState("ok");
      } catch {
        setState("guest");
      }
    })();
  }, [withParam, loadConvs, loadMsgs]);

  // ===== Polling de conversas e mensagens =====
  useEffect(() => {
    if (state !== "ok") return;
    const convIv = setInterval(() => loadConvs(search), 8000);
    const msgIv = activeChat ? setInterval(() => loadMsgs(activeChat), 4000) : null;
    return () => {
      clearInterval(convIv);
      if (msgIv) clearInterval(msgIv);
    };
  }, [activeChat, state, loadConvs, loadMsgs, search]);

  // ===== Busca em tempo real =====
  useEffect(() => {
    const t = setTimeout(() => loadConvs(search), 400);
    return () => clearTimeout(t);
  }, [search, loadConvs]);

  // ===== Abrir conversa =====
  async function openChat(c: Conv) {
    setActiveChat(c.other_id);
    setActiveName(c.other_name);
    setActiveRole(c.other_role);
    setActiveCompany(c.other_company || "");
    setActiveVerified(c.other_verified);
    await loadMsgs(c.other_id);
    await loadConvs(search);
    setTimeout(() => inputRef.current?.focus(), 100);
  }

  // ===== Enviar mensagem =====
  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activeChat || sending) return;
    setSending(true);
    try {
      // Optimistic update — mostrar imediatamente
      const optimisticMsg: Msg = {
        message: {
          id: Date.now(),
          senderId: me!.id,
          content: text.trim(),
          createdAt: new Date().toISOString(),
        },
        senderName: me!.name,
      };
      setMsgs((prev) => [...prev, optimisticMsg]);
      setText("");

      const res = await fetch("/api/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ receiverId: activeChat, content: text.trim() }),
      });

      if (res.ok) {
        await loadMsgs(activeChat);
      }
    } catch {}
    setSending(false);
    setTimeout(() => inputRef.current?.focus(), 50);
  }

  // ===== Helpers visuais =====
  function roleBadge(role: string) {
    if (role === "admin") return <span className="text-[10px] font-bold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 px-1.5 py-0.5 rounded-full">ADMIN</span>;
    if (role === "motorista") return <span className="text-[10px] font-bold bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 px-1.5 py-0.5 rounded-full">MOTORISTA</span>;
    return <span className="text-[10px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 px-1.5 py-0.5 rounded-full">EMBARCADOR</span>;
  }

  function StatusDot({ online }: { online: boolean }) {
    return <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${online ? "bg-emerald-500" : "bg-slate-400"}`} />;
  }

  // ===== Estados de UI =====
  if (state === "loading") {
    return (
      <div className="max-w-6xl mx-auto px-4 py-24">
        <div className="flex items-center justify-center gap-3">
          <div className="w-8 h-8 border-3 border-orange-500 border-t-transparent rounded-full animate-spin" style={{ borderWidth: 3 }} />
          <p className="text-slate-500 dark:text-slate-400 font-medium">Carregando conversas...</p>
        </div>
      </div>
    );
  }

  if (state === "guest") {
    return (
      <div className="max-w-md mx-auto px-4 py-24">
        <div className="bg-white dark:bg-slate-800 rounded-3xl border border-slate-200 dark:border-slate-700 p-8 text-center shadow-xl">
          <div className="w-16 h-16 rounded-2xl bg-orange-500/10 flex items-center justify-center text-orange-500 text-3xl mx-auto">💬</div>
          <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">Entre para conversar</h1>
          <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">Conecte-se com embarcadores e caminhoneiros em tempo real.</p>
          <Link href="/entrar" className="mt-6 inline-block bg-orange-500 hover:bg-orange-600 text-white font-bold px-8 py-3 rounded-xl transition-colors">
            Fazer login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-3 md:px-4 py-4 md:py-6">
      {/* ===== Header ===== */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl md:text-2xl font-extrabold text-slate-900 dark:text-white flex items-center gap-2">
            💬 Mensagens
            {activeChat && <span className="text-sm font-semibold text-orange-500">/ {activeName}</span>}
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400">Conexão instantânea entre caminhoneiros e embarcadores.</p>
        </div>
        <div className="flex items-center gap-2 text-xs font-bold text-slate-500 dark:text-slate-400">
          <StatusDot online={true} /> Online agora
        </div>
      </div>

      {/* ===== Layout principal ===== */}
      <div className="mt-4 grid grid-cols-12 gap-3 h-[calc(100vh-140px)] min-h-[500px]">

        {/* ===== Coluna Conversas ===== */}
        <div className={`${activeChat ? "hidden lg:flex" : "flex"} lg:col-span-4 xl:col-span-3 flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden`}>
          {/* Search */}
          <div className="p-3 border-b border-slate-100 dark:border-slate-700">
            <div className="relative">
              <IcSearch className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar conversa ou pessoa..."
                className="w-full rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700/50 pl-9 pr-3 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:ring-2 focus:ring-orange-500/40 focus:border-orange-500 outline-none transition-all"
              />
            </div>
          </div>

          {/* Lista */}
          <div className="flex-1 overflow-y-auto">
            {convs.length === 0 ? (
              <div className="p-6 text-center text-slate-400 text-sm">
                <p className="text-4xl mb-2">📭</p>
                <p className="font-medium">Nenhuma conversa ainda</p>
                <p className="mt-1 text-xs">Inicie pelo perfil de um usuário ou página de um frete.</p>
                <div className="mt-4 flex gap-2 justify-center">
                  <Link href="/fretes" className="text-xs font-bold text-orange-500 hover:underline">Buscar fretes</Link>
                  <span className="text-slate-300">·</span>
                  <Link href="/rankings" className="text-xs font-bold text-orange-500 hover:underline">Top usuários</Link>
                </div>
              </div>
            ) : (
              convs.map((c) => (
                <button
                  key={c.other_id}
                  onClick={() => openChat(c)}
                  className={`w-full text-left p-3 border-b border-slate-100 dark:border-slate-700/60 transition-colors group ${
                    activeChat === c.other_id
                      ? "bg-orange-50/80 dark:bg-slate-700/80 border-l-4 border-l-orange-500"
                      : "hover:bg-slate-50 dark:hover:bg-slate-700/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Avatar */}
                    <div className="relative shrink-0">
                      <div className="w-11 h-11 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white font-extrabold text-lg">
                        {c.other_name.charAt(0).toUpperCase()}
                      </div>
                      <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-800" />
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <p className="font-bold text-sm text-slate-900 dark:text-white truncate group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                          {c.other_name}
                          {c.other_verified && <span className="text-emerald-500 text-[10px] ml-1">✓</span>}
                        </p>
                        <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(c.created_at)}</span>
                      </div>
                      <div className="flex items-center justify-between gap-1 mt-0.5">
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
                          {c.last_sender_is_me && <span className="text-emerald-500">✓✓ </span>}
                          {c.content || "Inicie a conversa"}
                        </p>
                        <div className="flex items-center gap-1.5 shrink-0">
                          {c.unread_count > 0 && (
                            <span className="bg-orange-500 text-white text-[10px] font-extrabold w-5 h-5 flex items-center justify-center rounded-full">
                              {c.unread_count > 9 ? "9+" : c.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* ===== Coluna Chat ===== */}
        <div className={`${activeChat ? "flex" : "hidden lg:flex"} lg:col-span-8 xl:col-span-9 flex-col bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden`}>
          {!activeChat ? (
            /* ===== Selecionar conversa ===== */
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-sm">
                <div className="w-20 h-20 rounded-3xl bg-orange-500/10 flex items-center justify-center text-orange-500 text-4xl mx-auto">💬</div>
                <h2 className="mt-4 text-xl font-extrabold text-slate-900 dark:text-white">Suas conversas</h2>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Selecione uma conversa na lista à esquerda ou inicie uma nova pelo perfil de um usuário.
                </p>
                <div className="mt-6 flex gap-3 justify-center">
                  <Link href="/fretes" className="text-sm font-bold text-orange-500 hover:underline">Buscar fretes →</Link>
                  <Link href="/comunidade" className="text-sm font-bold text-orange-500 hover:underline">Explorar comunidade →</Link>
                </div>
              </div>
            </div>
          ) : (
            <>
              {/* ===== Chat Header ===== */}
              <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => { setActiveChat(null); setActiveName(""); }}
                    className="lg:hidden p-1.5 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                  >
                    ←
                  </button>
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-slate-700 to-slate-500 dark:from-slate-600 dark:to-slate-800 flex items-center justify-center text-white font-extrabold text-base">
                    {activeName.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-900 dark:text-white truncate">{activeName}</p>
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <StatusDot online={true} />
                      <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">Online agora</span>
                      {activeRole && roleBadge(activeRole)}
                      {activeCompany && <span className="text-[10px] text-slate-400 truncate">· {activeCompany}</span>}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Link
                    href={`/perfil/${activeChat}`}
                    className="p-2 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    title="Ver perfil"
                  >
                    <IcUser className="w-4 h-4" />
                  </Link>
                </div>
              </div>

              {/* ===== Mensagens ===== */}
              <div className="flex-1 overflow-y-auto p-3 space-y-0.5 bg-slate-50 dark:bg-slate-900/50">
                {msgs.length === 0 ? (
                  <div className="h-full flex items-center justify-center">
                    <div className="text-center text-slate-400">
                      <p className="text-4xl mb-2">👋</p>
                      <p className="font-medium text-slate-600 dark:text-slate-300">Comece a conversa!</p>
                      <p className="text-xs mt-1">Envie uma mensagem para {activeName.split(" ")[0]}</p>
                    </div>
                  </div>
                ) : (
                  msgs.map((m, idx) => {
                    const isMine = m.message.senderId === me!.id;
                    const isLastMine = idx === msgs.length - 1 ||
                      msgs[idx + 1]?.message.senderId !== m.message.senderId;

                        // Agrupamento: só mostrar timestamp se mudar o user ou intervalo > 10min
                    const prev = msgs[idx - 1];
                    const showTime = !prev ||
                      prev.message.senderId !== m.message.senderId ||
                      (new Date(m.message.createdAt).getTime() - new Date(prev.message.createdAt).getTime()) > 10 * 60 * 1000;

                    return (
                      <div key={m.message.id}>
                        {showTime && (
                          <div className="flex justify-center my-3">
                            <span className="text-[10px] font-semibold text-slate-400 bg-slate-200 dark:bg-slate-700 px-3 py-0.5 rounded-full">
                              {new Date(m.message.createdAt).toLocaleDateString("pt-BR", { day: "numeric", month: "long", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          </div>
                        )}
                        <div className={`flex ${isMine ? "justify-end" : "justify-start"} mb-1`}>
                          <div
                            className={`max-w-[78%] md:max-w-[65%] relative group ${
                              isMine ? "order-2" : "order-1"
                            }`}
                          >
                            <div
                              className={`rounded-2xl px-3.5 py-2 shadow-sm ${
                                isMine
                                  ? "bg-gradient-to-br from-orange-500 to-orange-600 text-white rounded-br-md"
                                  : "bg-white dark:bg-slate-700/80 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600/60 rounded-bl-md"
                              }`}
                            >
                              <p className="text-sm leading-relaxed whitespace-pre-line break-words">{m.message.content}</p>
                              
                              {/* Timestamp + Check */}
                              <div className={`flex items-center gap-1 mt-0.5 flex ${isMine ? "justify-end" : "justify-start"}`}>
                                <span className={`text-[10px] font-medium ${isMine ? "text-orange-200/90" : "text-slate-400"}`}>
                                  {new Date(m.message.createdAt).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}
                                </span>
                                {isMine && isLastMine && (
                                  <span className="text-[10px] text-emerald-300 font-bold flex items-center gap-0.5 ml-1">
                                    ✓✓ <span className="text-orange-200/80">Lida</span>
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Ações (hover) */}
                            <div className={`absolute ${isMine ? "-left-20" : "-right-20"} top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1`}>
                              <button
                                onClick={() => setText(prev => prev + `\n${m.message.content}\n`)}
                                className="w-7 h-7 rounded-full bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center text-xs"
                                title="Responder"
                              >
                                ↩
                              </button>
                              {isMine && (
                                <button
                                  onClick={async () => {
                                    const newContent = prompt("Editar mensagem:", m.message.content);
                                    if (newContent && newContent.trim()) {
                                      await fetch("/api/messages", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: m.message.id, content: newContent }) });
                                      await loadMsgs(activeChat);
                                    }
                                  }}
                                  className="w-7 h-7 rounded-full bg-white dark:bg-slate-600 border border-slate-200 dark:border-slate-600 text-slate-400 hover:text-slate-700 dark:hover:text-white flex items-center justify-center text-xs"
                                  title="Editar"
                                >
                                  ✏️
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={endRef} />
              </div>

              {/* ===== Typing indicator ===== */}
              {isTyping && (
                <div className="px-3 py-1 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: "300ms" }} />
                  <span className="text-[10px] text-slate-400 ml-1">Digitando...</span>
                </div>
              )}

              {/* ===== Input ===== */}
              <form onSubmit={send} className="p-3 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/30 shrink-0">
                <div className="flex items-center gap-2">
                  <button type="button" className="p-2.5 rounded-full text-slate-400 hover:text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors shrink-0" title="Enviar imagem (em breve)">
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2" /><circle cx="8.5" cy="8.5" r="1.5" /><path d="m21 15-5-5L5 21" /></svg>
                  </button>
                  <input
                    ref={inputRef}
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); send(e); } }}
                    placeholder={`Mensagem para ${activeName.split(" ")[0]}...`}
                    className="flex-1 rounded-full border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-3 text-sm text-slate-900 dark:text-white placeholder-slate-400 dark:placeholder-slate-500 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
                    autoComplete="off"
                  />
                  <button
                    type="submit"
                    disabled={sending || !text.trim()}
                    className={`p-3 rounded-full transition-all shrink-0 ${
                      text.trim()
                        ? "bg-orange-500 hover:bg-orange-600 text-white shadow-lg shadow-orange-500/25"
                        : "bg-slate-200 dark:bg-slate-700 text-slate-400"
                    }`}
                    title="Enviar"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m22 2-7 20-4-9-9-4Z" /><path d="M22 2 11 13" /></svg>
                  </button>
                </div>
                <p className="text-[10px] text-slate-400 dark:text-slate-500 text-center mt-1">
                  Pressione Enter para enviar · Mensagens são criptografadas ponta a ponta*
                </p>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
