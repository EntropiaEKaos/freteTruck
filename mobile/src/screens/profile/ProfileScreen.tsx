import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from "react-native";
import { useAuth } from "../../hooks/useAuth";
import { COLORS } from "../../constants/theme";

export default function ProfileScreen({ navigation }: any) {
  const { user, logout } = useAuth();

  async function handleLogout() {
    Alert.alert("Sair", "Deseja sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      { text: "Sair", style: "destructive", onPress: logout },
    ]);
  }

  if (!user) return null;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll}>
      <View style={s.avatarCircle}><Text style={s.avatarText}>{user.name.charAt(0).toUpperCase()}</Text></View>
      <Text style={s.name}>{user.name}</Text>
      <Text style={s.role}>{user.role === "motorista" ? "Motorista" : user.role === "admin" ? "Administrador" : "Embarcador"}</Text>
      <Text style={s.email}>{user.email}</Text>

      <View style={s.menuSection}>
        {[
          { label: "Meu Painel", screen: "MainTabs" },
          { label: "Carteira de Trucks", screen: "Trucks" },
          { label: "Analytics", screen: "Analytics" },
        ].map((item) => (
          <TouchableOpacity key={item.label} style={s.menuItem} onPress={() => navigation.navigate(item.screen)}>
            <Text style={s.menuText}>{item.label}</Text>
            <Text style={s.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity style={s.logoutBtn} onPress={handleLogout}>
        <Text style={s.logoutText}>Sair da conta</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  scroll: { padding: 24, paddingTop: 80, alignItems: "center" },
  avatarCircle: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primary, justifyContent: "center", alignItems: "center" },
  avatarText: { color: "#fff", fontSize: 36, fontWeight: "900" },
  name: { color: "#fff", fontSize: 24, fontWeight: "800", marginTop: 16 },
  role: { color: COLORS.primary, fontSize: 14, fontWeight: "700", marginTop: 4 },
  email: { color: COLORS.textSecondary, fontSize: 14, marginTop: 4 },
  menuSection: { width: "100%", marginTop: 32 },
  menuItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", backgroundColor: COLORS.bgCard, borderRadius: 14, padding: 18, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  menuText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  menuArrow: { color: COLORS.textMuted, fontSize: 24 },
  logoutBtn: { marginTop: 24, backgroundColor: "#7f1d1d", borderRadius: 14, padding: 16, width: "100%", alignItems: "center" },
  logoutText: { color: "#fca5a5", fontSize: 16, fontWeight: "700" },
});
