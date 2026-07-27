"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBRL, timeAgo } from "@/lib/constants";

type Me = { id: number; name: string; role: string } | null;
type ProposalData = { id: number; amount: string | null; message: string | null; status: string } | null;
type ReviewRow = {
  review: { id: number; rating: number; comment: string | null; createdAt: string };
  authorName: string;
};

function Stars({ value, onChange, size = "text-xl" }: { value: number; onChange?: (v: number) => void; size?: string }) {
  return (
    <div className={`flex gap-0.5 ${size}`}>
      {[1, 2, 3, 4, 5].map((s) => (
        <button
          key={s}
          type="button"
          disabled={!onChange}
          onClick={() => onChange?.(s)}
          className={`${s <= value ? "text-amber-400" : "text-slate-300"} ${onChange ? "hover:scale-110 transition-transform cursor-pointer" : "cursor-default"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function FreightActions({
  freightId,
  ownerId,
  ownerName,
  freightStatus,
}: {
  freightId: number;
  ownerId: number;
  ownerName: string;
  freightStatus: string;
}) {
  const [me, setMe] = useState<Me>(null);
  const [loaded, setLoaded] = useState(false);
  const [favorited, setFavorited] = useState(false);
  const [myProposal, setMyProposal] = useState<ProposalData>(null);

  // proposal form
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  // reviews
  const [reviewsData, setReviewsData] = useState<{ reviews: ReviewRow[]; avgRating: number | null; total: number }>({
    reviews: [],
    avgRating: null,
    total: 0,
  });
  const [myRating, setMyRating] = useState(0);
  const [myPunctuality, setMyPunctuality] = useState(0);
  const [myCommunication, setMyCommunication] = useState(0);
  const [myPaymentSpeed, setMyPaymentSpeed] = useState(0);
  const [myComment, setMyComment] = useState("");
  const [reviewSent, setReviewSent] = useState(false);

  useEffect(() => {
    async function init() {
      const meRes = await fetch("/api/auth/me").then((r) => r.json());
      setMe(meRes.user);

      const revRes = await fetch(`/api/reviews?userId=${ownerId}`).then((r) => r.json());
      setReviewsData(revRes);

      if (meRes.user) {
        const [favRes, propRes] = await Promise.all([
          fetch("/api/favorites?ids=1").then((r) => r.json()),
          fetch(`/api/proposals?freightId=${freightId}`).then((r) => r.json()),
        ]);
        setFavorited((favRes.ids || []).includes(freightId));
        setMyProposal(propRes.proposal);
      }
      setLoaded(true);
    }
    init();
  }, [freightId, ownerId]);

  async function toggleFavorite() {
    if (!me) return;
    const res = await fetch("/api/favorites", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ freightId }),
    });
    const data = await res.json();
    if (res.ok) setFavorited(data.favorited);
  }

  async function sendProposal(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSending(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ freightId, amount: amount || null, message }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao enviar proposta.");
        return;
      }
      setMyProposal(data.proposal);
      setShowForm(false);
    } finally {
      setSending(false);
    }
  }

  async function sendReview(e: React.FormEvent) {
    e.preventDefault();
    if (myRating < 1) return;
    const res = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ratedUserId: ownerId,
        rating: myRating,
        comment: myComment,
        punctuality: myPunctuality || null,
        communication: myCommunication || null,
        paymentSpeed: myPaymentSpeed || null,
      }),
    });
    if (res.ok) {
      setReviewSent(true);
      const revRes = await fetch(`/api/reviews?userId=${ownerId}`).then((r) => r.json());
      setReviewsData(revRes);
    }
  }

  const isOwner = me?.id === ownerId;

  return (
    <div className="space-y-6">
      {/* Favorite + proposal */}
      {loaded && (
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="font-bold text-slate-900">Ações rápidas</h2>
            {me && !isOwner && (
              <button
                onClick={toggleFavorite}
                className={`text-sm font-semibold px-4 py-2 rounded-lg border transition-colors ${
                  favorited
                    ? "bg-rose-50 border-rose-300 text-rose-600"
                    : "border-slate-300 text-slate-600 hover:border-rose-300 hover:text-rose-500"
                }`}
              >
                {favorited ? "❤️ Salvo" : "🤍 Salvar frete"}
              </button>
            )}
          </div>

          {!me ? (
            <p className="mt-3 text-sm text-slate-500">
              <Link href="/entrar" className="text-orange-600 font-semibold hover:underline">Entre na sua conta</Link>{" "}
              para enviar uma proposta online e salvar este frete.
            </p>
          ) : isOwner ? (
            <p className="mt-3 text-sm text-slate-500">
              Este frete é seu. Gerencie propostas recebidas no{" "}
              <Link href="/painel" className="text-orange-600 font-semibold hover:underline">seu painel</Link>.
            </p>
          ) : myProposal ? (
            <div className="mt-3 rounded-lg border border-slate-200 bg-slate-50 p-4">
              <p className="text-sm font-semibold text-slate-900">
                📨 Sua proposta:{" "}
                {myProposal.amount ? formatBRL(myProposal.amount) : "sem valor definido"}
              </p>
              {myProposal.message && <p className="mt-1 text-sm text-slate-600">&ldquo;{myProposal.message}&rdquo;</p>}
              <p className="mt-2 text-xs font-bold">
                {myProposal.status === "pendente" && <span className="text-amber-600">⏳ Aguardando resposta do embarcador</span>}
                {myProposal.status === "aceita" && <span className="text-emerald-600">✅ Proposta aceita! Entre em contato pelo WhatsApp.</span>}
                {myProposal.status === "recusada" && <span className="text-red-500">❌ Proposta recusada</span>}
              </p>
            </div>
          ) : freightStatus !== "ativo" ? (
            <p className="mt-3 text-sm text-slate-400">Frete fechado — não aceita mais propostas.</p>
          ) : showForm ? (
            <form onSubmit={sendProposal} className="mt-3 space-y-3">
              {error && <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg px-3 py-2 text-sm">{error}</div>}
              <div>
                <label className="text-sm font-semibold text-slate-700">Seu valor (R$) — opcional</label>
                <input
                  type="number"
                  min="1"
                  step="0.01"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Ex: 9000"
                />
              </div>
              <div>
                <label className="text-sm font-semibold text-slate-700">Mensagem</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  placeholder="Ex: Tenho carreta graneleira com rastreador, posso carregar amanhã."
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={sending}
                  className="flex-1 bg-orange-500 hover:bg-orange-600 disabled:opacity-60 text-white font-bold py-2.5 rounded-lg text-sm"
                >
                  {sending ? "Enviando..." : "Enviar proposta"}
                </button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2.5 rounded-lg border border-slate-300 text-sm text-slate-600">
                  Cancelar
                </button>
              </div>
            </form>
          ) : (
            <button
              onClick={() => setShowForm(true)}
              className="mt-3 w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-colors"
            >
              📨 Enviar proposta online
            </button>
          )}
        </div>
      )}

      {/* Reviews */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between flex-wrap gap-2">
          <h2 className="font-bold text-slate-900">Reputação de {ownerName.split(" ")[0]}</h2>
          {reviewsData.avgRating !== null ? (
            <div className="flex items-center gap-2">
              <Stars value={Math.round(reviewsData.avgRating)} />
              <span className="text-sm font-bold text-slate-900">{reviewsData.avgRating.toFixed(1)}</span>
              <span className="text-xs text-slate-400">({reviewsData.total})</span>
            </div>
          ) : (
            <span className="text-sm text-slate-400">Sem avaliações ainda</span>
          )}
        </div>

        {reviewsData.reviews.length > 0 && (
          <div className="mt-4 space-y-3 max-h-64 overflow-y-auto">
            {reviewsData.reviews.map((r) => (
              <div key={r.review.id} className="border-b border-slate-100 pb-3 last:border-0">
                <div className="flex items-center gap-2">
                  <Stars value={r.review.rating} size="text-sm" />
                  <span className="text-sm font-semibold text-slate-800">{r.authorName}</span>
                  <span className="text-xs text-slate-400">{timeAgo(r.review.createdAt)}</span>
                </div>
                {r.review.comment && <p className="mt-1 text-sm text-slate-600">{r.review.comment}</p>}
              </div>
            ))}
          </div>
        )}

        {me && !isOwner && !reviewSent && (
          <form onSubmit={sendReview} className="mt-4 border-t border-slate-100 dark:border-slate-700 pt-4">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Já trabalhou com {ownerName.split(" ")[0]}? Avalie:</p>
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400 w-28">Geral *</span>
                <Stars value={myRating} onChange={setMyRating} size="text-xl" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400 w-28">⏱ Pontualidade</span>
                <Stars value={myPunctuality} onChange={setMyPunctuality} size="text-lg" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400 w-28">💬 Comunicação</span>
                <Stars value={myCommunication} onChange={setMyCommunication} size="text-lg" />
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-slate-600 dark:text-slate-400 w-28">💰 Pagamento</span>
                <Stars value={myPaymentSpeed} onChange={setMyPaymentSpeed} size="text-lg" />
              </div>
            </div>
            <textarea
              value={myComment}
              onChange={(e) => setMyComment(e.target.value)}
              rows={2}
              className="mt-3 w-full rounded-lg border border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 px-3 py-2 text-sm text-slate-900 dark:text-white"
              placeholder="Comentário (opcional)"
            />
            <button
              type="submit"
              disabled={myRating < 1}
              className="mt-2 bg-slate-900 hover:bg-slate-800 dark:bg-orange-500 dark:hover:bg-orange-600 disabled:opacity-40 text-white font-semibold text-sm px-5 py-2 rounded-lg"
            >
              Enviar avaliação
            </button>
          </form>
        )}
        {reviewSent && <p className="mt-3 text-sm font-semibold text-emerald-600">✅ Avaliação enviada. Obrigado!</p>}
      </div>
    </div>
  );
}
