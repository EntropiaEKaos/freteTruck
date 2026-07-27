import React, { useEffect, useRef, useState } from "react";
import { View, Text, FlatList, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { messageAPI } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { timeAgo } from "../../utils/formatters";
import { COLORS } from "../../constants/theme";

type Msg = { message: { id: number; senderId: number; content: string; createdAt: string } };

export default function ChatRoomScreen({ route }: any) {
  const { userId, name } = route.params;
  const { user } = useAuth();
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [text, setText] = useState("");
  const [sending, setSending] = useState(false);
  const listRef = useRef<FlatList>(null);

  async function load() {
    try { const r = await messageAPI.messages(userId); setMsgs(r.data.messages || []); } catch {}
  }

  useEffect(() => { load(); const iv = setInterval(load, 5000); return () => clearInterval(iv); }, [userId]);

  async function send() {
    if (!text.trim()) return;
    setSending(true);
    try { await messageAPI.send(userId, text.trim()); setText(""); await load(); } catch {}
    setSending(false);
  }

  return (
    <KeyboardAvoidingView style={s.container} behavior={Platform.OS === "ios" ? "padding" : "height"} keyboardVerticalOffset={90}>
      <View style={s.header}><Text style={s.headerName}>{name}</Text></View>
      <FlatList
        ref={listRef}
        data={msgs}
        keyExtractor={(i) => String(i.message.id)}
        contentContainerStyle={s.list}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => {
          const mine = item.message.senderId === user?.id;
          return (
            <View style={[s.bubble, mine ? s.bubbleMine : s.bubbleOther]}>
              <Text style={[s.bubbleText, mine && { color: "#fff" }]}>{item.message.content}</Text>
              <Text style={[s.bubbleTime, mine && { color: "rgba(255,255,255,0.6)" }]}>{timeAgo(item.message.createdAt)}</Text>
            </View>
          );
        }}
      />
      <View style={s.inputBar}>
        <TextInput style={s.input} placeholder="Mensagem..." placeholderTextColor="#64748b" value={text} onChangeText={setText} onSubmitEditing={send} />
        <TouchableOpacity style={s.sendBtn} onPress={send} disabled={sending || !text.trim()}>
          <Text style={s.sendText}>Enviar</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: 16, paddingTop: 50, backgroundColor: "#0f172a", borderBottomWidth: 1, borderBottomColor: COLORS.border },
  headerName: { color: "#fff", fontSize: 18, fontWeight: "800" },
  list: { padding: 16, paddingBottom: 8 },
  bubble: { maxWidth: "78%", borderRadius: 18, padding: 12, marginBottom: 8 },
  bubbleMine: { backgroundColor: COLORS.primary, alignSelf: "flex-end", borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: COLORS.bgCard, alignSelf: "flex-start", borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  bubbleText: { color: "#fff", fontSize: 15 },
  bubbleTime: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  inputBar: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: COLORS.border, backgroundColor: "#0f172a", gap: 8 },
  input: { flex: 1, backgroundColor: COLORS.bgInput, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 12, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: COLORS.border },
  sendBtn: { backgroundColor: COLORS.primary, borderRadius: 24, paddingHorizontal: 20, justifyContent: "center" },
  sendText: { color: "#fff", fontWeight: "700", fontSize: 15 },
});
