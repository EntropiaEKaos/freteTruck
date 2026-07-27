import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, Linking, TextInput, ActivityIndicator } from "react-native";
import { freightAPI, proposalAPI } from "../../services/api";
import { formatBRL, formatWeight, timeAgo } from "../../utils/formatters";
import { COLORS } from "../../constants/theme";

export default function FreightDetailScreen({ route, navigation }: any) {
  const { id } = route.params;
  const [freight, setFreight] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showProposal, setShowProposal] = useState(false);
  const [amount, setAmount] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    freightAPI.detail(id).then((r) => { setFreight(r.data); setLoading(false); }).catch(() => setLoading(false));
  }, [id]);

  async function sendProposal() {
    setSending(true);
    try {
      await proposalAPI.create({ freightId: id, amount: amount || null, message });
      setShowProposal(false);
      setAmount("");
      setMessage("");
      alert("Proposta enviada com sucesso!");
    } catch (e: any) {
      alert(e.response?.data?.error || "Erro ao enviar proposta.");
    }
    setSending(false);
  }

  function openWhatsApp() {
    if (!freight?.freight) return;
    const f = freight.freight;
    const phone = f.contactPhone.startsWith("55") ? f.contactPhone : `55${f.contactPhone}`;
    const text = encodeURIComponent(`Olá! Vi seu frete no FreteTruck: ${f.cargoType} de ${f.originCity}/${f.originState} para ${f.destCity}/${f.destState}. Ainda está disponível?`);
    Linking.openURL(`https://wa.me/${phone}?text=${text}`);
  }

  if (loading) return <View style={s.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>;
  if (!freight) return <View style={s.center}><Text style={s.notFound}>Frete não encontrado</Text></View>;

  const f = freight.freight;
  const price = !f.price ? "A combinar" : f.priceType === "tonelada" ? `${formatBRL(f.price)}/ton` : formatBRL(f.price);

  return (
    <ScrollView style={s.container}>
      {/* Route header */}
      <View style={s.header}>
        <Text style={s.route}>{f.originCity}/{f.originState} → {f.destCity}/{f.destState}</Text>
        <Text style={s.cargo}>{f.cargoType}</Text>
        <Text style={s.price}>{price}</Text>
        {f.distanceKm && <Text style={s.info}>{f.distanceKm} km · {formatWeight(f.weightKg)}</Text>}
      </View>

      {/* Details */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Detalhes da carga</Text>
        <Row label="Tipo de carga" value={f.cargoType} />
        <Row label="Peso" value={formatWeight(f.weightKg)} />
        {f.distanceKm && <Row label="Distância" value={`${f.distanceKm} km`} />}
        <Row label="Rastreador" value={f.needsTracker ? "Obrigatório" : "Não exigido"} />
        <Row label="Lona" value={f.needsTarp ? "Obrigatória" : "Não exigida"} />
        <Row label="Pedágio" value={f.toll ? "Incluso" : "Não incluso"} />
      </View>

      <View style={s.card}>
        <Text style={s.cardTitle}>Veículos aceitos</Text>
        <View style={s.tags}>{f.vehicleTypes.split(",").map((v: string) => <Text key={v} style={s.tag}>{v}</Text>)}</View>
        <Text style={[s.cardTitle, { marginTop: 16 }]}>Carrocerias</Text>
        <View style={s.tags}>{f.bodyTypes.split(",").map((b: string) => <Text key={b} style={s.tagBlue}>{b}</Text>)}</View>
      </View>

      {f.description && (
        <View style={s.card}>
          <Text style={s.cardTitle}>Observações</Text>
          <Text style={s.desc}>{f.description}</Text>
        </View>
      )}

      {/* Contact */}
      <View style={s.card}>
        <Text style={s.cardTitle}>Contato: {f.contactName}</Text>
        <TouchableOpacity style={s.whatsappBtn} onPress={openWhatsApp}>
          <Text style={s.whatsappText}>Negociar pelo WhatsApp</Text>
        </TouchableOpacity>

        {!showProposal ? (
          <TouchableOpacity style={s.proposalBtn} onPress={() => setShowProposal(true)}>
            <Text style={s.proposalBtnText}>Enviar proposta online</Text>
          </TouchableOpacity>
        ) : (
          <View style={s.proposalForm}>
            <TextInput style={s.input} placeholder="Seu valor (R$) - opcional" placeholderTextColor="#64748b" value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <TextInput style={[s.input, { height: 80 }]} placeholder="Mensagem para o embarcador..." placeholderTextColor="#64748b" value={message} onChangeText={setMessage} multiline />
            <TouchableOpacity style={s.sendBtn} onPress={sendProposal} disabled={sending}>
              {sending ? <ActivityIndicator color="#fff" /> : <Text style={s.sendBtnText}>Enviar proposta</Text>}
            </TouchableOpacity>
          </View>
        )}
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.rowLabel}>{label}</Text>
      <Text style={s.rowValue}>{value}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },
  notFound: { color: COLORS.textSecondary, fontSize: 16 },
  header: { backgroundColor: "#0f172a", padding: 20, paddingTop: 60 },
  route: { fontSize: 24, fontWeight: "900", color: "#fff" },
  cargo: { color: COLORS.textSecondary, marginTop: 4 },
  price: { fontSize: 28, fontWeight: "900", color: COLORS.success, marginTop: 8 },
  info: { color: COLORS.textSecondary, marginTop: 4, fontSize: 14 },
  card: { margin: 16, marginBottom: 0, backgroundColor: COLORS.bgCard, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 16, fontWeight: "800", color: "#fff", marginBottom: 12 },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: "#1e293b" },
  rowLabel: { color: COLORS.textSecondary, fontSize: 14 },
  rowValue: { color: "#fff", fontSize: 14, fontWeight: "600" },
  tags: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: { backgroundColor: "rgba(249,115,22,0.1)", color: COLORS.primary, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, fontSize: 13, fontWeight: "600" },
  tagBlue: { backgroundColor: "rgba(59,130,246,0.1)", color: "#60a5fa", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, fontSize: 13, fontWeight: "600" },
  desc: { color: COLORS.textSecondary, fontSize: 14, lineHeight: 22 },
  whatsappBtn: { backgroundColor: COLORS.success, borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8 },
  whatsappText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  proposalBtn: { backgroundColor: "#0f172a", borderRadius: 12, padding: 16, alignItems: "center", marginTop: 8, borderWidth: 1, borderColor: COLORS.border },
  proposalBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  proposalForm: { marginTop: 12 },
  input: { backgroundColor: COLORS.bg, borderRadius: 12, padding: 14, fontSize: 15, color: "#fff", marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  sendBtn: { backgroundColor: COLORS.primary, borderRadius: 12, padding: 14, alignItems: "center" },
  sendBtnText: { color: "#fff", fontSize: 15, fontWeight: "700" },
});
