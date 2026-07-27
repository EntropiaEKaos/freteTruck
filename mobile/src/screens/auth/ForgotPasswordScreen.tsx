import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { authAPI } from "../../services/api";
import { COLORS } from "../../constants/theme";

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    if (!email) return;
    setLoading(true);
    try { await authAPI.forgotPassword(email); setSent(true); } catch {}
    setLoading(false);
  }

  if (sent) {
    return (
      <View style={s.container}>
        <Text style={s.title}>E-mail enviado</Text>
        <Text style={s.desc}>Se o e-mail existir, você receberá um link para redefinir sua senha.</Text>
        <TouchableOpacity style={s.btn} onPress={() => navigation.navigate("Login")}><Text style={s.btnText}>Voltar ao login</Text></TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <Text style={s.title}>Esqueceu a senha?</Text>
      <Text style={s.desc}>Informe seu e-mail cadastrado.</Text>
      <TextInput style={s.input} placeholder="seu@email.com" placeholderTextColor="#64748b" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
      <TouchableOpacity style={s.btn} onPress={handleSubmit} disabled={loading}>
        {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.btnText}>Enviar link</Text>}
      </TouchableOpacity>
      <TouchableOpacity onPress={() => navigation.navigate("Login")}><Text style={s.link}>Voltar ao login</Text></TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 24, justifyContent: "center" },
  title: { fontSize: 24, fontWeight: "900", color: "#fff", textAlign: "center" },
  desc: { color: COLORS.textSecondary, textAlign: "center", marginTop: 8, marginBottom: 24 },
  input: { backgroundColor: COLORS.bgInput, borderRadius: 12, padding: 16, fontSize: 16, color: "#fff", marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  btn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 16, alignItems: "center" },
  btnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  link: { color: COLORS.textSecondary, textAlign: "center", marginTop: 20 },
});
