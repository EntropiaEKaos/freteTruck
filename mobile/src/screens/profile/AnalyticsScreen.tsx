import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, StyleSheet } from "react-native";
import { statsAPI } from "../../services/api";
import { COLORS } from "../../constants/theme";

export default function AnalyticsScreen() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    statsAPI.analytics().then((r) => setData(r.data)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  if (loading) return <View style={s.center}><Text style={s.loading}>Carregando analytics...</Text></View>;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Analytics</Text>
      <View style={s.statsRow}>
        {[
          { label: "Fretes totais", value: data?.totalFreights || 0, color: "#f97316" },
          { label: "Propostas", value: data?.proposalStats?.total || 0, color: "#3b82f6" },
          { label: "Aceitas", value: data?.proposalStats?.accepted || 0, color: "#10b981" },
        ].map((s2) => (
          <View key={s2.label} style={[s.statCard, { borderLeftColor: s2.color }]}>
            <Text style={[s.statValue, { color: s2.color }]}>{s2.value}</Text>
            <Text style={s.statLabel}>{s2.label}</Text>
          </View>
        ))}
      </View>
      <View style={s.card}>
        <Text style={s.cardTitle}>Rotas mais lucrativas</Text>
        {(data?.topRoutes || []).slice(0, 5).map((r: any, i: number) => (
          <View key={i} style={s.routeRow}>
            <Text style={s.routeName}>{r.route}</Text>
            <Text style={s.routeFreq}>{r.freq}x</Text>
          </View>
        ))}
        {(!data?.topRoutes || data.topRoutes.length === 0) && <Text style={s.empty}>Sem dados de rotas ainda.</Text>}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, paddingTop: 60 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },
  loading: { color: COLORS.textSecondary },
  title: { fontSize: 28, fontWeight: "900", color: "#fff", marginBottom: 20 },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 16, borderLeftWidth: 4, borderWidth: 1, borderColor: COLORS.border },
  statValue: { fontSize: 28, fontWeight: "900" },
  statLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "700", textTransform: "uppercase", marginTop: 4 },
  card: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 12 },
  routeRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  routeName: { color: "#fff", fontSize: 15, fontWeight: "600" },
  routeFreq: { color: COLORS.primary, fontSize: 15, fontWeight: "700" },
  empty: { color: COLORS.textMuted, textAlign: "center", paddingVertical: 20 },
});
