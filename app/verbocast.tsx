import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Play, Mic, BookOpen, Wand2 } from 'lucide-react-native';
import { useTheme } from '../contexts/ThemeContext';

const mockPodcasts = [
  { id: '1', title: 'El Amor de Dios', book: '1 Juan 4', duration: '12:30', plays: 234 },
  { id: '2', title: 'La Fe que Mueve Montanas', book: 'Mateo 17', duration: '8:45', plays: 189 },
  { id: '3', title: 'Promesas para Hoy', book: 'Salmos 23', duration: '15:20', plays: 412 },
];

export default function VerboCastScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const [activeTab, setActiveTab] = useState<'listen' | 'create'>('listen');
  const [topic, setTopic] = useState('');
  const [script, setScript] = useState('');

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.bg }}>
      <View style={{ paddingHorizontal: 20, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surfaceLow, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
          <ArrowLeft size={22} color={colors.onSurface} />
        </Pressable>
        <Text style={{ fontSize: 20, fontFamily: 'BricolageGrotesque', color: colors.primary }}>VerboCast</Text>
        <View style={{ width: 44 }} />
      </View>

      <View style={{ marginHorizontal: 20, marginBottom: 20, flexDirection: 'row', backgroundColor: colors.surfaceHigh, borderRadius: 12, padding: 4 }}>
        <Pressable
          onPress={() => setActiveTab('listen')}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: activeTab === 'listen' ? colors.surfaceLowest : 'transparent', shadowColor: activeTab === 'listen' ? 'rgba(0,0,0,0.06)' : 'transparent', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: activeTab === 'listen' ? 4 : 0 }}
        >
          <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: activeTab === 'listen' ? colors.primary : colors.onSurfaceVariant }}>Escuchar</Text>
        </Pressable>
        <Pressable
          onPress={() => setActiveTab('create')}
          style={{ flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center', backgroundColor: activeTab === 'create' ? colors.surfaceLowest : 'transparent', shadowColor: activeTab === 'create' ? 'rgba(0,0,0,0.06)' : 'transparent', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: activeTab === 'create' ? 4 : 0 }}
        >
          <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: activeTab === 'create' ? colors.primary : colors.onSurfaceVariant }}>Crear</Text>
        </Pressable>
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}>
        {activeTab === 'listen' ? (
          <>
            <View style={{ backgroundColor: colors.primaryContainer, borderRadius: 16, padding: 20, marginBottom: 20, shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Mic size={20} color={colors.primary} />
                <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.primary, letterSpacing: 1, textTransform: 'uppercase' }}>Podcast destacado</Text>
              </View>
              <Text style={{ fontSize: 24, fontFamily: 'BricolageGrotesque', color: colors.onPrimaryContainer, marginBottom: 4 }}>El Amor de Dios</Text>
              <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onPrimaryContainer, opacity: 0.7, marginBottom: 16 }}>1 Juan 4 - Descubre la profundidad del amor divino</Text>
              <Pressable style={{ backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 24, alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 8, shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 }}>
                <Play size={20} color={colors.onPrimary} />
                <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Reproducir</Text>
              </Pressable>
            </View>

            <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>Explorar</Text>
            {mockPodcasts.map((podcast) => (
              <Pressable
                key={podcast.id}
                style={{ backgroundColor: colors.surfaceLowest, borderRadius: 12, padding: 16, marginBottom: 12, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 }}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface }}>{podcast.title}</Text>
                    <Text style={{ fontSize: 12, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant }}>{podcast.book}</Text>
                    <View style={{ flexDirection: 'row', gap: 16, marginTop: 6 }}>
                      <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>{podcast.duration}</Text>
                      <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant }}>{podcast.plays} reproducciones</Text>
                    </View>
                  </View>
                  <Pressable style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: colors.primary, alignItems: 'center', justifyContent: 'center', shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
                    <Play size={20} color={colors.onPrimary} />
                  </Pressable>
                </View>
              </Pressable>
            ))}
          </>
        ) : (
          <>
            <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 16, padding: 20, marginBottom: 16, shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 1, shadowRadius: 0, elevation: 8 }}>
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurface, marginBottom: 12 }}>Generar podcast con IA</Text>

              <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Tema</Text>
              <TextInput
                value={topic}
                onChangeText={setTopic}
                placeholder="Ej: El fruto del Espiritu"
                placeholderTextColor={colors.onSurfaceVariant}
                style={{ backgroundColor: colors.surfaceHigh, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 12, borderWidth: 2, borderColor: colors.surfaceHighest }}
              />

              <Text style={{ fontSize: 12, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 6, letterSpacing: 1, textTransform: 'uppercase' }}>Guion (opcional)</Text>
              <TextInput
                value={script}
                onChangeText={setScript}
                placeholder="Escribe un guion personalizado..."
                placeholderTextColor={colors.onSurfaceVariant}
                multiline
                numberOfLines={4}
                style={{ backgroundColor: colors.surfaceHigh, borderRadius: 12, padding: 14, fontSize: 16, fontFamily: 'PlusJakartaSans', color: colors.onSurface, marginBottom: 16, minHeight: 100, textAlignVertical: 'top', borderWidth: 2, borderColor: colors.surfaceHighest }}
              />

              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Pressable style={{ flex: 1, backgroundColor: colors.primary, borderRadius: 12, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, shadowColor: colors.primaryShadow, shadowOffset: { width: 0, height: 6 }, shadowOpacity: 1, shadowRadius: 0, elevation: 6 }}>
                  <Wand2 size={20} color={colors.onPrimary} />
                  <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onPrimary }}>Generar</Text>
                </Pressable>
                <Pressable style={{ width: 52, height: 52, borderRadius: 14, backgroundColor: colors.surfaceHigh, alignItems: 'center', justifyContent: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
                  <Mic size={22} color={colors.onSurfaceVariant} />
                </Pressable>
              </View>
            </View>

            <Text style={{ fontSize: 14, fontFamily: 'SpaceGrotesk', color: colors.onSurfaceVariant, marginBottom: 12, letterSpacing: 1, textTransform: 'uppercase' }}>Tus producciones</Text>
            <View style={{ backgroundColor: colors.surfaceLowest, borderRadius: 12, padding: 24, alignItems: 'center', shadowColor: 'rgba(0,0,0,0.06)', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 1, shadowRadius: 0, elevation: 4 }}>
              <BookOpen size={48} color={colors.onSurfaceVariant} />
              <Text style={{ fontSize: 16, fontFamily: 'PlusJakartaSans_700Bold', color: colors.onSurfaceVariant, marginTop: 8 }}>Aun no has creado podcasts</Text>
              <Text style={{ fontSize: 14, fontFamily: 'PlusJakartaSans', color: colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}>Usa el formulario arriba para generar tu primer VerboCast</Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
