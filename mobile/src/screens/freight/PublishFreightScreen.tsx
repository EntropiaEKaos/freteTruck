import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator, Alert } from "react-native";
import { freightAPI } from "../../services/api";
import { COLORS } from "../../constants/theme";

const UFS = ["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"];

export default function PublishFreightScreen({ navigation }: any) {
  const [form, setForm] = useState({
    cargoType: "", originCity: "", originState: "", destCity: "", destState: "",
    weightKg: "", price: "", priceType: "total", contactPhone: "", description: "",
  });
  const [loading, setLoading] = useState(false);

  function set(k: string, v: string) { setForm((f) => ({ ...f, [k]: v })); }

  async function publish() {
    if (!form.cargoType || !form.originCity || !form.originState || !form.destCity || !form.destState || !form.weightKg || !form.contactPhone) {
      Alert.alert("Campos obrigatórios", "Preencha todos os campos marcados.");
      return;
    }
    setLoading(true);
    try {
      const res = await freightAPI.create({
        ...form,
        weightKg: Math.round(parseFloat(form.weightKg) * 1000),
        vehicleTypes: ["Carreta"],
        bodyTypes: ["Graneleiro"],
      });
      Alert.alert("Frete publicado!", `Frete #${res.data.freight.id} criado com sucesso.`);
      navigation.navigate("Fretes");
    } catch (e: any) {
      Alert.alert("Erro", e.response?.data?.error || "Erro ao publicar.");
    }
    setLoading(false);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Publicar frete</Text>
      <Text style={s.label}>Tipo de carga *</Text>
      <TextInput style={s.input} placeholder="Ex: Soja, Cimento, Carga Geral" placeholderTextColor="#64748b" value={form.cargoType} onChangeText={(v) => set("cargoType", v)} />
      <View style={s.row}>
        <View style={s.half}><Text style={s.label}>Cidade origem *</Text><TextInput style={s.input} placeholder="Ex: Sorriso" placeholderTextColor="#64748b" value={form.originCity} onChangeText={(v) => set("originCity", v)} /></View>
        <View style={s.quarter}><Text style={s.label}>UF *</Text><TextInput style={s.input} placeholder="MT" placeholderTextColor="#64748b" value={form.originState} onChangeText={(v) => set("originState", v.toUpperCase())} maxLength={2} /></View>
      </View>
      <View style={s.row}>
        <View style={s.half}><Text style={s.label}>Cidade destino *</Text><TextInput style={s.input} placeholder="Ex: Santos" placeholderTextColor="#64748b" value={form.destCity} onChangeText={(v) => set("destCity", v)} /></View>
        <View style={s.quarter}><Text style={s.label}>UF *</Text><TextInput style={s.input} placeholder="SP" placeholderTextColor="#64748b" value={form.destState} onChangeText={(v) => set("destState", v.toUpperCase())} maxLength={2} /></View>
      </View>
      <View style={s.row}>
        <View style={s.half}><Text style={s.label}>Peso (ton) *</Text><TextInput style={s.input} placeholder="32" placeholderTextColor="#64748b" value={form.weightKg} onChangeText={(v) => set("weightKg", v)} keyboardType="numeric" /></View>
        <View style={s.half}><Text style={s.label}>Valor (R$)</Text><TextInput style={s.input} placeholder="9500" placeholderTextColor="#64748b" value={form.price} onChangeText={(v) => set("price", v)} keyboardType="numeric" /></View>
      </View>
      <Text style={s.label}>WhatsApp *</Text>
      <TextInput style={s.input} placeholder="(65) 99999-9999" placeholderTextColor="#64748b" value={form.contactPhone} onChangeText={(v) => set("contactPhone", v)} keyboardType="phone-pad" />
      <Text style={s.label}>Observações</Text>
      <TextInput style={[s.input, { height: 80 }]} placeholder="Detalhes adicionais..." placeholderTextColor="#64748b" value={form.description} onChangeText={(v) => set("description", v)} multiline />
      <TouchableOpacity style={s.btn} onPress={publish} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Publicar frete</Text>}
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "900", color: "#fff", marginBottom: 20 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "700", textTransform: "uppercase", marginBottom: 6, marginTop: 4 },
  input: { backgroundColor: COLORS.bgInput, borderRadius: 12, padding: 14, fontSize: 15, color: "#fff", marginBottom: 12, borderWidth: 1, borderColor: COLORS.border },
  row: { flexDirection: "row", gap: 12 },
  half: { flex: 1 },
  quarter: { width: 80 },
  btn: { backgroundColor: COLORS.primary, borderRadius: 14, padding: 18, alignItems: "center", marginTop: 12, marginBottom: 40 },
  btnText: { color: "#fff", fontSize: 17, fontWeight: "800" },
});
