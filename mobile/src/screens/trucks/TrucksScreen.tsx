import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, TextInput, Alert } from "react-native";
import { truckAPI } from "../../services/api";
import { formatBRL } from "../../utils/formatters";
import { COLORS } from "../../constants/theme";

export default function TrucksScreen() {
  const [balance, setBalance] = useState(0);
  const [products, setProducts] = useState<any[]>([]);
  const [couponCode, setCouponCode] = useState("");
  const [loading, setLoading] = useState(true);

  async function load() {
    try {
      const [w, p] = await Promise.all([truckAPI.wallet(), truckAPI.products()]);
      setBalance(w.data.wallet?.balance || 0);
      setProducts(p.data.products || []);
    } catch {}
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function redeemCoupon() {
    if (!couponCode.trim()) return;
    try {
      const res = await fetch("/api/trucks/coupon", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: couponCode }) });
      const data = await res.json();
      if (res.ok) { Alert.alert("Sucesso!", data.message); setCouponCode(""); load(); }
      else Alert.alert("Erro", data.error);
    } catch { Alert.alert("Erro", "Sem conexão."); }
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <Text style={s.title}>Carteira de Trucks</Text>
      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>Saldo disponível</Text>
        <Text style={s.balanceValue}>{balance}</Text>
        <Text style={s.balanceUnit}>Trucks</Text>
      </View>

      <View style={s.couponBox}>
        <Text style={s.couponTitle}>Tem um cupom?</Text>
        <View style={s.couponRow}>
          <TextInput style={s.couponInput} placeholder="BETA50" placeholderTextColor="#64748b" value={couponCode} onChangeText={(v) => setCouponCode(v.toUpperCase())} autoCapitalize="characters" />
          <TouchableOpacity style={s.couponBtn} onPress={redeemCoupon}><Text style={s.couponBtnText}>Resgatar</Text></TouchableOpacity>
        </View>
      </View>

      <Text style={s.sectionTitle}>Comprar Trucks</Text>
      {products.map((p) => (
        <View key={p.id} style={s.productCard}>
          <Text style={s.productName}>{p.name}</Text>
          <Text style={s.productTrucks}>{p.trucks} Trucks</Text>
          <Text style={s.productPrice}>{formatBRL(p.priceCents / 100)}</Text>
          <TouchableOpacity style={s.buyBtn}><Text style={s.buyBtnText}>Comprar</Text></TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "900", color: "#fff", marginBottom: 20 },
  balanceCard: { backgroundColor: COLORS.primary, borderRadius: 20, padding: 24, alignItems: "center" },
  balanceLabel: { color: "rgba(255,255,255,0.7)", fontSize: 12, textTransform: "uppercase", letterSpacing: 2 },
  balanceValue: { color: "#fff", fontSize: 56, fontWeight: "900", marginTop: 4 },
  balanceUnit: { color: "rgba(255,255,255,0.8)", fontSize: 16, fontWeight: "600" },
  couponBox: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1, borderColor: COLORS.border },
  couponTitle: { color: "#fff", fontWeight: "700", marginBottom: 8 },
  couponRow: { flexDirection: "row", gap: 8 },
  couponInput: { flex: 1, backgroundColor: COLORS.bg, borderRadius: 10, padding: 12, color: "#fff", fontWeight: "700", borderWidth: 1, borderColor: COLORS.border, fontFamily: "monospace" },
  couponBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 20, justifyContent: "center" },
  couponBtnText: { color: "#fff", fontWeight: "700" },
  sectionTitle: { color: "#fff", fontSize: 20, fontWeight: "800", marginTop: 28, marginBottom: 12 },
  productCard: { backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 20, marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  productName: { color: "#fff", fontSize: 18, fontWeight: "700" },
  productTrucks: { color: COLORS.primary, fontSize: 32, fontWeight: "900", marginTop: 4 },
  productPrice: { color: "#fff", fontSize: 22, fontWeight: "700", marginTop: 8 },
  buyBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: "center", marginTop: 12 },
  buyBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
