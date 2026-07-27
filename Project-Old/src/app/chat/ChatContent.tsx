"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { timeAgo } from "@/lib/constants";

type Msg = { message: { id: number; senderId: number; content: string; createdAt: string; freightId: number | null }; senderName: string };
type Conv = { other_id: number; other_name: string; other_company: string | null; other_role: string; content: string; created_at: string; unread_count: number };
type Me = { id: number; name: string } | null;

export default function ChatContent() {
  const sp = useSearchParams();
  const withParam = sp.get("with");

  const [me, setMe] = useState<Me>(null);
  const [state, setState] = useState<"loading" | "guest" | "ok">("loading");
  const [convs, setConvs] = useState<Conv[]>([]);
  const [activeChat, setActiveChat] = useState<number | null>(withParam ? parseInt(withParam, 10) : null);
  const [activeName, setActiveName] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  const loadConvs = useCallback(async () => {
    const res = await fetch("/api/messages").then((r) => r.json());
    setConvs(res.conversations || []);
  }, []);

  const loadMsgs = useCallback(async (uid: number) => {
    const res = await fetch(`/api/messages?with=${uid}`).then((r) => r.json());
    setMsgs(res.messages || []);
    setTimeout(() => endRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
  }, []);

  useEffect(() => {
    (async () => {
      const meRes = await fetch("/api/auth/me").then((r) => r.json());
      if (!meRes.user) { setState("guest"); return; }
      setMe(meRes.user);
      await loadConvs();
      if (withParam) {
        const uid = parseInt(withParam, 10);
        setActiveChat(uid);
        // get the name
        const pRes = await fetch(`/api/profile/${uid}`).then((r) => r.json());
        setActiveName(pRes.user?.name || "Usuário");
        await loadMsgs(uid);
      }
      setState("ok");
    })();
  }, [withParam, loadConvs, loadMsgs]);

  useEffect(() => {
    if (!activeChat || state !== "ok") return;
    const iv = setInterval(() => { loadMsgs(activeChat); loadConvs(); }, 5000);
    return () => clearInterval(iv);
  }, [activeChat, state, loadMsgs, loadConvs]);

  async function openChat(c: Conv) {
    setActiveChat(c.other_id);
    setActiveName(c.other_name);
    await loadMsgs(c.other_id);
    await loadConvs();
  }

  async function send(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !activeChat) return;
    setSending(true);
    await fetch("/api/messages", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ receiverId: activeChat, content: text.trim() }),
    });
    setText("");
    await loadMsgs(activeChat);
    setSending(false);
  }

  if (state === "loading") return <div className="max-w-4xl mx-auto px-4 py-24 text-center text-slate-500 dark:text-slate-400">Carregando...</div>;
  if (state === "guest") {
    return (
      <div className="max-w-md mx-auto px-4 py-24 text-center">
        <p className="text-5xl">💬</p>
        <h1 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">Entre para acessar o chat</h1>
        <Link href="/entrar" className="mt-6 inline-block px-6 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-semibold">Entrar</Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">💬 Chat</h1>
      <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Converse com embarcadores e motoristas direto pela plataforma.</p>

      <div className="mt-4 grid grid-cols-1 lg:grid-cols-[320px_1fr] gap-4 h-[600px]">
        {/* Conversations list */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 overflow-y-auto">
          {convs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-sm">
              <p className="text-4xl mb-3">📭</p>
              Nenhuma conversa ainda.<br />
              Inicie pelo perfil de um usuário ou página do frete.
            </div>
          ) : (
            convs.map((c) => (
              <button
                key={c.other_id}
                onClick={() => openChat(c)}
                className={`w-full text-left p-4 border-b border-slate-100 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors ${
                  activeChat === c.other_id ? "bg-orange-50 dark:bg-slate-700 border-l-4 border-l-orange-500" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <p className="font-bold text-sm text-slate-900 dark:text-white truncate">
                    {c.other_role === "motorista" ? "🚛" : "🏭"} {c.other_name}
                  </p>
                  {c.unread_count > 0 && (
                    <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{c.unread_count}</span>
                  )}
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate mt-1">{c.content}</p>
                <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{timeAgo(c.created_at)}</p>
              </button>
            ))
          )}
        </div>

        {/* Chat area */}
        <div className="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 flex flex-col">
          {!activeChat ? (
            <div className="flex-1 flex items-center justify-center text-slate-400 text-sm">
              <div className="text-center">
                <p className="text-5xl mb-3">💬</p>
                Selecione uma conversa ou inicie pelo perfil de um usuário.
              </div>
            </div>
          ) : (
            <>
              <div className="px-5 py-3 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
                <div>
                  <p className="font-bold text-slate-900 dark:text-white">{activeName}</p>
                  <Link href={`/perfil/${activeChat}`} className="text-xs text-orange-600 hover:underline">Ver perfil</Link>
                </div>
              </div>
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50 dark:bg-slate-900/50">
                {msgs.map((m) => {
                  const isMine = m.message.senderId === me!.id;
                  return (
                    <div key={m.message.id} className={`flex ${isMine ? "justify-end" : "justify-start"}`}>
                      <div
                        className={`max-w-[75%] rounded-2xl px-4 py-2.5 ${
                          isMine
                            ? "bg-orange-500 text-white rounded-br-md"
                            : "bg-white dark:bg-slate-700 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-600 rounded-bl-md"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-line">{m.message.content}</p>
                        <p className={`text-xs mt-1 ${isMine ? "text-orange-100" : "text-slate-400"}`}>{timeAgo(m.message.createdAt)}</p>
                      </div>
                    </div>
                  );
                })}
                <div ref={endRef} />
              </div>
              <form onSubmit={send} className="p-3 border-t border-slate-200 dark:border-slate-700 flex gap-2">
                <input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Digite sua mensagem..."
                  className="flex-1 rounded-xl border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-4 py-2.5 text-sm text-slate-900 dark:text-white"
                />
                <button
                  type="submit"
                  disabled={sending || !text.trim()}
                  className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  Enviar
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
