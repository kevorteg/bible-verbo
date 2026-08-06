import { useState } from 'react';
import { View, Text, ScrollView, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MessageCircle, Send } from 'lucide-react-native';
import { useTheme } from '../../contexts/ThemeContext';
import { useChat } from '../../hooks/useChat';

export default function ChatScreen() {
  const { chatMessages, isTyping, sendMessage } = useChat(null);
  const [input, setInput] = useState('');
  const { colors } = useTheme();

  const handleSend = () => {
    if (!input.trim() || isTyping) return;
    sendMessage(input.trim());
    setInput('');
  };

  const quickReplies = ['Romanos 8:28', 'Versiculo del dia', 'Devocional', 'Juan 3:16'];

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 24, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderBottomColor: colors.surfaceHigh }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <MessageCircle size={24} color={colors.primary} />
          <Text style={{ fontSize: 24, fontFamily: 'BricolageGrotesque', color: colors.onSurface }}>Verbo</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
      >
        <ScrollView
          style={{ flex: 1, paddingHorizontal: 24 }}
          contentContainerStyle={{ paddingVertical: 16, gap: 12, paddingBottom: 24 }}
        >
          {chatMessages.map((msg) => (
            <View
              key={msg.id}
              style={{
                alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                maxWidth: '80%',
                backgroundColor: msg.role === 'user' ? colors.primary : colors.surfaceHigh,
                borderRadius: 16,
                padding: 12,
                borderBottomRightRadius: msg.role === 'user' ? 4 : 16,
                borderBottomLeftRadius: msg.role === 'user' ? 16 : 4,
              }}
            >
              <Text style={{
                fontSize: 16,
                fontFamily: 'PlusJakartaSans',
                color: msg.role === 'user' ? colors.onPrimary : colors.onSurface,
              }}>
                {msg.text}
              </Text>
            </View>
          ))}

          {isTyping && (
            <View style={{ alignSelf: 'flex-start', backgroundColor: colors.surfaceHigh, borderRadius: 16, padding: 12, borderBottomLeftRadius: 4 }}>
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>Escribiendo...</Text>
            </View>
          )}

          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8, marginBottom: 8 }}>
            {quickReplies.map((qr) => (
              <Pressable
                key={qr}
                style={{ backgroundColor: colors.surfaceLow, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 8, borderWidth: 2, borderColor: colors.outlineVariant }}
                onPress={() => setInput(qr)}
              >
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurface }}>{qr}</Text>
              </Pressable>
            ))}
          </View>
        </ScrollView>

        <View style={{ paddingHorizontal: 24, paddingTop: 12, paddingBottom: 88, borderTopWidth: 1, borderTopColor: colors.surfaceHigh, backgroundColor: colors.bg }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <TextInput
              style={{
                flex: 1,
                height: 48,
                backgroundColor: colors.surfaceLow,
                borderRadius: 24,
                paddingHorizontal: 16,
                fontSize: 16,
                fontFamily: 'PlusJakartaSans',
                color: colors.onSurface,
              }}
              placeholder="Escribe un mensaje..."
              placeholderTextColor={colors.onSurfaceVariant}
              value={input}
              onChangeText={setInput}
              onSubmitEditing={handleSend}
              returnKeyType="send"
            />
            <Pressable
              onPress={handleSend}
              disabled={isTyping}
              style={{
                width: 48, height: 48, borderRadius: 24,
                backgroundColor: isTyping ? colors.surfaceHigh : colors.primary,
                alignItems: 'center', justifyContent: 'center',
                shadowColor: colors.primaryShadow,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 1, shadowRadius: 0, elevation: 4,
              }}
            >
              <Send size={20} color={isTyping ? colors.onSurfaceVariant : colors.onPrimary} />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
