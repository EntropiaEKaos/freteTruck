import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { communityAPI } from "../../services/api";
import { timeAgo } from "../../utils/formatters";
import { COLORS } from "../../constants/theme";

type Post = { post: { id: number; title: string; content: string; category: string; likes: number; commentCount: number; createdAt: string }; authorName: string; likeCount: number; liked: boolean };

export default function CommunityScreen() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try { const r = await communityAPI.posts(); setPosts(r.data.posts || []); } catch {}
    setLoading(false); setRefreshing(false);
  }

  useEffect(() => { load(); }, []);

  async function toggleLike(postId: number) {
    setPosts((prev) => prev.map((p) => p.post.id === postId ? { ...p, liked: !p.liked, likeCount: p.likeCount + (p.liked ? -1 : 1) } : p));
    try { await communityAPI.like(postId); } catch {}
  }

  const catStyle: Record<string, any> = {
    alerta: { backgroundColor: "#7f1d1d", color: "#fca5a5" },
    diesel: { backgroundColor: "#78350f", color: "#fbbf24" },
    dica: { backgroundColor: "#1e3a5f", color: "#60a5fa" },
    rodovia: { backgroundColor: "#3b0764", color: "#c084fc" },
    mercado: { backgroundColor: "#064e3b", color: "#6ee7b7" },
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Comunidade</Text>
      <FlatList
        data={posts}
        keyExtractor={(i) => String(i.post.id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
        contentContainerStyle={s.list}
        renderItem={({ item: p }) => (
          <View style={s.card}>
            <View style={s.cardHeader}>
              <Text style={[s.catBadge, catStyle[p.post.category]]}>{p.post.category.toUpperCase()}</Text>
              <Text style={s.time}>{timeAgo(p.post.createdAt)}</Text>
            </View>
            <Text style={s.postTitle}>{p.post.title}</Text>
            <Text style={s.postContent} numberOfLines={4}>{p.post.content}</Text>
            <View style={s.cardFooter}>
              <Text style={s.author}>{p.authorName}</Text>
              <View style={s.actions}>
                <TouchableOpacity onPress={() => toggleLike(p.post.id)} style={s.actionBtn}>
                  <Text style={[s.actionText, p.liked && { color: "#f43f5e" }]}>{p.liked ? "♥" : "♡"} {p.likeCount}</Text>
                </TouchableOpacity>
                <Text style={s.actionText}>💬 {p.post.commentCount}</Text>
              </View>
            </View>
          </View>
        )}
        ListEmptyComponent={<Text style={s.empty}>{loading ? "Carregando..." : "Nenhum post ainda."}</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontSize: 28, fontWeight: "900", color: "#fff", padding: 20, paddingTop: 60 },
  list: { padding: 16, paddingTop: 0 },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  catBadge: { fontSize: 11, fontWeight: "700", paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, overflow: "hidden" },
  time: { color: COLORS.textMuted, fontSize: 12 },
  postTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  postContent: { color: COLORS.textSecondary, fontSize: 14, marginTop: 6, lineHeight: 20 },
  cardFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#1e293b" },
  author: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },
  actions: { flexDirection: "row", gap: 16 },
  actionBtn: {},
  actionText: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" },
  empty: { color: COLORS.textMuted, textAlign: "center", marginTop: 60, fontSize: 16 },
});
