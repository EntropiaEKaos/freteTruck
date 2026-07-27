import React, { useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, StyleSheet, RefreshControl, TextInput } from "react-native";
import { freightAPI } from "../../services/api";
import { formatBRL, formatWeight } from "../../utils/formatters";

type Freight = {
  freight: {
    id: number; originCity: string; originState: string; destCity: string; destState: string;
    cargoType: string; price: string | null; priceType: string; distanceKm: number | null;
    weightKg: number; vehicleTypes: string; views: number; featured: boolean; isAuction: boolean;
    createdAt: string;
  };
  ownerName: string; ownerCompany: string | null; ownerVerified?: boolean;
};

export default function FreightListScreen({ navigation }: any) {
  const [freights, setFreights] = useState<Freight[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");

  async function load() {
    try {
      const params: any = {};
      if (search) params.q = search;
      const res = await freightAPI.list(params);
      setFreights(res.data.freights || []);
    } catch (e) { console.error(e); }
    setLoading(false);
    setRefreshing(false);
  }

  useEffect(() => { load(); }, []);
  useEffect(() => { const t = setTimeout(load, 400); return () => clearTimeout(t); }, [search]);

  function renderItem({ item }: { item: Freight }) {
    const f = item.freight;
    const priceLabel = !f.price ? "A combinar" : f.priceType === "tonelada" ? `${formatBRL(f.price)}/ton` : formatBRL(f.price);
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate("FreightDetail", { id: f.id })}>
        {f.featured && <View style={styles.badge}><Text style={styles.badgeText}>DESTAQUE</Text></View>}
        <View style={styles.route}>
          <Text style={styles.city}>{f.originCity}/{f.originState}</Text>
          <Text style={styles.arrow}>→</Text>
          <Text style={styles.city}>{f.destCity}/{f.destState}</Text>
        </View>
        <Text style={styles.cargo}>{f.cargoType}</Text>
        <View style={styles.tags}>
          <Text style={styles.tag}>⚖️ {formatWeight(f.weightKg)}</Text>
          {f.distanceKm ? <Text style={styles.tag}>📍 {f.distanceKm} km</Text> : null}
        </View>
        <View style={styles.footer}>
          <Text style={styles.price}>{priceLabel}</Text>
          <Text style={styles.owner}>{item.ownerCompany || item.ownerName} {item.ownerVerified ? " ✓" : ""}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Buscar Fretes</Text>
      </View>
      <TextInput style={styles.search} placeholder="Buscar por cidade ou carga..." placeholderTextColor="#64748b" value={search} onChangeText={setSearch} />
      <FlatList
        data={freights}
        keyExtractor={(item) => String(item.freight.id)}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); load(); }} tintColor="#f97316" />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text style={styles.empty}>{loading ? "Carregando..." : "Nenhum frete encontrado."}</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  header: { padding: 20, paddingTop: 60, backgroundColor: "#0f172a" },
  title: { fontSize: 28, fontWeight: "900", color: "#fff" },
  search: { backgroundColor: "#1e293b", borderRadius: 12, padding: 14, margin: 16, marginTop: 0, color: "#fff", fontSize: 16 },
  list: { padding: 16, paddingTop: 0 },
  card: { backgroundColor: "#1e293b", borderRadius: 16, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: "#334155" },
  badge: { position: "absolute", top: 12, right: 12, backgroundColor: "#f97316", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, zIndex: 1 },
  badgeText: { color: "#fff", fontSize: 10, fontWeight: "700" },
  route: { flexDirection: "row", alignItems: "center", gap: 8 },
  city: { fontSize: 16, fontWeight: "700", color: "#fff" },
  arrow: { color: "#f97316", fontSize: 18 },
  cargo: { fontSize: 14, color: "#94a3b8", marginTop: 4 },
  tags: { flexDirection: "row", gap: 8, marginTop: 8 },
  tag: { fontSize: 12, color: "#cbd5e1", backgroundColor: "#0f172a", paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  footer: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: "#334155" },
  price: { fontSize: 18, fontWeight: "800", color: "#10b981" },
  owner: { fontSize: 12, color: "#94a3b8" },
  empty: { color: "#64748b", textAlign: "center", marginTop: 40, fontSize: 16 },
});
