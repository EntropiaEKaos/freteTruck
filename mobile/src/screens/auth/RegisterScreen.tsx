import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, ActivityIndicator } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { COLORS } from "../../constants/theme";

export default function RegisterScreen({ navigation }: any) {
  const { register } = useAuth();
  const [role, setRole] = useState<"motorista" | "embarcador">("motorista");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleRegister() {
    setError("");
    if (!form.name || !form.email || !form.password || !form.phone) { setError("Preencha todos os campos."); return; }
    setLoading(true);
    try {
      await register({ ...form, role, acceptTerms: true });
    } catch (e: any) {
      setError(e.response?.data?.error || "Erro ao criar conta.");
    }
    setLoading(false);
  }

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
      <Text style={s.title}>Criar conta grátis</Text>
      <View style={s.roleRow}>
        {(["motorista", "embarcador"] as const).map((r) => (
          <TouchableOpacity key={r} style={[s.roleBtn, role === r && s.roleBtnActive]} onPress={() => setRole(r)}>
            <Text style={[s.roleText, role === r && s.roleTextActive]}>{r === "motorista" ? "Motorista" : "Embarcador"}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {error ? <Text style={s.error}>{error}</Text> : null}
      <TextInput style={s.input} placeholder="Nome completo" placeholderTextColor="#64748b" value={form.name} onChangeText={(v) => setForm({ ...form, name: v })} />
      <TextInput style={s.input} placeholder="E-mail" placeholderTextColor="#64748b" value={form.email} onChangeText={(v) => setForm({ ...form, email: v })} autoCapitalize="none" keyboardType="email-address" />
      <TextInput style={s.input} placeholder="WhatsApp" placeholderTextColor="#64748b" value={form.phone} onChangeText={(v) => setForm({ ...form, phone: v })} keyboardType="phone-pad" />
      <TextInput style={s.input} placeholder="Senha (mín 6 caracteres)" placeholderTextColor="#64748b" value={form.password} onChangeText={(v) => setForm({ ...form, password: v })} secureTextEntry />
      <TouchableOpacity style={s.btn} onPress={handleRegister} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Criar conta</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}><Text style={s.link}>Já tem conta? Entrar</Text></TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 24, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: "900", color: "#fff", textAlign: "center", marginBottom: 24 },
  roleRow: { flexDirection: "row", gap: 12, marginBottom: 20 },
  roleBtn: { flex: 1, padding: 16, borderRadius: 12, borderWidth: 2, borderColor: COLORS.border, alignItems: "center" },
  roleBtnActive: { borderColor: COLORS.primary, backgroundColor: "rgba(249,115,22,0.1)" },
  roleText: { color: COLORS.textSecondary, fontWeight: "700" },
  roleTextActive: { color: COLORS.primary },
  input: { backgroundColor: COLORS.bgInput, borderRadius: 12, padding: 16, fontSize: 16, color: "#fff", marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  error: { backgroundColor: "#7f1d1d", color: "#fca5a5", padding: 12, borderRadius: 8, marginBottom: 14, fontSize: 14 },
  link: { color: COLORS.textSecondary, textAlign: "center", marginTop: 20, fontSize: 14 },
});
