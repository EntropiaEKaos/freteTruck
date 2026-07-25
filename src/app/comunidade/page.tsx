"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { timeAgo } from "@/lib/constants";
import { IcHeart, IcMsg, IcShare } from "@/components/Icons";
import PostComments from "@/components/PostComments";

type Post = {
  post: { id: number; title: string; content: string; category: string; city: string | null; state: string | null; imageUrl: string | null; likes: number; commentCount: number; createdAt: string; authorId: number };
  authorName: string; authorRole: string; authorVerified: boolean;
  likeCount: number; liked: boolean;
};

const CATEGORIES = [
  { key: "", label: "Todos" },
  { key: "dica", label: "Dicas" },
  { key: "alerta", label: "Alertas" },
  { key: "diesel", label: "Diesel" },
  { key: "rodovia", label: "Rodovias" },
  { key: "mercado", label: "Mercado" },
];

const CAT_STYLE: Record<string, string> = {
  alerta: "bg-red-100 text-red-700",
  diesel: "bg-amber-100 text-amber-700",
  dica: "bg-blue-100 text-blue-700",
  rodovia: "bg-purple-100 text-purple-700",
  mercado: "bg-emerald-100 text-emerald-700",
};

export default function ComunidadePage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("recentes");
  const [me, setMe] = useState<{ id: number; name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [newPost, setNewPost] = useState({ title: "", content: "", category: "dica", city: "", state: "" });
  const [imageData, setImageData] = useState<string | null>(null);
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState<number | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function loadPosts() {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    const res = await fetch(`/api/community?${params}`).then((r) => r.json());
    setPosts(res.posts || []);
    setLoading(false);
  }

  useEffect(() => { loadPosts(); }, [category, sort]); // eslint-disable-line
  useEffect(() => { fetch("/api/auth/me").then((r) => r.json()).then((d) => setMe(d.user)); }, []);

  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) { alert("Imagem máx 4MB."); return; }
    const reader = new FileReader();
    reader.onload = () => setImageData(reader.result as string);
    reader.readAsDataURL(file);
  }

  async function submitPost() {
    if (!newPost.title.trim() || !newPost.content.trim()) return;
    setPosting(true);
    const res = await fetch("/api/community", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...newPost, imageData }),
    });
    if (res.ok) {
      setNewPost({ title: "", content: "", category: "dica", city: "", state: "" });
      setImageData(null);
      setShowNew(false);
      await loadPosts();
    }
    setPosting(false);
  }

  async function toggleLike(postId: number, liked: boolean) {
    setPosts((prev) => prev.map((p) => p.post.id === postId ? { ...p, liked: !liked, likeCount: p.likeCount + (liked ? -1 : 1) } : p));
    await fetch("/api/community/like", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ postId }) });
  }

  async function share(p: Post) {
    const url = `${window.location.origin}/comunidade`;
    const text = `${p.post.title} — FreteTruck Comunidade`;
    if (navigator.share) { try { await navigator.share({ title: text, url }); return; } catch {} }
    await navigator.clipboard.writeText(url);
    alert("Link copiado!");
  }

  if (loading) return <div className="max-w-2xl mx-auto px-4 py-24 text-center text-slate-500">Carregando comunidade…</div>;

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={pickImage} />
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white">Comunidade</h1>
          <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Dicas, preços de diesel, alertas de rodovia e mercado.</p>
        </div>
        {me && <button onClick={() => setShowNew(!showNew)} className="bg-orange-500 hover:bg-orange-600 text-white font-bold px-5 py-2.5 rounded-xl text-sm">Novo post</button>}
      </div>

      {/* Filters + sort */}
      <div className="mt-6 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button key={c.key} onClick={() => setCategory(c.key)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${category === c.key ? "bg-slate-900 dark:bg-orange-500 text-white" : "bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 text-slate-600 dark:text-slate-300"}`}>
              {c.label}
            </button>
          ))}
        </div>
        <select value={sort} onChange={(e) => setSort(e.target.value)} className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-800 px-3 py-1.5 text-sm">
          <option value="recentes">Mais recentes</option>
          <option value="populares">Mais populares</option>
        </select>
      </div>

      {/* New post form */}
      {showNew && (
        <div className="mt-6 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-6">
          <h3 className="font-bold text-slate-900 dark:text-white mb-4">Novo post</h3>
          <input value={newPost.title} onChange={(e) => setNewPost((p) => ({ ...p, title: e.target.value }))}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm mb-3" placeholder="Título" />
          <textarea value={newPost.content} onChange={(e) => setNewPost((p) => ({ ...p, content: e.target.value }))} rows={3}
            className="w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2.5 text-sm mb-3" placeholder="Conteúdo..." />
          {imageData && (
            <div className="mb-3 relative">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={imageData} alt="preview" className="rounded-lg max-h-48 w-full object-cover" />
              <button onClick={() => setImageData(null)} className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-1 rounded">Remover</button>
            </div>
          )}
          <div className="flex gap-2 flex-wrap items-center">
            <select value={newPost.category} onChange={(e) => setNewPost((p) => ({ ...p, category: e.target.value }))}
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm">
              {CATEGORIES.filter((c) => c.key).map((c) => <option key={c.key} value={c.key}>{c.label}</option>)}
            </select>
            <input value={newPost.city} onChange={(e) => setNewPost((p) => ({ ...p, city: e.target.value }))} placeholder="Cidade"
              className="rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm w-28" />
            <button onClick={() => fileRef.current?.click()} className="text-sm font-semibold border border-slate-300 dark:border-slate-600 px-3 py-2 rounded-lg text-slate-600 dark:text-slate-300">
              {imageData ? "Trocar foto" : "Adicionar foto"}
            </button>
            <button onClick={submitPost} disabled={posting} className="bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold px-5 py-2 rounded-lg text-sm ml-auto">
              {posting ? "Publicando…" : "Publicar"}
            </button>
          </div>
        </div>
      )}

      {/* Posts */}
      <div className="mt-6 space-y-4">
        {posts.length === 0 ? (
          <div className="text-center py-12 text-slate-400">Nenhum post ainda.</div>
        ) : posts.map((p) => (
          <div key={p.post.id} className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 p-5">
            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${CAT_STYLE[p.post.category] || "bg-slate-100 text-slate-700"}`}>
                {p.post.category.toUpperCase()}
              </span>
              {p.post.city && <span className="text-xs text-slate-500">{p.post.city}{p.post.state ? `/${p.post.state}` : ""}</span>}
              <span className="text-xs text-slate-400">{timeAgo(p.post.createdAt)}</span>
            </div>
            <h3 className="font-bold text-slate-900 dark:text-white">{p.post.title}</h3>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300 whitespace-pre-line">{p.post.content}</p>
            {p.post.imageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={p.post.imageUrl} alt={p.post.title} className="mt-3 rounded-xl max-h-80 w-full object-cover" />
            )}

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Link href={`/perfil/${p.post.authorId}`} className="text-sm font-semibold text-slate-700 dark:text-slate-300 hover:text-orange-600">{p.authorName}</Link>
                {p.authorVerified && <span className="text-[10px] bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded">✓</span>}
              </div>
              <div className="flex items-center gap-1">
                <button onClick={() => me && toggleLike(p.post.id, p.liked)} disabled={!me}
                  className={`inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg transition-colors ${p.liked ? "text-rose-500" : "text-slate-500 hover:text-rose-500"}`}>
                  <IcHeart className="w-4 h-4" /> {p.likeCount}
                </button>
                <button onClick={() => setExpanded(expanded === p.post.id ? null : p.post.id)}
                  className="inline-flex items-center gap-1 text-sm font-semibold px-3 py-1.5 rounded-lg text-slate-500 hover:text-orange-500 transition-colors">
                  <IcMsg className="w-4 h-4" /> {p.post.commentCount}
                </button>
                <button onClick={() => share(p)} className="p-1.5 rounded-lg text-slate-400 hover:text-orange-500"><IcShare className="w-4 h-4" /></button>
              </div>
            </div>

            {expanded === p.post.id && <PostComments postId={p.post.id} me={me} />}
          </div>
        ))}
      </div>
    </div>
  );
}
