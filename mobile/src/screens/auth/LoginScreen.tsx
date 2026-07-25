import React, { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView
} from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { Link } from "expo-router";

export default function LoginScreen() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (e: any) {
      setError(e.response?.data?.error || "Erro ao entrar.");
    }
    setLoading(false);
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.logo}><Text style={styles.logoOrange}>Frete</Text>Truck</Text>
          <Text style={styles.subtitle}>Entre na sua conta</Text>
        </View>

        <View style={styles.form}>
          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Text style={styles.label}>E-mail</Text>
          <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="seu@email.com" autoCapitalize="none" keyboardType="email-address" />

          <Text style={styles.label}>Senha</Text>
          <TextInput style={styles.input} value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry />

          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.buttonText}>Entrar</Text>}
          </TouchableOpacity>

          <Link href="/esqueci-senha" asChild>
            <TouchableOpacity><Text style={styles.link}>Esqueceu a senha?</Text></TouchableOpacity>
          </Link>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Não tem conta? </Text>
            <Link href="/cadastro" asChild>
              <TouchableOpacity><Text style={styles.linkOrange}>Cadastre-se grátis</Text></TouchableOpacity>
            </Link>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0f172a" },
  scroll: { flexGrow: 1, justifyContent: "center", padding: 24 },
  header: { alignItems: "center", marginBottom: 40 },
  logo: { fontSize: 36, fontWeight: "900", color: "#fff" },
  logoOrange: { color: "#f97316" },
  subtitle: { fontSize: 16, color: "#94a3b8", marginTop: 8 },
  form: { width: "100%", maxWidth: 400, alignSelf: "center" },
  label: { fontSize: 12, fontWeight: "700", color: "#94a3b8", marginBottom: 6, textTransform: "uppercase" },
  input: { backgroundColor: "#1e293b", borderRadius: 12, padding: 16, fontSize: 16, color: "#fff", marginBottom: 16, borderWidth: 1, borderColor: "#334155" },
  button: { backgroundColor: "#f97316", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  error: { backgroundColor: "#7f1d1d", color: "#fca5a5", padding: 12, borderRadius: 8, marginBottom: 16, fontSize: 14 },
  link: { color: "#94a3b8", textAlign: "center", marginTop: 16, fontSize: 14 },
  footer: { flexDirection: "row", justifyContent: "center", marginTop: 32 },
  footerText: { color: "#94a3b8", fontSize: 14 },
  linkOrange: { color: "#f97316", fontWeight: "700", fontSize: 14 },
});
