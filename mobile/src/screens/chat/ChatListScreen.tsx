import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl } from "react-native";
import { messageAPI } from "../../services/api";
import { timeAgo } from "../../utils/formatters";
import { COLORS } from "../../constants/theme";

type Conv = { other_id: number; other_name: string; content: string; created_at: string; unread_count: number };

export default function ChatListScreen({ navigation }: any) {
  const [convs, setConvs] = useState<Conv[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  async function load() {
    try { const r = await messageAPI.conversations(); setConvs(r.data.conversations || []); } catch {}
    setLoading(false); setRefreshing(false);
  }

  useEffect(() => { load(); const iv = setInterval(load, 10000); return () => clearInterval(iv); }, []);

  return (
    <View style={s.container}>
      <Text style={s.title}>Conversas</Text>
      <FlatList
        data={convs}
        keyExtractor={(i) => String(i.other_id)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor={COLORS.primary} />}
        renderItem={({ item }) => (
          <TouchableOpacity style={s.conv} onPress={() => navigation.navigate("ChatRoom", { userId: item.other_id, name: item.other_name })}>
            <View style={s.avatar}><Text style={s.avatarText}>{item.other_name.charAt(0)}</Text></View>
            <View style={s.convBody}>
              <Text style={s.convName}>{item.other_name}</Text>
              <Text style={s.convMsg} numberOfLines={1}>{item.content}</Text>
            </View>
            <View style={s.convRight}>
              <Text style={s.convTime}>{timeAgo(item.created_at)}</Text>
              {item.unread_count > 0 && <View style={s.badge}><Text style={s.badgeText}>{item.unread_count}</Text></View>}
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={<Text style={s.empty}>{loading ? "Carregando..." : "Nenhuma conversa ainda."}</Text>}
      />
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  title: { fontSize: 28, fontWeight: "900", color: "#fff", padding: 20, paddingTop: 60 },
  conv: { flexDirection: "row", alignItems: "center", padding: 16, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  avatar: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontWeight: "800", fontSize: 20 },
  convBody: { flex: 1, marginLeft: 12 },
  convName: { color: "#fff", fontWeight: "700", fontSize: 16 },
  convMsg: { color: COLORS.textSecondary, fontSize: 14, marginTop: 2 },
  convRight: { alignItems: "flex-end" },
  convTime: { color: COLORS.textMuted, fontSize: 12 },
  badge: { backgroundColor: COLORS.primary, borderRadius: 10, minWidth: 20, height: 20, justifyContent: "center", alignItems: "center", marginTop: 4, paddingHorizontal: 6 },
  badgeText: { color: "#fff", fontSize: 11, fontWeight: "800" },
  empty: { color: COLORS.textMuted, textAlign: "center", marginTop: 60, fontSize: 16 },
});
