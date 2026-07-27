"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/constants";
import { IcHeart, IcMsg } from "./Icons";

type Comment = {
  comment: { id: number; postId: number; userId: number; parentId: number | null; content: string; likes: number; createdAt: string };
  authorName: string;
  authorRole: string;
  authorVerified: boolean;
  liked: boolean;
};

type Me = { id: number; name: string } | null;

export default function PostComments({ postId, me }: { postId: number; me: Me }) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyText, setReplyText] = useState("");
  const [sending, setSending] = useState(false);

  async function load() {
    const res = await fetch(`/api/community/${postId}/comments`).then((r) => r.json());
    setComments(res.comments || []);
    setLoading(false);
  }

  useEffect(() => { load(); }, [postId]); // eslint-disable-line

  async function submit(content: string, parentId: number | null) {
    if (!content.trim()) return;
    setSending(true);
    const res = await fetch(`/api/community/${postId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, parentId }),
    });
    if (res.ok) {
      setText("");
      setReplyText("");
      setReplyTo(null);
      await load();
    }
    setSending(false);
  }

  async function toggleLike(commentId: number, liked: boolean) {
    setComments((prev) => prev.map((c) => c.comment.id === commentId ? { ...c, liked: !liked, comment: { ...c.comment, likes: c.comment.likes + (liked ? -1 : 1) } } : c));
    await fetch("/api/community/comment-like", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId }),
    });
  }

  async function remove(commentId: number) {
    if (!confirm("Excluir comentário?")) return;
    await fetch(`/api/community/${postId}/comments?commentId=${commentId}`, { method: "DELETE" });
    await load();
  }

  const roots = comments.filter((c) => !c.comment.parentId);
  const repliesOf = (id: number) => comments.filter((c) => c.comment.parentId === id);

  function CommentItem({ c, isReply = false }: { c: Comment; isReply?: boolean }) {
    return (
      <div className={isReply ? "ml-8 mt-2" : "mt-3"}>
        <div className="bg-slate-50 dark:bg-slate-700/40 rounded-xl px-3 py-2">
          <div className="flex items-center gap-1.5 flex-wrap">
            <Link href={`/perfil/${c.comment.userId}`} className="text-xs font-bold text-slate-900 dark:text-white hover:text-orange-600">
              {c.authorName}
            </Link>
            {c.authorVerified && <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20 px-1 rounded">✓</span>}
            <span className="text-[10px] text-slate-400">{timeAgo(c.comment.createdAt)}</span>
          </div>
          <p className="text-sm text-slate-700 dark:text-slate-300 mt-0.5 whitespace-pre-line">{c.comment.content}</p>
          <div className="flex items-center gap-3 mt-1.5">
            <button onClick={() => me && toggleLike(c.comment.id, c.liked)} disabled={!me}
              className={`inline-flex items-center gap-1 text-[11px] font-semibold ${c.liked ? "text-rose-500" : "text-slate-400 hover:text-rose-500"}`}>
              <IcHeart className="w-3 h-3" /> {c.comment.likes > 0 ? c.comment.likes : ""}
            </button>
            {!isReply && me && (
              <button onClick={() => setReplyTo(replyTo === c.comment.id ? null : c.comment.id)} className="text-[11px] font-semibold text-slate-400 hover:text-orange-500">
                Responder
              </button>
            )}
            {me && (me.id === c.comment.userId) && (
              <button onClick={() => remove(c.comment.id)} className="text-[11px] font-semibold text-slate-400 hover:text-red-500">
                Excluir
              </button>
            )}
          </div>
        </div>

        {replyTo === c.comment.id && (
          <div className="ml-4 mt-2 flex gap-2">
            <input value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="Escreva uma resposta..."
              className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-1.5 text-sm"
              onKeyDown={(e) => e.key === "Enter" && submit(replyText, c.comment.id)} />
            <button onClick={() => submit(replyText, c.comment.id)} disabled={sending}
              className="bg-orange-500 text-white text-xs font-bold px-3 rounded-lg disabled:opacity-50">Enviar</button>
          </div>
        )}

        {repliesOf(c.comment.id).map((r) => <CommentItem key={r.comment.id} c={r} isReply />)}
      </div>
    );
  }

  return (
    <div className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-3">
      {me ? (
        <div className="flex gap-2">
          <input value={text} onChange={(e) => setText(e.target.value)} placeholder="Adicione um comentário..."
            className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === "Enter" && submit(text, null)} />
          <button onClick={() => submit(text, null)} disabled={sending || !text.trim()}
            className="bg-orange-500 hover:bg-orange-600 text-white text-sm font-bold px-4 rounded-lg disabled:opacity-50">
            Comentar
          </button>
        </div>
      ) : (
        <p className="text-xs text-slate-400"><Link href="/entrar" className="text-orange-600 font-semibold">Entre</Link> para comentar.</p>
      )}

      {loading ? (
        <p className="text-xs text-slate-400 mt-3">Carregando comentários…</p>
      ) : roots.length === 0 ? (
        <p className="text-xs text-slate-400 mt-3 flex items-center gap-1"><IcMsg className="w-3 h-3" /> Seja o primeiro a comentar.</p>
      ) : (
        <div>{roots.map((c) => <CommentItem key={c.comment.id} c={c} />)}</div>
      )}
    </div>
  );
}
